import type { GuideFlowListContext, GuideFlowRoleScope } from './guide-flow.types.js';

export interface GuideFlowVisibilityScenario {
  id: string;
  topicId: string;
  ctx: GuideFlowListContext;
  expectedVisible: boolean;
}

export interface GuideFlowVerticalScenario {
  id: string;
  topicId: string;
  ctx: GuideFlowListContext;
  expectedVisible: boolean;
}

export const GUIDE_FLOW_ROLE_SCENARIOS: readonly GuideFlowVisibilityScenario[] = [
  {
    id: 'team-manager-owner',
    topicId: 'provider-team-manager',
    ctx: { surface: 'provider', roleProfile: 'owner' },
    expectedVisible: true,
  },
  {
    id: 'team-manager-manager',
    topicId: 'provider-team-manager',
    ctx: { surface: 'provider', roleProfile: 'manager' },
    expectedVisible: true,
  },
  {
    id: 'team-manager-provider-hidden',
    topicId: 'provider-team-manager',
    ctx: { surface: 'provider', roleProfile: 'provider' },
    expectedVisible: false,
  },
  {
    id: 'today-calendar-provider',
    topicId: 'provider-today-calendar',
    ctx: { surface: 'provider', roleProfile: 'provider' },
    expectedVisible: true,
  },
] as const;

export const GUIDE_FLOW_VERTICAL_SCENARIOS: readonly GuideFlowVerticalScenario[] = [
  {
    id: 'clinic-consumer-visible',
    topicId: 'consumer-clinic',
    ctx: { surface: 'customer', vertical: 'clinic' },
    expectedVisible: true,
  },
  {
    id: 'clinic-consumer-hidden-salon',
    topicId: 'consumer-clinic',
    ctx: { surface: 'customer', vertical: 'salon' },
    expectedVisible: false,
  },
  {
    id: 'tour-checkout-visible',
    topicId: 'public-tour-checkout',
    ctx: { surface: 'public', vertical: 'tour' },
    expectedVisible: true,
  },
  {
    id: 'retail-pos-visible',
    topicId: 'dashboard-retail-pos',
    ctx: { surface: 'dashboard', retailPosEnabled: true },
    expectedVisible: true,
  },
  {
    id: 'retail-pos-hidden',
    topicId: 'dashboard-retail-pos',
    ctx: { surface: 'dashboard', vertical: 'salon' },
    expectedVisible: false,
  },
  {
    id: 'gift-cards-module-hidden',
    topicId: 'provider-gift-cards',
    ctx: { surface: 'provider', roleProfile: 'provider' },
    expectedVisible: false,
  },
  {
    id: 'gift-cards-module-visible',
    topicId: 'provider-gift-cards',
    ctx: {
      surface: 'provider',
      roleProfile: 'provider',
      planTierId: 'business',
      enabledModules: ['giftCards'],
    },
    expectedVisible: true,
  },
  {
    id: 'dashboard-ai-ops-staff-hidden',
    topicId: 'dashboard.ai.ops',
    ctx: { surface: 'dashboard', roleProfile: 'receptionist' },
    expectedVisible: false,
  },
  {
    id: 'dashboard-ai-ops-owner-visible',
    topicId: 'dashboard.ai.ops',
    ctx: { surface: 'dashboard', roleProfile: 'owner', planTierId: 'starter' },
    expectedVisible: true,
  },
] as const;

export const GUIDE_FLOW_ROUTE_PRIMARY_SCENARIOS = [
  { id: 'dash-schedule', route: '/dashboard/schedule', topicId: 'dashboard.core.schedule' },
  { id: 'provider-today', route: '/tabs/today', topicId: 'provider-appointments' },
  { id: 'provider-calendar', route: '/tabs/calendar', topicId: 'provider-calendar' },
  { id: 'provider-schedule', route: '/tabs/schedule', topicId: 'provider-schedule-blocks' },
  { id: 'provider-profile', route: '/tabs/profile', topicId: 'provider-profile-settings' },
  { id: 'consumer-book', route: '/s/book', topicId: 'consumer-booking-flow' },
  { id: 'consumer-tabs', route: '/s', topicId: 'consumer-tabs' },
  { id: 'consumer-account', route: '/s/account', topicId: 'consumer-account' },
  { id: 'consumer-packages', route: '/s/packages', topicId: 'consumer-packages-gift-cards' },
  { id: 'consumer-activation-welcome', route: '/consumer/welcome', topicId: 'consumer-activation-welcome' },
  { id: 'consumer-activation-salon', route: '/consumer/salon', topicId: 'consumer-activation-salon' },
  { id: 'consumer-activation-service', route: '/consumer/service', topicId: 'consumer-activation-service' },
  { id: 'consumer-activation-slot', route: '/consumer/slot', topicId: 'consumer-activation-slot' },
  { id: 'consumer-activation-confirm', route: '/consumer/confirm', topicId: 'consumer-activation-confirm' },
  { id: 'public-funnel', route: '/book', topicId: 'public-booking-funnel' },
  { id: 'public-professionals', route: '/book/professionals', topicId: 'public-booking-professionals' },
  { id: 'public-services', route: '/book/services', topicId: 'public-booking-services' },
  { id: 'public-checkout', route: '/book/checkout', topicId: 'public-checkout' },
] as const;

export const GUIDE_FLOW_RANK_SCENARIOS = [
  {
    id: 'schedule-route-flow',
    prompt: 'How do I set up weekly schedule templates?',
    route: '/dashboard/schedule',
    intent: 'guide_user_flow' as const,
    expectedTopicId: 'dashboard.core.schedule',
    minScore: 0.55,
  },
  {
    id: 'mark-paid-keywords',
    prompt: 'How do I mark paid on an appointment?',
    route: '/tabs/today',
    intent: 'guide_user_flow' as const,
    expectedTopicId: 'provider-appointments',
    minScore: 0.55,
  },
] as const;

export function roleProfile(role: GuideFlowRoleScope): GuideFlowListContext['roleProfile'] {
  return role;
}
