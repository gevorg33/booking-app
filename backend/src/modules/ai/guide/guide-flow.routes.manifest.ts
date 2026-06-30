import type { GuideFlowSurface } from './guide-flow.types.js';
import { matchGuideFlowRoute, mergeGuideFlowPlaybooks } from './guide-flow.merge.util.js';

/** App.tsx routes intentionally excluded from mobile guide primary coverage (ai-guide-1.9.13). */
export const CONSUMER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/s\/:slug\/login$/,
  /^\/s\/:slug\/guide$/,
];

export const PROVIDER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/tabs$/,
  /^\/tabs\/notifications$/,
  /^\/tabs\/profile\/guide$/,
];

/** Primary flow playbook topicId per route — disambiguates overlapping routes (ai-guide-1.1.2). */
export const GUIDE_FLOW_ROUTE_PRIMARY_TOPIC: Readonly<
  Partial<Record<string, string>>
> = {
  '/dashboard': 'dashboard.ai.dashboard',
  '/dashboard/schedule': 'dashboard.core.schedule',
  '/dashboard/calendar': 'dashboard.core.calendar',
  '/dashboard/bookings': 'dashboard.core.calendar',
  '/dashboard/appointments': 'dashboard.core.calendar',
  '/dashboard/customers': 'dashboard.operations.workflow',
  '/dashboard/employees': 'dashboard.core.employees',
  '/dashboard/services': 'dashboard.core.employees',
  '/dashboard/reports': 'dashboard.operations.pl',
  '/dashboard/onboarding': 'dashboard.ai.getting-started',
  '/dashboard/settings': 'dashboard.ai.getting-started',
  '/dashboard/operations': 'dashboard.operations.overview',
  '/dashboard/ai-ops': 'dashboard.ai.ops',
  '/dashboard/reviews': 'dashboard.operations.problems',
  '/dashboard/guide': 'dashboard.ai.overview',
  '/tabs/today': 'provider-appointments',
  '/tabs/calendar': 'provider-calendar',
  '/tabs/schedule': 'provider-schedule-blocks',
  '/tabs/gift-cards': 'provider-gift-cards',
  '/tabs/profile': 'provider-profile-settings',
  '/accept-invite': 'provider-staff-invite',
  '/invite': 'provider-staff-invite',
  '/tabs/lab-collection': 'provider-clinic',
  '/tabs/lab-results': 'provider-clinic',
  '/tabs/clinic-tasks': 'provider-clinic',
  '/tabs/patients': 'provider-clinic',
  '/s/home': 'consumer-tabs',
  '/s/services': 'consumer-booking-flow',
  '/s/results': 'consumer-clinic',
  '/s/lab-requests': 'consumer-clinic',
  '/s/lab-to-book': 'consumer-clinic',
  '/s': 'consumer-tabs',
  '/consumer': 'consumer-tabs',
  '/s/book': 'consumer-booking-flow',
  '/consumer/book': 'consumer-booking-flow',
  '/s/account': 'consumer-account',
  '/consumer/account': 'consumer-account',
  '/s/packages': 'consumer-packages-gift-cards',
  '/consumer/packages': 'consumer-packages-gift-cards',
  '/consumer/welcome': 'consumer-activation-welcome',
  '/consumer/salon': 'consumer-activation-salon',
  '/consumer/service': 'consumer-activation-service',
  '/consumer/slot': 'consumer-activation-slot',
  '/consumer/confirm': 'consumer-activation-confirm',
  '/book': 'public-booking-funnel',
  '/public/book': 'public-booking-funnel',
  '/book/professionals': 'public-booking-professionals',
  '/book/services': 'public-booking-services',
  '/book/checkout': 'public-checkout',
  '/public/checkout': 'public-checkout',
};

export const GUIDE_FLOW_SURFACE_NAV_ROUTES: Readonly<
  Record<GuideFlowSurface, readonly string[]>
> = {
  dashboard: [
    '/dashboard',
    '/dashboard/schedule',
    '/dashboard/calendar',
    '/dashboard/bookings',
    '/dashboard/appointments',
    '/dashboard/customers',
    '/dashboard/employees',
    '/dashboard/services',
    '/dashboard/reports',
    '/dashboard/onboarding',
    '/dashboard/operations',
    '/dashboard/ai-ops',
    '/dashboard/reviews',
  ],
  provider: [
    '/tabs/today',
    '/tabs/calendar',
    '/tabs/schedule',
    '/tabs/gift-cards',
    '/tabs/profile',
    '/tabs/lab-collection',
    '/tabs/lab-results',
    '/tabs/clinic-tasks',
    '/tabs/patients',
  ],
  customer: [
    '/s',
    '/s/home',
    '/s/services',
    '/s/book',
    '/s/account',
    '/s/packages',
    '/s/results',
    '/s/lab-requests',
  ],
  public: ['/book', '/book/professionals', '/book/services', '/book/checkout'],
};

export function resolveGuideFlowRoutePrimaryTopic(route?: string): string | undefined {
  if (!route) return undefined;
  if (GUIDE_FLOW_ROUTE_PRIMARY_TOPIC[route]) {
    return GUIDE_FLOW_ROUTE_PRIMARY_TOPIC[route];
  }
  const entries = Object.entries(GUIDE_FLOW_ROUTE_PRIMARY_TOPIC).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [prefix, topicId] of entries) {
    if (route === prefix || route.startsWith(`${prefix}/`)) return topicId;
  }
  return undefined;
}

export function assertGuideFlowRouteCoverage(): void {
  for (const [surface, routes] of Object.entries(GUIDE_FLOW_SURFACE_NAV_ROUTES)) {
    for (const route of routes) {
      const topicId = resolveGuideFlowRoutePrimaryTopic(route);
      if (!topicId) {
        throw new Error(`Missing guide-flow route primary for ${surface}:${route}`);
      }
      const playbooks = mergeGuideFlowPlaybooks({
        surface: surface as GuideFlowSurface,
        route,
        vertical: 'clinic',
        retailPosEnabled: true,
        enabledModules: ['giftCards'],
        planTierId: 'business',
        role: 'owner',
        roleProfile: 'owner',
      });
      const playbook = playbooks.find((row) => row.topicId === topicId);
      if (!playbook || !matchGuideFlowRoute(route, playbook)) {
        throw new Error(
          `Missing guide-flow playbook for ${surface}:${route} -> ${topicId}`,
        );
      }
    }
  }
}
