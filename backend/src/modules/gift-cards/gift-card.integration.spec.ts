import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftCardPurchaseService } from './gift-card-purchase.service.js';
import { GiftCardFulfillmentService } from './gift-card-fulfillment.service.js';
import { GiftCardDeliveryService } from './gift-card-delivery.service.js';
import { GiftCardsService } from './gift-cards.service.js';
import { GiftCardOrderService } from './gift-card-order.service.js';
import { GiftCardRefundService } from './gift-card-refund.service.js';

describe('Gift card end-to-end integration', () => {
  const business = {
    id: 'biz-1',
    slug: 'glow-salon',
    name: 'Glow Salon',
    settings: {
      currency: 'EUR',
      giftCards: {
        purchaseEnabled: true,
        digitalDeliveryEnabled: true,
        physicalDeliveryEnabled: true,
        presetAmounts: [50, 100],
        purchasableServices: [{ serviceId: 'svc-1', price: 45 }],
        bundles: [
          {
            id: 'bundle-1',
            name: 'Spa trio',
            price: 150,
            lines: [
              { serviceId: 'svc-1', serviceName: 'Facial', quantity: 1 },
              { serviceId: 'svc-2', serviceName: 'Massage', quantity: 1 },
            ],
          },
        ],
        shippingMethods: [
          { id: 'standard', label: 'Standard', fee: 8, estimatedDays: '5d' },
          { id: 'express', label: 'Express', fee: 15, estimatedDays: '2d' },
        ],
        cardCreatorStaffIds: ['emp-creator'],
        deliveryStaffIds: ['emp-driver'],
        defaultExpiryMonths: 12,
      },
    },
  };

  const servicesById: Record<
    string,
    { id: string; name: string; price: number }
  > = {
    'svc-1': { id: 'svc-1', name: 'Facial', price: 45 },
    'svc-2': { id: 'svc-2', name: 'Massage', price: 80 },
  };

  let cardSeq = 0;
  let creditSeq = 0;
  const cards = new Map<string, Record<string, unknown>>();
  const credits = new Map<string, Record<string, unknown>>();
  const redemptions: Record<string, unknown>[] = [];
  const expirationAudits: Record<string, unknown>[] = [];
  const changeRequests: Record<string, unknown>[] = [];

  const businessRepo = { findOne: jest.fn() };
  const serviceRepo = {
    findOne: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        servicesById[where.id] ?? null,
    ),
  };
  const giftCardRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const creditRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(),
  };
  const redemptionRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(async (v: Record<string, unknown>) => {
      redemptions.push(v);
      return v;
    }),
    find: jest.fn(async () => redemptions),
  };
  const expirationAuditRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(async (v: Record<string, unknown>) => {
      const saved = {
        ...v,
        id: `audit-${expirationAudits.length + 1}`,
        createdAt: new Date(Date.now() + expirationAudits.length).toISOString(),
      };
      expirationAudits.push(saved);
      return saved;
    }),
    find: jest.fn(async ({ where }: { where: { giftCardId: string } }) =>
      expirationAudits
        .filter((e) => e.giftCardId === where.giftCardId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    ),
  };
  const changeRequestRepo = {
    create: jest.fn((v: Record<string, unknown>) => v),
    save: jest.fn(async (v: Record<string, unknown>) => {
      const existingIdx = changeRequests.findIndex((r) => r.id === v.id);
      const saved = {
        ...v,
        id: (v.id as string) ?? `req-${changeRequests.length + 1}`,
        createdAt: (v.createdAt as Date | undefined) ?? new Date(),
        updatedAt: new Date(),
      };
      if (existingIdx >= 0) changeRequests[existingIdx] = saved;
      else changeRequests.push(saved);
      return saved;
    }),
    find: jest.fn(async ({ where }: { where: Record<string, unknown> }) =>
      changeRequests.filter((r) =>
        Object.entries(where).every(([key, value]) => r[key] === value),
      ),
    ),
    findOne: jest.fn(
      async ({ where }: { where: Record<string, unknown> }) =>
        changeRequests.find((r) =>
          Object.entries(where).every(([key, value]) => r[key] === value),
        ) ?? null,
    ),
    createQueryBuilder: jest.fn(() => {
      let giftCardId: string | undefined;
      let cardIds: string[] | undefined;
      const chain = {
        where: jest.fn((sql: string, params?: Record<string, unknown>) => {
          if (params?.giftCardId) giftCardId = String(params.giftCardId);
          return chain;
        }),
        andWhere: jest.fn((sql: string, params?: Record<string, unknown>) => {
          if (params?.cardIds) cardIds = params.cardIds as string[];
          return chain;
        }),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn(async () => {
          const open = changeRequests
            .filter((r) => !giftCardId || r.giftCardId === giftCardId)
            .filter((r) =>
              ['pending', 'in_review', 'needs_info'].includes(String(r.status)),
            )
            .sort((a, b) =>
              String(b.createdAt).localeCompare(String(a.createdAt)),
            );
          return open[0] ?? null;
        }),
        getMany: jest.fn(async () => {
          const open = changeRequests
            .filter((r) => {
              if (cardIds?.length)
                return cardIds.includes(String(r.giftCardId));
              if (giftCardId) return r.giftCardId === giftCardId;
              return true;
            })
            .filter((r) =>
              ['pending', 'in_review', 'needs_info'].includes(String(r.status)),
            )
            .sort((a, b) =>
              String(b.createdAt).localeCompare(String(a.createdAt)),
            );
          return open;
        }),
      };
      return chain;
    }),
  };
  const zendeskService = {
    createGiftCardChangeTicket: jest
      .fn()
      .mockResolvedValue({ ticketId: 501, url: 'https://zd/501' }),
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
  const employeeRepo = { findOne: jest.fn(), find: jest.fn() };
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
  const purchaseEvents = { emit: jest.fn() };
  const fulfillmentEvents = { emit: jest.fn() };

  const packagesService = {
    assertPackageBookable: jest.fn(),
    previewFromPackage: jest.fn(),
    getPublicPackage: jest.fn().mockResolvedValue(undefined),
    listPublicPackages: jest.fn().mockResolvedValue([]),
  };
  const subscriptionsService = {
    previewPlanPricing: jest.fn(),
    listPlans: jest.fn().mockResolvedValue([]),
  };
  const claimService = { claimCard: jest.fn() };
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
    claimService as any,
    customerService as any,
    purchaseEvents as unknown as EventEmitter2,
  );
  const fulfillmentService = new GiftCardFulfillmentService(
    giftCardRepo as any,
    employeeRepo as any,
    fulfillmentEvents as unknown as EventEmitter2,
  );
  const deliveryConfigService = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'http://localhost:3000' : undefined,
    ),
  };
  const deliveryService = new GiftCardDeliveryService(
    giftCardRepo as any,
    { findOne: jest.fn().mockResolvedValue(null) } as any,
    emailService as any,
    whatsappService as any,
    whatsappIntegrationService as any,
    deliveryConfigService as any,
    { sendGiftCardReceivedPush: jest.fn().mockResolvedValue(undefined) } as any,
  );
  const giftCardsService = new GiftCardsService(
    giftCardRepo as any,
    creditRepo as any,
    redemptionRepo as any,
    expirationAuditRepo as any,
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

  function attachCredits(cardId: string) {
    const cardCredits = [...credits.values()].filter(
      (c) => c.giftCardId === cardId,
    );
    return cardCredits;
  }

  function hydrateCard(raw: Record<string, unknown>) {
    const id = (raw.id as string) ?? `gc-${++cardSeq}`;
    const saved = {
      ...raw,
      id,
      createdAt: raw.createdAt ?? new Date(),
      business,
      serviceCredits: attachCredits(id),
    };
    cards.set(id, saved);
    return saved;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    cards.clear();
    credits.clear();
    redemptions.length = 0;
    expirationAudits.length = 0;
    changeRequests.length = 0;
    cardSeq = 0;
    creditSeq = 0;

    businessRepo.findOne.mockResolvedValue(business);
    employeeRepo.findOne.mockImplementation(
      async ({ where }: { where: { userId: string } }) => {
        if (where.userId === 'user-creator')
          return { id: 'emp-creator', userId: 'user-creator' };
        if (where.userId === 'user-driver')
          return { id: 'emp-driver', userId: 'user-driver' };
        return null;
      },
    );
    employeeRepo.find.mockResolvedValue([
      { id: 'emp-creator', userId: 'user-creator' },
      { id: 'emp-driver', userId: 'user-driver' },
    ]);

    giftCardRepo.save.mockImplementation(async (raw: Record<string, unknown>) =>
      hydrateCard(raw),
    );
    giftCardRepo.findOne.mockImplementation(
      async (opts: {
        where: Record<string, unknown>;
        relations?: Record<string, boolean>;
      }) => {
        const { where } = opts;
        if (where.id) {
          const card = cards.get(where.id as string);
          if (!card) return null;
          if (where.businessId && card.businessId !== where.businessId)
            return null;
          if (
            where.purchaserCustomerId &&
            card.purchaserCustomerId !== where.purchaserCustomerId
          ) {
            return null;
          }
          return { ...card, serviceCredits: attachCredits(card.id as string) };
        }
        if (where.code) {
          const code = String(where.code).trim().toUpperCase();
          const card = [...cards.values()].find(
            (c) =>
              String(c.code).toUpperCase() === code &&
              c.businessId === where.businessId,
          );
          if (!card) return null;
          return { ...card, serviceCredits: attachCredits(card.id as string) };
        }
        return null;
      },
    );
    giftCardRepo.find.mockImplementation(
      async (opts: { where: Record<string, unknown> }) => {
        const { where } = opts;
        return [...cards.values()]
          .filter((c) => {
            if (where.businessId && c.businessId !== where.businessId)
              return false;
            if (
              where.purchaserCustomerId &&
              c.purchaserCustomerId !== where.purchaserCustomerId
            )
              return false;
            if (
              where.fulfillmentStatus &&
              c.fulfillmentStatus !== where.fulfillmentStatus
            )
              return false;
            return true;
          })
          .map((c) => ({
            ...c,
            serviceCredits: attachCredits(c.id as string),
          }));
      },
    );

    giftCardRepo.createQueryBuilder.mockImplementation(() => {
      const state: { businessId: string; status?: string } = { businessId: '' };
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn((_sql: string, params: { businessId: string }) => {
          state.businessId = params.businessId;
          return qb;
        }),
        andWhere: jest.fn((_sql: string, params?: { status?: string }) => {
          if (params?.status) state.status = params.status;
          return qb;
        }),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(async () => {
          const list = [...cards.values()]
            .filter((c) => c.businessId === state.businessId)
            .filter((c) =>
              state.status ? c.fulfillmentStatus === state.status : true,
            )
            .map((c) => ({
              ...c,
              serviceCredits: attachCredits(c.id as string),
            }));
          return [list, list.length];
        }),
      };
      return qb;
    });

    creditRepo.save.mockImplementation(async (raw: Record<string, unknown>) => {
      const id = `credit-${++creditSeq}`;
      const saved = { ...raw, id };
      credits.set(id, saved);
      return saved;
    });
    creditRepo.create.mockImplementation((v: Record<string, unknown>) => v);
  });

  it('exposes catalog, quotes physical shipping, and lists customer orders', async () => {
    const catalog = await purchaseService.getPublicCatalog('biz-1');
    expect(catalog.purchaseEnabled).toBe(true);
    expect(catalog.settings?.shippingMethods).toHaveLength(2);

    const quote = await purchaseService.quotePurchase('biz-1', {
      cardType: 'monetary',
      amount: 100,
      deliveryMethod: 'physical',
      shippingMethodId: 'express',
      purchaserEmail: 'buyer@test.com',
    });
    expect(quote.total).toBe(115);
    expect(quote.currency).toBe('EUR');

    await purchaseService.fulfillPurchase(
      'biz-1',
      {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-1',
      },
      'sess_list',
    );

    const orders = await purchaseService.listCustomerOrders('biz-1', 'cust-1');
    expect(orders).toHaveLength(1);
    expect(purchaseEvents.emit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        payload: expect.objectContaining({ stripeSessionId: 'sess_list' }),
      }),
    );
  });

  it('runs digital monetary purchase through delivery and partial redemption', async () => {
    const purchased = await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'monetary',
      amount: 50,
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
      recipientEmail: 'friend@test.com',
      recipientPhone: '+37499123456',
      recipientName: 'Friend',
      personalMessage: 'Enjoy!',
    });

    await deliveryService.deliverDigitalGiftCard(purchased.id);

    expect(emailService.send).toHaveBeenCalledTimes(2);
    expect(whatsappService.sendGiftCardMessage).toHaveBeenCalled();
    expect(cards.get(purchased.id)?.fulfillmentStatus).toBe('delivered');

    const code = purchased.code;
    await giftCardsService.redeem('biz-1', code, 20, 'booking-1');
    const partial = await giftCardsService.getBalanceView('biz-1', code);
    expect(partial.balance).toBe(30);
    expect(partial.isActive).toBe(true);

    await giftCardsService.redeem('biz-1', code, 30);
    const exhausted = await giftCardsService.getBalanceView('biz-1', code);
    expect(exhausted.balance).toBe(0);
    expect(exhausted.isActive).toBe(false);

    const history = await giftCardsService.listRedemptions(purchased.id);
    expect(history).toHaveLength(2);
  });

  it('runs digital service gift card purchase, delivery, and service credit redemption', async () => {
    const purchased = await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'service',
      serviceId: 'svc-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
      recipientEmail: 'friend@test.com',
    });

    expect(credits.size).toBe(1);

    await deliveryService.deliverDigitalGiftCard(purchased.id);

    const code = purchased.code;
    await giftCardsService.validate('biz-1', code, 'svc-1');
    const redeemed = await giftCardsService.redeemServiceCredit(
      'biz-1',
      code,
      'svc-1',
      'booking-svc',
    );
    expect(redeemed.isActive).toBe(false);
  });

  it('runs physical bundle order through card maker, driver, and shipped status', async () => {
    const purchased = await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'bundle',
      bundleId: 'bundle-1',
      deliveryMethod: 'physical',
      shippingMethodId: 'standard',
      purchaserEmail: 'buyer@test.com',
      recipientName: 'Sam',
      shippingAddress: {
        recipientName: 'Sam',
        line1: '10 Park',
        city: 'Yerevan',
        postalCode: '0010',
        country: 'AM',
      },
    });

    expect(purchased.fulfillmentStatus).toBe('awaiting_card_creation');
    expect(credits.size).toBe(2);

    const ready = await fulfillmentService.markCardReady(
      'biz-1',
      purchased.id,
      'user-creator',
    );
    expect(ready.fulfillmentStatus).toBe('ready_for_delivery');

    const out = await fulfillmentService.markOutForDelivery(
      'biz-1',
      purchased.id,
      'user-driver',
    );
    expect(out.fulfillmentStatus).toBe('out_for_delivery');

    const shipped = await fulfillmentService.markShipped(
      'biz-1',
      purchased.id,
      'DHL',
      'TRACK-99',
    );
    expect(shipped.fulfillmentStatus).toBe('shipped');
    expect(shipped.trackingNumber).toBe('TRACK-99');

    const delivered = await fulfillmentService.markDelivered(
      'biz-1',
      purchased.id,
    );
    expect(delivered.fulfillmentStatus).toBe('delivered');
    expect(delivered.codeRevealed).toBe(true);
  });

  it('redeems bundle gift card credits one service at a time', async () => {
    const purchased = await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'bundle',
      bundleId: 'bundle-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
      recipientEmail: 'friend@test.com',
    });

    const code = purchased.code;
    await giftCardsService.redeemServiceCredit(
      'biz-1',
      code,
      'svc-1',
      'booking-1',
    );
    const mid = await giftCardsService.getBalanceView('biz-1', code);
    expect(mid.isActive).toBe(true);
    expect(
      mid.serviceCredits.find((c) => c.serviceId === 'svc-1')
        ?.quantityRemaining,
    ).toBe(0);

    await giftCardsService.redeemServiceCredit(
      'biz-1',
      code,
      'svc-2',
      'booking-2',
    );
    const done = await giftCardsService.getBalanceView('biz-1', code);
    expect(done.isActive).toBe(false);
  });

  it('lists fulfillment dashboard orders and provider staff user ids', async () => {
    await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'monetary',
      amount: 25,
      deliveryMethod: 'physical',
      shippingMethodId: 'standard',
      purchaserEmail: 'buyer@test.com',
      shippingAddress: {
        recipientName: 'Pat',
        line1: '1 Main',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
      },
    });

    const awaiting = await fulfillmentService.listCardCreationQueue('biz-1');
    expect(awaiting).toHaveLength(1);

    const dashboard = await fulfillmentService.listDashboardOrders('biz-1', {
      status: 'awaiting_card_creation',
    });
    expect(dashboard.orders).toHaveLength(1);

    await expect(
      fulfillmentService.resolveStaffUserIds(['emp-creator', 'emp-driver']),
    ).resolves.toEqual(['user-creator', 'user-driver']);
  });

  it('delivers digitally via WhatsApp when email is absent', async () => {
    const purchased = await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'monetary',
      amount: 40,
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
      recipientPhone: '+37499123456',
      recipientName: 'Phone Only',
    });

    const stored = cards.get(purchased.id)!;
    stored.recipientEmail = null;
    stored.purchaserEmail = null;

    await deliveryService.deliverDigitalGiftCard(purchased.id);

    expect(emailService.send).not.toHaveBeenCalled();
    expect(whatsappService.sendGiftCardMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        toPhone: '+37499123456',
        giftCardCode: purchased.code,
      }),
      expect.any(Object),
    );
    expect(cards.get(purchased.id)?.fulfillmentStatus).toBe('delivered');
  });

  it('masks hidden codes in balance view until physical card is revealed', async () => {
    const purchased = await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'monetary',
      amount: 75,
      deliveryMethod: 'physical',
      shippingMethodId: 'standard',
      purchaserEmail: 'buyer@test.com',
      shippingAddress: {
        recipientName: 'Pat',
        line1: '1 Main',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
      },
    });

    const hidden = await giftCardsService.getBalanceView(
      'biz-1',
      purchased.code,
    );
    expect(hidden.code).toBe('****');

    await fulfillmentService.markCardReady(
      'biz-1',
      purchased.id,
      'user-creator',
    );
    const revealed = await giftCardsService.getBalanceView(
      'biz-1',
      purchased.code,
    );
    expect(revealed.code).toBe(purchased.code);
  });

  it('allows admin to set, extend, clear expiration with audit and enforces at redemption', async () => {
    const purchased = await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'monetary',
      amount: 60,
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
      recipientEmail: 'friend@test.com',
    });

    await deliveryService.deliverDigitalGiftCard(purchased.id);
    const code = purchased.code;
    const cardId = purchased.id;

    await giftCardsService.updateExpiration(
      'biz-1',
      cardId,
      { expiresAt: '2020-01-01', note: 'Backdated for test' },
      'admin-1',
    );
    await expect(giftCardsService.validate('biz-1', code)).rejects.toThrow(
      'expired',
    );

    const extended = await giftCardsService.updateExpiration(
      'biz-1',
      cardId,
      { extendMonths: 12 },
      'admin-1',
    );
    expect(extended.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    await giftCardsService.validate('biz-1', code);

    await giftCardsService.updateExpiration(
      'biz-1',
      cardId,
      { expiresAt: null },
      'admin-1',
    );
    const cleared = cards.get(cardId)!;
    expect(cleared.expiresAt).toBeNull();
    await giftCardsService.redeem('biz-1', code, 10);

    const audit = await giftCardsService.listExpirationAudit(cardId);
    expect(audit.map((e) => e.action)).toEqual(['clear', 'extend', 'set']);
    expect(audit[2]).toMatchObject({
      adminUserId: 'admin-1',
      note: 'Backdated for test',
    });
  });

  it('lists customer orders, blocks modify, cancels with immediate deactivation, and blocks partial use cancel', async () => {
    const purchased = await purchaseService.fulfillPurchase(
      'biz-1',
      {
        cardType: 'monetary',
        amount: 80,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-1',
        recipientEmail: 'friend@test.com',
      },
      'sess_gc_order',
    );

    const listed = await orderService.listCustomerOrders('biz-1', 'cust-1');
    expect(listed).toHaveLength(1);
    expect(listed[0].policy.canCancel).toBe(true);
    expect(listed[0].policy.canModify).toBe(false);

    await expect(
      orderService.submitModifyRequest('biz-1', 'cust-1', purchased.id, {
        modifyPayload: {
          recipientName: 'Updated Name',
          personalMessage: 'New note',
        },
        customerNotes: 'Please update recipient details',
      }),
    ).rejects.toThrow('cannot be modified');
    expect(zendeskService.createGiftCardChangeTicket).not.toHaveBeenCalled();

    const purchased2 = await purchaseService.fulfillPurchase(
      'biz-1',
      {
        cardType: 'monetary',
        amount: 40,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-1',
      },
      'sess_gc_cancel',
    );
    const cancelResult = await orderService.submitCancelRequest(
      'biz-1',
      'cust-1',
      purchased2.id,
      'Please cancel',
    );
    expect(cancelResult.request.status).toBe('completed');
    expect(cancelResult.refundStatus).toBe('skipped');
    expect(cards.get(purchased2.id)?.fulfillmentStatus).toBe('cancelled');
    expect(cards.get(purchased2.id)?.isActive).toBe(false);

    const purchased3 = await purchaseService.fulfillPurchase(
      'biz-1',
      {
        cardType: 'monetary',
        amount: 60,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        purchaserCustomerId: 'cust-1',
      },
      'sess_gc_partial',
    );
    const partialCard = cards.get(purchased3.id)!;
    partialCard.balance = 45;
    cards.set(purchased3.id, partialCard);

    await expect(
      orderService.submitCancelRequest('biz-1', 'cust-1', purchased3.id),
    ).rejects.toThrow('already been used');
  });

  it('fulfills cash physical gift card purchase with shipping fee', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        publicBooking: { acceptCashPayments: true },
        giftCards: {
          ...business.settings.giftCards,
          cancelModifyEnabled: true,
        },
      },
    });

    const catalog = await purchaseService.getPublicCatalog('biz-1');
    expect(catalog.settings?.acceptCashPayments).toBe(true);

    const card = await purchaseService.fulfillPurchase('biz-1', {
      cardType: 'monetary',
      amount: 100,
      deliveryMethod: 'physical',
      shippingMethodId: 'standard',
      purchaserEmail: 'buyer@test.com',
      purchaserCustomerId: 'cust-1',
      paymentMethod: 'cash',
      shippingAddress: {
        recipientName: 'Alex',
        line1: '1 Main',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
      },
    });

    expect(card.stripeSessionId).toBeNull();
    expect(card.purchaseAmount).toBe(108);
    expect(card.shippingFee).toBe(8);
    expect(card.fulfillmentStatus).toBe('awaiting_card_creation');
    expect(purchaseEvents.emit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.objectContaining({ paymentMethod: 'cash' }),
      }),
    );
  });
});
