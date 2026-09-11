import { ProviderEndOfDayPushScheduler } from './provider-end-of-day-push.scheduler.js';
import { PushService } from './push.service.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';

describe('ProviderEndOfDayPushScheduler', () => {
  const bookingRepo = { find: jest.fn() };
  const periodRepo = { find: jest.fn() };
  const pushService = { isConfigured: true, sendToUser: jest.fn() };
  const providerMobileService = { findEmployeeUserId: jest.fn() };

  const scheduler = new ProviderEndOfDayPushScheduler(
    bookingRepo as any,
    periodRepo as any,
    pushService as unknown as PushService,
    providerMobileService as unknown as ProviderMobileService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-15T20:00:00Z'));
    bookingRepo.find.mockResolvedValue([
      {
        businessId: 'biz-1',
        employeeId: 'emp-1',
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        employee: { name: 'Alex' },
      },
      {
        businessId: 'biz-1',
        employeeId: 'emp-1',
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        employee: { name: 'Alex' },
      },
    ]);
    periodRepo.find.mockResolvedValue([]);
    providerMobileService.findEmployeeUserId.mockResolvedValue('user-1');
    pushService.sendToUser.mockResolvedValue(1);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends rich end-of-day summary at 20:00 UTC', async () => {
    await scheduler.sendEndOfDaySummaries();
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'biz-1',
      expect.objectContaining({
        title: "Today's summary",
        body: expect.stringContaining('2 appointments'),
        pushType: 'end_of_day',
        aiPrompt: expect.stringContaining("Summarize today's appointments"),
      }),
    );
  });

  it('skips outside summary hour', async () => {
    jest.setSystemTime(new Date('2026-05-15T10:00:00Z'));
    await scheduler.sendEndOfDaySummaries();
    expect(pushService.sendToUser).not.toHaveBeenCalled();
  });

  it('skips when push not configured', async () => {
    (pushService as { isConfigured: boolean }).isConfigured = false;
    await scheduler.sendEndOfDaySummaries();
    expect(bookingRepo.find).not.toHaveBeenCalled();
    (pushService as { isConfigured: boolean }).isConfigured = true;
  });

  it('skips employees without linked user', async () => {
    providerMobileService.findEmployeeUserId.mockResolvedValue(null);
    await scheduler.sendEndOfDaySummaries();
    expect(pushService.sendToUser).not.toHaveBeenCalled();
  });
});
