import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import { ProviderPushActionService } from './provider-push-action.service.js';

describe('ProviderPushActionService sprint20', () => {
  const pushService = { sendToUser: jest.fn() };
  const bookingRepo = { findOne: jest.fn() };
  const bookingService = { update: jest.fn() };
  const providerMobile = {
    resolveMobileAccess: jest.fn(),
    getScopedEmployeeId: jest.fn(),
  };
  const service = new ProviderPushActionService(
    bookingRepo as any,
    bookingService as any,
    providerMobile as any,
    pushService as any,
  );

  const baseBooking = {
    id: 'booking-1',
    businessId: 'biz-1',
    employeeId: 'emp-1',
    customer: { name: 'Sam' },
    service: { name: 'Cut' },
    metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pushService.sendToUser.mockResolvedValue(1);
    providerMobile.resolveMobileAccess.mockResolvedValue({ role: 'manager' });
    providerMobile.getScopedEmployeeId.mockReturnValue(null);
    bookingRepo.findOne.mockResolvedValue(baseBooking);
    bookingService.update.mockResolvedValue(baseBooking);
  });

  it('notifyBookingActions includes AI prefill and foreground metadata', async () => {
    await service.notifyBookingActions(
      'user-1',
      'biz-1',
      'booking-1',
      'New appointment',
      'Sam — Cut at 14:00',
      { timeLabel: '14:00', customerName: 'Sam' },
    );

    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'biz-1',
      expect.objectContaining({
        pushType: 'booking_created',
        aiPrompt: expect.stringContaining('15-minute buffer'),
        foregroundHint: 'New booking 14:00 — Add buffer?',
        bookingId: 'booking-1',
      }),
    );
  });

  it('notifyBookingActions omits AI fields without time label', async () => {
    await service.notifyBookingActions('user-1', 'biz-1', 'booking-2', 'Title', 'Body');
    await service.notifyBookingActions('user-1', 'biz-1', 'booking-3', 'Title', 'Body', {
      timeLabel: '   ',
      customerName: '   ',
    });
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'biz-1',
      expect.objectContaining({
        pushType: 'booking_created',
        aiPrompt: undefined,
        foregroundHint: undefined,
      }),
    );
  });

  it('handleAction confirms a booking', async () => {
    const result = await service.handleAction('biz-1', 'user-1', {
      actionId: 'confirm',
      bookingId: 'booking-1',
      businessId: 'biz-1',
    });
    expect(bookingService.update).toHaveBeenCalledWith(
      'booking-1',
      { status: BookingStatus.CONFIRMED },
      'user-1',
    );
    expect(result.summary).toContain('Sam');

    bookingRepo.findOne.mockResolvedValue({ ...baseBooking, customer: null });
    const anonymous = await service.handleAction('biz-1', 'user-1', {
      actionId: 'confirm',
      bookingId: 'booking-1',
      businessId: 'biz-1',
    });
    expect(anonymous.summary).toBe('Confirmed appointment');
  });

  it('handleAction marks cash bookings paid with venue metadata', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: undefined,
    });
    await service.handleAction('biz-1', 'user-1', {
      actionId: 'mark_paid',
      bookingId: 'booking-1',
      businessId: 'biz-1',
    });
    expect(bookingService.update).toHaveBeenCalledWith(
      'booking-1',
      expect.objectContaining({
        metadata: expect.not.objectContaining({ paidVia: 'cash' }),
      }),
      'user-1',
    );

    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { payAtVenue: true },
    });
    const result = await service.handleAction('biz-1', 'user-1', {
      actionId: 'mark_paid',
      bookingId: 'booking-1',
      businessId: 'biz-1',
    });
    expect(bookingService.update).toHaveBeenCalledWith(
      'booking-1',
      expect.objectContaining({
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.COMPLETED,
        metadata: expect.objectContaining({ paidVia: 'cash' }),
      }),
      'user-1',
    );
    expect(result.summary).toContain('Marked paid');
  });

  it('handleAction marks non-cash bookings paid without cash metadata', async () => {
    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      metadata: { paymentMethod: 'card' },
    });
    await service.handleAction('biz-1', 'user-1', {
      actionId: 'mark_paid',
      bookingId: 'booking-1',
      businessId: 'biz-1',
    });
    expect(bookingService.update).toHaveBeenCalledWith(
      'booking-1',
      expect.objectContaining({
        metadata: expect.not.objectContaining({ paidVia: 'cash' }),
      }),
      'user-1',
    );

    bookingRepo.findOne.mockResolvedValue({
      ...baseBooking,
      customer: null,
      metadata: { paymentMethod: 'cash' },
    });
    const cashOnly = await service.handleAction('biz-1', 'user-1', {
      actionId: 'mark_paid',
      bookingId: 'booking-1',
      businessId: 'biz-1',
    });
    expect(cashOnly.summary).toBe('Marked paid — appointment');
  });

  it('handleAction returns reschedule summary without mutating booking', async () => {
    const result = await service.handleAction('biz-1', 'user-1', {
      actionId: 'suggest_reschedule',
      bookingId: 'booking-1',
      businessId: 'biz-1',
    });
    expect(bookingService.update).not.toHaveBeenCalled();
    expect(result.summary).toContain('reschedule');

    bookingRepo.findOne.mockResolvedValue({ ...baseBooking, customer: null });
    const anonymous = await service.handleAction('biz-1', 'user-1', {
      actionId: 'suggest_reschedule',
      bookingId: 'booking-1',
      businessId: 'biz-1',
    });
    expect(anonymous.summary).toBe('Open AI to reschedule appointment');
  });

  it('handleAction rejects missing bookings and unauthorized staff', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(
      service.handleAction('biz-1', 'user-1', {
        actionId: 'confirm',
        bookingId: 'missing',
        businessId: 'biz-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    bookingRepo.findOne.mockResolvedValue(baseBooking);
    providerMobile.getScopedEmployeeId.mockReturnValue('emp-2');
    await expect(
      service.handleAction('biz-1', 'user-1', {
        actionId: 'confirm',
        bookingId: 'booking-1',
        businessId: 'biz-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('handleAction rejects unknown action ids', async () => {
    await expect(
      service.handleAction('biz-1', 'user-1', {
        actionId: 'unknown' as 'confirm',
        bookingId: 'booking-1',
        businessId: 'biz-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
