import {
  computeAfterPromo,
  computeCheckoutTotals,
  computePointsToEarn,
  isGiftCardCode,
  resolveGiftCardRedemption,
  resolveLoyaltyRedemption,
} from './checkout-pricing.util.js';

const base = { giftCardDiscount: 0 };

describe('checkout-pricing.util', () => {
  describe('isGiftCardCode', () => {
    it('detects GC- prefix', () => {
      expect(isGiftCardCode('GC-ABCD1234')).toBe(true);
      expect(isGiftCardCode('SAVE20')).toBe(false);
    });
  });

  describe('resolveGiftCardRedemption', () => {
    it('caps by balance and amount due', () => {
      expect(resolveGiftCardRedemption(100, 50)).toBe(50);
      expect(resolveGiftCardRedemption(30, 50)).toBe(30);
    });

    it('returns zero when balance or amount due is zero', () => {
      expect(resolveGiftCardRedemption(0, 50)).toBe(0);
      expect(resolveGiftCardRedemption(50, 0)).toBe(0);
    });
  });

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

    it('caps by amount due', () => {
      expect(resolveLoyaltyRedemption(100, 200, 50)).toBe(50);
    });

    it('uses requested when within limits', () => {
      expect(resolveLoyaltyRedemption(40, 100, 80)).toBe(40);
    });
  });

  describe('computeCheckoutTotals — all discount combinations', () => {
    it('cash only: no promo, no loyalty', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 0, ...base, loyaltyPointsToRedeem: 0 }),
      ).toEqual({
        afterPromo: 100,
        afterGiftCard: 100,
        giftCardDiscount: 0,
        loyaltyDiscount: 0,
        amountDue: 100,
        totalDiscount: 0,
      });
    });

    it('promo only', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 25, ...base, loyaltyPointsToRedeem: 0 }),
      ).toEqual({
        afterPromo: 75,
        afterGiftCard: 75,
        giftCardDiscount: 0,
        loyaltyDiscount: 0,
        amountDue: 75,
        totalDiscount: 25,
      });
    });

    it('gift card only', () => {
      expect(
        computeCheckoutTotals({
          subtotal: 100,
          promoDiscount: 0,
          giftCardDiscount: 40,
          loyaltyPointsToRedeem: 0,
        }),
      ).toEqual({
        afterPromo: 100,
        afterGiftCard: 60,
        giftCardDiscount: 40,
        loyaltyDiscount: 0,
        amountDue: 60,
        totalDiscount: 40,
      });
    });

    it('loyalty only', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 0, ...base, loyaltyPointsToRedeem: 40 }),
      ).toEqual({
        afterPromo: 100,
        afterGiftCard: 100,
        giftCardDiscount: 0,
        loyaltyDiscount: 40,
        amountDue: 60,
        totalDiscount: 40,
      });
    });

    it('gift card then loyalty', () => {
      expect(
        computeCheckoutTotals({
          subtotal: 100,
          promoDiscount: 0,
          giftCardDiscount: 30,
          loyaltyPointsToRedeem: 20,
        }),
      ).toEqual({
        afterPromo: 100,
        afterGiftCard: 70,
        giftCardDiscount: 30,
        loyaltyDiscount: 20,
        amountDue: 50,
        totalDiscount: 50,
      });
    });

    it('promo then partial loyalty with cash remainder', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 20, ...base, loyaltyPointsToRedeem: 30 }),
      ).toEqual({
        afterPromo: 80,
        afterGiftCard: 80,
        giftCardDiscount: 0,
        loyaltyDiscount: 30,
        amountDue: 50,
        totalDiscount: 50,
      });
    });

    it('promo then loyalty covering full remainder — zero cash due', () => {
      expect(
        computeCheckoutTotals({ subtotal: 100, promoDiscount: 50, ...base, loyaltyPointsToRedeem: 50 }),
      ).toEqual({
        afterPromo: 50,
        afterGiftCard: 50,
        giftCardDiscount: 0,
        loyaltyDiscount: 50,
        amountDue: 0,
        totalDiscount: 100,
      });
    });
  });

  describe('computePointsToEarn', () => {
    it('earns on cash due after gift card and loyalty', () => {
      const { amountDue } = computeCheckoutTotals({
        subtotal: 100,
        promoDiscount: 0,
        giftCardDiscount: 30,
        loyaltyPointsToRedeem: 20,
      });
      expect(amountDue).toBe(50);
      expect(computePointsToEarn(amountDue, 5)).toBe(2.5);
    });

    it('defaults earn percent to zero', () => {
      expect(computePointsToEarn(100)).toBe(0);
    });
  });
});
