/** n99-2.7 — wrong-execution watchdog: preview + one-tap undo + post-exec assertion + confidence tightening. */

import type { CommandResult } from './command-completion.types.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';
import {
  applyPostExecAssertionToCommandResult,
  shouldRunPostExecAssertion,
} from './ai-post-exec-assertion.util.js';
import {
  N99_AUTOFILL_PREVIEW_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_TRACE_SCENARIOS,
  type N99AutofillPreviewScenario,
  type N99AutofillWatchdogScenario,
} from './ai-n99-wrong-execution-watchdog.fixtures.js';

export {
  N99_AUTOFILL_PREVIEW_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_TRACE_SCENARIOS,
  N99_NO_CLARIFY_WATCHDOG_SCENARIOS,
} from './ai-n99-wrong-execution-watchdog.fixtures.js';
export type {
  N99AutofillPreviewScenario,
  N99AutofillWatchdogScenario,
  N99AutofillWatchdogTraceScenario,
} from './ai-n99-wrong-execution-watchdog.fixtures.js';

export interface AutofillExecutionPreviewEntry {
  field: string;
  label: string;
  value: unknown;
}

const AUTOFILL_FIELD_LABELS: Record<string, string> = {
  employeeName: 'Provider',
  serviceName: 'Service',
  customerName: 'Customer',
  date: 'Date',
  timeSlot: 'Time',
  durationMinutes: 'Duration',
  bookingFirstAvailable: 'First available',
  allProviders: 'Any provider',
  templateName: 'Template',
};

export function readAutofillFields(params: Record<string, unknown>): string[] {
  const raw = params._noClarifyAutofill;
  if (!Array.isArray(raw)) return [];
  return raw.filter((field): field is string => typeof field === 'string' && field.length > 0);
}

export function buildAutofillPreviewEntries(
  params: Record<string, unknown>,
  filledFields: string[],
): AutofillExecutionPreviewEntry[] {
  return filledFields.map((field) => ({
    field,
    label: AUTOFILL_FIELD_LABELS[field] ?? field.replace(/_/g, ' '),
    value: params[field],
  }));
}

export function shouldOfferOneTapUndoForAutofill(
  params: Record<string, unknown>,
  result: Pick<CommandResult, 'success' | 'details'>,
): boolean {
  if (!result.success) return false;
  if (readAutofillFields(params).length === 0) return false;
  return typeof result.details?.taskId === 'string' && result.details.taskId.length > 0;
}

/** acc-5 / n99-2.7 — surface what was auto-filled and enable one-tap undo. */
export function attachAutofillExecutionMetadata(
  result: CommandResult,
  params: Record<string, unknown>,
): CommandResult {
  const autofillFields = readAutofillFields(params);
  if (autofillFields.length === 0 || !result.success) return result;

  const autofillPreview = buildAutofillPreviewEntries(params, autofillFields);
  const oneTapUndo = shouldOfferOneTapUndoForAutofill(params, result);

  return {
    ...result,
    details: {
      ...result.details,
      autofillFields,
      autofillPreview,
      oneTapUndo,
      autofillExecution: true,
      postExecAssertionRequired: shouldRunPostExecAssertion(result.action),
    },
  };
}

/** acc-5.4 — post-exec assertion + autofill preview metadata for auto-filled executions. */
export function finalizeAutofillWatchdogResult(
  action: string,
  params: Record<string, unknown>,
  result: CommandResult,
): CommandResult {
  const withPreview = attachAutofillExecutionMetadata(result, params);
  return applyPostExecAssertionToCommandResult(action, params, withPreview);
}

/** n99-2.7 — tighten field confidence when auto-fill undo/👎 rises. */
export function computeAutoFillFieldThresholdAdjustment(input: {
  autoFillTraceCount: number;
  autoFillUndoCount: number;
  autoFillDownvoteCount: number;
  baseThreshold?: number;
}): { adjustedThreshold: number; undoRate: number; reason: string } {
  const base = input.baseThreshold ?? 0.72;
  const sample = input.autoFillTraceCount;
  if (sample < 10) {
    return { adjustedThreshold: base, undoRate: 0, reason: 'insufficient_auto_fill_sample' };
  }
  const bad = input.autoFillUndoCount + input.autoFillDownvoteCount;
  const undoRate = bad / sample;
  if (undoRate >= 0.05) {
    return {
      adjustedThreshold: Math.min(0.9, base + 0.05),
      undoRate,
      reason: 'auto_fill_undo_rate_high',
    };
  }
  if (undoRate >= 0.02) {
    return {
      adjustedThreshold: Math.min(0.85, base + 0.03),
      undoRate,
      reason: 'auto_fill_undo_rate_elevated',
    };
  }
  return { adjustedThreshold: base, undoRate, reason: 'stable' };
}

export function computeAutoFillWatchdogFromRows(
  rows: AiTraceAnalyticsRow[],
  baseThreshold = 0.72,
): ReturnType<typeof computeAutoFillFieldThresholdAdjustment> {
  const autoFillRows = rows.filter(
    (row) =>
      row.outcome === 'executed' &&
      Array.isArray(row.autofillFields) &&
      row.autofillFields.length > 0,
  );
  const undoCount = autoFillRows.filter(
    (row) => row.failureSignal === 'wrong_execution',
  ).length;
  const downCount = autoFillRows.filter((row) => row.feedbackRating === 'down').length;
  return computeAutoFillFieldThresholdAdjustment({
    autoFillTraceCount: autoFillRows.length,
    autoFillUndoCount: undoCount,
    autoFillDownvoteCount: downCount,
    baseThreshold,
  });
}

export function resolveAutofillWatchdogThreshold(input: {
  sessionContext?: Record<string, unknown>;
  traceRows?: AiTraceAnalyticsRow[];
  baseThreshold?: number;
}): { fieldThreshold: number; undoRate: number; reason: string } {
  const sessionThreshold = input.sessionContext?._autoFillFieldThreshold;
  if (typeof sessionThreshold === 'number') {
    return {
      fieldThreshold: sessionThreshold,
      undoRate:
        typeof input.sessionContext?._autoFillWatchdogUndoRate === 'number'
          ? input.sessionContext._autoFillWatchdogUndoRate
          : 0,
      reason:
        typeof input.sessionContext?._autoFillWatchdogReason === 'string'
          ? input.sessionContext._autoFillWatchdogReason
          : 'session_threshold',
    };
  }

  if (input.traceRows?.length) {
    const watchdog = computeAutoFillWatchdogFromRows(
      input.traceRows,
      input.baseThreshold ?? 0.72,
    );
    return {
      fieldThreshold: watchdog.adjustedThreshold,
      undoRate: watchdog.undoRate,
      reason: watchdog.reason,
    };
  }

  return {
    fieldThreshold: input.baseThreshold ?? 0.72,
    undoRate: 0,
    reason: 'default',
  };
}

export function mergeAutofillWatchdogIntoSession(
  sessionContext: Record<string, unknown>,
  traceRows: AiTraceAnalyticsRow[],
  baseThreshold = 0.72,
): void {
  const watchdog = computeAutoFillWatchdogFromRows(traceRows, baseThreshold);
  sessionContext._autoFillFieldThreshold = watchdog.adjustedThreshold;
  sessionContext._autoFillWatchdogReason = watchdog.reason;
  sessionContext._autoFillWatchdogUndoRate = watchdog.undoRate;
}

export function evaluateAutofillWatchdogScenario(
  scenario: N99AutofillWatchdogScenario,
): { passed: boolean; errors: string[] } {
  const adjustment = computeAutoFillFieldThresholdAdjustment(scenario);
  const errors: string[] = [];
  if (adjustment.adjustedThreshold !== scenario.expectAdjustedThreshold) {
    errors.push(
      `threshold: expected ${scenario.expectAdjustedThreshold}, got ${adjustment.adjustedThreshold}`,
    );
  }
  if (scenario.expectReason && adjustment.reason !== scenario.expectReason) {
    errors.push(`reason: expected ${scenario.expectReason}, got ${adjustment.reason}`);
  }
  return { passed: errors.length === 0, errors };
}

export function evaluateAutofillPreviewScenario(
  scenario: N99AutofillPreviewScenario,
): { passed: boolean; errors: string[] } {
  const result = attachAutofillExecutionMetadata(
    {
      success: true,
      action: scenario.action,
      summary: 'Done',
      details: scenario.taskId ? { taskId: scenario.taskId } : {},
    },
    scenario.params,
  );
  const errors: string[] = [];
  const previewFields = Array.isArray(result.details?.autofillPreview)
    ? (result.details.autofillPreview as AutofillExecutionPreviewEntry[]).map(
        (entry) => entry.field,
      )
    : [];

  for (const field of scenario.expectPreviewFields) {
    if (!previewFields.includes(field)) {
      errors.push(`preview missing field ${field}`);
    }
  }
  if (scenario.expectPreviewFields.length === 0 && previewFields.length > 0) {
    errors.push('expected no autofill preview');
  }
  if (Boolean(result.details?.oneTapUndo) !== scenario.expectOneTapUndo) {
    errors.push(
      `oneTapUndo: expected ${scenario.expectOneTapUndo}, got ${Boolean(result.details?.oneTapUndo)}`,
    );
  }
  if (
    Boolean(result.details?.postExecAssertionRequired) !== scenario.expectPostExecAssertion
  ) {
    errors.push(
      `postExecAssertionRequired: expected ${scenario.expectPostExecAssertion}, got ${Boolean(result.details?.postExecAssertionRequired)}`,
    );
  }
  return { passed: errors.length === 0, errors };
}
