import { isClearSchedulePrompt } from './ai-orchestration.helpers.js';

/** Schedule actions that receive NL enrichment and session follow-up (ai-cmd-h3.2). */
export const SCHEDULE_OPS_ACTIONS = [
  'clear_schedule',
  'hide_appointments_from_calendar',
  'unhide_appointments_from_calendar',
  'apply_schedule',
  'fill_unused_slots',
  'list_schedule_gaps',
  'create_direct_schedule',
  'block_schedule',
  'setup_week_schedule',
] as const;

export type ScheduleOpsAction = (typeof SCHEDULE_OPS_ACTIONS)[number];

const SCHEDULE_FOLLOW_UP_SOURCE_ACTIONS = new Set([
  'list_schedule_gaps',
  'apply_schedule',
  'summarize_utilization',
  'create_direct_schedule',
]);

const SCHEDULE_SESSION_SLICE_KEYS = [
  'employeeName',
  'employeeNames',
  'date',
  'dateFrom',
  'dateTo',
  'timeFrom',
  'timeTo',
  'templateName',
  'allProviders',
  'lastAction',
] as const;

export function isScheduleOpsAction(
  action: string,
): action is ScheduleOpsAction {
  return (SCHEDULE_OPS_ACTIONS as readonly string[]).includes(action);
}

/** Hide/remove appointments from the calendar view — not applied-schedule cleanup. */
export function isHideAppointmentsFromCalendarPrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  if (/\bcancel\b/.test(lower)) return false;

  if (
    /\b(hide|remove from calendar|delete from calendar|off the calendar)\b/i.test(
      prompt ?? '',
    )
  ) {
    if (
      isClearSchedulePrompt(prompt) &&
      !/\b(appointment|booking)s?\b/.test(lower)
    ) {
      return false;
    }
    return true;
  }

  if (
    /\b(remove|clear|delete)\b/.test(lower) &&
    /\b(appointment|booking)s?\b/.test(lower) &&
    /\b(calendar|schedule view)\b/.test(lower)
  ) {
    return !isClearSchedulePrompt(prompt);
  }

  return false;
}

export function disambiguateClearScheduleVsHideCalendar(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (
    action === 'clear_schedule' &&
    isHideAppointmentsFromCalendarPrompt(prompt)
  ) {
    return {
      action: 'hide_appointments_from_calendar',
      rescueReason: 'clear_to_hide_calendar',
    };
  }

  if (
    action === 'hide_appointments_from_calendar' &&
    isClearSchedulePrompt(prompt) &&
    !isHideAppointmentsFromCalendarPrompt(prompt)
  ) {
    return {
      action: 'clear_schedule',
      rescueReason: 'hide_to_clear_schedule',
    };
  }

  if (
    action !== 'clear_schedule' &&
    isClearSchedulePrompt(prompt) &&
    !isHideAppointmentsFromCalendarPrompt(prompt)
  ) {
    return {
      action: 'clear_schedule',
      rescueReason: 'read_to_clear_schedule',
    };
  }

  return null;
}

/** Follow-up after gaps/utilization listing — "fill those gaps", "fill them with his services". */
export function isFillGapsFollowUpPrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  if (!/\b(fill|optimize)\b/.test(lower)) return false;
  return (
    /\b(those|these|them|the)\s+(gap|slot|opening)s?\b/i.test(lower) ||
    /\b(gap|slot|opening|utilization)s?\b/i.test(lower) ||
    /\bfill\s+them\b/i.test(lower)
  );
}

export function inheritScheduleFollowUpContext(
  params: Record<string, any>,
  session?: Record<string, any>,
  action?: string,
  prompt = '',
): void {
  if (!session) return;

  const followUpFill =
    action === 'fill_unused_slots' &&
    (isFillGapsFollowUpPrompt(prompt) ||
      SCHEDULE_FOLLOW_UP_SOURCE_ACTIONS.has(session.lastAction));

  for (const key of SCHEDULE_SESSION_SLICE_KEYS) {
    if (key === 'lastAction') continue;
    const value = params[key];
    if (
      (value == null ||
        value === '' ||
        (Array.isArray(value) && !value.length)) &&
      session[key] != null &&
      session[key] !== ''
    ) {
      params[key] = session[key];
    }
  }

  if (
    followUpFill &&
    !params.employeeName &&
    !(params.employeeNames?.length ?? 0) &&
    session.employeeName
  ) {
    params.employeeName = session.employeeName;
  }
}

export function pickScheduleOpsSessionSlice(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const slice: Record<string, unknown> = {};
  for (const key of SCHEDULE_SESSION_SLICE_KEYS) {
    const value = params[key];
    if (
      value != null &&
      value !== '' &&
      !(Array.isArray(value) && !value.length)
    ) {
      slice[key] = value;
    }
  }
  return slice;
}

export function mergeScheduleHintsIntoSessionContext(
  sessionContext: Record<string, any>,
  params: Record<string, unknown>,
  action: string,
): Record<string, any> {
  if (!isScheduleOpsAction(action)) return sessionContext;
  return {
    ...sessionContext,
    ...pickScheduleOpsSessionSlice(params),
    lastAction: action,
  };
}

export function applyScheduleOpsPromptHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
  context: {
    employees: Array<{ id: string; name: string }>;
    timeZone?: string;
    session?: Record<string, any>;
  },
): void {
  if (!isScheduleOpsAction(action)) return;

  inheritScheduleFollowUpContext(params, context.session, action, prompt);
  // dateRange / employee matching moved to pipeline structural stage (pipe-1.7.1)

}

export function enrichCompoundSubStepScheduleHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
  timeZone = 'UTC',
  employees: Array<{ id: string; name: string }> = [],
): boolean {
  if (!isScheduleOpsAction(action)) return false;
  applyScheduleOpsPromptHints(action, params, prompt, {
    employees,
    timeZone,
  });
  return true;
}
