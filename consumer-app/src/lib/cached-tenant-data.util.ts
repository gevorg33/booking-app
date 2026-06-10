import type { PublicBusinessProfile, PublicService } from './types.js';

const CACHE_PREFIX = 'consumer_tenant_cache_';

export interface CachedTenantSnapshot {
  slug: string;
  profile: PublicBusinessProfile;
  services: PublicService[];
  cachedAt: string;
}

function cacheKey(slug: string): string {
  return `${CACHE_PREFIX}${slug.trim().toLowerCase()}`;
}

export function saveCachedTenantSnapshot(input: {
  slug: string;
  profile: PublicBusinessProfile;
  services: PublicService[];
}): void {
  if (typeof localStorage === 'undefined') return;
  const snapshot: CachedTenantSnapshot = {
    slug: input.slug.trim().toLowerCase(),
    profile: input.profile,
    services: input.services,
    cachedAt: new Date().toISOString(),
  };
  localStorage.setItem(cacheKey(input.slug), JSON.stringify(snapshot));
}

export function loadCachedTenantSnapshot(slug: string): CachedTenantSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(cacheKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedTenantSnapshot;
  } catch {
    return null;
  }
}
