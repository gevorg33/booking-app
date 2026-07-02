import {
  SHARE_REWARD_COOLDOWN_SCENARIOS,
  buildShareRewardSummary,
  isShareRewardEligible,
  mergeShareRewardsSettings,
  nextShareRewardEligibleAt,
} from './share-rewards.util.js';

describe('share-rewards.util', () => {
  it('merges share reward settings from business metadata', () => {
    const settings = mergeShareRewardsSettings({
      shareRewards: {
        salon: { rewardType: 'gift_card', giftCardAmount: 15 },
        booking: { enabled: false },
      },
    });
    expect(settings.salon.rewardType).toBe('gift_card');
    expect(settings.salon.giftCardAmount).toBe(15);
    expect(settings.booking.enabled).toBe(false);
  });

  it.each(SHARE_REWARD_COOLDOWN_SCENARIOS)(
    '$id evaluates cooldown eligibility',
    ({ lastAt, cooldownHours, now, expectedEligible }) => {
      expect(isShareRewardEligible(lastAt, cooldownHours, new Date(now))).toBe(
        expectedEligible,
      );
    },
  );

  it('computes next eligible timestamp after cooldown', () => {
    const next = nextShareRewardEligibleAt('2026-06-09T10:00:00.000Z', 24);
    expect(next).toBe('2026-06-10T10:00:00.000Z');
  });

  it('builds reward summary labels', () => {
    expect(
      buildShareRewardSummary(
        {
          enabled: true,
          rewardType: 'loyalty_points',
          loyaltyPoints: 10,
          giftCardAmount: 5,
        },
        { currency: 'USD' },
      ),
    ).toBe('10 loyalty points');
    expect(
      buildShareRewardSummary(
        {
          enabled: true,
          rewardType: 'gift_card',
          loyaltyPoints: 10,
          giftCardAmount: 20,
        },
        { currency: 'USD' },
      ),
    ).toBe('20 USD gift card');
  });
});
