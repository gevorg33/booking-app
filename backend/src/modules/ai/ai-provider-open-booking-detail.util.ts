export function isOpenBookingDetailPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\bshifts?\b/.test(lower)) return false;
  if (/\b(?:cancel|reschedule|block|mark|check[\s-]?in|from\s+push)\b/.test(lower)) {
    return false;
  }
  if (/\bopen\b.{0,30}\b(?:appointment|booking|visit)\b/.test(lower)) {
    return true;
  }
  return /\bpull\s+up\b.{0,30}\b(?:appointment|booking|visit)\b/.test(lower);
}

export function rescueOpenBookingDetailIntent(
  prompt: string,
  action: string,
): { action: 'open_booking_detail'; rescueReason: string } | null {
  if (action === 'open_booking_detail') return null;
  if (!isOpenBookingDetailPrompt(prompt)) return null;
  return { action: 'open_booking_detail', rescueReason: 'open_booking_detail' };
}
