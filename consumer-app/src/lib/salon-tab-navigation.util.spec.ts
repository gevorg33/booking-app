import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

import { Capacitor } from '@capacitor/core';
import { navigateToSalonTab } from './salon-tab-navigation.util.js';

describe('navigateToSalonTab', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('replaces history by default', () => {
    const replace = vi.fn();
    const push = vi.fn();
    navigateToSalonTab({ replace, push } as never, 'salon-a', 'services');
    expect(replace).toHaveBeenCalledWith('/s/salon-a/services');
    expect(push).not.toHaveBeenCalled();
  });

  it('can push when replace is disabled', () => {
    const replace = vi.fn();
    const push = vi.fn();
    navigateToSalonTab({ replace, push } as never, 'salon-a', 'account', undefined, {
      replace: false,
    });
    expect(push).toHaveBeenCalledWith('/s/salon-a/account');
    expect(replace).not.toHaveBeenCalled();
  });

  it('uses ionRouter.replace on native', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const ionPush = vi.fn();
    navigateToSalonTab({ replace: vi.fn() } as never, 'salon-a', 'home', { push: ionPush });
    expect(ionPush).toHaveBeenCalledWith('/s/salon-a/home', 'back', 'replace');
  });
});
