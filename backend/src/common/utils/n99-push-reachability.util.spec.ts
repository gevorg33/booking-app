import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';
import {
  buildPushReachabilityDashboardExport,
  computeExplicitPushOptInRate,
  computePushDeliverabilityRate,
  computePushReachabilityRate,
  isPushReachablePermissionState,
  meetsPushDeliverabilityTarget,
  meetsPushReachabilityTarget,
  resolveAnonPushReachability,
} from './n99-push-reachability.util.js';
import {
  N99_PUSH_DELIVERABILITY_TOKEN_SNAPSHOT,
  N99_PUSH_REACHABILITY_FIXTURE_ROWS,
} from './n99-push-reachability.fixtures.js';

function toRows(
  fixtures: typeof N99_PUSH_REACHABILITY_FIXTURE_ROWS,
): AppEventAnalyticsRow[] {
  return fixtures.map((row) => ({
    anonId: row.anonId,
    event: row.event,
    platform: row.platform,
    appSurface: row.appSurface,
    locale: row.locale,
    tenantSlug: row.tenantSlug ?? null,
    createdAt: new Date(row.createdAt),
    props: row.props ?? null,
  }));
}

describe('n99-push-reachability.util (n99-4)', () => {
  const rows = toRows(N99_PUSH_REACHABILITY_FIXTURE_ROWS);

  it('detects reachable permission states', () => {
    expect(isPushReachablePermissionState('provisional')).toBe(true);
    expect(isPushReachablePermissionState('default_on')).toBe(true);
    expect(isPushReachablePermissionState('denied')).toBe(false);
  });

  it('computes reachability from registered users', () => {
    const metric = computePushReachabilityRate(rows);
    expect(metric.openedUsers).toBe(3);
    expect(metric.reachableUsers).toBe(2);
    expect(metric.reachabilityRate).toBeCloseTo(2 / 3, 5);
  });

  it('resolves per-user reachability', () => {
    expect(resolveAnonPushReachability(rows, 'reach-ios-1')).toBe(true);
    expect(resolveAnonPushReachability(rows, 'reach-ios-2')).toBe(false);
  });

  it('computes explicit opt-in separately from reachability', () => {
    const metric = computeExplicitPushOptInRate(rows);
    expect(metric.primingShownUsers).toBe(2);
    expect(metric.eligibleUsers).toBe(3);
    expect(metric.explicitOptInUsers).toBe(2);
    expect(metric.explicitOptInRate).toBeCloseTo(2 / 3, 5);
  });

  it('computes deliverability from token aggregates', () => {
    const metric = computePushDeliverabilityRate(
      N99_PUSH_DELIVERABILITY_TOKEN_SNAPSHOT,
    );
    expect(metric.deliverabilityRate).toBeCloseTo(0.99, 5);
    expect(meetsPushDeliverabilityTarget(metric.deliverabilityRate)).toBe(true);
  });

  it('builds dashboard export with platform and locale splits', () => {
    const dashboard = buildPushReachabilityDashboardExport(
      rows,
      N99_PUSH_DELIVERABILITY_TOKEN_SNAPSHOT,
      new Date('2026-06-15T00:00:00.000Z'),
    );
    expect(dashboard.byPlatform.ios.openedUsers).toBe(2);
    expect(dashboard.byPlatform.android.openedUsers).toBe(1);
    expect(dashboard.byLocale).toHaveLength(3);
    expect(typeof dashboard.weeklyReachabilityAlert.triggered).toBe('boolean');
    expect(
      meetsPushReachabilityTarget(dashboard.reachability.reachabilityRate),
    ).toBe(false);
  });
});
