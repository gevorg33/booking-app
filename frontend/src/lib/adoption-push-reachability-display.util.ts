export interface PushReachabilityDashboardView {
  reachability: {
    reachabilityRate: number | null;
    reachableUsers: number;
    openedUsers: number;
    target: number;
  };
  explicitOptIn: {
    explicitOptInRate: number | null;
    explicitOptInUsers: number;
    primingShownUsers: number;
    eligibleUsers?: number;
    target: number;
  };
  deliverability: {
    deliverabilityRate: number | null;
    deliverySuccesses: number;
    deliveryAttempts: number;
    target: number;
  };
  byPlatform?: Record<
    'ios' | 'android',
    { reachabilityRate: number | null; explicitOptInRate: number | null; openedUsers: number }
  >;
  byLocale?: Array<{
    locale: string;
    reachabilityRate: number | null;
    explicitOptInRate: number | null;
    openedUsers: number;
  }>;
  weeklyReachabilityAlert: {
    triggered: boolean;
    deltaPoints: number;
  };
  weeklyExplicitOptInAlert?: {
    triggered: boolean;
    deltaPoints: number;
  };
}

export function readPushReachabilityDashboard(
  data: { pushReachability?: PushReachabilityDashboardView | null } | null | undefined,
): PushReachabilityDashboardView | null {
  return data?.pushReachability ?? null;
}

export function formatPushRate(rate: number | null): string {
  if (rate == null) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

export function isPushReachabilityHealthy(rate: number | null, target: number): boolean {
  return rate != null && rate >= target;
}

export function isExplicitPushOptInHealthy(rate: number | null, target: number): boolean {
  return rate != null && rate >= target;
}

export function readPushReachabilityPlatformRows(
  dashboard: PushReachabilityDashboardView | null | undefined,
): Array<{
  platform: 'ios' | 'android';
  reachabilityRate: number | null;
  explicitOptInRate: number | null;
  openedUsers: number;
}> {
  if (!dashboard?.byPlatform) return [];
  return (['ios', 'android'] as const).map((platform) => ({
    platform,
    ...dashboard.byPlatform![platform],
  }));
}

export function readPushReachabilityLocaleRows(
  dashboard: PushReachabilityDashboardView | null | undefined,
): NonNullable<PushReachabilityDashboardView['byLocale']> {
  return dashboard?.byLocale ?? [];
}

export function hasPushMetricDropAlert(
  alert: { triggered: boolean; deltaPoints: number } | null | undefined,
): boolean {
  return alert?.triggered === true;
}
