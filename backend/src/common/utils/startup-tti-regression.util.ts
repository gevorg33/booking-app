/** adopt-5.7 — weekly cold-start TTI regression alarm (startup-time SLO drop). */

const DAY_MS = 24 * 60 * 60 * 1000;

export const STARTUP_TTI_WEEKLY_REGRESSION_DELTA = 0.03;

export interface StartupTtiEventRow {
  event: string;
  createdAt: Date;
  props: Record<string, unknown> | null;
}

export interface StartupTtiWeeklyRegressionAlert {
  triggered: boolean;
  currentWeekRate: number | null;
  previousWeekRate: number | null;
  deltaPoints: number;
  thresholdPoints: number;
}

export function computeStartupTtiWithinBudgetRate(
  rows: StartupTtiEventRow[],
): number | null {
  const interactiveRows = rows.filter((row) => row.event === 'app_interactive');
  if (interactiveRows.length === 0) return null;
  let withinBudget = 0;
  for (const row of interactiveRows) {
    if (row.props?.crashFree !== false) withinBudget += 1;
  }
  return withinBudget / interactiveRows.length;
}

function filterRowsByWindow(
  rows: StartupTtiEventRow[],
  windowStart: Date,
  windowEnd: Date,
): StartupTtiEventRow[] {
  return rows.filter(
    (row) => row.createdAt >= windowStart && row.createdAt < windowEnd,
  );
}

function computeStartupTtiRateForWindow(
  rows: StartupTtiEventRow[],
  windowStart: Date,
  windowEnd: Date,
): number | null {
  return computeStartupTtiWithinBudgetRate(
    filterRowsByWindow(rows, windowStart, windowEnd),
  );
}

export function buildWeeklyStartupTtiRegressionAlert(
  rows: StartupTtiEventRow[],
  now: Date,
): StartupTtiWeeklyRegressionAlert {
  const end = now;
  const currentStart = new Date(end.getTime() - 7 * DAY_MS);
  const previousStart = new Date(end.getTime() - 14 * DAY_MS);
  const currentWeekRate = computeStartupTtiRateForWindow(rows, currentStart, end);
  const previousWeekRate = computeStartupTtiRateForWindow(
    rows,
    previousStart,
    currentStart,
  );

  if (currentWeekRate == null || previousWeekRate == null) {
    return {
      triggered: false,
      currentWeekRate,
      previousWeekRate,
      deltaPoints: 0,
      thresholdPoints: STARTUP_TTI_WEEKLY_REGRESSION_DELTA,
    };
  }

  const deltaPoints = previousWeekRate - currentWeekRate;
  return {
    triggered: deltaPoints > STARTUP_TTI_WEEKLY_REGRESSION_DELTA,
    currentWeekRate,
    previousWeekRate,
    deltaPoints,
    thresholdPoints: STARTUP_TTI_WEEKLY_REGRESSION_DELTA,
  };
}
