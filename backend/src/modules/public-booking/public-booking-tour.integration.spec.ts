import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { ForbiddenException } from '@nestjs/common';
import { createTourPublicBookingHarness } from './public-booking-tour.harness.js';

/**
 * e2e-bug.491's class — same expiry as `public-booking-tour-16-18`.
 *
 * `getServiceDaySlots` returns nothing for a day that has passed, so a
 * hardcoded 2026-08-15 stopped producing slots and the assertions saw empty
 * arrays. Anchored ahead of today; the times of day stay fixed because slot
 * identity is asserted.
 */
const dayKeyIn = (n: number): string =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const TOUR_DAY = dayKeyIn(10);
const TOUR_DAY_2 = dayKeyIn(12);
const TOUR_DAY_3 = dayKeyIn(13);

describe('Public booking tour integration', () => {
  const startTime = `${TOUR_DAY}T08:00:00.000Z`;

  it('creates tour booking with pax metadata and per-person pricing', async () => {
    const harness = createTourPublicBookingHarness();

    const result = await harness.service.createBooking('alpine-tours', {
      employeeId: 'emp-1',
      serviceId: 'svc-tour-1',
      startTime,
      paxCount: 3,
      notes: 'Vegetarian meals',
      customer: { name: 'Alex', email: 'alex@example.com' },
    });

    expect(
      harness.bookingPaymentService.resolveCheckoutPricing,
    ).toHaveBeenCalledWith(
      harness.business.id,
      harness.tourService,
      expect.objectContaining({ paxCount: 3 }),
      undefined,
    );
    expect(harness.bookingService.create).toHaveBeenCalledWith(
      harness.business.id,
      expect.objectContaining({
        notes: 'Vegetarian meals',
        metadata: expect.objectContaining({
          paxCount: 3,
          pricePerPerson: 320,
          tourStartDate: TOUR_DAY,
          tourEndDate: TOUR_DAY_2,
          specialRequirements: 'Vegetarian meals',
        }),
      }),
      undefined,
      expect.any(Object),
    );
    expect(result.booking.metadata).toMatchObject({ paxCount: 3 });
  });

  it('passes paxCount through tour checkout quote', async () => {
    const harness = createTourPublicBookingHarness();

    await harness.service.quoteCheckout('alpine-tours', {
      serviceId: 'svc-tour-1',
      paxCount: 6,
    });

    expect(
      harness.bookingPaymentService.resolveCheckoutPricing,
    ).toHaveBeenCalledWith(
      harness.business.id,
      harness.tourService,
      expect.objectContaining({ paxCount: 6 }),
      undefined,
    );
  });

  it('rejects tour booking when requested pax exceeds remaining capacity', async () => {
    const harness = createTourPublicBookingHarness();
    harness.bookingRepo.find.mockResolvedValue([
      {
        businessId: 'biz-tour',
        serviceId: 'svc-tour-1',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(startTime),
        endTime: new Date(`${TOUR_DAY_3}T08:00:00.000Z`),
        metadata: { paxCount: 6, tourStartDate: TOUR_DAY },
      },
    ]);
    (harness.service as any).bookingRepo = harness.bookingRepo;

    await expect(
      harness.service.createBooking('alpine-tours', {
        employeeId: 'emp-1',
        serviceId: 'svc-tour-1',
        startTime,
        paxCount: 4,
        customer: { name: 'Alex', email: 'alex@example.com' },
      }),
    ).rejects.toThrow('Only 2 spots remaining');
  });

  it('rejects tour booking when date is fully booked', async () => {
    const harness = createTourPublicBookingHarness();
    harness.bookingRepo.find.mockResolvedValue([
      {
        businessId: 'biz-tour',
        serviceId: 'svc-tour-1',
        status: BookingStatus.CONFIRMED,
        metadata: { paxCount: 8, tourStartDate: TOUR_DAY },
      },
    ]);
    (harness.service as any).bookingRepo = harness.bookingRepo;

    await expect(
      harness.service.createBooking('alpine-tours', {
        employeeId: 'emp-1',
        serviceId: 'svc-tour-1',
        startTime,
        paxCount: 1,
        customer: { name: 'Alex', email: 'alex@example.com' },
      }),
    ).rejects.toThrow('fully booked');
  });

  it('clamps pax to max group size when over-requested', async () => {
    const harness = createTourPublicBookingHarness();

    await harness.service.createBooking('alpine-tours', {
      employeeId: 'emp-1',
      serviceId: 'svc-tour-1',
      startTime,
      paxCount: 20,
      customer: { name: 'Alex', email: 'alex@example.com' },
    });

    expect(harness.bookingService.create).toHaveBeenCalledWith(
      harness.business.id,
      expect.objectContaining({
        metadata: expect.objectContaining({ paxCount: 8 }),
      }),
      undefined,
      expect.any(Object),
    );
  });

  it('returns day-level slot and remaining spots for capped tours', async () => {
    const harness = createTourPublicBookingHarness();
    const slotA = new Date(`${TOUR_DAY}T08:00:00.000Z`);
    const slotB = new Date(`${TOUR_DAY}T09:00:00.000Z`);

    jest
      .spyOn(harness.service as any, 'getEmployeeStartTimes')
      .mockResolvedValue([slotA, slotB]);
    jest
      .spyOn(harness.service as any, 'filterStartTimesWithService')
      .mockImplementation(
        async (_businessId: string, _employee: unknown, times: Date[]) => times,
      );

    harness.bookingRepo.find.mockResolvedValue([
      {
        businessId: 'biz-tour',
        serviceId: 'svc-tour-1',
        status: BookingStatus.CONFIRMED,
        metadata: { paxCount: 3, tourStartDate: TOUR_DAY },
      },
    ]);
    (harness.service as any).bookingRepo = harness.bookingRepo;
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
      TOUR_DAY,
    );

    expect(result.slots).toHaveLength(1);
    expect(result.slots[0]?.startTime).toBe(slotA.toISOString());
    expect(result.remainingSpots).toBe(5);
  });

  it('returns empty slots when tour date has no remaining capacity', async () => {
    const harness = createTourPublicBookingHarness();

    jest
      .spyOn(harness.service as any, 'getEmployeeStartTimes')
      .mockResolvedValue([new Date(`${TOUR_DAY}T08:00:00.000Z`)]);
    jest
      .spyOn(harness.service as any, 'filterStartTimesWithService')
      .mockImplementation(
        async (_businessId: string, _employee: unknown, times: Date[]) => times,
      );

    harness.bookingRepo.find.mockResolvedValue([
      {
        businessId: 'biz-tour',
        serviceId: 'svc-tour-1',
        status: BookingStatus.CONFIRMED,
        metadata: { paxCount: 8, tourStartDate: TOUR_DAY },
      },
    ]);
    (harness.service as any).bookingRepo = harness.bookingRepo;
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
      TOUR_DAY,
    );

    expect(result.slots).toEqual([]);
    expect(result.remainingSpots).toBe(0);
  });

  it('rejects disabled public booking like standard flow', async () => {
    const harness = createTourPublicBookingHarness();
    harness.business.settings = {
      ...harness.business.settings,
      publicBooking: { enabled: false },
    };

    await expect(
      harness.service.createBooking('alpine-tours', {
        employeeId: 'emp-1',
        serviceId: 'svc-tour-1',
        startTime,
        customer: { name: 'Alex', email: 'alex@example.com' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
