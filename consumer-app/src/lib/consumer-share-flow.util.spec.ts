import { describe, expect, it, vi } from 'vitest';
import {
  formatShareRewardToast,
  shareSalonLinkWithReward,
} from './consumer-share-flow.util.js';

vi.mock('./consumer-growth-loops.util.js', () => ({
  shareSalonLink: vi.fn(async () => 'shared'),
  shareBookingLink: vi.fn(async () => 'shared'),
}));

vi.mock('./app-analytics.js', () => ({
  track: vi.fn(),
}));

import { shareSalonLink } from './consumer-growth-loops.util.js';
import { track } from './app-analytics.js';

describe('consumer-share-flow.util', () => {
  it('claims reward after successful salon share', async () => {
    const claimReward = vi.fn(async () => ({
      awarded: true,
      channel: 'salon' as const,
      rewardSummary: '5 loyalty points',
    }));

    const result = await shareSalonLinkWithReward({
      slug: 'demo-salon',
      businessName: 'Demo Salon',
      claimReward,
    });

    expect(shareSalonLink).toHaveBeenCalled();
    expect(claimReward).toHaveBeenCalled();
    expect(result.reward?.awarded).toBe(true);
    expect(track).toHaveBeenCalledWith('share_reward_claimed', {
      channel: 'salon',
      slug: 'demo-salon',
    });
  });

  it('formats reward toast copy', () => {
    expect(
      formatShareRewardToast(
        { awarded: true, channel: 'salon', rewardSummary: '5 loyalty points' },
        'You earned {reward}!',
      ),
    ).toBe('You earned 5 loyalty points!');
  });
});
