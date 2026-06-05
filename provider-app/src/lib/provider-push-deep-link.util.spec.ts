import { describe, expect, it } from 'vitest';
import {
  PROVIDER_AI_PROMPT_EVENT,
  dispatchProviderPushEffects,
  isBookingCreatedPush,
  parseProviderPushPayload,
  providerTabPathFromPushUrl,
  resolveProviderPushRoute,
} from './provider-push-deep-link.util';

describe('provider-push-deep-link.util', () => {
  it('parses FCM data payload', () => {
    expect(parseProviderPushPayload(undefined)).toEqual({});
    expect(parseProviderPushPayload({ url: '  ', bookingId: 42 })).toEqual({});
    expect(
      parseProviderPushPayload({
        url: '/provider/today?bookingId=b1',
        bookingId: 'b1',
        aiPrompt: 'Add buffer',
        pushType: 'booking_created',
        foregroundHint: ' Hint ',
        actionId: 'confirm',
      }),
    ).toMatchObject({
      bookingId: 'b1',
      aiPrompt: 'Add buffer',
      pushType: 'booking_created',
      foregroundHint: 'Hint',
      actionId: 'confirm',
    });
  });

  it('maps provider URLs to tab routes', () => {
    expect(providerTabPathFromPushUrl('/provider/today?bookingId=b1')).toBe(
      '/tabs/today?bookingId=b1',
    );
    expect(providerTabPathFromPushUrl('/provider/schedule')).toBe('/tabs/schedule');
    expect(providerTabPathFromPushUrl('/provider/profile')).toBe('/tabs/profile');
    expect(providerTabPathFromPushUrl('https://app.local/provider/gift-cards')).toBe(
      '/tabs/gift-cards',
    );
    expect(providerTabPathFromPushUrl('https://app.local/provider')).toBe('/tabs/today');
    expect(providerTabPathFromPushUrl('https://app.local/provider/today')).toBe('/tabs/today');
    expect(providerTabPathFromPushUrl('https://app.local/not-provider')).toBe('/tabs/today');
    expect(providerTabPathFromPushUrl('bad')).toBe('/tabs/today');
    expect(providerTabPathFromPushUrl('http://%zz/today')).toBe('/tabs/today');
    expect(providerTabPathFromPushUrl('')).toBe('/tabs/today');
    expect(providerTabPathFromPushUrl('::::/schedule/list')).toBe('/tabs/schedule');
    expect(providerTabPathFromPushUrl('::::/profile/settings')).toBe('/tabs/profile');
    expect(providerTabPathFromPushUrl('::::/gift-cards')).toBe('/tabs/gift-cards');
    expect(providerTabPathFromPushUrl('/tabs/today?x=1')).toBe('/tabs/today?x=1');
  });

  it('resolves routes from url or booking id', () => {
    expect(resolveProviderPushRoute({})).toBe('/tabs/today');
    expect(resolveProviderPushRoute({ bookingId: 'b2' })).toBe('/tabs/today?bookingId=b2');
    expect(resolveProviderPushRoute({ url: '/provider/schedule' })).toBe('/tabs/schedule');
    expect(isBookingCreatedPush({ pushType: 'booking_created' })).toBe(true);
    expect(isBookingCreatedPush({ pushType: 'end_of_day' })).toBe(false);
  });

  it('dispatches navigation, booking, and AI events', () => {
    const events: string[] = [];
    const handler = (e: Event) => events.push((e as CustomEvent).type);
    window.addEventListener('provider:push-navigate', handler);
    window.addEventListener('provider:open-booking', handler);
    window.addEventListener(PROVIDER_AI_PROMPT_EVENT, handler);

    dispatchProviderPushEffects({ url: '/provider/schedule' });
    expect(events).toEqual(['provider:push-navigate']);

    events.length = 0;
    dispatchProviderPushEffects({ bookingId: 'b-only' });
    expect(events).toContain('provider:push-navigate');
    expect(events).toContain('provider:open-booking');

    events.length = 0;
    dispatchProviderPushEffects({
      url: '/provider/today?bookingId=b1',
      bookingId: 'b1',
      aiPrompt: 'Summarize today',
    });
    expect(events).toContain('provider:ai-prompt');

    window.removeEventListener('provider:push-navigate', handler);
    window.removeEventListener('provider:open-booking', handler);
    window.removeEventListener(PROVIDER_AI_PROMPT_EVENT, handler);
  });
});
