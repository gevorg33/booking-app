import { describe, expect, it } from 'vitest';
import { providerRouteFromPath, providerTabPath, resolveProviderTabId } from './provider-tab-route.util';

describe('provider-tab-route.util', () => {
  it('maps paths to tab ids', () => {
    expect(resolveProviderTabId('/tabs/today')).toBe('today');
    expect(resolveProviderTabId('/tabs/gift-cards')).toBe('gift-cards');
    expect(resolveProviderTabId('/tabs/calendar')).toBe('calendar');
    expect(resolveProviderTabId('/tabs/schedule')).toBe('schedule');
    expect(resolveProviderTabId('/tabs/profile')).toBe('profile');
    expect(resolveProviderTabId('/tabs/patients/c1')).toBe('patients');
  });

  it('builds tab paths', () => {
    expect(providerTabPath('today')).toBe('/tabs/today');
    expect(providerTabPath('profile')).toBe('/tabs/profile');
  });

  it('maps AI quick-chip routes', () => {
    expect(providerRouteFromPath('/tabs/today')).toBe('today');
    expect(providerRouteFromPath('/tabs/calendar')).toBe('schedule');
    expect(providerRouteFromPath('/tabs/profile/settings')).toBe('profile');
    expect(providerRouteFromPath('/tabs/gift-cards/list')).toBe('gift-cards');
  });
});
