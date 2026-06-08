/** n99-2.6 — trim required-field clarifies when safe defaults exist. */

import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type {
  ResolvedCommand,
  ValidationIssue,
} from './command-completion.types.js';
import { resolveTomorrowDateKey } from './ai-payments.util.js';
import { readScreenContext } from './ai-n99-screen-grounding.util.js';
import {
  N99_OVER_ASK_DATE_DEFAULT_ACTIONS,
  N99_OVER_ASK_NON_TODAY_PROMPT,
  N99_OVER_ASK_RELATIVE_DATE_PROMPT,
} from './ai-n99-over-ask.fixtures.js';

export {
  N99_NO_CLARIFY_OVER_ASK_SCENARIOS,
  N99_OVER_ASK_DATE_DEFAULT_ACTIONS,
  N99_OVER_ASK_NON_TODAY_PROMPT,
  N99_OVER_ASK_RELATIVE_DATE_PROMPT,
  N99_OVER_ASK_VALIDATOR_SCENARIOS,
} from './ai-n99-over-ask.fixtures.js';

export interface OverAskContext {
  prompt?: string;
  sessionContext?: Record<string, unknown>;
  screenContext?: Record<string, unknown>;
  surface?: ClassificationSurface;
  timeZone?: string;
}

export function resolveTodayDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function resolveYesterdayDateKey(now: Date = new Date()): string {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().slice(0, 10);
}

export function resolveRelativeDateFromPrompt(
  prompt: string,
  now: Date = new Date(),
): string | null {
  const lower = prompt.toLowerCase();
  if (
    /\b(today|aysor|aysov|ays@|segodnya|this evening|tonight)\b/i.test(lower) ||
    /\u0561\u0575\u057d/i.test(prompt)
  ) {
    return resolveTodayDateKey(now);
  }
  if (/\b(tomorrow|vagh@|vaxa|vagh|urbat|zavtra)\b/i.test(lower)) {
    return resolveTomorrowDateKey(now);
  }
  if (/\b(yesterday|vchera)\b/i.test(lower)) {
    return resolveYesterdayDateKey(now);
  }
  if (/\bthis week\b/i.test(lower)) {
    return resolveTodayDateKey(now);
  }
  return null;
}

function setParamIfEmpty(
  params: Record<string, unknown>,
  key: string,
  value: unknown,
): boolean {
  if (value == null || value === '') return false;
  if (params[key] != null && params[key] !== '') return false;
  params[key] = value;
  return true;
}

export function hasOverAskSafeDate(cmd: ResolvedCommand): boolean {
  return !!(
    cmd.params.date ||
    cmd.params.dateFrom ||
    cmd.entities.dateRange ||
    cmd.params._overAskDateDefault
  );
}

/** Apply safe defaults before command-completion validation runs. */
export function applyOverAskSafeDefaults(
  cmd: ResolvedCommand,
  context: OverAskContext = {},
): ResolvedCommand {
  const params = { ...cmd.params };
  const screen = readScreenContext(context.screenContext);
  const session = context.sessionContext ?? {};
  const prompt = context.prompt ?? cmd.prompt ?? '';

  if (
    setParamIfEmpty(params, 'date', screen.date ?? screen.selectionDate ?? session.date)
  ) {
    params._overAskDateDefault = 'context_date';
  }

  if (
    !params.date &&
    !params.dateFrom &&
    N99_OVER_ASK_DATE_DEFAULT_ACTIONS.has(cmd.action)
  ) {
    const relativeDate = resolveRelativeDateFromPrompt(prompt);
    if (relativeDate && setParamIfEmpty(params, 'date', relativeDate)) {
      params._overAskDateDefault = 'prompt_relative_date';
    }
  }

  if (
    cmd.action === 'summarize_day' &&
    !params.date &&
    !N99_OVER_ASK_NON_TODAY_PROMPT.test(prompt)
  ) {
    params.date = resolveTodayDateKey();
    params._overAskDateDefault = 'summarize_day_today';
  }

  if (
    cmd.action === 'fill_unused_slots' &&
    !params.date &&
    !params.dateFrom &&
    /\bthis week\b/i.test(prompt)
  ) {
    params.dateFrom = resolveTodayDateKey();
    params._overAskDateDefault = 'fill_gaps_this_week';
  }

  if (
    (cmd.action === 'cancel_bookings' ||
      cmd.action === 'reschedule_booking' ||
      cmd.action === 'mark_paid') &&
    setParamIfEmpty(params, 'bookingId', screen.bookingId ?? session.bookingId)
  ) {
    params._overAskBookingDefault = true;
  }

  if (
    setParamIfEmpty(
      params,
      'customerName',
      screen.customerName ?? session.lastCustomerName,
    )
  ) {
    params._overAskCustomerDefault = true;
  }

  if (
    setParamIfEmpty(
      params,
      'employeeName',
      screen.employeeName ?? session.lastEmployeeName,
    )
  ) {
    params._overAskEmployeeDefault = true;
  }

  return { ...cmd, params };
}

/** Post-validation trim for issues inferable from prompt/context safe defaults. */
export function trimOverAskClarifyIssues(input: {
  action: string;
  params: Record<string, unknown>;
  issues: ValidationIssue[];
  prompt?: string;
  screenContext?: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
}): ValidationIssue[] {
  const prompt = input.prompt ?? '';
  const screen = readScreenContext(input.screenContext);
  const session = input.sessionContext ?? {};

  return input.issues.filter((issue) => {
    if (issue.field === 'date' || issue.field === 'dateFrom') {
      if (input.params.date || input.params.dateFrom) return false;
      if (screen.bookingId || session.bookingId || input.params.bookingId) {
        return false;
      }
      if (screen.date || screen.selectionDate || session.date) return false;
      if (resolveRelativeDateFromPrompt(prompt)) return false;
      if (
        input.action === 'summarize_day' &&
        !N99_OVER_ASK_NON_TODAY_PROMPT.test(prompt)
      ) {
        return false;
      }
      if (
        input.action === 'fill_unused_slots' &&
        /\bthis week\b/i.test(prompt)
      ) {
        return false;
      }
    }

    if (issue.field === 'customerName') {
      if (input.params.customerName) return false;
      if (screen.customerName || session.lastCustomerName) return false;
    }

    if (issue.field === 'bookingId') {
      if (input.params.bookingId) return false;
      if (screen.bookingId || session.bookingId) return false;
    }

    if (issue.field === 'employeeName') {
      if (input.params.employeeName) return false;
      if (screen.employeeName || session.lastEmployeeName) return false;
    }

    return true;
  });
}
