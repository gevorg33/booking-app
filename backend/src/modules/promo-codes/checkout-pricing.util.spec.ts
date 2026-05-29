import {
  computeAfterPromo,
  computeCheckoutTotals,
  computePointsToEarn,
  resolveLoyaltyRedemption,
} from './checkout-pricing.util.js';

describe('checkout-pricing.util', () => {
  describe('computeAfterPromo', () => {
    it('subtracts promo from subtotal', () => {
      expect(computeAfterPromo(100, 20)).toBe(80);
    });

    it('never goes below zero', () => {
      expect(computeAfterPromo(50, 60)).toBe(0);
    });
  });

  describe('resolveLoyaltyRedemption', () => {
    it('returns zero when nothing requested', () => {
      expect(resolveLoyaltyRedemption(0, 100, 80)).toBe(0);
      expect(resolveLoyaltyRedemption(undefined, 100, 80)).toBe(0);
    });

    it('caps by balance', () => {
      expect(resolveLoyaltyRedemption(100, 30, 80)).toBe(30);
    });

    it('caps by amount after promo', () => {
      expect(resolveLoyaltyRedemption(100, 200, 50)).toBe(50);
    });

    it('uses requested when within limits', () => {
      expect(resolveLoyaltyRedemption(40, 100, 80)).toBe(40);
    });
  });

  describe('computeCheckoutTotals — all discount combinations', () => {
    it('cash only: no promo, no loyalty', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 0, loyaltyPointsToRedeem: 0 }),
      ).toEqual({
        afterPromo: 100,
        loyaltyDiscount: 0,
        amountDue: 100,
        totalDiscount: 0,
      });
    });

    it('promo only', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 25, loyaltyPointsToRedeem: 0 }),
      ).toEqual({
        afterPromo: 75,
        loyaltyDiscount: 0,
        amountDue: 75,
        totalDiscount: 25,
      });
    });

    it('loyalty only', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 0, loyaltyPointsToRedeem: 40 }),
      ).toEqual({
        afterPromo: 100,
        loyaltyDiscount: 40,
        amountDue: 60,
        totalDiscount: 40,
      });
    });

    it('promo then partial loyalty with cash remainder', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 20, loyaltyPointsToRedeem: 30 }),
      ).toEqual({
        afterPromo: 80,
        loyaltyDiscount: 30,
        amountDue: 50,
        totalDiscount: 50,
      });
    });

    it('promo then loyalty covering full remainder — zero cash due', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 50, loyaltyPointsToRedeem: 50 }),
      ).toEqual({
        afterPromo: 50,
        loyaltyDiscount: 50,
        amountDue: 0,
        totalDiscount: 100,
      });
    });

    it('100% promo leaves nothing for loyalty to apply', () => {
      const totals = computeCheckoutTotals({
        subtotal: 50,
        promoDiscount: 50,
        loyaltyPointsToRedeem: 0,
      });
      expect(totals.afterPromo).toBe(0);
      expect(totals.loyaltyDiscount).toBe(0);
      expect(totals.amountDue).toBe(0);
      expect(totals.totalDiscount).toBe(50);
    });

    it('deposit subtotal with promo and loyalty', () => {
      expect(
        computeCheckoutTotals({ subtotal: 50, promoDiscount: 10, loyaltyPointsToRedeem: 40 }),
      ).toEqual({
        afterPromo: 40,
        loyaltyDiscount: 40,
        amountDue: 0,
        totalDiscount: 50,
      });
    });
  });

  describe('computePointsToEarn', () => {
    it('earns on cash due after promo and loyalty', () => {
      const { amountDue } = computeCheckoutTotals({
        subtotal: 100,
        promoDiscount: 20,
        loyaltyPointsToRedeem: 30,
      });
      expect(amountDue).toBe(50);
      expect(computePointsToEarn(amountDue, 5)).toBe(2.5);
    });

    it('earns nothing when fully covered by loyalty after promo', () => {
      const { amountDue } = computeCheckoutTotals({
        subtotal: 100,
        promoDiscount: 50,
        loyaltyPointsToRedeem: 50,
      });
      expect(computePointsToEarn(amountDue, 5)).toBe(0);
    });

    it('earns on promo-only checkout', () => {
      const { amountDue } = computeCheckoutTotals({
        subtotal: 100,
        promoDiscount: 20,
        loyaltyPointsToRedeem: 0,
      });
      expect(computePointsToEarn(amountDue, 10)).toBe(8);
    });
  });
});
