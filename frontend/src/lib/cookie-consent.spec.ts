import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  allowsNonEssentialTracking,
  cookieConsentStorageKey,
  hasAcceptedCookies,
  readCookieConsent,
  shouldShowCookieConsentBanner,
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

  it('allowsNonEssentialTracking requires accept when banner is enabled', () => {
    expect(allowsNonEssentialTracking(slug, { cookieBannerEnabled: true })).toBe(
      false,
    );
    writeCookieConsent(slug, 'rejected');
    expect(allowsNonEssentialTracking(slug, { cookieBannerEnabled: true })).toBe(
      false,
    );
    writeCookieConsent(slug, 'accepted');
    expect(allowsNonEssentialTracking(slug, { cookieBannerEnabled: true })).toBe(
      true,
    );
  });

  it('allowsNonEssentialTracking when banner is disabled (no prompt)', () => {
    expect(
      allowsNonEssentialTracking(slug, { cookieBannerEnabled: false }),
    ).toBe(true);
  });

  it('shouldShowCookieConsentBanner only when enabled and undecided', () => {
    expect(shouldShowCookieConsentBanner(slug, false)).toBe(false);
    expect(shouldShowCookieConsentBanner(slug, true)).toBe(true);
    writeCookieConsent(slug, 'rejected');
    expect(shouldShowCookieConsentBanner(slug, true)).toBe(false);
    writeCookieConsent(slug, 'accepted');
    expect(shouldShowCookieConsentBanner(slug, true)).toBe(false);
  });
});
