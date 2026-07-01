import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { EXPLAIN_SHARE_REWARD_PROMPTS } from './ai-explain-share-reward.fixtures.js';

describe('customer-ai-command explain_share_reward integration (ai-cmd-customer-4.12.4)', () => {
  it.each(EXPLAIN_SHARE_REWARD_PROMPTS.map((row) => [row.id, row.prompt]))(
    'rescues explain_share_reward for $0',
    (_id, prompt) => {
      expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
        'explain_share_reward',
      );
    },
  );
});
