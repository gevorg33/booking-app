import { cookies } from 'next/headers';
import { PUBLIC_LOCALE_COOKIE, type AppLocale } from '@/i18n';
import { resolveTenantLocale } from '@/lib/business-locale';

function toLocaleSettings(
  businessSettings?: Record<string, unknown> | string | null,
): Record<string, unknown> | null | undefined {
  if (typeof businessSettings === 'string') {
    return { locale: businessSettings, defaultLocale: businessSettings };
  }
  return businessSettings;
}

/** SSR locale for public booking: public-locale cookie, else business default (not dashboard app-locale). */
export async function resolvePublicBookingLocale(
  businessSettings?: Record<string, unknown> | string | null,
): Promise<AppLocale> {
  const cookieStore = await cookies();
  const publicVal = cookieStore.get(PUBLIC_LOCALE_COOKIE)?.value ?? null;
  return resolveTenantLocale(publicVal, toLocaleSettings(businessSettings));
}
