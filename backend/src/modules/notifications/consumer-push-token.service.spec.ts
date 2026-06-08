import { ConsumerPushTokenService } from './consumer-push-token.service.js';

describe('ConsumerPushTokenService', () => {
  const tokenRepo = {
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const service = new ConsumerPushTokenService(tokenRepo as never);

  beforeEach(() => {
    jest.clearAllMocks();
    tokenRepo.create.mockImplementation((value) => value);
    tokenRepo.save.mockResolvedValue(undefined);
    tokenRepo.count.mockResolvedValue(0);
    tokenRepo.find.mockResolvedValue([]);
    tokenRepo.findOne.mockResolvedValue(null);
  });

  it('registers a native token per customer, tenant, and platform', async () => {
    const result = await service.registerToken('cust-1', 'biz-1', {
      token: 'fcm-token',
      platform: 'android',
    });

    expect(tokenRepo.delete).toHaveBeenCalledWith({
      customerId: 'cust-1',
      businessId: 'biz-1',
      platform: 'android',
    });
    expect(tokenRepo.save).toHaveBeenCalledWith({
      customerId: 'cust-1',
      businessId: 'biz-1',
      token: 'fcm-token',
      platform: 'android',
      permissionState: 'full',
      analyticsAnonId: null,
      tokenRefreshedAt: null,
    });
    expect(result).toEqual({ registered: true, platform: 'android', refreshed: false });
  });

  it('marks token refresh when FCM token changes', async () => {
    tokenRepo.findOne.mockResolvedValueOnce({
      token: 'old-token',
      platform: 'ios',
    });

    const result = await service.registerToken('cust-1', 'biz-1', {
      token: 'new-token',
      platform: 'ios',
    });

    expect(result.refreshed).toBe(true);
    expect(tokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'new-token',
        tokenRefreshedAt: expect.any(Date),
      }),
    );
  });

  it('reports native push registration status for a platform', async () => {
    tokenRepo.count.mockResolvedValue(1);
    await expect(
      service.getNativePushStatus('cust-1', 'biz-1', 'ios'),
    ).resolves.toEqual({ registered: true, platform: 'ios' });
    expect(tokenRepo.count).toHaveBeenCalledWith({
      where: {
        customerId: 'cust-1',
        businessId: 'biz-1',
        platform: 'ios',
      },
    });
  });

  it('reports native push registration status across platforms', async () => {
    tokenRepo.count.mockResolvedValue(2);
    await expect(service.getNativePushStatus('cust-1', 'biz-1')).resolves.toEqual({
      registered: true,
      platform: null,
    });
    expect(tokenRepo.count).toHaveBeenCalledWith({
      where: {
        customerId: 'cust-1',
        businessId: 'biz-1',
      },
    });
  });

  it('reports unregistered status when no tokens exist', async () => {
    tokenRepo.count.mockResolvedValue(0);
    await expect(service.getNativePushStatus('cust-1', 'biz-1', 'android')).resolves.toEqual({
      registered: false,
      platform: 'android',
    });
  });

  it('lists tokens for a customer within a tenant', async () => {
    tokenRepo.find.mockResolvedValueOnce([{ id: 'tok-1' }]);
    await expect(service.listTokensForCustomer('cust-1', 'biz-1')).resolves.toEqual([
      { id: 'tok-1' },
    ]);
  });

  it('deletes invalid tokens by id', async () => {
    await service.deleteTokenById('tok-1');
    expect(tokenRepo.delete).toHaveBeenCalledWith({ id: 'tok-1' });
  });

  it('records FCM accept metadata for deliverability tracking', async () => {
    tokenRepo.findOne.mockResolvedValueOnce({
      id: 'tok-1',
      deliverySuccessCount: 1,
      deliveryFailureCount: 0,
    });
    await service.recordFcmAccepted('tok-1', 'delivery-123');
    expect(tokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        deliverySuccessCount: 2,
        lastFcmMessageId: 'delivery-123',
        lastDeliveryError: null,
      }),
    );
  });

  it('records delivery failure counters', async () => {
    tokenRepo.findOne.mockResolvedValueOnce({
      id: 'tok-1',
      deliverySuccessCount: 2,
      deliveryFailureCount: 0,
    });
    await service.recordDeliveryFailure('tok-1', 'messaging/unavailable');
    expect(tokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryFailureCount: 1,
        lastDeliveryError: 'messaging/unavailable',
      }),
    );
  });

  it('records delivery ack when delivery id matches', async () => {
    tokenRepo.findOne.mockResolvedValueOnce({
      id: 'tok-1',
      lastFcmMessageId: 'delivery-123',
    });
    await expect(
      service.recordDeliveryAck('cust-1', 'biz-1', 'android', 'delivery-123'),
    ).resolves.toEqual({ acked: true });
    expect(tokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        lastDeliveryAckAt: expect.any(Date),
      }),
    );
  });

  it('ignores delivery ack when delivery id does not match', async () => {
    tokenRepo.findOne.mockResolvedValueOnce({
      id: 'tok-1',
      lastFcmMessageId: 'delivery-123',
    });
    await expect(
      service.recordDeliveryAck('cust-1', 'biz-1', 'android', 'delivery-456'),
    ).resolves.toEqual({ acked: false });
    expect(tokenRepo.save).not.toHaveBeenCalled();
  });

  it('records silent failures and scans pending acks', async () => {
    tokenRepo.find.mockResolvedValueOnce([
      {
        id: 'tok-silent',
        lastFcmAcceptedAt: new Date('2026-06-07T10:00:00.000Z'),
        lastDeliveryAckAt: null,
      },
    ]);
    tokenRepo.findOne.mockResolvedValueOnce({
      id: 'tok-silent',
      silentFailureCount: 0,
    });

    await expect(service.scanSilentDeliveryFailures()).resolves.toBe(1);
    expect(tokenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        silentFailureCount: 1,
        lastDeliveryError: 'silent_failure',
      }),
    );
  });

  it('aggregates deliverability counters including silent failures', async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        deliverySuccessCount: '99',
        deliveryFailureCount: '0',
        silentFailureCount: '1',
      }),
    };
    tokenRepo.createQueryBuilder.mockReturnValue(qb);

    await expect(service.getDeliverabilityAggregate('biz-1')).resolves.toEqual({
      deliverySuccessCount: 99,
      deliveryFailureCount: 0,
      silentFailureCount: 1,
    });
  });
});
