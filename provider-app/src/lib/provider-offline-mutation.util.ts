import { isOfflineMutation } from './offline-queue';

/** AI confirm actions safe to replay without live LLM. */
export const OFFLINE_SAFE_AI_CONFIRM_ACTIONS = new Set([
  'update_bookings',
  'payment_sweep',
  'mark_no_shows',
  'cancel_bookings',
]);

export function isProviderAiInterpretUrl(url: string): boolean {
  const path = url.split('?')[0];
  return /\/provider\/ai\/command$/.test(path);
}

export function isProviderAiConfirmUrl(url: string): boolean {
  const path = url.split('?')[0];
  return /\/provider\/ai\/command\/confirm$/.test(path);
}

export function isOfflineSafeAiConfirmBody(data: unknown): boolean {
  const action = (data as { action?: string } | undefined)?.action;
  return typeof action === 'string' && OFFLINE_SAFE_AI_CONFIRM_ACTIONS.has(action);
}

export function isProviderBookingMutationUrl(url: string): boolean {
  const path = url.split('?')[0];
  return /\/provider\/bookings\/[^/]+(\/cancel)?$/.test(path);
}

export function isOfflineSafeBookingBody(data: unknown): boolean {
  const body = (data as Record<string, unknown> | undefined) ?? {};
  if (typeof body.startTime === 'string' && body.startTime.trim()) return false;
  return true;
}

export function isProviderGiftCardMutationUrl(url: string): boolean {
  const path = url.split('?')[0];
  return /\/provider\/gift-cards\//.test(path);
}

/** Whether a failed network mutation should be queued for replay. */
export function shouldQueueOfflineMutation(
  method?: string,
  url?: string,
  data?: unknown,
): boolean {
  if (!isOfflineMutation(method)) return false;
  const path = (url ?? '').split('?')[0];
  if (!path) return false;

  if (isProviderAiInterpretUrl(path)) return false;

  if (isProviderAiConfirmUrl(path)) {
    return isOfflineSafeAiConfirmBody(data);
  }

  if (isProviderBookingMutationUrl(path)) {
    return isOfflineSafeBookingBody(data);
  }

  if (isProviderGiftCardMutationUrl(path)) return true;

  if (/\/provider\/push\/action$/.test(path)) return true;

  return false;
}
