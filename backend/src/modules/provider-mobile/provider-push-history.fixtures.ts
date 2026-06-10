/** prov-exp-10.1 — provider push notification center scenarios. */

import type { ProviderPushNotificationLike } from './provider-push-history.util.js';

export interface ProviderPushNotificationCenterScenario {
  id: string;
  items: ProviderPushNotificationLike[];
  expectUnreadCount: number;
  expectItemCount: number;
}

const now = new Date('2026-06-10T12:00:00.000Z');

export const PROVIDER_PUSH_NOTIFICATION_CENTER_SCENARIOS: ProviderPushNotificationCenterScenario[] =
  [
    {
      id: 'empty-inbox',
      items: [],
      expectUnreadCount: 0,
      expectItemCount: 0,
    },
    {
      id: 'mixed-read-unread',
      items: [
        {
          id: 'n1',
          title: 'New appointment',
          body: 'Jane — Cut at 10:00',
          bookingId: 'bk-1',
          url: '/provider/today?bookingId=bk-1',
          kind: 'booking_created',
          sentAt: new Date('2026-06-09T09:00:00.000Z'),
          readAt: null,
        },
        {
          id: 'n2',
          title: 'Payment received',
          body: 'Jane — Cut: USD 50.00',
          bookingId: 'bk-1',
          url: '/provider/today?bookingId=bk-1',
          kind: 'payment_received',
          sentAt: new Date('2026-06-08T15:00:00.000Z'),
          readAt: new Date('2026-06-08T16:00:00.000Z'),
        },
      ],
      expectUnreadCount: 1,
      expectItemCount: 2,
    },
    {
      id: 'filters-outside-30d-window',
      items: [
        {
          id: 'old',
          title: 'Old push',
          body: 'Expired',
          bookingId: 'bk-old',
          url: null,
          kind: 'booking_created',
          sentAt: new Date('2026-04-01T09:00:00.000Z'),
          readAt: null,
        },
        {
          id: 'recent',
          title: 'Recent push',
          body: 'Still visible',
          bookingId: 'bk-new',
          url: null,
          kind: 'booking_created',
          sentAt: new Date('2026-06-01T09:00:00.000Z'),
          readAt: null,
        },
      ],
      expectUnreadCount: 1,
      expectItemCount: 1,
    },
  ];

export const PROVIDER_PUSH_HISTORY_REFERENCE_NOW = now;
