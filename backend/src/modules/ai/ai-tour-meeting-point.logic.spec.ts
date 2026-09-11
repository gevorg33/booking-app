import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';
import {
  buildExplainTourMeetingPointSummary,
  handleExplainTourMeetingPointLogic,
} from './ai-tour-meeting-point.logic.js';

describe('ai-tour-meeting-point.logic (ai-cmd-customer-4.10.6)', () => {
  const tourStartDate = addDaysToDateKey(getTodayDateKey(), 10, 'UTC');

  const tourBooking = makeBooking({
    id: 'bk-tour-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    serviceId: 'svc-wine',
    status: BookingStatus.CONFIRMED,
    startTime: new Date(`${tourStartDate}T08:00:00.000Z`),
    endTime: new Date(`${tourStartDate}T18:00:00.000Z`),
    metadata: {
      paxCount: 4,
      tourStartDate,
    },
    service: {
      id: 'svc-wine',
      name: 'Wine Country',
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        meetingPoint: 'Central Plaza fountain',
        maxGroupSize: 10,
      },
    },
  });

  const services = [
    tourBooking.service,
    makeService({
      id: 'svc-mountain',
      name: 'Mountain Trek',
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        meetingPoint: 'Trailhead parking lot',
        maxGroupSize: 8,
      },
    }),
    makeService({
      id: 'svc-city',
      name: 'City Tour',
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        meetingPoint: 'Main hotel lobby',
      },
    }),
  ];

  const bookingService = {
    findAll: jest.fn(async () => [tourBooking]),
    findOne: jest.fn(async (id: string) => {
      if (id === 'bk-tour-1') return tourBooking;
      throw new Error('not found');
    }),
  };

  const serviceService = {
    findAll: jest.fn(async () => services),
  };

  const deps = () => ({ bookingService, serviceService });

  beforeEach(() => {
    jest.clearAllMocks();
    bookingService.findAll.mockResolvedValue([tourBooking]);
    serviceService.findAll.mockResolvedValue(services);
  });

  it('explains meeting point from session booking', async () => {
    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Where do we meet for my tour?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_tour_meeting_point');
    expect(result.summary).toContain('Central Plaza fountain');
    expect(result.details).toMatchObject({
      aspect: 'meeting_point',
      bookingId: 'bk-tour-1',
      meetingPoint: 'Central Plaza fountain',
    });
  });

  it('explains arrival time for named tour catalog service', async () => {
    bookingService.findAll.mockResolvedValueOnce([]);

    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      {},
      'What time should I arrive for my Mountain Trek?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Mountain Trek');
    expect(result.summary).toContain('book a departure slot');
    expect(result.details?.aspect).toBe('arrival_time');
  });

  it('explains meeting point and arrival time together', async () => {
    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Where do we meet and what time should I arrive for Wine Country tour?',
    );

    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('all');
    expect(result.summary).toContain('Central Plaza fountain');
    expect(result.summary).toContain('arrive by');
  });

  it('resolves catalog service on public booking page', async () => {
    bookingService.findAll.mockResolvedValueOnce([]);

    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      {},
      'Where is the meeting point for Wine Country tour on this booking page?',
    );

    expect(result.success).toBe(true);
    expect(result.details?.serviceName).toBe('Wine Country');
    expect(result.summary).toContain('Central Plaza fountain');
  });

  it('returns clarify when no tour service or booking is found', async () => {
    bookingService.findAll.mockResolvedValueOnce([]);
    serviceService.findAll.mockResolvedValueOnce([]);

    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      {},
      'Where do we meet for my tour?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('rejects non-tour services without a booking', async () => {
    bookingService.findAll.mockResolvedValueOnce([]);
    serviceService.findAll.mockResolvedValueOnce([
      {
        id: 'svc-city',
        name: 'City Tour',
        metadata: { serviceType: 'appointment' },
      },
    ]);

    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      {},
      'Where is the meeting point for City Tour on this booking page?',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not configured as a tour');
  });

  it('loads meeting details by explicit booking id', async () => {
    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      { bookingId: 'bk-tour-1', sessionCustomerId: 'cust-1' },
      'What time do I need to arrive for my booked tour tomorrow?',
    );

    expect(result.success).toBe(true);
    expect(result.details?.bookingId).toBe('bk-tour-1');
    expect(result.summary).toContain('arrive by');
  });

  it('rejects booking id owned by another customer', async () => {
    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      { bookingId: 'bk-tour-1', sessionCustomerId: 'cust-other' },
      'Where do we meet for my tour?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns clarify when prompt is not a meeting point question', async () => {
    const result = await handleExplainTourMeetingPointLogic(
      deps(),
      'biz-1',
      {},
      'What is the max group size for City Tour?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('builds summary fragments per aspect', () => {
    expect(
      buildExplainTourMeetingPointSummary({
        serviceName: 'City Tour',
        meetingPoint: 'Main hotel lobby',
        arrivalTimeIso: `${tourStartDate}T08:00:00.000Z`,
        aspect: 'all',
        hasBooking: true,
        timeZone: 'UTC',
      }),
    ).toContain('Main hotel lobby');
    expect(
      buildExplainTourMeetingPointSummary({
        serviceName: 'City Tour',
        meetingPoint: null,
        aspect: 'meeting_point',
        hasBooking: false,
      }),
    ).toContain('no meeting point is listed');
  });
});
