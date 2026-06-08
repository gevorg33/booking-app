/** adopt-6.1 — capture referral codes from links and claim after sign-in. */

import { track } from './app-analytics.js';
import {
  peekDeferredInstallLink,
  saveDeferredInstallLink,
  type DeferredInstallLink,
} from './deferred-install-link.util.js';
import type { ReferralClaimResponse } from './types.js';

const PENDING_REFERRAL_PREFIX = 'consumer_pending_referral:';
const REFEREE_PROMO_PREFIX = 'consumer_referee_promo:';

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

  const deferred = peekDeferredInstallLink();
  saveDeferredInstallLink({
    slug,
    serviceId: deferred?.slug === slug ? deferred.serviceId : undefined,
    referralCode: code,
    installSource: 'referral',
    campaign: code,
  });

  track('referral_accepted', { referralCode: code, slug });
}

export function clearPendingReferralCode(slug: string): void {
  localStorage?.removeItem(pendingReferralStorageKey(slug));
}

const REFERRAL_ATTACHED_PREFIX = 'consumer_referral_attached:';

export function markReferralAttachedForConversion(slug: string): void {
  sessionStorage?.setItem(`${REFERRAL_ATTACHED_PREFIX}${slug}`, '1');
}

export function consumeReferralConversionFlag(slug: string): boolean {
  const key = `${REFERRAL_ATTACHED_PREFIX}${slug}`;
  const attached = sessionStorage?.getItem(key) === '1';
  if (attached) sessionStorage?.removeItem(key);
  return attached;
}

export function captureReferralFromSearch(search: string, slug: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const ref = params.get('ref')?.trim().toUpperCase();
  if (!ref || ref.length < 4) return null;
  savePendingReferralCode(slug, ref);
  return ref;
}

export function captureReferralFromDeferredLink(link: DeferredInstallLink | null): string | null {
  if (!link?.referralCode?.trim()) return null;
  savePendingReferralCode(link.slug, link.referralCode);
  return link.referralCode;
}

export function resolvePendingReferralForClaim(slug: string): string | null {
  return readPendingReferralCode(slug) ?? peekDeferredInstallLink()?.referralCode ?? null;
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

export function clearRefereePromoCode(slug: string): void {
  saveRefereePromoCode(slug, null);
}

export async function claimPendingReferralAfterSignIn(
  slug: string,
  claim: (referralCode: string) => Promise<ReferralClaimResponse>,
): Promise<ReferralClaimResponse | null> {
  const referralCode = resolvePendingReferralForClaim(slug);
  if (!referralCode) return null;

  try {
    const result = await claim(referralCode);
    clearPendingReferralCode(slug);
    if (result.attached) {
      markReferralAttachedForConversion(slug);
      if (result.refereePromoCode) {
        saveRefereePromoCode(slug, result.refereePromoCode);
      }
    }
    return result;
  } catch {
    return null;
  }
}
