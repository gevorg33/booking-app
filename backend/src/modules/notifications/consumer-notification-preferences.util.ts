import type { CustomerNotificationPreferences } from './notification.types.js';

/** adopt-4.8 — consumer push preference categories. */
export type ConsumerPushPreferenceCategory = 'reminders' | 'offers' | 'news';

export function shouldSendConsumerPush(
  prefs: CustomerNotificationPreferences,
  category: ConsumerPushPreferenceCategory,
): boolean {
  switch (category) {
    case 'reminders':
      return prefs.pushReminders;
    case 'offers':
      return prefs.pushOffers;
    case 'news':
      return prefs.pushNews;
    default:
      return false;
  }
}
