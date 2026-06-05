import {
  PlanLimitExceededException,
  PLAN_LIMIT_ERROR_CODE,
} from './plan-limit.exception.js';

describe('PlanLimitExceededException', () => {
  it('exposes plan limit payload for provider seats', () => {
    const err = new PlanLimitExceededException('provider_seats', 1, 1);
    const response = err.getResponse() as Record<string, unknown>;
    expect(response.code).toBe(PLAN_LIMIT_ERROR_CODE);
    expect(response.limit).toBe('provider_seats');
    expect(response.current).toBe(1);
    expect(response.max).toBe(1);
    expect(response.upgradePlanId).toBe('starter');
    expect(String(response.message)).toContain('provider seat');
  });

  it('exposes plan limit payload for feature flags', () => {
    const err = new PlanLimitExceededException('promoCodes');
    const response = err.getResponse() as Record<string, unknown>;
    expect(response.limit).toBe('promoCodes');
    expect(response.upgradePlanId).toBe('starter');
  });

  it('falls back to generic message for unknown limit keys', () => {
    const err = new PlanLimitExceededException('unknown' as 'promoCodes');
    const response = err.getResponse() as Record<string, unknown>;
    expect(response.message).toBe('Plan limit reached. Upgrade to continue.');
  });
});
