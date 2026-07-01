import { EXPLAIN_MY_SUBSCRIPTION_PROMPTS } from './ai-explain-my-subscription.fixtures.js';
import { rescueExplainMySubscriptionIntent } from './ai-explain-my-subscription.util.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';

describe('customer-ai-command explain_my_subscription integration (ai-cmd-customer-4.5.3)', () => {
  it.each(EXPLAIN_MY_SUBSCRIPTION_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues explain_my_subscription for $id',
    (_id, row) => {
      expect(
        rescueExplainMySubscriptionIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_my_subscription');
      expect(rescueCustomerCrmIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_my_subscription',
      );
    },
  );
});
