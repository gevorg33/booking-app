import { ConflictException } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from './entities/booking.entity.js';

describe('BookingService.cancel — e2e-bug.165 refund + concurrency', () => {
  const updatedAt = new Date('2026-07-16T14:55:48.900Z');

  function makeBooking(overrides: Record<string, unknown> = {}) {
    return {
      id: 'book-1',
      businessId: 'biz-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      customerId: 'cust-1',
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      startTime: new Date('2026-07-20T10:00:00.000Z'),
      endTime: new Date('2026-07-20T11:00:00.000Z'),
      cancellationReason: null,
      multiServiceGroupId: null,
      metadata: { stripePaymentIntentId: 'pi_paid' },
      updatedAt,
      employee: { id: 'emp-1', name: 'Alex' },
      service: { id: 'svc-1', name: 'Cut' },
      customer: { id: 'cust-1', name: 'Pat' },
      ...overrides,
    };
  }

  function createHarness(booking = makeBooking()) {
    let lockedBooking = { ...booking };
    const bookingRepo = {
      findOne: jest.fn(async () => ({ ...lockedBooking })),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (b: unknown) => b),
    };
    const multiServiceGroupRepo = { findOne: jest.fn() };
    const businessRepo = {
      findOne: jest.fn(async () => ({ id: 'biz-1', settings: {} })),
    };
    const eventStore = { publish: jest.fn().mockResolvedValue(undefined) };
    const subscriptionsService = {
      restoreCreditForBooking: jest.fn().mockResolvedValue(undefined),
    };
    const bookingRefundService = {
      refundBookingPayment: jest.fn().mockImplementation(
        async (_business: unknown, b: { metadata?: Record<string, unknown> }) => {
          lockedBooking = {
            ...lockedBooking,
            ...b,
            paymentStatus: PaymentStatus.REFUNDED,
            metadata: {
              ...(b.metadata ?? {}),
              stripeRefundId: 're_test',
            },
          };
          return 'refunded';
        },
      ),
    };

    const managerFindOne = jest.fn(async () => ({ ...lockedBooking }));
    const dataSource = {
      transaction: jest.fn(async (fn: (manager: unknown) => Promise<unknown>) => {
        const manager = {
          findOne: managerFindOne,
          save: jest.fn(async (b: typeof lockedBooking) => {
            lockedBooking = { ...b, updatedAt: new Date() };
            return lockedBooking;
          }),
        };
        return fn(manager);
      }),
    };

    const giftCardsService = {
      restoreRedemptionForBooking: jest.fn().mockResolvedValue(false),
    };

    const service = new BookingService(
      bookingRepo as any,
      { find: jest.fn().mockResolvedValue([]), save: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      businessRepo as any,
      {} as any,
      multiServiceGroupRepo as any,
      {} as any,
      eventStore as any,
      dataSource as any,
      {} as any,
      {} as any,
      subscriptionsService as any,
      {} as any,
      {} as any,
      bookingRefundService as any,
      giftCardsService as any,
    );

    jest
      .spyOn(service as any, 'releaseSlotsByWindow')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'reconcileStuckSlotsInWindow')
      .mockResolvedValue(undefined);

    return {
      service,
      bookingRepo,
      bookingRefundService,
      eventStore,
      subscriptionsService,
      giftCardsService,
      dataSource,
      managerFindOne,
      setLockedBooking: (next: typeof lockedBooking) => {
        lockedBooking = { ...next };
      },
      getLockedBooking: () => lockedBooking,
    };
  }

  it('refunds a paid-online booking on dashboard/staff cancel', async () => {
    const { service, bookingRefundService, eventStore } = createHarness();

    const result = await service.cancel(
      'book-1',
      'QA cancel',
      'staff-1',
    );

    expect(bookingRefundService.refundBookingPayment).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'biz-1' }),
      expect.objectContaining({
        id: 'book-1',
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.PAID,
        metadata: expect.objectContaining({ stripePaymentIntentId: 'pi_paid' }),
      }),
    );
    expect(eventStore.publish).toHaveBeenCalled();
    expect(result.booking.status).toBe(BookingStatus.CANCELLED);
    expect(result.didCancel).toBe(true);
  });

  // e2e-bug.184 — Postgres rejects `FOR UPDATE` combined with a LEFT JOIN to
  // a nullable-side relation ("FOR UPDATE cannot be applied to the nullable
  // side of an outer join"), live-reproduced when this locked findOne loaded
  // employee/service/customer relations that nothing in cancel() actually
  // reads. Mocked repos don't enforce real Postgres lock semantics, so this
  // only guards against the relations option being reintroduced.
  it('locks the booking row for update without loading relations (Postgres rejects FOR UPDATE + outer join)', async () => {
    const { service, managerFindOne } = createHarness();

    await service.cancel('book-1', 'QA cancel', 'staff-1');

    expect(managerFindOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        where: { id: 'book-1' },
        lock: { mode: 'pessimistic_write' },
      }),
    );
    const callArgs = managerFindOne.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.relations).toBeUndefined();
  });

  it('does not force paymentStatus to not_applicable when a Stripe refund is owed', async () => {
    const { service, bookingRefundService } = createHarness();
    let statusAtRefundCall: PaymentStatus | undefined;
    bookingRefundService.refundBookingPayment.mockImplementation(
      async (_business: unknown, b: { paymentStatus: PaymentStatus }) => {
        statusAtRefundCall = b.paymentStatus;
        return 'refunded';
      },
    );

    await service.cancel('book-1', 'Staff cancel');

    expect(statusAtRefundCall).toBe(PaymentStatus.PAID);
    expect(bookingRefundService.refundBookingPayment).toHaveBeenCalled();
  });

  it('skips Stripe refund for unpaid / cash bookings and sets not_applicable', async () => {
    const unpaid = makeBooking({
      paymentStatus: PaymentStatus.PENDING,
      metadata: {},
    });
    const { service, bookingRefundService, getLockedBooking } =
      createHarness(unpaid);

    await service.cancel('book-1', 'No pay cancel');

    expect(bookingRefundService.refundBookingPayment).not.toHaveBeenCalled();
    expect(getLockedBooking().paymentStatus).toBe(PaymentStatus.NOT_APPLICABLE);
  });

  it('throws BOOKING_VERSION_CONFLICT when expectedUpdatedAt mismatches', async () => {
    const { service, bookingRefundService } = createHarness();

    await expect(
      service.cancel(
        'book-1',
        'stale',
        'staff-1',
        '2026-07-16T14:00:00.000Z',
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(bookingRefundService.refundBookingPayment).not.toHaveBeenCalled();
  });

  it('does not overwrite an already-cancelled row under the lock (idempotent)', async () => {
    const already = makeBooking({
      status: BookingStatus.CANCELLED,
      cancellationReason: 'Cancelled by customer',
      paymentStatus: PaymentStatus.REFUNDED,
      metadata: {
        stripePaymentIntentId: 'pi_paid',
        stripeRefundId: 're_existing',
      },
    });
    const { service, bookingRefundService, eventStore, getLockedBooking } =
      createHarness(already);

    const result = await service.cancel(
      'book-1',
      'QA concurrency test - dashboard side',
      'staff-1',
    );

    expect(getLockedBooking().cancellationReason).toBe(
      'Cancelled by customer',
    );
    expect(eventStore.publish).not.toHaveBeenCalled();
    expect(bookingRefundService.refundBookingPayment).not.toHaveBeenCalled();
    expect(result.booking.status).toBe(BookingStatus.CANCELLED);
    expect(result.didCancel).toBe(false);
  });

  it('still attempts refund when already cancelled but Stripe refund is missing', async () => {
    const legacy = makeBooking({
      status: BookingStatus.CANCELLED,
      cancellationReason: 'Staff cancel without refund',
      paymentStatus: PaymentStatus.NOT_APPLICABLE,
      metadata: { stripePaymentIntentId: 'pi_paid' },
    });
    const { service, bookingRefundService } = createHarness(legacy);

    await service.cancel('book-1', 'Customer follow-up cancel');

    expect(bookingRefundService.refundBookingPayment).toHaveBeenCalled();
  });

  it('restores gift-card redemptions when cancel succeeds (e2e-bug.38)', async () => {
    const { service, giftCardsService, subscriptionsService } = createHarness(
      makeBooking({
        paymentStatus: PaymentStatus.PAID,
        metadata: {
          pricing: { giftCardId: 'gc-1', giftCardDiscount: 40 },
        },
      }),
    );

    await service.cancel('book-1', 'Customer cancel gift-card booking');

    expect(subscriptionsService.restoreCreditForBooking).toHaveBeenCalledWith(
      'book-1',
    );
    expect(giftCardsService.restoreRedemptionForBooking).toHaveBeenCalledWith(
      'book-1',
    );
  });

  it('does not restore gift-card balance when cancel is a no-op (e2e-bug.38)', async () => {
    const already = makeBooking({
      status: BookingStatus.CANCELLED,
      cancellationReason: 'Cancelled by customer',
      metadata: {
        pricing: { giftCardId: 'gc-1', giftCardDiscount: 40 },
      },
    });
    const { service, giftCardsService, subscriptionsService } =
      createHarness(already);

    await service.cancel('book-1', 'Second cancel');

    expect(subscriptionsService.restoreCreditForBooking).not.toHaveBeenCalled();
    expect(giftCardsService.restoreRedemptionForBooking).not.toHaveBeenCalled();
  });
});
