export const ADOPTION_DASHBOARD_PERIOD_OPTIONS = [7, 30, 90] as const;

export type AdoptionDashboardPeriodDays = (typeof ADOPTION_DASHBOARD_PERIOD_OPTIONS)[number];

export interface AdoptionHeadlineView {
  pushOptInRate: number | null;
  crashFreeSessionRate: number | null;
  crashFreeSessionSloMet: boolean | null;
  startupTtiWithinBudgetRate: number | null;
  startupTtiSloMet: boolean | null;
  referralKFactor: number | null;
}

export interface AdoptionWeeklyAlertView {
  triggered: boolean;
  currentWeekRate: number;
  previousWeekRate: number;
  deltaPoints: number;
  thresholdPoints: number;
}

export function formatDashboardMetric(
  value: number | null,
  digits = 1,
): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

export function hasWeeklyActivationAlert(alert: AdoptionWeeklyAlertView): boolean {
  return alert.triggered;
}

export function hasWeeklyStartupTtiRegressionAlert(alert: AdoptionWeeklyAlertView): boolean {
  return alert.triggered;
}

export function buildAdoptionDashboardQuery(days: AdoptionDashboardPeriodDays): string {
  return `/analytics/adoption?days=${days}`;
}

export function readHeadlineMetrics(headlines: AdoptionHeadlineView): Array<{
  id: 'pushOptIn' | 'crashFree' | 'startupTti' | 'referralK';
  value: number | null;
  sloMet?: boolean | null;
}> {
  return [
    { id: 'pushOptIn', value: headlines.pushOptInRate },
    {
      id: 'crashFree',
      value: headlines.crashFreeSessionRate,
      sloMet: headlines.crashFreeSessionSloMet,
    },
    {
      id: 'startupTti',
      value: headlines.startupTtiWithinBudgetRate,
      sloMet: headlines.startupTtiSloMet,
    },
    { id: 'referralK', value: headlines.referralKFactor },
  ];
}

export function isCrashFreeBelowSlo(rate: number | null, sloMet?: boolean | null): boolean {
  if (sloMet != null) return sloMet === false;
  if (rate == null) return false;
  return rate < 0.995;
}

export function isStartupTtiBelowSlo(rate: number | null, sloMet?: boolean | null): boolean {
  if (sloMet != null) return sloMet === false;
  if (rate == null) return false;
  return rate < 0.95;
}

export interface AdoptionExitGateCriterionView {
  id: string;
  label: string;
  value: number;
  target: number;
  met: boolean;
  unit: string;
}

export interface AdoptionExitGateView {
  met: boolean;
  failures: string[];
  criteria: AdoptionExitGateCriterionView[];
}

export function formatExitGateCriterionValue(
  value: number,
  unit: AdoptionExitGateCriterionView['unit'],
): string {
  if (unit === 'ratio') return value.toFixed(2);
  if (unit === 'points') return `${(value * 100).toFixed(1)} pts`;
  return `${(value * 100).toFixed(1)}%`;
}

export function formatExitGateCriterionTarget(
  target: number,
  unit: AdoptionExitGateCriterionView['unit'],
): string {
  if (unit === 'ratio') return target.toFixed(2);
  if (unit === 'points') return `${(target * 100).toFixed(1)} pts`;
  return `${(target * 100).toFixed(1)}%`;
}

export function isAdoptionExitGateMet(exitGate?: AdoptionExitGateView | null): boolean {
  return exitGate?.met === true;
}

export function readExitGateOpenFailures(exitGate?: AdoptionExitGateView | null): string[] {
  if (!exitGate || exitGate.met) return [];
  return exitGate.failures;
}
