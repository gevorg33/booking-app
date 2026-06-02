import { ForbiddenException } from '@nestjs/common';
import { GiftCardsController, GiftCardProviderController } from './gift-cards.controller.js';

describe('GiftCardsController', () => {
  const giftCardsService = { list: jest.fn(), create: jest.fn(), validate: jest.fn(), redeem: jest.fn(), getBalanceView: jest.fn(), listRedemptions: jest.fn(), updateExpiration: jest.fn(), listExpirationAudit: jest.fn() };
  const purchaseService = {};
  const fulfillmentService = {
    listDashboardOrders: jest.fn(),
    getDashboardOrder: jest.fn(),
    markShipped: jest.fn(),
  };
  const orderService = {
    listChangeRequests: jest.fn(),
    resolveChangeRequest: jest.fn(),
  };
  const businessService = { ensureMember: jest.fn() };
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };

  const controller = new GiftCardsController(
    giftCardsService as any,
    purchaseService as any,
    fulfillmentService as any,
    orderService as any,
    businessService as any,
    businessRepo as any,
  );

  const providerController = new GiftCardProviderController(fulfillmentService as any, businessService as any);

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'owner' });
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', settings: {} });
    businessRepo.save.mockImplementation(async (b) => b);
    fulfillmentService.listDashboardOrders.mockResolvedValue({
      orders: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  });

  it('returns fulfillment orders for dashboard members', async () => {
    const result = await controller.listFulfillment(
      'biz-1',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { id: 'user-1' },
    );
    expect(result.orders).toEqual([]);
  });

  it('propagates membership guard failures', async () => {
    businessService.ensureMember.mockRejectedValue(new ForbiddenException());
    await expect(controller.list('biz-1', { id: 'user-1' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates gift card expiration for dashboard members', async () => {
    giftCardsService.updateExpiration.mockResolvedValue({ id: 'gc-1', expiresAt: new Date('2028-01-01') });
    const result = await controller.updateExpiration(
      'biz-1',
      'gc-1',
      { expiresAt: '2028-01-01', note: 'Extended' },
      { id: 'user-1' },
    );
    expect(giftCardsService.updateExpiration).toHaveBeenCalledWith(
      'biz-1',
      'gc-1',
      { expiresAt: '2028-01-01', note: 'Extended' },
      'user-1',
    );
    expect(result.card.expiresAt).toEqual(new Date('2028-01-01'));
  });

  it('returns expiration audit history', async () => {
    giftCardsService.listExpirationAudit.mockResolvedValue([{ id: 'audit-1', action: 'extend' }]);
    const result = await controller.expirationAudit('biz-1', 'gc-1', { id: 'user-1' });
    expect(result.entries).toHaveLength(1);
  });

  it('lists and resolves gift card change requests', async () => {
    orderService.listChangeRequests.mockResolvedValue([{ id: 'req-1', status: 'pending' }]);
    await expect(controller.listChangeRequests('biz-1', undefined, { id: 'user-1' })).resolves.toEqual({
      requests: [{ id: 'req-1', status: 'pending' }],
    });
    orderService.resolveChangeRequest.mockResolvedValue({ request: { status: 'completed' } });
    await expect(
      controller.resolveChangeRequest('biz-1', 'req-1', { resolution: 'approve' }, { id: 'user-1' }),
    ).resolves.toMatchObject({ request: { status: 'completed' } });
  });
});

describe('GiftCardProviderController — card makers & drivers', () => {
  const fulfillmentService = {
    listCardCreationQueue: jest.fn(),
    listDeliveryQueue: jest.fn(),
    markCardReady: jest.fn(),
    markOutForDelivery: jest.fn(),
    markDelivered: jest.fn(),
  };
  const businessService = { ensureMember: jest.fn() };
  const controller = new GiftCardProviderController(fulfillmentService as any, businessService as any);

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: 'staff' });
    fulfillmentService.listCardCreationQueue.mockResolvedValue([{ id: 'order-1' }]);
    fulfillmentService.listDeliveryQueue.mockResolvedValue([{ id: 'order-2' }]);
  });

  it('returns card creation queue for card makers', async () => {
    const result = await controller.cardCreationQueue('biz-1', { id: 'user-creator' });
    expect(result.orders).toHaveLength(1);
  });

  it('returns delivery queue for drivers', async () => {
    const result = await controller.deliveryQueue('biz-1', { id: 'user-driver' });
    expect(result.orders).toHaveLength(1);
  });

  it('marks card ready from provider app', async () => {
    fulfillmentService.markCardReady.mockResolvedValue({ id: 'order-1', fulfillmentStatus: 'ready_for_delivery' });
    const result = await controller.markCardReady('biz-1', 'order-1', { id: 'user-creator' });
    expect(result.fulfillmentStatus).toBe('ready_for_delivery');
  });
});
