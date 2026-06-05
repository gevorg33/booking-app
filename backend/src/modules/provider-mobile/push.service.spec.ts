import { ConfigService } from '@nestjs/config';
import { PushService } from './push.service.js';
import webpush from 'web-push';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

describe('PushService', () => {
  const subRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };
  const nativeTokenRepo = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };
  const firebase = {
    isReady: false,
    messaging: jest.fn(),
  };

  function buildService(vapid?: { public: string; private: string }) {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'VAPID_PUBLIC_KEY') return vapid?.public;
        if (key === 'VAPID_PRIVATE_KEY') return vapid?.private;
        if (key === 'VAPID_SUBJECT') return 'mailto:test@example.com';
        return undefined;
      }),
    };
    return new PushService(
      subRepo as any,
      nativeTokenRepo as any,
      config as unknown as ConfigService,
      firebase as any,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    subRepo.create.mockImplementation((v) => v);
    subRepo.save.mockImplementation(async (v) => ({ id: 'sub-1', ...v }));
    nativeTokenRepo.create.mockImplementation((v) => v);
    nativeTokenRepo.save.mockResolvedValue(undefined);
    nativeTokenRepo.count.mockResolvedValue(0);
    subRepo.find.mockResolvedValue([]);
    nativeTokenRepo.find.mockResolvedValue([]);
  });

  it('reports configured when VAPID keys are set', () => {
    const service = buildService({ public: 'pub', private: 'priv' });
    expect(service.isConfigured).toBe(true);
    expect(webpush.setVapidDetails).toHaveBeenCalled();
    expect(service.getPublicKey()).toBe('pub');
  });

  it('reports configured when Firebase is ready without VAPID', () => {
    firebase.isReady = true;
    const service = buildService();
    expect(service.isConfigured).toBe(true);
    firebase.isReady = false;
  });

  it('subscribes and unsubscribes web push endpoints', async () => {
    const service = buildService({ public: 'pub', private: 'priv' });
    const result = await service.subscribe('user-1', 'biz-1', {
      endpoint: 'https://push.example/1',
      keys: { p256dh: 'p', auth: 'a' },
    });
    expect(subRepo.delete).toHaveBeenCalledWith({
      userId: 'user-1',
      businessId: 'biz-1',
      endpoint: 'https://push.example/1',
    });
    expect(result.subscribed).toBe(true);
    await service.unsubscribe('user-1', 'biz-1', 'https://push.example/1');
    expect(subRepo.delete).toHaveBeenCalledTimes(2);
  });

  it('registers native push tokens', async () => {
    const service = buildService();
    const result = await service.registerNativeToken('user-1', 'biz-1', {
      token: 'fcm-token',
      platform: 'android',
    });
    expect(nativeTokenRepo.delete).toHaveBeenCalledWith({
      userId: 'user-1',
      businessId: 'biz-1',
      platform: 'android',
    });
    expect(result.registered).toBe(true);
  });

  it('returns native push registration status', async () => {
    nativeTokenRepo.count.mockResolvedValue(1);
    const service = buildService();
    await expect(
      service.getNativePushStatus('user-1', 'biz-1', 'ios'),
    ).resolves.toEqual({
      registered: true,
      platform: 'ios',
    });
  });

  it('sends web push and removes stale subscriptions', async () => {
    const service = buildService({ public: 'pub', private: 'priv' });
    subRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        endpoint: 'https://push.example/1',
        p256dh: 'p',
        auth: 'a',
      },
      {
        id: 'sub-2',
        endpoint: 'https://push.example/2',
        p256dh: 'p2',
        auth: 'a2',
      },
    ]);
    (webpush.sendNotification as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce({ statusCode: 410, message: 'gone' });

    const sent = await service.sendToUser('user-1', 'biz-1', {
      title: 'Hi',
      body: 'Test',
    });
    expect(sent).toBe(1);
    expect(subRepo.delete).toHaveBeenCalledWith({ id: 'sub-2' });
  });

  it('sends FCM when Firebase is ready', async () => {
    firebase.isReady = true;
    const send = jest.fn().mockResolvedValue(undefined);
    firebase.messaging.mockReturnValue({ send });
    nativeTokenRepo.find.mockResolvedValue([
      { id: 'tok-1', token: 'abc', platform: 'ios' },
    ]);

    const service = buildService();
    const sent = await service.sendToUser('user-1', 'biz-1', {
      title: 'Payment',
      body: 'Received',
      url: '/today',
      bookingId: 'book-1',
    });
    expect(sent).toBe(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'abc',
        notification: { title: 'Payment', body: 'Received' },
      }),
    );
    firebase.isReady = false;
  });

  it('removes invalid FCM tokens', async () => {
    firebase.isReady = true;
    const send = jest
      .fn()
      .mockRejectedValue({ code: 'messaging/invalid-registration-token' });
    firebase.messaging.mockReturnValue({ send });
    nativeTokenRepo.find.mockResolvedValue([
      { id: 'tok-bad', token: 'bad', platform: 'android' },
    ]);

    const service = buildService();
    const sent = await service.sendToUser('user-1', 'biz-1', {
      title: 'Hi',
      body: 'Test',
    });
    expect(sent).toBe(0);
    expect(nativeTokenRepo.delete).toHaveBeenCalledWith({ id: 'tok-bad' });
    firebase.isReady = false;
  });

  it('sendToEmployeeUser skips when user id missing', async () => {
    const service = buildService({ public: 'pub', private: 'priv' });
    await expect(
      service.sendToEmployeeUser(null, 'biz-1', { title: 'x', body: 'y' }),
    ).resolves.toBe(0);
  });

  it('logs non-stale web push failures', async () => {
    const service = buildService({ public: 'pub', private: 'priv' });
    subRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        endpoint: 'https://push.example/1',
        p256dh: 'p',
        auth: 'a',
      },
    ]);
    (webpush.sendNotification as jest.Mock).mockRejectedValue({
      statusCode: 500,
      message: 'server error',
    });
    await expect(
      service.sendToUser('user-1', 'biz-1', { title: 'Hi', body: 'Test' }),
    ).resolves.toBe(0);
  });

  it('skips native push when Firebase is not ready', async () => {
    nativeTokenRepo.find.mockResolvedValue([
      { id: 'tok-1', token: 'abc', platform: 'android' },
    ]);
    const service = buildService();
    await expect(
      service.sendToUser('user-1', 'biz-1', { title: 'Hi', body: 'Test' }),
    ).resolves.toBe(0);
  });

  it('logs generic FCM failures without deleting token', async () => {
    firebase.isReady = true;
    const send = jest.fn().mockRejectedValue(new Error('temporary'));
    firebase.messaging.mockReturnValue({ send });
    nativeTokenRepo.find.mockResolvedValue([
      { id: 'tok-1', token: 'abc', platform: 'android' },
    ]);
    const service = buildService();
    await expect(
      service.sendToUser('user-1', 'biz-1', { title: 'Hi', body: 'Test' }),
    ).resolves.toBe(0);
    expect(nativeTokenRepo.delete).not.toHaveBeenCalled();
    firebase.isReady = false;
  });

  it('delegates sendToEmployeeUser to sendToUser', async () => {
    const service = buildService({ public: 'pub', private: 'priv' });
    subRepo.find.mockResolvedValue([
      {
        id: 'sub-1',
        endpoint: 'https://push.example/1',
        p256dh: 'p',
        auth: 'a',
      },
    ]);
    (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);
    await expect(
      service.sendToEmployeeUser('user-9', 'biz-1', {
        title: 'Hi',
        body: 'There',
      }),
    ).resolves.toBe(1);
  });
});
