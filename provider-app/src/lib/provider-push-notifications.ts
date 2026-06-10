import api, { unwrap } from '../services/api';
import { providerTabPathFromPushUrl } from './provider-push-deep-link.util';

export type ProviderPushNotificationKind =
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'booking_updated'
  | 'payment_received'
  | 'end_of_day';

export interface ProviderPushNotificationItem {
  id: string;
  title: string;
  body: string;
  bookingId: string | null;
  url: string | null;
  kind: ProviderPushNotificationKind;
  sentAt: string;
  readAt: string | null;
  isRead: boolean;
}

export interface ProviderPushNotificationCenter {
  days: number;
  unreadCount: number;
  items: ProviderPushNotificationItem[];
}

export async function fetchProviderPushNotifications(
  businessId: string,
): Promise<ProviderPushNotificationCenter> {
  const res = await api.get(`/businesses/${businessId}/provider/push/notifications`);
  return unwrap<ProviderPushNotificationCenter>(res.data);
}

export async function markProviderPushNotificationRead(
  businessId: string,
  notificationId: string,
): Promise<void> {
  await api.post(
    `/businesses/${businessId}/provider/push/notifications/${notificationId}/read`,
  );
}

export async function markAllProviderPushNotificationsRead(
  businessId: string,
): Promise<{ updated: number }> {
  const res = await api.post(
    `/businesses/${businessId}/provider/push/notifications/read-all`,
  );
  return unwrap<{ updated: number }>(res.data);
}

export async function markProviderBookingPushRead(
  businessId: string,
  bookingId: string,
): Promise<void> {
  await api.post(
    `/businesses/${businessId}/provider/push/notifications/mark-booking-read`,
    { bookingId },
  );
}

export function providerPushNotificationRoute(item: ProviderPushNotificationItem): string {
  if (item.url) {
    return providerTabPathFromPushUrl(item.url);
  }
  if (item.bookingId) {
    return `/tabs/today?bookingId=${encodeURIComponent(item.bookingId)}`;
  }
  return '/tabs/today';
}
