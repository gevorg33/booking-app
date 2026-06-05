import {
  SOLO_DENIED_DASHBOARD_AI_INTENTS,
  getPlanDeniedDashboardIntents,
  isDashboardAiIntentAllowedByPlan,
} from './plan-dashboard-ai-intents.util.js';

describe('plan-dashboard-ai-intents.util', () => {
  it('allows basic booking intents on solo', () => {
    expect(isDashboardAiIntentAllowedByPlan('solo', 'create_booking')).toBe(true);
    expect(isDashboardAiIntentAllowedByPlan('solo', 'list_bookings')).toBe(true);
    expect(isDashboardAiIntentAllowedByPlan('solo', 'cancel_bookings')).toBe(true);
  });

  it('allows passthrough meta actions on solo', () => {
    expect(isDashboardAiIntentAllowedByPlan('solo', 'unknown')).toBe(true);
    expect(isDashboardAiIntentAllowedByPlan('solo', 'error')).toBe(true);
    expect(isDashboardAiIntentAllowedByPlan('solo', 'security_blocked')).toBe(true);
  });

  it('denies advanced ops on solo', () => {
    expect(isDashboardAiIntentAllowedByPlan('solo', 'optimize_schedule')).toBe(false);
    expect(isDashboardAiIntentAllowedByPlan('solo', 'day_replan')).toBe(false);
    expect(SOLO_DENIED_DASHBOARD_AI_INTENTS.has('clear_schedule')).toBe(true);
  });

  it('allows all intents on paid tiers', () => {
    expect(isDashboardAiIntentAllowedByPlan('starter', 'optimize_schedule')).toBe(true);
    expect(isDashboardAiIntentAllowedByPlan('business', 'day_replan')).toBe(true);
    expect(isDashboardAiIntentAllowedByPlan('business', 'clear_schedule')).toBe(true);
  });

  it('lists solo denied intents sorted', () => {
    const denied = getPlanDeniedDashboardIntents('solo');
    expect(denied).toContain('optimize_schedule');
    expect(denied).toEqual([...denied].sort());
    expect(getPlanDeniedDashboardIntents('starter')).toEqual([]);
    expect(getPlanDeniedDashboardIntents('business')).toEqual([]);
  });
});
