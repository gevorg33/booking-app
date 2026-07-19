import { describe, expect, it, beforeEach } from 'vitest';
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

describe('Sprint 37 — cookie consent scenario matrix', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  it.each([
    {
      id: 'first-visit',
      slug: 'salon-a',
      steps: [] as Array<'accepted' | 'rejected'>,
      accepted: false,
      stored: null,
      showBanner: true,
      trackingWithBanner: false,
    },
    {
      id: 'accept-banner',
      slug: 'clinic-b',
      steps: ['accepted'] as const,
      accepted: true,
      stored: 'accepted' as const,
      showBanner: false,
      trackingWithBanner: true,
    },
    {
      id: 'reject-banner',
      slug: 'spa-c',
      steps: ['rejected'] as const,
      accepted: false,
      stored: 'rejected' as const,
      showBanner: false,
      trackingWithBanner: false,
    },
    {
      id: 'change-mind-reject-to-accept',
      slug: 'dental-d',
      steps: ['rejected', 'accepted'] as const,
      accepted: true,
      stored: 'accepted' as const,
      showBanner: false,
      trackingWithBanner: true,
    },
    {
      id: 'tenant-isolation',
      slug: 'polyclinic-e',
      steps: ['accepted'] as const,
      otherSlug: 'other-f',
      accepted: true,
      stored: 'accepted' as const,
      showBanner: false,
      trackingWithBanner: true,
    },
    {
      id: 'revisit-after-reject-no-reprompt',
      slug: 'massage-g',
      steps: ['rejected'] as const,
      accepted: false,
      stored: 'rejected' as const,
      showBanner: false,
      trackingWithBanner: false,
    },
  ])(
    'cookie consent flow for $id',
    ({
      slug,
      steps,
      accepted,
      stored,
      otherSlug,
      showBanner,
      trackingWithBanner,
    }) => {
      for (const choice of steps) {
        writeCookieConsent(slug, choice);
      }

      expect(readCookieConsent(slug)).toBe(stored);
      expect(hasAcceptedCookies(slug)).toBe(accepted);
      expect(shouldShowCookieConsentBanner(slug, true)).toBe(showBanner);
      expect(
        allowsNonEssentialTracking(slug, { cookieBannerEnabled: true }),
      ).toBe(trackingWithBanner);
      // Banner off → tracking allowed without a stored choice.
      expect(
        allowsNonEssentialTracking(slug, { cookieBannerEnabled: false }),
      ).toBe(true);

      if (otherSlug) {
        expect(readCookieConsent(otherSlug)).toBeNull();
        expect(shouldShowCookieConsentBanner(otherSlug, true)).toBe(true);
        expect(cookieConsentStorageKey(slug)).not.toBe(
          cookieConsentStorageKey(otherSlug),
        );
      }
    },
  );
});
