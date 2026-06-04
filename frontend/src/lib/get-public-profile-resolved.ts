import { getPublicProfile } from '@/lib/public-api';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';

/** Fetch public tenant profile with visitor/business locale applied to localized fields. */
export async function getPublicProfileResolved(slug: string) {
  const base = await getPublicProfile(slug);
  const locale = await resolvePublicBookingLocale(base.locale);
  if (!locale) return base;
  return getPublicProfile(slug, locale);
}
