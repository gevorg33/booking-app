import { Capacitor } from '@capacitor/core';
import type { PublicBusinessProfile, PublicMetaBooking, PublicMessagingLinks, PublicSocialLinks } from './types.js';

export type GrowthBookingLinkKind = 'meta' | 'telegram' | 'whatsapp' | 'facebook' | 'instagram';

export interface GrowthBookingLink {
  href: string;
  kind: GrowthBookingLinkKind;
  customLabel?: string;
}

export interface SocialLinkEntry {
  id: keyof PublicSocialLinks;
  url: string;
}

export function socialHref(url: string): string {
  if (!url.trim()) return '#';
  return url.startsWith('http') ? url : `https://${url}`;
}

export function buildSocialLinkEntries(social: PublicSocialLinks | undefined): SocialLinkEntry[] {
  if (!social) return [];
  const entries: SocialLinkEntry[] = [];
  const ids: Array<keyof PublicSocialLinks> = [
    'website',
    'instagram',
    'facebook',
    'x',
    'tiktok',
    'linkedin',
    'youtube',
  ];
  for (const id of ids) {
    const url = social[id]?.trim();
    if (url) entries.push({ id, url });
  }
  return entries;
}

export function buildGrowthBookingLinks(input: {
  metaBooking?: PublicMetaBooking;
  messaging?: PublicMessagingLinks;
}): GrowthBookingLink[] {
  const links: GrowthBookingLink[] = [];
  if (input.metaBooking?.bookingUrl?.trim()) {
    links.push({
      href: input.metaBooking.bookingUrl.trim(),
      kind: 'meta',
      customLabel: input.metaBooking.buttonLabel?.trim() || undefined,
    });
  }
  if (input.messaging?.telegramUrl?.trim()) {
    links.push({ href: input.messaging.telegramUrl.trim(), kind: 'telegram' });
  }
  if (input.messaging?.whatsappUrl?.trim()) {
    links.push({ href: input.messaging.whatsappUrl.trim(), kind: 'whatsapp' });
  }
  if (input.messaging?.facebookBookingUrl?.trim()) {
    links.push({ href: input.messaging.facebookBookingUrl.trim(), kind: 'facebook' });
  }
  if (input.messaging?.instagramBookingUrl?.trim()) {
    links.push({ href: input.messaging.instagramBookingUrl.trim(), kind: 'instagram' });
  }
  return links;
}

export function hasGrowthBookingLinks(
  profile: Pick<PublicBusinessProfile, 'metaBooking' | 'messaging'>,
): boolean {
  return buildGrowthBookingLinks(profile).length > 0;
}

export function openExternalUrl(url: string): void {
  if (typeof window === 'undefined' || !url.trim()) return;
  window.open(url, Capacitor.isNativePlatform() ? '_system' : '_blank', 'noopener,noreferrer');
}
