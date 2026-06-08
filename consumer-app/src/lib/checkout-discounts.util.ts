import type { PublicCheckoutQuote } from './types.js';
import type { PublicLoyaltySummary } from './consumer-rewards-display.util.js';

export interface CheckoutDiscountState {
  appliedPromo: string;
  loyaltyPoints: number;
}

export function isCheckoutPromoApplied(
  appliedPromo: string,
  quote: PublicCheckoutQuote | null | undefined,
): boolean {
  if (!appliedPromo || !quote) return false;
  const normalized = appliedPromo.toUpperCase();
  return (
    quote.promoCode?.toUpperCase() === normalized ||
    (quote.giftCardCode?.toUpperCase() === normalized && (quote.giftCardDiscount ?? 0) > 0) ||
    (quote.promoDiscount ?? 0) > 0 ||
    (quote.giftCardDiscount ?? 0) > 0
  );
}

export function resolveMaxLoyaltyRedemption(input: {
  loyalty: PublicLoyaltySummary | null | undefined;
  quote: PublicCheckoutQuote | null | undefined;
  fallbackSubtotal: number;
}): number {
  const balance = input.loyalty?.pointsBalance ?? input.quote?.loyaltyPointsBalance ?? 0;
  if (balance <= 0) return 0;
  const redeemable =
    input.quote?.afterGiftCard ??
    input.quote?.afterPromo ??
    Math.max(0, (input.quote?.subtotal ?? input.fallbackSubtotal) - (input.quote?.promoDiscount ?? 0) - (input.quote?.giftCardDiscount ?? 0));
  return Math.round(Math.min(balance, redeemable) * 100) / 100;
}

export function shouldClearPromoOnQuoteError(message: string, appliedPromo: string): boolean {
  return Boolean(appliedPromo) && /promo|gift card/i.test(message);
}

export function buildCheckoutDiscountPayload(state: CheckoutDiscountState) {
  return {
    promoCode: state.appliedPromo || undefined,
    loyaltyPointsToRedeem: state.loyaltyPoints > 0 ? state.loyaltyPoints : undefined,
  };
}

export function hasCheckoutDiscounts(quote: PublicCheckoutQuote | null | undefined): boolean {
  return (quote?.totalDiscount ?? 0) > 0;
}
