import { handleExplainOfflineModeLogic } from './ai-explain-offline-mode.logic.js';
import {
  EXPLAIN_OFFLINE_MODE_PROMPTS,
  EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS,
} from './ai-explain-offline-mode.fixtures.js';
import { rescueExplainOfflineModeIntent } from './ai-explain-offline-mode.util.js';

describe('ai-explain-offline-mode.logic (ai-cmd-customer-4.13.3)', () => {
  it.each(
    EXPLAIN_OFFLINE_MODE_PROMPTS.slice(0, 4).map((row) => [row.id, row.prompt]),
  )('handles explain_offline_mode for $0', async (_id, prompt) => {
    const result = await handleExplainOfflineModeLogic(
      'biz-1',
      { online: false, offlineQueueCount: 2 },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_offline_mode');
    expect(result.details?.queuedCount).toBe(2);
    expect(result.details?.consumerOffline).toBe(true);
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleExplainOfflineModeLogic(
      'biz-1',
      {},
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('uses params prompt fallback', async () => {
    const result = await handleExplainOfflineModeLogic('biz-1', {
      _prompt: 'Why does it say offline?',
      online: true,
    });
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('why_offline');
  });

  it.each(EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS)(
    'pipeline rescues explain_offline_mode for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainOfflineModeIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_offline_mode');
    },
  );
});
