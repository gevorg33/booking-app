import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventType } from '../../events/event-types.js';
import { GiftCardPurchaseService } from './gift-card-purchase.service.js';
import { GiftCardClaimService } from './gift-card-claim.service.js';
import { GiftCardsService } from './gift-cards.service.js';
import { GiftCardDeliveryService } from './gift-card-delivery.service.js';
import {
  evaluateGiftCardOrderPolicy,
  hasGiftCardValueBeenUsed,
  isGiftCardFullyRedeemed,
} from './gift-card-order-policy.util.js';
import {
  DEFAULT_GIFT_CARD_SETTINGS,
  type GiftCardBusinessSettings,
} from './gift-card.types.js';
import {
  generateGiftCardCode,
  giftCardCodePrefix,
} from './gift-card-code.util.js';

/**
 * Integration tests for gifting existing service packages and subscription plans.
 * Covers buyer catalog → quote → purchase → delivery → recipient claim journeys.
 */
describe('Gift card package & subscription integration', () => {
  const baseGiftSettings: GiftCardBusinessSettings = {
    ...DEFAULT_GIFT_CARD_SETTINGS,
    purchaseEnabled: true,
    digitalDeliveryEnabled: true,
    physicalDeliveryEnabled: true,
    purchasablePackages: [{ packageId: 'pkg-1', price: 199 }],
    purchasableSubscriptionPlans: [{ planId: 'plan-1' }],
  };

  const business = {
    id: 'biz-1',
    name: 'Glow Salon',
    slug: 'glow-salon',
    settings: {
      currency: 'USD',
      giftCards: baseGiftSettings,
    },
  };

  const businessRepo = { findOne: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
  const giftCardRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const creditRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(),
  };
  const redemptionRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
  };
  const expirationAuditRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
  };

  const packagesService = {
    assertPackageBookable: jest.fn(),
    previewFromPackage: jest.fn(),
    getPublicPackage: jest.fn(),
    listPublicPackages: jest.fn().mockResolvedValue([]),
    createPackagePurchase: jest.fn(),
  };
  const subscriptionsService = {
    previewPlanPricing: jest.fn(),
    listPlans: jest.fn(),
    assignSubscription: jest.fn(),
  };
  const events = { emit: jest.fn() };

  const claimService = new GiftCardClaimService(
    giftCardRepo as any,
    packagesService as any,
    subscriptionsService as any,
  );
  const customerService = {
    findOrCreateByContact: jest.fn(
      async (_businessId: string, dto: { name: string; email: string }) => ({
        customer: { id: 'cust-linked', name: dto.name, email: dto.email },
        created: true,
      }),
    ),
  };

  const purchaseService = new GiftCardPurchaseService(
    businessRepo as any,
    serviceRepo as any,
    giftCardRepo as any,
    creditRepo as any,
    packagesService as any,
    subscriptionsService as any,
    claimService,
    customerService as any,
    events as unknown as EventEmitter2,
  );

  const giftCardsService = new GiftCardsService(
    giftCardRepo as any,
    creditRepo as any,
    redemptionRepo as any,
    expirationAuditRepo as any,
  );

  const emailService = { send: jest.fn().mockResolvedValue({ ok: true }) };
  const whatsappService = {
    sendGiftCardMessage: jest.fn().mockResolvedValue({ ok: true }),
  };
  const whatsappIntegrationService = {
    resolveRuntimeConfig: jest.fn().mockReturnValue({
      templateGiftCard: 'gift_card_delivery',
      templateLanguage: 'en',
      giftCardBodyParamCount: 4,
    }),
  };
  const configService = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };
  const deliveryService = new GiftCardDeliveryService(
    giftCardRepo as any,
    emailService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    configService as any,
  );

  const pkgEntity = {
    id: 'pkg-1',
    name: 'Summer glow',
    items: [{ serviceName: 'Facial', quantity: 1 }],
    discountType: 'percent',
    discountValue: 10,
  };

  const planPreview = {
    plan: {
      id: 'plan-1',
      name: '6 visits',
      includedAppointments: 6,
      durationMonths: 6,
    },
    pricing: { subscriptionPrice: 240, regularTotal: 300, savings: 60 },
  };

  let cardSeq = 0;
  const cards = new Map<string, Record<string, unknown>>();

  function hydrateCard(raw: Record<string, unknown>) {
    const id = (raw.id as string) ?? `gc-${++cardSeq}`;
    const saved = {
      ...raw,
      id,
      business,
      createdAt: raw.createdAt ?? new Date(),
    };
    cards.set(id, saved);
    return saved;
  }

  function setBusinessGiftSettings(
    overrides: Partial<GiftCardBusinessSettings>,
  ) {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        giftCards: { ...baseGiftSettings, ...overrides },
      },
    });
  }

  const digitalPackagePurchase = {
    cardType: 'package' as const,
    packageId: 'pkg-1',
    deliveryMethod: 'digital' as const,
    purchaserEmail: 'buyer@test.com',
  };

  const digitalSubscriptionPurchase = {
    cardType: 'subscription' as const,
    subscriptionPlanId: 'plan-1',
    deliveryMethod: 'digital' as const,
    purchaserEmail: 'buyer@test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cards.clear();
    cardSeq = 0;
    businessRepo.findOne.mockResolvedValue(business);

    giftCardRepo.save.mockImplementation(async (raw: Record<string, unknown>) =>
      hydrateCard(raw),
    );
    giftCardRepo.findOne.mockImplementation(
      async (opts: {
        where: Record<string, unknown>;
        relations?: Record<string, boolean>;
      }) => {
        if (opts.where.id) {
          const card = cards.get(opts.where.id as string);
          if (!card) return null;
          const copy = { ...card };
          if (opts.relations?.serviceCredits) {
            (copy as Record<string, unknown>).serviceCredits = [];
          }
          return copy;
        }
        if (opts.where.code) {
          const code = String(opts.where.code).trim().toUpperCase();
          const card = [...cards.values()].find(
            (c) =>
              String(c.code).toUpperCase() === code &&
              c.businessId === opts.where.businessId,
          );
          return card ? { ...card } : null;
        }
        return null;
      },
    );
    giftCardRepo.find.mockImplementation(
      async (opts: { where: Record<string, unknown> }) =>
        [...cards.values()].filter((c) => {
          if (opts.where.businessId && c.businessId !== opts.where.businessId)
            return false;
          if (
            opts.where.purchaserCustomerId &&
            c.purchaserCustomerId !== opts.where.purchaserCustomerId
          ) {
            return false;
          }
          return true;
        }),
    );

    packagesService.assertPackageBookable.mockResolvedValue(pkgEntity);
    packagesService.previewFromPackage.mockReturnValue({
      pricing: { packagePrice: 180 },
    });
    packagesService.getPublicPackage.mockResolvedValue({
      name: 'Summer glow',
      currency: 'USD',
      pricing: { packagePrice: 180, regularTotal: 200, savingsPercent: 10 },
      items: [{ serviceName: 'Facial', quantity: 1 }],
    });
    packagesService.createPackagePurchase.mockResolvedValue({
      id: 'purchase-1',
    });

    subscriptionsService.previewPlanPricing.mockResolvedValue(planPreview);
    subscriptionsService.listPlans.mockResolvedValue([
      {
        id: 'plan-1',
        name: '6 visits',
        isActive: true,
        service: { name: 'Facial', currency: 'USD' },
      },
    ]);
    subscriptionsService.assignSubscription.mockResolvedValue({ id: 'sub-1' });
  });

  describe('Public catalog', () => {
    it('returns purchase disabled when gift card sales are off', async () => {
      setBusinessGiftSettings({ purchaseEnabled: false });
      const catalog = await purchaseService.getPublicCatalog('biz-1');
      expect(catalog).toEqual({ purchaseEnabled: false, settings: null });
    });

    it('exposes configured packages and plans with savings metadata', async () => {
      const catalog = await purchaseService.getPublicCatalog('biz-1');
      expect(catalog.settings?.purchasablePackages).toEqual([
        expect.objectContaining({
          packageId: 'pkg-1',
          name: 'Summer glow',
          packagePrice: 199,
          regularTotal: 200,
          savingsPercent: 10,
        }),
      ]);
      expect(catalog.settings?.purchasableSubscriptionPlans).toEqual([
        expect.objectContaining({
          planId: 'plan-1',
          name: '6 visits',
          subscriptionPrice: 240,
          regularTotal: 300,
          savings: 60,
          savingsPercent: 20,
        }),
      ]);
    });

    it('auto-includes all active public packages and plans when admin selected none', async () => {
      packagesService.listPublicPackages.mockResolvedValue([
        {
          id: 'pkg-haircut',
          name: 'haricut package',
          currency: 'USD',
          pricing: {
            packagePrice: 80.75,
            regularTotal: 95,
            savingsPercent: 15,
          },
          items: [{ serviceName: 'Baby haircut', quantity: 1 }],
        },
      ]);
      packagesService.getPublicPackage.mockImplementation(
        async (_biz: string, id: string) => ({
          name: id === 'pkg-haircut' ? 'haricut package' : 'Summer glow',
          currency: 'USD',
          pricing: {
            packagePrice: 80.75,
            regularTotal: 95,
            savingsPercent: 15,
          },
          items: [{ serviceName: 'Baby haircut', quantity: 1 }],
        }),
      );
      subscriptionsService.listPlans.mockResolvedValue([
        {
          id: 'plan-baby',
          name: 'baby haircut subscribe',
          isActive: true,
          service: { name: 'Baby haircut', currency: 'USD' },
        },
      ]);
      subscriptionsService.previewPlanPricing.mockImplementation(
        async (_biz: string, planId: string) => ({
          plan: {
            id: planId,
            name: 'baby haircut subscribe',
            includedAppointments: 12,
            durationMonths: 12,
          },
          pricing: { subscriptionPrice: 255, regularTotal: 300, savings: 45 },
        }),
      );
      setBusinessGiftSettings({
        purchasablePackages: [],
        purchasableSubscriptionPlans: [],
      });

      const catalog = await purchaseService.getPublicCatalog('biz-1');
      expect(catalog.settings?.purchasablePackages?.[0]).toMatchObject({
        packageId: 'pkg-haircut',
        name: 'haricut package',
        packagePrice: 80.75,
      });
      expect(catalog.settings?.purchasableSubscriptionPlans?.[0]).toMatchObject(
        {
          planId: 'plan-baby',
          serviceName: 'Baby haircut',
          subscriptionPrice: 255,
          savings: 45,
        },
      );
    });

    it('only lists admin-selected packages that are still public', async () => {
      packagesService.getPublicPackage.mockImplementation(
        async (_biz: string, packageId: string) => {
          if (packageId !== 'pkg-1') throw new NotFoundException();
          return {
            name: 'Summer glow',
            currency: 'USD',
            pricing: {
              packagePrice: 180,
              regularTotal: 200,
              savingsPercent: 10,
            },
            items: [{ serviceName: 'Facial', quantity: 1 }],
          };
        },
      );
      setBusinessGiftSettings({
        purchasablePackages: [
          { packageId: 'pkg-1' },
          { packageId: 'pkg-other' },
        ],
      });

      const catalog = await purchaseService.getPublicCatalog('biz-1');
      expect(catalog.settings?.purchasablePackages).toHaveLength(1);
      expect(catalog.settings?.purchasablePackages?.[0].packageId).toBe(
        'pkg-1',
      );
    });

    it('omits inactive subscription plans from catalog', async () => {
      subscriptionsService.listPlans.mockResolvedValue([
        {
          id: 'plan-1',
          isActive: false,
          service: { name: 'Facial', currency: 'USD' },
        },
      ]);
      const catalog = await purchaseService.getPublicCatalog('biz-1');
      expect(catalog.settings?.purchasableSubscriptionPlans).toEqual([]);
    });

    it('omits catalog entries when underlying product is no longer available', async () => {
      packagesService.getPublicPackage.mockRejectedValueOnce(
        new NotFoundException(),
      );
      subscriptionsService.previewPlanPricing.mockRejectedValueOnce(
        new NotFoundException(),
      );

      const catalog = await purchaseService.getPublicCatalog('biz-1');
      expect(catalog.settings?.purchasablePackages).toEqual([]);
      expect(catalog.settings?.purchasableSubscriptionPlans).toEqual([]);
    });
  });

  describe('Package purchase (buyer)', () => {
    it('quotes configured catalog price and label', async () => {
      const quote = await purchaseService.quotePurchase('biz-1', {
        ...digitalPackagePurchase,
        recipientEmail: 'friend@test.com',
      });
      expect(quote).toMatchObject({
        cardType: 'package',
        subtotal: 199,
        shippingFee: 0,
        total: 199,
        label: expect.stringContaining('Summer glow'),
      });
    });

    it('quotes default package price when allowlist is empty', async () => {
      setBusinessGiftSettings({ purchasablePackages: [] });
      const quote = await purchaseService.quotePurchase(
        'biz-1',
        digitalPackagePurchase,
      );
      expect(quote.subtotal).toBe(180);
    });

    it('quotes physical delivery with shipping fee', async () => {
      const quote = await purchaseService.quotePurchase('biz-1', {
        ...digitalPackagePurchase,
        deliveryMethod: 'physical',
        shippingMethodId: 'standard',
        shippingAddress: {
          recipientName: 'Friend',
          line1: '1 Main St',
          city: 'Boston',
          postalCode: '02101',
          country: 'US',
        },
      });
      expect(quote.shippingFee).toBe(5);
      expect(quote.total).toBe(204);
    });

    it('rejects package purchase when product is not giftable or missing', async () => {
      await expect(
        purchaseService.quotePurchase('biz-1', {
          cardType: 'package',
          deliveryMethod: 'digital',
          purchaserEmail: 'buyer@test.com',
        } as any),
      ).rejects.toThrow('packageId is required');

      await expect(
        purchaseService.quotePurchase('biz-1', {
          ...digitalPackagePurchase,
          packageId: 'pkg-unknown',
        }),
      ).rejects.toThrow('not available');

      setBusinessGiftSettings({
        purchasablePackages: [{ packageId: 'pkg-allowed-only' }],
      });
      await expect(
        purchaseService.quotePurchase('biz-1', digitalPackagePurchase),
      ).rejects.toThrow('not available');

      packagesService.assertPackageBookable.mockRejectedValueOnce(
        new NotFoundException('gone'),
      );
      setBusinessGiftSettings({ purchasablePackages: [] });
      await expect(
        purchaseService.quotePurchase('biz-1', digitalPackagePurchase),
      ).rejects.toThrow();
    });

    it('fulfills a digital package gift for a recipient (unclaimed until redeem)', async () => {
      const card = await purchaseService.fulfillPurchase(
        'biz-1',
        { ...digitalPackagePurchase, recipientEmail: 'friend@test.com' },
        'sess_pkg',
      );

      expect(card.code).toMatch(
        new RegExp(`^${giftCardCodePrefix('package')}-`),
      );
      expect(card.packageId).toBe('pkg-1');
      expect(card.codeRevealed).toBe(true);
      expect(card.claimedAt).toBeFalsy();
      expect(card.isActive).toBe(true);
      expect(packagesService.createPackagePurchase).not.toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        EventType.PAYMENT_RECEIVED,
        expect.objectContaining({
          payload: expect.objectContaining({
            cardType: 'package',
            paymentMethod: 'online',
          }),
        }),
      );
    });

    it('auto-claims package when purchaser buys for self digitally', async () => {
      await purchaseService.fulfillPurchase('biz-1', {
        ...digitalPackagePurchase,
        buyForSelf: true,
        purchaserCustomerId: 'cust-self',
      });

      expect(packagesService.createPackagePurchase).toHaveBeenCalledWith(
        'biz-1',
        'pkg-1',
        'cust-self',
        expect.any(Number),
        'USD',
      );
      const stored = [...cards.values()].find(
        (c) => c.purchaserCustomerId === 'cust-self',
      );
      expect(stored?.claimedByCustomerId).toBe('cust-self');
      expect(stored?.isActive).toBe(false);
    });

    it('does not auto-claim physical package gifts even when buyForSelf', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        ...digitalPackagePurchase,
        deliveryMethod: 'physical',
        buyForSelf: true,
        purchaserCustomerId: 'cust-self',
        shippingMethodId: 'standard',
        shippingAddress: {
          recipientName: 'Self',
          line1: '1 Main St',
          city: 'Boston',
          postalCode: '02101',
          country: 'US',
        },
      });

      expect(card.codeRevealed).toBe(false);
      expect(card.fulfillmentStatus).toBe('awaiting_card_creation');
      expect(packagesService.createPackagePurchase).not.toHaveBeenCalled();
    });

    it('fulfills cash package purchase without stripe session', async () => {
      businessRepo.findOne.mockResolvedValue({
        ...business,
        settings: {
          ...business.settings,
          publicBooking: { acceptCashPayments: true },
        },
      });

      const card = await purchaseService.fulfillPurchase('biz-1', {
        ...digitalPackagePurchase,
        paymentMethod: 'cash',
      });

      expect(card.stripeSessionId).toBeNull();
      expect(events.emit).toHaveBeenCalledWith(
        EventType.PAYMENT_RECEIVED,
        expect.objectContaining({
          payload: expect.objectContaining({ paymentMethod: 'cash' }),
        }),
      );
    });

    it('lists package orders on purchaser account', async () => {
      await purchaseService.fulfillPurchase('biz-1', {
        ...digitalPackagePurchase,
        purchaserCustomerId: 'cust-buyer',
      });

      const orders = await purchaseService.listCustomerOrders(
        'biz-1',
        'cust-buyer',
      );
      expect(orders).toHaveLength(1);
      expect(orders[0].cardType).toBe('package');
    });
  });

  describe('Subscription purchase (buyer)', () => {
    it('quotes plan price and savings from preview', async () => {
      const quote = await purchaseService.quotePurchase(
        'biz-1',
        digitalSubscriptionPurchase,
      );
      expect(quote).toMatchObject({
        cardType: 'subscription',
        subtotal: 240,
        label: expect.stringContaining('6 visits'),
      });
    });

    it('quotes configured subscription override price', async () => {
      setBusinessGiftSettings({
        purchasableSubscriptionPlans: [{ planId: 'plan-1', price: 220 }],
      });
      const quote = await purchaseService.quotePurchase(
        'biz-1',
        digitalSubscriptionPurchase,
      );
      expect(quote.subtotal).toBe(220);
    });

    it('quotes default plan price when allowlist is empty', async () => {
      setBusinessGiftSettings({ purchasableSubscriptionPlans: [] });
      const quote = await purchaseService.quotePurchase(
        'biz-1',
        digitalSubscriptionPurchase,
      );
      expect(quote.subtotal).toBe(240);
    });

    it('rejects subscription purchase when plan is missing or not giftable', async () => {
      await expect(
        purchaseService.quotePurchase('biz-1', {
          cardType: 'subscription',
          deliveryMethod: 'digital',
          purchaserEmail: 'buyer@test.com',
        } as any),
      ).rejects.toThrow('subscriptionPlanId is required');

      await expect(
        purchaseService.quotePurchase('biz-1', {
          ...digitalSubscriptionPurchase,
          subscriptionPlanId: 'plan-unknown',
        }),
      ).rejects.toThrow('not available');

      setBusinessGiftSettings({
        purchasableSubscriptionPlans: [{ planId: 'other-plan' }],
      });
      await expect(
        purchaseService.quotePurchase('biz-1', digitalSubscriptionPurchase),
      ).rejects.toThrow('not available');
    });

    it('fulfills digital subscription gift for recipient (claim later)', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        ...digitalSubscriptionPurchase,
        recipientEmail: 'friend@test.com',
      });

      expect(card.code).toMatch(
        new RegExp(`^${giftCardCodePrefix('subscription')}-`),
      );
      expect(card.subscriptionPlanId).toBe('plan-1');
      expect(card.claimedAt).toBeFalsy();
      expect(subscriptionsService.assignSubscription).not.toHaveBeenCalled();
    });

    it('auto-claims subscription when purchaser buys for self digitally', async () => {
      const quote = await purchaseService.quotePurchase('biz-1', {
        ...digitalSubscriptionPurchase,
        buyForSelf: true,
        purchaserCustomerId: 'cust-self',
      });

      await purchaseService.fulfillPurchase('biz-1', {
        ...digitalSubscriptionPurchase,
        buyForSelf: true,
        purchaserCustomerId: 'cust-self',
      });

      expect(subscriptionsService.assignSubscription).toHaveBeenCalledWith(
        'biz-1',
        'cust-self',
        'plan-1',
        expect.objectContaining({ pricePaid: quote.total, currency: 'USD' }),
      );
      const stored = [...cards.values()].find(
        (c) => c.purchaserCustomerId === 'cust-self',
      );
      expect(stored?.isActive).toBe(false);
    });

    it('rejects purchase when gift card sales are disabled', async () => {
      setBusinessGiftSettings({ purchaseEnabled: false });
      await expect(
        purchaseService.quotePurchase('biz-1', digitalSubscriptionPurchase),
      ).rejects.toThrow('not enabled');
    });
  });

  describe('Recipient claim', () => {
    it('claims package gift and creates package purchase for recipient', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        ...digitalPackagePurchase,
        recipientEmail: 'friend@test.com',
      });

      const result = await claimService.claimByCode(
        'biz-1',
        card.code,
        'cust-recipient',
      );
      expect(result).toEqual({
        giftCardId: card.id,
        cardType: 'package',
        packagePurchaseId: 'purchase-1',
      });
      expect(packagesService.createPackagePurchase).toHaveBeenCalledWith(
        'biz-1',
        'pkg-1',
        'cust-recipient',
        card.purchaseAmount,
        card.currency,
      );

      const stored = cards.get(card.id);
      expect(stored?.claimedByCustomerId).toBe('cust-recipient');
      expect(stored?.isActive).toBe(false);
    });

    it('claims subscription gift and assigns plan to recipient', async () => {
      const card = await purchaseService.fulfillPurchase(
        'biz-1',
        digitalSubscriptionPurchase,
      );

      const result = await claimService.claimByCode(
        'biz-1',
        card.code,
        'cust-recipient',
      );
      expect(result.subscriptionId).toBe('sub-1');
      expect(subscriptionsService.assignSubscription).toHaveBeenCalledWith(
        'biz-1',
        'cust-recipient',
        'plan-1',
        expect.objectContaining({ pricePaid: card.purchaseAmount }),
      );
    });

    it('rejects claim when code is missing, expired, unrevealed, wrong type, or already claimed', async () => {
      await expect(
        claimService.claimByCode('biz-1', 'GCP-MISSING', 'cust-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      const unrevealed = hydrateCard({
        businessId: 'biz-1',
        code: generateGiftCardCode('package'),
        cardType: 'package',
        packageId: 'pkg-1',
        isActive: true,
        codeRevealed: false,
        currency: 'USD',
        purchaseAmount: 100,
      });
      await expect(
        claimService.claimCard('biz-1', unrevealed as any, 'cust-1'),
      ).rejects.toThrow('not yet active');

      const expired = hydrateCard({
        businessId: 'biz-1',
        code: generateGiftCardCode('subscription'),
        cardType: 'subscription',
        subscriptionPlanId: 'plan-1',
        isActive: true,
        codeRevealed: true,
        expiresAt: new Date('2020-01-01'),
        currency: 'USD',
        purchaseAmount: 80,
      });
      await expect(
        claimService.claimCard('biz-1', expired as any, 'cust-1'),
      ).rejects.toThrow('expired');

      const monetary = hydrateCard({
        businessId: 'biz-1',
        code: generateGiftCardCode('monetary'),
        cardType: 'monetary',
        balance: 50,
        initialBalance: 50,
        isActive: true,
        codeRevealed: true,
        currency: 'USD',
      });
      await expect(
        claimService.claimCard('biz-1', monetary as any, 'cust-1'),
      ).rejects.toThrow('Monetary gift cards are redeemed at booking checkout');

      const missingPackageRef = hydrateCard({
        businessId: 'biz-1',
        code: generateGiftCardCode('package'),
        cardType: 'package',
        packageId: null,
        isActive: true,
        codeRevealed: true,
        currency: 'USD',
      });
      await expect(
        claimService.claimCard('biz-1', missingPackageRef as any, 'cust-1'),
      ).rejects.toThrow('missing package reference');

      const missingPlanRef = hydrateCard({
        businessId: 'biz-1',
        code: generateGiftCardCode('subscription'),
        cardType: 'subscription',
        subscriptionPlanId: null,
        isActive: true,
        codeRevealed: true,
        currency: 'USD',
      });
      await expect(
        claimService.claimCard('biz-1', missingPlanRef as any, 'cust-1'),
      ).rejects.toThrow('missing subscription plan reference');

      const subscriptionCard = await purchaseService.fulfillPurchase(
        'biz-1',
        digitalSubscriptionPurchase,
      );
      await claimService.claimByCode('biz-1', subscriptionCard.code, 'cust-1');
      await expect(
        claimService.claimByCode('biz-1', subscriptionCard.code, 'cust-2'),
      ).rejects.toThrow('no longer active');
    });

    it('rejects claim when package is no longer bookable', async () => {
      const card = await purchaseService.fulfillPurchase(
        'biz-1',
        digitalPackagePurchase,
      );
      packagesService.assertPackageBookable.mockRejectedValueOnce(
        new NotFoundException('removed'),
      );

      await expect(
        claimService.claimByCode('biz-1', card.code, 'cust-late'),
      ).rejects.toThrow('removed');
    });
  });

  describe('Checkout validation & order policy', () => {
    it('routes checkout validation to account claim for package and subscription cards', async () => {
      const packageCard = await purchaseService.fulfillPurchase(
        'biz-1',
        digitalPackagePurchase,
      );
      await expect(
        giftCardsService.validate('biz-1', packageCard.code),
      ).rejects.toThrow('Claim this gift card from your account');

      const subscriptionCard = await purchaseService.fulfillPurchase(
        'biz-1',
        digitalSubscriptionPurchase,
      );
      await expect(
        giftCardsService.validate('biz-1', subscriptionCard.code),
      ).rejects.toThrow('Claim this gift card from your account');
    });

    it('evaluates cancel policy before claim and marks gift fully redeemed after', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        ...digitalPackagePurchase,
        recipientEmail: 'friend@test.com',
      });

      expect(
        isGiftCardFullyRedeemed({ cardType: 'package', isActive: true }),
      ).toBe(false);
      expect(hasGiftCardValueBeenUsed({ cardType: 'package' })).toBe(false);

      const policyBefore = evaluateGiftCardOrderPolicy(
        {
          cardType: 'package',
          createdAt: card.createdAt,
          deliveryMethod: 'digital',
          fulfillmentStatus: 'pending',
          isActive: true,
        },
        baseGiftSettings,
        null,
      );
      expect(policyBefore.canCancel).toBe(true);

      await claimService.claimByCode('biz-1', card.code, 'cust-1');
      const stored = cards.get(card.id);
      expect(
        isGiftCardFullyRedeemed({
          cardType: 'package',
          claimedAt: stored?.claimedAt,
        }),
      ).toBe(true);
      expect(
        hasGiftCardValueBeenUsed({
          cardType: 'package',
          claimedAt: stored?.claimedAt,
        }),
      ).toBe(true);

      const policyAfter = evaluateGiftCardOrderPolicy(
        {
          cardType: 'package',
          createdAt: card.createdAt,
          deliveryMethod: 'digital',
          fulfillmentStatus: 'pending',
          isActive: stored?.isActive as boolean,
          claimedAt: stored?.claimedAt as Date,
        },
        baseGiftSettings,
        null,
      );
      expect(policyAfter.canCancel).toBe(false);
      expect(policyAfter.blockReason).toMatch(
        /fully redeemed|already been used/,
      );
    });
  });

  describe('Digital delivery notifications', () => {
    it('sends account-claim instructions for package gifts', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        ...digitalPackagePurchase,
        recipientEmail: 'friend@test.com',
      });

      giftCardRepo.findOne.mockResolvedValue({
        ...card,
        recipientEmail: 'friend@test.com',
        business,
        serviceCredits: [],
      });
      await deliveryService.deliverDigitalGiftCard(card.id);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringMatching(
            /book\/.*\/account|Redeem in your account/,
          ),
        }),
      );
    });

    it('sends account-claim instructions for subscription gifts via email and WhatsApp', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        ...digitalSubscriptionPurchase,
        recipientEmail: 'friend@test.com',
        recipientPhone: '+15551234567',
      });

      giftCardRepo.findOne.mockResolvedValue({
        ...card,
        recipientEmail: 'friend@test.com',
        recipientPhone: '+15551234567',
        business,
        serviceCredits: [],
      });
      await deliveryService.deliverDigitalGiftCard(card.id);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('https://app.test/book/glow-salon'),
        }),
      );
      expect(
        whatsappService.sendGiftCardMessage.mock.calls[0][0],
      ).toMatchObject({
        toPhone: '+15551234567',
        giftCardCode: card.code,
      });
    });
  });
});
