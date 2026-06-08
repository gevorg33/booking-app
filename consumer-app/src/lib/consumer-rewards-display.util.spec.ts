import { describe, expect, it } from 'vitest';
import {
  normalizePublicCustomerRewardsPayload,
  normalizePublicPromotionsPayload,
  shouldShowConsumerRewardsSection,
} from './consumer-rewards-display.util.js';

describe('consumer-rewards-display.util', () => {
  it('normalizes promotions payload', () => {
    expect(normalizePublicPromotionsPayload({ promotions: [] })).toEqual({
      promotions: [],
    });
    expect(normalizePublicPromotionsPayload({})).toEqual({ promotions: [] });
  });

  it('normalizes customer rewards payload', () => {
    expect(
      normalizePublicCustomerRewardsPayload({
        loyaltyEnabled: true,
        loyalty: { pointsBalance: 5, earnPercentCashback: 10 } as any,
        promotions: [{ code: 'SAVE10' } as any],
      }),
    ).toMatchObject({
      loyaltyEnabled: true,
      promotions: [{ code: 'SAVE10' }],
    });
  });

  it('shows section when promotions exist', () => {
    expect(
      shouldShowConsumerRewardsSection({
        authed: false,
        loyaltyEnabled: false,
        loyalty: null,
        promotions: [{ code: 'SAVE10' } as any],
      }),
    ).toBe(true);
  });

  it('shows loyalty section for signed-in customers with earn program', () => {
    expect(
      shouldShowConsumerRewardsSection({
        authed: true,
        loyaltyEnabled: true,
        loyalty: {
          pointsBalance: 0,
          lifetimeEarned: 0,
          pointsValue: 0,
          earnPercentCashback: 10,
          bonusDollarValue: 1,
        },
        promotions: [],
      }),
    ).toBe(true);
  });

  it('hides section when nothing to surface', () => {
    expect(
      shouldShowConsumerRewardsSection({
        authed: false,
        loyaltyEnabled: false,
        loyalty: null,
        promotions: [],
      }),
    ).toBe(false);
  });
});
