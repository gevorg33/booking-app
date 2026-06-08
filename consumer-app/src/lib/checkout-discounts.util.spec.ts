import { describe, expect, it } from 'vitest';
import {
  buildCheckoutDiscountPayload,
  hasCheckoutDiscounts,
  isCheckoutPromoApplied,
  resolveMaxLoyaltyRedemption,
  shouldClearPromoOnQuoteError,
} from './checkout-discounts.util.js';
import {
  CHECKOUT_CLEAR_PROMO_SCENARIOS,
  CHECKOUT_LOYALTY_MAX_SCENARIOS,
  CHECKOUT_PROMO_APPLIED_SCENARIOS,
} from './checkout-discounts.fixtures.js';

describe('checkout-discounts.util', () => {
  it.each(CHECKOUT_PROMO_APPLIED_SCENARIOS)(
    'isCheckoutPromoApplied $id',
    ({ appliedPromo, quote, expect: expected }) => {
      expect(isCheckoutPromoApplied(appliedPromo, quote)).toBe(expected);
    },
  );

  it.each(CHECKOUT_LOYALTY_MAX_SCENARIOS)(
    'resolveMaxLoyaltyRedemption $id',
    ({ loyalty, quote, fallbackSubtotal, expect: expected }) => {
      expect(
        resolveMaxLoyaltyRedemption({ loyalty, quote, fallbackSubtotal }),
      ).toBe(expected);
    },
  );

  it.each(CHECKOUT_CLEAR_PROMO_SCENARIOS)(
    'shouldClearPromoOnQuoteError $id',
    ({ message, appliedPromo, expect: expected }) => {
      expect(shouldClearPromoOnQuoteError(message, appliedPromo)).toBe(expected);
    },
  );

  it('buildCheckoutDiscountPayload omits empty values', () => {
    expect(buildCheckoutDiscountPayload({ appliedPromo: '', loyaltyPoints: 0 })).toEqual({});
    expect(
      buildCheckoutDiscountPayload({ appliedPromo: 'SAVE10', loyaltyPoints: 12.5 }),
    ).toEqual({
      promoCode: 'SAVE10',
      loyaltyPointsToRedeem: 12.5,
    });
  });

  it('hasCheckoutDiscounts detects total discount', () => {
    expect(hasCheckoutDiscounts({ totalDiscount: 0 } as never)).toBe(false);
    expect(hasCheckoutDiscounts({ totalDiscount: 5 } as never)).toBe(true);
    expect(hasCheckoutDiscounts(null)).toBe(false);
  });
});
