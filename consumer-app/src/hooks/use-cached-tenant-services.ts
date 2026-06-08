import { useQuery } from '@tanstack/react-query';
import { loadCachedTenantSnapshot } from '../lib/cached-tenant-data.util.js';
import { useOnlineStatus } from '../lib/use-online-status.js';
import { fetchPublicServices } from '../services/public-api.js';
import type { PublicService } from '../lib/types.js';

/** Loads salon services with offline cache fallback (adopt-5.3). */
export function useCachedTenantServices(slug: string) {
  const online = useOnlineStatus();
  const cached = slug ? loadCachedTenantSnapshot(slug)?.services : undefined;

  return useQuery({
    queryKey: ['services', slug, online ? 'online' : 'offline'],
    queryFn: () => fetchPublicServices(slug),
    enabled: Boolean(slug),
    initialData: cached,
    staleTime: online ? 30_000 : Number.POSITIVE_INFINITY,
    retry: online ? 2 : 0,
    placeholderData: (previous) => previous ?? cached ?? ([] as PublicService[]),
  });
}
