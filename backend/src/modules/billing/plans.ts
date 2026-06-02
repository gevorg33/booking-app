import { annualPriceMonthlyEquivalent, ANNUAL_BILLING_DISCOUNT } from './plan-limits.js';

/**
 * Subscription plan registry — add new plans here as the product grows.
 * Checkout uses inline Stripe price_data so no pre-created Price IDs are required.
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  /** Total billed once per year (~20% vs 12× monthly). */
  priceAnnual: number;
  currency: string;
  features: string[];
  /** Highlight in pricing UI */
  popular?: boolean;
  /** When true, plan is shown on billing page */
  active?: boolean;
}

export { ANNUAL_BILLING_DISCOUNT };

export function withAnnualPricing(plan: Omit<SubscriptionPlan, 'priceAnnual'>): SubscriptionPlan {
  return {
    ...plan,
    priceAnnual: annualPriceMonthlyEquivalent(plan.priceMonthly),
  };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: withAnnualPricing({
    id: 'starter',
    name: 'Starter',
    description: 'Full scheduling platform for one business.',
    priceMonthly: 19,
    currency: 'usd',
    popular: true,
    active: true,
    features: [
      'Up to 5 provider seats',
      '150 AI commands per month',
      'Unlimited bookings & customers',
      'Stripe Connect for client payments',
      'Promo codes',
      'Schedule templates & direct schedules',
      'Email support',
    ],
  }),
  legacy: withAnnualPricing({
    id: 'legacy',
    name: 'Legacy',
    description: 'Retired tier kept for existing subscribers.',
    priceMonthly: 9,
    currency: 'usd',
    active: false,
    features: [],
  }),
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
