const PREFERRED_SLUG_KEY = 'preferred-business-slug';

export function savePreferredBusinessSlug(slug: string | undefined | null) {
  if (!slug) return;
  localStorage.setItem(PREFERRED_SLUG_KEY, slug);
}

export function getPreferredBusinessSlug(): string | null {
  return localStorage.getItem(PREFERRED_SLUG_KEY);
}

/** APK / LAN builds can pin a tenant via VITE_BUSINESS_SLUG. */
export function getLoginTenantHint(): { businessSlug?: string } {
  const fromEnv = import.meta.env.VITE_BUSINESS_SLUG?.trim();
  const fromStorage = getPreferredBusinessSlug();
  const businessSlug = fromEnv || fromStorage || undefined;
  return businessSlug ? { businessSlug } : {};
}

export interface AuthResult {
  user: { id: string; email: string; firstName?: string; lastName?: string };
  business: { id: string; name: string; slug?: string; membershipRole?: string };
  employee: { id: string; name: string } | null;
  businesses: Array<{
    id: string;
    name: string;
    slug: string;
    membershipRole?: string;
    employee: { id: string; name: string } | null;
  }>;
  token: string | null;
  requiresBusinessSelection: boolean;
}

export function unwrapAuthResult(data: unknown): AuthResult {
  const payload = (data as { data?: AuthResult })?.data ?? data;
  return payload as AuthResult;
}
