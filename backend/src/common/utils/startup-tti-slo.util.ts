/** adopt-5.2 — cold-start TTI within-budget SLO (≥ 95% of sessions). */

export const STARTUP_TTI_WITHIN_BUDGET_SLO = 0.95;

export function meetsStartupTtiWithinBudgetSlo(rate: number | null): boolean | null {
  if (rate == null) return null;
  return rate >= STARTUP_TTI_WITHIN_BUDGET_SLO;
}

export function isStartupTtiBelowSlo(rate: number | null): boolean {
  return meetsStartupTtiWithinBudgetSlo(rate) === false;
}
