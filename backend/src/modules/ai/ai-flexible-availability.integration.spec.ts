import {
  AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS,
  AVAILABILITY_WINDOW_PARSE_SCENARIOS,
  FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES,
  SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS,
} from './ai-flexible-availability.fixtures.js';
import { enrichAvailabilityWindowsFromPrompt } from './ai-flexible-availability.util.js';
import {
  resolvePublicAvailabilityDateKeys,
  resolvePublicAvailabilityWindows,
} from './ai-orchestration.helpers.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-assistant.service.js';

describe('ai flexible availability classifier wiring (avail-1.2)', () => {
  it('includes availabilityWindows rules and param in public and customer schemas', () => {
    const publicSchema = buildPublicClassifierSchema();
    const customerSchema = buildCustomerClassifierSchema();
    const sampleRule = FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES.slice(0, 80);

    expect(publicSchema).toContain('"availabilityWindows"');
    expect(customerSchema).toContain('"availabilityWindows"');
    expect(publicSchema).toContain(sampleRule);
    expect(customerSchema).toContain(sampleRule);
    expect(publicSchema).toContain(
      'I want a haircut tomorrow evening or Friday afternoon',
    );
    expect(customerSchema).toContain(
      'I want a haircut tomorrow evening or Friday afternoon',
    );
    expect(publicSchema).toContain('Monday and Friday afternoon');
    expect(customerSchema).toContain('Monday and Friday afternoon');
    expect(publicSchema).toContain('AND vs OR');
    expect(customerSchema).toContain('AND vs OR');
  });

  it('documents OR window semantics in classifier rules', () => {
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'availabilityWindows',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'check_availability',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'bookingFirstAvailable=true',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain('maxPrice');
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'NOT gift card balance as maxPrice',
    );
  });

  it('maps canonical OR prompts to availabilityWindows examples', () => {
    for (const scenario of AVAILABILITY_WINDOW_PARSE_SCENARIOS) {
      expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
        scenario.prompt,
      );
    }
  });

  it('embeds SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS canonical rows in schemas', () => {
    const publicSchema = buildPublicClassifierSchema();
    const canonical = SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.find(
      (scenario) => scenario.id === 'avail-or-tomorrow-friday-en',
    );
    expect(canonical).toBeDefined();
    expect(publicSchema).toContain(canonical!.prompt);
    expect(SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS.length).toBeGreaterThanOrEqual(
      20,
    );
  });
});

describe('ai flexible availability post-LLM enrichment (avail-1.3)', () => {
  it.each(AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS)(
    'enrichAvailabilityWindowsFromPrompt $id',
    ({ prompt, params, expectedParams }) => {
      expect(enrichAvailabilityWindowsFromPrompt(params, prompt)).toEqual(
        expectedParams,
      );
    },
  );

  it('enrichPublicAssistantParamsFromPrompt splits OR windows on check_availability', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'I want a haircut tomorrow evening or Friday afternoon',
      {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      [{ id: 'h1', name: 'Haircut' }],
      'check_availability',
    );
    expect(enriched.availabilityWindows).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    expect(enriched.timeOfDay).toBeUndefined();
    expect(enriched.date).toBeUndefined();
  });

  it('enrichPublicAssistantParamsFromPrompt keeps AND weekdays on check_availability', () => {
    const enriched = enrichPublicAssistantParamsFromPrompt(
      'Monday and Friday afternoon for color',
      {
        serviceCategory: 'color',
        weekdays: ['monday', 'friday'],
        timeOfDay: 'afternoon',
      },
      [{ id: 'c1', name: 'Color' }],
      'check_availability',
    );
    expect(enriched.availabilityWindows).toBeUndefined();
    expect(enriched.weekdays).toEqual(['monday', 'friday']);
    expect(enriched.timeOfDay).toBe('afternoon');
  });
});

describe('ai flexible availability per-window date keys (avail-1.4)', () => {
  it('resolvePublicAvailabilityWindows pairs OR clauses after enrichment', () => {
    const params = enrichAvailabilityWindowsFromPrompt(
      {
        serviceCategory: 'haircut',
        date: 'tomorrow',
        timeOfDay: 'evening',
      },
      'I want a haircut tomorrow evening or Friday afternoon',
    );

    const windows = resolvePublicAvailabilityWindows(params, undefined, 'UTC', {
      defaultScanDays: 14,
    });

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      timeOfDay: 'evening',
    });
    expect(windows[0]?.dateKeys).toHaveLength(1);
    expect(windows[1]).toMatchObject({
      timeOfDay: 'afternoon',
    });
    for (const dateKey of windows[1]!.dateKeys) {
      expect(new Date(`${dateKey}T12:00:00.000Z`).getUTCDay()).toBe(5);
    }
  });

  it('resolvePublicAvailabilityDateKeys returns deduped union across windows', () => {
    const params = enrichAvailabilityWindowsFromPrompt(
      { serviceCategory: 'haircut' },
      'I want a haircut tomorrow evening or Friday afternoon',
    );
    const windows = resolvePublicAvailabilityWindows(params, undefined, 'UTC', {
      defaultScanDays: 14,
    });
    const flattened = resolvePublicAvailabilityDateKeys(params, undefined, 'UTC', {
      defaultScanDays: 14,
    });

    expect(flattened).toEqual([
      ...new Set(windows.flatMap((window) => window.dateKeys)),
    ]);
  });
});
