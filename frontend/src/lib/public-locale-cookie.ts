import { PUBLIC_LOCALE_COOKIE, SUPPORTED_LOCALES, type AppLocale } from '@/i18n';

function writeLocaleCookie(name: string, locale: AppLocale): void {
  if (typeof document === 'undefined') return;

  const parts = [`${name}=${locale}`, 'path=/', 'max-age=31536000', 'samesite=lax'];
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('secure');
  }

  const rootHost = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(':')[0]?.toLowerCase();
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  if (
    rootHost &&
    rootHost !== 'localhost' &&
    rootHost !== '127.0.0.1' &&
    hostname.endsWith(`.${rootHost}`)
  ) {
    parts.push(`domain=.${rootHost}`);
  }

  document.cookie = parts.join(';');
}

function readLocaleCookie(name: string): AppLocale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  const value = match?.[1]?.trim();
  return SUPPORTED_LOCALES.includes(value as AppLocale) ? (value as AppLocale) : null;
}

export function readPublicCookieLocale(): AppLocale | null {
  return readLocaleCookie(PUBLIC_LOCALE_COOKIE);
}

export function writePublicCookieLocale(locale: AppLocale): void {
  writeLocaleCookie(PUBLIC_LOCALE_COOKIE, locale);
}

/** Prefer public booking cookie, then optional business default; never dashboard app-locale. */
export function readPublicBookingLocalePreference(businessLocale?: string): AppLocale {
  const stored = readPublicCookieLocale();
  if (stored) return stored;
  if (businessLocale && SUPPORTED_LOCALES.includes(businessLocale as AppLocale)) {
    return businessLocale as AppLocale;
  }
  return 'en';
}

export function readClientLocaleForPublicApi(): string | null {
  return readPublicCookieLocale();
}
