import { describe, expect, it } from 'vitest';
import {
  N99_PREFERENCE_CHANNEL_SCENARIOS,
  N99_TRANSACTIONAL_REACHABILITY_SCENARIOS,
} from './n99-push-channel.fixtures.js';
import {
  buildAndroidPushChannelSyncSpecs,
  buildTransactionalReachabilityAnalyticsProps,
  isMarketingAndroidChannelEnabled,
  isTransactionalAndroidChannelEnabled,
  isTransactionalAndroidPushChannel,
  isTransactionallyReachable,
} from './n99-push-channel.util.js';

describe('n99-push-channel.util (n99-4.3)', () => {
  it('classifies transactional vs marketing Android channels', () => {
    expect(isTransactionalAndroidPushChannel('booking_alerts')).toBe(true);
    expect(isTransactionalAndroidPushChannel('marketing_offers')).toBe(false);
  });

  it('derives marketing channel enabled state from offers or news', () => {
    expect(
      isMarketingAndroidChannelEnabled({
        pushReminders: true,
        pushOffers: false,
        pushNews: true,
      }),
    ).toBe(true);
    expect(
      isMarketingAndroidChannelEnabled({
        pushReminders: true,
        pushOffers: false,
        pushNews: false,
      }),
    ).toBe(false);
  });

  it('derives transactional channel enabled state from reminders pref', () => {
    expect(
      isTransactionalAndroidChannelEnabled({
        pushReminders: false,
        pushOffers: true,
        pushNews: true,
      }),
    ).toBe(false);
  });

  it.each(N99_PREFERENCE_CHANNEL_SCENARIOS)(
    'buildAndroidPushChannelSyncSpecs $id',
    ({ prefs, channelId, expectedImportance }) => {
      const spec = buildAndroidPushChannelSyncSpecs(prefs).find(
        (row) => row.id === channelId,
      );
      expect(spec?.importance).toBe(expectedImportance);
    },
  );

  it.each(N99_TRANSACTIONAL_REACHABILITY_SCENARIOS)(
    'isTransactionallyReachable $id',
    ({ permissionState, pushReminders, expected }) => {
      expect(
        isTransactionallyReachable({
          permissionState,
          pushReminders,
        }),
      ).toBe(expected);
    },
  );

  it('buildTransactionalReachabilityAnalyticsProps scopes transactional reachability', () => {
    expect(
      buildTransactionalReachabilityAnalyticsProps({
        permissionState: 'provisional',
      }),
    ).toEqual({
      pushReachability: true,
      pushReachabilityScope: 'transactional',
      pushPermissionState: 'provisional',
    });
  });
});
