/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest';
import {
  dispatchConsumerPushNavigation,
  parseConsumerPushPayload,
  resolveConsumerPushRoute,
  shouldShowConsumerForegroundPush,
} from './consumer-native-push.util.js';

describe('consumer-native-push.util', () => {
  it('parses clinic transactional push payloads', () => {
    expect(
      parseConsumerPushPayload({
        pushType: 'result_ready',
        url: 'optischedule://book/city-clinic/results',
        foregroundHint: 'CBC is ready',
      }),
    ).toEqual({
      pushType: 'result_ready',
      url: 'optischedule://book/city-clinic/results',
      foregroundHint: 'CBC is ready',
      businessId: undefined,
      customerId: undefined,
      resultId: undefined,
      orderId: undefined,
    });
  });

  it('shows foreground hints for clinic push types', () => {
    expect(shouldShowConsumerForegroundPush({ pushType: 'result_ready' })).toBe(true);
    expect(shouldShowConsumerForegroundPush({ pushType: 'lab_booking_request' })).toBe(
      true,
    );
    expect(shouldShowConsumerForegroundPush({})).toBe(false);
  });

  it('resolves deep links to in-app routes', () => {
    expect(
      resolveConsumerPushRoute('optischedule://book/city-clinic/results'),
    ).toBe('/s/city-clinic/results');
    expect(
      resolveConsumerPushRoute('optischedule://book/city-clinic/lab-requests'),
    ).toBe('/s/city-clinic/lab-to-book');
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
});
