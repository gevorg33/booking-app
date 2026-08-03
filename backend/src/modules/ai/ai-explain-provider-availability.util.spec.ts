import { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS } from './ai-explain-provider-availability-multilingual.fixtures.js';
import {
  EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS,
  EXPLAIN_PROVIDER_AVAILABILITY_RESCUE_SCENARIOS,
} from './ai-explain-provider-availability.fixtures.js';
import {
  detectExplainProviderAvailabilityAction,
  enrichExplainProviderAvailabilityParamsFromPrompt,
  extractProviderNameForAvailabilityPrompt,
  hasProviderAvailabilityDayCue,
  inferProviderAvailabilityAspect,
  isExplainProviderAvailabilityIntent,
  isExplainProviderAvailabilityPrompt,
  parseExplainProviderAvailabilityFromPrompt,
  rescueExplainProviderAvailabilityIntent,
} from './ai-explain-provider-availability.util.js';

describe('ai-explain-provider-availability.util (ai-cmd-customer-4.11.3)', () => {
  it.each(EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS)(
    'detects explain provider availability prompt for $id',
    ({ prompt, aspect, employeeName }) => {
      expect(isExplainProviderAvailabilityPrompt(prompt)).toBe(true);
      const parsed = parseExplainProviderAvailabilityFromPrompt(prompt);
      expect(parsed?.aspect).toBe(aspect);
      if (employeeName) expect(parsed?.employeeName).toBe(employeeName);
    },
  );

  it.each(EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS)(
    'detects multilingual explain provider availability prompt for $id',
    ({ prompt, aspect }) => {
      expect(isExplainProviderAvailabilityPrompt(prompt)).toBe(true);
      expect(parseExplainProviderAvailabilityFromPrompt(prompt)?.aspect).toBe(
        aspect,
      );
    },
  );

  it.each(EXPLAIN_PROVIDER_AVAILABILITY_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainProviderAvailabilityIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('explain_provider_availability');
    },
  );

  it('does not steal find soonest prompts', () => {
    expect(
      isExplainProviderAvailabilityPrompt("Who's free soonest for a trim?"),
    ).toBe(false);
  });

  it('does not steal plain availability slot prompts', () => {
    expect(
      isExplainProviderAvailabilityPrompt('free slots on Monday for Gevorg'),
    ).toBe(false);
    expect(
      isExplainProviderAvailabilityPrompt(
        'availability for Swedish massage tomorrow',
      ),
    ).toBe(false);
  });

  it('e2e-bug.194 — named “availability for” still explains schedule', () => {
    const prompt =
      'Explain Gevorg availability for Swedish massage next Tuesday';
    expect(isExplainProviderAvailabilityPrompt(prompt)).toBe(true);
    expect(parseExplainProviderAvailabilityFromPrompt(prompt)).toMatchObject({
      aspect: 'named_schedule',
      employeeName: 'Gevorg',
    });
    expect(
      enrichExplainProviderAvailabilityParamsFromPrompt({}, prompt),
    ).toMatchObject({
      employeeName: 'Gevorg',
      allProviders: false,
      aspect: 'named_schedule',
      serviceName: expect.stringMatching(/swedish/i),
    });
  });

  it('does not steal booking prompts', () => {
    expect(
      isExplainProviderAvailabilityPrompt('Book Marco tomorrow at 3pm'),
    ).toBe(false);
  });

  it('extracts provider name for schedule questions', () => {
    expect(
      extractProviderNameForAvailabilityPrompt('Is Marco working Saturday?'),
    ).toBe('Marco');
  });

  it('infers aspects and enriches params', () => {
    expect(inferProviderAvailabilityAspect('Who has openings tomorrow?')).toBe(
      'team_openings',
    );
    expect(
      enrichExplainProviderAvailabilityParamsFromPrompt(
        {},
        'Who has openings tomorrow?',
      ),
    ).toMatchObject({ allProviders: true, aspect: 'team_openings' });
    expect(
      enrichExplainProviderAvailabilityParamsFromPrompt(
        {},
        'Is Marco working Saturday?',
      ),
    ).toMatchObject({
      employeeName: 'Marco',
      allProviders: false,
      aspect: 'named_schedule',
    });
  });

  it('detects action and intent id', () => {
    expect(
      detectExplainProviderAvailabilityAction('Does Anna work tomorrow?'),
    ).toBe('explain_provider_availability');
    expect(
      isExplainProviderAvailabilityIntent('explain_provider_availability'),
    ).toBe(true);
  });

  it('detects generic named schedule without fixture match', () => {
    expect(
      isExplainProviderAvailabilityPrompt('Does Zoe work on Thursday?'),
    ).toBe(true);
    expect(hasProviderAvailabilityDayCue('Does Zoe work on Thursday?')).toBe(
      true,
    );
  });

  it('blocks specialty read combined with schedule wording', () => {
    expect(
      isExplainProviderAvailabilityPrompt(
        'Who specializes in color on Friday?',
      ),
    ).toBe(false);
  });

  it('e2e-bug.190 — does not steal open-times check_availability browse', () => {
    expect(
      rescueExplainProviderAvailabilityIntent(
        'check availability for Swedish massage tomorrow',
        'check_availability',
      ),
    ).toBeNull();
    expect(
      rescueExplainProviderAvailabilityIntent(
        'What times are available for Swedish massage tomorrow?',
        'check_availability',
      ),
    ).toBeNull();
    expect(
      rescueExplainProviderAvailabilityIntent(
        'Is Gevorg available for Swedish massage next Tuesday?',
        'check_availability',
      ),
    ).toBeNull();
  });
});
