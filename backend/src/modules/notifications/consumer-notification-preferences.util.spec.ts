import { DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES } from './notification.types.js';
import { shouldSendConsumerPush } from './consumer-notification-preferences.util.js';

describe('consumer-notification-preferences.util', () => {
  it('gates push by category (adopt-4.8)', () => {
    const prefs = {
      ...DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES,
      pushReminders: true,
      pushOffers: false,
      pushNews: true,
    };
    expect(shouldSendConsumerPush(prefs, 'reminders')).toBe(true);
    expect(shouldSendConsumerPush(prefs, 'offers')).toBe(false);
    expect(shouldSendConsumerPush(prefs, 'news')).toBe(true);
  });

  it('returns false for unknown categories', () => {
    expect(
      shouldSendConsumerPush(
        DEFAULT_CUSTOMER_NOTIFICATION_PREFERENCES,
        'invalid' as never,
      ),
    ).toBe(false);
  });
});
