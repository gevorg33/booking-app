import { CheckoutPricingService } from './checkout-pricing.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { PromoCodesService } from './promo-codes.service.js';
import { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import { PromoDiscountType } from './entities/promo-code.entity.js';

describe('CheckoutPricingService loyalty earn', () => {
  const loyaltyService = {
    getOrCreate: jest.fn(),
    pointsToCurrency: jest.fn(),
    calculateEarnPoints: jest.fn(),
    redeem: jest.fn(),
  };
  const promoCodesService = {
    findValidForCheckout: jest.fn(),
    calculateDiscount: jest.fn(),
    recordUse: jest.fn(),
  };
  const giftCardsService = {
    validate: jest.fn(),
    redeem: jest.fn(),
    redeemServiceCredit: jest.fn(),
  };

  const service = new CheckoutPricingService(
    promoCodesService as unknown as PromoCodesService,
    loyaltyService as unknown as LoyaltyService,
    giftCardsService as unknown as GiftCardsService,
  );

  const promo = {
    id: 'promo-1',
    code: 'SAVE20',
    discountType: PromoDiscountType.FIXED,
    discountValue: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyService.getOrCreate.mockResolvedValue({ pointsBalance: 100 });
    loyaltyService.pointsToCurrency.mockImplementation((p: number) => p);
    loyaltyService.calculateEarnPoints.mockImplementation(
      (cash: number, percent: number) => Math.round((cash * percent) / 100 * 100) / 100,
    );
    promoCodesService.findValidForCheckout.mockResolvedValue(promo);
    promoCodesService.calculateDiscount.mockImplementation((_promo, amount: number) =>
      Math.min(20, amount),
    );
  });

  it('earns on full cash payment', async () => {
    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 100,
      currency: 'USD',
      earnPercentCashback: 10,
    });

    expect(result.amountDue).toBe(100);
    expect(loyaltyService.calculateEarnPoints).toHaveBeenCalledWith(100, 10);
    expect(result.pointsToEarn).toBe(10);
  });

  it('applies gift card codes starting with GC-', async () => {
    giftCardsService.validate.mockResolvedValue({
      id: 'gc-1',
      code: 'GC-ABCD1234',
      cardType: 'monetary',
      balance: 75,
      currency: 'USD',
    });

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 50,
      currency: 'USD',
      promoCode: 'GC-ABCD1234',
      earnPercentCashback: 5,
    });

    expect(giftCardsService.validate).toHaveBeenCalledWith('biz-1', 'GC-ABCD1234');
    expect(promoCodesService.findValidForCheckout).not.toHaveBeenCalled();
    expect(result.giftCardCode).toBe('GC-ABCD1234');
    expect(result.giftCardDiscount).toBe(50);
    expect(result.amountDue).toBe(0);
    expect(result.pointsToEarn).toBe(0);
    expect(result.adjustments).toHaveLength(1);
    expect(result.adjustments[0].type).toBe('gift_card');
  });

  it('earns only on cash due after loyalty redemption', async () => {
    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 100,
      currency: 'USD',
      customerId: 'cust-1',
      loyaltyPointsToRedeem: 40,
      earnPercentCashback: 10,
    });

    expect(result.amountDue).toBe(60);
    expect(result.loyaltyDiscount).toBe(40);
    expect(loyaltyService.calculateEarnPoints).toHaveBeenCalledWith(60, 10);
    expect(result.pointsToEarn).toBe(6);
  });

  it('applies promo before loyalty and earns on remaining cash', async () => {
    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 100,
      currency: 'USD',
      customerId: 'cust-1',
      promoCode: 'SAVE20',
      loyaltyPointsToRedeem: 30,
      earnPercentCashback: 10,
    });

    expect(result.afterPromo).toBe(80);
    expect(result.afterGiftCard).toBe(80);
    expect(result.promoDiscount).toBe(20);
    expect(result.loyaltyDiscount).toBe(30);
    expect(result.amountDue).toBe(50);
    expect(result.totalDiscount).toBe(50);
    expect(loyaltyService.calculateEarnPoints).toHaveBeenCalledWith(50, 10);
    expect(result.pointsToEarn).toBe(5);
    expect(result.adjustments).toHaveLength(2);
  });

  it('clamps loyalty to amount after gift card when customer requests more', async () => {
    giftCardsService.validate.mockResolvedValue({
      id: 'gc-1',
      code: 'GC-TEST1234',
      cardType: 'monetary',
      balance: 100,
      currency: 'USD',
    });
    loyaltyService.getOrCreate.mockResolvedValue({ pointsBalance: 992 });

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 50,
      currency: 'USD',
      customerId: 'cust-1',
      promoCode: 'GC-TEST1234',
      loyaltyPointsToRedeem: 50,
      earnPercentCashback: 5,
    });

    expect(result.giftCardDiscount).toBe(50);
    expect(result.afterGiftCard).toBe(0);
    expect(result.loyaltyPointsToRedeem).toBe(0);
    expect(result.amountDue).toBe(0);
  });

  it('applies promo to subscription plan subtotal', async () => {
    promoCodesService.calculateDiscount.mockImplementation((_promo, amount: number) =>
      Math.min(12, amount),
    );

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 684,
      prepaymentAmount: 684,
      currency: 'USD',
      promoCode: 'SAVE12',
      earnPercentCashback: 5,
    });

    expect(promoCodesService.findValidForCheckout).toHaveBeenCalledWith('biz-1', 'SAVE12', 684);
    expect(result.subtotal).toBe(684);
    expect(result.promoDiscount).toBe(12);
    expect(result.amountDue).toBe(672);
    expect(loyaltyService.calculateEarnPoints).toHaveBeenCalledWith(672, 5);
    expect(result.pointsToEarn).toBe(33.6);
  });

  it('rejects gift card currency mismatch', async () => {
    giftCardsService.validate.mockResolvedValue({
      id: 'gc-1',
      code: 'GC-ABCD1234',
      cardType: 'monetary',
      balance: 50,
      currency: 'EUR',
    });

    await expect(
      service.calculate({
        businessId: 'biz-1',
        servicePrice: 684,
        prepaymentAmount: 684,
        currency: 'USD',
        promoCode: 'GC-ABCD1234',
      }),
    ).rejects.toThrow('Gift card currency does not match this booking');
  });

  it('requires sign in to redeem loyalty points', async () => {
    await expect(
      service.calculate({
        businessId: 'biz-1',
        servicePrice: 684,
        prepaymentAmount: 684,
        currency: 'USD',
        loyaltyPointsToRedeem: 10,
      }),
    ).rejects.toThrow('Sign in to use loyalty points');
  });

  it('rejects zero-balance monetary gift cards', async () => {
    giftCardsService.validate.mockResolvedValue({
      id: 'gc-1',
      code: 'GC-ABCD1234',
      cardType: 'monetary',
      balance: 0,
      currency: 'USD',
    });

    await expect(
      service.calculate({
        businessId: 'biz-1',
        servicePrice: 684,
        prepaymentAmount: 684,
        currency: 'USD',
        promoCode: 'GC-ABCD1234',
      }),
    ).rejects.toThrow('no remaining balance');
  });

  it('applies service gift card credits against matching cart lines', async () => {
    giftCardsService.validate.mockResolvedValue({
      id: 'gc-svc',
      code: 'GCS-BABY1',
      cardType: 'service',
      balance: 0,
      currency: 'USD',
      serviceCredits: [{ serviceId: 'svc-baby', serviceName: 'Baby haircut', quantityRemaining: 1, quantityTotal: 1 }],
    });

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 95,
      prepaymentAmount: 95,
      currency: 'USD',
      promoCode: 'GCS-BABY1',
      serviceLineItems: [
        { serviceId: 'svc-girls', amount: 50 },
        { serviceId: 'svc-baby', amount: 25 },
        { serviceId: 'svc-mens', amount: 20 },
      ],
    });

    expect(result.giftCardDiscount).toBe(25);
    expect(result.amountDue).toBe(70);
    expect(result.giftCardServiceRedemptions).toEqual([{ serviceId: 'svc-baby', units: 1 }]);
  });

  it('rejects service gift cards with no matching services in cart', async () => {
    giftCardsService.validate.mockResolvedValue({
      id: 'gc-svc',
      code: 'GCS-BABY1',
      cardType: 'service',
      balance: 0,
      currency: 'USD',
      serviceCredits: [{ serviceId: 'svc-baby', serviceName: 'Baby haircut', quantityRemaining: 1, quantityTotal: 1 }],
    });

    await expect(
      service.calculate({
        businessId: 'biz-1',
        servicePrice: 70,
        prepaymentAmount: 70,
        currency: 'USD',
        promoCode: 'GCS-BABY1',
        serviceLineItems: [
          { serviceId: 'svc-girls', amount: 50 },
          { serviceId: 'svc-mens', amount: 20 },
        ],
      }),
    ).rejects.toThrow('no matching service credits');
  });
});

describe('CheckoutPricingService.applyRedemptions', () => {
  const loyaltyService = {
    getOrCreate: jest.fn(),
    pointsToCurrency: jest.fn(),
    calculateEarnPoints: jest.fn(),
    redeem: jest.fn(),
  };
  const promoCodesService = {
    findValidForCheckout: jest.fn(),
    calculateDiscount: jest.fn(),
    recordUse: jest.fn(),
  };
  const giftCardsService = {
    validate: jest.fn(),
    redeem: jest.fn(),
    redeemServiceCredit: jest.fn(),
  };

  const service = new CheckoutPricingService(
    promoCodesService as unknown as PromoCodesService,
    loyaltyService as unknown as LoyaltyService,
    giftCardsService as unknown as GiftCardsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies loyalty, promo, and gift card redemptions after subscription checkout', async () => {
    await service.applyRedemptions(
      'biz-1',
      'cust-1',
      {
        loyaltyPointsToRedeem: 20,
        promoCodeId: 'promo-1',
        giftCardCode: 'GC-ABCD1234',
        giftCardDiscount: 15,
      } as any,
      'booking-1',
    );

    expect(loyaltyService.redeem).toHaveBeenCalledWith('biz-1', 'cust-1', 20, 'booking-1');
    expect(promoCodesService.recordUse).toHaveBeenCalledWith('promo-1');
    expect(giftCardsService.redeem).toHaveBeenCalledWith('biz-1', 'GC-ABCD1234', 15, 'booking-1');
  });

  it('redeems service gift card credits after checkout', async () => {
    await service.applyRedemptions(
      'biz-1',
      'cust-1',
      {
        giftCardCode: 'GCS-BABY1',
        giftCardDiscount: 25,
        giftCardServiceRedemptions: [{ serviceId: 'svc-baby', units: 1 }],
      } as any,
      'booking-1',
    );

    expect(giftCardsService.redeemServiceCredit).toHaveBeenCalledWith(
      'biz-1',
      'GCS-BABY1',
      'svc-baby',
      'booking-1',
    );
    expect(giftCardsService.redeem).not.toHaveBeenCalled();
  });

  it('skips empty redemptions', async () => {
    await service.applyRedemptions('biz-1', 'cust-1', {} as any, 'booking-1');

    expect(loyaltyService.redeem).not.toHaveBeenCalled();
    expect(promoCodesService.recordUse).not.toHaveBeenCalled();
    expect(giftCardsService.redeem).not.toHaveBeenCalled();
  });
});
