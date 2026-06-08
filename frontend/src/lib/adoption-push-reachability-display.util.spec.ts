import { describe, expect, it } from 'vitest';
import {
  formatPushRate,
  hasPushMetricDropAlert,
  isExplicitPushOptInHealthy,
  isPushReachabilityHealthy,
  readPushReachabilityDashboard,
  readPushReachabilityLocaleRows,
  readPushReachabilityPlatformRows,
} from './adoption-push-reachability-display.util';

describe('adoption-push-reachability-display.util (n99-4.7)', () => {
  const dashboard = {
    pushReachability: {
      reachability: {
        reachabilityRate: 0.67,
        reachableUsers: 2,
        openedUsers: 3,
        target: 0.99,
      },
      explicitOptIn: {
        explicitOptInRate: 0.5,
        explicitOptInUsers: 1,
        primingShownUsers: 2,
        eligibleUsers: 2,
        target: 0.8,
      },
      deliverability: {
        deliverabilityRate: 0.99,
        deliverySuccesses: 99,
        deliveryAttempts: 100,
        target: 0.99,
      },
      byPlatform: {
        ios: { reachabilityRate: 0.5, explicitOptInRate: 0.5, openedUsers: 2 },
        android: { reachabilityRate: 1, explicitOptInRate: null, openedUsers: 1 },
      },
      byLocale: [
        { locale: 'en', reachabilityRate: 0.67, explicitOptInRate: 0.5, openedUsers: 3 },
        { locale: 'hy', reachabilityRate: null, explicitOptInRate: 1, openedUsers: 0 },
      ],
      weeklyReachabilityAlert: { triggered: true, deltaPoints: 0.03 },
      weeklyExplicitOptInAlert: { triggered: false, deltaPoints: 0.01 },
    },
  };

  it('reads push reachability dashboard payload', () => {
    const view = readPushReachabilityDashboard(dashboard);
    expect(view?.reachability.reachableUsers).toBe(2);
    expect(view?.explicitOptIn.explicitOptInUsers).toBe(1);
    expect(view?.deliverability.deliverySuccesses).toBe(99);
  });

  it('formats platform and locale split rows', () => {
    const view = readPushReachabilityDashboard(dashboard);
    expect(readPushReachabilityPlatformRows(view)).toHaveLength(2);
    expect(readPushReachabilityLocaleRows(view)).toHaveLength(2);
    expect(readPushReachabilityPlatformRows(view)[0]?.platform).toBe('ios');
  });

  it('formats rates and health checks separately', () => {
    expect(formatPushRate(0.512)).toBe('51.2%');
    expect(formatPushRate(null)).toBe('—');
    expect(isPushReachabilityHealthy(0.67, 0.99)).toBe(false);
    expect(isExplicitPushOptInHealthy(0.85, 0.8)).toBe(true);
  });

  it('detects weekly drop alerts', () => {
    const view = readPushReachabilityDashboard(dashboard);
    expect(hasPushMetricDropAlert(view?.weeklyReachabilityAlert)).toBe(true);
    expect(hasPushMetricDropAlert(view?.weeklyExplicitOptInAlert)).toBe(false);
  });
});
