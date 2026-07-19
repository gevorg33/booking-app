import { NotificationsService } from './notifications.service.js';

describe('NotificationsService.saveNotificationLog', () => {
  const logRepo = {
    create: jest.fn((row: unknown) => row),
    save: jest.fn(),
  };

  const service = new NotificationsService(
    {} as never,
    {} as never,
    {} as never,
    logRepo as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  const saveLog = (
    service as unknown as {
      saveNotificationLog: (entry: {
        businessId: string;
        bookingId: string;
        channel: 'email';
        kind: 'cancellation';
        recipient: string;
        status: 'sent';
        error?: null;
      }) => Promise<boolean>;
    }
  ).saveNotificationLog.bind(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('api-bug.5 / e2e-bug.121 — unique constraint on notification_logs is a no-op, not a 500', async () => {
    logRepo.save.mockRejectedValue({
      message:
        'duplicate key value violates unique constraint "IDX_f60ed9c21a25fdc91a8d092d2b"',
      driverError: { code: '23505' },
    });

    await expect(
      saveLog({
        businessId: 'biz-1',
        bookingId: 'book-1',
        channel: 'email',
        kind: 'cancellation',
        recipient: 'a@example.com',
        status: 'sent',
        error: null,
      }),
    ).resolves.toBe(false);
  });

  it('persists a new notification log row', async () => {
    logRepo.save.mockResolvedValue({ id: 'log-1' });
    await expect(
      saveLog({
        businessId: 'biz-1',
        bookingId: 'book-1',
        channel: 'email',
        kind: 'cancellation',
        recipient: 'a@example.com',
        status: 'sent',
        error: null,
      }),
    ).resolves.toBe(true);
    expect(logRepo.save).toHaveBeenCalled();
  });
});
