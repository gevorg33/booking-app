import { cookies } from 'next/headers';
import { PUBLIC_LOCALE_COOKIE, SUPPORTED_LOCALES, type AppLocale } from '@/i18n';

/** SSR locale for public booking: public-locale cookie, else business default (not dashboard app-locale). */
export async function resolvePublicBookingLocale(businessLocale?: string): Promise<AppLocale> {
  const cookieStore = await cookies();
  const publicVal = cookieStore.get(PUBLIC_LOCALE_COOKIE)?.value;
  if (SUPPORTED_LOCALES.includes(publicVal as AppLocale)) {
    return publicVal as AppLocale;
  }
  if (businessLocale && SUPPORTED_LOCALES.includes(businessLocale as AppLocale)) {
    return businessLocale as AppLocale;
  }
  return 'en';
}
