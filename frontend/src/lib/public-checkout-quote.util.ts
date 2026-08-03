/**
 * Public checkout quote field semantics (api-bug.7 / e2e-bug.213):
 * - `servicePrice` — catalog cart total (sum of line prices / package price)
 * - `subtotal` — online prepayment base before discounts (0 when all lines are pay-at-visit)
 * - `amountDue` — online charge after promo/gift/loyalty (0 when nothing is due online)
 *
 * Never treat `amountDue`/`subtotal` alone as the customer-facing cart Total.
 */

export type PublicCheckoutQuoteTotals = {
  servicePrice?: number;
  subtotal?: number;
  amountDue?: number;
  totalDiscount?: number;
};

export function resolvePublicCheckoutCartTotal(
  quote: Pick<PublicCheckoutQuoteTotals, 'servicePrice'> | null | undefined,
  localFallback: number,
): number {
  const price = quote?.servicePrice;
  if (typeof price === 'number' && Number.isFinite(price)) {
    return Math.max(0, price);
  }
  return Math.max(0, localFallback);
}

export function resolvePublicCheckoutAmountDue(
  quote: Pick<PublicCheckoutQuoteTotals, 'amountDue'> | null | undefined,
  localFallback: number,
): number {
  if (quote && typeof quote.amountDue === 'number' && Number.isFinite(quote.amountDue)) {
    return Math.max(0, quote.amountDue);
  }
  return Math.max(0, localFallback);
}

export type PublicCheckoutStickyKind =
  | 'free_after_discounts'
  | 'due_now'
  | 'total';

export function resolvePublicCheckoutStickyDisplay(options: {
  cartTotal: number;
  amountDue: number;
  hasDiscounts: boolean;
}): { amount: number; kind: PublicCheckoutStickyKind } {
  const cartTotal = Math.max(0, options.cartTotal);
  const amountDue = Math.max(0, options.amountDue);
  if (amountDue <= 0 && options.hasDiscounts) {
    return { amount: 0, kind: 'free_after_discounts' };
  }
  if (amountDue > 0) {
    return { amount: amountDue, kind: 'due_now' };
  }
  // Pay-at-visit (or unpaid cart): show catalog total, not $0.
  return { amount: cartTotal, kind: 'total' };
}
