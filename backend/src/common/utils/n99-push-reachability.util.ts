import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';
import { isTransactionalReachabilityAnalyticsProps } from './n99-push-channel.util.js';
import {
  N99_PUSH_DELIVERABILITY_TARGET,
  N99_PUSH_EXPLICIT_OPT_IN_TARGET,
  N99_PUSH_PERMISSION_STATES,
  N99_PUSH_REACHABILITY_ALERT_DELTA,
  N99_PUSH_REACHABILITY_TARGET,
  N99_PUSH_REACHABLE_STATES,
  type N99PushPermissionState,
} from './n99-push-reachability.fixtures.js';

export {
  N99_PUSH_DELIVERABILITY_TARGET,
  N99_PUSH_DELIVERABILITY_TOKEN_SNAPSHOT,
  N99_PUSH_EXPLICIT_OPT_IN_TARGET,
  N99_PUSH_PERMISSION_STATES,
  N99_PUSH_REACHABILITY_ALERT_DELTA,
  N99_PUSH_REACHABILITY_FIXTURE_ROWS,
  N99_PUSH_REACHABILITY_TARGET,
  N99_PUSH_REACHABLE_STATES,
  type N99PushPermissionState,
} from './n99-push-reachability.fixtures.js';

export interface PushReachabilityMetricExport {
  openedUsers: number;
  reachableUsers: number;
  reachabilityRate: number | null;
  target: number;
}

export interface PushReachabilityAlertExport {
  triggered: boolean;
  previousWeekRate: number;
  currentWeekRate: number;
  deltaPoints: number;
  thresholdPoints: number;
}

export interface PushExplicitOptInMetricExport {
  primingShownUsers: number;
  eligibleUsers: number;
  explicitOptInUsers: number;
  explicitOptInRate: number | null;
  target: number;
}

export interface PushDeliverabilityMetricExport {
  deliveryAttempts: number;
  deliverySuccesses: number;
  deliverabilityRate: number | null;
  target: number;
}

export interface PushReachabilityLocaleMetric {
  locale: string;
  reachabilityRate: number | null;
  explicitOptInRate: number | null;
  openedUsers: number;
}

export interface PushReachabilityDashboardExport {
  reachability: PushReachabilityMetricExport;
  explicitOptIn: PushExplicitOptInMetricExport;
  deliverability: PushDeliverabilityMetricExport;
  byPlatform: Record<
    'ios' | 'android',
    {
      reachabilityRate: number | null;
      explicitOptInRate: number | null;
      openedUsers: number;
    }
  >;
  byLocale: PushReachabilityLocaleMetric[];
  weeklyReachabilityAlert: PushReachabilityAlertExport;
  weeklyExplicitOptInAlert: PushReachabilityAlertExport;
}

export interface PushDeliverabilityTokenAggregate {
  deliverySuccessCount: number;
  deliveryFailureCount: number;
  silentFailureCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const EXPLICIT_OPT_IN_ELIGIBILITY_EVENTS = new Set([
  'push_priming_shown',
  'push_provisional_upgrade_shown',
]);

const EXPLICIT_OPT_IN_GRANT_EVENTS = new Set([
  'push_priming_accepted',
  'push_permission_upgraded',
]);

function uniqueAnonIds(rows: AppEventAnalyticsRow[]): string[] {
  return [...new Set(rows.map((row) => row.anonId))];
}

export function isPushReachablePermissionState(
  state: string | null | undefined,
): state is N99PushPermissionState {
  return Boolean(
    state && N99_PUSH_REACHABLE_STATES.has(state as N99PushPermissionState),
  );
}

function readPermissionState(
  row: AppEventAnalyticsRow,
): N99PushPermissionState | null {
  const raw = row.props?.pushPermissionState;
  if (typeof raw !== 'string') return null;
  return N99_PUSH_PERMISSION_STATES.includes(raw as N99PushPermissionState)
    ? (raw as N99PushPermissionState)
    : null;
}

function isReachableRow(row: AppEventAnalyticsRow): boolean {
  return isTransactionalReachabilityAnalyticsProps(row.props);
}

export function isExplicitOptInGrantRow(row: AppEventAnalyticsRow): boolean {
  return (
    EXPLICIT_OPT_IN_GRANT_EVENTS.has(row.event) && row.props?.pushOptIn === true
  );
}

export function resolveExplicitOptInEligibleAnonIds(
  rows: AppEventAnalyticsRow[],
): string[] {
  return uniqueAnonIds(
    rows.filter((row) => EXPLICIT_OPT_IN_ELIGIBILITY_EVENTS.has(row.event)),
  );
}

export function resolveExplicitOptInGrantAnonIds(
  rows: AppEventAnalyticsRow[],
): string[] {
  const eligible = resolveExplicitOptInEligibleAnonIds(rows);
  return eligible.filter((anonId) =>
    rows.some((row) => row.anonId === anonId && isExplicitOptInGrantRow(row)),
  );
}

export function resolveAnonPushReachability(
  rows: AppEventAnalyticsRow[],
  anonId: string,
): boolean {
  for (const row of rows) {
    if (row.anonId !== anonId) continue;
    if (isReachableRow(row)) return true;
  }
  return false;
}

export function computePushReachabilityRate(
  rows: AppEventAnalyticsRow[],
): PushReachabilityMetricExport {
  const openedUsers = uniqueAnonIds(
    rows.filter((row) => row.event === 'app_opened'),
  );
  let reachableUsers = 0;
  for (const anonId of openedUsers) {
    if (resolveAnonPushReachability(rows, anonId)) reachableUsers += 1;
  }
  return {
    openedUsers: openedUsers.length,
    reachableUsers,
    reachabilityRate:
      openedUsers.length === 0 ? null : reachableUsers / openedUsers.length,
    target: N99_PUSH_REACHABILITY_TARGET,
  };
}

export function computeExplicitPushOptInRate(
  rows: AppEventAnalyticsRow[],
): PushExplicitOptInMetricExport {
  const primingShownUsers = uniqueAnonIds(
    rows.filter((row) => row.event === 'push_priming_shown'),
  ).length;
  const eligibleUsers = resolveExplicitOptInEligibleAnonIds(rows);
  const explicitOptInUsers = resolveExplicitOptInGrantAnonIds(rows).length;
  return {
    primingShownUsers,
    eligibleUsers: eligibleUsers.length,
    explicitOptInUsers,
    explicitOptInRate:
      eligibleUsers.length === 0
        ? null
        : explicitOptInUsers / eligibleUsers.length,
    target: N99_PUSH_EXPLICIT_OPT_IN_TARGET,
  };
}

export function computePushDeliverabilityRate(
  aggregate: PushDeliverabilityTokenAggregate,
): PushDeliverabilityMetricExport {
  const deliverySuccesses = Math.max(0, aggregate.deliverySuccessCount);
  const deliveryFailures = Math.max(0, aggregate.deliveryFailureCount);
  const silentFailures = Math.max(0, aggregate.silentFailureCount ?? 0);
  const deliveryAttempts =
    deliverySuccesses + deliveryFailures + silentFailures;
  return {
    deliveryAttempts,
    deliverySuccesses,
    deliverabilityRate:
      deliveryAttempts === 0 ? null : deliverySuccesses / deliveryAttempts,
    target: N99_PUSH_DELIVERABILITY_TARGET,
  };
}

function filterRowsByPlatform(
  rows: AppEventAnalyticsRow[],
  platform: 'ios' | 'android',
): AppEventAnalyticsRow[] {
  return rows.filter((row) => row.platform === platform);
}

function computePlatformPushMetrics(
  rows: AppEventAnalyticsRow[],
  platform: 'ios' | 'android',
) {
  const filtered = filterRowsByPlatform(rows, platform);
  return {
    reachabilityRate: computePushReachabilityRate(filtered).reachabilityRate,
    explicitOptInRate: computeExplicitPushOptInRate(filtered).explicitOptInRate,
    openedUsers: uniqueAnonIds(
      filtered.filter((row) => row.event === 'app_opened'),
    ).length,
  };
}

export function buildPushReachabilityLocaleMetrics(
  rows: AppEventAnalyticsRow[],
  locales: string[] = ['en', 'hy', 'ru'],
): PushReachabilityLocaleMetric[] {
  return locales.map((locale) => {
    const filtered = rows.filter((row) => row.locale === locale);
    return {
      locale,
      reachabilityRate: computePushReachabilityRate(filtered).reachabilityRate,
      explicitOptInRate:
        computeExplicitPushOptInRate(filtered).explicitOptInRate,
      openedUsers: uniqueAnonIds(
        filtered.filter((row) => row.event === 'app_opened'),
      ).length,
    };
  });
}

function computeReachabilityRateForWindow(
  rows: AppEventAnalyticsRow[],
  start: Date,
  end: Date,
): number {
  const windowRows = rows.filter(
    (row) => row.createdAt >= start && row.createdAt < end,
  );
  const metric = computePushReachabilityRate(windowRows);
  return metric.reachabilityRate ?? 0;
}

export function buildWeeklyPushReachabilityAlert(
  rows: AppEventAnalyticsRow[],
  now = new Date(),
): PushReachabilityAlertExport {
  return buildWeeklyRateDropAlert(rows, now, computeReachabilityRateForWindow);
}

function computeExplicitOptInRateForWindow(
  rows: AppEventAnalyticsRow[],
  start: Date,
  end: Date,
): number {
  const windowRows = rows.filter(
    (row) => row.createdAt >= start && row.createdAt < end,
  );
  return computeExplicitPushOptInRate(windowRows).explicitOptInRate ?? 0;
}

export function buildWeeklyExplicitOptInAlert(
  rows: AppEventAnalyticsRow[],
  now = new Date(),
): PushReachabilityAlertExport {
  return buildWeeklyRateDropAlert(rows, now, computeExplicitOptInRateForWindow);
}

function buildWeeklyRateDropAlert(
  rows: AppEventAnalyticsRow[],
  now: Date,
  computeRate: (rows: AppEventAnalyticsRow[], start: Date, end: Date) => number,
): PushReachabilityAlertExport {
  const end = now;
  const currentStart = new Date(end.getTime() - 7 * DAY_MS);
  const previousStart = new Date(end.getTime() - 14 * DAY_MS);
  const currentWeekRate = computeRate(rows, currentStart, end);
  const previousWeekRate = computeRate(rows, previousStart, currentStart);
  const deltaPoints = previousWeekRate - currentWeekRate;
  return {
    triggered: deltaPoints > N99_PUSH_REACHABILITY_ALERT_DELTA,
    currentWeekRate,
    previousWeekRate,
    deltaPoints,
    thresholdPoints: N99_PUSH_REACHABILITY_ALERT_DELTA,
  };
}

export function buildPushReachabilityDashboardExport(
  rows: AppEventAnalyticsRow[],
  deliverabilityAggregate: PushDeliverabilityTokenAggregate = {
    deliverySuccessCount: 0,
    deliveryFailureCount: 0,
    silentFailureCount: 0,
  },
  now = new Date(),
): PushReachabilityDashboardExport {
  return {
    reachability: computePushReachabilityRate(rows),
    explicitOptIn: computeExplicitPushOptInRate(rows),
    deliverability: computePushDeliverabilityRate(deliverabilityAggregate),
    byPlatform: {
      ios: computePlatformPushMetrics(rows, 'ios'),
      android: computePlatformPushMetrics(rows, 'android'),
    },
    byLocale: buildPushReachabilityLocaleMetrics(rows),
    weeklyReachabilityAlert: buildWeeklyPushReachabilityAlert(rows, now),
    weeklyExplicitOptInAlert: buildWeeklyExplicitOptInAlert(rows, now),
  };
}

export function meetsExplicitPushOptInTarget(rate: number | null): boolean {
  return rate != null && rate >= N99_PUSH_EXPLICIT_OPT_IN_TARGET;
}

export function meetsPushReachabilityTarget(rate: number | null): boolean {
  return rate != null && rate >= N99_PUSH_REACHABILITY_TARGET;
}

export function meetsPushDeliverabilityTarget(rate: number | null): boolean {
  return rate != null && rate >= N99_PUSH_DELIVERABILITY_TARGET;
}
