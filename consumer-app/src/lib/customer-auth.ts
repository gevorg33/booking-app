import {
  formatSalonRecencySubtitle,
  loadRecentSalons,
  salonRecencyTimestamp,
  type RecentSalon,
} from './recent-salons.js';
import { formatStoredTenantLocaleLabel } from './tenant-locale.js';
import type { PublicCustomerProfile } from './types.js';

const tokenKey = (slug: string) => `consumer_token_${slug}`;
const profileKey = (slug: string) => `consumer_profile_${slug}`;
const ACTIVE_TENANT_KEY = 'consumer_active_tenant_slug';

export function getCustomerToken(slug: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(tokenKey(slug));
}

export function setCustomerSession(
  slug: string,
  token: string | null,
  profile: PublicCustomerProfile | null,
): void {
  if (typeof localStorage === 'undefined') return;
  if (token) {
    localStorage.setItem(tokenKey(slug), token);
  } else {
    localStorage.removeItem(tokenKey(slug));
  }
  if (profile) {
    localStorage.setItem(profileKey(slug), JSON.stringify(profile));
  } else {
    localStorage.removeItem(profileKey(slug));
  }
}

export function getStoredCustomerProfile(slug: string): PublicCustomerProfile | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(profileKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicCustomerProfile;
  } catch {
    return null;
  }
}

export function clearCustomerSession(slug: string): void {
  setCustomerSession(slug, null, null);
}

export function recordActiveTenant(slug: string): void {
  if (typeof localStorage === 'undefined') return;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return;
  localStorage.setItem(ACTIVE_TENANT_KEY, normalized);
}

export function getActiveTenantSlug(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const slug = localStorage.getItem(ACTIVE_TENANT_KEY);
  return slug?.trim() ? slug : null;
}

export interface KnownCustomerTenant {
  slug: string;
  hasSession: boolean;
  profileName?: string;
}

export function listKnownCustomerTenants(): KnownCustomerTenant[] {
  if (typeof localStorage === 'undefined') return [];
  const slugs = new Set<string>();
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    const tokenMatch = key?.match(/^consumer_token_([a-z0-9-]+)$/);
    if (tokenMatch?.[1]) slugs.add(tokenMatch[1]);
    const profileMatch = key?.match(/^consumer_profile_([a-z0-9-]+)$/);
    if (profileMatch?.[1]) slugs.add(profileMatch[1]);
  }
  return [...slugs]
    .sort()
    .map((slug) => ({
      slug,
      hasSession: Boolean(getCustomerToken(slug)),
      profileName: getStoredCustomerProfile(slug)?.name,
    }));
}

export interface RememberedTenant {
  slug: string;
  displayName: string;
  hasSession: boolean;
  isActive: boolean;
  profileName?: string;
  logoUrl?: string;
  storedLocaleLabel?: string;
  subtitle: string;
}

export function canSwitchWithoutReLogin(slug: string): boolean {
  return Boolean(getCustomerToken(slug));
}

function buildRememberedTenantSubtitle(
  salon: RecentSalon | undefined,
  hasSession: boolean,
  isActive: boolean,
  localeLabel: string | null,
  now: Date,
): string {
  const parts: string[] = [];
  if (isActive) {
    parts.push('Current salon');
  } else if (hasSession) {
    parts.push('Signed in');
  } else {
    parts.push('Sign in to book');
  }
  if (localeLabel) parts.push(localeLabel);
  if (salon) parts.push(formatSalonRecencySubtitle(salon, now));
  return parts.join(' · ');
}

export function buildRememberedTenants(options?: {
  activeSlug?: string | null;
  now?: Date;
}): RememberedTenant[] {
  const now = options?.now ?? new Date();
  const activeSlug = (options?.activeSlug ?? getActiveTenantSlug())?.toLowerCase() ?? null;
  const knownBySlug = new Map(listKnownCustomerTenants().map((tenant) => [tenant.slug, tenant]));
  const recentBySlug = new Map(loadRecentSalons().map((salon) => [salon.slug, salon]));
  const slugs = new Set([...knownBySlug.keys(), ...recentBySlug.keys()]);

  const entries = [...slugs].map((slug) => {
    const known = knownBySlug.get(slug);
    const salon = recentBySlug.get(slug);
    const hasSession = Boolean(known?.hasSession);
    const isActive = activeSlug === slug;
    const storedLocaleLabel = formatStoredTenantLocaleLabel(slug);

    return {
      slug,
      displayName: known?.profileName ?? salon?.name ?? slug,
      hasSession,
      isActive,
      profileName: known?.profileName,
      logoUrl: salon?.logoUrl,
      storedLocaleLabel: storedLocaleLabel ?? undefined,
      subtitle: buildRememberedTenantSubtitle(salon, hasSession, isActive, storedLocaleLabel, now),
    };
  });

  return entries.sort((left, right) => {
    if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
    if (left.hasSession !== right.hasSession) return left.hasSession ? -1 : 1;
    const leftSalon = recentBySlug.get(left.slug);
    const rightSalon = recentBySlug.get(right.slug);
    const recencyDiff =
      salonRecencyTimestamp(rightSalon ?? { slug: right.slug, name: right.slug, visitedAt: '' }) -
      salonRecencyTimestamp(leftSalon ?? { slug: left.slug, name: left.slug, visitedAt: '' });
    if (recencyDiff !== 0) return recencyDiff;
    return left.displayName.localeCompare(right.displayName);
  });
}
