'use client';

import { useEffect } from 'react';
import { LOCALE_COOKIE, SUPPORTED_LOCALES, useI18n, type AppLocale } from '@/i18n';

function hasLocaleCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${LOCALE_COOKIE}=`);
}

export function PublicLocaleBootstrap({ businessLocale }: { businessLocale?: string }) {
  const { setLocale } = useI18n();

  useEffect(() => {
    if (hasLocaleCookie()) return;
    const resolved = SUPPORTED_LOCALES.includes(businessLocale as AppLocale)
      ? (businessLocale as AppLocale)
      : 'en';
    setLocale(resolved);
  }, [businessLocale, setLocale]);

  return null;
}
