import type { PublicCustomerProfile } from './types.js';

const tokenKey = (slug: string) => `consumer_token_${slug}`;
const profileKey = (slug: string) => `consumer_profile_${slug}`;

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
