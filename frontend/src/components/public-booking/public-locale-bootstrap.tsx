'use client';

import { useEffect } from 'react';
import { SUPPORTED_LOCALES, useI18n, type AppLocale } from '@/i18n';
import { readCookieLocale } from '@/lib/locale-cookie';

/**
 * Applies the business default locale only when the visitor has no saved preference.
 * Must not overwrite an existing app-locale cookie (user or prior visit).
 */
export function PublicLocaleBootstrap({ businessLocale }: { businessLocale?: string }) {
  const { setLocale } = useI18n();

  useEffect(() => {
    const stored = readCookieLocale();
    if (stored) {
      setLocale(stored, { persist: false });
      return;
    }

    const resolved = SUPPORTED_LOCALES.includes(businessLocale as AppLocale)
      ? (businessLocale as AppLocale)
      : 'en';
    setLocale(resolved, { persist: true });
  }, [businessLocale, setLocale]);

  return null;
}
