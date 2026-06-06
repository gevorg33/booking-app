import { BookingStatus } from '../booking/entities/booking.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';
import {
  buildTourBookingMetadata,
  extractTourBookingMetadata,
  isDayLevelTour,
} from '../../common/utils/tour-service.util.js';
import { createTourPublicBookingHarness } from './public-booking-tour.harness.js';

describe('Sprint 30 — vert-tour-1.6 day-level slot selection', () => {
  const startTime = '2026-08-15T08:00:00.000Z';

  it('collapses multiple slots to one departure for multi-day day-level tours', async () => {
    const harness = createTourPublicBookingHarness();
    const slotA = new Date('2026-08-15T08:00:00.000Z');
    const slotB = new Date('2026-08-15T10:00:00.000Z');

    jest
      .spyOn(harness.service as any, 'getEmployeeStartTimes')
      .mockResolvedValue([slotA, slotB]);
    jest
      .spyOn(harness.service as any, 'filterStartTimesWithService')
      .mockImplementation(
        async (_b: string, _e: unknown, times: Date[]) => times,
      );
    (harness.service as any).employeeRepo = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 'emp-1', name: 'Guide', isActive: true, serviceIds: [] },
        ]),
    };

    const result = await harness.service.getServiceDaySlots(
      'alpine-tours',
      'svc-tour-1',
      '2026-08-15',
    );

    expect(isDayLevelTour(harness.tourService)).toBe(true);
    expect(result.slots).toHaveLength(1);
    expect(result.slots[0]?.startTime).toBe(slotA.toISOString());
  });

  it('keeps all time slots for sub-day tours without day-level flag', async () => {
    const harness = createTourPublicBookingHarness({
      tourService: {
        id: 'svc-city',
        businessId: 'biz-tour',
        name: 'Full Day City Tour',
        isActive: true,
        prepaymentMode: PrepaymentMode.NONE,
        price: 85,
        durationMinutes: 480,
        bufferMinutes: 0,
        currency: 'USD',
        metadata: { serviceType: TOUR_SERVICE_TYPE, maxGroupSize: 12 },
      },
    });
    const slots = [
      new Date('2026-08-15T08:00:00.000Z'),
      new Date('2026-08-15T09:00:00.000Z'),
      new Date('2026-08-15T10:00:00.000Z'),
    ];

    jest
      .spyOn(harness.service as any, 'getEmployeeStartTimes')
      .mockResolvedValue(slots);
    jest
      .spyOn(harness.service as any, 'filterStartTimesWithService')
      .mockImplementation(
        async (_b: string, _e: unknown, times: Date[]) => times,
      );
    (harness.service as any).employeeRepo = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 'emp-1', name: 'Guide', isActive: true, serviceIds: [] },
        ]),
    };
    (harness.service as any).serviceRepo = {
      findOne: jest.fn().mockResolvedValue(harness.tourService),
    };

    const result = await harness.service.getServiceDaySlots(
      'alpine-tours',
      'svc-city',
      '2026-08-15',
    );

    expect(isDayLevelTour(harness.tourService)).toBe(false);
    expect(result.slots).toHaveLength(3);
    expect(result.remainingSpots).toBe(12);
  });

  it('counts legacy bookings without tourStartDate via time overlap', async () => {
    const harness = createTourPublicBookingHarness();
    harness.bookingRepo.find.mockResolvedValue([
      {
        businessId: 'biz-tour',
        serviceId: 'svc-tour-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 2 },
      },
    ]);
    (harness.service as any).bookingRepo = harness.bookingRepo;

    jest
      .spyOn(harness.service as any, 'getEmployeeStartTimes')
      .mockResolvedValue([new Date('2026-08-15T08:00:00.000Z')]);
    jest
      .spyOn(harness.service as any, 'filterStartTimesWithService')
      .mockImplementation(
        async (_b: string, _e: unknown, times: Date[]) => times,
      );
    (harness.service as any).employeeRepo = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 'emp-1', name: 'Guide', isActive: true, serviceIds: [] },
        ]),
    };

    const result = await harness.service.getServiceDaySlots(
      'alpine-tours',
      'svc-tour-1',
      '2026-08-15',
    );

    expect(result.remainingSpots).toBe(6);
  });

  it('exposes dayLevelBooking on public service mapping', async () => {
    const harness = createTourPublicBookingHarness();
    const cityService = {
      id: 'svc-city',
      name: 'City Tour',
      durationMinutes: 480,
      bufferMinutes: 0,
      price: 85,
      currency: 'USD',
      prepaymentMode: PrepaymentMode.NONE,
      metadata: { serviceType: TOUR_SERVICE_TYPE },
      category: null,
    };
    (harness.service as any).serviceRepo = {
      find: jest.fn().mockResolvedValue([harness.tourService, cityService]),
    };
    (harness.service as any).subscriptionsService = {
      serviceIdsWithActivePlans: jest.fn().mockResolvedValue([]),
    };

    const { services } = await harness.service.getServices(
      'alpine-tours',
      undefined,
      'en',
    );

    const trek = services.find((s) => s.id === 'svc-tour-1');
    const city = services.find((s) => s.id === 'svc-city');
    expect(trek?.dayLevelBooking).toBe(true);
    expect(city?.dayLevelBooking).toBe(false);
  });
});

describe('Sprint 30 — vert-tour-1.8 tour booking record metadata', () => {
  const startTime = '2026-08-15T08:00:00.000Z';

  it('stores same start and end date for single-day tours', async () => {
    const harness = createTourPublicBookingHarness({
      tourService: {
        id: 'svc-day',
        businessId: 'biz-tour',
        name: 'Day Hike',
        isActive: true,
        prepaymentMode: PrepaymentMode.NONE,
        price: 120,
        durationMinutes: 1440,
        bufferMinutes: 0,
        currency: 'USD',
        metadata: {
          serviceType: TOUR_SERVICE_TYPE,
          durationDays: 1,
          maxGroupSize: 10,
        },
      },
    });
    (harness.service as any).serviceRepo = {
      findOne: jest.fn().mockResolvedValue(harness.tourService),
    };

    await harness.service.createBooking('alpine-tours', {
      employeeId: 'emp-1',
      serviceId: 'svc-day',
      startTime,
      paxCount: 2,
      customer: { name: 'Alex', email: 'alex@example.com' },
    });

    expect(harness.bookingService.create).toHaveBeenCalledWith(
      harness.business.id,
      expect.objectContaining({
        metadata: expect.objectContaining({
          tourStartDate: '2026-08-15',
          tourEndDate: '2026-08-15',
          paxCount: 2,
        }),
      }),
      undefined,
      expect.any(Object),
    );
  });

  it('omits specialRequirements when notes are blank', async () => {
    const harness = createTourPublicBookingHarness();

    await harness.service.createBooking('alpine-tours', {
      employeeId: 'emp-1',
      serviceId: 'svc-tour-1',
      startTime,
      paxCount: 1,
      customer: { name: 'Alex', email: 'alex@example.com' },
    });

    const call = harness.bookingService.create.mock.calls[0]?.[1] as {
      metadata?: Record<string, unknown>;
    };
    expect(call.metadata?.specialRequirements).toBeUndefined();
  });

  it('uses singular spot message when one seat remains', async () => {
    const harness = createTourPublicBookingHarness();
    harness.bookingRepo.find.mockResolvedValue([
      {
        businessId: 'biz-tour',
        serviceId: 'svc-tour-1',
        status: BookingStatus.CONFIRMED,
        metadata: { paxCount: 7, tourStartDate: '2026-08-15' },
      },
    ]);
    (harness.service as any).bookingRepo = harness.bookingRepo;

    await expect(
      harness.service.createBooking('alpine-tours', {
        employeeId: 'emp-1',
        serviceId: 'svc-tour-1',
        startTime,
        paxCount: 2,
        customer: { name: 'Alex', email: 'alex@example.com' },
      }),
    ).rejects.toThrow('Only 1 spot remaining');
  });

  it('persists metadata for tours without max group size cap', async () => {
    const harness = createTourPublicBookingHarness({
      tourService: {
        id: 'svc-open',
        businessId: 'biz-tour',
        name: 'Open Trek',
        isActive: true,
        prepaymentMode: PrepaymentMode.NONE,
        price: 200,
        durationMinutes: 2880,
        bufferMinutes: 0,
        currency: 'USD',
        metadata: {
          serviceType: TOUR_SERVICE_TYPE,
          durationDays: 2,
        },
      },
    });
    (harness.service as any).serviceRepo = {
      findOne: jest.fn().mockResolvedValue(harness.tourService),
    };

    const result = await harness.service.createBooking('alpine-tours', {
      employeeId: 'emp-1',
      serviceId: 'svc-open',
      startTime,
      paxCount: 5,
      customer: { name: 'Alex', email: 'alex@example.com' },
    });

    expect(
      extractTourBookingMetadata(
        result.booking.metadata as Record<string, unknown>,
      ),
    ).toEqual({
      paxCount: 5,
      tourStartDate: '2026-08-15',
      tourEndDate: '2026-08-16',
    });
  });

  it.each([
    { durationDays: 3, tourEndDate: '2026-08-17' },
    { durationDays: 5, tourEndDate: '2026-08-19' },
    { durationDays: 7, tourEndDate: '2026-08-21' },
  ])(
    'computes $durationDays-day tour end date $tourEndDate',
    ({ durationDays, tourEndDate }) => {
      const meta = buildTourBookingMetadata({
        paxCount: 1,
        startTime: new Date(startTime),
        durationMinutes: durationDays * 1440,
        durationDays,
      });
      expect(meta.tourStartDate).toBe('2026-08-15');
      expect(meta.tourEndDate).toBe(tourEndDate);
    },
  );
});
