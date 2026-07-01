import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { EXPLAIN_PUSH_PERMISSION_PROMPTS } from './ai-explain-push-permission.fixtures.js';
import { EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS } from './ai-explain-push-permission-multilingual.fixtures.js';

describe('customer-ai-command explain_push_permission integration (ai-cmd-customer-4.13.2)', () => {
  it.each(
    [
      ...EXPLAIN_PUSH_PERMISSION_PROMPTS,
      ...EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt]),
  )('rescues explain_push_permission for $0', (_id, prompt) => {
    expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
      'explain_push_permission',
    );
  });
});
