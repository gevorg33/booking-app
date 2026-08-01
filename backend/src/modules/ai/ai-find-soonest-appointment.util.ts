import {
  MULTILINGUAL_BOOK_VERBS,
  extractMultilingualServiceNameFromPrompt,
  isMultilingualFindSoonestAppointmentPrompt,
} from './ai-check-and-book-multilingual.util.js';
import { buildSharedBookingContextFromPrompt } from './ai-compound-booking-context.util.js';
import { isEarliestSlotAllServicesPrompt } from './ai-schedule-resources.util.js';

export const CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES = `- find_soonest_appointment: READ — find the single soonest/earliest/nearest open slot for a service ("Who's free soonest for a trim", "Earliest slot this week"). Set bookingFirstAvailable=true, timeSlot=null, allProviders=true when no named specialist. Uses the same availability scan as check_availability with first-available ranking. NOT book_nearest_slot|book_appointment (mutate booking), NOT reschedule_booking|reschedule_my_booking (move/reschedule an existing appointment to nearest/soonest free time — keep reschedule with bookingFirstAvailable), NOT check_providers_for_service (general who-is-free list without soonest/earliest cue), NOT check_availability (open-times browse without soonest focus).`;

export type FindSoonestAppointmentPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'find_soonest_appointment';
  serviceName?: string;
  rescueReason: 'soonest_appointment';
};

export const FIND_SOONEST_APPOINTMENT_PROMPTS: readonly FindSoonestAppointmentPromptFixture[] =
  [
    {
      id: 'who-free-soonest-trim-customer',
      prompt: "Who's free soonest for a trim?",
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'trim',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'earliest-slot-week-customer',
      prompt: 'Earliest slot this week',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'who-free-soonest-haircut-customer',
      prompt: "Who's free soonest for a haircut?",
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'haircut',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'earliest-massage-customer',
      prompt: 'When is the earliest massage appointment?',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'massage',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'nearest-opening-facial-customer',
      prompt: 'What is the nearest opening for facial?',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'facial',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'first-available-color-customer',
      prompt: 'Who has the first available slot for color tomorrow?',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'color',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'earliest-slot-trim-week-customer',
      prompt: 'Earliest slot this week for trim',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'trim',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'soonest-swedish-customer',
      prompt: 'Soonest appointment for Swedish massage',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'Swedish massage',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'first-slot-waxing-customer',
      prompt: 'First available slot for waxing',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'waxing',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'nearest-blowdry-customer',
      prompt: 'Nearest opening for blowdry',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'blowdry',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'who-free-first-manicure-customer',
      prompt: "Who's free first for manicure?",
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'manicure',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'soonest-slot-trim-customer',
      prompt: 'When is the soonest slot for a trim?',
      surface: 'customer',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'trim',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'who-free-soonest-trim-public',
      prompt: "Who's free soonest for a trim?",
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'trim',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'earliest-slot-week-public',
      prompt: 'Earliest slot this week',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'who-free-soonest-haircut-public',
      prompt: "Who's free soonest for a haircut?",
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'haircut',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'earliest-massage-public',
      prompt: 'When is the earliest massage appointment?',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'massage',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'nearest-opening-facial-public',
      prompt: 'What is the nearest opening for facial?',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'facial',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'first-available-color-public',
      prompt: 'Who has the first available slot for color tomorrow?',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'color',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'earliest-slot-trim-week-public',
      prompt: 'Earliest slot this week for trim',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'trim',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'soonest-swedish-public',
      prompt: 'Soonest appointment for Swedish massage',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'Swedish massage',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'first-slot-waxing-public',
      prompt: 'First available slot for waxing',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'waxing',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'nearest-blowdry-public',
      prompt: 'Nearest opening for blowdry',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'blowdry',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'who-free-first-manicure-public',
      prompt: "Who's free first for manicure?",
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'manicure',
      rescueReason: 'soonest_appointment',
    },
    {
      id: 'soonest-slot-trim-public',
      prompt: 'When is the soonest slot for a trim?',
      surface: 'public',
      expectedAction: 'find_soonest_appointment',
      serviceName: 'trim',
      rescueReason: 'soonest_appointment',
    },
  ];

const SOONEST_CUE =
  /\b(soonest|earliest|nearest|first\s+available|next\s+available|asap|as\s+soon\s+as\s+possible)\b/i;

/** Reject sentence-filler captures like "I can get an" from soonestNamed. */
const SOONEST_SERVICE_NAME_NOISE =
  /\b(i|you|we|me|my|your|can|get|have|the|a|an|for|to|is|was|be|possible|available)\b/i;

function hasMutateBookIntent(prompt: string): boolean {
  if (MULTILINGUAL_BOOK_VERBS.test(prompt)) return true;
  return (
    /\b(book|reserve|schedule|grab)\b/i.test(prompt) ||
    /\bput\s+me\s+in\b/i.test(prompt) ||
    /\b(?:get|slot)\s+me\s+in\b/i.test(prompt)
  );
}

/**
 * e2e-bug.248 — move/reschedule of an existing visit is MUTATE reschedule
 * (often with bookingFirstAvailable), never READ find_soonest_appointment.
 */
export function isRescheduleExistingAppointmentPrompt(prompt: string): boolean {
  if (/\bmove\s+\d+\s+.+(?:slot|appointment)/i.test(prompt)) return false;

  // e2e-bug.252 — owner "alert/notify me when customers reschedule" is a
  // notification preference, not MUTATE reschedule of an existing visit.
  // "appointment" in "their appointment" must not trigger this detector.
  if (
    /\b(notify\s+me|alert\s+me|email\s+me|tell\s+me)\b/i.test(prompt) &&
    /\b(whenever|when|if|each\s+time|every\s+time)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(toggle|enable|disable|turn\s+on|turn\s+off)\b/i.test(prompt) &&
    /\b(email|notify|alert)\b/i.test(prompt) &&
    /\bcustomers?\b/i.test(prompt)
  ) {
    return false;
  }

  const hasRescheduleVerb =
    /\b(reschedule|move|shift|change\s+time|change\s+(?:the\s+)?(?:date|day))\b/i.test(
      prompt,
    );
  if (!hasRescheduleVerb) return false;

  if (/\b(appointment|booking|visit)\b/i.test(prompt)) return true;

  // "Move to June 11 nearest free time for Maria" / "reschedule … soonest slot"
  return /\b(?:nearest|soonest|earliest|first\s+available|next\s+available)\b/i.test(
    prompt,
  );
}

/**
 * e2e-bug.267 — "Move …; put it June 2 nearest free time" is ONE reschedule
 * with bookingFirstAvailable, not a compound (reschedule + fill_slot_from_waitlist).
 * Semicolon / "then put it" only restates the destination of the same move.
 */
export function isSingleRescheduleNearestContinuationPrompt(
  prompt: string,
): boolean {
  if (!isRescheduleExistingAppointmentPrompt(prompt)) return false;

  // Real second actions — keep compound.
  if (
    /\b(cancel|notify|waitlist|fill\s+(?:the\s+)?(?:freed\s+)?slot|and\s+book|then\s+book|also\s+book|message|email|promo|pay|check\s+who|list\s+)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  const hasPutItContinuation =
    /(?:;|\bthen)\s*put\s+(?:it|that|them)\b/i.test(prompt) ||
    /(?:;|\bthen)\s*(?:move\s+)?(?:it|that)\s+(?:to\s+)?(?:the\s+)?(?:nearest|soonest|earliest|first\s+available|next\s+available)\b/i.test(
      prompt,
    );

  const hasNearestDestination =
    /\b(?:nearest|soonest|earliest|first\s+available|next\s+available)\b/i.test(
      prompt,
    ) &&
    /\b(?:free\s+time|free\s+slot|available\s+(?:slot|time)|opening)\b/i.test(
      prompt,
    );

  return hasPutItContinuation && hasNearestDestination;
}

/** Check-then-book compound: who-is-free + book-nearest in one message (not read-only soonest). */
function isCheckThenBookCompoundPrompt(prompt: string): boolean {
  const hasCompoundJoin =
    /\band\b/i.test(prompt) ||
    /\bthen\b/i.test(prompt) ||
    /;\s*/.test(prompt) ||
    /\?\s*(?=(?:book|find|get|reserve|schedule)\b)/i.test(prompt);
  if (!hasCompoundJoin) return false;

  const hasTeamAvailability =
    (/\b(?:who|which|anyone|anybody)\b/i.test(prompt) &&
      /\b(?:free|available|open)\b/i.test(prompt)) ||
    (/\b(?:see|look\s+up|check)\b/i.test(prompt) &&
      /\bwho\b/i.test(prompt) &&
      /\b(?:free|available|open)\b/i.test(prompt));

  const hasBookNearest =
    /\b(?:book|reserve|schedule|grab|put\s+me\s+in)\b/i.test(prompt) ||
    (/\b(?:find|get)\b/i.test(prompt) &&
      /\b(?:nearest|soonest|next|earliest|asap)\b/i.test(prompt) &&
      /\b(?:slot|appointment|opening|time)\b/i.test(prompt));

  return hasTeamAvailability && hasBookNearest;
}

function extractFindSoonestServiceNameFromPrompt(
  prompt: string,
): string | null {
  const quoted = prompt.match(/"([^"]{1,60})"/);
  if (quoted) return quoted[1].trim();

  const forService = prompt.match(
    /\bfor\s+(?:a\s+)?([a-z][\w\s'-]{2,40}?)(?=\s*(?:,|;|\?|\band\b|\btomorrow\b|\btonight\b|\bevening\b|\bmorning\b|\bafternoon\b|\bthis\b|\bweek\b|$))/i,
  );
  if (forService) {
    const name = forService[1].trim().replace(/[,.]$/, '');
    if (name && !/^(the|a|an|slot|time|appointment|opening)$/i.test(name)) {
      return name;
    }
  }

  const soonestNamed = prompt.match(
    /\b(?:earliest|soonest|nearest)\s+([a-z][\w\s'-]{2,40}?)\s+(?:slot|appointment|opening)\b/i,
  );
  if (soonestNamed) {
    const name = soonestNamed[1].trim().replace(/[,.]$/, '');
    if (
      name &&
      !/^(the|a|an|slot|time|appointment|opening)$/i.test(name) &&
      !SOONEST_SERVICE_NAME_NOISE.test(name)
    ) {
      return name;
    }
  }

  const openingFor = prompt.match(
    /\b(?:nearest|earliest|soonest)\s+opening\s+for\s+([a-z][\w\s'-]{2,40}?)(?=\s*(?:,|;|\?|$))/i,
  );
  if (openingFor) {
    return openingFor[1].trim().replace(/[,.]$/, '');
  }

  return extractMultilingualServiceNameFromPrompt(prompt);
}

export function isFindSoonestAppointmentPrompt(prompt: string): boolean {
  if (hasMutateBookIntent(prompt)) return false;
  // e2e-bug.248 — "move appointment … nearest free time" is reschedule, not soonest READ.
  if (isRescheduleExistingAppointmentPrompt(prompt)) return false;
  if (isCheckThenBookCompoundPrompt(prompt)) return false;
  if (isEarliestSlotAllServicesPrompt(prompt)) return false;

  if (isMultilingualFindSoonestAppointmentPrompt(prompt)) {
    return true;
  }

  if (
    /\b(who|which)\b/i.test(prompt) &&
    /\b(free|available|open)\b/i.test(prompt) &&
    (SOONEST_CUE.test(prompt) || /\b(first|next)\b/i.test(prompt))
  ) {
    return true;
  }

  if (
    /\b(?:find|get)\b/i.test(prompt) &&
    SOONEST_CUE.test(prompt) &&
    /\b(?:slot|appointment|opening|time)\b/i.test(prompt) &&
    !/\b(?:who|which|when|what)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    SOONEST_CUE.test(prompt) &&
    /\b(slot|appointment|opening|time|availability)\b/i.test(prompt)
  ) {
    return true;
  }

  if (/\bwhen\b/i.test(prompt) && SOONEST_CUE.test(prompt)) {
    return true;
  }

  if (
    /\bfind\b/i.test(prompt) &&
    SOONEST_CUE.test(prompt) &&
    !/\b(book|reserve|schedule)\b/i.test(prompt) &&
    !/\b(haircut|massage|facial|cut|color|service)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(earliest|soonest|nearest)\s+(slot|appointment|opening)\b/i.test(prompt)
  ) {
    return true;
  }

  // e2e-bug.94 — "when's your next available opening?" (no soonest/earliest word)
  if (
    /\b(when|what)\b/i.test(prompt) &&
    /\bnext\s+available\b/i.test(prompt) &&
    /\b(slot|appointment|opening|time)\b/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function enrichFindSoonestParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const shared = buildSharedBookingContextFromPrompt(prompt, timeZone);
  const serviceName =
    (params.serviceName as string | undefined)?.trim() ||
    (shared.serviceName as string | undefined) ||
    extractFindSoonestServiceNameFromPrompt(prompt);
  return {
    ...params,
    ...shared,
    ...(serviceName ? { serviceName } : {}),
    bookingFirstAvailable: true,
    allProviders:
      params.allProviders === true ||
      shared.allProviders === true ||
      /\b(who|which|anyone|anybody)\b/i.test(prompt)
        ? true
        : params.allProviders,
  };
}

export function rescueFindSoonestAppointmentIntent(
  prompt: string,
  action: string,
): { action: 'find_soonest_appointment'; rescueReason: string } | null {
  if (action === 'find_soonest_appointment') return null;
  if (!isFindSoonestAppointmentPrompt(prompt)) return null;
  return {
    action: 'find_soonest_appointment',
    rescueReason: 'soonest_appointment',
  };
}

export function detectFindSoonestAppointmentAction(
  prompt: string,
): 'find_soonest_appointment' | null {
  return rescueFindSoonestAppointmentIntent(prompt, 'unknown')?.action ?? null;
}
