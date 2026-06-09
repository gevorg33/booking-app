import { describe, expect, it } from 'vitest';
import { providerPushNotificationRoute } from './provider-push-notifications';

describe('provider-push-notifications', () => {
  it('maps notification routes to tab paths with booking id', () => {
    expect(
      providerPushNotificationRoute({
        id: 'n1',
        title: 'New appointment',
        body: 'Jane',
        bookingId: 'bk-1',
        url: '/provider/today?bookingId=bk-1',
        kind: 'booking_created',
        sentAt: '2026-06-09T09:00:00.000Z',
        readAt: null,
        isRead: false,
      }),
    ).toBe('/tabs/today?bookingId=bk-1');
  });
});
