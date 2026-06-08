/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest';
import {
  CONSUMER_FOREGROUND_PUSH_EVENT,
  foregroundConsumerPushMessage,
  showConsumerForegroundPushBanner,
} from './consumer-push-foreground.util.js';
import {
  CONSUMER_PUSH_NAVIGATE_EVENT,
  dispatchConsumerPushEffects,
} from './consumer-native-push.util.js';

describe('consumer-push-foreground.util', () => {
  it('prefers foreground hint over notification body', () => {
    expect(
      foregroundConsumerPushMessage(
        { foregroundHint: 'Reminder: manicure tomorrow' },
        { title: 'Glow Nails', body: 'Appointment reminder' },
      ),
    ).toBe('Reminder: manicure tomorrow');
  });

  it('dispatches foreground push banner event', () => {
    const handler = vi.fn();
    window.addEventListener(CONSUMER_FOREGROUND_PUSH_EVENT, handler);
    showConsumerForegroundPushBanner(
      { pushType: 'booking_confirmed', foregroundHint: 'Confirmed' },
      { title: 'Glow', body: 'Booking confirmed' },
    );
    window.removeEventListener(CONSUMER_FOREGROUND_PUSH_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('supports view-tap navigation from foreground payload', () => {
    const paths: string[] = [];
    const onNavigate = (event: Event) => {
      paths.push((event as CustomEvent<{ path: string }>).detail.path);
    };
    window.addEventListener(CONSUMER_PUSH_NAVIGATE_EVENT, onNavigate);
    dispatchConsumerPushEffects({
      pushType: 'booking_confirmed',
      url: 'optischedule://book/glow-nails/manage?bookingId=b1&token=tok',
    });
    window.removeEventListener(CONSUMER_PUSH_NAVIGATE_EVENT, onNavigate);
    expect(paths).toEqual(['/s/glow-nails/manage?bookingId=b1&token=tok']);
  });
});
