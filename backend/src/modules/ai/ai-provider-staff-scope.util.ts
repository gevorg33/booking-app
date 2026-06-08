import { STAFF_SCOPED_INTENTS } from './access-control.matrix.js';
import { isListMyAppointmentsPrompt } from './ai-self-service-booking.util.js';

export const STAFF_SCOPE_INTENT_IDS = [...STAFF_SCOPED_INTENTS].sort();

export type StaffScopeIntent = (typeof STAFF_SCOPE_INTENT_IDS)[number];

export function isStaffScopeIntent(action: string): action is StaffScopeIntent {
  return STAFF_SCOPED_INTENTS.has(action);
}

/** parity-2.2 — catalog intents that must appear in STAFF_SCOPED_INTENTS. */
export function assertStaffScopedIntentRegistered(intentId: string): boolean {
  return STAFF_SCOPED_INTENTS.has(intentId);
}

export function isCheckInPrompt(prompt: string): boolean {
  return (
    /\b(check[\s-]?in|checked[\s-]?in)\b/i.test(prompt) ||
    /\bstart(?:ed)?\s+(?:the\s+)?(?:appointment|visit|service)\b/i.test(prompt) ||
    /\bmark\s+(?:my\s+)?(?:next\s+)?(?:appointment\s+)?as\s+in[\s-]?progress\b/i.test(
      prompt,
    ) ||
    /\bmark\s+in[\s-]?progress\b/i.test(prompt)
  );
}

export function isUpdateBookingNotesPrompt(prompt: string): boolean {
  if (/\b(configure|preparation\s+notes?|clinic\s+service)\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(add|update|set|save|write)\b/i.test(prompt) &&
    /\bnotes?\b/i.test(prompt)
  );
}

export function isAssignedBookingsPrompt(prompt: string): boolean {
  if (isListMyAppointmentsPrompt(prompt)) return false;
  if (
    /\b(confirmation|reminder|email|whatsapp|sms|currency|euro|dollar|amount|price|gift[\s-]?card|recommendation|product|checkout|success)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/\bpackage\b/i.test(prompt) && /\b(appointments?|visits?)\b/i.test(prompt)) {
    return false;
  }
  if (
    /\b(?:list|show)\s+my\s+appointments?\b/i.test(prompt) &&
    !/\b(today|assigned|schedule|this\s+week)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    (/\b(?:list|show)\s+(?:my|assigned|all\s+my|me\s+my)\b/i.test(prompt) &&
      /\b(bookings?|appointments?)\b/i.test(prompt)) ||
    /\bappointments?\s+(?:are\s+)?assigned\s+to\s+me\b/i.test(prompt) ||
    /\bmy\s+assigned\s+(?:bookings?|appointments?)\b/i.test(prompt)
  );
}

export function isOwnSchedulePrompt(prompt: string): boolean {
  if (
    /\b(specimen|collection queue|draw queue|lab collection|specimens?\s+waiting)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\b(why|how|explain)\b/i.test(prompt) &&
    /\b(format|display|12[\s-]?hour|24[\s-]?hour|time)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /^show\s+my\s+appointments?\b/i.test(prompt.trim()) &&
    !/\b(today|schedule|assigned|this\s+week)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(my|own)\s+schedule\b/i.test(prompt) ||
    /\bshow\s+my\s+(?:schedule|appointments)\b/i.test(prompt) ||
    /\bwhat(?:'s|\s+is)\s+on\s+my\s+schedule\b/i.test(prompt)
  );
}

export function isBreakBlockPrompt(prompt: string): boolean {
  return (
    /\bblock\b/i.test(prompt) &&
    (/\b(lunch|break)\b/i.test(prompt) ||
      /\b\d{1,2}:\d{2}\s*(?:-|to)\s*\d{1,2}:\d{2}\b/.test(prompt))
  );
}

export function mergeCheckInParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  return { ...params, status: 'in_progress' };
}

export function extractNotesFromPrompt(prompt: string): string | undefined {
  const quoted = prompt.match(/["“]([^"”]+)["”]/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();
  const afterColon = prompt.match(/notes?\s*:\s*(.+)$/i);
  if (afterColon?.[1]?.trim()) return afterColon[1].trim();
  const afterOnBooking = prompt.match(
    /notes?\s+on\s+(?:\w+\s+){0,3}booking\s*:\s*(.+)$/i,
  );
  if (afterOnBooking?.[1]?.trim()) return afterOnBooking[1].trim();
  return undefined;
}

export function mergeNotesParams(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const notes =
    typeof params.notes === 'string' && params.notes.trim()
      ? params.notes.trim()
      : extractNotesFromPrompt(prompt);
  return notes ? { ...params, notes } : params;
}

export function rescueStaffScopeIntent(
  prompt: string,
  action: string,
): {
  action: string;
  params: Record<string, unknown>;
  rescueReason: string;
} | null {
  if (isCheckInPrompt(prompt) && action !== 'update_bookings') {
    return {
      action: 'update_bookings',
      params: mergeCheckInParams({}),
      rescueReason: 'staff_scope_check_in',
    };
  }
  if (isUpdateBookingNotesPrompt(prompt) && action !== 'update_bookings') {
    const params = mergeNotesParams(prompt, {});
    if (params.notes) {
      return {
        action: 'update_bookings',
        params,
        rescueReason: 'staff_scope_notes',
      };
    }
    return {
      action: 'update_bookings',
      params: {},
      rescueReason: 'staff_scope_notes',
    };
  }
  if (isBreakBlockPrompt(prompt) && action !== 'block_schedule') {
    return {
      action: 'block_schedule',
      params: {},
      rescueReason: 'staff_scope_break',
    };
  }
  if (
    /\bwho'?s\s+next\b/i.test(prompt) &&
    action !== 'show_appointments'
  ) {
    return {
      action: 'show_appointments',
      params: { statusFilter: 'upcoming' },
      rescueReason: 'staff_scope_whos_next',
    };
  }
  if (isOwnSchedulePrompt(prompt) && action !== 'show_appointments') {
    return {
      action: 'show_appointments',
      params: {},
      rescueReason: 'staff_scope_own_schedule',
    };
  }
  if (isAssignedBookingsPrompt(prompt) && action !== 'list_bookings') {
    return {
      action: 'list_bookings',
      params: {},
      rescueReason: 'staff_scope_assigned_bookings',
    };
  }
  if (
    ((/\bam\s+i\b/i.test(prompt) &&
      /\b(availability|free|open\s+slots?)\b/i.test(prompt)) ||
      /\bdo\s+i\s+have\s+open\s+slots?\b/i.test(prompt) ||
      (/\bcheck\b/i.test(prompt) &&
        /\bmy\b/i.test(prompt) &&
        /\b(availability|free|open\s+slots?)\b/i.test(prompt))) &&
    action !== 'check_availability'
  ) {
    return {
      action: 'check_availability',
      params: {},
      rescueReason: 'staff_scope_availability',
    };
  }
  return null;
}
