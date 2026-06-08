import { describe, expect, it } from 'vitest';
import { providerRouteFromPath } from './provider-ai-shell.util';

describe('provider-ai-shell.util', () => {
  it('maps tab paths to quick-chip routes', () => {
    expect(providerRouteFromPath('/tabs/today')).toBe('today');
    expect(providerRouteFromPath('/tabs/calendar')).toBe('schedule');
    expect(providerRouteFromPath('/tabs/schedule/calendar')).toBe('schedule');
    expect(providerRouteFromPath('/tabs/profile/settings')).toBe('profile');
    expect(providerRouteFromPath('/tabs/gift-cards/list')).toBe('gift-cards');
    expect(providerRouteFromPath('/unknown')).toBe('today');
  });
});
