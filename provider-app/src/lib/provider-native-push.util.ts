import type { ProviderPushPayload } from './provider-push-deep-link.util';

export function shouldShowForegroundPush(payload: ProviderPushPayload): boolean {
  return (
    payload.pushType === 'booking_created' ||
    Boolean(payload.foregroundHint?.trim()) ||
    Boolean(payload.aiPrompt?.trim())
  );
}

export function shouldExecutePushAction(
  actionId: string | undefined,
  bookingId?: string,
  bizId?: string | null,
): boolean {
  const id = (actionId ?? '').trim();
  return Boolean(bookingId && bizId && id && id !== 'tap');
}

export function buildSuggestReschedulePushPayload(
  bookingId: string,
  businessId: string,
): ProviderPushPayload {
  return {
    bookingId,
    businessId,
    aiPrompt: `Reschedule booking ${bookingId} to next available slot`,
    url: `/provider/today?bookingId=${bookingId}`,
  };
}
