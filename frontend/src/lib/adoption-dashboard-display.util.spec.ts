import { describe, expect, it } from 'vitest';
import {
  ADOPTION_DASHBOARD_PERIOD_OPTIONS,
  buildAdoptionDashboardQuery,
  formatDashboardMetric,
  formatExitGateCriterionTarget,
  formatExitGateCriterionValue,
  hasWeeklyActivationAlert,
  hasWeeklyStartupTtiRegressionAlert,
  isAdoptionExitGateMet,
  isCrashFreeBelowSlo,
  isStartupTtiBelowSlo,
  readExitGateOpenFailures,
  readHeadlineMetrics,
} from './adoption-dashboard-display.util';

describe('adoption-dashboard-display.util (adopt-1.7)', () => {
  it('exposes standard dashboard period options', () => {
    expect(ADOPTION_DASHBOARD_PERIOD_OPTIONS).toEqual([7, 30, 90]);
  });

  it('builds adoption analytics query strings', () => {
    expect(buildAdoptionDashboardQuery(30)).toBe('/analytics/adoption?days=30');
  });

  it('formats nullable dashboard metrics', () => {
    expect(formatDashboardMetric(null)).toBe('—');
    expect(formatDashboardMetric(0.5)).toBe('50.0%');
  });

  it('reads headline metric cards from dashboard payload', () => {
    const cards = readHeadlineMetrics({
      pushOptInRate: 0.5,
      crashFreeSessionRate: 0.67,
      crashFreeSessionSloMet: false,
      startupTtiWithinBudgetRate: 0.94,
      startupTtiSloMet: false,
      referralKFactor: 0.25,
    });
    expect(cards).toHaveLength(4);
    expect(cards[0]?.value).toBe(0.5);
    expect(cards[1]?.sloMet).toBe(false);
  });

  it('detects startup TTI below the 95% SLO', () => {
    expect(isStartupTtiBelowSlo(0.94, false)).toBe(true);
    expect(isStartupTtiBelowSlo(0.96, true)).toBe(false);
  });

  it('detects crash-free sessions below the 99.5% SLO', () => {
    expect(isCrashFreeBelowSlo(0.994, false)).toBe(true);
    expect(isCrashFreeBelowSlo(0.996, true)).toBe(false);
    expect(isCrashFreeBelowSlo(null, null)).toBe(false);
  });

  it('detects weekly activation alert state', () => {
    expect(
      hasWeeklyActivationAlert({
        triggered: true,
        currentWeekRate: 0,
        previousWeekRate: 1,
        deltaPoints: 1,
        thresholdPoints: 0.02,
      }),
    ).toBe(true);
  });

  it('detects weekly startup TTI regression alert state', () => {
    expect(
      hasWeeklyStartupTtiRegressionAlert({
        triggered: true,
        currentWeekRate: 0.8,
        previousWeekRate: 0.95,
        deltaPoints: 0.15,
        thresholdPoints: 0.03,
      }),
    ).toBe(true);
  });

  it('formats adoption exit gate criteria for dashboard display (adopt-6.8)', () => {
    expect(formatExitGateCriterionValue(0.62, 'percent')).toBe('62.0%');
    expect(formatExitGateCriterionTarget(0.6, 'percent')).toBe('60.0%');
    expect(formatExitGateCriterionValue(0.25, 'ratio')).toBe('0.25');
    expect(formatExitGateCriterionValue(0.02, 'points')).toBe('2.0 pts');
    expect(
      isAdoptionExitGateMet({
        met: true,
        failures: [],
        criteria: [],
      }),
    ).toBe(true);
    expect(
      readExitGateOpenFailures({
        met: false,
        failures: ['Push opt-in (after priming)'],
        criteria: [],
      }),
    ).toEqual(['Push opt-in (after priming)']);
  });
});
