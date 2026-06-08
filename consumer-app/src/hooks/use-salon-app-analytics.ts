import { useEffect } from 'react';
import { configureAppAnalytics, track } from '../lib/app-analytics.js';
import { readDefaultLocale } from '../lib/tenant-locale.js';

export function useSalonAppAnalytics(
  slug: string,
  profile: { locale?: string; defaultLocale?: string; enabledLocales?: string[] } | null,
) {
  useEffect(() => {
    if (!slug || !profile) return;
    configureAppAnalytics({
      appSurface: 'consumer_app',
      tenantSlug: slug,
      locale: readDefaultLocale(profile),
    });
    track('viewed_salon');
  }, [slug, profile]);
}
