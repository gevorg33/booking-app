import { rescueNotifyWhenResultsReadyIntent } from './ai-notify-when-results-ready.util.js';
import { NOTIFY_WHEN_RESULTS_READY_PROMPTS } from './ai-notify-when-results-ready.fixtures.js';
import { NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS } from './ai-notify-when-results-ready-multilingual.fixtures.js';

describe('customer-ai-command notify_when_results_ready integration (ai-cmd-customer-4.14.7)', () => {
  it.each(
    [
      ...NOTIFY_WHEN_RESULTS_READY_PROMPTS,
      ...NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues notify_when_results_ready for $0', (_id, prompt) => {
    expect(rescueNotifyWhenResultsReadyIntent(prompt, 'unknown')?.action).toBe(
      'notify_when_results_ready',
    );
  });
});
