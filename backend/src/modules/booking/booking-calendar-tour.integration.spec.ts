import { tourBookingOverlapsDateRange } from '../../common/utils/tour-calendar.util.js';

const weekStart = '2026-06-09';
const weekEnd = '2026-06-15';

type CalendarFixture = {
  id: string;
  startTime: string;
  metadata?: Record<string, unknown>;
  employeeId?: string;
  hiddenFromCalendar?: boolean;
};

const fixtures: CalendarFixture[] = [
  {
    id: 'in-week-standard',
    startTime: '2026-06-10T10:00:00.000Z',
    metadata: {},
  },
  {
    id: 'in-week-tour',
    startTime: '2026-06-11T08:00:00.000Z',
    metadata: {
      paxCount: 4,
      tourStartDate: '2026-06-11',
      tourEndDate: '2026-06-13',
    },
  },
  {
    id: 'pre-week-tour-spanning',
    startTime: '2026-06-08T08:00:00.000Z',
    metadata: {
      paxCount: 6,
      tourStartDate: '2026-06-08',
      tourEndDate: '2026-06-11',
    },
  },
  {
    id: 'post-week-tour-spanning',
    startTime: '2026-06-14T08:00:00.000Z',
    metadata: {
      paxCount: 2,
      tourStartDate: '2026-06-14',
      tourEndDate: '2026-06-18',
    },
  },
  {
    id: 'outside-week-tour',
    startTime: '2026-06-20T08:00:00.000Z',
    metadata: {
      tourStartDate: '2026-06-20',
      tourEndDate: '2026-06-22',
    },
  },
  {
    id: 'outside-week-standard',
    startTime: '2026-06-20T10:00:00.000Z',
    metadata: {},
  },
  {
    id: 'single-day-tour',
    startTime: '2026-06-12T08:00:00.000Z',
    metadata: {
      paxCount: 1,
      tourStartDate: '2026-06-12',
      tourEndDate: '2026-06-12',
    },
  },
];

function calendarWeekIncludes(booking: CalendarFixture): boolean {
  return tourBookingOverlapsDateRange(
    {
      startTime: new Date(booking.startTime),
      metadata: booking.metadata,
    },
    weekStart,
    weekEnd,
  );
}

describe('Sprint 30 — vert-tour-1.10 booking calendar week inclusion matrix', () => {
  it.each([
    ['in-week-standard', true],
    ['in-week-tour', true],
    ['pre-week-tour-spanning', true],
    ['post-week-tour-spanning', true],
    ['outside-week-tour', false],
    ['outside-week-standard', false],
    ['single-day-tour', true],
  ] as const)('week query includes %s → %s', (id, expected) => {
    const booking = fixtures.find((f) => f.id === id)!;
    expect(calendarWeekIncludes(booking)).toBe(expected);
  });

  it('returns only overlapping bookings for the provider calendar week', () => {
    const visible = fixtures.filter(calendarWeekIncludes).map((b) => b.id);
    expect(visible).toEqual([
      'in-week-standard',
      'in-week-tour',
      'pre-week-tour-spanning',
      'post-week-tour-spanning',
      'single-day-tour',
    ]);
  });

  it('tour metadata overlap uses tourEndDate fallback to tourStartDate', () => {
    expect(
      tourBookingOverlapsDateRange(
        {
          startTime: new Date('2026-06-01T08:00:00.000Z'),
          metadata: { tourStartDate: '2026-06-12' },
        },
        weekStart,
        weekEnd,
      ),
    ).toBe(true);
  });
});
