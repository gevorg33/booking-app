import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import { handleExplainTourDaySlotsLogic } from './ai-tour-day-slots.logic.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';

describe('ai-tour-day-slots.logic', () => {
  const mountainTrek = makeService({
    id: 'svc-mountain',
    name: '3-Day Mountain Trek',
    price: 320,
    currency: 'USD',
    durationMinutes: 4320,
    metadata: {
      serviceType: TOUR_SERVICE_TYPE,
      maxGroupSize: 8,
      durationDays: 3,
    },
  });

  const cityTour = makeService({
    id: 'svc-city',
    name: 'Full Day City Tour',
    price: 85,
    currency: 'USD',
    durationMinutes: 480,
    metadata: {
      serviceType: TOUR_SERVICE_TYPE,
      maxGroupSize: 12,
    },
  });

  const massage = makeService({
    id: 'svc-massage',
    name: 'Swedish Massage',
    price: 60,
    currency: 'USD',
    durationMinutes: 60,
    metadata: {},
  });

  const bookingService = {
    findAll: jest.fn(async () => [
      makeBooking({
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 3, tourStartDate: '2026-08-15' },
      }),
    ]),
  };

  const serviceService = {
    findAll: jest.fn(async () => [mountainTrek, cityTour, massage]),
  };

  const deps = () => ({ serviceService, bookingService });

  beforeEach(() => {
    jest.clearAllMocks();
    serviceService.findAll.mockImplementation(async () => [
      mountainTrek,
      cityTour,
      massage,
    ]);
    bookingService.findAll.mockImplementation(async () => [
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 3, tourStartDate: '2026-08-15' },
      },
    ]);
  });

  it('explains one departure per day for day-level tours', async () => {
    const result = await handleExplainTourDaySlotsLogic(
      deps(),
      'biz-1',
      { serviceName: '3-Day Mountain Trek', aspect: 'oneDeparture' },
      'Why does the 3-Day Mountain Trek only show one departure per day?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('one departure per calendar day');
    expect(result.details?.dayLevelBooking).toBe(true);
  });

  it('explains remainingSpots for a departure date', async () => {
    const result = await handleExplainTourDaySlotsLogic(
      deps(),
      'biz-1',
      {
        serviceName: '3-Day Mountain Trek',
        date: '2026-08-15',
        aspect: 'remainingSpots',
      },
      'How many spots are left on 15/08/2026 for the 3-Day Mountain Trek?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('remainingSpots');
    expect(result.details?.remainingSpots).toBe(5);
    expect(result.details?.bookedPax).toBe(3);
  });

  it('explains fully booked dates with no slots', async () => {
    bookingService.findAll.mockImplementation(async () => [
      {
        id: 'bk-full',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        metadata: { paxCount: 8, tourStartDate: '2026-08-15' },
      },
    ]);

    const result = await handleExplainTourDaySlotsLogic(
      deps(),
      'biz-1',
      {
        serviceName: '3-Day Mountain Trek',
        date: '2026-08-15',
        aspect: 'fullyBooked',
      },
      'Why is 15/08/2026 fully booked for the mountain trek?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('fully booked');
    expect(result.details?.fullyBooked).toBe(true);
    expect(result.details?.remainingSpots).toBe(0);
  });

  it('explains sub-day tours without day-level collapse', async () => {
    const result = await handleExplainTourDaySlotsLogic(
      deps(),
      'biz-1',
      { serviceName: 'Full Day City Tour', aspect: 'oneDeparture' },
      'On the booking page, why does Full Day City Tour keep every time slot instead of one departure per day?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('every bookable time slot');
    expect(result.details?.dayLevelBooking).toBe(false);
  });

  it('explains remainingSpots label without a named tour', async () => {
    const result = await handleExplainTourDaySlotsLogic(
      deps(),
      'biz-1',
      { aspect: 'remainingSpots' },
      'What does remaining spots mean on this tour booking page?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('remainingSpots');
  });

  it('clarifies when prompt does not match', async () => {
    const result = await handleExplainTourDaySlotsLogic(
      deps(),
      'biz-1',
      { aspect: 'remainingSpots' },
      'Show me all services on the booking page',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
