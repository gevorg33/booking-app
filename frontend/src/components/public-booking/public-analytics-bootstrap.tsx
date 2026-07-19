'use client';

import { useEffect } from 'react';
import {
  configureAppAnalytics,
  trackAppAnalyticsEvent,
} from '@/lib/app-analytics';
import type { PublicBusinessProfile } from '@/lib/public-api';

/**
 * Wires public-web adoption analytics and syncs cookie-banner consent so
 * reject/accept actually gates non-essential tracking for the session.
 */
export function PublicAnalyticsBootstrap({
  slug,
  tenant,
}: {
  slug: string;
  tenant: Pick<PublicBusinessProfile, 'id' | 'locale' | 'privacy'>;
}) {
  const bannerEnabled = tenant.privacy?.cookieBannerEnabled === true;

  useEffect(() => {
    configureAppAnalytics({
      businessId: tenant.id,
      tenantSlug: slug,
      locale: tenant.locale,
      appSurface: 'public_web',
      cookieBannerEnabled: bannerEnabled,
    });
    trackAppAnalyticsEvent('viewed_salon');
  }, [bannerEnabled, slug, tenant.id, tenant.locale]);

  return null;
}
