import { NotFoundException } from '@nestjs/common';
import { ProviderPushHistoryService } from './provider-push-history.service.js';

describe('ProviderPushHistoryService (prov-exp-10.1)', () => {
  const repo = {
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const service = new ProviderPushHistoryService(repo as any);

  beforeEach(() => {
    jest.clearAllMocks();
    repo.create.mockImplementation((value) => value);
    repo.save.mockImplementation(async (value) => ({ id: 'n1', ...value }));
  });

  it('records a push delivery for the notification center', async () => {
    await service.recordDelivery({
      userId: 'user-1',
      businessId: 'biz-1',
      title: 'New appointment',
      body: 'Jane — Cut at 10:00',
      bookingId: 'bk-1',
      url: '/provider/today?bookingId=bk-1',
      kind: 'booking_created',
    });

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        businessId: 'biz-1',
        bookingId: 'bk-1',
        kind: 'booking_created',
        readAt: null,
      }),
    );
  });

  it('lists recent notifications with unread count', async () => {
    repo.find.mockResolvedValue([
      {
        id: 'n1',
        title: 'New appointment',
        body: 'Jane',
        bookingId: 'bk-1',
        url: null,
        kind: 'booking_created',
        sentAt: new Date('2026-06-09T09:00:00.000Z'),
        readAt: null,
      },
      {
        id: 'n2',
        title: 'Payment received',
        body: 'Paid',
        bookingId: 'bk-1',
        url: null,
        kind: 'payment_received',
        sentAt: new Date('2026-06-08T09:00:00.000Z'),
        readAt: new Date('2026-06-08T10:00:00.000Z'),
      },
    ]);

    const view = await service.listNotificationCenter(
      'biz-1',
      'user-1',
      new Date('2026-06-10T12:00:00.000Z'),
    );

    expect(view.items).toHaveLength(2);
    expect(view.unreadCount).toBe(1);
    expect(view.days).toBe(30);
  });

  it('marks one notification read', async () => {
    repo.findOne.mockResolvedValue({
      id: 'n1',
      businessId: 'biz-1',
      userId: 'user-1',
      readAt: null,
    });

    await service.markNotificationRead('biz-1', 'user-1', 'n1');

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'n1', readAt: expect.any(Date) }),
    );
  });

  it('rejects unknown notification ids', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(
      service.markNotificationRead('biz-1', 'user-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks latest unread booking notification read', async () => {
    repo.findOne.mockResolvedValue({
      id: 'n1',
      bookingId: 'bk-1',
      readAt: null,
    });

    await service.markLatestBookingNotificationRead('biz-1', 'user-1', 'bk-1');

    expect(repo.save).toHaveBeenCalled();
  });

  it('skips mark booking read when no unread notification exists', async () => {
    repo.findOne.mockResolvedValue(null);
    await service.markLatestBookingNotificationRead('biz-1', 'user-1', 'bk-1');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('does not rewrite readAt when notification is already read', async () => {
    const readAt = new Date('2026-06-01T10:00:00.000Z');
    repo.findOne.mockResolvedValue({
      id: 'n1',
      businessId: 'biz-1',
      userId: 'user-1',
      readAt,
    });

    await service.markNotificationRead('biz-1', 'user-1', 'n1');

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('trims title and body when recording delivery', async () => {
    await service.recordDelivery({
      userId: 'user-1',
      businessId: 'biz-1',
      title: '  New appointment  ',
      body: '  Jane  ',
      url: '   ',
      bookingId: null,
      kind: 'booking_created',
    });

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New appointment',
        body: 'Jane',
        url: null,
        bookingId: null,
      }),
    );
  });

  it('marks all unread notifications read', async () => {
    repo.update.mockResolvedValue({ affected: 3 });
    await expect(
      service.markAllNotificationsRead('biz-1', 'user-1'),
    ).resolves.toEqual({ updated: 3 });
  });

  it('defaults affected count to zero when update returns no rows', async () => {
    repo.update.mockResolvedValue({});
    await expect(
      service.markAllNotificationsRead('biz-1', 'user-1'),
    ).resolves.toEqual({ updated: 0 });
  });

  it('lists notifications using the current date by default', async () => {
    repo.find.mockResolvedValue([]);
    await service.listNotificationCenter('biz-1', 'user-1');
    expect(repo.find).toHaveBeenCalled();
  });
});
