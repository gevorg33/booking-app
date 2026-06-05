import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftCardPurchaseService } from './gift-card-purchase.service.js';
import { GiftCardOrderService } from './gift-card-order.service.js';
import { GiftCardFulfillmentService } from './gift-card-fulfillment.service.js';
import { GiftCardClaimService } from './gift-card-claim.service.js';
import { GiftCardRefundService } from './gift-card-refund.service.js';
import { GiftCardsService } from './gift-cards.service.js';
import { DEFAULT_GIFT_CARD_SETTINGS } from './gift-card.types.js';

/**
 * Integration: customer "My gift cards" list visibility and code masking.
 * - Orders exist only after payment fulfillment (fulfillPurchase), not while checkout is pending.
 * - Codes show when codeRevealed is true (digital immediately; physical after fulfillment steps).
 */
describe('Gift card customer orders integration', () => {
  const business = {
    id: 'biz-1',
    name: 'Glow Salon',
    slug: 'glow-salon',
    settings: {
      currency: 'USD',
      giftCards: {
        ...DEFAULT_GIFT_CARD_SETTINGS,
        purchaseEnabled: true,
        digitalDeliveryEnabled: true,
        physicalDeliveryEnabled: true,
        presetAmounts: [50, 100],
        purchasableServices: [{ serviceId: 'svc-1', price: 25 }],
        purchasablePackages: [{ packageId: 'pkg-1' }],
        shippingMethods: [
          {
            id: 'standard',
            label: 'Standard',
            fee: 5,
            estimatedDays: '5–7 business days',
          },
        ],
        cardCreatorStaffIds: ['emp-creator'],
        deliveryStaffIds: ['emp-driver'],
      },
    },
  };

  const businessRepo = { findOne: jest.fn() };
  const servicesById: Record<
    string,
    { id: string; name: string; price: number; businessId: string }
  > = {
    'svc-1': {
      id: 'svc-1',
      name: 'Baby haircut',
      price: 25,
      businessId: 'biz-1',
    },
    'svc-2': {
      id: 'svc-2',
      name: "men's haircut",
      price: 35,
      businessId: 'biz-1',
    },
    'svc-3': {
      id: 'svc-3',
      name: "girl's haircut",
      price: 35,
      businessId: 'biz-1',
    },
  };
  const serviceRepo = {
    findOne: jest.fn(
      async ({ where }: { where: { id: string; businessId?: string } }) =>
        servicesById[where.id] ?? null,
    ),
  };
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
    save: jest.fn(async (v: Record<string, unknown>) => v),
    find: jest.fn().mockResolvedValue([]),
  };
  const expirationAuditRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(async (v: Record<string, unknown>) => v),
    find: jest.fn().mockResolvedValue([]),
  };
  const changeRequestRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    createQueryBuilder: jest.fn(),
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
    listPlans: jest.fn().mockResolvedValue([]),
    assignSubscription: jest.fn(),
  };

  const stripeService = {
    isConfigured: false,
    client: {
      checkout: { sessions: { retrieve: jest.fn() } },
      refunds: { create: jest.fn() },
    },
    connectRequestOptions: jest.fn(),
  };
  const stripeIntegrationService = { resolveConnectAccountId: jest.fn() };
  const refundService = new GiftCardRefundService(
    giftCardRepo as any,
    stripeService as any,
    stripeIntegrationService as any,
  );
  const employeeRepo = {
    findOne: jest.fn(async ({ where }: { where: { id: string } }) =>
      where.id === 'emp-creator'
        ? { id: 'emp-creator', userId: 'user-creator', businessId: 'biz-1' }
        : null,
    ),
    find: jest.fn(),
  };
  const zendeskService = { createGiftCardChangeTicket: jest.fn() };
  const emailService = { send: jest.fn() };
  const whatsappService = { sendGiftCardMessage: jest.fn() };
  const whatsappIntegrationService = {
    resolveRuntimeConfig: jest.fn().mockReturnValue(null),
  };

  const customers = new Map<
    string,
    { id: string; businessId: string; name: string; email: string }
  >();

  const claimService = new GiftCardClaimService(
    giftCardRepo as any,
    packagesService as any,
    subscriptionsService as any,
  );
  const customerService = {
    findOrCreateByContact: jest.fn(
      async (_businessId: string, dto: { name: string; email: string }) => {
        const email = dto.email.toLowerCase();
        const existing = [...customers.values()].find(
          (c) => c.email?.toLowerCase() === email,
        );
        if (existing) return { customer: existing, created: false };
        const customer = {
          id: `cust-${customers.size + 1}`,
          businessId: 'biz-1',
          name: dto.name,
          email: dto.email,
        };
        customers.set(customer.id, customer);
        return { customer, created: true };
      },
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
    { emit: jest.fn() } as unknown as EventEmitter2,
  );

  const fulfillmentService = new GiftCardFulfillmentService(
    giftCardRepo as any,
    employeeRepo as any,
    { emit: jest.fn() } as unknown as EventEmitter2,
  );

  const orderService = new GiftCardOrderService(
    giftCardRepo as any,
    changeRequestRepo as any,
    businessRepo as any,
    zendeskService as any,
    emailService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    refundService,
  );

  const giftCardsService = new GiftCardsService(
    giftCardRepo as any,
    creditRepo as any,
    redemptionRepo as any,
    expirationAuditRepo as any,
  );

  const bundleBusiness = {
    ...business,
    settings: {
      ...business.settings,
      giftCards: {
        ...business.settings.giftCards,
        bundles: [
          {
            id: 'bundle-1',
            name: 'Hair trio',
            price: 95,
            lines: [
              { serviceId: 'svc-1', serviceName: 'Baby haircut', quantity: 1 },
              { serviceId: 'svc-2', serviceName: "men's haircut", quantity: 1 },
              {
                serviceId: 'svc-3',
                serviceName: "girl's haircut",
                quantity: 1,
              },
            ],
          },
        ],
      },
    },
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

  function emptyChangeRequestQuery() {
    const chain = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getMany: jest.fn().mockResolvedValue([]),
    };
    changeRequestRepo.createQueryBuilder.mockReturnValue(chain);
    return chain;
  }

  const shippingAddress = {
    recipientName: 'Sam',
    line1: '10 Main St',
    city: 'Boston',
    postalCode: '02101',
    country: 'US',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cards.clear();
    cardSeq = 0;
    businessRepo.findOne.mockResolvedValue(business);
    emptyChangeRequestQuery();

    giftCardRepo.save.mockImplementation(async (raw: Record<string, unknown>) =>
      hydrateCard(raw),
    );
    creditRepo.save.mockImplementation(async (raw: Record<string, unknown>) => {
      const card = cards.get(raw.giftCardId as string);
      if (card) {
        const existing = (
          (card.serviceCredits as Array<Record<string, unknown>>) ?? []
        ).find((credit) => credit.serviceId === raw.serviceId);
        if (existing) {
          Object.assign(existing, raw);
          return existing;
        }
        const credit = {
          ...raw,
          id: raw.id ?? `credit-${String(raw.serviceId)}`,
        };
        card.serviceCredits = [
          ...((card.serviceCredits as unknown[]) ?? []),
          credit,
        ];
        cards.set(card.id as string, card);
        return credit;
      }
      return raw;
    });
    giftCardRepo.findOne.mockImplementation(
      async (opts: { where: Record<string, unknown> }) => {
        if (opts.where.code) {
          const code = String(opts.where.code).trim().toUpperCase();
          const card = [...cards.values()].find(
            (c) =>
              String(c.code).toUpperCase() === code &&
              (!opts.where.businessId ||
                c.businessId === opts.where.businessId),
          );
          return card
            ? { ...card, serviceCredits: card.serviceCredits ?? [] }
            : null;
        }
        if (!opts.where.id) return null;
        const card = cards.get(opts.where.id as string);
        if (!card) return null;
        if (opts.where.businessId && card.businessId !== opts.where.businessId)
          return null;
        if (
          opts.where.purchaserCustomerId &&
          card.purchaserCustomerId !== opts.where.purchaserCustomerId
        ) {
          return null;
        }
        return { ...card, serviceCredits: card.serviceCredits ?? [] };
      },
    );
    giftCardRepo.find.mockImplementation(
      async (opts: {
        where: Record<string, unknown>;
        order?: { createdAt?: string; claimedAt?: string };
      }) => {
        const filtered = [...cards.values()].filter((c) => {
          if (opts.where.businessId && c.businessId !== opts.where.businessId)
            return false;
          if (
            opts.where.purchaserCustomerId &&
            c.purchaserCustomerId !== opts.where.purchaserCustomerId
          ) {
            return false;
          }
          if (
            opts.where.claimedByCustomerId &&
            c.claimedByCustomerId !== opts.where.claimedByCustomerId
          ) {
            return false;
          }
          if (opts.where.claimedByCustomerId && !c.claimedAt) return false;
          return true;
        });
        if (opts.order?.claimedAt === 'DESC') {
          return filtered.sort(
            (a, b) =>
              new Date(b.claimedAt as Date).getTime() -
              new Date(a.claimedAt as Date).getTime(),
          );
        }
        if (opts.order?.createdAt === 'DESC') {
          return filtered.sort(
            (a, b) =>
              new Date(b.createdAt as Date).getTime() -
              new Date(a.createdAt as Date).getTime(),
          );
        }
        return filtered;
      },
    );
  });

  describe('Order list only after payment (fulfillment)', () => {
    it('shows no orders for a signed-in customer before fulfillPurchase (unpaid checkout)', async () => {
      await expect(
        orderService.listCustomerOrders('biz-1', 'cust-buyer'),
      ).resolves.toEqual([]);
      await expect(
        purchaseService.listCustomerOrders('biz-1', 'cust-buyer'),
      ).resolves.toEqual([]);
      expect(cards.size).toBe(0);
    });

    it('shows the order after digital payment fulfillment with the real code', async () => {
      const card = await purchaseService.fulfillPurchase(
        'biz-1',
        {
          cardType: 'service',
          serviceId: 'svc-1',
          deliveryMethod: 'digital',
          purchaserEmail: 'buyer@test.com',
          purchaserCustomerId: 'cust-buyer',
          recipientEmail: 'friend@test.com',
        },
        'sess_paid_1',
      );

      expect(card.codeRevealed).toBe(true);

      const viaOrderService = await orderService.listCustomerOrders(
        'biz-1',
        'cust-buyer',
      );
      expect(viaOrderService).toHaveLength(1);
      expect(viaOrderService[0].code).toBe(card.code);
      expect(viaOrderService[0].code).not.toBe('****');
      expect(viaOrderService[0].fulfillmentStatus).toBe('pending');

      const viaPurchaseService = await purchaseService.listCustomerOrders(
        'biz-1',
        'cust-buyer',
      );
      expect(viaPurchaseService[0].id).toBe(card.id);

      const detail = await orderService.getCustomerOrder(
        'biz-1',
        'cust-buyer',
        card.id,
      );
      expect(detail.code).toBe(card.code);
    });

    it('links guest purchases to purchaser customer at fulfillPurchase', async () => {
      await purchaseService.fulfillPurchase(
        'biz-1',
        {
          cardType: 'monetary',
          amount: 50,
          deliveryMethod: 'digital',
          purchaserEmail: 'guest@test.com',
          purchaserName: 'Guest Buyer',
        },
        'sess_guest',
      );

      expect(cards.size).toBe(1);
      const guestCard = [...cards.values()][0];
      expect(guestCard.purchaserCustomerId).toBe('cust-1');
      expect(guestCard.purchaserName).toBe('Guest Buyer');

      const orders = await orderService.listCustomerOrders('biz-1', 'cust-1');
      expect(orders).toHaveLength(1);
      expect(orders[0].code).toBe(guestCard.code);
    });

    it('rejects getCustomerOrder for another customer or missing order', async () => {
      const card = await purchaseService.fulfillPurchase(
        'biz-1',
        {
          cardType: 'monetary',
          amount: 25,
          deliveryMethod: 'digital',
          purchaserEmail: 'buyer@test.com',
          purchaserCustomerId: 'cust-owner',
        },
        'sess_owner',
      );

      await expect(
        orderService.getCustomerOrder('biz-1', 'cust-stranger', card.id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Code masking by delivery and fulfillment status', () => {
    it('masks code as **** for paid physical orders until delivery reveals it', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'monetary',
        amount: 100,
        deliveryMethod: 'physical',
        shippingMethodId: 'standard',
        shippingAddress,
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
      });

      expect(card.codeRevealed).toBe(false);
      expect(card.fulfillmentStatus).toBe('awaiting_card_creation');

      let orders = await orderService.listCustomerOrders('biz-1', 'cust-buyer');
      expect(orders).toHaveLength(1);
      expect(orders[0].code).toBe('****');
      expect(orders[0].purchaseAmount).toBe(105);

      let detail = await orderService.getCustomerOrder(
        'biz-1',
        'cust-buyer',
        card.id,
      );
      expect(detail.code).toBe('****');

      const delivered = await fulfillmentService.markDelivered(
        'biz-1',
        card.id,
      );
      expect(delivered.codeRevealed).toBe(true);

      orders = await orderService.listCustomerOrders('biz-1', 'cust-buyer');
      expect(orders[0].code).toBe(card.code);

      detail = await orderService.getCustomerOrder(
        'biz-1',
        'cust-buyer',
        card.id,
      );
      expect(detail.code).toBe(card.code);
      expect(detail.fulfillmentStatus).toBe('delivered');
    });

    it('reveals code in customer list when physical card is marked ready (before delivery)', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'service',
        serviceId: 'svc-1',
        deliveryMethod: 'physical',
        shippingMethodId: 'standard',
        shippingAddress,
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
      });

      expect(
        await orderService.listCustomerOrders('biz-1', 'cust-buyer'),
      ).toEqual([expect.objectContaining({ code: '****' })]);

      await fulfillmentService.markCardReady('biz-1', card.id, 'user-creator');

      const orders = await orderService.listCustomerOrders(
        'biz-1',
        'cust-buyer',
      );
      expect(orders[0].code).toBe(card.code);
      expect(orders[0].fulfillmentStatus).toBe('ready_for_delivery');
    });

    it('reveals code when physical order is marked shipped', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'physical',
        shippingMethodId: 'standard',
        shippingAddress,
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
      });

      await fulfillmentService.markCardReady('biz-1', card.id, 'user-creator');
      await fulfillmentService.markOutForDelivery(
        'biz-1',
        card.id,
        'user-creator',
      );
      await fulfillmentService.markShipped('biz-1', card.id, 'DHL', 'TRACK-1');

      const orders = await orderService.listCustomerOrders(
        'biz-1',
        'cust-buyer',
      );
      expect(orders[0].code).toBe(card.code);
      expect(orders[0].trackingNumber).toBe('TRACK-1');
    });
  });

  describe('Multiple orders and sort order', () => {
    it('lists all purchaser orders newest first with correct code visibility per card', async () => {
      const older = await purchaseService.fulfillPurchase(
        'biz-1',
        {
          cardType: 'monetary',
          amount: 40,
          deliveryMethod: 'digital',
          purchaserEmail: 'buyer@test.com',
          purchaserCustomerId: 'cust-buyer',
        },
        'sess_old',
      );
      const storedOlder = cards.get(older.id)!;
      storedOlder.createdAt = new Date('2026-01-01');

      const newer = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'monetary',
        amount: 60,
        deliveryMethod: 'physical',
        shippingMethodId: 'standard',
        shippingAddress,
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
      });
      const storedNewer = cards.get(newer.id)!;
      storedNewer.createdAt = new Date('2026-06-01');

      const orders = await orderService.listCustomerOrders(
        'biz-1',
        'cust-buyer',
      );
      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe(newer.id);
      expect(orders[0].code).toBe('****');
      expect(orders[1].id).toBe(older.id);
      expect(orders[1].code).toBe(older.code);
    });
  });

  describe('Account: ordered vs redeemed lists', () => {
    beforeEach(() => {
      packagesService.assertPackageBookable.mockResolvedValue({
        id: 'pkg-1',
        name: 'Summer package',
        items: [],
      });
      packagesService.previewFromPackage.mockReturnValue({
        pricing: { packagePrice: 199 },
      });
      packagesService.createPackagePurchase.mockResolvedValue({
        id: 'purchase-1',
      });
    });

    it('returns empty orders and redeemed for new customer', async () => {
      const account = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-new',
      );
      expect(account).toEqual({ orders: [], redeemed: [] });
    });

    it('lists purchased cards under orders only until recipient claims', async () => {
      const purchased = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'package',
        packageId: 'pkg-1',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
        recipientEmail: 'friend@test.com',
      });

      let account = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-buyer',
      );
      expect(account.orders).toHaveLength(1);
      expect(account.orders[0].id).toBe(purchased.id);
      expect(account.redeemed).toEqual([]);

      account = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-friend',
      );
      expect(account.orders).toEqual([]);
      expect(account.redeemed).toEqual([]);
    });

    it('lists claimed package under redeemed for recipient and keeps order under purchaser', async () => {
      const purchased = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'package',
        packageId: 'pkg-1',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
        recipientEmail: 'friend@test.com',
      });

      await claimService.claimByCode('biz-1', purchased.code, 'cust-friend');

      const buyerAccount = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-buyer',
      );
      expect(buyerAccount.orders).toHaveLength(1);
      expect(buyerAccount.redeemed).toEqual([]);

      const friendAccount = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-friend',
      );
      expect(friendAccount.orders).toEqual([]);
      expect(friendAccount.redeemed).toHaveLength(1);
      expect(friendAccount.redeemed[0]).toMatchObject({
        cardType: 'package',
        code: purchased.code,
        packageId: 'pkg-1',
        claimedAt: expect.any(String),
      });
      expect(friendAccount.redeemed[0].code).not.toBe('****');
    });

    it('lists claimed service gift under redeemed with remaining credits', async () => {
      const purchased = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'service',
        serviceId: 'svc-1',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
        recipientEmail: 'friend@test.com',
      });

      await claimService.claimByCode('biz-1', purchased.code, 'cust-friend');

      const friendAccount = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-friend',
      );
      expect(friendAccount.redeemed).toHaveLength(1);
      expect(friendAccount.redeemed[0]).toMatchObject({
        cardType: 'service',
        code: purchased.code,
      });
      expect(friendAccount.redeemed[0].serviceCredits).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            serviceId: 'svc-1',
            serviceName: 'Baby haircut',
            quantityRemaining: 1,
            quantityTotal: 1,
          }),
        ]),
      );
      const stored = cards.get(purchased.id);
      expect(stored?.isActive).toBe(true);
    });

    it('reflects zero remaining credits on redeemed bundle after all services are used', async () => {
      businessRepo.findOne.mockResolvedValue(bundleBusiness);

      const purchased = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'bundle',
        bundleId: 'bundle-1',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
        recipientEmail: 'friend@test.com',
      });

      await claimService.claimByCode('biz-1', purchased.code, 'cust-friend');

      await giftCardsService.redeemServiceCredit(
        'biz-1',
        purchased.code,
        'svc-1',
        'b-1',
      );
      await giftCardsService.redeemServiceCredit(
        'biz-1',
        purchased.code,
        'svc-2',
        'b-2',
      );
      await giftCardsService.redeemServiceCredit(
        'biz-1',
        purchased.code,
        'svc-3',
        'b-3',
      );

      const friendAccount = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-friend',
      );
      expect(friendAccount.redeemed).toHaveLength(1);
      expect(friendAccount.redeemed[0]).toMatchObject({
        cardType: 'bundle',
        code: purchased.code,
      });
      expect(friendAccount.redeemed[0].serviceCredits).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            serviceId: 'svc-1',
            quantityRemaining: 0,
            quantityTotal: 1,
          }),
          expect.objectContaining({
            serviceId: 'svc-2',
            quantityRemaining: 0,
            quantityTotal: 1,
          }),
          expect.objectContaining({
            serviceId: 'svc-3',
            quantityRemaining: 0,
            quantityTotal: 1,
          }),
        ]),
      );
      expect(
        friendAccount.redeemed[0].serviceCredits.every(
          (credit) => credit.quantityRemaining === 0,
        ),
      ).toBe(true);

      businessRepo.findOne.mockResolvedValue(business);
    });

    it('reflects partial remaining credits on redeemed bundle after some services are used', async () => {
      businessRepo.findOne.mockResolvedValue(bundleBusiness);

      const purchased = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'bundle',
        bundleId: 'bundle-1',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
        recipientEmail: 'friend@test.com',
      });

      await claimService.claimByCode('biz-1', purchased.code, 'cust-friend');
      await giftCardsService.redeemServiceCredit(
        'biz-1',
        purchased.code,
        'svc-1',
        'b-1',
      );

      const friendAccount = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-friend',
      );
      const credits = friendAccount.redeemed[0].serviceCredits;
      expect(
        credits.find((credit) => credit.serviceId === 'svc-1')
          ?.quantityRemaining,
      ).toBe(0);
      expect(
        credits.find((credit) => credit.serviceId === 'svc-2')
          ?.quantityRemaining,
      ).toBe(1);
      expect(
        credits.find((credit) => credit.serviceId === 'svc-3')
          ?.quantityRemaining,
      ).toBe(1);

      businessRepo.findOne.mockResolvedValue(business);
    });

    it('reflects zero remaining credits on redeemed service gift after checkout redemption', async () => {
      const purchased = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'service',
        serviceId: 'svc-1',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-buyer',
        recipientEmail: 'friend@test.com',
      });

      await claimService.claimByCode('biz-1', purchased.code, 'cust-friend');
      await giftCardsService.redeemServiceCredit(
        'biz-1',
        purchased.code,
        'svc-1',
        'b-1',
      );

      const friendAccount = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-friend',
      );
      expect(friendAccount.redeemed[0].serviceCredits).toEqual([
        expect.objectContaining({
          serviceId: 'svc-1',
          quantityRemaining: 0,
          quantityTotal: 1,
        }),
      ]);
    });

    it('lists buy-for-self package in both orders and redeemed after auto-claim', async () => {
      await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'package',
        packageId: 'pkg-1',
        deliveryMethod: 'digital',
        purchaserEmail: 'self@test.com',
        buyForSelf: true,
        purchaserCustomerId: 'cust-self',
      });

      const account = await orderService.listCustomerGiftCardAccount(
        'biz-1',
        'cust-self',
      );
      expect(account.orders).toHaveLength(1);
      expect(account.redeemed).toHaveLength(1);
      expect(account.redeemed[0].packageId).toBe('pkg-1');
      expect(account.orders[0].id).toBe(account.redeemed[0].id);
    });

    it('exposes full code on redeemed cards (not masked)', async () => {
      const card = await purchaseService.fulfillPurchase('biz-1', {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'digital',
        purchaserEmail: 'giver@test.com',
        recipientEmail: 'recipient@test.com',
      });

      const unredeemed = hydrateCard({
        ...card,
        businessId: 'biz-1',
        claimedByCustomerId: 'cust-redeemer',
        claimedAt: new Date('2026-06-01'),
        isActive: false,
        codeRevealed: true,
      });
      cards.set(unredeemed.id, unredeemed);

      const redeemed = await orderService.listCustomerRedeemedGiftCards(
        'biz-1',
        'cust-redeemer',
      );
      expect(redeemed[0].code).toBe(card.code);
    });
  });
});
