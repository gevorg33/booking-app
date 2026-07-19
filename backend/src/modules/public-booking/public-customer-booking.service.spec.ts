import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import * as customerSelfService from '../../common/utils/customer-self-service.util.js';
import * as packageVisitUtil from './public-customer-package-visit.util.js';

describe('PublicCustomerBookingService', () => {
  const businessService = { findBySlug: jest.fn() };
  const bookingService = {
    cancel: jest.fn(),
    update: jest.fn(),
    validateMultiServiceBlockFits: jest.fn(),
    rescheduleSameVisitBlock: jest.fn(),
  };
  const notificationsService = {
    sendBookingCancellation: jest.fn(),
    sendBusinessCustomerBookingChange: jest.fn(),
  };
  const configService = { get: jest.fn(() => 'http://localhost:3000') };
  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(() => ({ turnoverBufferMinutes: 5 })),
  };
  const bookingRepo = { findOne: jest.fn(), find: jest.fn() };
  const bookingRefundService = {
    refundBookingPayment: jest.fn().mockResolvedValue('refunded'),
  };
  const packageRefundService = {
    refundPackagePayment: jest.fn().mockResolvedValue('refunded'),
  };
  const packagePurchaseRepo = { findOne: jest.fn() };

  const service = new PublicCustomerBookingService(
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

  const futureStart = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const bookingId = '22222222-2222-4222-8222-222222222222';
  const baseBooking = {
    id: bookingId,
    businessId: 'biz-1',
    customerId: 'cust-1',
    employeeId: 'emp-1',
    serviceId: 'svc-1',
    status: BookingStatus.CONFIRMED,
    startTime: futureStart,
    endTime: new Date(futureStart.getTime() + 3600000),
    metadata: { manageToken: 'tok-abc' },
    employee: { name: 'Alex' },
    service: { name: 'Haircut' },
    customer: { email: 'jane@example.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findBySlug.mockResolvedValue({
      id: 'biz-1',
      slug: 'salon',
      isActive: true,
      settings: {},
    });
    bookingRepo.findOne.mockResolvedValue({ ...baseBooking });
    bookingService.cancel.mockResolvedValue({
      booking: {
        ...baseBooking,
        status: BookingStatus.CANCELLED,
      },
      didCancel: true,
    });
    bookingService.update.mockResolvedValue({
      ...baseBooking,
      startTime: new Date(futureStart.getTime() + 86400000),
    });
  });

  it('enriches booking item with cancel-only policy message', () => {
    const item = service.enrichBookingItem(
      {
        ...baseBooking,
        status: BookingStatus.CONFIRMED,
        paymentStatus: 'pending' as any,
      } as any,
      {
        allowCancel: true,
        allowReschedule: false,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
      new Set(),
    );
    expect(item.canCancel).toBe(true);
    expect(item.canReschedule).toBe(false);
    expect(item.policyMessage).toContain('rescheduling');
    expect(item.rescheduleCount).toBe(0);
  });

  it('enriches booking item with cancel blocked policy message', () => {
    const item = service.enrichBookingItem(
      {
        ...baseBooking,
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        paymentStatus: 'pending' as any,
      } as any,
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
      },
      new Set(),
    );
    expect(item.canCancel).toBe(false);
    expect(item.policyMessage).toContain('24 hours');
  });

  it('cancels owned booking and notifies customer', async () => {
    const result = await service.cancelBooking('salon', 'cust-1', bookingId);
    expect(bookingService.cancel).toHaveBeenCalledWith(
      bookingId,
      'Cancelled by customer',
      'customer:cust-1',
    );
    expect(notificationsService.sendBookingCancellation).toHaveBeenCalled();
    expect(
      notificationsService.sendBusinessCustomerBookingChange,
    ).toHaveBeenCalledWith(bookingId, 'cancelled');
    expect(result.booking.status).toBe(BookingStatus.CANCELLED);
    expect(bookingRefundService.refundBookingPayment).not.toHaveBeenCalled();
    expect(result.refundStatus).toBeUndefined();
  });

  it('refunds a paid-online booking when it is cancelled', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      paymentStatus: 'paid',
      metadata: { stripePaymentIntentId: 'pi_123' },
    });
    const cancelledBooking = {
      ...baseBooking,
      status: BookingStatus.CANCELLED,
      paymentStatus: 'not_applicable',
      metadata: { stripePaymentIntentId: 'pi_123' },
    };
    bookingService.cancel.mockResolvedValue({
      booking: cancelledBooking,
      didCancel: true,
    });

    const result = await service.cancelBooking('salon', 'cust-1', bookingId);

    expect(bookingRefundService.refundBookingPayment).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'biz-1' }),
      cancelledBooking,
    );
    expect(result.refundStatus).toBe('refunded');
  });

  it('does not attempt a refund for a cash/unpaid booking', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      paymentStatus: 'pending',
    });

    const result = await service.cancelBooking('salon', 'cust-1', bookingId);

    expect(bookingRefundService.refundBookingPayment).not.toHaveBeenCalled();
    expect(result.refundStatus).toBeUndefined();
  });

  it('cancels with manage token without customer login', async () => {
    await service.cancelBookingWithToken('salon', bookingId, 'tok-abc');
    expect(bookingService.cancel).toHaveBeenCalledWith(
      bookingId,
      'Cancelled by customer',
      'customer:cust-1',
    );
    expect(
      notificationsService.sendBusinessCustomerBookingChange,
    ).toHaveBeenCalled();
  });

  it('api-bug.5 — re-cancel of an already-cancelled booking is an idempotent no-op', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      status: BookingStatus.CANCELLED,
    });

    const result = await service.cancelBookingWithToken(
      'salon',
      bookingId,
      'tok-abc',
    );

    expect(result.booking.status).toBe(BookingStatus.CANCELLED);
    expect(bookingService.cancel).not.toHaveBeenCalled();
    expect(notificationsService.sendBookingCancellation).not.toHaveBeenCalled();
    expect(
      notificationsService.sendBusinessCustomerBookingChange,
    ).not.toHaveBeenCalled();
    expect(bookingRefundService.refundBookingPayment).not.toHaveBeenCalled();
  });

  it('e2e-bug.117 — non-UUID bookingId on manage cancel is a clean 400', async () => {
    await expect(
      service.cancelBookingWithToken('salon', 'not-a-uuid', 'tok-abc'),
    ).rejects.toThrow('bookingId must be a UUID');
    expect(bookingRepo.findOne).not.toHaveBeenCalled();
  });

  it('e2e-bug.121 — concurrent cancel loser (didCancel:false) skips re-notify', async () => {
    bookingService.cancel.mockResolvedValue({
      booking: {
        ...baseBooking,
        status: BookingStatus.CANCELLED,
        cancellationReason: 'Cancelled by customer',
      },
      didCancel: false,
    });

    const result = await service.cancelBookingWithToken(
      'salon',
      bookingId,
      'tok-abc',
    );

    expect(result.booking.status).toBe(BookingStatus.CANCELLED);
    expect(bookingService.cancel).toHaveBeenCalled();
    expect(notificationsService.sendBookingCancellation).not.toHaveBeenCalled();
    expect(
      notificationsService.sendBusinessCustomerBookingChange,
    ).not.toHaveBeenCalled();
  });

  it('rejects cancel with invalid manage token', async () => {
    await expect(
      service.cancelBookingWithToken('salon', bookingId, 'wrong'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reschedules with manage token', async () => {
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();
    const result = await service.rescheduleBookingWithToken(
      'salon',
      bookingId,
      'tok-abc',
      {
        startTime: newStart,
      },
    );
    expect(result.previousStartTime).toBe(baseBooking.startTime.toISOString());
    expect(
      notificationsService.sendBusinessCustomerBookingChange,
    ).toHaveBeenCalledWith(
      bookingId,
      'rescheduled',
      expect.objectContaining({
        previousStartTime: baseBooking.startTime.toISOString(),
      }),
    );
  });

  it('rejects provider change when policy disallows it', async () => {
    await expect(
      service.rescheduleBooking('salon', 'cust-1', bookingId, {
        startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
        employeeId: 'emp-2',
      }),
    ).rejects.toThrow('Changing provider is not allowed');
  });

  it('rejects cancel when booking not owned', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(
      service.cancelBooking('salon', 'cust-2', bookingId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects cancel inside notice window', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      startTime: new Date(Date.now() + 60 * 60 * 1000),
    });
    await expect(
      service.cancelBooking('salon', 'cust-1', bookingId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('reschedules owned booking and increments count', async () => {
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();
    await service.rescheduleBooking('salon', 'cust-1', bookingId, {
      startTime: newStart,
    });
    expect(bookingService.update).toHaveBeenCalledWith(
      bookingId,
      expect.objectContaining({
        startTime: newStart,
        metadata: expect.objectContaining({ customerRescheduleCount: 1 }),
      }),
      'customer:cust-1',
    );
  });

  it('rejects reschedule when policy blocks it', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { customerRescheduleCount: 5 },
    });
    await expect(
      service.rescheduleBooking('salon', 'cust-1', bookingId, {
        startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns manage context for valid token', async () => {
    const ctx = await service.getManageContext('salon', bookingId, 'tok-abc');
    expect(ctx.bookingId).toBe(bookingId);
    expect(ctx.canCancel).toBe(true);
    expect(ctx.manageUrl).toContain('/book/salon/manage');
    expect(ctx.allowProviderChangeOnReschedule).toBe(false);
  });

  it('rejects invalid manage token', async () => {
    await expect(
      service.getManageContext('salon', bookingId, 'wrong'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects manage context when business inactive', async () => {
    businessService.findBySlug.mockResolvedValue({
      id: 'biz-1',
      slug: 'salon',
      isActive: false,
      settings: {},
    });
    await expect(
      service.getManageContext('salon', bookingId, 'tok-abc'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects manage context when booking missing', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getManageContext('salon', bookingId, 'tok-abc'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects loadBookingForAction when neither customer id nor token is provided', async () => {
    await expect(
      (service as any).loadBookingForAction('salon', bookingId, {}),
    ).rejects.toThrow('Authentication required');
  });

  it('enriches booking item with cancel-blocked policy message when both actions blocked', () => {
    const item = service.enrichBookingItem(
      {
        ...baseBooking,
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        paymentStatus: 'pending' as any,
      } as any,
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
      new Set(),
    );
    expect(item.canCancel).toBe(false);
    expect(item.canReschedule).toBe(false);
    expect(item.policyMessage).toContain('24 hours');
  });

  it('enriches booking item with fallback service and employee names', () => {
    const item = service.enrichBookingItem(
      {
        ...baseBooking,
        service: undefined,
        employee: undefined,
        paymentStatus: 'pending' as any,
      } as any,
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
      new Set(),
    );
    expect(item.serviceName).toBe('Service');
    expect(item.employeeName).toBe('Specialist');
  });

  it('returns manage context with default frontend url and missing customer email', async () => {
    configService.get.mockReturnValue(undefined);
    bookingRepo.findOne.mockResolvedValue({ ...baseBooking, customer: null });
    const ctx = await service.getManageContext('salon', bookingId, 'tok-abc');
    expect(ctx.customerEmail).toBeNull();
    expect(ctx.manageUrl).toContain('http://localhost:3000/book/salon/manage');
  });

  it('cancels all bookings in a package visit', async () => {
    const packageBooking = {
      ...baseBooking,
      packagePurchaseId: 'purchase-1',
      metadata: {
        manageToken: 'tok-abc',
        packageId: 'pkg-1',
        packageName: 'Glow package',
      },
      service: { name: 'Facial', durationMinutes: 30, bufferMinutes: 0 },
    };
    const second = {
      ...packageBooking,
      id: '33333333-3333-4333-8333-333333333333',
      serviceId: 'svc-2',
      startTime: new Date(futureStart.getTime() + 35 * 60 * 1000),
      service: { name: 'Massage', durationMinutes: 20, bufferMinutes: 0 },
    };
    bookingRepo.findOne.mockResolvedValue(packageBooking);
    bookingRepo.find.mockResolvedValue([packageBooking, second]);
    bookingService.cancel.mockImplementation(async (id) => ({
      booking: {
        id,
        status: BookingStatus.CANCELLED,
      },
      didCancel: true,
    }));

    const result = await service.cancelPackageVisitWithToken(
      'salon',
      bookingId,
      'tok-abc',
    );

    expect(result.bookings).toHaveLength(2);
    expect(bookingService.cancel).toHaveBeenCalledTimes(2);
  });

  it('returns null policy message when cancel and reschedule are both allowed', () => {
    const item = service.enrichBookingItem(
      {
        ...baseBooking,
        status: BookingStatus.CONFIRMED,
        startTime: futureStart,
      } as any,
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
      new Set(),
    );
    expect(item.policyMessage).toBeNull();
  });

  it('enriches package purchase metadata on booking items', () => {
    const item = service.enrichBookingItem(
      {
        ...baseBooking,
        packagePurchaseId: 'purchase-1',
        metadata: { packageId: 'pkg-1', packageName: 'Glow' },
      } as any,
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
      new Set(),
    );
    expect(item.packagePurchaseId).toBe('purchase-1');
    expect(item.packageId).toBe('pkg-1');
    expect(item.packageName).toBe('Glow');
  });

  it('enriches multiServiceGroupId for account grouping (e2e-bug.34)', () => {
    const item = service.enrichBookingItem(
      {
        ...baseBooking,
        multiServiceGroupId: 'group-1',
        metadata: { schedulingMode: 'same_visit' },
      } as any,
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
      new Set(),
    );
    expect(item.multiServiceGroupId).toBe('group-1');
    expect(item.multiServiceSchedulingMode).toBe('same_visit');
  });

  it('uses cancel policy reason when both cancel and reschedule are blocked on enrich', () => {
    const item = service.enrichBookingItem(
      {
        ...baseBooking,
        status: BookingStatus.CONFIRMED,
        startTime: futureStart,
      } as any,
      {
        allowCancel: false,
        allowReschedule: false,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
      new Set(),
    );
    expect(item.canCancel).toBe(false);
    expect(item.canReschedule).toBe(false);
    expect(item.policyMessage).toContain('cancellation');
  });

  it('returns package visit summary for authenticated customer', async () => {
    const packageBooking = {
      ...baseBooking,
      packagePurchaseId: 'purchase-1',
      metadata: { packageName: 'Glow' },
    };
    bookingRepo.findOne.mockResolvedValue(packageBooking);
    bookingRepo.find.mockResolvedValue([packageBooking]);

    const summary = await service.getPackageVisitSummary('salon', bookingId, {
      customerId: 'cust-1',
    });
    expect(summary.packageName).toBe('Glow');
    expect(summary.appointments).toHaveLength(1);
  });

  it('rejects package reschedule without provider on first line', async () => {
    const packageBooking = {
      ...baseBooking,
      packagePurchaseId: 'purchase-1',
      employeeId: '',
      service: { durationMinutes: 30, bufferMinutes: 0 },
    };
    const second = {
      ...packageBooking,
      id: '33333333-3333-4333-8333-333333333333',
      serviceId: 'svc-2',
      startTime: new Date(futureStart.getTime() + 35 * 60 * 1000),
      service: { durationMinutes: 20, bufferMinutes: 0 },
    };
    bookingRepo.findOne.mockResolvedValue(packageBooking);
    bookingRepo.find.mockResolvedValue([packageBooking, second]);

    await expect(
      service.reschedulePackageVisit('salon', 'cust-1', bookingId, {
        lines: [
          {
            bookingId: bookingId,
            startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
          },
          {
            bookingId: '33333333-3333-4333-8333-333333333333',
            startTime: new Date(
              futureStart.getTime() + 86400000 + 35 * 60 * 1000,
            ).toISOString(),
          },
        ],
      }),
    ).rejects.toThrow('Provider is required');
  });

  it('reschedules package visit when lines are valid', async () => {
    const blockStart = futureStart;
    const packageBooking = {
      ...baseBooking,
      packagePurchaseId: 'purchase-1',
      serviceId: 'svc-1',
      metadata: { packageId: 'pkg-1', packageName: 'Glow package' },
      service: { name: 'Facial', durationMinutes: 30, bufferMinutes: 0 },
    };
    const second = {
      ...packageBooking,
      id: '33333333-3333-4333-8333-333333333333',
      serviceId: 'svc-2',
      startTime: new Date(blockStart.getTime() + 35 * 60 * 1000),
      service: { name: 'Massage', durationMinutes: 20, bufferMinutes: 0 },
    };
    bookingRepo.findOne.mockResolvedValue(packageBooking);
    bookingRepo.find.mockResolvedValue([packageBooking, second]);

    const newBlock = new Date(futureStart.getTime() + 86400000);
    const lines = [
      {
        bookingId: bookingId,
        startTime: newBlock.toISOString(),
        employeeId: 'emp-1',
      },
      {
        bookingId: '33333333-3333-4333-8333-333333333333',
        startTime: new Date(newBlock.getTime() + 35 * 60 * 1000).toISOString(),
        employeeId: 'emp-1',
      },
    ];

    bookingService.validateMultiServiceBlockFits.mockResolvedValue(undefined);
    bookingService.rescheduleSameVisitBlock.mockResolvedValue([
      { ...packageBooking, startTime: newBlock },
      { ...second, startTime: new Date(newBlock.getTime() + 35 * 60 * 1000) },
    ]);

    const result = await service.reschedulePackageVisit(
      'salon',
      'cust-1',
      bookingId,
      { lines },
    );
    expect(result.bookings).toHaveLength(2);
    expect(bookingService.validateMultiServiceBlockFits).toHaveBeenCalledWith(
      'biz-1',
      'emp-1',
      expect.any(Date),
      expect.any(Date),
      ['svc-1', 'svc-2'],
      [bookingId, '33333333-3333-4333-8333-333333333333'],
    );
    expect(bookingService.rescheduleSameVisitBlock).toHaveBeenCalledTimes(1);
    expect(bookingService.rescheduleSameVisitBlock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ bookingId: bookingId, employeeId: 'emp-1' }),
        expect.objectContaining({ bookingId: '33333333-3333-4333-8333-333333333333', employeeId: 'emp-1' }),
      ]),
      'customer:cust-1',
    );
    expect(bookingService.update).not.toHaveBeenCalled();
  });

  it('uses default forbidden messages when policy omits reason', async () => {
    const policySpy = jest
      .spyOn(customerSelfService, 'evaluateCustomerBookingPolicy')
      .mockReturnValue({ allowed: false });

    await expect(
      service.cancelBooking('salon', 'cust-1', bookingId),
    ).rejects.toThrow('Cancellation is not allowed');
    await expect(
      service.rescheduleBooking('salon', 'cust-1', bookingId, {
        startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
      }),
    ).rejects.toThrow('Rescheduling is not allowed');

    policySpy.mockRestore();
  });

  it('uses default package visit forbidden messages when policy message is empty', async () => {
    const packageBooking = {
      ...baseBooking,
      packagePurchaseId: 'purchase-1',
      metadata: { manageToken: 'tok-abc' },
      service: { durationMinutes: 30, bufferMinutes: 0 },
    };
    bookingRepo.findOne.mockResolvedValue(packageBooking);
    bookingRepo.find.mockResolvedValue([packageBooking]);

    const visitPolicySpy = jest
      .spyOn(packageVisitUtil, 'evaluatePackageVisitPolicy')
      .mockReturnValue({
        canCancelAll: false,
        canRescheduleAll: true,
        policyMessage: null,
      });
    await expect(
      service.cancelPackageVisit('salon', 'cust-1', bookingId),
    ).rejects.toThrow('Cancellation is not allowed for this visit');

    visitPolicySpy.mockReturnValue({
      canCancelAll: true,
      canRescheduleAll: false,
      policyMessage: null,
    });
    await expect(
      service.reschedulePackageVisit('salon', 'cust-1', bookingId, {
        lines: [
          {
            bookingId: bookingId,
            startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
            employeeId: 'emp-1',
          },
        ],
      }),
    ).rejects.toThrow('Rescheduling is not allowed for this visit');

    visitPolicySpy.mockRestore();
  });

  it('returns null enrich policy message when reschedule is blocked without a reason', () => {
    const policySpy = jest
      .spyOn(customerSelfService, 'evaluateCustomerBookingPolicy')
      .mockImplementation((_booking, _settings, action) =>
        action === 'cancel' ? { allowed: true } : { allowed: false },
      );

    const item = service.enrichBookingItem(
      { ...baseBooking, paymentStatus: 'pending' as any } as any,
      {
        allowCancel: true,
        allowReschedule: true,
        minimumNoticeHours: 24,
        maxReschedulesPerBooking: 3,
        allowProviderChangeOnReschedule: false,
      },
      new Set(),
    );
    expect(item.policyMessage).toBeNull();

    policySpy.mockRestore();
  });
});
