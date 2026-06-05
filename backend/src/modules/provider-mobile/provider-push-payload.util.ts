/** Sprint 20 — shared push copy and AI prefill for provider mobile. */

export type ProviderPushType = 'booking_created' | 'booking_updated' | 'end_of_day';

export function buildNewBookingAiPrompt(timeLabel: string, customerName: string): string {
  const who = customerName.trim() || 'the client';
  return `Add a 15-minute buffer before ${who}'s appointment at ${timeLabel}`;
}

export function buildNewBookingForegroundHint(timeLabel: string): string {
  return `New booking ${timeLabel} — Add buffer?`;
}

export interface ProviderNativePushData {
  url?: string;
  bookingId?: string;
  businessId?: string;
  aiPrompt?: string;
  pushType?: ProviderPushType;
  foregroundHint?: string;
}

export function toNativePushDataFields(
  payload: ProviderNativePushData,
): Record<string, string> {
  const data: Record<string, string> = {};
  if (payload.url) data.url = payload.url;
  if (payload.bookingId) data.bookingId = payload.bookingId;
  if (payload.businessId) data.businessId = payload.businessId;
  if (payload.aiPrompt) data.aiPrompt = payload.aiPrompt;
  if (payload.pushType) data.pushType = payload.pushType;
  if (payload.foregroundHint) data.foregroundHint = payload.foregroundHint;
  return data;
}
