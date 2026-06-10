import {
  PROVIDER_PUSH_HISTORY_REFERENCE_NOW,
  PROVIDER_PUSH_NOTIFICATION_CENTER_SCENARIOS,
} from './provider-push-history.fixtures.js';
import {
  buildProviderPushNotificationCenterView,
  isProviderPushWithinHistoryWindow,
  mapProviderPushNotificationItem,
  providerPushHistoryCutoff,
  resolveProviderPushHistoryKind,
} from './provider-push-history.util.js';

describe('provider-push-history.util (prov-exp-10.1)', () => {
  it.each(PROVIDER_PUSH_NOTIFICATION_CENTER_SCENARIOS)(
    'buildProviderPushNotificationCenterView — $id',
    ({ items, expectUnreadCount, expectItemCount }) => {
      const view = buildProviderPushNotificationCenterView(
        items,
        PROVIDER_PUSH_HISTORY_REFERENCE_NOW,
      );
      expect(view.days).toBe(30);
      expect(view.items).toHaveLength(expectItemCount);
      expect(view.unreadCount).toBe(expectUnreadCount);
    },
  );

  it('maps push kinds from payload types', () => {
    expect(resolveProviderPushHistoryKind('booking_created')).toBe('booking_created');
    expect(resolveProviderPushHistoryKind('payment_received')).toBe('payment_received');
    expect(resolveProviderPushHistoryKind(undefined)).toBe('booking_updated');
  });

  it('marks read state on mapped items', () => {
    const item = mapProviderPushNotificationItem({
      id: 'n1',
      title: 'New appointment',
      body: 'Jane',
      bookingId: 'bk-1',
      url: null,
      kind: 'booking_created',
      sentAt: new Date('2026-06-09T09:00:00.000Z'),
      readAt: null,
    });
    expect(item.isRead).toBe(false);

    const read = mapProviderPushNotificationItem({
      id: 'n1',
      title: 'New appointment',
      body: 'Jane',
      bookingId: 'bk-1',
      url: null,
      kind: 'booking_created',
      sentAt: new Date('2026-06-09T09:00:00.000Z'),
      readAt: new Date('2026-06-09T10:00:00.000Z'),
    });
    expect(read.isRead).toBe(true);
  });

  it('covers all push history kind mappings', () => {
    expect(resolveProviderPushHistoryKind('booking_cancelled')).toBe('booking_cancelled');
    expect(resolveProviderPushHistoryKind('booking_rescheduled')).toBe('booking_rescheduled');
    expect(resolveProviderPushHistoryKind('end_of_day')).toBe('end_of_day');
    expect(resolveProviderPushHistoryKind('booking_updated')).toBe('booking_updated');
  });

  it('supports custom history windows', () => {
    const view = buildProviderPushNotificationCenterView(
      [
        {
          id: 'n1',
          title: 'Recent',
          body: 'Body',
          bookingId: null,
          url: null,
          kind: 'booking_created',
          sentAt: new Date('2026-06-05T09:00:00.000Z'),
          readAt: null,
        },
      ],
      PROVIDER_PUSH_HISTORY_REFERENCE_NOW,
      14,
    );
    expect(view.days).toBe(14);
    expect(view.items).toHaveLength(1);
  });

  it('checks 30-day history window inclusively at cutoff', () => {
    const reference = new Date('2026-06-10T12:00:00.000Z');
    const cutoff = new Date('2026-05-11T12:00:00.000Z');
    expect(isProviderPushWithinHistoryWindow(cutoff, reference)).toBe(true);
    expect(
      isProviderPushWithinHistoryWindow(
        new Date('2026-05-10T11:59:59.000Z'),
        reference,
      ),
    ).toBe(false);
  });

  it('defaults history cutoff to 30 days', () => {
    const reference = new Date('2026-06-10T12:00:00.000Z');
    const cutoff = providerPushHistoryCutoff(reference);
    expect(cutoff.toISOString()).toBe('2026-05-11T12:00:00.000Z');
  });

  it('builds a view with default reference date', () => {
    const view = buildProviderPushNotificationCenterView([]);
    expect(view.items).toEqual([]);
    expect(view.unreadCount).toBe(0);
  });
});
