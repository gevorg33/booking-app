import { describe, expect, it } from 'vitest';
import { CONSUMER_NOTIFICATION_PREFS_SCENARIOS } from './consumer-notification-preferences.fixtures.js';
import {
  applyConsumerNotificationPreferencesPatch,
  buildConsumerNotificationPreferencesPatch,
  normalizeConsumerNotificationPreferences,
  shouldShowNotificationPreferencesSection,
} from './consumer-notification-preferences.util.js';

describe('consumer-notification-preferences.util', () => {
  it.each(CONSUMER_NOTIFICATION_PREFS_SCENARIOS)(
    'normalizes API payload for $id',
    ({ raw, expected }) => {
      expect(normalizeConsumerNotificationPreferences(raw)).toEqual(expected);
    },
  );

  it('builds single-key patch payloads', () => {
    expect(buildConsumerNotificationPreferencesPatch('pushOffers', false)).toEqual({
      pushOffers: false,
    });
  });

  it('applies optimistic patch locally', () => {
    const current = {
      pushReminders: true,
      pushOffers: true,
      pushNews: true,
    };
    expect(
      applyConsumerNotificationPreferencesPatch(current, { pushNews: false }),
    ).toEqual({
      pushReminders: true,
      pushOffers: true,
      pushNews: false,
    });
  });

  it('shows section only when signed in', () => {
    expect(shouldShowNotificationPreferencesSection(true)).toBe(true);
    expect(shouldShowNotificationPreferencesSection(false)).toBe(false);
  });
});
