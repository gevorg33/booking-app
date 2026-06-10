import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureReferralFromSearch,
  readPendingReferralCode,
  readRefereePromoCode,
  saveRefereePromoCode,
} from './public-referral.util';

vi.mock('@/lib/app-analytics', () => ({
  trackAppAnalyticsEvent: vi.fn(),
}));

function installStorageMock(): void {
  const localStore = new Map<string, string>();
  const sessionStore = new Map<string, string>();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => localStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        localStore.set(key, value);
      },
      removeItem: (key: string) => {
        localStore.delete(key);
      },
      clear: () => localStore.clear(),
    },
  });

  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => sessionStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        sessionStore.set(key, value);
      },
      removeItem: (key: string) => {
        sessionStore.delete(key);
      },
      clear: () => sessionStore.clear(),
    },
  });
}

describe('public-referral.util', () => {
  beforeEach(() => {
    installStorageMock();
  });

  it('captures referral code from search params', () => {
    const code = captureReferralFromSearch('?ref=friend10&src=referral', 'demo-salon');
    expect(code).toBe('FRIEND10');
    expect(readPendingReferralCode('demo-salon')).toBe('FRIEND10');
  });

  it('stores referee promo code in session storage', () => {
    saveRefereePromoCode('demo-salon', 'welcome10');
    expect(readRefereePromoCode('demo-salon')).toBe('WELCOME10');
  });
});
