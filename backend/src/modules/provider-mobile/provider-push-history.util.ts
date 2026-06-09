/** prov-exp-10.1 — provider push notification center (30d history, read/unread). */

import type { ProviderPushType } from './provider-push-payload.util.js';

export const PROVIDER_PUSH_HISTORY_DAYS = 30;
export const PROVIDER_PUSH_HISTORY_LIMIT = 100;

export type ProviderPushHistoryKind =
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'booking_updated'
  | 'payment_received'
  | 'end_of_day';

export interface ProviderPushNotificationLike {
  id: string;
  title: string;
  body: string;
  bookingId: string | null;
  url: string | null;
  kind: string;
  sentAt: Date;
  readAt: Date | null;
}

export interface ProviderPushNotificationItem {
  id: string;
  title: string;
  body: string;
  bookingId: string | null;
  url: string | null;
  kind: ProviderPushHistoryKind;
  sentAt: string;
  readAt: string | null;
  isRead: boolean;
}

export interface ProviderPushNotificationCenterView {
  days: number;
  unreadCount: number;
  items: ProviderPushNotificationItem[];
}

export function resolveProviderPushHistoryKind(
  pushType?: ProviderPushType | string | null,
): ProviderPushHistoryKind {
  switch (pushType) {
    case 'booking_created':
      return 'booking_created';
    case 'booking_cancelled':
      return 'booking_cancelled';
    case 'booking_rescheduled':
      return 'booking_rescheduled';
    case 'payment_received':
      return 'payment_received';
    case 'end_of_day':
      return 'end_of_day';
    case 'booking_updated':
      return 'booking_updated';
    default:
      return 'booking_updated';
  }
}

export function providerPushHistoryCutoff(
  referenceDate: Date,
  days: number = PROVIDER_PUSH_HISTORY_DAYS,
): Date {
  const cutoff = new Date(referenceDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

export function isProviderPushWithinHistoryWindow(
  sentAt: Date,
  referenceDate: Date,
  days: number = PROVIDER_PUSH_HISTORY_DAYS,
): boolean {
  return sentAt >= providerPushHistoryCutoff(referenceDate, days);
}

export function mapProviderPushNotificationItem(
  row: ProviderPushNotificationLike,
): ProviderPushNotificationItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    bookingId: row.bookingId,
    url: row.url,
    kind: resolveProviderPushHistoryKind(row.kind),
    sentAt: row.sentAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    isRead: row.readAt != null,
  };
}

export function buildProviderPushNotificationCenterView(
  rows: ProviderPushNotificationLike[],
  referenceDate: Date = new Date(),
  days: number = PROVIDER_PUSH_HISTORY_DAYS,
): ProviderPushNotificationCenterView {
  const items = rows
    .filter((row) => isProviderPushWithinHistoryWindow(row.sentAt, referenceDate, days))
    .slice(0, PROVIDER_PUSH_HISTORY_LIMIT)
    .map(mapProviderPushNotificationItem);

  return {
    days,
    unreadCount: items.filter((item) => !item.isRead).length,
    items,
  };
}
