'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  type AppLocale,
  LOCALE_COOKIE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  getMessages,
  translate,
} from '@/i18n';

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale, options?: { persist?: boolean }) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locales: AppLocale[];
  localeLabels: typeof LOCALE_LABELS;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readCookieLocale(): AppLocale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return SUPPORTED_LOCALES.includes(value as AppLocale) ? (value as AppLocale) : null;
}

function writeCookieLocale(locale: AppLocale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function I18nProvider({
  children,
  initialLocale = 'en',
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    const stored = readCookieLocale();
    if (stored) setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: AppLocale, options?: { persist?: boolean }) => {
    setLocaleState(next);
    if (options?.persist !== false) writeCookieLocale(next);
  }, []);

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
