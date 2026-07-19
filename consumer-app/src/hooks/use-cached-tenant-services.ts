import { useQuery } from '@tanstack/react-query';
import { loadCachedTenantSnapshot } from '../lib/cached-tenant-data.util.js';
import { useOnlineStatus } from '../lib/use-online-status.js';
import { fetchPublicServices } from '../services/public-api.js';
import type { PublicService } from '../lib/types.js';

/** Loads salon services with offline cache fallback (adopt-5.3). */
export function useCachedTenantServices(
  slug: string,
  options?: {
    /**
     * e2e-bug.29 — BookPage must not book from a warm snapshot alone. When online,
     * skip initialData and always refetch so deactivated services disappear.
     */
    authoritative?: boolean;
  },
) {
  const online = useOnlineStatus();
  const cached = slug ? loadCachedTenantSnapshot(slug)?.services : undefined;
  const authoritative = options?.authoritative === true;
  const useAuthoritativeOnline = authoritative && online;

  return useQuery({
    queryKey: [
      'services',
      slug,
      online ? 'online' : 'offline',
      useAuthoritativeOnline ? 'authoritative' : 'cached',
    ],
    queryFn: () => fetchPublicServices(slug),
    enabled: Boolean(slug),
    initialData: useAuthoritativeOnline ? undefined : cached,
    staleTime: useAuthoritativeOnline
      ? 0
      : online
        ? 30_000
        : Number.POSITIVE_INFINITY,
    refetchOnMount: useAuthoritativeOnline ? 'always' : undefined,
    retry: online ? 2 : 0,
    placeholderData: useAuthoritativeOnline
      ? undefined
      : (previous) => previous ?? cached ?? ([] as PublicService[]),
  });
}
