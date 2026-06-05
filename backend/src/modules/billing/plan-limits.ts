import {
  isSubscriptionUsable,
  SubscriptionStatus,
} from './subscription-status.enum.js';

/** ~20% off when billed annually (2 months free). */
export const ANNUAL_BILLING_DISCOUNT = 0.2;

export type PlanTierId = 'solo' | 'starter' | 'business';

/** Paid subscription_plan_id values mapped to entitlements tier (see PLANS.md). */
export const PAID_SUBSCRIPTION_PLAN_TIERS: Record<string, PlanTierId> = {
  starter: 'starter',
  growth: 'business',
  business: 'business',
};

export type PlanFeatureFlag =
  | 'stripeConnect'
  | 'promoCodes'
  | 'loyalty'
  | 'memberships'
  | 'giftCards';

export interface PlanLimits {
  tierId: PlanTierId;
  tierName: string;
  maxProviderSeats: number;
  aiCommandsPerMonth: number;
  flags: Record<PlanFeatureFlag, boolean>;
}

export const PLAN_LIMITS: Record<PlanTierId, PlanLimits> = {
  solo: {
    tierId: 'solo',
    tierName: 'Solo',
    maxProviderSeats: 1,
    aiCommandsPerMonth: 25,
    flags: {
      stripeConnect: false,
      promoCodes: false,
      loyalty: false,
      memberships: false,
      giftCards: false,
    },
  },
  starter: {
    tierId: 'starter',
    tierName: 'Starter',
    maxProviderSeats: 5,
    aiCommandsPerMonth: 150,
    flags: {
      stripeConnect: true,
      promoCodes: true,
      loyalty: false,
      memberships: false,
      giftCards: false,
    },
  },
  business: {
    tierId: 'business',
    tierName: 'Business',
    maxProviderSeats: 50,
    aiCommandsPerMonth: 5000,
    flags: {
      stripeConnect: true,
      promoCodes: true,
      loyalty: true,
      memberships: true,
      giftCards: true,
    },
  },
};

export const UPGRADE_PLAN_ID = 'starter';
export const TOP_SUBSCRIPTION_PLAN_ID = 'business';

export function annualPriceMonthlyEquivalent(priceMonthly: number): number {
  return Math.round(priceMonthly * 12 * (1 - ANNUAL_BILLING_DISCOUNT));
}

export function resolvePlanTier(
  subscriptionPlanId: string | null | undefined,
  subscriptionStatus: string | null | undefined,
): PlanTierId {
  if (!subscriptionPlanId) return 'solo';
  if (
    !isSubscriptionUsable(
      (subscriptionStatus as SubscriptionStatus) ?? SubscriptionStatus.INACTIVE,
    )
  ) {
    return 'solo';
  }
  return PAID_SUBSCRIPTION_PLAN_TIERS[subscriptionPlanId] ?? 'solo';
}

export function getLimitsForTier(tierId: PlanTierId): PlanLimits {
  return PLAN_LIMITS[tierId];
}

export {
  SOLO_DENIED_DASHBOARD_AI_INTENTS,
  getPlanDeniedDashboardIntents,
  isDashboardAiIntentAllowedByPlan,
} from './plan-dashboard-ai-intents.util.js';

export type PlanLimitKind = 'provider_seats' | 'ai_commands' | PlanFeatureFlag;

export const PLAN_LIMIT_MESSAGES: Record<PlanLimitKind, string> = {
  provider_seats:
    'Your plan provider seat limit has been reached. Upgrade to add more team members.',
  ai_commands:
    'Monthly AI command limit reached for your plan. Upgrade for more AI capacity.',
  stripeConnect: 'Stripe Connect requires a Starter subscription.',
  promoCodes: 'Promo codes require a Starter subscription.',
  loyalty:
    'Loyalty points require a Growth plan or higher (coming soon). Upgrade to Starter for promo codes and payments.',
  memberships:
    'Customer membership plans require a Growth plan or higher (coming soon).',
  giftCards: 'Gift cards require a Business plan or higher (coming soon).',
};
