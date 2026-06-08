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

export function useTenantBootstrap() {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const location = useLocation();
  const setProfile = useTenantStore((s) => s.setProfile);
  const profile = useTenantStore((s) => s.profile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);

  const slug = routeSlug?.toLowerCase() ?? '';

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
    setLoading(true);
    setError('');
    setFromCache(false);

    void fetchPublicProfile(slug)
      .then((tenant) => {
        if (cancelled) return;
        if (!tenant.publicBookingEnabled) {
          setError('Online booking is not available for this business');
          setProfile(null);
          return;
        }
        setProfile(tenant);
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
        const cached = loadCachedTenantSnapshot(slug);
        if (cached?.profile.publicBookingEnabled) {
          setProfile(cached.profile);
          setFromCache(true);
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
