'use client';

import { LanguageSwitcher } from '@/components/language-switcher';
import { updatePublicCustomerPreferredLocale } from '@/lib/public-api';
import { readPublicCookieLocale } from '@/lib/public-locale-cookie';
import type { AppLocale } from '@/i18n';

function syncLocaleToCustomerIfSignedIn(slug: string, locale: AppLocale) {
  if (typeof window === 'undefined') return;
  const storageKey = `public-customer:${slug}`;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const session = JSON.parse(raw) as { token?: string };
    if (!session.token) return;
  } catch {
    return;
  }
  void updatePublicCustomerPreferredLocale(slug, locale).catch(() => {
    // best-effort; cookie remains source of truth for anonymous visitors
  });
}

/**
 * Persists locale via LanguageSwitcher, then reloads so server-rendered public pages
 * refetch services (and categories) with the matching ?locale= query.
 */
export function PublicBookingLanguageSwitcher({ slug }: { slug: string }) {
  return (
    <LanguageSwitcher
      variant="light"
      compact
      onChange={(locale) => {
        syncLocaleToCustomerIfSignedIn(slug, locale);
        window.location.reload();
      }}
    />
  );
}

/** Preferred locale from public booking cookie for auth sync on sign-in. */
export function readPublicBookingPreferredLocaleForAuth(): AppLocale | null {
  return readPublicCookieLocale();
}
