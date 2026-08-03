/**
 * e2e-bug.222 / e2e-bug.180 — single-service checkout payment-method gating.
 * Online due must come from prepayment / quote.amountDue (0 for pay-at-visit),
 * never from catalog price alone.
 */

export type CheckoutPaymentMethod = 'online' | 'cash';

/**
 * Online amount due for sticky CTA / Stripe.
 * `onlineChargeBase` must already be 0 for pay-at-visit (do not pass catalog price).
 */
export function resolveSingleServiceOnlineAmountDue(options: {
  usingSubscriptionCredit: boolean;
  quoteAmountDue?: number | null;
  onlineChargeBase: number;
  subscriptionPlanPrice?: number;
}): number {
  if (options.usingSubscriptionCredit) return 0;
  if (
    options.quoteAmountDue != null &&
    typeof options.quoteAmountDue === 'number' &&
    Number.isFinite(options.quoteAmountDue)
  ) {
    return Math.max(0, options.quoteAmountDue);
  }
  if (
    options.subscriptionPlanPrice != null &&
    Number.isFinite(options.subscriptionPlanPrice)
  ) {
    return Math.max(0, options.subscriptionPlanPrice);
  }
  return Math.max(0, options.onlineChargeBase);
}

/** Online Stripe path when there is a positive online due. */
export function requiresSingleServiceOnlinePayment(options: {
  amountDue: number;
  paymentMethod: CheckoutPaymentMethod;
  purchaseType: 'one-time' | 'subscription';
  /** From `prepaymentDue(service)` — 0 for prepaymentMode:none. */
  dueNow: number;
}): boolean {
  if (options.amountDue <= 0) return false;
  if (options.paymentMethod === 'cash') return false;
  if (options.purchaseType === 'subscription') return true;
  return options.dueNow > 0;
}

/**
 * Cash vs online toggle.
 * Hidden for pay-at-visit (`dueNow <= 0`) so “Pay online” cannot appear when
 * Stripe would reject the charge (e2e-bug.222). Also hidden when amountDue is 0.
 */
export function showSingleServiceCashPaymentOption(options: {
  acceptCashPayments: boolean;
  purchaseType: 'one-time' | 'subscription';
  usingSubscriptionCredit: boolean;
  amountDue: number;
  dueNow: number;
  prepaymentMode: string;
}): boolean {
  if (!options.acceptCashPayments) return false;
  if (options.purchaseType !== 'one-time') return false;
  if (options.usingSubscriptionCredit) return false;
  if (options.prepaymentMode === 'full') return false;
  if (options.amountDue <= 0) return false;
  // e2e-bug.222 — never offer Pay online for pay-at-visit / none.
  if (options.dueNow <= 0) return false;
  if (options.dueNow > 0 && options.prepaymentMode === 'deposit') return false;
  return true;
}
