import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { handleExplainTourCalendarSpanLogic } from './ai-tour-calendar-span.logic.js';
describe('ai-tour-calendar-span.logic (ai-cmd-tour-11)', () => {
  const weekStart = '2026-06-08';

  const trekBooking = makeBooking({
    id: 'bk-tour-1',
    businessId: 'biz-tour',
    serviceId: 'svc-trek',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-06-11T08:00:00.000Z'),
    endTime: new Date('2026-06-13T18:00:00.000Z'),
    metadata: {
      paxCount: 4,
      tourStartDate: '2026-06-11',
      tourEndDate: '2026-06-13',
    },
    service: {
      id: 'svc-trek',
      name: '3-Day Mountain Trek',
      metadata: { serviceType: 'tour', maxGroupSize: 8 },
    },
    customer: { name: 'John Doe' },
  });

  const sameDayA = makeBooking({
    ...trekBooking,
    id: 'bk-tour-2',
    serviceId: 'svc-a',
    metadata: {
      paxCount: 2,
      tourStartDate: '2026-06-10',
      tourEndDate: '2026-06-11',
    },
    service: { id: 'svc-a', name: 'Tour A', metadata: { serviceType: 'tour' } },
  });

  const sameDayB = makeBooking({
    ...trekBooking,
    id: 'bk-tour-3',
    serviceId: 'svc-b',
    metadata: {
      paxCount: 3,
      tourStartDate: '2026-06-10',
      tourEndDate: '2026-06-12',
    },
    service: { id: 'svc-b', name: 'Tour B', metadata: { serviceType: 'tour' } },
  });

  const longTour = makeBooking({
    ...trekBooking,
    id: 'bk-tour-4',
    serviceId: 'svc-epic',
    metadata: {
      paxCount: 6,
      tourStartDate: '2026-06-08',
      tourEndDate: '2026-06-16',
    },
    service: {
      id: 'svc-epic',
      name: 'Epic Trek',
      metadata: { serviceType: 'tour' },
    },
  });

  const bookingService = {
    findAll: jest.fn(async () => [trekBooking, sameDayA, sameDayB, longTour]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains multi-day spans with column placement', async () => {
    const result = await handleExplainTourCalendarSpanLogic(
      { bookingService },
      'biz-tour',
      { weekStartDate: weekStart, aspect: 'multiDaySpan' },
      'Why do tours appear across multiple days on the provider calendar?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tour_calendar_span');
    expect(result.summary).toMatch(/tourStartDate through tourEndDate/);
    expect(result.details?.spanCount).toBeGreaterThan(0);
  });

  it('explains service color assignment', async () => {
    const result = await handleExplainTourCalendarSpanLogic(
      { bookingService },
      'biz-tour',
      { weekStartDate: weekStart, aspect: 'serviceColors' },
      'How are tour service colors assigned on the provider calendar?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/palette color/i);
    expect(result.details?.serviceColors).toBeDefined();
  });

  it('explains clipped week spans', async () => {
    const result = await handleExplainTourCalendarSpanLogic(
      { bookingService },
      'biz-tour',
      { weekStartDate: weekStart, aspect: 'clippedWeek' },
      'Why is a multi-day tour clipped at the week boundary on the calendar?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/clipped/i);
  });

  it('explains stacked departure lanes', async () => {
    const result = await handleExplainTourCalendarSpanLogic(
      { bookingService },
      'biz-tour',
      { weekStartDate: weekStart, aspect: 'stackedDepartures' },
      'Why do stacked departure lanes appear on the tour calendar?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/lane/i);
  });

  it('filters by service name', async () => {
    const result = await handleExplainTourCalendarSpanLogic(
      { bookingService },
      'biz-tour',
      {},
      'Explain how 3-Day Mountain Trek spans show on the provider calendar',
    );
    expect(result.success).toBe(true);
    expect(result.details?.serviceName).toBe('3-Day Mountain Trek');
    expect(result.details?.spanCount).toBe(1);
  });

  it('returns clarify when prompt does not match', async () => {
    const result = await handleExplainTourCalendarSpanLogic(
      { bookingService },
      'biz-tour',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
