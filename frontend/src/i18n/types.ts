export type AppLocale = 'en' | 'hy' | 'ru';

export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  hy: 'Հայերեն',
  ru: 'Русский',
};

export const LOCALE_COOKIE = 'app-locale';

export type MessageTree = { [key: string]: string | MessageTree };
