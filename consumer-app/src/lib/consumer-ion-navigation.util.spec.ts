import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

import { Capacitor } from '@capacitor/core';
import {
  backConsumerRoute,
  isSalonTabPath,
  pushConsumerRoute,
  replaceConsumerRoute,
} from './consumer-ion-navigation.util.js';

describe('isSalonTabPath', () => {
  it('detects salon tab routes', () => {
    expect(isSalonTabPath('/s/salon/home')).toBe(true);
    expect(isSalonTabPath('/s/salon/professionals')).toBe(false);
  });
});

describe('pushConsumerRoute', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('uses history.push on web', () => {
    const push = vi.fn();
    pushConsumerRoute({ push } as never, undefined, '/s/salon/book/svc-1', { foo: 1 });
    expect(push).toHaveBeenCalledWith('/s/salon/book/svc-1', { foo: 1 });
  });

  it('uses ionRouter.push only on native (no history.replace that cancels navigation)', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const replace = vi.fn();
    const push = vi.fn();
    const ionPush = vi.fn();
    const path =
      '/s/salon/professionals/services?employeeId=emp-1&startTime=2026-06-09T14%3A00%3A00.000Z';
    pushConsumerRoute({ push, replace } as never, { push: ionPush }, path);
    expect(ionPush).toHaveBeenCalledWith(path, 'forward', 'push');
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('replaceConsumerRoute', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('uses history.replace on web', () => {
    const replace = vi.fn();
    replaceConsumerRoute({ replace } as never, undefined, '/s/salon/professionals?employeeId=e1');
    expect(replace).toHaveBeenCalledWith('/s/salon/professionals?employeeId=e1', undefined);
  });
});

describe('backConsumerRoute', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  it('replaces to salon tab on web', () => {
    const replace = vi.fn();
    const goBack = vi.fn();
    backConsumerRoute({ replace, goBack, length: 3 } as never, undefined, '/s/salon/home');
    expect(replace).toHaveBeenCalledWith('/s/salon/home');
    expect(goBack).not.toHaveBeenCalled();
  });

  it('goes back between stack pages on web', () => {
    const goBack = vi.fn();
    backConsumerRoute({ goBack, length: 3 } as never, undefined, '/s/salon/professionals');
    expect(goBack).toHaveBeenCalled();
  });
});
