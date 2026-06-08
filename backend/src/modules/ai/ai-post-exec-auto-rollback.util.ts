import type { AgentTaskUndoResult } from '../../engine/agent/agent-task-undo.service.js';
import type { PostExecAssertionResult } from './ai-post-exec-assertion.util.js';

export interface AutoRollbackAttemptResult {
  attempted: boolean;
  succeeded: boolean;
  undoResult?: AgentTaskUndoResult;
  error?: string;
  reason?: string;
}

export function shouldAttemptAutoRollback(
  undoTaskId: string | undefined,
): boolean {
  return Boolean(undoTaskId);
}

export function buildAutoRollbackDetailsPatch(
  attempt: AutoRollbackAttemptResult,
): Record<string, unknown> {
  return {
    autoRollbackAttempted: attempt.attempted,
    autoRollbackSucceeded: attempt.succeeded,
    autoRollbackError: attempt.error,
    autoRollbackReason: attempt.reason,
    autoRollbackReversedSteps: attempt.undoResult?.reversedSteps,
    rollbackOffered:
      attempt.succeeded !== true &&
      Boolean(attempt.error || attempt.reason || attempt.attempted),
  };
}

export function mergeAutoRollbackIntoResult(
  base: Record<string, unknown>,
  attempt: AutoRollbackAttemptResult,
): Record<string, unknown> {
  return {
    ...base,
    ...buildAutoRollbackDetailsPatch(attempt),
    undone: attempt.succeeded ? true : base.undone,
  };
}

export function extractAutoRollbackDetails(
  result: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!result) return {};
  return {
    autoRollbackAttempted: result.autoRollbackAttempted,
    autoRollbackSucceeded: result.autoRollbackSucceeded,
    autoRollbackError: result.autoRollbackError,
    autoRollbackReason: result.autoRollbackReason,
    autoRollbackReversedSteps: result.autoRollbackReversedSteps,
  };
}

/** acc-5.5 — user-facing summary after assertion failure + optional auto rollback. */
export function buildPostExecFailureSummaryWithAutoRollback(task: {
  error?: string;
  result?: Record<string, unknown>;
}): string {
  const message =
    (task.result?.assertionMessage as string | undefined) ??
    task.error ??
    'Post-execution verification failed';

  if (task.result?.autoRollbackSucceeded === true) {
    return `${message} We automatically reverted the change.`;
  }

  if (task.result?.autoRollbackAttempted === true) {
    const error =
      typeof task.result.autoRollbackError === 'string'
        ? task.result.autoRollbackError
        : undefined;
    return error
      ? `${message} Automatic revert failed: ${error}. You can try undo manually.`
      : `${message} Automatic revert failed. You can try undo manually.`;
  }

  const rollbackOffered = task.result?.rollbackOffered === true;
  return rollbackOffered
    ? `${message} You can undo this change.`
    : message;
}

export function buildAutoRollbackUserSummary(
  assertion: Pick<PostExecAssertionResult, 'message'>,
  attempt: AutoRollbackAttemptResult,
): string {
  return buildPostExecFailureSummaryWithAutoRollback({
    error: assertion.message,
    result: {
      assertionMessage: assertion.message,
      rollbackOffered: true,
      ...buildAutoRollbackDetailsPatch(attempt),
    },
  });
}
