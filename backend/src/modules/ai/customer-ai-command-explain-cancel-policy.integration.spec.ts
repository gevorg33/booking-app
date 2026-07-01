import { EXPLAIN_CANCEL_POLICY_PROMPTS } from './ai-explain-cancel-policy.fixtures.js';
import { rescueExplainCancelPolicyIntent } from './ai-explain-cancel-policy.util.js';

describe('customer-ai-command explain_cancel_policy integration (ai-cmd-customer-4.4.4)', () => {
  it.each(EXPLAIN_CANCEL_POLICY_PROMPTS)(
    'rescues explain_cancel_policy for $id',
    ({ prompt }) => {
      expect(rescueExplainCancelPolicyIntent(prompt, 'unknown')?.action).toBe(
        'explain_cancel_policy',
      );
    },
  );
});
