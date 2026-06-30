import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

import { Capacitor } from '@capacitor/core';
import { isProviderTabPath, replaceProviderRoute } from './provider-ion-navigation.util';

describe('isProviderTabPath', () => {
  it('detects provider tab routes', () => {
    expect(isProviderTabPath('/tabs/today')).toBe(true);
    expect(isProviderTabPath('/tabs/patients/cust-1')).toBe(true);
    expect(isProviderTabPath('/login')).toBe(false);
  });
});

describe('replaceProviderRoute', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('uses history.replace on web', () => {
    const replace = vi.fn();
    replaceProviderRoute({ replace } as never, undefined, '/tabs/today');
    expect(replace).toHaveBeenCalledWith('/tabs/today', undefined);
  });

  it('uses ionRouter.push on native', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const replace = vi.fn();
    const ionPush = vi.fn();
    replaceProviderRoute({ replace } as never, { push: ionPush }, '/tabs/profile');
    expect(ionPush).toHaveBeenCalledWith('/tabs/profile', 'root', 'replace');
    expect(replace).toHaveBeenCalledWith('/tabs/profile', undefined);
  });
});
