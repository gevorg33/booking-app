import {
  AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS,
  AVAILABILITY_WINDOW_NORMALIZE_SCENARIOS,
  AVAILABILITY_WINDOW_PARSE_SCENARIOS,
  AVAILABILITY_WINDOW_SINGLE_SCENARIOS,
  FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES,
  FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS,
  FLEXIBLE_AVAILABILITY_NEAREST_WINDOW_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  clauseHasAvailabilityCue,
  enrichAvailabilitySessionAppendFromPrompt,
  enrichAvailabilitySessionDropFromPrompt,
  enrichAvailabilityWindowsFromPrompt,
  enrichFlexibleAvailabilityServiceCategoryFromPrompt,
  enrichFlexibleAvailabilitySameProviderFromPrompt,
  enrichFlexibleAvailabilitySingleWindowFromPrompt,
  hasAvailabilityOrPattern,
  isSameProviderAcrossWindowsPrompt,
  isFlexibleAvailabilityAnyProviderPrompt,
  isAvailabilityAndWeekdaysPattern,
  isAvailabilitySessionAppendPrompt,
  isAvailabilitySessionDropPrompt,
  normalizeAvailabilityWindows,
  parseAvailabilityEarliestTimeFromText,
  parseAvailabilityWindowClause,
  parseAvailabilityWindowsFromPrompt,
  pickEarliestSlotAcrossWindows,
  scanWindowsForSlots,
  splitAvailabilityOrClauses,
} from './ai-flexible-availability.util.js';

describe('ai-flexible-availability.fixtures (avail-1.2)', () => {
  it('ships classifier rules with availabilityWindows semantics', () => {
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'availabilityWindows',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain(
      'check_availability',
    );
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain('timeOfDay');
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain('timeSlot');
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain('employeeName');
    expect(FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES).toContain('AND vs OR');
  });
});

describe('ai-flexible-availability.util OR detection (avail-1.1)', () => {
  it.each([
    {
      prompt: 'I want a haircut tomorrow evening or Friday afternoon',
      expected: true,
    },
    {
      prompt: 'Massage Monday morning or Wednesday morning',
      expected: true,
    },
    {
      prompt: 'Facial tomorrow, Friday afternoon, or Saturday morning',
      expected: true,
    },
    {
      prompt: 'Either Monday morning or Wednesday morning for color',
      expected: true,
    },
    {
      prompt: 'Monday and Friday afternoon for color',
      expected: false,
    },
    {
      prompt: "Who's free tomorrow evening for massage?",
      expected: false,
    },
    {
      prompt: 'Massage under $80 tomorrow or Thursday evening',
      expected: true,
    },
    {
      prompt: '$50 gift card, haircut tomorrow or Friday',
      expected: false,
    },
    {
      prompt: 'Who is free tomorrow or Friday for massage?',
      expected: true,
    },
  ])('hasAvailabilityOrPattern($prompt) → $expected', ({ prompt, expected }) => {
    expect(hasAvailabilityOrPattern(prompt)).toBe(expected);
    expect(isAvailabilityAndWeekdaysPattern(prompt)).toBe(
      prompt === 'Monday and Friday afternoon for color',
    );
  });

  it('splits comma and or separators into clauses', () => {
    expect(
      splitAvailabilityOrClauses(
        'Facial tomorrow, Friday afternoon, or Saturday morning',
      ),
    ).toEqual(['tomorrow', 'Friday afternoon', 'Saturday morning']);
  });

  it('strips leading intent prefixes from the first clause', () => {
    expect(
      splitAvailabilityOrClauses(
        'I want a haircut tomorrow evening or Friday afternoon',
      ),
    ).toEqual(['tomorrow evening', 'Friday afternoon']);
  });

  it('requires availability cues in every OR clause', () => {
    expect(clauseHasAvailabilityCue('Friday afternoon')).toBe(true);
    expect(clauseHasAvailabilityCue('premium spa package')).toBe(false);
  });
});

describe('parseAvailabilityWindowsFromPrompt (avail-1.1)', () => {
  it.each(AVAILABILITY_WINDOW_PARSE_SCENARIOS)(
    'parses $id',
    ({ prompt, expectedWindows }) => {
      expect(parseAvailabilityWindowsFromPrompt(prompt)).toEqual(expectedWindows);
    },
  );

  it.each(AVAILABILITY_WINDOW_SINGLE_SCENARIOS)(
    'returns null for single-window prompt $id',
    ({ prompt }) => {
      expect(parseAvailabilityWindowsFromPrompt(prompt)).toBeNull();
      expect(hasAvailabilityOrPattern(prompt)).toBe(false);
    },
  );

  it('parses colloquial after-work earliest time per OR window', () => {
    expect(parseAvailabilityEarliestTimeFromText('after 5')).toBe('17:00');
    expect(parseAvailabilityEarliestTimeFromText('after 16:00')).toBe('16:00');
    expect(parseAvailabilityEarliestTimeFromText('after work')).toBe('17:00');
    expect(
      parseAvailabilityWindowsFromPrompt('Facial after 5 tomorrow or Friday'),
    ).toEqual([
      { date: 'tomorrow', timeFrom: '17:00' },
      { weekdays: ['friday'], timeFrom: '17:00' },
    ]);
  });

  it('parses voice ASAP OR with fallback Saturday afternoon window', () => {
    expect(
      parseAvailabilityWindowsFromPrompt('Lashes ASAP or Saturday if not'),
    ).toEqual([
      { date: 'tomorrow' },
      { weekdays: ['saturday'], timeOfDay: 'afternoon' },
    ]);
  });

  it('parses consumer chip evening or weekend OR windows', () => {
    expect(
      parseAvailabilityWindowsFromPrompt(
        'Evening or weekend slots for a facial',
      ),
    ).toEqual([
      { timeOfDay: 'evening' },
      { weekdays: ['saturday', 'sunday'] },
    ]);
  });

  it('parses lunch OR windows with narrow afternoon bounds', () => {
    expect(
      parseAvailabilityWindowsFromPrompt(
        'Manicure tomorrow lunch or Friday lunch',
      ),
    ).toEqual([
      {
        date: 'tomorrow',
        timeOfDay: 'afternoon',
        timeFrom: '12:00',
        timeTo: '14:00',
      },
      {
        weekdays: ['friday'],
        timeOfDay: 'afternoon',
        timeFrom: '12:00',
        timeTo: '14:00',
      },
    ]);
  });

  it('parses abbreviated mobile phrasing per clause', () => {
    expect(parseAvailabilityWindowClause('tomorrow eve')).toEqual({
      date: 'tomorrow',
      timeOfDay: 'evening',
    });
    expect(parseAvailabilityWindowClause('fri afternoon')).toEqual({
      weekdays: ['friday'],
      timeOfDay: 'afternoon',
    });
  });

  it('parses imperative PM/AM shorthand per OR window (avail-imperative-en)', () => {
    expect(
      parseAvailabilityWindowsFromPrompt('Need massage tomorrow PM or Sun AM'),
    ).toEqual([
      { date: 'tomorrow', timeOfDay: 'afternoon' },
      { weekdays: ['sunday'], timeOfDay: 'morning' },
    ]);
  });
});

describe('availability session append (avail-session-add-window-en)', () => {
  it('detects follow-up append prompts', () => {
    expect(isAvailabilitySessionAppendPrompt('or Friday afternoon works too')).toBe(
      true,
    );
    expect(
      isAvailabilitySessionAppendPrompt('I want a haircut tomorrow evening'),
    ).toBe(false);
  });

  it('appends a second window onto session availabilityWindows', () => {
    const turn1 = enrichDiscoveryParamsFromPrompt(
      {},
      'I want a haircut tomorrow evening',
    );
    expect(turn1).toMatchObject({
      serviceCategory: 'haircut',
      date: 'tomorrow',
      timeOfDay: 'evening',
    });

    const merged = enrichAvailabilitySessionAppendFromPrompt(
      turn1,
      'or Friday afternoon works too',
    );
    expect(merged.availabilityWindows).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    expect(merged.date).toBeUndefined();
    expect(merged.timeOfDay).toBeUndefined();
  });
});

describe('availability session drop (avail-session-drop-window-en)', () => {
  it('detects follow-up drop prompts', () => {
    expect(isAvailabilitySessionDropPrompt('Friday only')).toBe(true);
    expect(
      isAvailabilitySessionDropPrompt('Haircut tomorrow or Friday afternoon'),
    ).toBe(false);
  });

  it('replaces session OR windows with a single narrowed window', () => {
    const turn1 = enrichDiscoveryParamsFromPrompt(
      {},
      'Haircut tomorrow or Friday afternoon',
    );
    expect(turn1.availabilityWindows).toEqual([
      { date: 'tomorrow' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);

    const merged = enrichAvailabilitySessionDropFromPrompt(turn1, 'Friday only');
    expect(merged.availabilityWindows).toMatchObject([
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
  });
});

describe('provider preference OR windows (section L)', () => {
  it('avail-or-any-provider-en parses OR windows and sets allProviders', () => {
    const prompt =
      'Any stylist tomorrow evening or Friday afternoon for a haircut';
    expect(isFlexibleAvailabilityAnyProviderPrompt(prompt)).toBe(true);
    expect(parseAvailabilityWindowsFromPrompt(prompt)).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    expect(enrichDiscoveryParamsFromPrompt({}, prompt)).toMatchObject({
      serviceCategory: 'haircut',
      allProviders: true,
      availabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
  });

  it('discover-provider-budget-or-en parses provider lead with budget and OR windows', () => {
    const prompt = 'Karo or anyone — haircut under $50 tomorrow eve or Fri PM';
    expect(parseAvailabilityWindowsFromPrompt(prompt)).toEqual([
      { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    const enriched = enrichDiscoveryParamsFromPrompt(
      { serviceCategory: 'haircut' },
      prompt,
    );
    expect(enriched).toMatchObject({
      serviceCategory: 'haircut',
      maxPrice: 50,
      availabilityWindows: [
        { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
    expect(enriched.employeeName).toBeUndefined();
  });

  it('avail-or-named-fallback-en parses named window A and anyone fallback B', () => {
    const prompt = 'Karo tomorrow evening or anyone Friday afternoon for massage';
    expect(parseAvailabilityWindowsFromPrompt(prompt)).toEqual([
      { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    const enriched = enrichDiscoveryParamsFromPrompt({}, prompt);
    expect(enriched).toMatchObject({
      serviceCategory: 'massage',
      availabilityWindows: [
        { employeeName: 'Karo', date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
    expect(enriched.allProviders).toBeUndefined();
  });

  it('avail-or-same-provider-en parses OR windows and sets sameProviderAcrossWindows', () => {
    const prompt = 'Same person tomorrow or Friday afternoon for color';
    expect(isSameProviderAcrossWindowsPrompt(prompt)).toBe(true);
    expect(parseAvailabilityWindowsFromPrompt(prompt)).toEqual([
      { date: 'tomorrow' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    const enriched = enrichDiscoveryParamsFromPrompt({}, prompt);
    expect(enriched).toMatchObject({
      serviceCategory: 'color',
      sameProviderAcrossWindows: true,
      availabilityWindows: [
        { date: 'tomorrow' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
    expect(enriched.allProviders).toBeUndefined();
    expect(
      enrichFlexibleAvailabilitySameProviderFromPrompt(prompt, {
        serviceCategory: 'color',
        employeeName: 'Alice',
      }),
    ).toMatchObject({
      serviceCategory: 'color',
      employeeName: 'Alice',
      sameProviderAcrossWindows: true,
    });
  });

  it('avail-neither-window-en parses OR windows for all-empty handler outcome', () => {
    const prompt = 'I want a haircut tomorrow evening or Friday afternoon';
    expect(parseAvailabilityWindowsFromPrompt(prompt)).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    expect(enrichDiscoveryParamsFromPrompt({}, prompt)).toMatchObject({
      serviceCategory: 'haircut',
      availabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
  });

  it('avail-partial-one-window-en parses tomorrow evening + Saturday afternoon', () => {
    const prompt = 'Facial tomorrow evening or Saturday afternoon';
    expect(parseAvailabilityWindowsFromPrompt(prompt)).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['saturday'], timeOfDay: 'afternoon' },
    ]);
    expect(enrichDiscoveryParamsFromPrompt({}, prompt)).toMatchObject({
      serviceCategory: 'facial',
      availabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['saturday'], timeOfDay: 'afternoon' },
      ],
    });
  });

  it('avail-budget-blocks-all-en parses OR windows after stripping outcome suffix', () => {
    const prompt =
      'Haircut tomorrow evening or Friday afternoon under $50 — nothing open in either window';
    expect(parseAvailabilityWindowsFromPrompt(prompt)).toEqual([
      { date: 'tomorrow', timeOfDay: 'evening' },
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
    ]);
    expect(enrichDiscoveryParamsFromPrompt({}, prompt)).toMatchObject({
      serviceCategory: 'haircut',
      maxPrice: 50,
      availabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
  });
});

describe('availability session after-budget (avail-session-after-budget-en)', () => {
  it('carries maxPrice and parses OR windows from budget follow-up', () => {
    const turn1 = enrichDiscoveryParamsFromPrompt({}, 'Show haircuts under $50');
    expect(turn1).toMatchObject({
      serviceCategory: 'haircut',
      maxPrice: 50,
    });

    const merged = enrichDiscoveryParamsFromPrompt(
      turn1,
      'Check tomorrow evening or Friday afternoon for those',
    );
    expect(merged).toMatchObject({
      serviceCategory: 'haircut',
      maxPrice: 50,
      availabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    });
  });
});

describe('normalizeAvailabilityWindows (avail-1.1)', () => {
  it.each(AVAILABILITY_WINDOW_NORMALIZE_SCENARIOS)(
    'normalizes $id',
    ({ params, expectedWindows }) => {
      expect(normalizeAvailabilityWindows(params)).toEqual(expectedWindows);
    },
  );

  it('prefers explicit availabilityWindows over legacy single fields', () => {
    expect(
      normalizeAvailabilityWindows({
        availabilityWindows: [
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
          { date: 'tomorrow', timeOfDay: 'evening' },
        ],
        date: '01/01/2099',
        timeOfDay: 'morning',
      }),
    ).toEqual([
      { weekdays: ['friday'], timeOfDay: 'afternoon' },
      { date: 'tomorrow', timeOfDay: 'evening' },
    ]);
  });

  it('normalizes weekday abbreviations and timeOfDay casing', () => {
    expect(
      normalizeAvailabilityWindows({
        weekdays: ['Fri', 'MON'],
        timeOfDay: 'Afternoon',
      }),
    ).toEqual([
      {
        weekdays: ['friday', 'monday'],
        timeOfDay: 'afternoon',
      },
    ]);
  });
});

describe('enrichFlexibleAvailabilityServiceCategoryFromPrompt', () => {
  it('extracts leading service before inline budget + OR windows', () => {
    expect(
      enrichFlexibleAvailabilityServiceCategoryFromPrompt(
        'Massage under $80 tomorrow or Thursday evening',
        {},
      ),
    ).toEqual({ serviceCategory: 'massage', serviceName: null });
  });
});

describe('enrichFlexibleAvailabilitySingleWindowFromPrompt (avail-single-*-en)', () => {
  it('avail-single-tomorrow-evening-en rescues date, timeOfDay, category, allProviders', () => {
    expect(
      enrichFlexibleAvailabilitySingleWindowFromPrompt(
        "Who's free tomorrow evening for massage?",
        {},
      ),
    ).toMatchObject({
      serviceCategory: 'massage',
      date: 'tomorrow',
      timeOfDay: 'evening',
      allProviders: true,
    });
  });

  it('avail-single-friday-afternoon-en rescues weekday, timeOfDay, category, allProviders', () => {
    expect(
      enrichFlexibleAvailabilitySingleWindowFromPrompt(
        'Any slots Friday afternoon for a facial?',
        {},
      ),
    ).toMatchObject({
      serviceCategory: 'facial',
      weekdays: ['friday'],
      timeOfDay: 'afternoon',
      allProviders: true,
    });
  });

  it.each(AVAILABILITY_WINDOW_SINGLE_SCENARIOS)(
    'does not split single-window prompt $id into OR windows',
    ({ prompt }) => {
      expect(parseAvailabilityWindowsFromPrompt(prompt)).toBeNull();
    },
  );
});

describe('enrichAvailabilityWindowsFromPrompt (avail-1.3)', () => {
  it.each(AVAILABILITY_WINDOW_ENRICHMENT_SCENARIOS)(
    'enriches $id',
    ({ prompt, params, expectedParams }) => {
      expect(enrichAvailabilityWindowsFromPrompt(params, prompt)).toEqual(
        expectedParams,
      );
    },
  );

  it('is idempotent when availabilityWindows already match the prompt', () => {
    const params = {
      serviceCategory: 'haircut',
      availabilityWindows: [
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ],
    };
    expect(
      enrichAvailabilityWindowsFromPrompt(
        params,
        'I want a haircut tomorrow evening or Friday afternoon',
      ),
    ).toBe(params);
  });

  it('does not enrich gift card prompts', () => {
    const params = { serviceCategory: 'haircut', date: 'tomorrow' };
    expect(
      enrichAvailabilityWindowsFromPrompt(
        params,
        '$50 gift card, haircut tomorrow or Friday',
      ),
    ).toEqual(params);
  });
});

describe('ai-flexible-availability.util OR slot scan (discover-1.2)', () => {
  it.each(FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS)(
    'pickEarliestSlotAcrossWindows $id',
    ({ candidates, expectedWindowIndex }) => {
      const picked = pickEarliestSlotAcrossWindows(
        candidates.map((candidate) => ({
          slot: { startTime: candidate.startTime },
          windowIndex: candidate.windowIndex,
          timeOfDay: candidate.timeOfDay,
          dateKeys: ['2026-06-11'],
        })),
      );
      expect(picked?.windowIndex).toBe(expectedWindowIndex);
    },
  );

  it('pickEarliestSlotAcrossWindows returns null for empty candidates', () => {
    expect(pickEarliestSlotAcrossWindows([])).toBeNull();
  });

  it('scanWindowsForSlots skips empty windows and picks earliest slot', async () => {
    const scanOrder: number[] = [];
    const picked = await scanWindowsForSlots(
      [
        { dateKeys: ['2026-06-12'], timeOfDay: 'evening' },
        { dateKeys: ['2026-06-12'], timeOfDay: 'afternoon' },
      ],
      async (_window, windowIndex) => {
        scanOrder.push(windowIndex);
        if (windowIndex === 0) {
          return { startTime: '2026-06-12T19:00:00.000Z' };
        }
        if (windowIndex === 1) {
          return { startTime: '2026-06-12T13:00:00.000Z' };
        }
        return null;
      },
    );

    expect(scanOrder).toEqual([0, 1]);
    expect(picked?.windowIndex).toBe(1);
    expect(picked?.timeOfDay).toBe('afternoon');
    expect(picked?.slot.startTime).toBe('2026-06-12T13:00:00.000Z');
  });

  it('scanWindowsForSlots returns null when every window is empty', async () => {
    const picked = await scanWindowsForSlots(
      [{ dateKeys: ['2026-06-12'], timeOfDay: 'morning' }],
      async () => null,
    );
    expect(picked).toBeNull();
  });
});

describe('ai-flexible-availability.util nearest OR windows (avail-1.6 / discover-exit-1)', () => {
  it.each(FLEXIBLE_AVAILABILITY_NEAREST_WINDOW_SCENARIOS)(
    'resolvePublicAvailabilityWindows $id',
    ({ params, prompt, expectedWindowCount }) => {
      const windows = resolvePublicAvailabilityWindows(params, prompt, 'UTC', {
        defaultScanDays: 14,
      });
      expect(windows).toHaveLength(expectedWindowCount);
    },
  );
});
