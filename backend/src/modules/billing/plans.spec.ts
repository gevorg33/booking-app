import {
  ANNUAL_BILLING_DISCOUNT,
  getActivePlans,
  getPlan,
  SUBSCRIPTION_PLANS,
  withAnnualPricing,
} from './plans.js';

describe('subscription plans registry', () => {
  it('re-exports annual billing discount constant', () => {
    expect(ANNUAL_BILLING_DISCOUNT).toBe(0.2);
  });

  it('includes starter with annual price', () => {
    const starter = SUBSCRIPTION_PLANS.starter;
    expect(starter.priceMonthly).toBe(19);
    expect(starter.priceAnnual).toBe(182);
    expect(starter.active).toBe(true);
  });

  it('getPlan returns undefined for unknown id', () => {
    expect(getPlan('missing')).toBeUndefined();
  });

  it('withAnnualPricing derives yearly total from monthly', () => {
    const plan = withAnnualPricing({
      id: 'test',
      name: 'Test',
      description: 'Test plan',
      priceMonthly: 10,
      currency: 'usd',
      features: [],
    });
    expect(plan.priceAnnual).toBe(96);
  });

  it('getActivePlans filters inactive tiers', () => {
    const active = getActivePlans();
    expect(active.every((p) => p.active !== false)).toBe(true);
    expect(active.some((p) => p.id === 'starter')).toBe(true);
    expect(active.some((p) => p.id === 'legacy')).toBe(false);
    expect(getPlan('legacy')?.active).toBe(false);
  });
});
