import { describe, expect, it } from 'vitest';
import { CONSUMER_COPY_EN } from './consumer-copy-catalog.js';
import { HOME_SCREEN_WIDGET_SCENARIOS } from './home-screen-widget.fixtures.js';
import {
  buildHomeScreenWidgetSnapshot,
  parseHomeScreenWidgetSnapshot,
  pickLastCompletedBooking,
  pickNextUpcomingBooking,
  serializeHomeScreenWidgetSnapshot,
} from './home-screen-widget.util.js';

describe('home-screen-widget.util', () => {
  it.each(HOME_SCREEN_WIDGET_SCENARIOS)(
    'picks bookings for $id',
    ({ now, bookings, expectNextId, expectRebookId }) => {
      const reference = new Date(now);
      const next = pickNextUpcomingBooking(bookings, reference);
      const rebook = pickLastCompletedBooking(bookings);
      expect(next?.id ?? null).toBe(expectNextId);
      expect(rebook?.id ?? null).toBe(expectRebookId);
    },
  );

  it('builds signed-out snapshot with salon deep link', () => {
    const snapshot = buildHomeScreenWidgetSnapshot({
      slug: 'Glow-Nails',
      businessName: 'Glow Nails',
      authed: false,
      bookings: [],
      copy: CONSUMER_COPY_EN,
      formatDate: (iso) => iso.slice(0, 10),
      formatTime: (iso) => iso.slice(11, 16),
    });

    expect(snapshot.authed).toBe(false);
    expect(snapshot.slug).toBe('glow-nails');
    expect(snapshot.signedOut?.deepLinkUrl).toBe('optischedule://book/glow-nails');
    expect(snapshot.nextAppointment).toBeNull();
    expect(snapshot.quickRebook).toBeNull();
  });

  it('builds next appointment and quick rebook sections when authed', () => {
    const scenario = HOME_SCREEN_WIDGET_SCENARIOS[0];
    const snapshot = buildHomeScreenWidgetSnapshot({
      slug: 'spa-one',
      businessName: 'Spa One',
      authed: true,
      bookings: [...scenario.bookings],
      copy: CONSUMER_COPY_EN,
      formatDate: () => 'Jun 15',
      formatTime: () => '2:00 PM',
      now: new Date(scenario.now),
    });

    expect(snapshot.nextAppointment?.deepLinkUrl).toBe(
      'optischedule://book/spa-one/account',
    );
    expect(snapshot.quickRebook?.deepLinkUrl).toContain(
      'optischedule://book/spa-one/book/svc-1',
    );
    expect(snapshot.quickRebook?.deepLinkUrl).toContain('employeeId=emp-1');
    expect(snapshot.quickRebook?.deepLinkUrl).toContain('rebook=1');
    expect(snapshot.quickRebook?.deepLinkUrl).toContain('rebookSource=widget');
    expect(snapshot.nextAppointment?.subtitle).toContain('Jane');
    expect(snapshot.signedOut).toBeNull();
  });

  it('serializes and parses snapshot JSON', () => {
    const snapshot = buildHomeScreenWidgetSnapshot({
      slug: 'spa-one',
      businessName: 'Spa One',
      authed: true,
      bookings: [],
      copy: CONSUMER_COPY_EN,
      formatDate: () => 'Jun 15',
      formatTime: () => '2:00 PM',
    });
    const raw = serializeHomeScreenWidgetSnapshot(snapshot);
    expect(parseHomeScreenWidgetSnapshot(raw)?.slug).toBe('spa-one');
    expect(parseHomeScreenWidgetSnapshot('not-json')).toBeNull();
    expect(parseHomeScreenWidgetSnapshot(JSON.stringify({ version: 99 }))).toBeNull();
  });
});
