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

export function serviceIdsWithSubscriptionPlans(plans: Array<{ serviceId: string; isActive?: boolean }>): string[] {
  return [...new Set(filterActiveSubscriptionPlans(plans).map((plan) => plan.serviceId))];
}

export function formatSubscriptionPlanAssignLabel(plan: SubscriptionPlanSummary): string {
  const price = Number(plan.preview?.pricing?.subscriptionPrice ?? 0).toFixed(2);
  return `${plan.name} — ${plan.includedAppointments} visits / ${plan.durationMonths} mo — $${price}`;
}

export function isSubscriptionCheckoutSelection(
  purchaseType: 'one-time' | 'subscription',
  selectedPlanId: string,
): boolean {
  return purchaseType === 'subscription' && selectedPlanId.trim().length > 0;
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
