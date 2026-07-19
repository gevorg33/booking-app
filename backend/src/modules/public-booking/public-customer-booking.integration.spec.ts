import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import {
  ensureBookingManageToken,
  validateBookingManageToken,
} from '../../common/utils/booking-manage-token.util.js';
import { buildSequentialAppointments } from '../../common/utils/multi-service-booking.util.js';
import {
  applyCustomerSelfServiceToBusinessSettings,
  applyPublicPaymentSettingsToBusinessSettings,
  resolveCustomerSelfServiceSettings,
  resolvePublicPaymentSettings,
} from '../../common/utils/customer-self-service.util.js';

describe('Public customer booking self-service integration', () => {
  const futureStart = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const business = {
    id: 'biz-1',
    slug: 'salon',
    isActive: true,
    settings: applyPublicPaymentSettingsToBusinessSettings(
      applyCustomerSelfServiceToBusinessSettings(
        { locale: 'en' },
        {
          allowCancel: true,
          allowReschedule: true,
          minimumNoticeHours: 24,
          maxReschedulesPerBooking: 2,
        },
      ),
      { acceptCashPayments: true },
    ),
  };

  type StoredBooking = {
    id: string;
    businessId: string;
    customerId: string;
    employeeId: string;
    serviceId: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    startTime: Date;
    endTime: Date;
    packagePurchaseId?: string | null;
    metadata: Record<string, unknown>;
    employee?: { name: string };
    service?: {
      name: string;
      durationMinutes?: number;
      bufferMinutes?: number;
    };
    customer?: { email: string | null };
  };

  const bookings = new Map<string, StoredBooking>();
  const reviews: Array<{
    bookingId: string;
    businessId: string;
    customerId: string;
  }> = [];

  const businessService = {
    findBySlug: jest.fn(async (slug: string) => {
      if (slug !== business.slug)
        throw new NotFoundException('Business not found');
      return business;
    }),
  };

  const bookingRepo = {
    findOne: jest.fn(
      async ({
        where,
        relations: _relations,
      }: {
        where: Record<string, unknown>;
        relations?: unknown;
      }) => {
        if (where.id) {
          const booking = bookings.get(String(where.id));
          if (!booking) return null;
          if (where.businessId && booking.businessId !== where.businessId)
            return null;
          if (where.customerId && booking.customerId !== where.customerId)
            return null;
          return { ...booking };
        }
        return null;
      },
    ),
    find: jest.fn(
      async ({
        where,
      }: {
        where: {
          businessId?: string;
          customerId?: string;
          packagePurchaseId?: string;
        };
      }) => {
        let list = [...bookings.values()];
        if (where.businessId) {
          list = list.filter((b) => b.businessId === where.businessId);
        }
        if (where.customerId) {
          list = list.filter((b) => b.customerId === where.customerId);
        }
        if (where.packagePurchaseId) {
          list = list.filter(
            (b) => b.packagePurchaseId === where.packagePurchaseId,
          );
        }
        return list.sort(
          (a, b) => a.startTime.getTime() - b.startTime.getTime(),
        );
      },
    ),
    save: jest.fn(async (booking: StoredBooking) => {
      bookings.set(booking.id, { ...booking });
      return booking;
    }),
    // api-bug.6 — ensureBookingManageToken uses manager.transaction + FOR UPDATE
    manager: {
      transaction: jest.fn(async (cb: (m: unknown) => Promise<unknown>) => {
        const manager = {
          createQueryBuilder: () => ({
            setLock: () => ({
              where: (_clause: string, params: { bookingId: string }) => ({
                getOne: async () => {
                  const row = bookings.get(params.bookingId);
                  return row ? { ...row, metadata: { ...row.metadata } } : null;
                },
              }),
            }),
          }),
          save: async (_entity: unknown, booking: StoredBooking) => {
            bookings.set(booking.id, { ...booking });
            return booking;
          },
        };
        return cb(manager);
      }),
    },
  };

  const reviewRepo = {
    find: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const bookingIdClause = where.bookingId as
        | { _value?: string[] }
        | undefined;
      const allowedIds = bookingIdClause?._value;
      return reviews.filter(
        (r) =>
          r.businessId === where.businessId &&
          r.customerId === where.customerId &&
          (!allowedIds || allowedIds.includes(r.bookingId)),
      );
    }),
  };

  const customerRepo = {
    findOne: jest.fn(
      async ({
        where,
      }: {
        where: { id: string; businessId: string; isActive: boolean };
      }) => {
        if (
          where.id === 'cust-1' &&
          where.businessId === business.id &&
          where.isActive
        ) {
          return {
            id: 'cust-1',
            businessId: business.id,
            name: 'Jane',
            email: 'jane@example.com',
            isActive: true,
          };
        }
        return null;
      },
    ),
  };

  const eventStore = { publish: jest.fn().mockResolvedValue(undefined) };
  const bookingService = {
    cancel: jest.fn(async (id: string, reason: string, userId?: string) => {
      const booking = bookings.get(id);
      if (!booking) throw new NotFoundException('Booking not found');
      const didCancel = booking.status !== BookingStatus.CANCELLED;
      booking.status = BookingStatus.CANCELLED;
      booking.metadata = {
        ...booking.metadata,
        cancelReason: reason,
        cancelledBy: userId,
      };
      bookings.set(id, booking);
      if (didCancel) {
        await eventStore.publish({
          eventType: 'booking.cancelled',
          aggregateId: id,
          payload: { reason, userId },
        });
      }
      return { booking: { ...booking }, didCancel };
    }),
    update: jest.fn(
      async (
        id: string,
        dto: {
          startTime: string;
          employeeId?: string;
          metadata?: Record<string, unknown>;
        },
        userId?: string,
        _internal?: { skipGroupReschedule?: boolean },
      ) => {
        const booking = bookings.get(id);
        if (!booking) throw new NotFoundException('Booking not found');
        booking.startTime = new Date(dto.startTime);
        booking.endTime = new Date(booking.startTime.getTime() + 3600000);
        if (dto.employeeId) booking.employeeId = dto.employeeId;
        booking.metadata = {
          ...booking.metadata,
          ...dto.metadata,
          rescheduledBy: userId,
        };
        bookings.set(id, booking);
        await eventStore.publish({
          eventType: 'booking.rescheduled',
          aggregateId: id,
          payload: { newStartTime: dto.startTime, userId },
        });
        return { ...booking };
      },
    ),
    validateMultiServiceBlockFits: jest.fn().mockResolvedValue(undefined),
    rescheduleSameVisitBlock: jest.fn(
      async (
        segments: Array<{
          bookingId: string;
          startTime: string;
          employeeId: string;
          metadata?: Record<string, unknown>;
        }>,
        userId?: string,
      ) => {
        const updated: StoredBooking[] = [];
        for (const segment of segments) {
          const booking = bookings.get(segment.bookingId);
          if (!booking) throw new NotFoundException('Booking not found');
          booking.startTime = new Date(segment.startTime);
          booking.endTime = new Date(booking.startTime.getTime() + 3600000);
          booking.employeeId = segment.employeeId;
          booking.metadata = {
            ...booking.metadata,
            ...segment.metadata,
            rescheduledBy: userId,
          };
          bookings.set(booking.id, booking);
          await eventStore.publish({
            eventType: 'booking.rescheduled',
            aggregateId: booking.id,
            payload: { newStartTime: segment.startTime, userId },
          });
          updated.push({ ...booking });
        }
        return updated;
      },
    ),
  };

  const notificationsService = {
    sendBookingCancellation: jest.fn().mockResolvedValue(undefined),
    sendBusinessCustomerBookingChange: jest.fn().mockResolvedValue(undefined),
  };
  const configService = { get: jest.fn(() => 'https://app.test') };
  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(() => ({ turnoverBufferMinutes: 5 })),
  };
  const jwtService = {
    sign: jest.fn(() => 'jwt-token'),
  } as unknown as JwtService;

  const bookingRefundService = {
    refundBookingPayment: jest.fn(async (_business: unknown, booking: any) => {
      const metadata = booking.metadata ?? {};
      if (metadata.stripeRefundId) return 'already_refunded';
      if (!metadata.stripePaymentIntentId) return 'skipped';
      booking.metadata = { ...metadata, stripeRefundId: 're_test' };
      booking.paymentStatus = PaymentStatus.REFUNDED;
      bookings.set(booking.id, booking);
      return 'refunded';
    }),
  };

  type StoredPackagePurchase = {
    id: string;
    metadata: Record<string, unknown>;
  };
  const packagePurchases = new Map<string, StoredPackagePurchase>();

  const packagePurchaseRepo = {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) => {
      return packagePurchases.get(where.id) ?? null;
    }),
  };

  const packageRefundService = {
    refundPackagePayment: jest.fn(async (_business: unknown, purchase: any) => {
      const metadata = purchase.metadata ?? {};
      if (metadata.stripeRefundId) return 'already_refunded';
      if (!metadata.stripePaymentIntentId) return 'skipped';
      purchase.metadata = { ...metadata, stripeRefundId: 're_test' };
      packagePurchases.set(purchase.id, purchase);
      return 'refunded';
    }),
  };

  const publicCustomerBookingService = new PublicCustomerBookingService(
    businessService as any,
    bookingService as any,
    bookingRefundService as any,
    packageRefundService as any,
    notificationsService as any,
    configService as any,
    multiServiceBookingsService as any,
    bookingRepo as any,
    packagePurchaseRepo as any,
  );

  const giftCardPurchaseService = {
    linkGuestPurchasesToCustomer: jest.fn().mockResolvedValue(undefined),
  };

  const eventEmitter = { emit: jest.fn() };

  const publicCustomerAuthService = new PublicCustomerAuthService(
    businessService as any,
    jwtService,
    { isReady: false } as any,
    publicCustomerBookingService,
    {} as any,
    giftCardPurchaseService as any,
    eventEmitter as any,
    customerRepo as any,
    bookingRepo as any,
    reviewRepo as any,
  );

  function seedBooking(overrides: Partial<StoredBooking> = {}): StoredBooking {
    const booking: StoredBooking = {
      id: overrides.id ?? `book-${bookings.size + 1}`,
      businessId: business.id,
      customerId: 'cust-1',
      employeeId: 'emp-1',
      serviceId: 'svc-1',
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      startTime: futureStart,
      endTime: new Date(futureStart.getTime() + 3600000),
      packagePurchaseId: null,
      metadata: {},
      employee: { name: 'Alex' },
      service: { name: 'Haircut', durationMinutes: 30, bufferMinutes: 0 },
      customer: { email: 'jane@example.com' },
      ...overrides,
    };
    bookings.set(booking.id, booking);
    return booking;
  }

  function seedPackageVisit(): {
    anchor: StoredBooking;
    second: StoredBooking;
  } {
    const purchaseId = 'purchase-1';
    const blockStart = futureStart;
    const anchor = seedBooking({
      id: 'pkg-1',
      packagePurchaseId: purchaseId,
      serviceId: 'svc-facial',
      service: { name: 'Facial', durationMinutes: 30, bufferMinutes: 0 },
      metadata: {
        packageId: 'pkg-catalog-1',
        packageName: 'Glow package',
        manageToken: 'pkg-manage-token',
      },
      startTime: blockStart,
      endTime: new Date(blockStart.getTime() + 30 * 60 * 1000),
    });
    const sequential = buildSequentialAppointments(
      [
        { serviceId: 'svc-facial', durationMinutes: 30, bufferMinutes: 0 },
        { serviceId: 'svc-massage', durationMinutes: 20, bufferMinutes: 0 },
      ],
      blockStart,
      5,
    );
    const second = seedBooking({
      id: 'pkg-2',
      packagePurchaseId: purchaseId,
      serviceId: 'svc-massage',
      service: { name: 'Massage', durationMinutes: 20, bufferMinutes: 0 },
      metadata: { packageId: 'pkg-catalog-1', packageName: 'Glow package' },
      startTime: sequential[1].startTime,
      endTime: new Date(sequential[1].startTime.getTime() + 20 * 60 * 1000),
    });
    return { anchor, second };
  }

  function packageRescheduleLines(
    visit: StoredBooking[],
    blockStart: Date,
    employeeId = 'emp-1',
  ): Array<{ bookingId: string; startTime: string; employeeId: string }> {
    const sorted = [...visit].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
    const sequential = buildSequentialAppointments(
      sorted.map((b) => ({
        serviceId: b.serviceId,
        durationMinutes: b.service?.durationMinutes ?? 30,
        bufferMinutes: b.service?.bufferMinutes ?? 0,
      })),
      blockStart,
      5,
    );
    return sorted.map((booking, index) => ({
      bookingId: booking.id,
      startTime: sequential[index].startTime.toISOString(),
      employeeId,
    }));
  }

  beforeEach(() => {
    bookings.clear();
    packagePurchases.clear();
    reviews.length = 0;
    jest.clearAllMocks();
    business.isActive = true;
    business.settings = applyPublicPaymentSettingsToBusinessSettings(
      applyCustomerSelfServiceToBusinessSettings(
        { locale: 'en' },
        {
          allowCancel: true,
          allowReschedule: true,
          minimumNoticeHours: 24,
          maxReschedulesPerBooking: 2,
        },
      ),
      { acceptCashPayments: true },
    );
  });

  it('exposes cash and self-service settings on business profile resolution', () => {
    expect(resolvePublicPaymentSettings(business.settings)).toEqual({
      acceptCashPayments: true,
    });
    expect(resolveCustomerSelfServiceSettings(business.settings)).toMatchObject(
      {
        allowCancel: true,
        maxReschedulesPerBooking: 2,
      },
    );
  });

  it('issues manage token, lists enriched bookings, cancels, and emits events', async () => {
    const booking = seedBooking({ id: 'book-1' });

    const token = await ensureBookingManageToken(
      bookingRepo as any,
      booking.id,
    );
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(
      validateBookingManageToken(bookings.get(booking.id)! as any, token),
    ).toBe(true);

    const listed = await publicCustomerAuthService.listBookings(
      'salon',
      'cust-1',
    );
    expect(listed.bookings).toHaveLength(1);
    expect(listed.bookings[0]).toMatchObject({
      id: 'book-1',
      canCancel: true,
      canReschedule: true,
      serviceName: 'Haircut',
      policyMessage: null,
    });

    const manage = await publicCustomerBookingService.getManageContext(
      'salon',
      booking.id,
      token,
    );
    expect(manage.canCancel).toBe(true);
    expect(manage.manageUrl).toContain(`token=${token}`);

    const cancelled = await publicCustomerBookingService.cancelBooking(
      'salon',
      'cust-1',
      booking.id,
    );
    expect(cancelled.booking.status).toBe(BookingStatus.CANCELLED);
    expect(bookingService.cancel).toHaveBeenCalledWith(
      booking.id,
      'Cancelled by customer',
      'customer:cust-1',
    );
    expect(notificationsService.sendBookingCancellation).toHaveBeenCalledWith(
      booking.id,
      'Cancelled by customer',
    );
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'booking.cancelled' }),
    );

    const afterCancel = await publicCustomerAuthService.listBookings(
      'salon',
      'cust-1',
    );
    expect(afterCancel.bookings[0].canCancel).toBe(false);
    expect(afterCancel.bookings[0].policyMessage).toContain(
      'already cancelled',
    );
  });

  it('reschedules until max then blocks further reschedules', async () => {
    seedBooking({ id: 'book-2', metadata: { customerRescheduleCount: 1 } });
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();

    await publicCustomerBookingService.rescheduleBooking(
      'salon',
      'cust-1',
      'book-2',
      {
        startTime: newStart,
      },
    );
    expect(bookings.get('book-2')?.metadata.customerRescheduleCount).toBe(2);
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'booking.rescheduled' }),
    );

    await expect(
      publicCustomerBookingService.rescheduleBooking(
        'salon',
        'cust-1',
        'book-2',
        {
          startTime: new Date(futureStart.getTime() + 172800000).toISOString(),
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('surfaces reschedule-only policy message when cancel is allowed but reschedule is not', async () => {
    business.settings = applyCustomerSelfServiceToBusinessSettings(
      business.settings,
      {
        allowCancel: true,
        allowReschedule: false,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 2,
      },
    );
    seedBooking({ id: 'book-3' });

    const listed = await publicCustomerAuthService.listBookings(
      'salon',
      'cust-1',
    );
    expect(listed.bookings[0].canCancel).toBe(true);
    expect(listed.bookings[0].canReschedule).toBe(false);
    expect(listed.bookings[0].policyMessage).toContain('rescheduling');
  });

  it('marks completed bookings as reviewable when no review exists', async () => {
    seedBooking({ id: 'book-4', status: BookingStatus.COMPLETED });
    const listed = await publicCustomerAuthService.listBookings(
      'salon',
      'cust-1',
    );
    expect(listed.bookings[0].canReview).toBe(true);

    reviews.push({
      bookingId: 'book-4',
      businessId: business.id,
      customerId: 'cust-1',
    });
    const afterReview = await publicCustomerAuthService.listBookings(
      'salon',
      'cust-1',
    );
    expect(afterReview.bookings[0].canReview).toBe(false);
  });

  it('cancels via manage token without customer account login', async () => {
    const booking = seedBooking({ id: 'book-token' });
    const token = await ensureBookingManageToken(
      bookingRepo as any,
      booking.id,
    );

    await publicCustomerBookingService.cancelBookingWithToken(
      'salon',
      booking.id,
      token,
    );
    expect(bookings.get(booking.id)?.status).toBe(BookingStatus.CANCELLED);
    expect(
      notificationsService.sendBusinessCustomerBookingChange,
    ).toHaveBeenCalledWith(booking.id, 'cancelled');
  });

  it('refunds a paid-online booking on cancel and reports refund status', async () => {
    const booking = seedBooking({
      id: 'book-paid',
      paymentStatus: PaymentStatus.PAID,
      metadata: { stripePaymentIntentId: 'pi_abc' },
    });

    const result = await publicCustomerBookingService.cancelBooking(
      'salon',
      'cust-1',
      booking.id,
    );

    expect(bookingRefundService.refundBookingPayment).toHaveBeenCalled();
    expect(result.refundStatus).toBe('refunded');
    expect(bookings.get(booking.id)?.paymentStatus).toBe(
      PaymentStatus.REFUNDED,
    );
  });

  it('does not refund a booking with no online payment on cancel', async () => {
    const booking = seedBooking({ id: 'book-cash' });

    const result = await publicCustomerBookingService.cancelBooking(
      'salon',
      'cust-1',
      booking.id,
    );

    expect(bookingRefundService.refundBookingPayment).not.toHaveBeenCalled();
    expect(result.refundStatus).toBeUndefined();
  });

  it('reschedules via manage token and notifies business', async () => {
    const booking = seedBooking({ id: 'book-token-r' });
    const token = await ensureBookingManageToken(
      bookingRepo as any,
      booking.id,
    );
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();

    await publicCustomerBookingService.rescheduleBookingWithToken(
      'salon',
      booking.id,
      token,
      {
        startTime: newStart,
      },
    );
    expect(
      notificationsService.sendBusinessCustomerBookingChange,
    ).toHaveBeenCalledWith(
      booking.id,
      'rescheduled',
      expect.objectContaining({ newStartTime: expect.any(String) }),
    );
  });

  it('rejects manage context for inactive business and missing booking', async () => {
    business.isActive = false;
    await expect(
      publicCustomerBookingService.getManageContext('salon', 'missing', 'tok'),
    ).rejects.toBeInstanceOf(NotFoundException);

    business.isActive = true;
    await expect(
      publicCustomerBookingService.getManageContext('salon', 'missing', 'tok'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reuses existing manage token on subsequent ensure calls', async () => {
    const booking = seedBooking({
      id: 'book-5',
      metadata: { manageToken: 'stable-token' },
    });
    const first = await ensureBookingManageToken(
      bookingRepo as any,
      booking.id,
    );
    const second = await ensureBookingManageToken(
      bookingRepo as any,
      booking.id,
    );
    expect(first).toBe('stable-token');
    expect(second).toBe('stable-token');
    expect(bookingRepo.save).not.toHaveBeenCalled();
  });

  it('rejects invalid manage token on manage context lookup', async () => {
    const booking = seedBooking({
      id: 'book-bad-token',
      metadata: { manageToken: 'real-token' },
    });
    await expect(
      publicCustomerBookingService.getManageContext(
        'salon',
        booking.id,
        'wrong-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects cancel for non-owned booking and invalid manage token', async () => {
    seedBooking({ id: 'book-owned', customerId: 'cust-1' });
    await expect(
      publicCustomerBookingService.cancelBooking(
        'salon',
        'cust-2',
        'book-owned',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    const other = seedBooking({
      id: 'book-token-bad',
      metadata: { manageToken: 'good' },
    });
    await expect(
      publicCustomerBookingService.cancelBookingWithToken(
        'salon',
        other.id,
        'bad',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks cancel inside notice window and when cancel is disabled', async () => {
    seedBooking({
      id: 'book-soon',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    await expect(
      publicCustomerBookingService.cancelBooking(
        'salon',
        'cust-1',
        'book-soon',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    business.settings = applyCustomerSelfServiceToBusinessSettings(
      business.settings,
      {
        allowCancel: false,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 2,
        allowProviderChangeOnReschedule: false,
      },
    );
    seedBooking({ id: 'book-no-cancel' });
    await expect(
      publicCustomerBookingService.cancelBooking(
        'salon',
        'cust-1',
        'book-no-cancel',
      ),
    ).rejects.toThrow('cancellation');
  });

  it('allows provider change when policy permits and blocks otherwise', async () => {
    seedBooking({ id: 'book-provider', employeeId: 'emp-1' });
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();

    await expect(
      publicCustomerBookingService.rescheduleBooking(
        'salon',
        'cust-1',
        'book-provider',
        {
          startTime: newStart,
          employeeId: 'emp-2',
        },
      ),
    ).rejects.toThrow('Changing provider is not allowed');

    business.settings = applyCustomerSelfServiceToBusinessSettings(
      business.settings,
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 2,
        allowProviderChangeOnReschedule: true,
      },
    );

    await publicCustomerBookingService.rescheduleBooking(
      'salon',
      'cust-1',
      'book-provider',
      {
        startTime: newStart,
        employeeId: 'emp-2',
      },
    );
    expect(bookings.get('book-provider')?.employeeId).toBe('emp-2');
  });

  it('blocks reschedule when disabled and surfaces cancel-only policy on enrich', async () => {
    business.settings = applyCustomerSelfServiceToBusinessSettings(
      business.settings,
      {
        allowCancel: true,
        allowReschedule: false,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 2,
        allowProviderChangeOnReschedule: false,
      },
    );
    const booking = seedBooking({ id: 'book-reschedule-blocked' });
    await expect(
      publicCustomerBookingService.rescheduleBooking(
        'salon',
        'cust-1',
        booking.id,
        {
          startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
        },
      ),
    ).rejects.toThrow('rescheduling');

    const item = publicCustomerBookingService.enrichBookingItem(
      bookings.get(booking.id)! as any,
      resolveCustomerSelfServiceSettings(business.settings),
      new Set(),
    );
    expect(item.canCancel).toBe(true);
    expect(item.canReschedule).toBe(false);
    expect(item.policyMessage).toContain('rescheduling');
  });

  it('creates manage token when metadata is empty', async () => {
    const booking = seedBooking({ id: 'book-new-token', metadata: {} });
    const token = await ensureBookingManageToken(
      bookingRepo as any,
      booking.id,
    );
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(bookings.get('book-new-token')?.metadata.manageToken).toBe(token);
    expect(bookingRepo.manager.transaction).toHaveBeenCalled();
  });

  describe('package visit self-service', () => {
    it('lists package fields and manage context with full visit summary', async () => {
      const { anchor, second } = seedPackageVisit();
      const token = 'pkg-manage-token';

      const listed = await publicCustomerAuthService.listBookings(
        'salon',
        'cust-1',
      );
      const pkgRows = listed.bookings.filter(
        (b) => b.packagePurchaseId === 'purchase-1',
      );
      expect(pkgRows).toHaveLength(2);
      expect(pkgRows[0]).toMatchObject({
        packageId: 'pkg-catalog-1',
        packageName: 'Glow package',
      });

      const manage = await publicCustomerBookingService.getManageContext(
        'salon',
        anchor.id,
        token,
      );
      expect(manage.packageVisit).toMatchObject({
        packagePurchaseId: 'purchase-1',
        packageName: 'Glow package',
        canCancelAll: true,
        canRescheduleAll: true,
      });
      expect(manage.packageVisit?.appointments).toHaveLength(2);
      expect(manage.canCancel).toBe(true);
      expect(manage.canReschedule).toBe(true);

      const summary = await publicCustomerBookingService.getPackageVisitSummary(
        'salon',
        anchor.id,
        {
          customerId: 'cust-1',
        },
      );
      expect(summary.appointments.map((a) => a.bookingId)).toEqual([
        anchor.id,
        second.id,
      ]);

      const summaryViaToken =
        await publicCustomerBookingService.getPackageVisitSummary(
          'salon',
          anchor.id,
          { token: 'pkg-manage-token' },
        );
      expect(summaryViaToken.packageName).toBe('Glow package');
    });

    it('cancels entire package visit via account and manage token', async () => {
      const { anchor } = seedPackageVisit();

      const viaAccount = await publicCustomerBookingService.cancelPackageVisit(
        'salon',
        'cust-1',
        anchor.id,
      );
      expect(viaAccount.bookings).toHaveLength(2);
      expect(bookings.get('pkg-1')?.status).toBe(BookingStatus.CANCELLED);
      expect(bookings.get('pkg-2')?.status).toBe(BookingStatus.CANCELLED);
      expect(bookingService.cancel).toHaveBeenCalledTimes(2);
      expect(
        notificationsService.sendBookingCancellation,
      ).toHaveBeenCalledTimes(2);

      bookings.clear();
      jest.clearAllMocks();
      const { anchor: anchor2 } = seedPackageVisit();
      await publicCustomerBookingService.cancelPackageVisitWithToken(
        'salon',
        anchor2.id,
        'pkg-manage-token',
      );
      expect(bookings.get('pkg-1')?.status).toBe(BookingStatus.CANCELLED);
    });

    it('reschedules entire package visit with sequential same-day lines', async () => {
      seedPackageVisit();
      const blockStart = new Date(futureStart.getTime() + 86400000);
      const visit = [bookings.get('pkg-1')!, bookings.get('pkg-2')!];
      const lines = packageRescheduleLines(visit, blockStart);

      const result = await publicCustomerBookingService.reschedulePackageVisit(
        'salon',
        'cust-1',
        'pkg-1',
        { lines },
      );

      expect(result.bookings).toHaveLength(2);
      expect(bookings.get('pkg-1')?.startTime.toISOString()).toBe(
        lines[0].startTime,
      );
      expect(bookings.get('pkg-2')?.startTime.toISOString()).toBe(
        lines[1].startTime,
      );
      expect(bookingService.rescheduleSameVisitBlock).toHaveBeenCalledTimes(1);
      expect(bookingService.update).not.toHaveBeenCalled();
      expect(
        notificationsService.sendBusinessCustomerBookingChange,
      ).toHaveBeenCalledWith(
        'pkg-1',
        'rescheduled',
        expect.objectContaining({ previousStartTime: expect.any(String) }),
      );
    });

    it('reschedules package visit via manage token', async () => {
      const { anchor } = seedPackageVisit();
      const blockStart = new Date(futureStart.getTime() + 172800000);
      const lines = packageRescheduleLines(
        [bookings.get('pkg-1')!, bookings.get('pkg-2')!],
        blockStart,
      );

      await publicCustomerBookingService.reschedulePackageVisitWithToken(
        'salon',
        anchor.id,
        'pkg-manage-token',
        { lines },
      );
      expect(bookingService.rescheduleSameVisitBlock).toHaveBeenCalledTimes(1);
    });

    it('blocks package cancel and reschedule when policy or limits fail', async () => {
      const { anchor } = seedPackageVisit();
      bookings.get('pkg-2')!.metadata = { customerRescheduleCount: 2 };

      await expect(
        publicCustomerBookingService.reschedulePackageVisit(
          'salon',
          'cust-1',
          anchor.id,
          {
            lines: packageRescheduleLines(
              [bookings.get('pkg-1')!, bookings.get('pkg-2')!],
              new Date(futureStart.getTime() + 86400000),
            ),
          },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      business.settings = applyCustomerSelfServiceToBusinessSettings(
        business.settings,
        {
          allowCancel: false,
          allowReschedule: true,
          minimumNoticeHours: 24,
          maxReschedulesPerBooking: 2,
          allowProviderChangeOnReschedule: false,
        },
      );
      await expect(
        publicCustomerBookingService.cancelPackageVisit(
          'salon',
          'cust-1',
          anchor.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects invalid package reschedule payloads', async () => {
      const { anchor } = seedPackageVisit();

      await expect(
        publicCustomerBookingService.reschedulePackageVisit(
          'salon',
          'cust-1',
          anchor.id,
          {
            lines: [
              {
                bookingId: 'pkg-1',
                startTime: new Date(
                  futureStart.getTime() + 86400000,
                ).toISOString(),
              },
            ],
          },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        publicCustomerBookingService.reschedulePackageVisit(
          'salon',
          'cust-1',
          anchor.id,
          {
            lines: [
              {
                bookingId: 'pkg-1',
                startTime: new Date(
                  futureStart.getTime() + 86400000,
                ).toISOString(),
                employeeId: 'emp-1',
              },
              {
                bookingId: 'pkg-2',
                startTime: new Date(
                  futureStart.getTime() + 90000000,
                ).toISOString(),
                employeeId: 'emp-1',
              },
            ],
          },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        publicCustomerBookingService.reschedulePackageVisit(
          'salon',
          'cust-1',
          anchor.id,
          {
            lines: [
              {
                bookingId: 'pkg-1',
                startTime: new Date(
                  futureStart.getTime() + 86400000,
                ).toISOString(),
                employeeId: 'emp-1',
              },
              {
                bookingId: 'pkg-2',
                startTime: new Date(
                  futureStart.getTime() + 86400000,
                ).toISOString(),
                employeeId: 'emp-2',
              },
            ],
          },
        ),
      ).rejects.toThrow('same provider');

      bookings.get('pkg-2')!.employeeId = 'emp-2';
      const validLines = packageRescheduleLines(
        [bookings.get('pkg-1')!, bookings.get('pkg-2')!],
        new Date(futureStart.getTime() + 86400000),
        'emp-1',
      );
      await expect(
        publicCustomerBookingService.reschedulePackageVisit(
          'salon',
          'cust-1',
          anchor.id,
          {
            lines: validLines,
          },
        ),
      ).rejects.toThrow('Changing provider is not allowed');
    });

    it('allows provider change on package reschedule when enabled', async () => {
      business.settings = applyCustomerSelfServiceToBusinessSettings(
        business.settings,
        {
          allowCancel: true,
          allowReschedule: true,
          minimumNoticeHours: 24,
          maxReschedulesPerBooking: 2,
          allowProviderChangeOnReschedule: true,
        },
      );
      const { anchor } = seedPackageVisit();
      const blockStart = new Date(futureStart.getTime() + 86400000);
      const lines = packageRescheduleLines(
        [bookings.get('pkg-1')!, bookings.get('pkg-2')!],
        blockStart,
        'emp-2',
      );

      await publicCustomerBookingService.reschedulePackageVisit(
        'salon',
        'cust-1',
        anchor.id,
        {
          lines,
        },
      );
      expect(bookings.get('pkg-1')?.employeeId).toBe('emp-2');
    });

    it('rejects package visit actions for wrong customer or token', async () => {
      const { anchor } = seedPackageVisit();
      await expect(
        publicCustomerBookingService.cancelPackageVisit(
          'salon',
          'cust-2',
          anchor.id,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      await expect(
        publicCustomerBookingService.cancelPackageVisitWithToken(
          'salon',
          anchor.id,
          'wrong',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('skips already-cancelled appointments when cancelling visit', async () => {
      const { anchor } = seedPackageVisit();
      bookings.get('pkg-2')!.status = BookingStatus.CANCELLED;

      const result = await publicCustomerBookingService.cancelPackageVisit(
        'salon',
        'cust-1',
        anchor.id,
      );
      expect(result.bookings).toHaveLength(1);
      expect(bookingService.cancel).toHaveBeenCalledTimes(1);
    });

    it('refunds an unused, paid-online package purchase on cancel', async () => {
      const { anchor } = seedPackageVisit();
      packagePurchases.set('purchase-1', {
        id: 'purchase-1',
        metadata: { stripePaymentIntentId: 'pi_pkg_1' },
      });

      const result = await publicCustomerBookingService.cancelPackageVisit(
        'salon',
        'cust-1',
        anchor.id,
      );
      expect(result.refundStatus).toBe('refunded');
      expect(packageRefundService.refundPackagePayment).toHaveBeenCalled();
      expect(packagePurchases.get('purchase-1')?.metadata.stripeRefundId).toBe(
        're_test',
      );
    });

    it('does not refund a package purchase once a line has been used', async () => {
      const { anchor } = seedPackageVisit();
      bookings.get('pkg-2')!.status = BookingStatus.COMPLETED;
      packagePurchases.set('purchase-1', {
        id: 'purchase-1',
        metadata: { stripePaymentIntentId: 'pi_pkg_1' },
      });

      const result = await publicCustomerBookingService.cancelPackageVisit(
        'salon',
        'cust-1',
        anchor.id,
      );
      expect(result.refundStatus).toBeUndefined();
      expect(packageRefundService.refundPackagePayment).not.toHaveBeenCalled();
    });

    it('does not attempt a refund for a cash package purchase', async () => {
      const { anchor } = seedPackageVisit();

      const result = await publicCustomerBookingService.cancelPackageVisit(
        'salon',
        'cust-1',
        anchor.id,
      );
      expect(result.refundStatus).toBeUndefined();
      expect(packageRefundService.refundPackagePayment).not.toHaveBeenCalled();
    });

    it('falls back to anchor when package sibling query returns empty', async () => {
      const { anchor } = seedPackageVisit();
      bookingRepo.find.mockResolvedValueOnce([]);

      const summary = await publicCustomerBookingService.getPackageVisitSummary(
        'salon',
        anchor.id,
        {
          customerId: 'cust-1',
        },
      );
      expect(summary.appointments).toHaveLength(1);
      expect(summary.appointments[0].bookingId).toBe(anchor.id);
    });

    it('uses default labels when package metadata and relations are missing', async () => {
      const booking = seedBooking({
        id: 'pkg-solo',
        packagePurchaseId: 'purchase-solo',
        metadata: {},
        employee: undefined,
        service: undefined,
      });

      const summary = await publicCustomerBookingService.getPackageVisitSummary(
        'salon',
        booking.id,
        {
          customerId: 'cust-1',
        },
      );
      expect(summary.packageName).toBe('Package visit');
      expect(summary.appointments[0].serviceName).toBe('Service');
      expect(summary.appointments[0].employeeName).toBe('Specialist');
    });

    it('rejects package reschedule when no provider is on the visit lines', async () => {
      const { anchor } = seedPackageVisit();
      bookings.get('pkg-1')!.employeeId = '';
      bookings.get('pkg-2')!.employeeId = '';
      const blockStart = new Date(futureStart.getTime() + 86400000);

      await expect(
        publicCustomerBookingService.reschedulePackageVisit(
          'salon',
          'cust-1',
          anchor.id,
          {
            lines: [
              { bookingId: 'pkg-1', startTime: blockStart.toISOString() },
              {
                bookingId: 'pkg-2',
                startTime: new Date(
                  blockStart.getTime() + 35 * 60 * 1000,
                ).toISOString(),
              },
            ],
          },
        ),
      ).rejects.toThrow('Provider is required');
    });
  });

  it('returns manage context with default service and employee labels', async () => {
    const booking = seedBooking({
      id: 'book-bare-labels',
      metadata: { manageToken: 'bare-labels-token' },
      employee: undefined,
      service: undefined,
    });

    const ctx = await publicCustomerBookingService.getManageContext(
      'salon',
      booking.id,
      'bare-labels-token',
    );
    expect(ctx.serviceName).toBe('Service');
    expect(ctx.employeeName).toBe('Specialist');
  });

  it('summarizes a single booking when package purchase id is absent', async () => {
    const booking = seedBooking({ id: 'solo-no-purchase' });

    const summary = await publicCustomerBookingService.getPackageVisitSummary(
      'salon',
      booking.id,
      {
        customerId: 'cust-1',
      },
    );
    expect(summary.appointments).toHaveLength(1);
    expect(summary.appointments[0].bookingId).toBe('solo-no-purchase');
  });

  it('requires customer id or manage token for package visit summary', async () => {
    const booking = seedBooking({ id: 'solo-auth' });
    await expect(
      publicCustomerBookingService.getPackageVisitSummary(
        'salon',
        booking.id,
        {},
      ),
    ).rejects.toThrow('Authentication required');
  });
});
