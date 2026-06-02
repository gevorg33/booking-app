import {
  annualPriceMonthlyEquivalent,
  resolvePlanTier,
  getLimitsForTier,
  PLAN_LIMITS,
  UPGRADE_PLAN_ID,
  PLAN_LIMIT_MESSAGES,
  ANNUAL_BILLING_DISCOUNT,
} from './plan-limits.js';
import { SubscriptionStatus } from './subscription-status.enum.js';

describe('plan-limits', () => {
  it('applies ~20% annual discount', () => {
    expect(ANNUAL_BILLING_DISCOUNT).toBe(0.2);
    expect(annualPriceMonthlyEquivalent(19)).toBe(182);
    expect(annualPriceMonthlyEquivalent(0)).toBe(0);
  });

  it('resolves starter when subscription is active', () => {
    expect(resolvePlanTier('starter', SubscriptionStatus.ACTIVE)).toBe('starter');
    expect(resolvePlanTier('starter', undefined)).toBe('solo');
    expect(resolvePlanTier('starter', SubscriptionStatus.INACTIVE)).toBe('solo');
    expect(resolvePlanTier('starter', SubscriptionStatus.TRIALING)).toBe('starter');
    expect(resolvePlanTier('starter', SubscriptionStatus.PAST_DUE)).toBe('solo');
  });

  it('defaults to solo without paid subscription', () => {
    expect(resolvePlanTier(null, null)).toBe('solo');
    expect(resolvePlanTier('pro', SubscriptionStatus.ACTIVE)).toBe('solo');
  });

  it('exposes tier limits and upgrade plan id', () => {
    expect(getLimitsForTier('solo')).toEqual(PLAN_LIMITS.solo);
    expect(getLimitsForTier('starter')).toEqual(PLAN_LIMITS.starter);
    expect(UPGRADE_PLAN_ID).toBe('starter');
  });

  it('documents user-facing limit messages', () => {
    expect(PLAN_LIMIT_MESSAGES.provider_seats).toContain('provider seat');
    expect(PLAN_LIMIT_MESSAGES.ai_commands).toContain('AI command');
    expect(PLAN_LIMIT_MESSAGES.promoCodes).toContain('Starter');
    expect(PLAN_LIMIT_MESSAGES.giftCards).toContain('Gift cards');
  });
});
