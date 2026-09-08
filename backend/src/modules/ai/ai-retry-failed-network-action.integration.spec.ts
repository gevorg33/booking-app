import { validateCommand } from './command-completion.validator.js';
import { handleRetryFailedNetworkActionLogic } from './ai-retry-failed-network-action.logic.js';
import {
  RETRY_FAILED_NETWORK_ACTION_PROMPTS,
  RETRY_FAILED_NETWORK_ACTION_RESCUE_SCENARIOS,
} from './ai-retry-failed-network-action.fixtures.js';
import { rescueRetryFailedNetworkActionIntent } from './ai-retry-failed-network-action.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai retry failed network action integration (ai-cmd-customer-4.18.6)', () => {
  it.each(RETRY_FAILED_NETWORK_ACTION_PROMPTS)(
    'validates $id',
    ({ prompt }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'retry_failed_network_action',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);
    },
  );

  it.each(RETRY_FAILED_NETWORK_ACTION_RESCUE_SCENARIOS)(
    'pipeline rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueRetryFailedNetworkActionIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it('executes handler with offline queue context', async () => {
    const result = await handleRetryFailedNetworkActionLogic(
      'biz-1',
      { online: true, offlineQueueCount: 1 },
      "Booking didn't save — retry?",
    );
    expect(result.action).toBe('retry_failed_network_action');
    expect(result.success).toBe(true);
    expect(result.details?.queuedCount).toBe(1);
    expect(result.details?.replayRequested).toBe(true);
  });
});
