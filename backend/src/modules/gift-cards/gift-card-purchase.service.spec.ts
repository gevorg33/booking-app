import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftCardPurchaseService } from './gift-card-purchase.service.js';

describe('GiftCardPurchaseService', () => {
  const businessRepo = { findOne: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
  const giftCardRepo = { save: jest.fn(), create: jest.fn(), find: jest.fn() };
  const creditRepo = { save: jest.fn(), create: jest.fn() };
  const eventEmitter = { emit: jest.fn() };
  const packagesService = {
    assertPackageBookable: jest.fn(),
    previewFromPackage: jest.fn(),
    getPublicPackage: jest.fn(),
    listPublicPackages: jest.fn().mockResolvedValue([]),
  };
  const subscriptionsService = {
    previewPlanPricing: jest.fn(),
    listPlans: jest.fn(),
  };
  const claimService = { claimCard: jest.fn() };
  const customerService = {
    findOrCreateByContact: jest.fn(async (_businessId: string, dto: { name: string; email: string }) => ({
      customer: { id: 'cust-guest', name: dto.name, email: dto.email },
      created: true,
    })),
  };

  const service = new GiftCardPurchaseService(
    businessRepo as any,
    serviceRepo as any,
    giftCardRepo as any,
    creditRepo as any,
    packagesService as any,
    subscriptionsService as any,
    claimService as any,
    customerService as any,
    eventEmitter as unknown as EventEmitter2,
  );

  const business = {
    id: 'biz-1',
    settings: {
      giftCards: {
        purchaseEnabled: true,
        digitalDeliveryEnabled: true,
        physicalDeliveryEnabled: true,
        presetAmounts: [50, 100],
        purchasableServices: [
          { serviceId: 'svc-1', price: 45 },
          { serviceId: 'svc-2', price: 30 },
        ],
        bundles: [
          {
            id: 'bundle-1',
            name: 'Spa day',
            price: 120,
            lines: [{ serviceId: 'svc-1', serviceName: 'Facial', quantity: 1 }],
          },
        ],
        shippingMethods: [{ id: 'standard', label: 'Standard', fee: 5, estimatedDays: '5d' }],
        cardCreatorStaffIds: ['emp-creator'],
        deliveryStaffIds: ['emp-driver'],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue(business);
    giftCardRepo.create.mockImplementation((v) => v);
    giftCardRepo.save.mockImplementation(async (v) => ({ id: 'order-1', ...v }));
    creditRepo.create.mockImplementation((v) => v);
    creditRepo.save.mockResolvedValue(undefined);
    serviceRepo.findOne.mockResolvedValue({ id: 'svc-1', name: 'Facial', price: 45 });
    packagesService.getPublicPackage.mockResolvedValue(undefined);
    subscriptionsService.listPlans.mockResolvedValue([]);
  });

  it('returns public catalog when purchase is enabled', async () => {
    const catalog = await service.getPublicCatalog('biz-1');
    expect(catalog.purchaseEnabled).toBe(true);
    expect(catalog.settings?.presetAmounts).toEqual([50, 100]);
  });

  it('quotes monetary gift card with shipping fee', async () => {
    const quote = await service.quotePurchase('biz-1', {
      cardType: 'monetary',
      amount: 100,
      deliveryMethod: 'physical',
      shippingMethodId: 'standard',
      purchaserEmail: 'buyer@test.com',
    });
    expect(quote.subtotal).toBe(100);
    expect(quote.shippingFee).toBe(5);
    expect(quote.total).toBe(105);
  });

  it('fulfills digital monetary purchase and emits payment event', async () => {
    const card = await service.fulfillPurchase(
      'biz-1',
      {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        recipientEmail: 'friend@test.com',
      },
      'sess_123',
    );

    expect(card.code).toMatch(/^GCM-/);
    expect(card.fulfillmentStatus).toBe('pending');
    expect(card.codeRevealed).toBe(true);
    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it('fulfills physical bundle and queues card creation', async () => {
    const card = await service.fulfillPurchase('biz-1', {
      cardType: 'bundle',
      bundleId: 'bundle-1',
      deliveryMethod: 'physical',
      shippingMethodId: 'standard',
      purchaserEmail: 'buyer@test.com',
      recipientName: 'Alex',
      shippingAddress: {
        recipientName: 'Alex',
        line1: '1 Main',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
      },
    });

    expect(card.code).toMatch(/^GCB-/);
    expect(card.fulfillmentStatus).toBe('awaiting_card_creation');
    expect(card.codeRevealed).toBe(false);
    expect(creditRepo.save).toHaveBeenCalled();
  });

  it('rejects purchase when disabled', async () => {
    businessRepo.findOne.mockResolvedValue({ ...business, settings: { giftCards: { purchaseEnabled: false } } });
    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns disabled catalog when purchase is off', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', settings: { giftCards: { purchaseEnabled: false } } });
    await expect(service.getPublicCatalog('biz-1')).resolves.toEqual({
      purchaseEnabled: false,
      settings: null,
    });
  });

  it('quotes service gift card from configured catalog', async () => {
    const quote = await service.quotePurchase('biz-1', {
      cardType: 'service',
      serviceId: 'svc-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
    });
    expect(quote.subtotal).toBe(45);
    expect(quote.cardType).toBe('service');
  });

  it('quotes multiple services as a bundle gift card', async () => {
    serviceRepo.findOne.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(
        where.id === 'svc-1'
          ? { id: 'svc-1', name: 'Facial', price: 45 }
          : { id: 'svc-2', name: 'Massage', price: 30 },
      ),
    );

    const quote = await service.quotePurchase('biz-1', {
      cardType: 'service',
      serviceIds: ['svc-1', 'svc-2'],
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
    });

    expect(quote.subtotal).toBe(75);
    expect(quote.cardType).toBe('bundle');
    expect(quote.bundleLines).toEqual([
      { serviceId: 'svc-1', serviceName: 'Facial', quantity: 1 },
      { serviceId: 'svc-2', serviceName: 'Massage', quantity: 1 },
    ]);
  });

  it('lists customer orders', async () => {
    giftCardRepo.find.mockResolvedValue([{ id: 'order-1' }]);
    await expect(service.listCustomerOrders('biz-1', 'cust-1')).resolves.toHaveLength(1);
  });

  it('fulfills service gift card with credit line', async () => {
    const card = await service.fulfillPurchase('biz-1', {
      cardType: 'service',
      serviceId: 'svc-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
    });
    expect(card.cardType).toBe('service');
    expect(creditRepo.save).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid quotes and delivery settings', async () => {
    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'monetary',
        amount: 0,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('Valid amount');

    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'service',
        serviceId: 'missing',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('not available');

    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { giftCards: { ...business.settings.giftCards, digitalDeliveryEnabled: false } },
    });
    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('Digital delivery is not enabled');
  });

  it('rejects bundle and physical shipping edge cases', async () => {
    businessRepo.findOne.mockResolvedValue(business);
    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'bundle',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('bundleId is required');

    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'bundle',
        bundleId: 'missing',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('not available');

    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: { ...business.settings.giftCards, shippingMethods: [] },
      },
    });
    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'physical',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('No shipping methods');
  });

  it('rejects physical delivery when disabled and missing business', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: { ...business.settings.giftCards, physicalDeliveryEnabled: false },
      },
    });
    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'physical',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('Physical delivery is not enabled');

    businessRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getPublicCatalog('missing'),
    ).rejects.toThrow('Business not found');
  });

  it('hides shipping methods when physical delivery is off in catalog', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: { ...business.settings.giftCards, physicalDeliveryEnabled: false },
      },
    });
    const catalog = await service.getPublicCatalog('biz-1');
    expect(catalog.settings?.shippingMethods).toEqual([]);
  });

  it('requires serviceId and resolves default shipping method', async () => {
    await expect(
      service.quotePurchase('biz-1', {
        cardType: 'service',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('At least one service is required');

    const quote = await service.quotePurchase('biz-1', {
      cardType: 'monetary',
      amount: 50,
      deliveryMethod: 'physical',
      purchaserEmail: 'buyer@test.com',
    });
    expect(quote.shippingFee).toBe(5);
  });

  it('throws when service is missing during fulfillment', async () => {
    serviceRepo.findOne.mockResolvedValue(null);
    await expect(
      service.fulfillPurchase('biz-1', {
        cardType: 'service',
        serviceId: 'svc-1',
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      }),
    ).rejects.toThrow('Service not found');
  });

  it('fulfills without expiry and without default staff assignments', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: {
          ...business.settings.giftCards,
          defaultExpiryMonths: null,
          cardCreatorStaffIds: [],
          deliveryStaffIds: [],
        },
      },
    });

    const card = await service.fulfillPurchase('biz-1', {
      cardType: 'monetary',
      amount: 25,
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
    });

    expect(card.expiresAt).toBeNull();
    expect(card.cardCreatorStaffId).toBeNull();
    expect(card.deliveryStaffId).toBeNull();
  });

  it('quotes service price from catalog service when preset price is omitted', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: {
          ...business.settings.giftCards,
          purchasableServices: [{ serviceId: 'svc-1' }],
        },
      },
    });
    const quote = await service.quotePurchase('biz-1', {
      cardType: 'service',
      serviceId: 'svc-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
    });
    expect(quote.subtotal).toBe(45);
  });

  it('uses default shipping method when shippingMethodId is omitted', async () => {
    businessRepo.findOne.mockResolvedValue(business);
    const quote = await service.quotePurchase('biz-1', {
      cardType: 'monetary',
      amount: 50,
      deliveryMethod: 'physical',
      purchaserEmail: 'buyer@test.com',
    });
    expect(quote.shippingFee).toBe(5);
  });

  it('fulfills service card when service entity exists after quote validation', async () => {
    serviceRepo.findOne.mockResolvedValue({ id: 'svc-1', name: 'Facial', price: 45 });
    const card = await service.fulfillPurchase('biz-1', {
      cardType: 'service',
      serviceId: 'svc-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
    });
    expect(card.cardType).toBe('service');
    expect(creditRepo.save).toHaveBeenCalled();
  });

  it('fulfills cash gift card purchase without stripe session', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        publicBooking: { acceptCashPayments: true },
      },
    });

    const card = await service.fulfillPurchase('biz-1', {
      cardType: 'monetary',
      amount: 50,
      deliveryMethod: 'physical',
      shippingMethodId: 'standard',
      purchaserEmail: 'buyer@test.com',
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
    expect(card.purchaseAmount).toBe(55);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: expect.objectContaining({ paymentMethod: 'cash', stripeSessionId: null }),
      }),
    );
  });

  it('rejects cash gift card purchase when cash is disabled', async () => {
    await expect(
      service.fulfillPurchase('biz-1', {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
        paymentMethod: 'cash',
      }),
    ).rejects.toThrow('Cash payment is not accepted');
  });

  it('rejects cash gift card purchase with stripe session', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        publicBooking: { acceptCashPayments: true },
      },
    });

    await expect(
      service.fulfillPurchase(
        'biz-1',
        {
          cardType: 'monetary',
          amount: 50,
          deliveryMethod: 'digital',
          purchaserEmail: 'buyer@test.com',
          paymentMethod: 'cash',
        },
        'sess_cash_conflict',
      ),
    ).rejects.toThrow('cannot include an online payment session');
  });

  it('exposes acceptCashPayments in public catalog', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        ...business.settings,
        publicBooking: { acceptCashPayments: true },
      },
    });
    const catalog = await service.getPublicCatalog('biz-1');
    expect(catalog.settings?.acceptCashPayments).toBe(true);
  });

  it('quotes package gift card from configured catalog price', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: {
          ...business.settings.giftCards,
          purchasablePackages: [{ packageId: 'pkg-1', price: 199 }],
        },
      },
    });
    packagesService.assertPackageBookable.mockResolvedValue({
      id: 'pkg-1',
      name: 'Summer glow',
      items: [{ serviceId: 'svc-1', quantity: 1, service: { price: 50 } }],
      discountType: 'percent',
      discountValue: 10,
    });
    packagesService.previewFromPackage.mockReturnValue({
      pricing: { packagePrice: 180 },
    });

    const quote = await service.quotePurchase('biz-1', {
      cardType: 'package',
      packageId: 'pkg-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
    });

    expect(quote.cardType).toBe('package');
    expect(quote.subtotal).toBe(199);
    expect(quote.label).toContain('Summer glow');
  });

  it('quotes subscription gift card using configured override price', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: {
          ...business.settings.giftCards,
          purchasableSubscriptionPlans: [{ planId: 'plan-1', price: 220 }],
        },
      },
    });
    subscriptionsService.previewPlanPricing.mockResolvedValue({
      plan: { name: '6 visits' },
      pricing: { subscriptionPrice: 240 },
    });

    const quote = await service.quotePurchase('biz-1', {
      cardType: 'subscription',
      subscriptionPlanId: 'plan-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'buyer@test.com',
    });

    expect(quote.cardType).toBe('subscription');
    expect(quote.subtotal).toBe(220);
    expect(quote.label).toContain('6 visits');
  });

  it('auto-claims digital self-purchase and reloads saved card', async () => {
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: {
          ...business.settings.giftCards,
          purchasablePackages: [{ packageId: 'pkg-1', price: 199 }],
        },
      },
    });
    packagesService.assertPackageBookable.mockResolvedValue({
      id: 'pkg-1',
      name: 'Summer glow',
      items: [],
    });
    packagesService.previewFromPackage.mockReturnValue({
      pricing: { packagePrice: 180 },
    });

    const saved = { id: 'order-claimed', cardType: 'package', isActive: true };
    giftCardRepo.save.mockResolvedValueOnce(saved);
    claimService.claimCard.mockResolvedValue(undefined);
    giftCardRepo.findOne = jest.fn().mockResolvedValue(null);

    const result = await service.fulfillPurchase('biz-1', {
      cardType: 'package',
      packageId: 'pkg-1',
      deliveryMethod: 'digital',
      purchaserEmail: 'self@test.com',
      buyForSelf: true,
      purchaserCustomerId: 'cust-self',
    });

    expect(claimService.claimCard).toHaveBeenCalled();
    expect(result.cardType).toBe('package');
  });

  it('includes all active public packages when none are manually selected', async () => {
    packagesService.listPublicPackages.mockResolvedValue([
      {
        id: 'pkg-haircut',
        name: 'haricut package',
        currency: 'USD',
        pricing: { packagePrice: 80.75, regularTotal: 95, savingsPercent: 15 },
        items: [
          { serviceName: 'Baby haircut', quantity: 1 },
          { serviceName: "men's haircut", quantity: 1 },
        ],
      },
    ]);
    packagesService.getPublicPackage.mockResolvedValue({
      name: 'haricut package',
      currency: 'USD',
      pricing: { packagePrice: 80.75, regularTotal: 95, savingsPercent: 15 },
      items: [
        { serviceName: 'Baby haircut', quantity: 1 },
        { serviceName: "men's haircut", quantity: 1 },
      ],
    });
    subscriptionsService.listPlans.mockResolvedValue([
      {
        id: 'plan-baby',
        name: 'Baby visits',
        isActive: true,
        service: { name: 'Baby haircut', currency: 'USD' },
      },
    ]);
    subscriptionsService.previewPlanPricing.mockResolvedValue({
      plan: { name: '6 visits', includedAppointments: 6, durationMonths: 6 },
      pricing: { subscriptionPrice: 120, regularTotal: 150, savings: 30 },
    });
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: { giftCards: { ...business.settings.giftCards, purchasablePackages: [], purchasableSubscriptionPlans: [] } },
    });

    const catalog = await service.getPublicCatalog('biz-1');
    expect(catalog.settings?.purchasablePackages).toHaveLength(1);
    expect(catalog.settings?.purchasablePackages?.[0].name).toBe('haricut package');
    expect(catalog.settings?.purchasableSubscriptionPlans).toHaveLength(1);
  });

  it('includes purchasable packages and plans in public catalog', async () => {
    packagesService.getPublicPackage.mockResolvedValue({
      name: 'Summer glow',
      currency: 'USD',
      pricing: { packagePrice: 180, regularTotal: 200, savingsPercent: 10 },
      items: [{ serviceName: 'Facial', quantity: 1 }],
    });
    subscriptionsService.listPlans.mockResolvedValue([
      { id: 'plan-1', isActive: true, service: { name: 'Facial', currency: 'USD' } },
    ]);
    subscriptionsService.previewPlanPricing.mockResolvedValue({
      plan: {
        name: '6 visits',
        includedAppointments: 6,
        durationMonths: 6,
      },
      pricing: { subscriptionPrice: 240, regularTotal: 300, savings: 60 },
    });
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: {
          ...business.settings.giftCards,
          purchasablePackages: [{ packageId: 'pkg-1' }],
          purchasableSubscriptionPlans: [{ planId: 'plan-1' }],
        },
      },
    });

    const catalog = await service.getPublicCatalog('biz-1');
    expect(catalog.settings?.purchasablePackages).toHaveLength(1);
    expect(catalog.settings?.purchasableSubscriptionPlans).toEqual([
      expect.objectContaining({
        planId: 'plan-1',
        subscriptionPrice: 240,
        regularTotal: 300,
        savings: 60,
        savingsPercent: 20,
      }),
    ]);
  });

  it('skips unavailable catalog entries', async () => {
    packagesService.getPublicPackage.mockRejectedValue(new Error('gone'));
    subscriptionsService.listPlans.mockResolvedValue([
      { id: 'plan-1', isActive: false, service: { name: 'Facial', currency: 'USD' } },
    ]);
    businessRepo.findOne.mockResolvedValue({
      ...business,
      settings: {
        giftCards: {
          ...business.settings.giftCards,
          purchasablePackages: [{ packageId: 'pkg-1' }],
          purchasableSubscriptionPlans: [{ planId: 'plan-1' }],
        },
      },
    });

    const catalog = await service.getPublicCatalog('biz-1');
    expect(catalog.settings?.purchasablePackages).toEqual([]);
    expect(catalog.settings?.purchasableSubscriptionPlans).toEqual([]);
  });
});
