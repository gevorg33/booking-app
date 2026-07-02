import { handleExplainShareRewardLogic } from './ai-explain-share-reward.logic.js';
import {
  EXPLAIN_SHARE_REWARD_PROMPTS,
  EXPLAIN_SHARE_REWARD_RESCUE_SCENARIOS,
} from './ai-explain-share-reward.fixtures.js';
import { rescueExplainShareRewardIntent } from './ai-explain-share-reward.util.js';

describe('ai-explain-share-reward integration (ai-cmd-customer-4.12.4)', () => {
  const deps = {
    publicBookingService: {
      getCustomerShareRewards: jest.fn(async () => ({
        enabled: true,
        salonShareEnabled: true,
        bookingShareEnabled: true,
        salonRewardSummary: '50 points',
        bookingRewardSummary: '25 points',
        cooldownHours: 24,
        salonNextEligibleAt: null,
        bookingNextEligibleAt: null,
      })),
    },
  };

  it.each(
    EXPLAIN_SHARE_REWARD_PROMPTS.slice(0, 3).map((row) => [row.id, row.prompt]),
  )('handles explain_share_reward for $0', async (_id, prompt) => {
    const result = await handleExplainShareRewardLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', slug: 'salon' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_share_reward');
  });

  it.each(EXPLAIN_SHARE_REWARD_RESCUE_SCENARIOS)(
    'pipeline rescues explain_share_reward for $id',
    ({ prompt, misclassifiedAction }) => {
      const rescued = rescueExplainShareRewardIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe('explain_share_reward');
    },
  );
});
