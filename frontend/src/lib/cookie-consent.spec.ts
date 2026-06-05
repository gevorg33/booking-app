import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  cookieConsentStorageKey,
  hasAcceptedCookies,
  readCookieConsent,
  writeCookieConsent,
} from './cookie-consent';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    },
  });
}

describe('cookie-consent', () => {
  const slug = 'salon-test';

  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  afterEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  it('builds storage key per tenant slug', () => {
    expect(cookieConsentStorageKey(slug)).toBe('cookie-consent-salon-test');
  });

  it('reads and writes consent choice', () => {
    expect(readCookieConsent(slug)).toBeNull();
    writeCookieConsent(slug, 'accepted');
    expect(readCookieConsent(slug)).toBe('accepted');
    expect(hasAcceptedCookies(slug)).toBe(true);
    writeCookieConsent(slug, 'rejected');
    expect(hasAcceptedCookies(slug)).toBe(false);
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem(cookieConsentStorageKey(slug), 'maybe');
    expect(readCookieConsent(slug)).toBeNull();
  });

  it('returns null when storage is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: null,
    });
    expect(readCookieConsent(slug)).toBeNull();
    expect(() => writeCookieConsent(slug, 'accepted')).not.toThrow();
  });

  it('returns null when accessing localStorage throws', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    expect(readCookieConsent(slug)).toBeNull();
    expect(() => writeCookieConsent(slug, 'accepted')).not.toThrow();
  });

  it('swallows storage read/write errors', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
    });
    expect(readCookieConsent(slug)).toBeNull();
    expect(() => writeCookieConsent(slug, 'accepted')).not.toThrow();
  });
});
