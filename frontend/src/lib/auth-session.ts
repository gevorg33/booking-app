import { extractSubdomain, getRootDomain } from '@/lib/tenant-host';

const PREFERRED_SLUG_KEY = 'preferred-business-slug';

export function savePreferredBusinessSlug(slug: string | undefined | null) {
  if (typeof window === 'undefined' || !slug) return;
  localStorage.setItem(PREFERRED_SLUG_KEY, slug);
}

export function getPreferredBusinessSlug(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PREFERRED_SLUG_KEY);
}

/** Subdomain, env default, or last-used business for login tenant scoping. */
export function getLoginTenantHint(): { businessSlug?: string; businessId?: string } {
  if (typeof window === 'undefined') return {};

  const fromHost = extractSubdomain(window.location.host, getRootDomain());
  const fromEnv = process.env.NEXT_PUBLIC_BUSINESS_SLUG?.trim();
  const fromStorage = getPreferredBusinessSlug();

  const businessSlug = fromHost || fromEnv || fromStorage || undefined;
  return businessSlug ? { businessSlug } : {};
}
