import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS } from './ai-explain-app-update-required.fixtures.js';
import { EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS } from './ai-explain-app-update-required-multilingual.fixtures.js';

describe('customer-ai-command explain_app_update_required integration (ai-cmd-customer-4.13.4)', () => {
  it.each(
    [
      ...EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS,
      ...EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues explain_app_update_required for $0', (_id, prompt) => {
    expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
      'explain_app_update_required',
    );
  });
});
