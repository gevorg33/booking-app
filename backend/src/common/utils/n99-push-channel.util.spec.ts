import {
  isTransactionalAndroidPushChannel,
  isTransactionalReachabilityAnalyticsProps,
  listConsumerPushTypesForChannel,
  resolveConsumerPushAndroidChannelId,
  resolveConsumerPushPreferenceCategory,
} from './n99-push-channel.util.js';
import {
  N99_PUSH_TYPE_CHANNEL_SCENARIOS,
  N99_TRANSACTIONAL_REACHABILITY_SCENARIOS,
} from './n99-push-channel.fixtures.js';

describe('n99-push-channel.util (n99-4.3)', () => {
  it.each(N99_PUSH_TYPE_CHANNEL_SCENARIOS)(
    'maps $id to channel and category',
    ({ pushType, channelId, category, transactional }) => {
      expect(resolveConsumerPushAndroidChannelId(pushType)).toBe(channelId);
      expect(resolveConsumerPushPreferenceCategory(pushType)).toBe(category);
      expect(isTransactionalAndroidPushChannel(channelId)).toBe(transactional);
    },
  );

  it.each(N99_TRANSACTIONAL_REACHABILITY_SCENARIOS)(
    'isTransactionalReachabilityAnalyticsProps $id',
    ({ props, expected }) => {
      expect(isTransactionalReachabilityAnalyticsProps(props)).toBe(expected);
    },
  );

  it('lists push types per Android channel', () => {
    expect(listConsumerPushTypesForChannel('booking_alerts')).toEqual(
      expect.arrayContaining(['booking_confirmed', 'gift_card_received']),
    );
    expect(listConsumerPushTypesForChannel('marketing_offers')).toEqual(
      expect.arrayContaining(['rebooking_nudge', 'win_back']),
    );
  });
});
