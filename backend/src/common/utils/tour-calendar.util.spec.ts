import {
  assignTourSpanLanes,
  buildServiceColorMap,
  buildTourCalendarSpans,
  buildWeekDateKeys,
  computeWeekColumnSpan,
  dateKeysOverlap,
  normalizeTourWeekAnchorDateKey,
  resolveTourBookingDateRange,
  tourBookingOverlapsDateRange,
} from './tour-calendar.util';
import { getTodayDateKey } from './date-format.util';
import { addDaysToDateKey } from './timezone.util';

describe('tour-calendar.util', () => {
  it('detects date key overlap', () => {
    expect(
      dateKeysOverlap('2026-08-10', '2026-08-12', '2026-08-11', '2026-08-17'),
    ).toBe(true);
    expect(
      dateKeysOverlap('2026-08-18', '2026-08-20', '2026-08-11', '2026-08-17'),
    ).toBe(false);
  });

  it('resolves tour booking date range from metadata', () => {
    expect(
      resolveTourBookingDateRange({
        startTime: new Date('2026-08-15T09:00:00.000Z'),
        metadata: {
          tourStartDate: '2026-08-15',
          tourEndDate: '2026-08-17',
        },
      }),
    ).toEqual({
      tourStartDate: '2026-08-15',
      tourEndDate: '2026-08-17',
    });
    expect(
      resolveTourBookingDateRange({
        startTime: new Date('2026-08-15T09:00:00.000Z'),
        metadata: { tourStartDate: '2026-08-15' },
      }),
    ).toEqual({
      tourStartDate: '2026-08-15',
      tourEndDate: '2026-08-15',
    });
    expect(
      resolveTourBookingDateRange({
        startTime: new Date('2026-08-15T09:00:00.000Z'),
        metadata: {},
      }),
    ).toBeNull();
  });

  it('checks tour and standard booking overlap against calendar week', () => {
    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-08-10T09:00:00.000Z'),
          metadata: {
            tourStartDate: '2026-08-10',
            tourEndDate: '2026-08-12',
          },
        },
        '2026-08-11',
        '2026-08-17',
      ),
    ).toBe(true);

    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-08-12T10:00:00.000Z'),
          metadata: {},
        },
        '2026-08-11',
        '2026-08-17',
      ),
    ).toBe(true);

    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-08-20T10:00:00.000Z'),
          metadata: {},
        },
        '2026-08-11',
        '2026-08-17',
      ),
    ).toBe(false);
  });

  it('excludes tours that end the day before the week starts', () => {
    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-06-07T08:00:00.000Z'),
          metadata: {
            tourStartDate: '2026-06-07',
            tourEndDate: '2026-06-08',
          },
        },
        '2026-06-09',
        '2026-06-15',
      ),
    ).toBe(false);
  });

  it('includes tours that start the day after the week ends when metadata spans backward', () => {
    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-06-16T08:00:00.000Z'),
          metadata: {
            tourStartDate: '2026-06-14',
            tourEndDate: '2026-06-16',
          },
        },
        '2026-06-09',
        '2026-06-15',
      ),
    ).toBe(true);
  });

  const weekKeys = [
    '2026-06-08',
    '2026-06-09',
    '2026-06-10',
    '2026-06-11',
    '2026-06-12',
    '2026-06-13',
    '2026-06-14',
  ];

  it('builds Monday-based week date keys', () => {
    expect(buildWeekDateKeys('2026-06-11')).toEqual(weekKeys);
  });

  // e2e-bug.270 — classifier garbage must never throw Invalid time value.
  it.each([
    ['this week', getTodayDateKey()],
    ["this week's", getTodayDateKey()],
    ['this calendar week', getTodayDateKey()],
    ['current week', getTodayDateKey()],
    ['next week', addDaysToDateKey(getTodayDateKey(), 7)],
    ["next week's", addDaysToDateKey(getTodayDateKey(), 7)],
    ['last week', addDaysToDateKey(getTodayDateKey(), -7)],
    ["last week's", addDaysToDateKey(getTodayDateKey(), -7)],
    ['2026-06-11', '2026-06-11'],
    ['not-a-date', undefined],
    ['', undefined],
  ] as const)(
    'normalizeTourWeekAnchorDateKey(%j) → %j',
    (raw, expected) => {
      expect(normalizeTourWeekAnchorDateKey(raw)).toBe(expected);
    },
  );

  it.each([
    'this week',
    "this week's",
    'this calendar week',
    'garbage',
    '',
  ])('buildWeekDateKeys(%j) returns 7 ISO days without throwing', (raw) => {
    const keys = buildWeekDateKeys(raw);
    expect(keys).toHaveLength(7);
    for (const key of keys) {
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('computes column span and stacked lanes (vert-tour-1.10)', () => {
    const placement = computeWeekColumnSpan(
      '2026-06-11',
      '2026-06-13',
      weekKeys,
    );
    expect(placement).toEqual({ colStart: 3, colEnd: 5 });

    const spans = buildTourCalendarSpans(
      [
        {
          id: 't1',
          startTime: new Date('2026-06-11T08:00:00.000Z'),
          endTime: new Date('2026-06-13T18:00:00.000Z'),
          status: 'confirmed',
          serviceId: 'trek',
          service: { id: 'trek', name: '3-Day Trek' },
          metadata: {
            paxCount: 4,
            tourStartDate: '2026-06-11',
            tourEndDate: '2026-06-13',
          },
        },
        {
          id: 't2',
          startTime: new Date('2026-06-10T08:00:00.000Z'),
          endTime: new Date('2026-06-11T18:00:00.000Z'),
          status: 'confirmed',
          serviceId: 'a',
          service: { id: 'a', name: 'Tour A' },
          metadata: {
            tourStartDate: '2026-06-10',
            tourEndDate: '2026-06-11',
          },
        },
        {
          id: 't3',
          startTime: new Date('2026-06-10T08:00:00.000Z'),
          endTime: new Date('2026-06-12T18:00:00.000Z'),
          status: 'confirmed',
          serviceId: 'b',
          service: { id: 'b', name: 'Tour B' },
          metadata: {
            tourStartDate: '2026-06-10',
            tourEndDate: '2026-06-12',
          },
        },
      ],
      weekKeys,
    );
    expect(spans.map((span) => span.lane)).toEqual([0, 1, 2]);
    expect(assignTourSpanLanes(spans)).toEqual([0, 1, 2]);
  });

  it('assigns stable service colors', () => {
    expect(buildServiceColorMap(['svc-a', 'svc-b'])).toEqual({
      'svc-a': 'blue',
      'svc-b': 'violet',
    });
  });
});
