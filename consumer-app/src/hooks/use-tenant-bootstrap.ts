import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicProfile } from '../services/public-api.js';
import { useTenantStore } from '../stores/tenant-store.js';
import { isValidSlug } from '../lib/deep-link.js';

export function useTenantBootstrap() {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const setProfile = useTenantStore((s) => s.setProfile);
  const profile = useTenantStore((s) => s.profile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const slug = routeSlug?.toLowerCase() ?? '';

  useEffect(() => {
    if (!slug || !isValidSlug(slug)) {
      setError('Invalid salon link');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    void fetchPublicProfile(slug)
      .then((tenant) => {
        if (cancelled) return;
        if (!tenant.publicBookingEnabled) {
          setError('Online booking is not available for this business');
          setProfile(null);
          return;
        }
        setProfile(tenant);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
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

  return { slug, profile, loading, error };
}
