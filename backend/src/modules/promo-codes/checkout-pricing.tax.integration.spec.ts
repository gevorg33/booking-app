import { CheckoutPricingService } from './checkout-pricing.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { PromoCodesService } from './promo-codes.service.js';
import { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import { PromoDiscountType } from './entities/promo-code.entity.js';

describe('Sprint 36 — checkout pricing tax scenario matrix', () => {
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

  const stackedTax = {
    enabled: true,
    name: 'Tax',
    rate: 13,
    model: 'exclusive' as const,
    rules: [
      { id: 'gst', name: 'GST', rate: 5 },
      { id: 'pst', name: 'PST', rate: 8 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyService.getOrCreate.mockResolvedValue({ pointsBalance: 0 });
    loyaltyService.calculateEarnPoints.mockImplementation(
      (cash: number) => cash,
    );
    promoCodesService.findValidForCheckout.mockResolvedValue(null);
  });

  it.each([
    {
      id: 'exclusive-no-discount',
      input: {
        servicePrice: 100,
        prepaymentAmount: 100,
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive' as const,
        },
      },
      expected: {
        taxEnabled: true,
        netAmount: 100,
        taxAmount: 20,
        amountDue: 120,
        taxModel: 'exclusive',
      },
    },
    {
      id: 'inclusive-no-discount',
      input: {
        servicePrice: 120,
        prepaymentAmount: 120,
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'inclusive' as const,
        },
      },
      expected: {
        taxEnabled: true,
        netAmount: 100,
        taxAmount: 20,
        amountDue: 120,
        taxModel: 'inclusive',
      },
    },
    {
      id: 'exclusive-service-override',
      input: {
        servicePrice: 100,
        prepaymentAmount: 100,
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive' as const,
          serviceRatePercent: 5,
        },
      },
      expected: {
        taxEnabled: true,
        taxRate: 5,
        taxAmount: 5,
        amountDue: 105,
      },
    },
    {
      id: 'exclusive-service-exempt',
      input: {
        servicePrice: 100,
        prepaymentAmount: 100,
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive' as const,
          serviceRatePercent: 0,
        },
      },
      expected: {
        taxEnabled: false,
        taxAmount: 0,
        amountDue: 100,
      },
    },
    {
      id: 'tax-disabled-input',
      input: {
        servicePrice: 100,
        prepaymentAmount: 100,
        tax: {
          enabled: false,
          name: 'VAT',
          rate: 20,
          model: 'exclusive' as const,
        },
      },
      expected: {
        taxEnabled: false,
        amountDue: 100,
      },
    },
    {
      id: 'no-tax-input',
      input: {
        servicePrice: 100,
        prepaymentAmount: 100,
      },
      expected: {
        taxEnabled: false,
        amountDue: 100,
      },
    },
    {
      id: 'stacked-exclusive-no-discount',
      input: {
        servicePrice: 100,
        prepaymentAmount: 100,
        tax: stackedTax,
      },
      expected: {
        taxEnabled: true,
        taxName: 'GST + PST',
        taxRate: 13,
        taxAmount: 13,
        netAmount: 100,
        amountDue: 113,
        taxModel: 'exclusive',
        taxRuleCount: 2,
      },
    },
    {
      id: 'stacked-inclusive-no-discount',
      input: {
        servicePrice: 113,
        prepaymentAmount: 113,
        tax: { ...stackedTax, model: 'inclusive' as const },
      },
      expected: {
        taxEnabled: true,
        taxName: 'GST + PST',
        taxRate: 13,
        taxAmount: 13,
        netAmount: 100,
        amountDue: 113,
        taxModel: 'inclusive',
        taxRuleCount: 2,
      },
    },
    {
      id: 'stacked-exclusive-service-override',
      input: {
        servicePrice: 100,
        prepaymentAmount: 100,
        tax: { ...stackedTax, serviceRatePercent: 7 },
      },
      expected: {
        taxEnabled: true,
        taxRate: 7,
        taxAmount: 7,
        amountDue: 107,
        taxRuleCount: 0,
      },
    },
    {
      id: 'stacked-exclusive-service-exempt',
      input: {
        servicePrice: 100,
        prepaymentAmount: 100,
        tax: { ...stackedTax, serviceRatePercent: 0 },
      },
      expected: {
        taxEnabled: false,
        taxAmount: 0,
        amountDue: 100,
      },
    },
  ])('calculates $id', async ({ input, expected }) => {
    const result = await service.calculate({
      businessId: 'biz-1',
      currency: 'USD',
      earnPercentCashback: 0,
      ...input,
    });

    expect(result.taxEnabled).toBe(expected.taxEnabled);
    if (expected.taxAmount != null) {
      expect(result.taxAmount).toBe(expected.taxAmount);
    }
    if (expected.netAmount != null) {
      expect(result.netAmount).toBe(expected.netAmount);
    }
    if (expected.taxRate != null) {
      expect(result.taxRate).toBe(expected.taxRate);
    }
    if (expected.taxModel != null) {
      expect(result.taxModel).toBe(expected.taxModel);
    }
    if (expected.taxName != null) {
      expect(result.taxName).toBe(expected.taxName);
    }
    if (expected.taxRuleCount != null) {
      if (expected.taxRuleCount > 0) {
        expect(result.taxRules).toHaveLength(expected.taxRuleCount);
        const allocated =
          result.taxRules?.reduce((sum, rule) => sum + rule.amount, 0) ?? 0;
        expect(allocated).toBe(result.taxAmount);
      } else {
        expect(result.taxRules).toBeUndefined();
      }
    }
    expect(result.amountDue).toBe(expected.amountDue);
  });

  it('applies exclusive tax on post-promo discounted amount', async () => {
    promoCodesService.findValidForCheckout.mockResolvedValue(promo);
    promoCodesService.calculateDiscount.mockImplementation(
      (_promo, amount: number) => Math.min(20, amount),
    );

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 100,
      currency: 'USD',
      promoCode: 'SAVE20',
      earnPercentCashback: 0,
      tax: {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'exclusive',
      },
    });

    expect(result.afterPromo).toBe(80);
    expect(result.netAmount).toBe(80);
    expect(result.taxAmount).toBe(16);
    expect(result.amountDue).toBe(96);
    expect(loyaltyService.calculateEarnPoints).toHaveBeenCalledWith(96, 0);
  });

  it('applies inclusive tax on post-promo discounted gross amount', async () => {
    promoCodesService.findValidForCheckout.mockResolvedValue(promo);
    promoCodesService.calculateDiscount.mockImplementation(
      (_promo, amount: number) => Math.min(20, amount),
    );

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 120,
      prepaymentAmount: 120,
      currency: 'USD',
      promoCode: 'SAVE20',
      earnPercentCashback: 0,
      tax: {
        enabled: true,
        name: 'VAT',
        rate: 20,
        model: 'inclusive',
      },
    });

    expect(result.afterPromo).toBe(100);
    expect(result.amountDue).toBe(100);
    expect(result.taxAmount).toBeCloseTo(16.67, 2);
    expect(result.netAmount).toBeCloseTo(83.33, 2);
  });

  it('stacks exclusive tax on post-promo discounted amount', async () => {
    promoCodesService.findValidForCheckout.mockResolvedValue(promo);
    promoCodesService.calculateDiscount.mockImplementation(
      (_promo, amount: number) => Math.min(20, amount),
    );

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 100,
      currency: 'USD',
      promoCode: 'SAVE20',
      earnPercentCashback: 0,
      tax: stackedTax,
    });

    expect(result.afterPromo).toBe(80);
    expect(result.netAmount).toBe(80);
    expect(result.taxAmount).toBe(10.4);
    expect(result.amountDue).toBe(90.4);
    expect(result.taxRules).toEqual([
      { id: 'gst', name: 'GST', rate: 5, amount: 4 },
      { id: 'pst', name: 'PST', rate: 8, amount: 6.4 },
    ]);
    expect(loyaltyService.calculateEarnPoints).toHaveBeenCalledWith(90.4, 0);
  });

  it('stacks inclusive tax on post-promo discounted gross amount', async () => {
    promoCodesService.findValidForCheckout.mockResolvedValue(promo);
    promoCodesService.calculateDiscount.mockImplementation(
      (_promo, amount: number) => Math.min(20, amount),
    );

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 113,
      prepaymentAmount: 113,
      currency: 'USD',
      promoCode: 'SAVE20',
      earnPercentCashback: 0,
      tax: { ...stackedTax, model: 'inclusive' },
    });

    expect(result.afterPromo).toBe(93);
    expect(result.amountDue).toBe(93);
    expect(result.taxAmount).toBe(10.7);
    expect(result.netAmount).toBe(82.3);
    expect(result.taxRules).toHaveLength(2);
    const allocated =
      result.taxRules?.reduce((sum, rule) => sum + rule.amount, 0) ?? 0;
    expect(allocated).toBe(result.taxAmount);
  });
});
