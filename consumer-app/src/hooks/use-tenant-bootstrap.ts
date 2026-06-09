import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchPublicProfile, fetchPublicServices } from '../services/public-api.js';
import { useTenantStore } from '../stores/tenant-store.js';
import { isValidSlug } from '../lib/deep-link.js';
import {
  loadCachedTenantSnapshot,
  saveCachedTenantSnapshot,
} from '../lib/cached-tenant-data.util.js';
import { captureReferralFromSearch } from '../lib/consumer-referral.util.js';

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
    if (!slug || !isValidSlug(slug)) {
      setError('Invalid salon link');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setError('');

    const cachedSnapshot = loadCachedTenantSnapshot(slug);
    const storeReady = hasReadyProfile(slug);

    if (storeReady) {
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
          setError('Online booking is not available for this business');
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
        if (hasReadyProfile(slug) || cachedSnapshot?.profile.publicBookingEnabled) {
          if (!hasReadyProfile(slug) && cachedSnapshot) {
            setProfile(cachedSnapshot.profile);
            setFromCache(true);
          }
          return;
        }
        setError(err instanceof Error ? err.message : 'Salon not found');
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
