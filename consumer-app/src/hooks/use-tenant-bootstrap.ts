import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchPublicProfile, fetchPublicServices } from '../services/public-api.js';
import { useTenantStore } from '../stores/tenant-store.js';
import { isValidSlug } from '../lib/deep-link.js';
import {
  loadCachedTenantSnapshot,
  saveCachedTenantSnapshot,
} from '../lib/cached-tenant-data.util.js';
import { tenantDateFormatPreference, setActiveBusinessDateFormats } from '../lib/business-date-format.js';
import { captureReferralFromSearch } from '../lib/consumer-referral.util.js';
import {
  resolveTenantBootstrapErrorMessage,
  resolveTenantBootstrapFetchFailure,
} from '../lib/tenant-bootstrap-cache.util.js';
import { getConsumerCopy } from '../lib/copy.js';
import { resolveAppConsumerLocale } from '../lib/tenant-locale.js';

function applyTenantDateFormats(profile: { dateFormat?: string; timeFormat?: string } | null): void {
  if (!profile) return;
  const { dateFormat, timeFormat } = tenantDateFormatPreference(profile);
  setActiveBusinessDateFormats(dateFormat, timeFormat);
}

function hasReadyProfile(slug: string): boolean {
  const profile = useTenantStore.getState().profile;
  return profile?.slug === slug && profile.publicBookingEnabled === true;
}

export function useTenantBootstrap() {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const location = useLocation();
  const setProfile = useTenantStore((s) => s.setProfile);
  const profile = useTenantStore((s) => s.profile);
  const slug = routeSlug?.toLowerCase() ?? '';
  const [loading, setLoading] = useState(() => {
    if (!slug || !isValidSlug(slug)) return false;
    return !hasReadyProfile(slug);
  });
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!slug || !isValidSlug(slug)) return;
    captureReferralFromSearch(location.search, slug);
  }, [location.search, slug]);

  useEffect(() => {
    const copy = getConsumerCopy(resolveAppConsumerLocale());
    if (!slug || !isValidSlug(slug)) {
      setError(copy.invalidSalonLink);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setError('');

    const cachedSnapshot = loadCachedTenantSnapshot(slug);
    const storeReady = hasReadyProfile(slug);

    if (storeReady) {
      applyTenantDateFormats(useTenantStore.getState().profile);
      setLoading(false);
      setFromCache(false);
    } else if (cachedSnapshot?.profile.publicBookingEnabled) {
      setProfile(cachedSnapshot.profile);
      setFromCache(true);
      setLoading(false);
    } else {
      setLoading(true);
      setFromCache(false);
    }

    void fetchPublicProfile(slug)
      .then((tenant) => {
        if (cancelled) return;
        if (!tenant.publicBookingEnabled) {
          setError(copy.salonBookingUnavailable);
          setProfile(null);
          return;
        }
        setProfile(tenant);
        setFromCache(false);
        void fetchPublicServices(slug)
          .then((services) => {
            if (cancelled) return;
            saveCachedTenantSnapshot({ slug, profile: tenant, services });
          })
          .catch(() => {
            saveCachedTenantSnapshot({ slug, profile: tenant, services: [] });
          });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const storeReady = hasReadyProfile(slug);
        const fallback = resolveTenantBootstrapFetchFailure({
          storeReady,
          hasCachedEnabledProfile: Boolean(
            cachedSnapshot?.profile.publicBookingEnabled,
          ),
        });
        // e2e-bug.23 — failed live refresh while showing store/cache data → fromCache banner.
        if (fallback.keepShowingProfile) {
          if (fallback.hydrateFromCache && cachedSnapshot) {
            setProfile(cachedSnapshot.profile);
          }
          setFromCache(fallback.fromCache);
          return;
        }
        // e2e-bug.20 — never surface raw axios 404 text for a mistyped salon code.
        setError(
          resolveTenantBootstrapErrorMessage(err, {
            salonNotFound: copy.salonNotFound,
          }),
        );
        setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, setProfile]);

  return { slug, profile, loading, error, fromCache };
}
