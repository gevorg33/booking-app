import {
  applyUnavailableBlocksToPeriods,
  extractUnavailableBlocksFromPrompt,
  inferDirectSchedulePeriods,
  resolveDirectScheduleDateKeys,
  resolveDirectSchedulePeriodServiceIds,
  matchEmployeesInPrompt,
  resolvePublicAvailabilityDateKeys,
  applyAvailabilityDateFromPrompt,
  resolveDateRange,
  matchServicesByQuery,
  extractRecommendServicesFromPrompt,
  stripServiceRoleNoise,
} from './ai-orchestration.helpers.js';

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

  it('uses explicit date param when no weekday filter', () => {
    const dates = resolvePublicAvailabilityDateKeys(
      { date: '15_06_2026' },
      'check slots',
      tz,
    );
    expect(dates).toEqual(['2026-06-15']);
  });

  it('drops past dates from explicit params', () => {
    const dates = resolvePublicAvailabilityDateKeys(
      { date: '01_01_2020' },
      'check slots',
      tz,
    );
    expect(dates).toEqual([]);
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

describe('matchServicesByQuery', () => {
  const catalog = [
    { id: '1', name: 'Deep tissue massage' },
    { id: '2', name: 'facemassage' },
    { id: '3', name: 'full body massage' },
    { id: '4', name: 'Hot stone massage' },
    { id: '5', name: 'Swedish massage' },
    { id: '6', name: 'hairstyle' },
  ];

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
