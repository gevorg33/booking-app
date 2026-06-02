import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('PublicCustomerBookingService', () => {
  const businessService = { findBySlug: jest.fn() };
  const bookingService = { cancel: jest.fn(), update: jest.fn() };
  const notificationsService = {
    sendBookingCancellation: jest.fn(),
    sendBusinessCustomerBookingChange: jest.fn(),
  };
  const configService = { get: jest.fn(() => 'http://localhost:3000') };
  const bookingRepo = { findOne: jest.fn() };

  const service = new PublicCustomerBookingService(
    businessService as any,
    bookingService as any,
    notificationsService as any,
    configService as any,
    bookingRepo as any,
  );

  const futureStart = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const baseBooking = {
    id: 'book-1',
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
    bookingService.cancel.mockResolvedValue({ ...baseBooking, status: BookingStatus.CANCELLED });
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
    const result = await service.cancelBooking('salon', 'cust-1', 'book-1');
    expect(bookingService.cancel).toHaveBeenCalledWith(
      'book-1',
      'Cancelled by customer',
      'customer:cust-1',
    );
    expect(notificationsService.sendBookingCancellation).toHaveBeenCalled();
    expect(notificationsService.sendBusinessCustomerBookingChange).toHaveBeenCalledWith(
      'book-1',
      'cancelled',
    );
    expect(result.booking.status).toBe(BookingStatus.CANCELLED);
  });

  it('cancels with manage token without customer login', async () => {
    await service.cancelBookingWithToken('salon', 'book-1', 'tok-abc');
    expect(bookingService.cancel).toHaveBeenCalledWith(
      'book-1',
      'Cancelled by customer',
      'customer:cust-1',
    );
    expect(notificationsService.sendBusinessCustomerBookingChange).toHaveBeenCalled();
  });

  it('rejects cancel with invalid manage token', async () => {
    await expect(service.cancelBookingWithToken('salon', 'book-1', 'wrong')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('reschedules with manage token', async () => {
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();
    const result = await service.rescheduleBookingWithToken('salon', 'book-1', 'tok-abc', {
      startTime: newStart,
    });
    expect(result.previousStartTime).toBe(baseBooking.startTime.toISOString());
    expect(notificationsService.sendBusinessCustomerBookingChange).toHaveBeenCalledWith(
      'book-1',
      'rescheduled',
      expect.objectContaining({ previousStartTime: baseBooking.startTime.toISOString() }),
    );
  });

  it('rejects provider change when policy disallows it', async () => {
    await expect(
      service.rescheduleBooking('salon', 'cust-1', 'book-1', {
        startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
        employeeId: 'emp-2',
      }),
    ).rejects.toThrow('Changing provider is not allowed');
  });

  it('rejects cancel when booking not owned', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(service.cancelBooking('salon', 'cust-2', 'book-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects cancel inside notice window', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      startTime: new Date(Date.now() + 60 * 60 * 1000),
    });
    await expect(service.cancelBooking('salon', 'cust-1', 'book-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('reschedules owned booking and increments count', async () => {
    const newStart = new Date(futureStart.getTime() + 86400000).toISOString();
    await service.rescheduleBooking('salon', 'cust-1', 'book-1', { startTime: newStart });
    expect(bookingService.update).toHaveBeenCalledWith(
      'book-1',
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
      service.rescheduleBooking('salon', 'cust-1', 'book-1', {
        startTime: new Date(futureStart.getTime() + 86400000).toISOString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns manage context for valid token', async () => {
    const ctx = await service.getManageContext('salon', 'book-1', 'tok-abc');
    expect(ctx.bookingId).toBe('book-1');
    expect(ctx.canCancel).toBe(true);
    expect(ctx.manageUrl).toContain('/book/salon/manage');
    expect(ctx.allowProviderChangeOnReschedule).toBe(false);
  });

  it('rejects invalid manage token', async () => {
    await expect(service.getManageContext('salon', 'book-1', 'wrong')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects manage context when business inactive', async () => {
    businessService.findBySlug.mockResolvedValue({
      id: 'biz-1',
      slug: 'salon',
      isActive: false,
      settings: {},
    });
    await expect(service.getManageContext('salon', 'book-1', 'tok-abc')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects manage context when booking missing', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(service.getManageContext('salon', 'book-1', 'tok-abc')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects loadBookingForAction when neither customer id nor token is provided', async () => {
    await expect(
      (service as any).loadBookingForAction('salon', 'book-1', {}),
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
    const ctx = await service.getManageContext('salon', 'book-1', 'tok-abc');
    expect(ctx.customerEmail).toBeNull();
    expect(ctx.manageUrl).toContain('http://localhost:3000/book/salon/manage');
  });
});
