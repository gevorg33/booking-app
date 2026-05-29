import { CheckoutPricingService } from './checkout-pricing.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { PromoCodesService } from './promo-codes.service.js';
import { PromoDiscountType } from './entities/promo-code.entity.js';

describe('CheckoutPricingService loyalty earn', () => {
  const loyaltyService = {
    getOrCreate: jest.fn(),
    pointsToCurrency: jest.fn(),
    calculateEarnPoints: jest.fn(),
  };
  const promoCodesService = {
    findValidForCheckout: jest.fn(),
    calculateDiscount: jest.fn(),
    recordUse: jest.fn(),
  };

  const service = new CheckoutPricingService(
    promoCodesService as unknown as PromoCodesService,
    loyaltyService as unknown as LoyaltyService,
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

  it('earns nothing when paid entirely with loyalty', async () => {
    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 100,
      currency: 'USD',
      customerId: 'cust-1',
      loyaltyPointsToRedeem: 100,
      earnPercentCashback: 10,
    });

    expect(result.amountDue).toBe(0);
    expect(loyaltyService.calculateEarnPoints).toHaveBeenCalledWith(0, 10);
    expect(result.pointsToEarn).toBe(0);
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
    expect(result.promoDiscount).toBe(20);
    expect(result.loyaltyDiscount).toBe(30);
    expect(result.amountDue).toBe(50);
    expect(result.totalDiscount).toBe(50);
    expect(loyaltyService.calculateEarnPoints).toHaveBeenCalledWith(50, 10);
    expect(result.pointsToEarn).toBe(5);
    expect(result.adjustments).toHaveLength(2);
  });

  it('promo plus loyalty covering full remainder yields zero due and zero earn', async () => {
    promoCodesService.calculateDiscount.mockImplementation((_promo, amount: number) =>
      Math.min(50, amount),
    );

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 50,
      currency: 'USD',
      customerId: 'cust-1',
      promoCode: 'HALF',
      loyaltyPointsToRedeem: 50,
      earnPercentCashback: 5,
    });

    expect(result.subtotal).toBe(50);
    expect(result.afterPromo).toBe(0);
    expect(result.promoDiscount).toBe(50);
    expect(result.loyaltyPointsToRedeem).toBe(0);
    expect(result.loyaltyDiscount).toBe(0);
    expect(result.amountDue).toBe(0);
    expect(result.pointsToEarn).toBe(0);
  });

  it('clamps loyalty to amount after promo when customer requests more', async () => {
    loyaltyService.getOrCreate.mockResolvedValue({ pointsBalance: 992 });

    const result = await service.calculate({
      businessId: 'biz-1',
      servicePrice: 100,
      prepaymentAmount: 50,
      currency: 'USD',
      customerId: 'cust-1',
      promoCode: 'SAVE20',
      loyaltyPointsToRedeem: 50,
      earnPercentCashback: 5,
    });

    expect(result.afterPromo).toBe(30);
    expect(result.loyaltyPointsToRedeem).toBe(30);
    expect(result.loyaltyDiscount).toBe(30);
    expect(result.amountDue).toBe(0);
    expect(result.pointsToEarn).toBe(0);
  });
});
