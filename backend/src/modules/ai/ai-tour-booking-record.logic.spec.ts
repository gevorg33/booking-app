import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { handleExplainTourBookingRecordLogic } from './ai-tour-booking-record.logic.js';

describe('ai-tour-booking-record.logic (ai-cmd-tour-7)', () => {
  const tourStartDate = addDaysToDateKey(getTodayDateKey(), 10, 'UTC');
  const tourEndDate = addDaysToDateKey(tourStartDate, 2, 'UTC');

  const tourBooking = makeBooking({
    id: 'bk-tour-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    serviceId: 'svc-2',
    status: BookingStatus.CONFIRMED,
    startTime: new Date(`${tourStartDate}T08:00:00.000Z`),
    endTime: new Date(`${tourEndDate}T18:00:00.000Z`),
    metadata: {
      paxCount: 6,
      tourStartDate,
      tourEndDate,
      specialRequirements: 'Vegetarian meals',
    },
    service: {
      name: '3-Day Mountain Trek',
      metadata: { serviceType: 'tour', maxGroupSize: 8 },
    },
    customer: { name: 'John Doe' },
  });

  const bookingService = {
    findAll: jest.fn(async () => [tourBooking]),
    findOne: jest.fn(async (id: string) => {
      if (id === 'bk-tour-1') return tourBooking;
      throw new Error('not found');
    }),
  };

  const deps = () => ({ bookingService });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains pax, dates, special requirements, and calendar span by booking id', async () => {
    const result = await handleExplainTourBookingRecordLogic(
      deps(),
      'biz-1',
      {},
      'Explain tour booking record for booking bk-tour-1 — pax and dates',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tour_booking_record');
    expect(result.summary).toContain('paxCount 6');
    expect(result.summary).toContain('tourStartDate');
    expect(result.summary).toContain('Vegetarian meals');
    expect(result.summary).toContain('provider calendar');
    expect(result.details).toMatchObject({
      bookingId: 'bk-tour-1',
      paxCount: 6,
      tourStartDate,
      tourEndDate,
      specialRequirements: 'Vegetarian meals',
      calendarSpanDays: 3,
    });
  });

  it('resolves booking by customer name', async () => {
    const result = await handleExplainTourBookingRecordLogic(
      deps(),
      'biz-1',
      {},
      "Show pax count and special requirements for John Doe's 3-Day Mountain Trek booking",
    );

    expect(result.success).toBe(true);
    expect(result.details).toMatchObject({
      customerName: 'John Doe',
      paxCount: 6,
    });
  });

  it('focuses on calendar span aspect', async () => {
    const result = await handleExplainTourBookingRecordLogic(
      deps(),
      'biz-1',
      {},
      'Why does this tour booking span multiple days on the provider calendar?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('provider calendar');
    expect(result.details?.aspect).toBe('calendarSpan');
  });

  it('returns confirmation number for customer self-service prompt', async () => {
    const result = await handleExplainTourBookingRecordLogic(
      deps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      "What's my tour confirmation number?",
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('bk-tour-1');
    expect(result.details?.aspect).toBe('confirmationNumber');
  });

  it('scopes customer lookup to session customer bookings', async () => {
    bookingService.findAll.mockResolvedValueOnce([
      tourBooking,
      {
        ...tourBooking,
        id: 'bk-tour-other',
        customerId: 'cust-2',
      },
    ]);

    const result = await handleExplainTourBookingRecordLogic(
      deps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Summarize my group booking',
    );

    expect(result.success).toBe(true);
    expect(result.details?.bookingId).toBe('bk-tour-1');
  });

  it('fails when booking is not a tour', async () => {
    bookingService.findOne.mockResolvedValueOnce({
      ...tourBooking,
      id: 'bk-salon-1',
      metadata: {},
      service: { name: 'Haircut', metadata: {} },
    });

    const result = await handleExplainTourBookingRecordLogic(
      deps(),
      'biz-1',
      { bookingId: 'bk-salon-1' },
      'Explain tour booking record for booking bk-salon-1',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not a tour booking');
  });
});
