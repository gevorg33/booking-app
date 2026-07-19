const COOKIE_CONSENT_PREFIX = 'cookie-consent-';

export type CookieConsentChoice = 'accepted' | 'rejected';

export function cookieConsentStorageKey(slug: string): string {
  return `${COOKIE_CONSENT_PREFIX}${slug}`;
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readCookieConsent(slug: string): CookieConsentChoice | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(cookieConsentStorageKey(slug));
    return raw === 'accepted' || raw === 'rejected' ? raw : null;
  } catch {
    return null;
  }
}

export function writeCookieConsent(
  slug: string,
  choice: CookieConsentChoice,
): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(cookieConsentStorageKey(slug), choice);
  } catch {
    // ignore quota errors
  }
}

export function hasAcceptedCookies(slug: string): boolean {
  return readCookieConsent(slug) === 'accepted';
}

/**
 * Whether non-essential cookies / analytics may run for this tenant.
 * - Banner disabled → allowed (business is not collecting a choice).
 * - Banner enabled → only after an explicit `accepted` choice (reject or undecided = blocked).
 */
export function allowsNonEssentialTracking(
  slug: string,
  options?: { cookieBannerEnabled?: boolean | null },
): boolean {
  if (options?.cookieBannerEnabled === false) return true;
  return hasAcceptedCookies(slug);
}

/** True when the banner should show (enabled + no stored choice yet). */
export function shouldShowCookieConsentBanner(
  slug: string,
  cookieBannerEnabled: boolean | null | undefined,
): boolean {
  if (!cookieBannerEnabled) return false;
  return readCookieConsent(slug) == null;
}
