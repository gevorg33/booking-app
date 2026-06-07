import { ConsumerPushTokenService } from './consumer-push-token.service.js';

describe('ConsumerPushTokenService', () => {
  const tokenRepo = {
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };

  const service = new ConsumerPushTokenService(tokenRepo as never);

  beforeEach(() => {
    jest.clearAllMocks();
    tokenRepo.create.mockImplementation((value) => value);
    tokenRepo.save.mockResolvedValue(undefined);
    tokenRepo.count.mockResolvedValue(0);
    tokenRepo.find.mockResolvedValue([]);
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
    });
    expect(result).toEqual({ registered: true, platform: 'android' });
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
});
