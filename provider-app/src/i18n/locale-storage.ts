import type { AppLocale } from '@shared-i18n/types';

const STORAGE_KEY = 'provider-app-locale';

export function readStoredLocale(): AppLocale | null {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === 'en' || value === 'hy' || value === 'ru') return value;
  return null;
}

export function writeStoredLocale(locale: AppLocale): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, locale);
}

export function clearStoredLocale(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
