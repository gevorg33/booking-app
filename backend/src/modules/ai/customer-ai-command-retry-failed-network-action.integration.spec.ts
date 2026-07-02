import { rescueRetryFailedNetworkActionIntent } from './ai-retry-failed-network-action.util.js';
import { RETRY_FAILED_NETWORK_ACTION_PROMPTS } from './ai-retry-failed-network-action.fixtures.js';

describe('customer-ai-command retry_failed_network_action integration (ai-cmd-customer-4.18.6)', () => {
  it.each(RETRY_FAILED_NETWORK_ACTION_PROMPTS)(
    'rescues retry_failed_network_action for $id',
    (row) => {
      expect(
        rescueRetryFailedNetworkActionIntent(row.prompt, 'unknown')?.action,
      ).toBe('retry_failed_network_action');
    },
  );
});
