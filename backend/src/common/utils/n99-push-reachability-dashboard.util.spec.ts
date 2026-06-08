import type { AppEventAnalyticsRow } from './app-adoption-analytics.util.js';
import {
  buildPushReachabilityDashboardExport,
  computeExplicitPushOptInRate,
  computePushReachabilityRate,
  validatePushReachabilityDashboardExport,
} from './n99-push-reachability-dashboard.util.js';
import {
  N99_PUSH_DELIVERABILITY_TOKEN_SNAPSHOT,
  N99_PUSH_REACHABILITY_DASHBOARD_SCENARIOS,
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

describe('n99-push-reachability-dashboard.util (n99-4.7)', () => {
  const rows = toRows(N99_PUSH_REACHABILITY_FIXTURE_ROWS);

  it('tracks reachability, explicit opt-in, and deliverability separately', () => {
    const dashboard = buildPushReachabilityDashboardExport(
      rows,
      N99_PUSH_DELIVERABILITY_TOKEN_SNAPSHOT,
      new Date('2026-06-15T00:00:00.000Z'),
    );
    expect(validatePushReachabilityDashboardExport(dashboard)).toBe(true);
    expect(dashboard.reachability.reachableUsers).toBe(2);
    expect(dashboard.explicitOptIn.explicitOptInUsers).toBe(2);
    expect(dashboard.explicitOptIn.explicitOptInRate).toBeCloseTo(2 / 3, 5);
    expect(dashboard.deliverability.deliverabilityRate).toBeCloseTo(0.99, 5);
  });

  it.each(N99_PUSH_REACHABILITY_DASHBOARD_SCENARIOS)(
    'splits metrics by platform and locale ($id)',
    (scenario) => {
      const dashboard = buildPushReachabilityDashboardExport(rows);
      if ('platform' in scenario) {
        const platformMetrics = dashboard.byPlatform[scenario.platform];
        expect(platformMetrics.openedUsers).toBe(scenario.expectedOpenedUsers);
        expect(platformMetrics.reachabilityRate).toBeCloseTo(
          scenario.expectedReachabilityRate,
          5,
        );
      } else {
        const localeMetrics = dashboard.byLocale.find(
          (entry) => entry.locale === scenario.locale,
        );
        expect(localeMetrics?.explicitOptInRate).toBeCloseTo(
          scenario.expectedExplicitOptInRate,
          5,
        );
      }
    },
  );

  it('counts provisional upgrade grants toward explicit opt-in', () => {
    const metric = computeExplicitPushOptInRate(rows);
    expect(metric.eligibleUsers).toBe(3);
    expect(metric.explicitOptInUsers).toBe(2);
  });

  it('exposes weekly drop alerts for reachability and explicit opt-in', () => {
    const dashboard = buildPushReachabilityDashboardExport(
      rows,
      N99_PUSH_DELIVERABILITY_TOKEN_SNAPSHOT,
      new Date('2026-06-15T00:00:00.000Z'),
    );
    expect(typeof dashboard.weeklyReachabilityAlert.triggered).toBe('boolean');
    expect(typeof dashboard.weeklyExplicitOptInAlert.triggered).toBe('boolean');
    expect(dashboard.weeklyReachabilityAlert.thresholdPoints).toBe(0.02);
  });

  it('computes locale reachability independently from explicit opt-in', () => {
    const enRows = rows.filter((row) => row.locale === 'en');
    expect(computePushReachabilityRate(enRows).reachableUsers).toBe(2);
    expect(computeExplicitPushOptInRate(enRows).explicitOptInRate).toBe(0.5);
  });
});
