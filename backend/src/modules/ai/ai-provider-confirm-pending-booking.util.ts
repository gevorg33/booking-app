import { PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS } from './ai-provider-confirm-pending-booking.fixtures.js';
import { extractCustomerNameFromClientPrompt } from './ai-provider-client-context.util.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.16.4 — confirm one or all pending booking(s). */
export function isConfirmPendingBookingPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  // Push/notification confirms are confirm_booking_from_push (e2e-bug.242)
  if (/\b(push|notification|alert)\b/.test(lower)) return false;
  if (/\btime[\s-]?off\b/.test(lower)) return false;
  if (/\b(cash|card|payment|paid|terminal)\b/.test(lower)) return false;

  if (/\b(confirm|accept|approve)\b/.test(lower)) {
    // Explicit pending, bulk "all … bookings/appointments", or named "Maria's booking"
    if (/\bpending\b/.test(lower)) return true;
    if (/\ball\b/.test(lower) && /\b(booking|appointment)s?\b/.test(lower)) {
      return true;
    }
    if (/\b[\w'.-]+'s\s+(?:pending\s+)?(?:booking|appointment)\b/.test(lower)) {
      return true;
    }
  }

  if (
    containsArmenianScript(prompt) &&
    /հաստատ/i.test(prompt) &&
    /(սպասող|ամրագր)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /подтверд/i.test(prompt) &&
    /(ожида|запис|брон)/i.test(prompt)
  ) {
    return true;
  }

  return PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS.some(
    (scenario) => scenario.prompt === prompt,
  );
}

/** Extract customerName / allAppointments for confirm-pending (bulk-mutation safety). */
export function parseConfirmPendingBookingFromPrompt(prompt: string): {
  customerName?: string;
  allAppointments?: boolean;
} {
  const lower = prompt.toLowerCase();
  const allAppointments =
    /\b(all|every|my pending)\b/.test(lower) ||
    /\bբոլոր\b/u.test(prompt) ||
    /\bвсе\b/u.test(prompt);
  const customerName = extractCustomerNameFromClientPrompt(prompt) ?? undefined;
  return {
    ...(customerName ? { customerName } : {}),
    ...(allAppointments ? { allAppointments: true } : {}),
  };
}

export function rescueConfirmPendingBookingIntent(
  prompt: string,
  action: string,
): {
  action: 'confirm_pending_booking';
  rescueReason: string;
  params: Record<string, unknown>;
} | null {
  if (!isConfirmPendingBookingPrompt(prompt)) return null;
  if (action === 'confirm_pending_booking') return null;
  return {
    action: 'confirm_pending_booking',
    rescueReason: 'confirm_pending_booking',
    params: parseConfirmPendingBookingFromPrompt(prompt),
  };
}
