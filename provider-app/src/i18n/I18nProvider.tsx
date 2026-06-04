import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppLocale } from '@shared-i18n/types';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@shared-i18n/types';
import { translate } from '@shared-i18n/translate';
import { getMessages } from './catalog';
import { normalizeAppLocale, resolveProviderAppLocale } from './resolve-locale';
import { writeStoredLocale } from './locale-storage';
import { useAuthStore } from '../services/auth-store';

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale, options?: { persist?: boolean }) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locales: AppLocale[];
  localeLabels: typeof LOCALE_LABELS;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const userLocale = useAuthStore((s) => s.user?.locale);
  const businessLocale = useAuthStore((s) => s.business?.locale);

  const [locale, setLocaleState] = useState<AppLocale>(() =>
    resolveProviderAppLocale(userLocale, businessLocale),
  );

  useEffect(() => {
    const resolved = resolveProviderAppLocale(userLocale, businessLocale);
    setLocaleState(resolved);
    writeStoredLocale(resolved);
  }, [userLocale, businessLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: AppLocale, options?: { persist?: boolean }) => {
    const normalized = normalizeAppLocale(next);
    setLocaleState(normalized);
    if (options?.persist !== false) writeStoredLocale(normalized);
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
