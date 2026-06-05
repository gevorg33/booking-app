import {
  ALL_DASHBOARD_OPS_SCENARIOS,
  CATALOG_COUNTED_SCENARIOS,
  CUSTOMER_BOOKING_CONTEXT_SCENARIOS,
  PROVIDER_REVENUE_SCENARIOS,
  UPCOMING_APPOINTMENTS_SCENARIOS,
} from './ai-dashboard-ops.fixtures.js';

describe('ai-dashboard-ops.fixtures', () => {
  it('exports unique scenario ids', () => {
    const ids = ALL_DASHBOARD_OPS_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all four dashboard ops domains', () => {
    expect(CATALOG_COUNTED_SCENARIOS.length).toBeGreaterThanOrEqual(4);
    expect(CUSTOMER_BOOKING_CONTEXT_SCENARIOS.length).toBeGreaterThanOrEqual(4);
    expect(PROVIDER_REVENUE_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    expect(UPCOMING_APPOINTMENTS_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    expect(ALL_DASHBOARD_OPS_SCENARIOS.length).toBeGreaterThanOrEqual(20);
  });
});
