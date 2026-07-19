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
  // `normalizeEnabledLocales` always yields a non-empty list.
  return enabledLocales.includes(value) ? value : enabledLocales[0]!;
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

  // e2e-bug.166 — always trust SSR `initialLocale` on first paint. Reading
  // `document.cookie` in the useState initializer (via `typeof window`) causes
  // hydration mismatches when the cookie disagrees with the server pass
  // (common after Stripe/OAuth return navigations).
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    coerceLocale(initialLocale, enabledLocales),
  );

  useEffect(() => {
    const stored = readScopedCookie(localeCookie);
    queueMicrotask(() => {
      setLocaleState((current) => {
        if (stored) return coerceLocale(stored, enabledLocales);
        return coerceLocale(current, enabledLocales);
      });
    });
  }, [enabledLocales, localeCookie]);

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
