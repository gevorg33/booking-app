import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';
import { BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import {
  ensureBookingManageToken,
  validateBookingManageToken,
} from '../../common/utils/booking-manage-token.util.js';
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
    metadata: Record<string, unknown>;
    employee?: { name: string };
    service?: { name: string };
    customer?: { email: string | null };
  };

  const bookings = new Map<string, StoredBooking>();
  const reviews: Array<{ bookingId: string; businessId: string; customerId: string }> = [];

  const businessService = {
    findBySlug: jest.fn(async (slug: string) => {
      if (slug !== business.slug) throw new NotFoundException('Business not found');
      return business;
    }),
  };

  const bookingRepo = {
    findOne: jest.fn(async ({ where, relations }: { where: Record<string, unknown>; relations?: unknown }) => {
      if (where.id) {
        const booking = bookings.get(String(where.id));
        if (!booking) return null;
        if (where.businessId && booking.businessId !== where.businessId) return null;
        if (where.customerId && booking.customerId !== where.customerId) return null;
        return { ...booking };
      }
      return null;
    }),
    find: jest.fn(
      async ({
        where,
      }: {
        where: { businessId: string; customerId: string };
      }) => {
        return [...bookings.values()]
          .filter(
            (b) => b.businessId === where.businessId && b.customerId === where.customerId,
          )
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      },
    ),
    save: jest.fn(async (booking: StoredBooking) => {
      bookings.set(booking.id, { ...booking });
      return booking;
    }),
  };

  const reviewRepo = {
    find: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const bookingIdClause = where.bookingId as { _value?: string[] } | undefined;
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
    findOne: jest.fn(async ({ where }: { where: { id: string; businessId: string; isActive: boolean } }) => {
      if (where.id === 'cust-1' && where.businessId === business.id && where.isActive) {
        return { id: 'cust-1', businessId: business.id, name: 'Jane', email: 'jane@example.com', isActive: true };
      }
      return null;
    }),
  };

  const eventStore = { publish: jest.fn().mockResolvedValue(undefined) };
  const bookingService = {
    cancel: jest.fn(async (id: string, reason: string, userId?: string) => {
      const booking = bookings.get(id);
      if (!booking) throw new NotFoundException('Booking not found');
      booking.status = BookingStatus.CANCELLED;
      booking.metadata = { ...booking.metadata, cancelReason: reason, cancelledBy: userId };
      bookings.set(id, booking);
      await eventStore.publish({
        eventType: 'booking.cancelled',
        aggregateId: id,
        payload: { reason, userId },
      });
      return { ...booking };
    }),
    update: jest.fn(
      async (
        id: string,
        dto: { startTime: string; employeeId?: string; metadata?: Record<string, unknown> },
        userId?: string,
      ) => {
        const booking = bookings.get(id);
        if (!booking) throw new NotFoundException('Booking not found');
        booking.startTime = new Date(dto.startTime);
        booking.endTime = new Date(booking.startTime.getTime() + 3600000);
        if (dto.employeeId) booking.employeeId = dto.employeeId;
        booking.metadata = { ...booking.metadata, ...dto.metadata, rescheduledBy: userId };
        bookings.set(id, booking);
        await eventStore.publish({
          eventType: 'booking.rescheduled',
          aggregateId: id,
          payload: { newStartTime: dto.startTime, userId },
        });
        return { ...booking };
      },
    ),
  };

  const notificationsService = {
    sendBookingCancellation: jest.fn().mockResolvedValue(undefined),
    sendBusinessCustomerBookingChange: jest.fn().mockResolvedValue(undefined),
  };
  const configService = { get: jest.fn(() => 'https://app.test') };
  const jwtService = { sign: jest.fn(() => 'jwt-token') } as unknown as JwtService;

  const publicCustomerBookingService = new PublicCustomerBookingService(
    businessService as any,
    bookingService as any,
    notificationsService as any,
    configService as any,
    bookingRepo as any,
  );

  const giftCardPurchaseService = {
    linkGuestPurchasesToCustomer: jest.fn().mockResolvedValue(undefined),
  };

  const publicCustomerAuthService = new PublicCustomerAuthService(
    businessService as any,
    jwtService,
    { isReady: false } as any,
    publicCustomerBookingService,
    giftCardPurchaseService as any,
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
      metadata: {},
      employee: { name: 'Alex' },
      service: { name: 'Haircut' },
      customer: { email: 'jane@example.com' },
      ...overrides,
    };
    bookings.set(booking.id, booking);
    return booking;
  }

  beforeEach(() => {
    bookings.clear();
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
    expect(resolvePublicPaymentSettings(business.settings)).toEqual({ acceptCashPayments: true });
    expect(resolveCustomerSelfServiceSettings(business.settings)).toMatchObject({
      allowCancel: true,
      maxReschedulesPerBooking: 2,
    });
  });

  it('issues manage token, lists enriched bookings, cancels, and emits events', async () => {
    const booking = seedBooking({ id: 'book-1' });

    const token = await ensureBookingManageToken(bookingRepo as any, booking.id);
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(validateBookingManageToken(bookings.get(booking.id)! as any, token)).toBe(true);

    const listed = await publicCustomerAuthService.listBookings('salon', 'cust-1');
    expect(listed.bookings).toHaveLength(1);
    expect(listed.bookings[0]).toMatchObject({
      id: 'book-1',
      canCancel: true,
      canReschedule: true,
      serviceName: 'Haircut',
      policyMessage: null,
    });

    const manage = await publicCustomerBookingService.getManageContext('salon', booking.id, token);
    expect(manage.canCancel).toBe(true);
    expect(manage.manageUrl).toContain(`token=${token}`);

    const cancelled = await publicCustomerBookingService.cancelBooking('salon', 'cust-1', booking.id);
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

    const afterCancel = await publicCustomerAuthService.listBookings('salon', 'cust-1');
    expect(afterCancel.bookings[0].canCancel).toBe(false);
    expect(afterCancel.bookings[0].policyMessage).toContain('already cancelled');
  });

  it('reschedules until max then blocks further reschedules', async () => {
    seedBooking({ id: 'book-2', metadata: { customerRescheduleCount: 1 } });
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();

    await publicCustomerBookingService.rescheduleBooking('salon', 'cust-1', 'book-2', {
      startTime: newStart,
    });
    expect(bookings.get('book-2')?.metadata.customerRescheduleCount).toBe(2);
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'booking.rescheduled' }),
    );

    await expect(
      publicCustomerBookingService.rescheduleBooking('salon', 'cust-1', 'book-2', {
        startTime: new Date(futureStart.getTime() + 172800000).toISOString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('surfaces reschedule-only policy message when cancel is allowed but reschedule is not', async () => {
    business.settings = applyCustomerSelfServiceToBusinessSettings(business.settings, {
      allowCancel: true,
      allowReschedule: false,
      minimumNoticeHours: 24,
      maxReschedulesPerBooking: 2,
    });
    seedBooking({ id: 'book-3' });

    const listed = await publicCustomerAuthService.listBookings('salon', 'cust-1');
    expect(listed.bookings[0].canCancel).toBe(true);
    expect(listed.bookings[0].canReschedule).toBe(false);
    expect(listed.bookings[0].policyMessage).toContain('rescheduling');
  });

  it('marks completed bookings as reviewable when no review exists', async () => {
    seedBooking({ id: 'book-4', status: BookingStatus.COMPLETED });
    const listed = await publicCustomerAuthService.listBookings('salon', 'cust-1');
    expect(listed.bookings[0].canReview).toBe(true);

    reviews.push({ bookingId: 'book-4', businessId: business.id, customerId: 'cust-1' });
    const afterReview = await publicCustomerAuthService.listBookings('salon', 'cust-1');
    expect(afterReview.bookings[0].canReview).toBe(false);
  });

  it('cancels via manage token without customer account login', async () => {
    const booking = seedBooking({ id: 'book-token' });
    const token = await ensureBookingManageToken(bookingRepo as any, booking.id);

    await publicCustomerBookingService.cancelBookingWithToken('salon', booking.id, token);
    expect(bookings.get(booking.id)?.status).toBe(BookingStatus.CANCELLED);
    expect(notificationsService.sendBusinessCustomerBookingChange).toHaveBeenCalledWith(
      booking.id,
      'cancelled',
    );
  });

  it('reschedules via manage token and notifies business', async () => {
    const booking = seedBooking({ id: 'book-token-r' });
    const token = await ensureBookingManageToken(bookingRepo as any, booking.id);
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();

    await publicCustomerBookingService.rescheduleBookingWithToken('salon', booking.id, token, {
      startTime: newStart,
    });
    expect(notificationsService.sendBusinessCustomerBookingChange).toHaveBeenCalledWith(
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
    const booking = seedBooking({ id: 'book-5', metadata: { manageToken: 'stable-token' } });
    const first = await ensureBookingManageToken(bookingRepo as any, booking.id);
    const second = await ensureBookingManageToken(bookingRepo as any, booking.id);
    expect(first).toBe('stable-token');
    expect(second).toBe('stable-token');
    expect(bookingRepo.save).not.toHaveBeenCalled();
  });

  it('rejects invalid manage token on manage context lookup', async () => {
    const booking = seedBooking({ id: 'book-bad-token', metadata: { manageToken: 'real-token' } });
    await expect(
      publicCustomerBookingService.getManageContext('salon', booking.id, 'wrong-token'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects cancel for non-owned booking and invalid manage token', async () => {
    seedBooking({ id: 'book-owned', customerId: 'cust-1' });
    await expect(
      publicCustomerBookingService.cancelBooking('salon', 'cust-2', 'book-owned'),
    ).rejects.toBeInstanceOf(NotFoundException);

    const other = seedBooking({ id: 'book-token-bad', metadata: { manageToken: 'good' } });
    await expect(
      publicCustomerBookingService.cancelBookingWithToken('salon', other.id, 'bad'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks cancel inside notice window and when cancel is disabled', async () => {
    seedBooking({
      id: 'book-soon',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    await expect(
      publicCustomerBookingService.cancelBooking('salon', 'cust-1', 'book-soon'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    business.settings = applyCustomerSelfServiceToBusinessSettings(business.settings, {
      allowCancel: false,
      allowReschedule: true,
      minimumNoticeHours: 24,
      maxReschedulesPerBooking: 2,
      allowProviderChangeOnReschedule: false,
    });
    seedBooking({ id: 'book-no-cancel' });
    await expect(
      publicCustomerBookingService.cancelBooking('salon', 'cust-1', 'book-no-cancel'),
    ).rejects.toThrow('cancellation');
  });

  it('allows provider change when policy permits and blocks otherwise', async () => {
    seedBooking({ id: 'book-provider', employeeId: 'emp-1' });
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();

    await expect(
      publicCustomerBookingService.rescheduleBooking('salon', 'cust-1', 'book-provider', {
        startTime: newStart,
        employeeId: 'emp-2',
      }),
    ).rejects.toThrow('Changing provider is not allowed');

    business.settings = applyCustomerSelfServiceToBusinessSettings(business.settings, {
      allowCancel: true,
      allowReschedule: true,
      minimumNoticeHours: 24,
      maxReschedulesPerBooking: 2,
      allowProviderChangeOnReschedule: true,
    });

    await publicCustomerBookingService.rescheduleBooking('salon', 'cust-1', 'book-provider', {
      startTime: newStart,
      employeeId: 'emp-2',
    });
    expect(bookings.get('book-provider')?.employeeId).toBe('emp-2');
  });

  it('blocks reschedule when disabled and surfaces cancel-only policy on enrich', async () => {
    business.settings = applyCustomerSelfServiceToBusinessSettings(business.settings, {
      allowCancel: true,
      allowReschedule: false,
      minimumNoticeHours: 24,
      maxReschedulesPerBooking: 2,
      allowProviderChangeOnReschedule: false,
    });
    const booking = seedBooking({ id: 'book-reschedule-blocked' });
    await expect(
      publicCustomerBookingService.rescheduleBooking('salon', 'cust-1', booking.id, {
        startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
      }),
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
    const token = await ensureBookingManageToken(bookingRepo as any, booking.id);
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(bookingRepo.save).toHaveBeenCalled();
  });
});
