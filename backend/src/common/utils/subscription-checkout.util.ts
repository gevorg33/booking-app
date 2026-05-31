export type PublicCheckoutKind = 'subscription_purchase' | 'service_prepayment' | 'subscription_credit';

export function resolvePublicCheckoutKind(ctx: {
  purchasePlanId?: string;
  useSubscriptionId?: string;
}): PublicCheckoutKind {
  if (ctx.purchasePlanId) return 'subscription_purchase';
  if (ctx.useSubscriptionId) return 'subscription_credit';
  return 'service_prepayment';
}

export function buildSubscriptionLineItem(planName: string, appointments: number, months: number) {
  return {
    name: `${planName} subscription`,
    description: `${appointments} appointments over ${months} months`,
  };
}
