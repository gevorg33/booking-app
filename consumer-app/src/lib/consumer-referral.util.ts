/** adopt-6.1 — capture referral codes from links and claim after sign-in. */

import { track } from './app-analytics.js';
import {
  peekDeferredInstallLink,
  saveDeferredInstallLink,
  type DeferredInstallLink,
} from './deferred-install-link.util.js';

const PENDING_REFERRAL_PREFIX = 'consumer_pending_referral:';

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
