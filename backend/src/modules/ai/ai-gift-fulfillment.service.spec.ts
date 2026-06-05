import { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';

describe('AiGiftFulfillmentService', () => {
  const fulfillmentService = {
    listDashboardOrders: jest.fn(async () => ({
      orders: [{ id: 'gc-1' }],
      total: 1,
      page: 1,
      pageSize: 20,
    })),
    listCardCreationQueue: jest.fn(async () => [
      { id: 'gc-1', fulfillmentStatus: 'awaiting_card_creation' },
    ]),
    listDeliveryQueue: jest.fn(async () => [
      { id: 'gc-1', fulfillmentStatus: 'ready_for_delivery' },
    ]),
    getDashboardOrder: jest.fn(async () => ({
      id: 'gc-1',
      deliveryMethod: 'physical',
      fulfillmentStatus: 'awaiting_card_creation',
      recipientName: 'Jane',
      shippingAddress: {
        line1: '123 Main',
        city: 'Boston',
        postalCode: '02101',
        country: 'US',
        recipientName: 'Jane',
      },
      personalMessage: 'Hi',
      stripeSessionId: 'sess_1',
      serviceCredits: [],
    })),
    markCardReady: jest.fn(async () => ({
      id: 'gc-1',
      fulfillmentStatus: 'ready_for_delivery',
    })),
    markOutForDelivery: jest.fn(async () => ({
      id: 'gc-1',
      fulfillmentStatus: 'out_for_delivery',
    })),
    markShipped: jest.fn(async () => ({
      id: 'gc-1',
      fulfillmentStatus: 'shipped',
    })),
    markDelivered: jest.fn(async () => ({
      id: 'gc-1',
      fulfillmentStatus: 'delivered',
      deliveredAt: new Date(),
    })),
  };
  const giftCardOrderService = {
    listCustomerOrders: jest.fn(async () => [
      {
        id: 'gc-1',
        deliveryMethod: 'physical',
        fulfillmentStatus: 'shipped',
        trackingCarrier: 'UPS',
        trackingNumber: 'T1',
      },
    ]),
    getCustomerOrder: jest.fn(async () => ({
      id: 'gc-1',
      deliveryMethod: 'physical',
      fulfillmentStatus: 'shipped',
      trackingCarrier: 'UPS',
      trackingNumber: 'T1',
    })),
  };
  const giftCardPurchaseService = {
    getPublicCatalog: jest.fn(async () => ({
      purchaseEnabled: true,
      settings: {
        physicalDeliveryEnabled: true,
        presetAmounts: [50],
        shippingMethods: [
          { id: 'standard', label: 'Standard', fee: 5, estimatedDays: '5d' },
        ],
      },
    })),
    quotePurchase: jest.fn(async () => ({
      label: 'Gift card $50',
      subtotal: 50,
      shippingFee: 5,
      total: 55,
    })),
  };
  const giftCardRefundService = {
    refundPurchase: jest.fn(async () => 'refunded'),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { giftCards: { cancelModifyWindowHours: 24 } },
    })),
    save: jest.fn(async (b) => b),
  };
  const giftCardRepo = { save: jest.fn(async (c) => c) };
  const employeeRepo = {
    find: jest.fn(async () => [
      { id: 'e1', name: 'Anna', businessId: 'biz-1', isActive: true },
    ]),
    findOne: jest.fn(async () => ({
      id: 'e1',
      name: 'Anna',
      businessId: 'biz-1',
      isActive: true,
    })),
  };

  let service: AiGiftFulfillmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiGiftFulfillmentService(
      fulfillmentService as any,
      giftCardOrderService as any,
      giftCardPurchaseService as any,
      giftCardRefundService as any,
      businessRepo as any,
      giftCardRepo as any,
      employeeRepo as any,
    );
  });

  it('delegates rescue and compound helpers', () => {
    expect(
      service.rescueFulfillmentIntent('List gift card orders', 'unknown')
        ?.action,
    ).toBe('list_gift_card_orders');
    expect(
      service.isFulfillmentCompound(
        'List awaiting creation and assign card creator to Anna',
      ),
    ).toBe(true);
    expect(
      service.decomposeFulfillmentCompound(
        'Show gift card creation queue and mark first card ready',
      ).length,
    ).toBe(2);
  });

  it('delegates all fulfillment handlers', async () => {
    expect((await service.handleListGiftCardOrders('biz-1', {})).success).toBe(
      true,
    );
    expect(
      (await service.handleFilterAwaitingCreation('biz-1', {})).success,
    ).toBe(true);
    expect(
      (
        await service.handleAssignCardCreator('biz-1', {
          giftCardId: 'gc-1',
          employeeName: 'Anna',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleAssignDeliveryStaff('biz-1', {
          giftCardId: 'gc-1',
          employeeName: 'Anna',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleMarkShipped('biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(true);
    expect(
      (await service.handleMarkDelivered('biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(true);
    expect(
      (await service.handleCancelGiftCardOrder('biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleExtendCancelWindow('biz-1', {
          cancelModifyWindowHours: 48,
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handlePrintPackingSlip('biz-1', { giftCardId: 'gc-1' }))
        .success,
    ).toBe(true);
    expect((await service.handleGiftCardCreationQueue('biz-1')).success).toBe(
      true,
    );
    expect(
      (
        await service.handleStartCardPreparation('biz-1', {
          giftCardId: 'gc-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleMarkCardReady('biz-1', { giftCardId: 'gc-1' }, 'u1'))
        .success,
    ).toBe(true);
    expect((await service.handleDeliveryQueue('biz-1')).success).toBe(true);
    expect(
      (
        await service.handleAcceptDelivery(
          'biz-1',
          { giftCardId: 'gc-1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleMarkOutForDelivery(
          'biz-1',
          { giftCardId: 'gc-1' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCaptureDeliveryProof('biz-1', {
          giftCardId: 'gc-1',
          proofUrl: 'https://x',
        })
      ).success,
    ).toBe(true);
    expect(
      (await service.handleNotifyDelay('biz-1', { delayReason: 'Traffic' }))
        .success,
    ).toBe(true);
    expect(
      (
        await service.handleTrackGiftCardShipment('biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleEnterShippingAddress('biz-1', {
          shippingAddress: {
            line1: '1 Main',
            city: 'Boston',
            country: 'US',
            postalCode: '02101',
            recipientName: 'Sam',
          },
        })
      ).success,
    ).toBe(true);
    expect((await service.handleShippingMethodQuote('biz-1', {})).success).toBe(
      true,
    );
    expect(
      (
        await service.handleOrderStatusNotifications('biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(true);

    const compound = await service.handleFulfillmentCompound(
      'biz-1',
      'Show gift card creation queue and mark first card ready',
      {},
      'u1',
    );
    expect(compound.success).toBe(true);
  });
});
