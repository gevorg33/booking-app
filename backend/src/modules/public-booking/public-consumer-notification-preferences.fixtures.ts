import type { PublicConsumerNotificationPreferencesView } from './public-consumer-notification-preferences.util.js';

export const PUBLIC_CONSUMER_NOTIFICATION_PREFS_SCENARIOS = [
  {
    id: 'defaults-all-on',
    metadata: {},
    expected: {
      pushReminders: true,
      pushOffers: true,
      pushNews: true,
    } satisfies Partial<PublicConsumerNotificationPreferencesView>,
  },
  {
    id: 'offers-off',
    metadata: {
      notifications: {
        pushReminders: true,
        pushOffers: false,
        pushNews: true,
      },
    },
    expected: { pushOffers: false },
  },
  {
    id: 'legacy-push-only',
    metadata: {
      notifications: {
        pushReminders: false,
      },
    },
    expected: { pushReminders: false, pushOffers: true, pushNews: true },
  },
] as const;
