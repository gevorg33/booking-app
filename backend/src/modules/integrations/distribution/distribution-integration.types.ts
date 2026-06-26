import { buildTenantPublicUrl } from '../../../common/utils/tenant-public-url.util.js';

export interface GoogleReserveIntegration {
  enabled?: boolean;
  /** Google Business / Merchant Center ID (when approved for Reserve with Google) */
  merchantId?: string;
  /** Partner notes or Actions Center link */
  partnerNotes?: string;
}

export interface MetaBookingIntegration {
  enabled?: boolean;
  facebookPageId?: string;
  facebookPageUrl?: string;
  instagramUsername?: string;
  /** CTA label on public profile */
  bookingButtonLabel?: string;
}

export interface MessagingChannelsIntegration {
  /** Telegram bot username without @ — deep links use t.me/{username}?start=book_{slug} */
  telegramBotUsername?: string;
  telegramEnabled?: boolean;
  /** E.164 digits only for wa.me links */
  whatsappBusinessPhone?: string;
  whatsappBookingEnabled?: boolean;
  /** Pre-filled WhatsApp message template */
  whatsappBookingMessage?: string;
}

export interface BusinessDistributionIntegrations {
  googleReserve?: GoogleReserveIntegration;
  metaBooking?: MetaBookingIntegration;
  messaging?: MessagingChannelsIntegration;
}

export interface MessagingDeepLinks {
  publicBookingUrl: string;
  telegramUrl: string | null;
  whatsappUrl: string | null;
  facebookBookingUrl: string | null;
  instagramBookingUrl: string | null;
}

export interface GoogleReserveFeedItem {
  serviceId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  currency: string;
  bookingUrl: string;
}

export interface GoogleReserveFeed {
  businessName: string;
  businessSlug: string;
  merchantId: string | null;
  generatedAt: string;
  bookingUrl: string;
  services: GoogleReserveFeedItem[];
  instructions: string;
}

export function getDistributionIntegrations(
  settings?: Record<string, unknown>,
): BusinessDistributionIntegrations {
  const integrations = settings?.integrations as
    | Record<string, unknown>
    | undefined;
  const dist = integrations?.distribution as
    | BusinessDistributionIntegrations
    | undefined;
  return dist || {};
}

export function buildMessagingLinksForBusiness(
  business: { slug: string; name: string; settings?: Record<string, unknown> },
  frontendUrl: string,
  rootDomain?: string,
): MessagingDeepLinks {
  const dist = getDistributionIntegrations(business.settings);
  const messaging = dist.messaging || {};
  const meta = dist.metaBooking || {};
  const bookingUrl = buildTenantPublicUrl({
    slug: business.slug,
    frontendUrl,
    rootDomain,
  });

  let telegramUrl: string | null = null;
  if (messaging.telegramEnabled && messaging.telegramBotUsername?.trim()) {
    const bot = messaging.telegramBotUsername.replace(/^@/, '');
    telegramUrl = `https://t.me/${bot}?start=book_${business.slug}`;
  }

  let whatsappUrl: string | null = null;
  if (
    messaging.whatsappBookingEnabled &&
    messaging.whatsappBusinessPhone?.trim()
  ) {
    const phone = messaging.whatsappBusinessPhone.replace(/\D/g, '');
    const text =
      messaging.whatsappBookingMessage?.trim() ||
      `Hi! I'd like to book at ${business.name}: ${bookingUrl}`;
    whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  const facebookBookingUrl =
    meta.enabled && meta.facebookPageUrl?.trim()
      ? meta.facebookPageUrl.trim()
      : meta.enabled
        ? bookingUrl
        : null;

  const instagramBookingUrl =
    meta.enabled && meta.instagramUsername?.trim()
      ? `https://instagram.com/${meta.instagramUsername.replace(/^@/, '')}`
      : null;

  return {
    publicBookingUrl: bookingUrl,
    telegramUrl,
    whatsappUrl,
    facebookBookingUrl,
    instagramBookingUrl,
  };
}
