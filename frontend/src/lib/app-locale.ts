import type { AppLocale } from '@/i18n/types';

const SUPPORTED: AppLocale[] = ['en', 'hy', 'ru'];

/** Map app locale to BCP 47 tag for Intl formatters. */
export function toIntlLocale(locale?: string): string | undefined {
  if (locale === 'hy') return 'hy-AM';
  if (locale === 'ru') return 'ru-RU';
  if (locale === 'en') return 'en-GB';
  return undefined;
}

/** Explicit locale, else document.lang from I18nProvider, else undefined (DD/MM fallback). */
export function resolveDisplayLocale(explicit?: string): string | undefined {
  if (explicit && SUPPORTED.includes(explicit as AppLocale)) return explicit;
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.lang;
    if (SUPPORTED.includes(lang as AppLocale)) return lang;
  }
  return undefined;
}
