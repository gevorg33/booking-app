import { PUBLIC_CONSUMER_NOTIFICATION_PREFS_SCENARIOS } from './public-consumer-notification-preferences.fixtures.js';
import {
  applyCustomerNotificationPreferences,
  mapPublicConsumerNotificationPreferences,
  mergeCustomerNotificationPreferences,
} from './public-consumer-notification-preferences.util.js';

describe('public-consumer-notification-preferences.util', () => {
  it.each(PUBLIC_CONSUMER_NOTIFICATION_PREFS_SCENARIOS)(
    'maps metadata for $id',
    ({ metadata, expected }) => {
      const view = mapPublicConsumerNotificationPreferences(metadata);
      expect(view).toMatchObject(expected);
    },
  );

  it('merges partial updates onto existing metadata', () => {
    const metadata = {
      notifications: { pushReminders: true, pushOffers: true, pushNews: true },
      reminderHoursBefore: 24,
    };
    const next = applyCustomerNotificationPreferences(metadata, {
      pushOffers: false,
    });
    expect(next.reminderHoursBefore).toBe(24);
    expect(mapPublicConsumerNotificationPreferences(next)).toMatchObject({
      pushReminders: true,
      pushOffers: false,
      pushNews: true,
    });
  });

  it('mergeCustomerNotificationPreferences preserves untouched keys', () => {
    const merged = mergeCustomerNotificationPreferences(
      { notifications: { pushReminders: false } },
      { pushNews: false },
    );
    expect(merged.pushReminders).toBe(false);
    expect(merged.pushOffers).toBe(true);
    expect(merged.pushNews).toBe(false);
  });
});
