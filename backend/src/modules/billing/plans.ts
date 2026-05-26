/**
 * Subscription plan registry — add new plans here as the product grows.
 * Checkout uses inline Stripe price_data so no pre-created Price IDs are required.
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  features: string[];
  /** Highlight in pricing UI */
  popular?: boolean;
  /** When true, plan is shown on billing page */
  active?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Full scheduling platform for one business.',
    priceMonthly: 19,
    currency: 'usd',
    popular: true,
    active: true,
    features: [
      'Unlimited bookings & customers',
      'Schedule templates & direct schedules',
      'Provider calendar view',
      'AI command assistant',
      'Email support',
    ],
  },
  // Extend with additional tiers, e.g.:
  // pro: {
  //   id: 'pro',
  //   name: 'Pro',
  //   description: 'Advanced features for growing teams.',
  //   priceMonthly: 49,
  //   currency: 'usd',
  //   active: false,
  //   features: ['Everything in Starter', 'Multi-location', 'Priority support'],
  // },
};

export function getActivePlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS).filter((p) => p.active !== false);
}

export function getPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS[planId];
}
