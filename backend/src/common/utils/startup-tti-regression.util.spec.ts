import {
  STARTUP_TTI_WEEKLY_REGRESSION_DELTA,
  buildWeeklyStartupTtiRegressionAlert,
  computeStartupTtiWithinBudgetRate,
} from './startup-tti-regression.util.js';

describe('startup-tti-regression.util (adopt-5.7)', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('computes within-budget rate from app_interactive events', () => {
    expect(
      computeStartupTtiWithinBudgetRate([
        {
          event: 'app_interactive',
          createdAt: now,
          props: { crashFree: true },
        },
        {
          event: 'app_interactive',
          createdAt: now,
          props: { crashFree: false },
        },
      ]),
    ).toBe(0.5);
  });

  it('fires weekly regression alarm when TTI SLO drops more than threshold', () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, index) => ({
        event: 'app_interactive',
        createdAt: new Date('2026-06-12T10:00:00.000Z'),
        props: { crashFree: index < 9 },
      })),
      ...Array.from({ length: 10 }, (_, index) => ({
        event: 'app_interactive',
        createdAt: new Date('2026-06-05T10:00:00.000Z'),
        props: { crashFree: true },
      })),
    ];
    const alert = buildWeeklyStartupTtiRegressionAlert(rows, now);
    expect(alert.thresholdPoints).toBe(STARTUP_TTI_WEEKLY_REGRESSION_DELTA);
    expect(alert.triggered).toBe(true);
    expect(alert.deltaPoints).toBeGreaterThan(
      STARTUP_TTI_WEEKLY_REGRESSION_DELTA,
    );
  });
});
