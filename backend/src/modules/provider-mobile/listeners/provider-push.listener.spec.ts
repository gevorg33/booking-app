import { EventType } from '../../../events/event-types.js';
import { ProviderPushListener } from './provider-push.listener.js';
import { PushService } from '../push.service.js';
import { ProviderMobileService } from '../provider-mobile.service.js';
import { ProviderPushActionService } from '../provider-push-action.service.js';

describe('ProviderPushListener', () => {
  const pushService = { isConfigured: true, sendToUser: jest.fn() };
  const providerMobileService = {
    findEmployeeUserId: jest.fn(),
    findMobileManagerUserIds: jest.fn(),
  };
  const pushActionService = { notifyBookingActions: jest.fn() };
  const bookingRepo = { findOne: jest.fn() };

  const listener = new ProviderPushListener(
    pushService as unknown as PushService,
    providerMobileService as unknown as ProviderMobileService,
    pushActionService as unknown as ProviderPushActionService,
    bookingRepo as any,
  );

  const baseEvent = {
    aggregateId: 'book-1',
    businessId: 'biz-1',
    eventType: EventType.BOOKING_CREATED,
    payload: { employeeId: 'emp-1', startTime: '2026-05-01T10:00:00Z' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bookingRepo.findOne.mockResolvedValue({
      id: 'book-1',
      employeeId: 'emp-1',
      startTime: new Date('2026-05-01T10:00:00Z'),
      customer: { name: 'Jane' },
      service: { name: 'Cut' },
      employee: { name: 'Alex' },
    });
    providerMobileService.findEmployeeUserId.mockResolvedValue('user-1');
    providerMobileService.findMobileManagerUserIds.mockResolvedValue(['mgr-1']);
    pushActionService.notifyBookingActions.mockResolvedValue(1);
    pushService.sendToUser.mockResolvedValue(1);
  });

  it('sends actionable push on booking created', async () => {
    await listener.handleNewBooking(baseEvent as any);
    expect(pushActionService.notifyBookingActions).toHaveBeenCalledWith(
      'user-1',
      'biz-1',
      'book-1',
      'New appointment',
      expect.stringContaining('Jane'),
    );
  });

  it('sends push on booking cancelled', async () => {
    await listener.handleCancelledBooking(baseEvent as any);
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'biz-1',
      expect.objectContaining({ title: 'Appointment cancelled' }),
    );
  });

  it('sends push on booking rescheduled', async () => {
    await listener.handleRescheduledBooking(baseEvent as any);
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'biz-1',
      expect.objectContaining({ title: 'Appointment rescheduled' }),
    );
  });

  it('skips when push not configured', async () => {
    (pushService as { isConfigured: boolean }).isConfigured = false;
    await listener.handleNewBooking(baseEvent as any);
    expect(pushActionService.notifyBookingActions).not.toHaveBeenCalled();
    (pushService as { isConfigured: boolean }).isConfigured = true;
  });

  it('swallows errors without rethrowing', async () => {
    bookingRepo.findOne.mockRejectedValue(new Error('db down'));
    await expect(listener.handleNewBooking(baseEvent as any)).resolves.toBeUndefined();
  });

  it('notifies managers on new booking', async () => {
    await listener.handleNewBooking(baseEvent as any);
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'mgr-1',
      'biz-1',
      expect.objectContaining({ title: 'New booking' }),
    );
  });

  it('skips when no employee on booking', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await listener.handleNewBooking({ ...baseEvent, payload: {} } as any);
    expect(pushActionService.notifyBookingActions).not.toHaveBeenCalled();
  });

  it('warns when provider user not linked', async () => {
    providerMobileService.findEmployeeUserId.mockResolvedValue(null);
    await listener.handleNewBooking(baseEvent as any);
    expect(pushActionService.notifyBookingActions).not.toHaveBeenCalled();
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'mgr-1',
      'biz-1',
      expect.objectContaining({ title: 'New booking' }),
    );
  });

  it('uses payload employee when booking missing', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await listener.handleNewBooking({
      ...baseEvent,
      payload: { employeeId: 'emp-1', startTime: '2026-05-01T10:00:00Z' },
    } as any);
    expect(pushActionService.notifyBookingActions).toHaveBeenCalled();
  });

  it('skips when business id missing', async () => {
    await listener.handleNewBooking({ ...baseEvent, businessId: undefined } as any);
    expect(pushActionService.notifyBookingActions).not.toHaveBeenCalled();
  });

  it('sends push on payment received', async () => {
    const paymentEvent = {
      aggregateId: 'book-1',
      businessId: 'biz-1',
      eventType: EventType.PAYMENT_RECEIVED,
      payload: { bookingId: 'book-1', amount: 50, currency: 'USD' },
    };
    await listener.handlePaymentReceived(paymentEvent as any);
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'biz-1',
      expect.objectContaining({ title: 'Payment received', bookingId: 'book-1' }),
    );
  });

  it('coerces string payment amounts and uses aggregate id fallback', async () => {
    bookingRepo.findOne.mockResolvedValue({
      id: 'book-9',
      employeeId: 'emp-1',
      customer: { name: 'Jane' },
      service: { name: 'Cut' },
      employee: { name: 'Alex' },
    });
    await listener.handlePaymentReceived({
      aggregateId: 'book-9',
      businessId: 'biz-1',
      payload: { amount: '42.5', currency: 'EUR' },
    } as any);
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'user-1',
      'biz-1',
      expect.objectContaining({ body: expect.stringContaining('EUR 42.50') }),
    );
  });

  it('skips payment push when push is not configured', async () => {
    (pushService as { isConfigured: boolean }).isConfigured = false;
    await listener.handlePaymentReceived({
      aggregateId: 'book-1',
      businessId: 'biz-1',
      payload: { amount: 10 },
    } as any);
    expect(pushService.sendToUser).not.toHaveBeenCalled();
    (pushService as { isConfigured: boolean }).isConfigured = true;
  });

  it('skips payment push when booking has no employee', async () => {
    bookingRepo.findOne.mockResolvedValue({ id: 'book-1', employeeId: null });
    await listener.handlePaymentReceived({
      aggregateId: 'book-1',
      businessId: 'biz-1',
      payload: { amount: 25 },
    } as any);
    expect(pushService.sendToUser).not.toHaveBeenCalled();
  });

  it('notifies managers on payment received', async () => {
    providerMobileService.findEmployeeUserId.mockResolvedValue(null);
    await listener.handlePaymentReceived({
      aggregateId: 'book-1',
      businessId: 'biz-1',
      payload: { bookingId: 'book-1', amount: 50, currency: 'USD' },
    } as any);
    expect(pushService.sendToUser).toHaveBeenCalledWith(
      'mgr-1',
      'biz-1',
      expect.objectContaining({ title: 'Payment received' }),
    );
  });

  it('swallows payment push errors', async () => {
    bookingRepo.findOne.mockRejectedValue('db down');
    await expect(
      listener.handlePaymentReceived({
        aggregateId: 'book-1',
        businessId: 'biz-1',
        payload: { amount: 25 },
      } as any),
    ).resolves.toBeUndefined();
  });
});
