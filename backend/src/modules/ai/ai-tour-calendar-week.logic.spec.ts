import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleListTourCalendarWeekLogic } from './ai-tour-calendar-week.logic.js';

describe('ai-tour-calendar-week.logic (ai-cmd-tour-12)', () => {
  const weekStart = '2026-06-08';
  const weekEnd = '2026-06-14';

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
    startTime: new Date('2026-06-11T08:00:00.000Z'),
    endTime: new Date('2026-06-13T18:00:00.000Z'),
    metadata: {
      paxCount: 4,
      tourStartDate: '2026-06-11',
      tourEndDate: '2026-06-13',
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
    startTime: new Date('2026-06-12T08:00:00.000Z'),
    endTime: new Date('2026-06-12T18:00:00.000Z'),
    metadata: {
      paxCount: 2,
      tourStartDate: '2026-06-12',
      tourEndDate: '2026-06-12',
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
    expect(result.summary).toMatch(/8 June 2026/);
    expect(result.summary).toMatch(/14 June 2026/);
    expect(result.summary).not.toMatch(/08\/06\/2026/);
    expect(result.summary).not.toMatch(/14\/06\/2026/);
  });

  // e2e-bug.270 — classifier "this week" must not throw Invalid time value.
  it.each([
    'this week',
    "this week's",
    'this calendar week',
    'not-a-date',
  ])(
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
