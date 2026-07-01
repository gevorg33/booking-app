import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { EXPLAIN_OFFLINE_MODE_PROMPTS } from './ai-explain-offline-mode.fixtures.js';
import { EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS } from './ai-explain-offline-mode-multilingual.fixtures.js';

describe('customer-ai-command explain_offline_mode integration (ai-cmd-customer-4.13.3)', () => {
  it.each(
    [
      ...EXPLAIN_OFFLINE_MODE_PROMPTS,
      ...EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt]),
  )('rescues explain_offline_mode for $0', (_id, prompt) => {
    expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
      'explain_offline_mode',
    );
  });
});
