'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  type AppLocale,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  getMessages,
  translate,
} from '@/i18n';
import { readCookieLocale, writeCookieLocale } from '@/lib/locale-cookie';
import { readPublicCookieLocale, writePublicCookieLocale } from '@/lib/public-locale-cookie';

export type LocaleCookieScope = 'app' | 'public';

function readScopedCookie(scope: LocaleCookieScope): AppLocale | null {
  return scope === 'public' ? readPublicCookieLocale() : readCookieLocale();
}

function writeScopedCookie(scope: LocaleCookieScope, locale: AppLocale): void {
  if (scope === 'public') writePublicCookieLocale(locale);
  else writeCookieLocale(locale);
}

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale, options?: { persist?: boolean }) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locales: AppLocale[];
  localeLabels: typeof LOCALE_LABELS;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = 'en',
  localeCookie = 'app',
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
  /** Which cookie stores the visitor override (`public` on booking pages). */
  localeCookie?: LocaleCookieScope;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    if (typeof window === 'undefined') return initialLocale;
    return readScopedCookie(localeCookie) ?? initialLocale;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: AppLocale, options?: { persist?: boolean }) => {
      setLocaleState(next);
      if (options?.persist !== false) writeScopedCookie(localeCookie, next);
    },
    [localeCookie],
  );

  const catalog = useMemo(() => getMessages(locale), [locale]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(catalog, key, vars),
    [catalog],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      locales: SUPPORTED_LOCALES,
      localeLabels: LOCALE_LABELS,
    }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useOptionalI18n() {
  return useContext(I18nContext);
}
