import {
  STARTUP_TTI_WITHIN_BUDGET_SLO,
  isStartupTtiBelowSlo,
  meetsStartupTtiWithinBudgetSlo,
} from './startup-tti-slo.util.js';

describe('startup-tti-slo.util (adopt-5.2)', () => {
  it('defines the 95% within-budget TTI target', () => {
    expect(STARTUP_TTI_WITHIN_BUDGET_SLO).toBe(0.95);
  });

  it('evaluates TTI SLO compliance', () => {
    expect(meetsStartupTtiWithinBudgetSlo(null)).toBeNull();
    expect(meetsStartupTtiWithinBudgetSlo(0.96)).toBe(true);
    expect(meetsStartupTtiWithinBudgetSlo(0.95)).toBe(true);
    expect(meetsStartupTtiWithinBudgetSlo(0.94)).toBe(false);
    expect(isStartupTtiBelowSlo(0.94)).toBe(true);
  });
});
