import type { ConsumerNotificationPreferences } from './consumer-notification-preferences.util.js';

export const N99_ANDROID_PUSH_CHANNEL_IDS = [
  'booking_alerts',
  'clinic_alerts',
  'marketing_offers',
] as const;

export type N99AndroidPushChannelId = (typeof N99_ANDROID_PUSH_CHANNEL_IDS)[number];

export const N99_PREFERENCE_CHANNEL_SCENARIOS: Array<{
  id: string;
  prefs: ConsumerNotificationPreferences;
  channelId: N99AndroidPushChannelId;
  expectedImportance: number;
}> = [
  {
    id: 'transactional-on',
    prefs: { pushReminders: true, pushOffers: true, pushNews: true },
    channelId: 'booking_alerts',
    expectedImportance: 5,
  },
  {
    id: 'transactional-off',
    prefs: { pushReminders: false, pushOffers: true, pushNews: true },
    channelId: 'clinic_alerts',
    expectedImportance: 0,
  },
  {
    id: 'marketing-off-offers-and-news',
    prefs: { pushReminders: true, pushOffers: false, pushNews: false },
    channelId: 'marketing_offers',
    expectedImportance: 0,
  },
  {
    id: 'marketing-on-via-news',
    prefs: { pushReminders: true, pushOffers: false, pushNews: true },
    channelId: 'marketing_offers',
    expectedImportance: 3,
  },
];

export const N99_TRANSACTIONAL_REACHABILITY_SCENARIOS = [
  {
    id: 'provisional-transactional',
    permissionState: 'provisional' as const,
    pushReminders: true,
    expected: true,
  },
  {
    id: 'full-with-reminders-off',
    permissionState: 'full' as const,
    pushReminders: false,
    expected: false,
  },
  {
    id: 'default-on-marketing-prefs-off',
    permissionState: 'default_on' as const,
    pushReminders: true,
    pushOffers: false,
    pushNews: false,
    expected: true,
  },
] as const;
