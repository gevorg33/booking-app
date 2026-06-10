/** adopt-6.1 — capture referral codes from public booking links. */

import { trackAppAnalyticsEvent } from '@/lib/app-analytics';

const PENDING_REFERRAL_PREFIX = 'public_pending_referral:';
const REFEREE_PROMO_PREFIX = 'public_referee_promo:';

export function pendingReferralStorageKey(slug: string): string {
  return `${PENDING_REFERRAL_PREFIX}${slug.trim().toLowerCase()}`;
}

export function readPendingReferralCode(slug: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(pendingReferralStorageKey(slug));
  return raw?.trim().toUpperCase() || null;
}

export function savePendingReferralCode(slug: string, referralCode: string): void {
  if (typeof localStorage === 'undefined') return;
  const code = referralCode.trim().toUpperCase();
  if (!code) return;
  localStorage.setItem(pendingReferralStorageKey(slug), code);
  trackAppAnalyticsEvent('referral_accepted', { referralCode: code, slug });
}

export function clearPendingReferralCode(slug: string): void {
  localStorage?.removeItem(pendingReferralStorageKey(slug));
}

export function captureReferralFromSearch(search: string, slug: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const ref = params.get('ref')?.trim().toUpperCase();
  if (!ref || ref.length < 4) return null;
  savePendingReferralCode(slug, ref);
  return ref;
}

export function saveRefereePromoCode(slug: string, promoCode: string | null | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  const code = promoCode?.trim().toUpperCase();
  const key = `${REFEREE_PROMO_PREFIX}${slug.trim().toLowerCase()}`;
  if (!code) {
    sessionStorage.removeItem(key);
    return;
  }
  sessionStorage.setItem(key, code);
}

export function readRefereePromoCode(slug: string): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(`${REFEREE_PROMO_PREFIX}${slug.trim().toLowerCase()}`);
  return raw?.trim().toUpperCase() || null;
}

export async function claimPendingReferralAfterSignIn(
  slug: string,
  claim: (referralCode: string) => Promise<{
    attached: boolean;
    refereePromoCode?: string | null;
  }>,
): Promise<boolean> {
  const referralCode = readPendingReferralCode(slug);
  if (!referralCode) return false;
  try {
    const result = await claim(referralCode);
    clearPendingReferralCode(slug);
    if (result.attached && result.refereePromoCode) {
      saveRefereePromoCode(slug, result.refereePromoCode);
    }
    return result.attached;
  } catch {
    return false;
  }
}

export function buildReferralInviteUrl(origin: string, slug: string, referralCode: string): string {
  const url = new URL(`${origin.replace(/\/$/, '')}/book/${slug.trim().toLowerCase()}`);
  url.searchParams.set('ref', referralCode);
  url.searchParams.set('src', 'referral');
  return url.toString();
}
