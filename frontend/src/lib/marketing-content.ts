/** Public marketing tiers — aligned with backend/docs/PLANS.md */
export const MARKETING_PLAN_IDS = ['solo', 'starter', 'growth', 'business'] as const;
export type MarketingPlanId = (typeof MARKETING_PLAN_IDS)[number];

export interface MarketingPlanMeta {
  id: MarketingPlanId;
  baseMonthly: number;
  providerSeat: number | null;
  adminSeat: number | null;
  popular?: boolean;
  cta: 'free' | 'trial' | 'sales';
  featureCount: number;
}

export const MARKETING_PLANS: MarketingPlanMeta[] = [
  {
    id: 'solo',
    baseMonthly: 0,
    providerSeat: null,
    adminSeat: null,
    cta: 'free',
    featureCount: 4,
  },
  {
    id: 'starter',
    baseMonthly: 9,
    providerSeat: 9,
    adminSeat: 5,
    popular: true,
    cta: 'trial',
    featureCount: 5,
  },
  {
    id: 'growth',
    baseMonthly: 19,
    providerSeat: 14,
    adminSeat: 7,
    cta: 'trial',
    featureCount: 5,
  },
  {
    id: 'business',
    baseMonthly: 49,
    providerSeat: 18,
    adminSeat: 9,
    cta: 'sales',
    featureCount: 5,
  },
];

export const TESTIMONIAL_IDS = ['t1', 't2', 't3'] as const;

export const TRUST_SECTION_IDS = [
  'encryption',
  'privacy',
  'aiSafety',
  'payments',
  'infrastructure',
  'audit',
] as const;

export type MarketingNavId = 'home' | 'pricing' | 'trust' | 'testimonials';
