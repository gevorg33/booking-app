/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest';
import {
  dispatchConsumerPushEffects,
  dispatchConsumerPushNavigation,
  parseConsumerPushPayload,
  resolveConsumerPushRoute,
  shouldShowConsumerForegroundPush,
} from './consumer-native-push.util.js';

describe('consumer-native-push.util', () => {
  it('parses clinic and salon transactional push payloads', () => {
    expect(
      parseConsumerPushPayload({
        pushType: 'booking_confirmed',
        url: 'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
        bookingId: 'b-1',
        foregroundHint: 'Confirmed manicure',
      }),
    ).toMatchObject({
      pushType: 'booking_confirmed',
      bookingId: 'b-1',
      foregroundHint: 'Confirmed manicure',
    });
  });

  it('shows foreground hints for salon and clinic push types', () => {
    expect(shouldShowConsumerForegroundPush({ pushType: 'booking_reminder' })).toBe(
      true,
    );
    expect(shouldShowConsumerForegroundPush({ pushType: 'gift_card_received' })).toBe(
      true,
    );
    expect(shouldShowConsumerForegroundPush({ pushType: 'win_back' })).toBe(true);
    expect(shouldShowConsumerForegroundPush({})).toBe(false);
  });

  it('resolves deep links to in-app routes', () => {
    expect(
      resolveConsumerPushRoute('optischedule://book/city-clinic/results'),
    ).toBe('/s/city-clinic/results');
    expect(
      resolveConsumerPushRoute(
        'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
      ),
    ).toBe('/s/glow-nails/manage?bookingId=b-1&token=tok');
    expect(
      resolveConsumerPushRoute('optischedule://book/glow-nails/book/svc-1'),
    ).toBe('/s/glow-nails/book/svc-1');
    expect(resolveConsumerPushRoute('optischedule://book/glow-nails')).toBe(
      '/s/glow-nails',
    );
  });

  it('dispatches navigation events for push taps', () => {
    const paths: string[] = [];
    const handler = (event: Event) => {
      paths.push((event as CustomEvent<{ path: string }>).detail.path);
    };
    window.addEventListener('consumer:push-navigate', handler);
    dispatchConsumerPushNavigation('optischedule://book/city-clinic/results');
    window.removeEventListener('consumer:push-navigate', handler);
    expect(paths).toEqual(['/s/city-clinic/results']);
  });

  it('dispatches push effects from payload url', () => {
    const handler = vi.fn();
    window.addEventListener('consumer:push-navigate', handler);
    dispatchConsumerPushEffects({
      pushType: 'booking_confirmed',
      url: 'optischedule://book/glow-nails/manage?bookingId=b-1&token=tok',
    });
    window.removeEventListener('consumer:push-navigate', handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
