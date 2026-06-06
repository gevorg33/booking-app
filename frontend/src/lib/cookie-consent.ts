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
