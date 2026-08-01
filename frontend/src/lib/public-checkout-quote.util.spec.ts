import { describe, expect, it } from 'vitest';
import {
  resolvePublicCheckoutAmountDue,
  resolvePublicCheckoutCartTotal,
  resolvePublicCheckoutStickyDisplay,
} from './public-checkout-quote.util';

describe('public-checkout-quote.util (e2e-bug.213 / e2e-bug.214)', () => {
  describe('resolvePublicCheckoutCartTotal', () => {
    it('prefers quote.servicePrice over local line sum', () => {
      expect(
        resolvePublicCheckoutCartTotal({ servicePrice: 120 }, 999),
      ).toBe(120);
    });

    it('falls back to local sum when quote has no servicePrice', () => {
      expect(resolvePublicCheckoutCartTotal(null, 120)).toBe(120);
      expect(resolvePublicCheckoutCartTotal({}, 80)).toBe(80);
      expect(resolvePublicCheckoutCartTotal({ servicePrice: NaN }, 40)).toBe(40);
    });
  });

  describe('resolvePublicCheckoutAmountDue', () => {
    it('uses quote.amountDue including explicit 0 (pay-at-visit)', () => {
      expect(
        resolvePublicCheckoutAmountDue({ amountDue: 0 }, 120),
      ).toBe(0);
    });

    it('falls back when quote is missing', () => {
      expect(resolvePublicCheckoutAmountDue(null, 120)).toBe(120);
      expect(resolvePublicCheckoutAmountDue({}, 50)).toBe(50);
    });
  });

  describe('resolvePublicCheckoutStickyDisplay', () => {
    it('shows catalog Total for pay-at-visit quote (servicePrice 120, amountDue 0)', () => {
      expect(
        resolvePublicCheckoutStickyDisplay({
          cartTotal: 120,
          amountDue: 0,
          hasDiscounts: false,
        }),
      ).toEqual({ amount: 120, kind: 'total' });
    });

    it('shows Due now when online prepayment is required', () => {
      expect(
        resolvePublicCheckoutStickyDisplay({
          cartTotal: 120,
          amountDue: 40,
          hasDiscounts: false,
        }),
      ).toEqual({ amount: 40, kind: 'due_now' });
    });

    it('shows free-after-discounts when discounts zero the online due', () => {
      expect(
        resolvePublicCheckoutStickyDisplay({
          cartTotal: 120,
          amountDue: 0,
          hasDiscounts: true,
        }),
      ).toEqual({ amount: 0, kind: 'free_after_discounts' });
    });
  });

  describe('e2e-bug.214 package pay-at-visit / partial deposit', () => {
    it('cart Total uses servicePrice even when subtotal/amountDue are 0', () => {
      const quote = { servicePrice: 344.25, subtotal: 0, amountDue: 0 };
      expect(resolvePublicCheckoutCartTotal(quote, 344.25)).toBe(344.25);
      expect(resolvePublicCheckoutAmountDue(quote, 344.25)).toBe(0);
      expect(
        resolvePublicCheckoutStickyDisplay({
          cartTotal: 344.25,
          amountDue: 0,
          hasDiscounts: false,
        }),
      ).toEqual({ amount: 344.25, kind: 'total' });
    });

    it('cart Total stays package price when one line has a small deposit due', () => {
      const quote = { servicePrice: 344.25, subtotal: 25, amountDue: 25 };
      expect(resolvePublicCheckoutCartTotal(quote, 344.25)).toBe(344.25);
      expect(resolvePublicCheckoutAmountDue(quote, 344.25)).toBe(25);
      expect(
        resolvePublicCheckoutStickyDisplay({
          cartTotal: 344.25,
          amountDue: 25,
          hasDiscounts: false,
        }),
      ).toEqual({ amount: 25, kind: 'due_now' });
    });

    it('never lets amountDue:0 overwrite local packagePrice as cart Total', () => {
      // Pre-fix UI: `quote?.amountDue ?? packagePrice` → 0
      expect(resolvePublicCheckoutCartTotal({ amountDue: 0 } as never, 344.25)).toBe(
        344.25,
      );
    });
  });

  describe('e2e-bug.222 single-service pay-at-visit', () => {
    it('Swedish-style quote: catalog 80, online due 0 → sticky Total 80', () => {
      const quote = { servicePrice: 80, subtotal: 0, amountDue: 0 };
      expect(resolvePublicCheckoutCartTotal(quote, 80)).toBe(80);
      expect(resolvePublicCheckoutAmountDue(quote, 80)).toBe(0);
      expect(
        resolvePublicCheckoutStickyDisplay({
          cartTotal: 80,
          amountDue: 0,
          hasDiscounts: false,
        }),
      ).toEqual({ amount: 80, kind: 'total' });
    });
  });
});
