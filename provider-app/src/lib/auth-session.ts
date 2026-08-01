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
  user: { id: string; email: string; firstName?: string; lastName?: string; locale?: string };
  business: {
    id: string;
    name: string;
    slug?: string;
    membershipRole?: string;
    locale?: string;
    defaultLocale?: string;
    enabledLocales?: string[];
    dateFormat?: string;
    timeFormat?: string;
    currency?: string;
  };
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

/**
 * e2e-bug.172 — single choke point for "I have a fresh AuthResult, make it
 * the device's active session," shared by LoginPage and AcceptInvitePage.
 * Establishing the new session directly (rather than redirecting to /login
 * and hoping the form gets filled in) is what actually fixes the bug: it
 * overwrites whatever session was previously active in localStorage instead
 * of silently leaving a stale one in place.
 */
export function finishProviderSession(
  result: AuthResult,
  deps: {
    canAccess: (
      employee: AuthResult['employee'],
      membershipRole?: string,
    ) => boolean;
    setAuth: (
      user: AuthResult['user'],
      business: NonNullable<AuthResult['business']>,
      token: string,
      extras: { businesses: AuthResult['businesses']; employee: AuthResult['employee'] },
    ) => void;
    onAccessDenied: () => void;
    onMissingSession: () => void;
  },
): boolean {
  if (!deps.canAccess(result.employee, result.business?.membershipRole)) {
    deps.onAccessDenied();
    return false;
  }
  if (!result.token || !result.business) {
    deps.onMissingSession();
    return false;
  }
  deps.setAuth(result.user, result.business, result.token, {
    businesses: result.businesses,
    employee: result.employee,
  });
  savePreferredBusinessSlug(result.business.slug);
  return true;
}
