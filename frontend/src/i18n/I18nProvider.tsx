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
  enabledLocales: AppLocale[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

function normalizeEnabledLocales(
  enabledLocales?: readonly AppLocale[],
): AppLocale[] {
  if (!enabledLocales || enabledLocales.length === 0) return [...SUPPORTED_LOCALES];
  return [...enabledLocales];
}

function coerceLocale(
  value: AppLocale,
  enabledLocales: readonly AppLocale[],
): AppLocale {
  return enabledLocales.includes(value) ? value : (enabledLocales[0] ?? 'en');
}

export function I18nProvider({
  children,
  initialLocale = 'en',
  localeCookie = 'app',
  enabledLocales: enabledLocalesProp,
}: {
  children: ReactNode;
  initialLocale?: AppLocale;
  /** Which cookie stores the visitor override (`public` on booking pages). */
  localeCookie?: LocaleCookieScope;
  /** Tenant-enabled locales; when set, switcher and persistence are constrained. */
  enabledLocales?: readonly AppLocale[];
}) {
  const enabledLocales = useMemo(
    () => normalizeEnabledLocales(enabledLocalesProp),
    [enabledLocalesProp],
  );

  const [locale, setLocaleState] = useState<AppLocale>(() => {
    const fallback = coerceLocale(initialLocale, enabledLocales);
    if (typeof window === 'undefined') return fallback;
    const stored = readScopedCookie(localeCookie);
    return stored ? coerceLocale(stored, enabledLocales) : fallback;
  });

  useEffect(() => {
    queueMicrotask(() => setLocaleState((current) => coerceLocale(current, enabledLocales)));
  }, [enabledLocales]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: AppLocale, options?: { persist?: boolean }) => {
      const normalized = coerceLocale(next, enabledLocales);
      setLocaleState(normalized);
      if (options?.persist !== false) writeScopedCookie(localeCookie, normalized);
    },
    [enabledLocales, localeCookie],
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
      locales: enabledLocales,
      localeLabels: LOCALE_LABELS,
      enabledLocales,
    }),
    [enabledLocales, locale, setLocale, t],
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
