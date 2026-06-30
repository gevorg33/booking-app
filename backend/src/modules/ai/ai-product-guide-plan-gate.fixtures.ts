import type { PlanTierId } from '../billing/plan-limits.js';

export const GUIDE_PLAN_GATE_SCENARIOS = [
  {
    id: 'ai-ops-solo-blocked',
    topicId: 'dashboard.ai.ops',
    planTierId: 'solo' as PlanTierId,
    route: '/dashboard/ai-ops',
    expectGated: true,
    requiredPlan: 'starter' as PlanTierId,
  },
  {
    id: 'ai-ops-starter-allowed',
    topicId: 'dashboard.ai.ops',
    planTierId: 'starter' as PlanTierId,
    route: '/dashboard/ai-ops',
    expectGated: false,
  },
  {
    id: 'gift-cards-solo-blocked',
    topicId: 'provider-gift-cards',
    planTierId: 'solo' as PlanTierId,
    route: '/tabs/gift-cards',
    expectGated: true,
    requiredPlan: 'business' as PlanTierId,
  },
  {
    id: 'gift-cards-business-allowed',
    topicId: 'provider-gift-cards',
    planTierId: 'business' as PlanTierId,
    route: '/tabs/gift-cards',
    enabledModules: ['giftCards'],
    expectGated: false,
  },
] as const;
