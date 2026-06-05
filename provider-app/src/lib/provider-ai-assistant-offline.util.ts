import type { QueryClient } from '@tanstack/react-query';
import {
  applyOptimisticBookingPatches,
  buildAiConfirmOptimisticPatch,
  captureBookingCaches,
  restoreBookingCaches,
  type BookingCacheSnapshot,
} from './provider-booking-optimistic.util';
import {
  isOfflineQueuedResponse,
  offlineNeedsNetworkSummary,
  offlineQueuedAssistantSummary,
} from './provider-offline-response.util';
import { isNetworkError } from './offline-queue';

export interface PendingAiConfirmAction {
  action: string;
  params?: Record<string, unknown>;
}

export interface AiConfirmSnapshot {
  bookingId: string;
  snapshot: BookingCacheSnapshot;
}

export function offlinePromptBlockedMessage(translate: (key: string) => string): string {
  return offlineNeedsNetworkSummary(translate);
}

export function networkPromptErrorMessage(
  error: unknown,
  translate: (key: string) => string,
  fallbackKey: string,
): string {
  const ax = error as { response?: { data?: { message?: string } } };
  return isNetworkError(ax)
    ? offlineNeedsNetworkSummary(translate)
    : (ax.response?.data?.message ?? translate(fallbackKey));
}

export function prepareAiConfirmSnapshots(
  queryClient: QueryClient,
  businessId: string,
  bookingIds: string[],
): AiConfirmSnapshot[] {
  return bookingIds.map((bookingId) => ({
    bookingId,
    snapshot: captureBookingCaches(queryClient, businessId, bookingId),
  }));
}

export function applyAiConfirmOptimistic(
  queryClient: QueryClient,
  businessId: string,
  bookingIds: string[],
  pending: PendingAiConfirmAction,
): void {
  const patch = buildAiConfirmOptimisticPatch(pending.action, pending.params);
  if (patch) applyOptimisticBookingPatches(queryClient, businessId, bookingIds, patch);
}

export function rollbackAiConfirmSnapshots(
  queryClient: QueryClient,
  businessId: string,
  snapshots: AiConfirmSnapshot[],
): void {
  for (const entry of snapshots) {
    restoreBookingCaches(queryClient, businessId, entry.bookingId, entry.snapshot);
  }
}

export function resolveAiConfirmResponse(
  response: { data: unknown; status?: number },
  translate: (key: string) => string,
): { kind: 'queued'; summary: string } | { kind: 'result'; data: unknown } {
  if (isOfflineQueuedResponse(response.data, response.status)) {
    return { kind: 'queued', summary: offlineQueuedAssistantSummary(translate) };
  }
  return { kind: 'result', data: response.data };
}

export function aiConfirmErrorMessage(
  error: unknown,
  translate: (key: string) => string,
): string {
  const ax = error as { response?: { data?: { message?: string } } };
  return ax.response?.data?.message ?? translate('provider.assistantConfirmFailed');
}
