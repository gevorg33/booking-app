import {
  buildPushDeliveryAckAnalyticsProps,
  buildPushTokenRefreshAnalyticsProps,
  readPushDeliveryId,
  shouldAckPushDelivery,
  shouldRefreshCachedPushToken,
} from './push-deliverability.util.js';
import {
  PUSH_DELIVERY_ACK_SCENARIOS,
  PUSH_TOKEN_REFRESH_SCENARIOS,
} from './push-deliverability.fixtures.js';

describe('push-deliverability.util', () => {
  it.each(PUSH_TOKEN_REFRESH_SCENARIOS)(
    'token refresh scenario $id',
    ({ previous, next, shouldRefresh }) => {
      expect(shouldRefreshCachedPushToken(previous, next)).toBe(shouldRefresh);
    },
  );

  it.each(PUSH_DELIVERY_ACK_SCENARIOS)(
    'delivery ack scenario $id',
    ({ deliveryId, shouldAck }) => {
      expect(shouldAckPushDelivery(deliveryId)).toBe(shouldAck);
    },
  );

  it('reads delivery id from push data payload', () => {
    expect(readPushDeliveryId({ deliveryId: ' delivery-123 ' })).toBe('delivery-123');
    expect(readPushDeliveryId({ pushType: 'booking_confirmed' })).toBeNull();
  });

  it('builds analytics props for token refresh and delivery ack', () => {
    expect(buildPushTokenRefreshAnalyticsProps('ios')).toEqual({
      pushTokenRefresh: true,
      platform: 'ios',
    });
    expect(buildPushDeliveryAckAnalyticsProps('delivery-123', 'android')).toEqual({
      pushDeliveryAck: true,
      deliveryId: 'delivery-123',
      platform: 'android',
    });
  });
});
