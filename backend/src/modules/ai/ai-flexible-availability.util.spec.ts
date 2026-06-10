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
import {
  clauseHasAvailabilityCue,
  enrichAvailabilityWindowsFromPrompt,
  hasAvailabilityOrPattern,
  isAvailabilityAndWeekdaysPattern,
  normalizeAvailabilityWindows,
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
    },
  );

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
