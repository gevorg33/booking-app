export type AppLocale = 'en' | 'hy' | 'ru';

export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  hy: 'Հայերեն',
  ru: 'Русский',
};

export const LOCALE_COOKIE = 'app-locale';

/** Visitor language on /book and /embed (separate from dashboard app-locale). */
export const PUBLIC_LOCALE_COOKIE = 'public-locale';

export type MessageTree = { [key: string]: string | MessageTree };
