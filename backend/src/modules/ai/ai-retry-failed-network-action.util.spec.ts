import {
  CUSTOMER_RETRY_FAILED_NETWORK_ACTION_CLASSIFIER_RULES,
  NETWORK_LOAD_FAILED_HINT,
  NETWORK_RETRY_ACTION_LABEL,
  buildRetryFailedNetworkActionGuidance,
  isRetryFailedNetworkActionPrompt,
  parseRetryFailedNetworkActionFromPrompt,
  parseRetryFailedNetworkActionAspect,
  rescueRetryFailedNetworkActionIntent,
  resolveRetryFailedNetworkActionContext,
} from './ai-retry-failed-network-action.util.js';
import {
  RETRY_FAILED_NETWORK_ACTION_PROMPTS,
  RETRY_FAILED_NETWORK_ACTION_RESCUE_SCENARIOS,
} from './ai-retry-failed-network-action.fixtures.js';
import { RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_SCENARIOS } from './ai-retry-failed-network-action-multilingual.fixtures.js';
import { isExplainOfflineModePrompt } from './ai-explain-offline-mode.util.js';
import { isRetryOfflineActionPrompt } from './ai-push-notifications.util.js';

describe('ai-retry-failed-network-action.util', () => {
  it('exports classifier rules and consumer copy labels', () => {
    expect(CUSTOMER_RETRY_FAILED_NETWORK_ACTION_CLASSIFIER_RULES).toContain(
      'retry_failed_network_action',
    );
    expect(NETWORK_RETRY_ACTION_LABEL).toBe('Try again');
    expect(NETWORK_LOAD_FAILED_HINT).toContain('connection');
  });

  it.each(
    RETRY_FAILED_NETWORK_ACTION_PROMPTS.map((row) => [row.id, row] as const),
  )('detects retry failed network action prompt for $id', (_id, row) => {
    expect(isRetryFailedNetworkActionPrompt(row.prompt)).toBe(true);
    expect(parseRetryFailedNetworkActionFromPrompt(row.prompt)).toEqual({
      aspect: expect.any(String),
    });
    expect(rescueRetryFailedNetworkActionIntent(row.prompt, 'unknown')).toEqual(
      {
        action: 'retry_failed_network_action',
        rescueReason: 'retry_failed_network_action',
      },
    );
  });

  it.each(
    RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual prompt for $id', (_id, row) => {
    expect(isRetryFailedNetworkActionPrompt(row.prompt)).toBe(true);
    expect(
      rescueRetryFailedNetworkActionIntent(row.prompt, 'unknown')?.action,
    ).toBe('retry_failed_network_action');
  });

  it.each(
    RETRY_FAILED_NETWORK_ACTION_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues $id from misclassified action', (_id, row) => {
    expect(
      rescueRetryFailedNetworkActionIntent(row.prompt, row.misclassifiedAction),
    ).toEqual({
      action: row.expectedAction,
      rescueReason: 'retry_failed_network_action',
    });
  });

  it('steals from explain_offline_mode and provider retry prompts', () => {
    expect(isExplainOfflineModePrompt('Why does it say offline?')).toBe(true);
    expect(isRetryFailedNetworkActionPrompt('Why does it say offline?')).toBe(
      false,
    );
    expect(isRetryOfflineActionPrompt('Retry offline queued actions')).toBe(
      true,
    );
    expect(
      isRetryFailedNetworkActionPrompt('Retry offline queued actions'),
    ).toBe(false);
  });

  it('builds guidance for queued sync and booking retry', () => {
    const queuedOnline = buildRetryFailedNetworkActionGuidance(
      resolveRetryFailedNetworkActionContext({
        online: true,
        offlineQueueCount: 2,
      }),
      'sync_failed',
    );
    expect(queuedOnline.replayRequested).toBe(true);
    expect(queuedOnline.canRetry).toBe(true);

    const offline = buildRetryFailedNetworkActionGuidance(
      resolveRetryFailedNetworkActionContext({
        online: false,
        offlineQueueCount: 1,
      }),
      'retry_queued',
    );
    expect(offline.canRetry).toBe(false);

    expect(
      parseRetryFailedNetworkActionAspect("Booking didn't save — retry?"),
    ).toBe('booking_not_saved');
  });
});
