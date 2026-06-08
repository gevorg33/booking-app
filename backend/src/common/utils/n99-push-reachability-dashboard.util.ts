import type { PushReachabilityDashboardExport } from './n99-push-reachability.util.js';

/** n99-4.7 — adoption dashboard sections for push reachability program. */
export function validatePushReachabilityDashboardExport(
  dashboard: PushReachabilityDashboardExport,
): boolean {
  return (
    dashboard.reachability != null &&
    dashboard.explicitOptIn != null &&
    dashboard.deliverability != null &&
    dashboard.byPlatform?.ios != null &&
    dashboard.byPlatform?.android != null &&
    Array.isArray(dashboard.byLocale) &&
    dashboard.weeklyReachabilityAlert != null &&
    dashboard.weeklyExplicitOptInAlert != null
  );
}

export {
  buildPushReachabilityDashboardExport,
  buildPushReachabilityLocaleMetrics,
  buildWeeklyExplicitOptInAlert,
  buildWeeklyPushReachabilityAlert,
  computeExplicitPushOptInRate,
  computePushDeliverabilityRate,
  computePushReachabilityRate,
  meetsExplicitPushOptInTarget,
  meetsPushDeliverabilityTarget,
  meetsPushReachabilityTarget,
} from './n99-push-reachability.util.js';

export {
  N99_PUSH_REACHABILITY_DASHBOARD_SCENARIOS,
  N99_PUSH_REACHABILITY_FIXTURE_ROWS,
} from './n99-push-reachability.fixtures.js';
