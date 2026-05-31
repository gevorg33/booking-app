export type PublicCheckoutKind =
  | 'subscription_purchase'
  | 'service_prepayment'
  | 'subscription_credit'
  | 'package_purchase'
  | 'multi_service_booking';

export function resolvePublicCheckoutKind(ctx: {
  purchasePlanId?: string;
  useSubscriptionId?: string;
  packageId?: string;
  serviceIds?: string[];
}): PublicCheckoutKind {
  if (ctx.packageId) return 'package_purchase';
  if (ctx.serviceIds?.length) return 'multi_service_booking';
  if (ctx.purchasePlanId) return 'subscription_purchase';
  if (ctx.useSubscriptionId) return 'subscription_credit';
  return 'service_prepayment';
}

export function buildMultiServiceLineItem(serviceCount: number) {
  return {
    name: 'Multi-service appointment',
    description: `${serviceCount} services in one visit`,
  };
}

export function buildPackageLineItem(packageName: string, serviceCount: number) {
  return {
    name: packageName,
    description: `Bundle of ${serviceCount} appointment${serviceCount === 1 ? '' : 's'}`,
  };
}

export function buildSubscriptionLineItem(planName: string, appointments: number, months: number) {
  return {
    name: `${planName} subscription`,
    description: `${appointments} appointments over ${months} months`,
  };
}
