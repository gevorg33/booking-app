/** adopt-6.2 — share salon/booking reward defaults and test scenarios. */

export const SHARE_REWARD_METADATA_SALON_LAST_AT = 'shareRewardSalonLastAt';
export const SHARE_REWARD_METADATA_BOOKING_LAST_AT = 'shareRewardBookingLastAt';

export const DEFAULT_SHARE_REWARDS_SETTINGS = {
  enabled: true,
  cooldownHours: 24,
  salon: {
    enabled: true,
    rewardType: 'loyalty_points' as const,
    loyaltyPoints: 5,
    giftCardAmount: 5,
  },
  booking: {
    enabled: true,
    rewardType: 'loyalty_points' as const,
    loyaltyPoints: 10,
    giftCardAmount: 10,
  },
} as const;

export const SHARE_REWARD_COOLDOWN_SCENARIOS = [
  {
    id: 'eligible-no-prior',
    lastAt: null,
    cooldownHours: 24,
    now: '2026-06-09T12:00:00.000Z',
    expectedEligible: true,
  },
  {
    id: 'blocked-within-cooldown',
    lastAt: '2026-06-09T10:00:00.000Z',
    cooldownHours: 24,
    now: '2026-06-09T12:00:00.000Z',
    expectedEligible: false,
  },
  {
    id: 'eligible-after-cooldown',
    lastAt: '2026-06-08T10:00:00.000Z',
    cooldownHours: 24,
    now: '2026-06-09T12:00:00.000Z',
    expectedEligible: true,
  },
] as const;
