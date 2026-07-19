export interface SubscriptionPlanSummary {
  id: string;
  name: string;
  serviceId: string;
  durationMonths: number;
  includedAppointments: number;
  isActive?: boolean;
  preview?: { pricing?: { subscriptionPrice?: number } };
}

export function filterActiveSubscriptionPlans<T extends { isActive?: boolean }>(plans: T[]): T[] {
  return plans.filter((plan) => plan.isActive !== false);
}

export function subscriptionPlansForService<T extends { serviceId: string }>(
  plans: T[],
  serviceId: string,
): T[] {
  return plans.filter((plan) => plan.serviceId === serviceId);
}

export function serviceIdsWithSubscriptionPlans(
  plans: Array<{ serviceId: string; isActive?: boolean }>,
): string[] {
  return [...new Set(filterActiveSubscriptionPlans(plans).map((plan) => plan.serviceId))];
}

export function isSubscriptionCheckoutSelection(
  purchaseType: 'one-time' | 'subscription',
  selectedPlanId: string,
): boolean {
  return purchaseType === 'subscription' && selectedPlanId.trim().length > 0;
}

export function resolveCheckoutAmountDue(options: {
  usingSubscriptionCredit: boolean;
  quoteAmountDue?: number;
  subscriptionPlanPrice?: number;
  fallback: number;
}): number {
  if (options.usingSubscriptionCredit) return 0;
  if (options.quoteAmountDue != null) return options.quoteAmountDue;
  if (options.subscriptionPlanPrice != null) return options.subscriptionPlanPrice;
  return options.fallback;
}

export function resolveCheckoutSubtotal(options: {
  purchaseType: 'one-time' | 'subscription';
  quoteSubtotal?: number;
  subscriptionPlanPrice?: number;
  fallback: number;
}): number {
  if (options.purchaseType === 'subscription') {
    if (options.quoteSubtotal != null) return options.quoteSubtotal;
    if (options.subscriptionPlanPrice != null) return options.subscriptionPlanPrice;
  }
  return options.quoteSubtotal ?? options.fallback;
}

export function buildQuoteRequest(options: {
  serviceId: string;
  purchaseType: 'one-time' | 'subscription';
  selectedPlanId: string;
  promoCode?: string;
  loyaltyPointsToRedeem?: number;
  paxCount?: number;
  /** e2e-bug.28 — thread subscription credit into /bookings/quote */
  useSubscriptionId?: string;
}): {
  serviceId: string;
  promoCode?: string;
  loyaltyPointsToRedeem?: number;
  purchasePlanId?: string;
  useSubscriptionId?: string;
  paxCount?: number;
} {
  return {
    serviceId: options.serviceId,
    promoCode: options.promoCode,
    loyaltyPointsToRedeem: options.loyaltyPointsToRedeem,
    ...(options.purchaseType === 'subscription' && options.selectedPlanId
      ? { purchasePlanId: options.selectedPlanId }
      : {}),
    ...(options.useSubscriptionId
      ? { useSubscriptionId: options.useSubscriptionId }
      : {}),
    ...(options.paxCount != null && options.paxCount > 0
      ? { paxCount: options.paxCount }
      : {}),
  };
}

export function subscriptionCheckoutPayload(
  purchaseType: 'one-time' | 'subscription',
  selectedPlanId: string,
): { purchasePlanId: string; useSubscriptionCreditOnPurchase: true } | Record<string, never> {
  if (!isSubscriptionCheckoutSelection(purchaseType, selectedPlanId)) {
    return {};
  }
  return { purchasePlanId: selectedPlanId, useSubscriptionCreditOnPurchase: true };
}
