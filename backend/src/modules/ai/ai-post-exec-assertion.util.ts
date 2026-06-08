import type { CommandResult } from './command-completion.types.js';
import { POST_EXEC_ASSERTABLE_ACTIONS } from './ai-post-exec-assertion.fixtures.js';

export { POST_EXEC_ASSERTABLE_ACTIONS } from './ai-post-exec-assertion.fixtures.js';

export interface PostExecAssertionResult {
  ok: boolean;
  message?: string;
  field?: string;
}

type WorkflowStepResult = {
  stepId?: string;
  status?: string;
  result?: Record<string, unknown>;
};

function readNestedResult(
  executionResult: Record<string, unknown>,
): Record<string, unknown> {
  const nested = executionResult.result;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return {};
}

/** Flatten workflow step payloads and nested handler results (acc-5.4). */
export function extractExecutionPayload(
  executionResult: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...readNestedResult(executionResult),
    ...executionResult,
  };

  const steps = executionResult.steps as WorkflowStepResult[] | undefined;
  if (Array.isArray(steps)) {
    for (const step of steps) {
      if (step.status === 'completed' && step.result && typeof step.result === 'object') {
        Object.assign(payload, step.result);
      }
    }
  }

  return payload;
}

function normalizeTimeToken(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const match = value.trim().match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return `${match[1]!.padStart(2, '0')}:${match[2]!}`;
}

function readResultTime(payload: Record<string, unknown>): string | null {
  return (
    normalizeTimeToken(payload.timeSlot) ??
    normalizeTimeToken(payload.startTime) ??
    normalizeTimeToken(
      typeof payload.startTime === 'string'
        ? payload.startTime.split('T')[1]?.replace(/:\d{2}\.\d{3}Z$/, '')
        : undefined,
    )
  );
}

function assertCreateBooking(
  params: Record<string, unknown>,
  payload: Record<string, unknown>,
): PostExecAssertionResult {
  const bookingId = payload.bookingId;
  if (typeof bookingId !== 'string' || !bookingId) {
    return {
      ok: false,
      field: 'bookingId',
      message: 'Booking was not created at the requested time/provider.',
    };
  }

  if (params.employeeId && payload.employeeId && payload.employeeId !== params.employeeId) {
    return {
      ok: false,
      field: 'employeeId',
      message: 'Booking was created for a different provider than requested.',
    };
  }

  if (params.serviceId && payload.serviceId && payload.serviceId !== params.serviceId) {
    return {
      ok: false,
      field: 'serviceId',
      message: 'Booking was created for a different service than requested.',
    };
  }

  const requestedTime = readResultTime(params);
  const actualTime = readResultTime(payload);
  if (requestedTime && actualTime && requestedTime !== actualTime) {
    return {
      ok: false,
      field: 'timeSlot',
      message: `Booking was created at ${actualTime}, not the requested ${requestedTime}.`,
    };
  }

  return { ok: true };
}

function assertRescheduleBooking(
  params: Record<string, unknown>,
  payload: Record<string, unknown>,
): PostExecAssertionResult {
  if (!payload.bookingId) {
    return {
      ok: false,
      field: 'bookingId',
      message: 'Booking was not rescheduled.',
    };
  }

  if (params.bookingId && payload.bookingId !== params.bookingId) {
    return {
      ok: false,
      field: 'bookingId',
      message: 'A different booking was updated than requested.',
    };
  }

  const requestedTime = readResultTime(params);
  const actualTime = readResultTime(payload);
  if (requestedTime && actualTime && requestedTime !== actualTime) {
    return {
      ok: false,
      field: 'timeSlot',
      message: `Booking was moved to ${actualTime}, not the requested ${requestedTime}.`,
    };
  }

  return { ok: true };
}

function assertCancelBookings(payload: Record<string, unknown>): PostExecAssertionResult {
  const cancelled = payload.cancelledCount;
  if (typeof cancelled === 'number') {
    if (cancelled > 0) return { ok: true };
    return { ok: false, message: 'No bookings were cancelled.' };
  }
  if (payload.cancelledId || payload.cancelledBookingId) {
    return { ok: true };
  }
  return { ok: false, message: 'No bookings were cancelled.' };
}

function assertMarkPaid(payload: Record<string, unknown>): PostExecAssertionResult {
  if (!payload.bookingId) {
    return { ok: false, message: 'Could not verify payment update on a booking.' };
  }
  const status = String(payload.paymentStatus ?? payload.status ?? '').toLowerCase();
  if (status.includes('paid')) return { ok: true };
  return { ok: false, message: 'Booking was not marked paid.' };
}

function assertFillWaitlist(payload: Record<string, unknown>): PostExecAssertionResult {
  if (typeof payload.bookingId === 'string' && payload.bookingId) {
    return { ok: true };
  }
  return {
    ok: false,
    message: 'Waitlist slot was not filled with a new booking.',
  };
}

export function shouldRunPostExecAssertion(action: string): boolean {
  return POST_EXEC_ASSERTABLE_ACTIONS.has(action);
}

/** acc-5.4 — assert executed world state matches the interpreted intent. */
export function assertPostExecutionIntent(
  action: string,
  params: Record<string, unknown>,
  executionResult: Record<string, unknown>,
): PostExecAssertionResult {
  if (!shouldRunPostExecAssertion(action)) {
    return { ok: true };
  }

  const payload = extractExecutionPayload(executionResult);

  switch (action) {
    case 'create_booking':
      return assertCreateBooking(params, payload);
    case 'reschedule_booking':
      return assertRescheduleBooking(params, payload);
    case 'cancel_booking':
    case 'cancel_bookings':
      return assertCancelBookings(payload);
    case 'mark_paid':
      return assertMarkPaid(payload);
    case 'fill_slot_from_waitlist':
      return assertFillWaitlist(payload);
    case 'update_bookings':
      if (payload.updatedCount != null && Number(payload.updatedCount) === 0) {
        return { ok: false, message: 'No bookings were updated.' };
      }
      return { ok: true };
    default:
      return { ok: true };
  }
}

/** acc-5.5 — surface rollback offer when post-exec assertion fails. */
export function buildPostExecRollbackDetails(
  undoTaskId: string | undefined,
  assertion: PostExecAssertionResult,
): Record<string, unknown> {
  return {
    postExecAssertionFailed: true,
    assertionMessage: assertion.message,
    assertionField: assertion.field,
    rollbackOffered: Boolean(undoTaskId),
    undoTaskId,
    summary:
      assertion.message ??
      'The result did not match your request. You can undo this change.',
  };
}

export function applyPostExecAssertionToCommandResult(
  action: string,
  params: Record<string, unknown>,
  result: CommandResult,
): CommandResult {
  if (!result.success || !shouldRunPostExecAssertion(action)) {
    return result;
  }

  const assertion = assertPostExecutionIntent(
    action,
    params,
    (result.details ?? {}) as Record<string, unknown>,
  );
  if (assertion.ok) {
    return result;
  }

  const undoTaskId =
    typeof result.details?.taskId === 'string' ? result.details.taskId : undefined;

  return {
    success: false,
    action: result.action,
    summary:
      assertion.message ??
      'The result did not match your request. Review the change or undo it.',
    details: {
      ...result.details,
      ...buildPostExecRollbackDetails(undoTaskId, assertion),
    },
  };
}

export { buildPostExecFailureSummaryWithAutoRollback as buildPostExecFailureSummary } from './ai-post-exec-auto-rollback.util.js';
