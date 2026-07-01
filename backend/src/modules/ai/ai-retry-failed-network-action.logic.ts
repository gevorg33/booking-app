import type { CommandResult } from './command-completion.types.js';
import {
  NETWORK_RETRY_ACTION_LABEL,
  buildRetryFailedNetworkActionGuidance,
  parseRetryFailedNetworkActionFromPrompt,
  resolveRetryFailedNetworkActionContext,
} from './ai-retry-failed-network-action.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

export async function handleRetryFailedNetworkActionLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseRetryFailedNetworkActionFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'retry_failed_network_action',
      'Ask to retry after a network error (e.g. "Booking didn\'t save — retry?" or "Sync failed").',
      { clarify: true },
    );
  }

  const ctx = resolveRetryFailedNetworkActionContext(params);
  const guidance = buildRetryFailedNetworkActionGuidance(ctx, parsed.aspect);

  return success('retry_failed_network_action', guidance.summary, {
    aspect: parsed.aspect,
    online: ctx.online,
    queuedCount: ctx.queuedCount,
    canRetry: guidance.canRetry,
    replayRequested: guidance.replayRequested,
    retryActionLabel: guidance.retryActionLabel,
    steps: guidance.steps,
    consumerNetworkRetry: true,
    hint: NETWORK_RETRY_ACTION_LABEL,
  });
}
