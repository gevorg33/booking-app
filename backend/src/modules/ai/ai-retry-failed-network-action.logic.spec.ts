import { handleRetryFailedNetworkActionLogic } from './ai-retry-failed-network-action.logic.js';
import {
  RETRY_FAILED_NETWORK_ACTION_HANDLER_FIXTURES,
  RETRY_FAILED_NETWORK_ACTION_PROMPTS,
} from './ai-retry-failed-network-action.fixtures.js';
import { NETWORK_RETRY_ACTION_LABEL } from './ai-retry-failed-network-action.util.js';

describe('ai-retry-failed-network-action.logic', () => {
  it.each(RETRY_FAILED_NETWORK_ACTION_HANDLER_FIXTURES)(
    'returns retry guidance for $id',
    async ({ prompt, aspect, params }) => {
      const result = await handleRetryFailedNetworkActionLogic(
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('retry_failed_network_action');
      expect(result.details?.aspect).toBe(aspect);
      expect(result.details?.retryActionLabel).toBe(NETWORK_RETRY_ACTION_LABEL);
      expect(result.details?.consumerNetworkRetry).toBe(true);
    },
  );

  it('requests replay when online with queued changes', async () => {
    const result = await handleRetryFailedNetworkActionLogic(
      'biz-1',
      { online: true, offlineQueueCount: 2 },
      'Sync failed',
    );
    expect(result.details?.replayRequested).toBe(true);
    expect(result.details?.canRetry).toBe(true);
    expect(result.summary).toContain('Try again');
  });

  it('guides load failed retry when online with no queue', async () => {
    const result = await handleRetryFailedNetworkActionLogic(
      'biz-1',
      { online: true, offlineQueueCount: 0 },
      'Could not load — retry',
    );
    expect(result.details?.canRetry).toBe(true);
    expect(result.details?.replayRequested).toBe(false);
    expect(result.summary).toContain('Could not load');
  });

  it('fails clarify when prompt does not match', async () => {
    const result = await handleRetryFailedNetworkActionLogic(
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails clarify for unrelated prompt', async () => {
    const result = await handleRetryFailedNetworkActionLogic(
      'biz-1',
      {},
      RETRY_FAILED_NETWORK_ACTION_PROMPTS[0].prompt.replace(
        "Booking didn't save",
        'Show my appointments',
      ),
    );
    expect(result.success).toBe(false);
  });
});
