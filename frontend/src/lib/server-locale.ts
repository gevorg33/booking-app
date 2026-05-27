import { cookies } from 'next/headers';
import { LOCALE_COOKIE, SUPPORTED_LOCALES, type AppLocale } from '@/i18n';

export async function getServerLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return SUPPORTED_LOCALES.includes(value as AppLocale) ? (value as AppLocale) : 'en';
}
