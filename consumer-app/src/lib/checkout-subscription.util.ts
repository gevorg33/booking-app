import type {
  PublicBusinessProfile,
  PublicCheckoutQuote,
  PublicCustomerSubscription,
  PublicService,
} from './types.js';
import { prepaymentDue, type CheckoutPaymentMethod } from './checkout-payment.util.js';
import { subscriptionCheckoutPayload } from './subscription-plans.util.js';

export type CheckoutPurchaseType = 'one-time' | 'subscription';

export function isUsingSubscriptionCredit(input: {
  activeSubscription: Pick<PublicCustomerSubscription, 'appointmentsRemaining'> | null | undefined;
  useExistingSubscription: boolean;
  purchaseType: CheckoutPurchaseType;
}): boolean {
  return (
    Boolean(input.activeSubscription?.appointmentsRemaining) &&
    input.useExistingSubscription &&
    input.purchaseType === 'one-time'
  );
}

/**
 * e2e-bug.17 / e2e-bug.28 — defense-in-depth when quote API omitted useSubscriptionId.
 * Prefer server quote with useSubscriptionId; this still zeros a stale full-price quote.
 */
export function resolveDisplayCheckoutQuote(
  quote: PublicCheckoutQuote | null | undefined,
  options: { usingSubscriptionCredit: boolean },
): PublicCheckoutQuote | null {
  if (!quote) return null;
  if (!options.usingSubscriptionCredit || quote.amountDue === 0) return quote;
  const covered = Math.max(quote.amountDue, 0);
  return {
    ...quote,
    amountDue: 0,
    totalDiscount: Math.max(quote.totalDiscount ?? 0, covered),
  };
}

export function buildBookingSubscriptionFields(input: {
  usingSubscriptionCredit: boolean;
  activeSubscriptionId?: string;
  purchaseType: CheckoutPurchaseType;
  selectedPlanId: string;
}): {
  useSubscriptionId?: string;
  purchasePlanId?: string;
  useSubscriptionCreditOnPurchase?: boolean;
} {
  if (input.usingSubscriptionCredit && input.activeSubscriptionId) {
    return { useSubscriptionId: input.activeSubscriptionId };
  }
  return subscriptionCheckoutPayload(input.purchaseType, input.selectedPlanId);
}

export function requiresCheckoutOnlinePayment(input: {
  amountDue: number;
  paymentMethod: CheckoutPaymentMethod;
  purchaseType: CheckoutPurchaseType;
  service: Pick<PublicService, 'prepaymentMode' | 'onlinePaymentEnabled' | 'price' | 'depositAmount'>;
}): boolean {
  if (input.amountDue <= 0) return false;
  if (input.paymentMethod === 'cash') return false;
  const dueNow = prepaymentDue(input.service);
  return (
    input.purchaseType === 'subscription' ||
    input.service.prepaymentMode === 'full' ||
    (input.service.prepaymentMode === 'deposit' && dueNow > 0)
  );
}

export function showCheckoutCashOption(input: {
  profile: Pick<PublicBusinessProfile, 'acceptCashPayments'>;
  purchaseType: CheckoutPurchaseType;
  usingSubscriptionCredit: boolean;
  amountDue: number;
  service: Pick<PublicService, 'prepaymentMode' | 'onlinePaymentEnabled' | 'price' | 'depositAmount'>;
}): boolean {
  const dueNow = prepaymentDue(input.service);
  return (
    input.profile.acceptCashPayments === true &&
    input.purchaseType === 'one-time' &&
    !input.usingSubscriptionCredit &&
    input.service.prepaymentMode !== 'full' &&
    input.amountDue > 0 &&
    !(dueNow > 0 && input.service.prepaymentMode === 'deposit')
  );
}

export function shouldShowSubscriptionCheckoutOptions(input: {
  hasSubscriptionPlans?: boolean;
  activeSubscription: PublicCustomerSubscription | null | undefined;
  subscriptionPlans: unknown[];
}): boolean {
  return (
    input.hasSubscriptionPlans === true ||
    Boolean(input.activeSubscription?.appointmentsRemaining) ||
    input.subscriptionPlans.length > 0
  );
}
