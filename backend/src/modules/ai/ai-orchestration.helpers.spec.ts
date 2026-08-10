import {
  applyUnavailableBlocksToPeriods,
  extractUnavailableBlocksFromPrompt,
  extractDateRangeFromPrompt,
  extractSingleIsoDayFromPrompt,
  inferDirectSchedulePeriods,
  resolveDirectScheduleDateKeys,
  resolveDirectSchedulePeriodServiceIds,
  matchEmployeesInPrompt,
  resolvePublicAvailabilityDateKeys,
  resolvePublicAvailabilityWindows,
  resolveDateKeysForAvailabilityWindow,
  applyAvailabilityDateFromPrompt,
  resolveDateRange,
  extractNextDaysRangeFromPrompt,
  enrichListServicesParamsFromPrompt,
  extractServiceTypeKeywordFromListPrompt,
  sanitizeListServicesFilterValue,
  matchServicesByQuery,
  findServiceByExactName,
  fuzzyMatchServiceByName,
  resolveServicesFromCatalogParams,
  resolvePublicAssistantSessionServiceFields,
  extractRecommendServicesFromPrompt,
  stripServiceRoleNoise,
  parseTimeWindow,
  hasExplicitTimeWindow,
  filterOpenSlotsByTimeRange,
  openSlotOverlapsTimeRange,
} from './ai-orchestration.helpers.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';

describe('extractSingleIsoDayFromPrompt (e2e-bug.67)', () => {
  it.each([
    {
      id: 'fill-gap-iso-ui-prompt',
      prompt:
        'Fill this gap on 2026-07-15 from 09:00 to 19:00 — suggest waitlist customers who could book it.',
      expected: '2026-07-15',
    },
    {
      id: 'slash-date',
      prompt: 'Fill this gap on 09/06/2026 from 14:00 to 15:30',
      expected: '2026-06-09',
    },
    {
      id: 'bare-iso',
      prompt: 'Suggest waitlist for 2026-08-01',
      expected: '2026-08-01',
    },
  ])('extracts $id', ({ prompt, expected }) => {
    expect(extractSingleIsoDayFromPrompt(prompt)).toBe(expected);
  });

  it('does not collapse an ISO date range to a single day', () => {
    expect(
      extractSingleIsoDayFromPrompt('from 2026-07-01 to 2026-07-05'),
    ).toBeNull();
    expect(extractDateRangeFromPrompt('from 2026-07-01 to 2026-07-05')).toEqual(
      {
        start: '2026-07-01',
        end: '2026-07-05',
      },
    );
  });
});

describe('inferDirectSchedulePeriods', () => {
  it('builds service blocks around lunch from prompt when periods are omitted', () => {
    const periods = inferDirectSchedulePeriods(
      { timeFrom: '09:00', timeTo: '19:00' },
      'Set schedule 9-19 with 12-13 unavailable',
    );
    expect(periods).toEqual([
      { startTime: '09:00', endTime: '12:00', type: 'service_block' },
      {
        startTime: '12:00',
        endTime: '13:00',
        type: 'unavailable_block',
        placeholderLabel: 'Unavailable',
      },
      { startTime: '13:00', endTime: '19:00', type: 'service_block' },
    ]);
  });

  it('fills gap when LLM returns split service blocks without unavailable period', () => {
    const periods = inferDirectSchedulePeriods(
      {
        periods: [
          { startTime: '09:00', endTime: '12:00', type: 'service_block' },
          { startTime: '13:00', endTime: '19:00', type: 'service_block' },
        ],
      },
      'Create schedule for Gevorg 9-19 and make 12-13 unavailable',
    );
    expect(periods).toEqual([
      { startTime: '09:00', endTime: '12:00', type: 'service_block' },
      {
        startTime: '12:00',
        endTime: '13:00',
        type: 'unavailable_block',
        placeholderLabel: 'Unavailable',
      },
      { startTime: '13:00', endTime: '19:00', type: 'service_block' },
    ]);
  });

  it('splits a single long service block when lunch is requested', () => {
    const periods = inferDirectSchedulePeriods(
      {
        periods: [
          { startTime: '09:00', endTime: '19:00', type: 'service_block' },
        ],
      },
      'Schedule 9-19, lunch 12-13 unavailable',
    );
    expect(periods).toEqual([
      {
        startTime: '09:00',
        endTime: '12:00',
        type: 'service_block',
        placeholderLabel: undefined,
      },
      {
        startTime: '12:00',
        endTime: '13:00',
        type: 'unavailable_block',
        placeholderLabel: 'Lunch',
      },
      {
        startTime: '13:00',
        endTime: '19:00',
        type: 'service_block',
        placeholderLabel: undefined,
      },
    ]);
  });
});

describe('extractUnavailableBlocksFromPrompt', () => {
  it('parses make X-Y unavailable phrasing', () => {
    expect(
      extractUnavailableBlocksFromPrompt('make 12-13 unavailable'),
    ).toEqual([{ from: '12:00', to: '13:00', label: 'Unavailable' }]);
  });
});

describe('applyUnavailableBlocksToPeriods', () => {
  it('inserts unavailable block into a bracketed gap', () => {
    const result = applyUnavailableBlocksToPeriods(
      [
        { startTime: '09:00', endTime: '12:00', type: 'service_block' },
        { startTime: '13:00', endTime: '19:00', type: 'service_block' },
      ],
      [{ from: '12:00', to: '13:00', label: 'Lunch' }],
    );
    expect(result[1]).toMatchObject({
      startTime: '12:00',
      endTime: '13:00',
      type: 'unavailable_block',
    });
  });
});

describe('resolvePublicAvailabilityDateKeys', () => {
  const tz = 'UTC';

  it('returns upcoming Monday and Friday keys from weekday names', () => {
    const dates = resolvePublicAvailabilityDateKeys(
      {},
      'free slots on Monday and Friday for massage',
      tz,
    );
    expect(dates.length).toBeGreaterThan(0);
    for (const dateKey of dates) {
      const day = new Date(`${dateKey}T12:00:00.000Z`).getUTCDay();
      expect([1, 5]).toContain(day);
    }
  });

  it('ignores stale session date when prompt names a weekday', () => {
    const dates = resolvePublicAvailabilityDateKeys(
      { date: '29_05_2026' },
      'what are free slots on Monday for Gevorg',
      tz,
      { defaultScanDays: 14 },
    );
    expect(dates.length).toBeGreaterThan(0);
    for (const dateKey of dates) {
      expect(new Date(`${dateKey}T12:00:00.000Z`).getUTCDay()).toBe(1);
      expect(dateKey).not.toBe('2026-05-29');
    }
  });

  it('returns a single day for tomorrow', () => {
    const dates = resolvePublicAvailabilityDateKeys(
      {},
      'available tomorrow',
      tz,
    );
    expect(dates).toHaveLength(1);
  });

  // e2e-bug.365 — both of these tests are correct and they contradicted each
  // other on a moving calendar: one required 2026-06-15 to be returned, the
  // other required past dates to be dropped, and 2026-06-15 became a past date.
  // Pinning "today" makes each assert its own rule instead of asserting the
  // date the suite happened to be written on.
  const FROZEN_TODAY = '2026-06-01';

  it('uses explicit date param when no weekday filter', () => {
    const dates = resolvePublicAvailabilityDateKeys(
      { date: '15_06_2026' },
      'check slots',
      tz,
      { referenceTodayDateKey: FROZEN_TODAY },
    );
    expect(dates).toEqual(['2026-06-15']);
  });

  it('drops past dates from explicit params', () => {
    const dates = resolvePublicAvailabilityDateKeys(
      { date: '01_01_2020' },
      'check slots',
      tz,
      { referenceTodayDateKey: FROZEN_TODAY },
    );
    expect(dates).toEqual([]);
  });

  it('drops a date that is past relative to the injected today, not the real one', () => {
    // Guards the seam itself: without the injection this would depend on when
    // the suite runs, which is the defect e2e-bug.365 records.
    const dates = resolvePublicAvailabilityDateKeys(
      { date: '15_06_2026' },
      'check slots',
      tz,
      { referenceTodayDateKey: '2026-07-01' },
    );
    expect(dates).toEqual([]);
  });

  it('keeps OR windows separate with paired timeOfDay (avail-1.4)', () => {
    const windows = resolvePublicAvailabilityWindows(
      {
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
      'I want a haircut tomorrow evening or Friday afternoon',
      tz,
      { defaultScanDays: 14 },
    );

    expect(windows).toHaveLength(2);
    expect(windows[0]?.timeOfDay).toBe('evening');
    expect(windows[0]?.dateKeys).toHaveLength(1);
    expect(windows[1]?.timeOfDay).toBe('afternoon');
    expect(windows[1]?.dateKeys.length).toBeGreaterThan(0);
    for (const dateKey of windows[1].dateKeys) {
      expect(new Date(`${dateKey}T12:00:00.000Z`).getUTCDay()).toBe(5);
    }
    if (windows[0]?.dateKeys[0] === windows[1]?.dateKeys[0]) {
      expect(windows[0]?.timeOfDay).not.toBe(windows[1]?.timeOfDay);
    } else {
      expect(windows[0]?.dateKeys[0]).not.toEqual(windows[1]?.dateKeys[0]);
    }
  });

  it('does not merge OR weekdays into one window when availabilityWindows is set', () => {
    const tomorrowKey = resolveDateKeysForAvailabilityWindow(
      { date: 'tomorrow' },
      tz,
      14,
    )[0];
    const fridayKeys = resolveDateKeysForAvailabilityWindow(
      { weekdays: ['friday'] },
      tz,
      14,
    );

    const flattened = resolvePublicAvailabilityDateKeys(
      {
        availabilityWindows: [
          { date: 'tomorrow', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
      undefined,
      tz,
      { defaultScanDays: 14 },
    );

    expect(flattened).toContain(tomorrowKey);
    for (const dateKey of fridayKeys) {
      expect(flattened).toContain(dateKey);
    }
  });

  it('resolves timeOfDay-only OR windows across the scan horizon (avail-voice-chip-en)', () => {
    const eveningKeys = resolveDateKeysForAvailabilityWindow(
      { timeOfDay: 'evening' },
      tz,
      7,
    );
    const weekendKeys = resolveDateKeysForAvailabilityWindow(
      { weekdays: ['saturday', 'sunday'] },
      tz,
      7,
    );

    expect(eveningKeys.length).toBe(7);
    expect(weekendKeys.length).toBeGreaterThan(0);

    const windows = resolvePublicAvailabilityWindows(
      {
        availabilityWindows: [
          { timeOfDay: 'evening' },
          { weekdays: ['saturday', 'sunday'] },
        ],
      },
      'Evening or weekend slots for a facial',
      tz,
      { defaultScanDays: 7 },
    );

    expect(windows.length).toBe(2);
    expect(windows[0]?.timeOfDay).toBe('evening');
    expect(windows[0]?.dateKeys.length).toBe(7);
    expect(windows[1]?.dateKeys.length).toBeGreaterThan(0);
  });

  it('keeps AND weekdays in a single window with shared timeOfDay (avail-1.4)', () => {
    const windows = resolvePublicAvailabilityWindows(
      {
        weekdays: ['monday', 'friday'],
        timeOfDay: 'afternoon',
      },
      'Monday and Friday afternoon for color',
      tz,
      { defaultScanDays: 14 },
    );

    expect(windows).toHaveLength(1);
    expect(windows[0]?.timeOfDay).toBe('afternoon');
    for (const dateKey of windows[0].dateKeys) {
      expect([1, 5]).toContain(
        new Date(`${dateKey}T12:00:00.000Z`).getUTCDay(),
      );
    }
  });
});

describe('applyAvailabilityDateFromPrompt', () => {
  it('clears stale session date when weekdays are mentioned', () => {
    const params: Record<string, any> = {
      date: '29_05_2026',
      dateFrom: '29_05_2026',
      dateTo: '29_05_2026',
    };
    applyAvailabilityDateFromPrompt(
      params,
      'free slots on Monday for Gevorg',
      'UTC',
    );
    expect(params.date).toBeUndefined();
    expect(params.dateFrom).toBeUndefined();
    expect(params.dateTo).toBeUndefined();
  });
});

describe('resolveDateRange bare weekday', () => {
  it('resolves upcoming Monday from prompt', () => {
    const range = resolveDateRange(
      {},
      'free slots on Monday for Gevorg',
      'UTC',
    );
    expect(range).not.toBeNull();
    expect(new Date(`${range!.start}T12:00:00.000Z`).getUTCDay()).toBe(1);
  });
});

describe('extractServiceTypeKeywordFromListPrompt', () => {
  it.each([
    ['which kind of massage you have?', 'massage'],
    ['What types of hair services do you offer?', 'hair'],
    ['which alexandrite services do you have', 'alexandrite'],
    ['recommend me face care services', 'face care'],
    ['I want a pilling', 'pilling'],
    ['I want a face pilling', 'face pilling'],
  ])('extracts %s → %s', (prompt, keyword) => {
    expect(extractServiceTypeKeywordFromListPrompt(prompt)).toBe(keyword);
  });

  it('e2e-bug.143 — unfiltered catalog ask extracts no keyword', () => {
    expect(
      extractServiceTypeKeywordFromListPrompt('What services do I offer?'),
    ).toBeNull();
    expect(
      extractServiceTypeKeywordFromListPrompt('What services do we offer?'),
    ).toBeNull();
    expect(
      extractServiceTypeKeywordFromListPrompt('what services do you offer?'),
    ).toBeNull();
    expect(
      extractServiceTypeKeywordFromListPrompt('list all services'),
    ).toBeNull();
  });
});

describe('sanitizeListServicesFilterValue', () => {
  it.each([
    ['i', null],
    ['I', null],
    ['we', null],
    ['you', null],
    ['me', null],
    ['a', null],
    ['x', null],
    ['', null],
    ['  ', null],
    ['offer', null],
    ['services', null],
    // e2e-bug.226 — classifier copies list phrasing into the filter
    ['you offer', null],
    ['You Offer', null],
    ['do you offer', null],
    ['you have', null],
    ['do you have', null],
    ['we offer', null],
    ['are available', null],
    ['available', null],
    ['services you offer', null],
    ['massage you offer', 'massage'],
    ['massage', 'massage'],
    ['hair', 'hair'],
    ['face care', 'face care'],
    // e2e-bug.238 — book-half availability fillers are not catalog filters
    ['soonest', null],
    ['nearest', null],
    ['next available', null],
    ['soonest available', null],
    ['earliest available', null],
    ['first available', null],
  ])('sanitizes %j → %j', (input, expected) => {
    expect(sanitizeListServicesFilterValue(input)).toBe(expected);
  });
});

describe('enrichListServicesParamsFromPrompt', () => {
  it('adds serviceCategory when the prompt names a service type keyword', () => {
    expect(
      enrichListServicesParamsFromPrompt('which kind of massage you have?', {}),
    ).toEqual({ serviceCategory: 'massage' });
  });

  it('keeps existing classifier params', () => {
    expect(
      enrichListServicesParamsFromPrompt('list services', {
        serviceCategory: 'hair',
      }),
    ).toEqual({ serviceCategory: 'hair' });
  });

  it('e2e-bug.143 — drops pronoun serviceCategory from What services do I offer?', () => {
    expect(
      enrichListServicesParamsFromPrompt('What services do I offer?', {
        serviceCategory: 'i',
      }),
    ).toEqual({ serviceCategory: null });
    expect(
      enrichListServicesParamsFromPrompt('What services do we offer?', {
        serviceCategory: 'we',
        serviceName: 'I',
      }),
    ).toEqual({ serviceCategory: null, serviceName: null });
  });

  it('e2e-bug.226 — drops "you offer" filter from what services do you offer?', () => {
    expect(
      enrichListServicesParamsFromPrompt('what services do you offer?', {
        serviceName: 'you offer',
      }),
    ).toEqual({ serviceName: null });
    expect(
      enrichListServicesParamsFromPrompt('What services do you offer?', {
        serviceCategory: 'you offer',
        serviceName: 'you offer',
      }),
    ).toEqual({ serviceCategory: null, serviceName: null });
    expect(
      extractServiceTypeKeywordFromListPrompt('what services do you offer?'),
    ).toBeNull();
  });

  it('e2e-bug.238 — extracts massage from show/list budget options prompts', () => {
    expect(
      extractServiceTypeKeywordFromListPrompt(
        'Show me evening massage options under $100 then book the soonest',
      ),
    ).toBe('massage');
    expect(
      extractServiceTypeKeywordFromListPrompt(
        'list massage under $100 then book the soonest available',
      ),
    ).toBe('massage');
    expect(
      enrichListServicesParamsFromPrompt(
        'Show me evening massage options under $100 then book the soonest',
        { serviceCategory: 'soonest' },
      ),
    ).toEqual({ serviceCategory: 'massage' });
  });
});

describe('resolvePublicAssistantSessionServiceFields', () => {
  const catalog = [
    { id: '6', name: 'hairstyle' },
    { id: '5', name: 'Swedish massage' },
  ];

  it('persists canonical catalog service names', () => {
    expect(
      resolvePublicAssistantSessionServiceFields(
        { serviceName: 'hairstyle' },
        catalog,
      ),
    ).toEqual({ serviceName: 'hairstyle', serviceCategory: null });
  });

  it('maps haircut synonym to catalog hairstyle (e2e-bug.199)', () => {
    expect(
      resolvePublicAssistantSessionServiceFields(
        { serviceName: 'haircut' },
        catalog,
      ),
    ).toEqual({ serviceName: 'hairstyle', serviceCategory: null });
  });

  it('clears truly unknown service names so they do not poison the next turn', () => {
    expect(
      resolvePublicAssistantSessionServiceFields(
        { serviceName: 'unicorn trim' },
        catalog,
      ),
    ).toEqual({ serviceName: null, serviceCategory: null });
  });

  it('keeps valid serviceCategory filters', () => {
    expect(
      resolvePublicAssistantSessionServiceFields(
        { serviceCategory: 'massage' },
        catalog,
      ),
    ).toEqual({ serviceName: null, serviceCategory: 'massage' });
  });
});

describe('resolveServicesFromCatalogParams', () => {
  const catalog = [
    { id: '1', name: 'Deep tissue massage' },
    { id: '2', name: 'facemassage' },
    { id: '3', name: 'full body massage' },
    { id: '4', name: 'Hot stone massage' },
    { id: '5', name: 'Swedish massage' },
    { id: '6', name: 'hairstyle' },
  ];

  it('filters by serviceCategory token', () => {
    expect(
      resolveServicesFromCatalogParams(catalog, {
        serviceCategory: 'massage',
      }).map((s) => s.name),
    ).toEqual([
      'Deep tissue massage',
      'facemassage',
      'full body massage',
      'Hot stone massage',
      'Swedish massage',
    ]);
  });

  it('filters by serviceName when category is absent', () => {
    expect(
      resolveServicesFromCatalogParams(catalog, {
        serviceName: 'Swedish massage',
      }),
    ).toEqual([{ id: '5', name: 'Swedish massage' }]);
  });

  it('maps haircut / haircuts to catalog hairstyle (e2e-bug.199)', () => {
    expect(
      resolveServicesFromCatalogParams(catalog, {
        serviceCategory: 'haircut',
      }).map((s) => s.name),
    ).toEqual(['hairstyle']);
    expect(
      resolveServicesFromCatalogParams(catalog, {
        serviceName: 'haircuts',
      }).map((s) => s.name),
    ).toEqual(['hairstyle']);
  });

  it('prefers exact haircut over synonym when both exist (e2e-bug.199)', () => {
    const both = [...catalog, { id: '7', name: 'Classic haircut' }];
    expect(
      resolveServicesFromCatalogParams(both, {
        serviceCategory: 'haircut',
      }).map((s) => s.name),
    ).toEqual(['Classic haircut']);
  });

  it('prefers service type name matches over catalog category names', () => {
    const withCategories = [
      { id: '1', name: 'Deep tissue massage', category: { name: 'Body' } },
      { id: '6', name: 'hairstyle', category: { name: 'Hair' } },
    ];
    expect(
      resolveServicesFromCatalogParams(withCategories, {
        serviceCategory: 'massage',
      }).map((s) => s.name),
    ).toEqual(['Deep tissue massage']);
  });

  it('falls back to catalog category name when no service type name matches', () => {
    const withCategories = [
      { id: '1', name: 'Blow dry', category: { name: 'Hair' } },
      { id: '2', name: 'Color', category: { name: 'Hair' } },
    ];
    expect(
      resolveServicesFromCatalogParams(withCategories, {
        serviceCategory: 'Hair',
      }).map((s) => s.name),
    ).toEqual(['Blow dry', 'Color']);
  });
});

describe('findServiceByExactName', () => {
  const catalog = [{ id: '1', name: "Men's Haircut" }];

  it('matches only exact names for create-service dedup', () => {
    expect(findServiceByExactName(catalog, "Men's Haircut")?.id).toBe('1');
    expect(
      findServiceByExactName(catalog, "Men's haircut with head wash"),
    ).toBeUndefined();
  });

  it('still allows fuzzy lookup via fuzzyMatchServiceByName', () => {
    expect(
      fuzzyMatchServiceByName(catalog, "Men's haircut with head wash")?.id,
    ).toBe('1');
  });
});

describe('matchServicesByQuery', () => {
  const catalog = [
    { id: '1', name: 'Deep tissue massage' },
    { id: '2', name: 'facemassage' },
    { id: '3', name: 'full body massage' },
    { id: '4', name: 'Hot stone massage' },
    { id: '5', name: 'Swedish massage' },
    { id: '6', name: 'hairstyle' },
  ];

  it('maps haircut to hairstyle when catalog has no haircut (e2e-bug.199)', () => {
    expect(matchServicesByQuery(catalog, 'haircut').map((s) => s.name)).toEqual(
      ['hairstyle'],
    );
    expect(
      matchServicesByQuery(catalog, 'haircuts').map((s) => s.name),
    ).toEqual(['hairstyle']);
    expect(fuzzyMatchServiceByName(catalog, 'haircut')?.name).toBe('hairstyle');
  });

  it('returns all massage services for broad "massage" query', () => {
    const matched = matchServicesByQuery(catalog, 'massage');
    expect(matched.map((s) => s.name)).toEqual([
      'Deep tissue massage',
      'facemassage',
      'full body massage',
      'Hot stone massage',
      'Swedish massage',
    ]);
  });

  it('strips specialist role words before matching', () => {
    expect(stripServiceRoleNoise('massage specialist')).toBe('massage');
    const matched = matchServicesByQuery(catalog, 'massage specialist');
    expect(matched).toHaveLength(5);
  });

  it('returns a single service for specific names', () => {
    const matched = matchServicesByQuery(catalog, 'Swedish massage');
    expect(matched).toHaveLength(1);
    expect(matched[0].name).toBe('Swedish massage');
  });
});

describe('extractRecommendServicesFromPrompt', () => {
  const catalog = [
    { id: '1', name: 'Deep tissue massage' },
    { id: '2', name: 'facemassage' },
    { id: '3', name: 'full body massage' },
    { id: '4', name: 'Hot stone massage' },
    { id: '5', name: 'Swedish massage' },
  ];

  it('extracts all massage types from highest rated prompt', () => {
    const matched = extractRecommendServicesFromPrompt(
      'who is the highest rated Massage',
      catalog,
    );
    expect(matched).toHaveLength(5);
  });

  it('extracts from massage specialist phrasing', () => {
    const matched = extractRecommendServicesFromPrompt(
      'who is the highest rated massage specialist',
      catalog,
    );
    expect(matched).toHaveLength(5);
  });
});

describe('matchEmployeesInPrompt', () => {
  const employees = [
    { id: '1', name: 'Mary Torgomyan', businessId: 'b', isActive: true } as any,
    {
      id: '2',
      name: 'Jujo Karapetyan',
      businessId: 'b',
      isActive: true,
    } as any,
    {
      id: '3',
      name: 'Gevorg Gasparyan',
      businessId: 'b',
      isActive: true,
    } as any,
  ];

  it('returns both providers when prompt names them with and', () => {
    const matched = matchEmployeesInPrompt(
      'clear all schedules for Mary and Jujo on july',
      employees,
    );
    expect(matched.map((e) => e.name).sort()).toEqual(
      ['Jujo Karapetyan', 'Mary Torgomyan'].sort(),
    );
  });
});

describe('extractNextDaysRangeFromPrompt', () => {
  it('resolves inclusive range from today for "next 5 days"', () => {
    const range = extractNextDaysRangeFromPrompt(
      "apply schedule for Gevorg's services next 5 days",
      'UTC',
    );
    expect(range).not.toBeNull();
    const today = getTodayDateKey('UTC');
    expect(range!.start).toBe(today);
    expect(range!.end).toBe(addDaysToDateKey(today, 4, 'UTC'));
  });

  it('overrides stale LLM dates in resolveDateRange', () => {
    const range = resolveDateRange(
      { dateFrom: '2023-10-30', dateTo: '2023-11-03' },
      "apply schedule for Gevorg's services next 5 days",
      'UTC',
    );
    expect(range!.start).toBe(getTodayDateKey('UTC'));
    expect(range!.start).not.toBe('2023-10-30');
  });
});

describe('resolveDateRange', () => {
  it('expands bare month names like "on july"', () => {
    const range = resolveDateRange({}, 'clear schedules on july', 'UTC');
    expect(range?.start.endsWith('-07-01')).toBe(true);
    expect(range?.end.endsWith('-07-31')).toBe(true);
  });

  it('resolves all-time to a wide historical window ending today', () => {
    const range = resolveDateRange(
      {},
      'Top specialists by revenue all time',
      'UTC',
    );
    expect(range).not.toBeNull();
    expect(range!.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range!.start < range!.end).toBe(true);
  });
});

describe('resolveDirectSchedulePeriodServiceIds', () => {
  const assigned = ['svc-a', 'svc-b'];

  it('uses employee assigned services when period has none', () => {
    expect(
      resolveDirectSchedulePeriodServiceIds(
        { type: 'service_block', serviceIds: [] },
        assigned,
      ),
    ).toEqual(assigned);
  });

  it('filters catalog-wide ids down to assigned services', () => {
    expect(
      resolveDirectSchedulePeriodServiceIds(
        {
          type: 'service_block',
          serviceIds: ['svc-a', 'svc-b', 'svc-c', 'svc-d'],
        },
        assigned,
      ),
    ).toEqual(assigned);
  });

  it('keeps explicit subset when all ids are assigned to employee', () => {
    expect(
      resolveDirectSchedulePeriodServiceIds(
        { type: 'service_block', serviceIds: ['svc-a'] },
        assigned,
      ),
    ).toEqual(['svc-a']);
  });

  it('returns empty for unavailable blocks', () => {
    expect(
      resolveDirectSchedulePeriodServiceIds(
        { type: 'unavailable_block', serviceIds: assigned },
        assigned,
      ),
    ).toEqual([]);
  });
});

describe('explicit time window helpers', () => {
  it('parses from 17:00-19:00 ranges in natural prompts', () => {
    const prompt = 'is Jujo available for hairstyle from 17:00-19:00?';
    expect(hasExplicitTimeWindow({}, prompt)).toBe(true);
    expect(parseTimeWindow({}, prompt)).toEqual({
      timeFrom: '17:00',
      timeTo: '19:00',
    });
  });

  it('filters open slots that overlap a daily time range', () => {
    const slots = [
      { start: '11:00', end: '11:30' },
      { start: '13:00', end: '19:00' },
    ];
    expect(openSlotOverlapsTimeRange(slots[1], '17:00', '19:00')).toBe(true);
    expect(openSlotOverlapsTimeRange(slots[0], '17:00', '19:00')).toBe(false);
    expect(filterOpenSlotsByTimeRange(slots, '17:00', '19:00')).toEqual([
      { start: '13:00', end: '19:00' },
    ]);
  });
});

describe('resolveDirectScheduleDateKeys', () => {
  it('expands dateFrom/dateTo range into ISO days', () => {
    expect(
      resolveDirectScheduleDateKeys({
        dateFrom: '2026-07-01',
        dateTo: '2026-07-05',
      }),
    ).toEqual([
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
      '2026-07-05',
    ]);
  });

  it('uses dateRange from buildDateParams shape', () => {
    expect(
      resolveDirectScheduleDateKeys({
        dateRange: { start: '2026-07-01', end: '2026-07-03' },
      }),
    ).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
  });
});
