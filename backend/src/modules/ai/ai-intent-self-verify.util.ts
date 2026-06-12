import type { ClassifiedIntent } from './ai-command-routing.util.js';
import {
  isClearSchedulePrompt,
  isScheduleTemplateCreationPrompt,
} from './ai-orchestration.helpers.js';
import {
  disambiguateClearScheduleVsHideCalendar,
  isFillGapsFollowUpPrompt,
  isHideAppointmentsFromCalendarPrompt,
  isScheduleOpsAction,
} from './ai-schedule-ops-hints.util.js';
import { SELF_VERIFY_PIPE_MARKER } from './ai-intent-self-verify.fixtures.js';

export { SELF_VERIFY_PIPE_MARKER };

export type SelfVerifyRuleId =
  | 'booking_vs_clear_mismatch'
  | 'schedule_vocab_mismatch';

export type SelfVerifyResult = {
  passed: boolean;
  ruleId?: SelfVerifyRuleId;
  reason?: string;
  correctedAction?: string;
};

const BOOKING_SELF_VERIFY_ACTIONS = new Set([
  'create_booking',
  'book_nearest_slot',
  'reschedule_booking',
  'book_appointment',
]);

const SCHEDULE_TEMPLATE_ACTION = 'create_schedule_template';

/** Prompt vocabulary for provider schedule mutations (not client appointments). */
export function hasScheduleMutationVocabulary(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!trimmed) return false;

  return (
    isClearSchedulePrompt(trimmed) ||
    isScheduleTemplateCreationPrompt(trimmed) ||
    isHideAppointmentsFromCalendarPrompt(trimmed) ||
    isWorkTimeSchedulePrompt(trimmed) ||
    isDirectScheduleHoursPrompt(trimmed) ||
    isFillGapsFollowUpPrompt(trimmed) ||
    /\b(?:block|fill)\b[\s\S]{0,40}\b(?:schedule|shift|slot)/i.test(trimmed) ||
    /\blist\s+schedule\s+gaps\b/i.test(trimmed) ||
    /\bapply\s+schedule\b/i.test(trimmed) ||
    /\bsetup\s+week\s+schedule\b/i.test(trimmed)
  );
}

export function isWorkTimeSchedulePrompt(prompt: string): boolean {
  return (
    /\bwork(?:ing)?\s+time\b/i.test(prompt) ||
    /\bwork(?:ing)?\s+hours?\b/i.test(prompt) ||
    /\b(?:shift|hours)\s+on\s+the\s+calendar\b/i.test(prompt)
  );
}

export function isDirectScheduleHoursPrompt(prompt: string): boolean {
  return (
    /\b(?:create|set|add|apply)\b[\s\S]{0,50}\b(?:direct\s+)?schedule\b/i.test(
      prompt,
    ) && !/\b(?:book|appointment|reserve)\b/i.test(prompt)
  );
}

/** Client appointment vocabulary — excludes applied-schedule cleanup phrasing. */
export function hasBookingAppointmentVocabulary(prompt: string): boolean {
  if (isClearSchedulePrompt(prompt)) return false;
  if (isWorkTimeSchedulePrompt(prompt) || isDirectScheduleHoursPrompt(prompt)) {
    return false;
  }
  if (isScheduleTemplateCreationPrompt(prompt)) return false;

  const lower = prompt.toLowerCase();
  return (
    /\b(?:book|reserve)\b/i.test(lower) ||
    (/\bappointment\b/i.test(lower) && !/\bhide\b/i.test(lower)) ||
    (/\bschedule\b/i.test(lower) &&
      /\b(?:for|with)\b/i.test(lower) &&
      /\b(?:client|customer|haircut|massage|trim|facial|lashes)\b/i.test(
        lower,
      ))
  );
}

function fail(
  ruleId: SelfVerifyRuleId,
  reason: string,
  correctedAction?: string,
): SelfVerifyResult {
  return {
    passed: false,
    ruleId,
    reason,
    correctedAction,
  };
}

/** Rule: booking intents must not absorb clear/hide schedule cleanup phrasing. */
export function checkBookingVsClearMismatch(
  prompt: string,
  action: string,
): SelfVerifyResult {
  const clearHideFix = disambiguateClearScheduleVsHideCalendar(prompt, action);
  if (clearHideFix && clearHideFix.action !== action) {
    return fail(
      'booking_vs_clear_mismatch',
      clearHideFix.rescueReason,
      clearHideFix.action,
    );
  }

  if (BOOKING_SELF_VERIFY_ACTIONS.has(action) && isClearSchedulePrompt(prompt)) {
    return fail(
      'booking_vs_clear_mismatch',
      'clear_schedule_vocab',
      'clear_schedule',
    );
  }

  if (
    action === 'clear_schedule' &&
    hasBookingAppointmentVocabulary(prompt) &&
    !isClearSchedulePrompt(prompt)
  ) {
    return fail(
      'booking_vs_clear_mismatch',
      'booking_vocab_on_clear_action',
      'create_booking',
    );
  }

  return { passed: true };
}

function resolveScheduleVocabCorrection(
  prompt: string,
): string | undefined {
  if (isScheduleTemplateCreationPrompt(prompt)) {
    return SCHEDULE_TEMPLATE_ACTION;
  }
  if (
    isWorkTimeSchedulePrompt(prompt) ||
    isDirectScheduleHoursPrompt(prompt) ||
    isClearSchedulePrompt(prompt)
  ) {
    if (isClearSchedulePrompt(prompt)) return 'clear_schedule';
    return 'create_direct_schedule';
  }
  if (hasBookingAppointmentVocabulary(prompt)) {
    return 'create_booking';
  }
  return undefined;
}

/** Rule: schedule mutation vocabulary must map to schedule intents (not booking). */
export function checkScheduleVocabMismatch(
  prompt: string,
  action: string,
): SelfVerifyResult {
  if (
    BOOKING_SELF_VERIFY_ACTIONS.has(action) &&
    hasScheduleMutationVocabulary(prompt) &&
    !hasBookingAppointmentVocabulary(prompt)
  ) {
    const corrected = resolveScheduleVocabCorrection(prompt);
    if (corrected && corrected !== action) {
      return fail(
        'schedule_vocab_mismatch',
        'schedule_vocab_on_booking_action',
        corrected,
      );
    }
    return fail(
      'schedule_vocab_mismatch',
      'ambiguous_schedule_intent',
    );
  }

  if (
    (isScheduleOpsAction(action) || action === SCHEDULE_TEMPLATE_ACTION) &&
    hasBookingAppointmentVocabulary(prompt) &&
    !hasScheduleMutationVocabulary(prompt)
  ) {
    return fail(
      'schedule_vocab_mismatch',
      'booking_vocab_on_schedule_action',
      'create_booking',
    );
  }

  return { passed: true };
}

/** Deterministic post-rescue rule checks (pipe-1.6.1). */
export function verifyIntentMatchesPrompt(
  prompt: string,
  intent: Pick<ClassifiedIntent, 'action' | 'params' | 'confidence'>,
): SelfVerifyResult {
  const action = intent.action;
  if (!action || action === 'unknown') {
    return { passed: true };
  }

  const bookingVsClear = checkBookingVsClearMismatch(prompt, action);
  if (!bookingVsClear.passed) return bookingVsClear;

  const scheduleVocab = checkScheduleVocabMismatch(prompt, action);
  if (!scheduleVocab.passed) return scheduleVocab;

  return { passed: true };
}

export function applySelfVerifyCorrection(
  prompt: string,
  working: ClassifiedIntent,
): { intent: ClassifiedIntent; result: SelfVerifyResult } {
  const result = verifyIntentMatchesPrompt(prompt, working);
  if (result.passed || !result.correctedAction) {
    return { intent: working, result };
  }

  return {
    intent: {
      ...working,
      action: result.correctedAction,
      reasoning:
        working.reasoning ??
        `Self-verify corrected to ${result.correctedAction} (${result.reason}).`,
    },
    result,
  };
}
