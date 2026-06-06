import { describe, expect, it, beforeEach } from 'vitest';
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
    },
    {
      id: 'accept-banner',
      slug: 'clinic-b',
      steps: ['accepted'] as const,
      accepted: true,
      stored: 'accepted' as const,
    },
    {
      id: 'reject-banner',
      slug: 'spa-c',
      steps: ['rejected'] as const,
      accepted: false,
      stored: 'rejected' as const,
    },
    {
      id: 'change-mind-reject-to-accept',
      slug: 'dental-d',
      steps: ['rejected', 'accepted'] as const,
      accepted: true,
      stored: 'accepted' as const,
    },
    {
      id: 'tenant-isolation',
      slug: 'polyclinic-e',
      steps: ['accepted'] as const,
      otherSlug: 'other-f',
      accepted: true,
      stored: 'accepted' as const,
    },
  ])(
    'cookie consent flow for $id',
    ({ slug, steps, accepted, stored, otherSlug }) => {
      for (const choice of steps) {
        writeCookieConsent(slug, choice);
      }

      expect(readCookieConsent(slug)).toBe(stored);
      expect(hasAcceptedCookies(slug)).toBe(accepted);

      if (otherSlug) {
        expect(readCookieConsent(otherSlug)).toBeNull();
        expect(cookieConsentStorageKey(slug)).not.toBe(
          cookieConsentStorageKey(otherSlug),
        );
      }
    },
  );
});
