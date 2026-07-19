import { PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS } from './ai-provider-confirm-pending-booking.fixtures.js';

function containsArmenianScript(text: string): boolean {
  return /[԰-֏]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[Ѐ-ӿ]/.test(text);
}

/** ai-cmd-provider-5.16.4 — confirm one or all pending booking(s). */
export function isConfirmPendingBookingPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (/\bpush\b/.test(lower)) return false;
  if (/\btime[\s-]?off\b/.test(lower)) return false;
  if (/\b(cash|card|payment|paid|terminal)\b/.test(lower)) return false;

  if (
    /\b(confirm|accept|approve)\b.{0,40}\b(pending|booking|appointment)\b/i.test(
      lower,
    )
  ) {
    return true;
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

export function rescueConfirmPendingBookingIntent(
  prompt: string,
  action: string,
): { action: 'confirm_pending_booking'; rescueReason: string } | null {
  if (!isConfirmPendingBookingPrompt(prompt)) return null;
  if (action === 'confirm_pending_booking') return null;
  return {
    action: 'confirm_pending_booking',
    rescueReason: 'confirm_pending_booking',
  };
}
