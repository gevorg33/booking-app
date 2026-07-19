import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { GiftCardFulfillmentService } from '../gift-cards/gift-card-fulfillment.service.js';
import { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import { GiftCardPurchaseService } from '../gift-cards/gift-card-purchase.service.js';
import { GiftCardRefundService } from '../gift-cards/gift-card-refund.service.js';

describe('Sprint 31 gift fulfillment AI scenarios', () => {
  const buildPhysicalCard = () => ({
    id: 'gc-1',
    businessId: 'biz-1',
    deliveryMethod: 'physical' as const,
    fulfillmentStatus: 'awaiting_card_creation' as const,
    recipientName: 'Jane',
    recipientEmail: 'jane@example.com',
    purchaserEmail: 'buyer@example.com',
    personalMessage: 'Happy birthday',
    shippingAddress: {
      recipientName: 'Jane',
      line1: '123 Main St',
      city: 'Boston',
      postalCode: '02101',
      country: 'US',
    },
    stripeSessionId: 'sess_1',
    serviceCredits: [] as never[],
  });

  const fulfillmentService = {
    listDashboardOrders: jest.fn(async () => {
      const card = buildPhysicalCard();
      return { orders: [card], total: 1, page: 1, pageSize: 20 };
    }),
    listCardCreationQueue: jest.fn(async () => [buildPhysicalCard()]),
    listDeliveryQueue: jest.fn(async () => [
      { ...buildPhysicalCard(), fulfillmentStatus: 'ready_for_delivery' },
    ]),
    getDashboardOrder: jest.fn(async () => buildPhysicalCard()),
    markCardReady: jest.fn(async () => ({
      ...buildPhysicalCard(),
      fulfillmentStatus: 'ready_for_delivery',
      cardReadyAt: new Date(),
    })),
    markOutForDelivery: jest.fn(async () => ({
      ...buildPhysicalCard(),
      fulfillmentStatus: 'out_for_delivery',
    })),
    markShipped: jest.fn(async () => ({
      ...buildPhysicalCard(),
      fulfillmentStatus: 'shipped',
      trackingCarrier: 'UPS',
      trackingNumber: 'ABC123',
    })),
    markDelivered: jest.fn(async () => ({
      ...buildPhysicalCard(),
      fulfillmentStatus: 'delivered',
      deliveredAt: new Date(),
    })),
    resolveStaffUserIds: jest.fn(async () => ['u1']),
  };
  const giftCardOrderService = {
    listCustomerOrders: jest.fn(async () => [
      {
        id: 'gc-1',
        deliveryMethod: 'physical',
        fulfillmentStatus: 'shipped',
        trackingCarrier: 'UPS',
        trackingNumber: 'TRK-1',
      },
    ]),
    getCustomerOrder: jest.fn(async () => ({
      id: 'gc-1',
      deliveryMethod: 'physical',
      fulfillmentStatus: 'shipped',
      trackingCarrier: 'UPS',
      trackingNumber: 'TRK-1',
    })),
  };
  const giftCardPurchaseService = {
    getPublicCatalog: jest.fn(async () => ({
      purchaseEnabled: true,
      settings: {
        physicalDeliveryEnabled: true,
        presetAmounts: [50, 100],
        cancelModifyEnabled: true,
        cancelModifyWindowHours: 24,
        shippingMethods: [
          {
            id: 'standard',
            label: 'Standard',
            fee: 5,
            estimatedDays: '5-7 days',
          },
          {
            id: 'express',
            label: 'Express',
            fee: 12,
            estimatedDays: '2-3 days',
          },
        ],
      },
    })),
    quotePurchase: jest.fn(async () => ({
      label: 'Gift card $50',
      subtotal: 50,
      shippingFee: 5,
      total: 55,
      currency: 'USD',
    })),
  };
  const giftCardRefundService = {
    refundPurchase: jest.fn(async () => 'refunded'),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: {
        giftCards: { cancelModifyWindowHours: 24, cancelModifyEnabled: true },
      },
    })),
    save: jest.fn(async (b) => b),
  };
  const giftCardRepo = { save: jest.fn(async (c) => c) };
  const employeeRepo = {
    find: jest.fn(async () => [
      {
        id: 'e1',
        name: 'Anna',
        businessId: 'biz-1',
        isActive: true,
        userId: 'u1',
      },
    ]),
    findOne: jest.fn(async () => ({
      id: 'e1',
      name: 'Anna',
      businessId: 'biz-1',
      isActive: true,
      userId: 'u1',
    })),
  };

  let giftFulfillment: AiGiftFulfillmentService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiGiftFulfillmentService,
        AiIntentRescueService,
        { provide: GiftCardFulfillmentService, useValue: fulfillmentService },
        { provide: GiftCardOrderService, useValue: giftCardOrderService },
        { provide: GiftCardPurchaseService, useValue: giftCardPurchaseService },
        { provide: GiftCardRefundService, useValue: giftCardRefundService },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(GiftCard), useValue: giftCardRepo },
        { provide: getRepositoryToken(Employee), useValue: employeeRepo },
      ],
    }).compile();

    giftFulfillment = module.get(AiGiftFulfillmentService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue', () => {
    it('rescues fulfillment intents before payments rescue', () => {
      expect(
        giftFulfillment.rescueFulfillmentIntent(
          'List gift card orders',
          'unknown',
        )?.action,
      ).toBe('list_gift_card_orders');
      expect(
        rescue.rescue({
          prompt: 'Show gift card creation queue',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('gift_card_creation_queue');
      expect(
        rescue.rescue({
          prompt: 'Track my gift card shipment status',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('track_gift_card_shipment');
      expect(
        rescue.rescue({
          prompt: 'Buy physical gift card shipped',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('buy_gift_card_physical');
      expect(
        rescue.rescue({
          prompt: 'Track my physical gift card order',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('track_physical_gift_card_order');
    });
  });

  describe('handlers', () => {
    it('runs dashboard fulfillment handlers', async () => {
      expect(
        (await giftFulfillment.handleListGiftCardOrders('biz-1', {})).success,
      ).toBe(true);
      expect(
        (await giftFulfillment.handleFilterAwaitingCreation('biz-1', {}))
          .success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleAssignCardCreator('biz-1', {
            giftCardId: 'gc-1',
            employeeName: 'Anna',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleAssignDeliveryStaff('biz-1', {
            giftCardId: 'gc-1',
            employeeName: 'Anna',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleMarkShipped('biz-1', {
            giftCardId: 'gc-1',
            carrier: 'UPS',
            trackingNumber: 'T1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleMarkDelivered('biz-1', {
            giftCardId: 'gc-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleCancelGiftCardOrder('biz-1', {
            giftCardId: 'gc-1',
            reason: 'Customer requested cancellation',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleExtendCancelWindow('biz-1', {
            cancelModifyWindowHours: 48,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handlePrintPackingSlip('biz-1', {
            giftCardId: 'gc-1',
          })
        ).success,
      ).toBe(true);
    });

    it('runs provider fulfillment handlers', async () => {
      expect(
        (await giftFulfillment.handleGiftCardCreationQueue('biz-1')).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleStartCardPreparation('biz-1', {
            giftCardId: 'gc-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleMarkCardReady(
            'biz-1',
            { giftCardId: 'gc-1' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect((await giftFulfillment.handleDeliveryQueue('biz-1')).success).toBe(
        true,
      );
      expect(
        (
          await giftFulfillment.handleAcceptDelivery(
            'biz-1',
            { giftCardId: 'gc-1' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleMarkOutForDelivery(
            'biz-1',
            { giftCardId: 'gc-1' },
            'u1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleCaptureDeliveryProof('biz-1', {
            giftCardId: 'gc-1',
            proofUrl: 'https://proof/x',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleNotifyDelay('biz-1', {
            giftCardId: 'gc-1',
            delayReason: 'Traffic',
          })
        ).success,
      ).toBe(true);
    });

    it('runs customer fulfillment handlers', async () => {
      expect(
        (
          await giftFulfillment.handleTrackGiftCardShipment('biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleEnterShippingAddress('biz-1', {
            shippingAddress: {
              line1: '123 Main St',
              city: 'Boston',
              country: 'US',
              postalCode: '02101',
              recipientName: 'Sam',
            },
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleShippingMethodQuote('biz-1', {
            shippingMethodId: 'standard',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await giftFulfillment.handleOrderStatusNotifications('biz-1', {
            sessionCustomerId: 'c1',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('compound', () => {
    it('completes provider compound flow with queue context', async () => {
      const result = await giftFulfillment.handleFulfillmentCompound(
        'biz-1',
        'Show gift card creation queue and mark first card ready',
        {},
        'u1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).fulfillmentCompound).toBe(true);
      expect((result.details as any).steps.length).toBe(2);
    });

    it('completes dashboard and customer compound flows', async () => {
      const dashboard = await giftFulfillment.handleFulfillmentCompound(
        'biz-1',
        'List awaiting creation orders and assign card creator to Anna',
        { giftCardId: 'gc-1' },
      );
      expect(dashboard.success).toBe(true);

      const customer = await giftFulfillment.handleFulfillmentCompound(
        'biz-1',
        'Track my gift card shipment and show order status notifications',
        { sessionCustomerId: 'c1' },
      );
      expect(customer.success).toBe(true);

      const addressFlow = await giftFulfillment.handleFulfillmentCompound(
        'biz-1',
        'Enter shipping address 123 Main St Boston and get shipping method quote and enable order status notifications',
        { sessionCustomerId: 'c1' },
      );
      expect(addressFlow.success).toBe(true);
    });

    it('stops compound on failure', async () => {
      const stopped = await giftFulfillment.handleFulfillmentCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'assign_card_creator', params: {}, segment: 'assign' },
            {
              action: 'mark_shipped',
              params: { giftCardId: 'gc-1' },
              segment: 'ship',
            },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe('assign_card_creator');
    });
  });
});
