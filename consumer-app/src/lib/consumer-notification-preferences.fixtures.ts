import type { ConsumerNotificationPreferences } from './consumer-notification-preferences.util.js';

export const CONSUMER_NOTIFICATION_PREFS_SCENARIOS = [
  {
    id: 'defaults-all-on',
    raw: {},
    expected: {
      pushReminders: true,
      pushOffers: true,
      pushNews: true,
    } satisfies ConsumerNotificationPreferences,
  },
  {
    id: 'offers-off',
    raw: { pushReminders: true, pushOffers: false, pushNews: true },
    expected: {
      pushReminders: true,
      pushOffers: false,
      pushNews: true,
    },
  },
  {
    id: 'explicit-false-reminders',
    raw: { pushReminders: false, pushOffers: true, pushNews: true },
    expected: {
      pushReminders: false,
      pushOffers: true,
      pushNews: true,
    },
  },
] as const;
