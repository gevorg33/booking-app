/** adopt-6 — referral, share, rebook growth loops. */

import { track } from './app-analytics.js';
import {
  buildBookServicePath,
  buildSalonPath,
} from './deep-link.js';
import { buildAttributedBookUrl } from './deferred-install-link.util.js';
export type { AccountRebookTarget } from './consumer-rebook.util.js';
export { resolveAccountRebookTarget } from './consumer-rebook.util.js';
import { loadRecentSalons, loadPinnedSalonSlugs } from './recent-salons.js';
import type { PublicCustomerBookingItem } from './types.js';

const PUBLIC_WEB_ORIGIN = import.meta.env.VITE_PUBLIC_WEB_ORIGIN?.replace(/\/$/, '') || '';

export interface NativeSharePayload {
  title: string;
  text: string;
  url: string;
}

export function deriveReferralCode(customerId: string): string {
  const normalized = customerId.replace(/-/g, '').toLowerCase();
  return normalized.slice(0, 8).toUpperCase() || 'FRIEND';
}

export function buildReferralInviteLink(input: {
  slug: string;
  referralCode: string;
  origin?: string;
}): string {
  const origin = (input.origin ?? PUBLIC_WEB_ORIGIN).replace(/\/$/, '');
  if (!origin) {
    const params = new URLSearchParams({
      ref: input.referralCode,
      src: 'referral',
    });
    return `${buildSalonPath(input.slug, '/services')}?${params.toString()}`;
  }
  const url = new URL(`${origin}/book/${input.slug}`);
  url.searchParams.set('ref', input.referralCode);
  url.searchParams.set('src', 'referral');
  return url.toString();
}

export function buildSalonSharePayload(input: {
  slug: string;
  businessName: string;
  serviceId?: string | null;
  serviceName?: string | null;
  employeeId?: string | null;
  origin?: string;
}): NativeSharePayload {
  const origin = (input.origin ?? PUBLIC_WEB_ORIGIN).replace(/\/$/, '');
  const serviceId = input.serviceId?.trim() || undefined;
  const url = origin
    ? buildAttributedBookUrl(origin, {
        slug: input.slug,
        serviceId,
        installSource: 'share',
        campaign: 'customer_share',
        employeeId: input.employeeId ?? undefined,
      })
    : serviceId
      ? buildBookServicePath(input.slug, serviceId, { employeeId: input.employeeId })
      : buildSalonPath(input.slug, '/');
  const text = input.serviceName
    ? `Book ${input.serviceName} at ${input.businessName}`
    : `Book at ${input.businessName}`;
  return { title: input.businessName, text, url };
}

export function buildBookingSharePayload(input: {
  slug: string;
  businessName: string;
  booking: Pick<PublicCustomerBookingItem, 'serviceId' | 'serviceName' | 'employeeId'>;
  origin?: string;
}): NativeSharePayload {
  return buildSalonSharePayload({
    slug: input.slug,
    businessName: input.businessName,
    serviceId: input.booking.serviceId,
    serviceName: input.booking.serviceName,
    employeeId: input.booking.employeeId,
    origin: input.origin,
  });
}

export function buildTenantReviewUrl(
  slug: string,
  bookingId: string,
  origin = PUBLIC_WEB_ORIGIN,
): string | null {
  if (!origin?.trim()) return null;
  const url = new URL(`${origin.replace(/\/$/, '')}/book/${slug}/review`);
  url.searchParams.set('bookingId', bookingId);
  return url.toString();
}

export function listSavedSalonSlugs(): string[] {
  const pinned = loadPinnedSalonSlugs();
  const recent = loadRecentSalons().map((salon) => salon.slug);
  return [...new Set([...pinned, ...recent])];
}

export async function shareNative(payload: NativeSharePayload): Promise<'shared' | 'copied' | 'unavailable'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch {
      return 'unavailable';
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      return 'copied';
    } catch {
      return 'unavailable';
    }
  }
  return 'unavailable';
}

export async function shareReferralInvite(input: {
  slug: string;
  customerId: string;
  businessName: string;
  shareTitle: string;
  shareText: string;
  origin?: string;
  shareUrl?: string;
}): Promise<'shared' | 'copied' | 'unavailable'> {
  const referralCode = deriveReferralCode(input.customerId);
  const url =
    input.shareUrl ??
    buildReferralInviteLink({
      slug: input.slug,
      referralCode,
      origin: input.origin,
    });
  const result = await shareNative({
    title: input.shareTitle,
    text: input.shareText.replace('{businessName}', input.businessName),
    url,
  });
  if (result !== 'unavailable') {
    track('referral_sent', { referralCode, slug: input.slug });
  }
  return result;
}

export async function shareSalonLink(input: {
  slug: string;
  businessName: string;
  serviceId?: string | null;
  serviceName?: string | null;
  employeeId?: string | null;
  origin?: string;
}): Promise<'shared' | 'copied' | 'unavailable'> {
  const payload = buildSalonSharePayload(input);
  const result = await shareNative(payload);
  if (result !== 'unavailable') {
    track('salon_shared', {
      slug: input.slug,
      serviceId: input.serviceId ?? undefined,
    });
  }
  return result;
}

export async function shareBookingLink(input: {
  slug: string;
  businessName: string;
  booking: Pick<PublicCustomerBookingItem, 'id' | 'serviceId' | 'serviceName' | 'employeeId'>;
  origin?: string;
}): Promise<'shared' | 'copied' | 'unavailable'> {
  const payload = buildBookingSharePayload(input);
  const result = await shareNative(payload);
  if (result !== 'unavailable') {
    track('booking_shared', {
      bookingId: input.booking.id,
      serviceId: input.booking.serviceId,
      slug: input.slug,
    });
  }
  return result;
}

/** Account/widget rebook navigation — analytics fire when BookPage opens with rebook=1. */
export function trackRebookTap(
  _bookingId: string,
  _slug: string,
  _source: 'account' | 'widget' = 'account',
): void {
  // no-op: BookPage emits `rebooked` once when the rebook flow loads
}
