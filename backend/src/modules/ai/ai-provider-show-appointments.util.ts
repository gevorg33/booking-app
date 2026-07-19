import {
  extractStatusFiltersFromPrompt,
  extractTimeSlotFromPrompt,
} from './ai-structural-extractors.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import { PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS } from './ai-provider-show-appointments.fixtures.js';
import { isListTeamUnpaidTodayPrompt } from './ai-provider-exp-2.util.js';

export function isShowAppointmentsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  // Don't steal sibling provider READ intents that share vocabulary.
  if (isListTeamUnpaidTodayPrompt(prompt)) return false;
  if (/how\s+many|count\s+of/.test(lower)) return false;
  if (/across\s+the\s+team|all\s+providers/.test(lower)) return false;
  if (/revenue|earnings?/.test(lower)) return false;
  if (/\bpackage\b/.test(lower)) return false;
  if (
    /utilization|utilisation|how\s+(?:busy|full)|open\s+hours|booked\s+percent/.test(
      lower,
    )
  ) {
    return false;
  }
  if (
    /how'?s\s+(?:my\s+day|today|tomorrow)\s+(?:looking|going)|rundown|breakdown\s+of|no-?shows?\s+yet|cancellations?\s+today/.test(
      lower,
    )
  ) {
    return false;
  }

  if (/\b(?:show|list|display|view)\b.{0,40}\b(?:appointment|booking)/i.test(lower)) {
    return true;
  }
  if (/\bwho\s+(?:do\s+i\s+see|am\s+i\s+seeing)\b/i.test(lower)) {
    return true;
  }
  if (/\bwho'?s\s+on\s+my\s+(?:schedule|calendar)\b/i.test(lower)) {
    return true;
  }
  if (/\bwhat\s+appointments?\s+do\s+i\s+have\b/i.test(lower)) {
    return true;
  }
  if (/\blist\s+my\s+(?:morning|afternoon|evening)\b/i.test(lower)) {
    return true;
  }
  if (/\bshow\s+me\s+(?:today|tomorrow)\s+(?:morning|afternoon|evening)\b/i.test(lower)) {
    return true;
  }

  if (/ցույց\s+տուր.{0,20}ժամադրություն/iu.test(prompt)) return true;
  if (/ում\s+եմ\s+տեսնում/iu.test(prompt)) return true;

  if (/покажи.{0,20}(?:запис|брон)/iu.test(prompt)) return true;
  if (/кого\s+я\s+(?:принимаю|вижу)/iu.test(prompt)) return true;

  return PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

export function extractShowAppointmentsParams(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...params };

  const statuses = extractStatusFiltersFromPrompt(prompt);
  if (statuses.length && !next.statusFilters) {
    next.statusFilters = statuses;
  }

  const timeSlot = extractTimeSlotFromPrompt(prompt);
  if (timeSlot && !next.timeSlot) {
    next.timeSlot = timeSlot;
  }

  const timeOfDay = parseTimeOfDayWindow(prompt, next);
  if (timeOfDay && !next.timeOfDay) {
    next.timeOfDay = timeOfDay;
  }

  return next;
}

export function rescueShowAppointmentsIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown> = {},
): {
  action: 'show_appointments';
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (!isShowAppointmentsPrompt(prompt)) return null;
  return {
    action: 'show_appointments',
    rescueReason: 'show_appointments_pattern',
    params: extractShowAppointmentsParams(prompt, params),
  };
}
