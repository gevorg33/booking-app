import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleListTourCalendarWeekLogic } from './ai-tour-calendar-week.logic.js';

/**
 * e2e-bug.482's class — anchored to the current week, not to June 2026.
 *
 * `handleListTourCalendarWeekLogic` resolves its week from the prompt and falls
 * back to `getTodayDateKey()`. These fixtures pinned 2026-06-08…06-14, so once
 * real time left that week the handler was looking at *this* week and the
 * bookings sat in June: `departureCount` 2 → 0, with nothing wrong in the code.
 *
 * Deriving the week from today keeps the scenario (a Thursday multi-day trek and
 * a Friday day-tour inside one calendar week) while making it independent of
 * when it runs.
 */
const DAY_MS = 86_400_000;

/** Monday of the current ISO week, at UTC midnight. */
function currentWeekMonday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  return new Date(d.getTime() - (isoDay - 1) * DAY_MS);
}

function weekDay(offset: number, hour: number): Date {
  const d = new Date(currentWeekMonday().getTime() + offset * DAY_MS);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

describe('ai-tour-calendar-week.logic (ai-cmd-tour-12)', () => {
  const weekStart = isoDay(currentWeekMonday());
  const weekEnd = isoDay(new Date(currentWeekMonday().getTime() + 6 * DAY_MS));

  const mountainTrek = {
    id: 'svc-mountain',
    name: '3-Day Mountain Trek',
    metadata: { serviceType: 'tour', maxGroupSize: 8 },
  };

  const cityTour = {
    id: 'svc-city',
    name: 'City Tour',
    metadata: { serviceType: 'tour', maxGroupSize: 12 },
  };

  const maria = { id: 'emp-maria', name: 'Maria Lopez' };
  const gevorg = { id: 'emp-gevorg', name: 'Gevorg Gasparyan' };

  const trekBooking = {
    id: 'bk-tour-1',
    serviceId: 'svc-mountain',
    employeeId: 'emp-maria',
    status: BookingStatus.CONFIRMED,
    startTime: weekDay(3, 8),
    endTime: weekDay(5, 18),
    metadata: {
      paxCount: 4,
      tourStartDate: isoDay(weekDay(3, 8)),
      tourEndDate: isoDay(weekDay(5, 18)),
    },
    service: mountainTrek,
    employee: maria,
    customer: { name: 'John Doe' },
  };

  const cityBooking = {
    id: 'bk-tour-2',
    serviceId: 'svc-city',
    employeeId: 'emp-gevorg',
    status: BookingStatus.CONFIRMED,
    startTime: weekDay(4, 8),
    endTime: weekDay(4, 18),
    metadata: {
      paxCount: 2,
      tourStartDate: isoDay(weekDay(4, 8)),
      tourEndDate: isoDay(weekDay(4, 18)),
    },
    service: cityTour,
    employee: gevorg,
    customer: { name: 'Anna' },
  };

  const bookingService = {
    findAll: jest.fn(
      async (
        _businessId: string,
        _date?: string,
        employeeId?: string,
        _includeHidden?: boolean,
        startDate?: string,
        endDate?: string,
      ) => {
        let rows = [trekBooking, cityBooking];
        if (employeeId) {
          rows = rows.filter((row) => row.employeeId === employeeId);
        }
        if (startDate && endDate) {
          rows = rows.filter((row) => {
            const start = row.metadata.tourStartDate;
            const end = row.metadata.tourEndDate;
            return end >= startDate && start <= endDate;
          });
        }
        return rows;
      },
    ),
  };

  const serviceService = {
    findAll: jest.fn(async () => [mountainTrek, cityTour]),
  };

  const employeeService = {
    findAll: jest.fn(async () => [maria, gevorg]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists all tour departures in the calendar week', async () => {
    const result = await handleListTourCalendarWeekLogic(
      { bookingService, serviceService, employeeService },
      'biz-tour',
      { weekStartDate: weekStart },
      'List tour departures on the provider calendar this week',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('list_tour_calendar_week');
    expect(result.details?.departureCount).toBe(2);
    expect(result.summary).toMatch(/calendar week/i);
    expect(result.summary).toMatch(/Mountain Trek/);
    expect(result.summary).toMatch(/City Tour/);
  });

  it('filters by provider name', async () => {
    const result = await handleListTourCalendarWeekLogic(
      { bookingService, serviceService, employeeService },
      'biz-tour',
      { weekStartDate: weekStart },
      "Summarize tours visible on Maria's calendar this week with dates and pax",
    );
    expect(result.success).toBe(true);
    expect(result.details?.departureCount).toBe(1);
    expect(result.details?.employeeName).toBe('Maria Lopez');
    expect(result.summary).toMatch(/for Maria Lopez/);
    expect(result.summary).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('filters by service name', async () => {
    const result = await handleListTourCalendarWeekLogic(
      { bookingService, serviceService, employeeService },
      'biz-tour',
      { weekStartDate: weekStart },
      'Mountain trek tours on this calendar week with pax',
    );
    expect(result.success).toBe(true);
    expect(result.details?.departureCount).toBe(1);
    expect(result.summary).toMatch(/mountain trek/i);
  });

  it('returns clarify for unrelated prompts', async () => {
    const result = await handleListTourCalendarWeekLogic(
      { bookingService, serviceService, employeeService },
      'biz-tour',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when provider is not found', async () => {
    const result = await handleListTourCalendarWeekLogic(
      { bookingService, serviceService, employeeService },
      'biz-tour',
      { weekStartDate: weekStart },
      'Which tours are on the calendar this week for Unknown Person?',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Could not find provider/i);
  });

  // e2e-bug.308 — empty week labels use month names, not DD/MM slash.
  it('empty English summary uses month-name week range', async () => {
    bookingService.findAll.mockResolvedValueOnce([]);
    const result = await handleListTourCalendarWeekLogic(
      { bookingService, serviceService, employeeService },
      'biz-tour',
      { weekStartDate: weekStart },
      'Any tours this week?',
    );
    expect(result.success).toBe(true);
    // The point of e2e-bug.308 is the *format* — month names, never DD/MM — so
    // the expected labels are derived from the same week the fixtures use
    // rather than hardcoded, which is what made this expire (§227).
    const monthName = (d: Date) =>
      `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
    const slash = (d: Date) =>
      `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
    const monday = currentWeekMonday();
    const sunday = new Date(monday.getTime() + 6 * DAY_MS);
    expect(result.summary).toContain(monthName(monday));
    expect(result.summary).toContain(monthName(sunday));
    expect(result.summary).not.toContain(slash(monday));
    expect(result.summary).not.toContain(slash(sunday));
  });

  // e2e-bug.270 — classifier "this week" must not throw Invalid time value.
  it.each(['this week', "this week's", 'this calendar week', 'not-a-date'])(
    'handles garbage weekStartDate=%j without throwing',
    async (garbage) => {
      const result = await handleListTourCalendarWeekLogic(
        { bookingService, serviceService, employeeService },
        'biz-tour',
        { weekStartDate: garbage },
        'Any tours this week?',
      );
      expect(result.action).toBe('list_tour_calendar_week');
      expect(result.success).toBe(true);
      expect(String(result.summary)).not.toMatch(/Invalid time value/i);
    },
  );
});
