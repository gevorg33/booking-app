import type { ClassifiedIntent } from './ai-command-routing.util.js';
import { applyAvailabilityFollowUpFromSession } from './ai-structural-extractors.js';
import {
  enrichDateRangeFromPrompt,
  matchEmployeesInPrompt,
  sanitizeProviderScopeFromPrompt,
} from './ai-orchestration.helpers.js';
import { applyDefaultWorkTimeSchedulePeriods } from './ai-intent-structural-enrich-work-time.util.js';
import { isScheduleOpsAction } from './ai-schedule-ops-hints.util.js';
import { STRUCTURAL_ENRICH_PIPE_MARKER } from './ai-intent-structural-enrich.fixtures.js';

export { STRUCTURAL_ENRICH_PIPE_MARKER };

/** Actions that receive date-range enrichment in structural stage. */
export const STRUCTURAL_DATE_RANGE_ACTIONS = new Set([
  'create_direct_schedule',
  'clear_schedule',
  'apply_schedule',
  'block_schedule',
  'swap_schedules',
  'rebalance_capacity',
  'holiday_mode',
  'onboard_provider_schedule',
  'fill_unused_slots',
  'cancel_bookings',
  'hide_appointments_from_calendar',
]);

export type StructuralEnrichContext = {
  prompt: string;
  timeZone?: string;
  employees?: Array<{ id: string; name: string }>;
  sessionContext?: Record<string, unknown>;
};

export type StructuralEnrichTraceHints = {
  dateRange: boolean;
  periods: boolean;
  workTimeDefault: boolean;
  employees: boolean;
  availabilityFollowUp: boolean;
};

function enrichEmployeesFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
  action: string,
  employees: Array<{ id: string; name: string }>,
): boolean {
  let touched = false;

  if (isScheduleOpsAction(action) || STRUCTURAL_DATE_RANGE_ACTIONS.has(action)) {
    const before = JSON.stringify({
      employeeName: params.employeeName,
      employeeNames: params.employeeNames,
      allProviders: params.allProviders,
    });
    sanitizeProviderScopeFromPrompt(prompt, params, employees as any);
    const after = JSON.stringify({
      employeeName: params.employeeName,
      employeeNames: params.employeeNames,
      allProviders: params.allProviders,
    });
    if (before !== after) touched = true;
  }

  if (params.allProviders || (params.employeeNames as string[] | undefined)?.length) {
    return touched;
  }

  const mentionsMultiple =
    /\bboth\b/i.test(prompt) ||
    /\band\b/i.test(prompt) ||
    /[,/]/.test(prompt);

  if (!mentionsMultiple) return touched;

  const matched = matchEmployeesInPrompt(prompt, employees);
  if (matched.length > 1) {
    params.employeeNames = matched.map((e) => e.name);
    params.employeeName = null;
    touched = true;
  }

  return touched;
}

/** Summarize which enrichers ran (for pipeline trace). */
export function summarizeStructuralEnrichTrace(
  hints: StructuralEnrichTraceHints,
): string {
  const parts: string[] = [];
  if (hints.dateRange) parts.push('dateRange');
  if (hints.periods) parts.push('periods');
  if (hints.workTimeDefault) parts.push('workTimeDefault');
  if (hints.employees) parts.push('employees');
  if (hints.availabilityFollowUp) parts.push('availabilityFollowUp');
  return parts.length ? parts.join(', ') : 'no-op';
}

/**
 * Post self-verify structural enrichment (pipe-1.7.1).
 * Locks intent action; enriches params from prompt + session.
 */
export function applyStructuralIntentEnrichment(
  intent: ClassifiedIntent,
  context: StructuralEnrichContext,
): ClassifiedIntent {
  if (!intent?.action || intent.action === 'unknown') {
    return intent;
  }

  const params: Record<string, unknown> = { ...(intent.params ?? {}) };
  const employees = context.employees ?? [];
  const timeZone = context.timeZone ?? 'UTC';
  const hints: StructuralEnrichTraceHints = {
    dateRange: false,
    periods: false,
    workTimeDefault: false,
    employees: false,
    availabilityFollowUp: false,
  };

  hints.employees = enrichEmployeesFromPrompt(
    context.prompt,
    params,
    intent.action,
    employees,
  );

  const beforeAvailability = JSON.stringify(params);
  applyAvailabilityFollowUpFromSession(
    context.prompt,
    params,
    context.sessionContext,
    employees.map((e) => ({ name: e.name })),
  );
  if (JSON.stringify(params) !== beforeAvailability) {
    hints.availabilityFollowUp = true;
  }

  if (STRUCTURAL_DATE_RANGE_ACTIONS.has(intent.action)) {
    const beforeDate = JSON.stringify({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
    enrichDateRangeFromPrompt(params, context.prompt, timeZone);
    if (
      JSON.stringify({ dateFrom: params.dateFrom, dateTo: params.dateTo }) !==
      beforeDate
    ) {
      hints.dateRange = true;
    }
  }

  if (intent.action === 'create_direct_schedule') {
    const workTime = applyDefaultWorkTimeSchedulePeriods(params, context.prompt);
    params.periods = workTime.periods;
    hints.periods = true;
    hints.workTimeDefault = workTime.appliedDefault;
  }

  params._structuralEnrichHints = hints;

  return {
    ...intent,
    params,
  };
}

export function readStructuralEnrichHints(
  params: Record<string, unknown>,
): StructuralEnrichTraceHints | undefined {
  return params._structuralEnrichHints as StructuralEnrichTraceHints | undefined;
}
