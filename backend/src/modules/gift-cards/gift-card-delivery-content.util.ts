import type { AppLocale } from '../../common/i18n/messages.js';
import { getBusinessDefaultLocale } from '../../common/utils/business-locale.util.js';
import {
  formatGiftCardBalanceLine,
  formatGiftCardPurchaseLine,
} from '../../common/utils/notification-currency.util.js';
import { formatNotificationExpiresLabel } from '../../common/utils/notification-date-format.util.js';
import { buildTenantPublicUrl } from '../../common/utils/tenant-public-url.util.js';
import type { GiftCard } from './entities/gift-card.entity.js';
import type { GiftCardType } from './gift-card.types.js';
import { renderBusinessEmailTemplate } from '../notifications/notification-email-template.util.js';

export interface PublicBookingLinks {
  bookingUrl: string;
  accountUrl: string;
  giftCardsUrl: string;
}

export function resolveFrontendBaseUrl(frontendUrl?: string | null): string {
  return (frontendUrl || 'http://localhost:3000').replace(/\/$/, '');
}

export function buildPublicBookingLinks(
  businessSlug: string | null | undefined,
  frontendUrl?: string | null,
  rootDomain?: string,
): PublicBookingLinks | null {
  if (!businessSlug?.trim()) return null;
  const slug = businessSlug.trim();
  return {
    bookingUrl: buildTenantPublicUrl({ slug, frontendUrl: frontendUrl ?? undefined, rootDomain }),
    accountUrl: buildTenantPublicUrl({
      slug,
      frontendUrl: frontendUrl ?? undefined,
      rootDomain,
      pathSuffix: '/account',
    }),
    giftCardsUrl: buildTenantPublicUrl({
      slug,
      frontendUrl: frontendUrl ?? undefined,
      rootDomain,
      pathSuffix: '/gift-cards',
    }),
  };
}

const CARD_TYPE_LABEL: Record<GiftCardType, string> = {
  monetary: 'Gift card balance',
  service: 'Service gift card',
  bundle: 'Service bundle gift card',
  package: 'Service package gift card',
  subscription: 'Subscription gift card',
};

export function describeGiftCardValue(
  card: GiftCard,
  locale?: AppLocale,
): string[] {
  const businessSettings = card.business?.settings as
    | Record<string, unknown>
    | undefined;
  const resolvedLocale = locale ?? getBusinessDefaultLocale(businessSettings);
  const lines: string[] = [CARD_TYPE_LABEL[card.cardType] ?? 'Gift card'];

  if (card.cardType === 'monetary') {
    lines.push(
      formatGiftCardBalanceLine(
        card.balance,
        card.currency,
        businessSettings,
        resolvedLocale,
      ),
    );
  } else if (card.cardType === 'package' || card.cardType === 'subscription') {
    lines.push('Redeem this code in your account to activate your gift.');
  } else {
    for (const credit of card.serviceCredits ?? []) {
      lines.push(`${credit.serviceName} × ${credit.quantityRemaining}`);
    }
    lines.push('Apply this code at checkout when booking your appointment.');
  }

  if (card.expiresAt) {
    lines.push(
      `Expires: ${formatNotificationExpiresLabel(card.expiresAt, businessSettings, resolvedLocale)}`,
    );
  }

  return lines;
}

export function buildRedemptionInstructions(
  card: GiftCard,
  links: PublicBookingLinks | null,
): string[] {
  if (!links) {
    if (card.cardType === 'package' || card.cardType === 'subscription') {
      return [
        'Sign in to your account on the booking site and redeem this gift code.',
      ];
    }
    return [
      'Book an appointment on the business booking site and enter this code at checkout.',
    ];
  }

  if (card.cardType === 'package' || card.cardType === 'subscription') {
    return [
      `Sign in and redeem your code here: ${links.accountUrl}`,
      `After redeeming, book your visits here: ${links.bookingUrl}`,
    ];
  }

  return [`Book here and enter your code at checkout: ${links.bookingUrl}`];
}

export interface GiftCardRecipientEmailContent {
  subject: string;
  text: string;
  html: string;
}

export function resolveGiftCardSenderName(card: GiftCard): string {
  const fromPurchaser = card.purchaser?.name?.trim();
  if (fromPurchaser) return fromPurchaser;

  const fromStoredName = card.purchaserName?.trim();
  if (fromStoredName) return fromStoredName;

  const email = card.purchaserEmail?.trim();
  if (email) {
    const local = email
      .split('@')[0]
      ?.replace(/[._-]+/g, ' ')
      .trim();
    if (local) {
      return local
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join(' ');
    }
  }

  return 'Someone';
}

export function buildRecipientGiftCardEmail(
  card: GiftCard,
  links: PublicBookingLinks | null,
): GiftCardRecipientEmailContent | null {
  const businessName = card.business?.name ?? 'your business';
  const recipientName = card.recipientName?.trim() || 'there';
  const senderName = resolveGiftCardSenderName(card);
  const valueLines = describeGiftCardValue(card);
  const redemptionLines = buildRedemptionInstructions(card, links);

  const personalMessageSection = card.personalMessage
    ? `Message from the sender:\n${card.personalMessage}\n\n`
    : '';
  const personalMessageHtml = card.personalMessage
    ? `<p><strong>Message from the sender:</strong></p><p style="margin-left:12px;border-left:3px solid #e5e7eb;padding-left:12px;">${escapeHtml(card.personalMessage)}</p>`
    : '';

  const giftCardDetails = valueLines.join('\n');
  const giftCardDetailsHtml = `<ul>${valueLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;

  let redemptionInstructionsHtml = '';
  if (links) {
    const steps =
      card.cardType === 'package' || card.cardType === 'subscription'
        ? [
            'Sign in and redeem your code on your account page.',
            'Then book your visits from the main booking page.',
          ]
        : ['Book an appointment and enter your code at checkout.'];
    const buttons: string[] = [];
    if (card.cardType === 'package' || card.cardType === 'subscription') {
      buttons.push(
        `<a href="${escapeHtml(links.accountUrl)}" style="display:inline-block;margin-right:12px;padding:10px 16px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Redeem in your account</a>`,
      );
    }
    buttons.push(
      `<a href="${escapeHtml(links.bookingUrl)}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Book an appointment</a>`,
    );
    redemptionInstructionsHtml = `<p><strong>What to do next</strong></p><ul>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul><p>${buttons.join('')}</p>`;
  }

  const redemptionInstructions = [
    ...redemptionLines,
    ...(links
      ? [
          'Quick links:',
          `Book: ${links.bookingUrl}`,
          ...(card.cardType === 'package' || card.cardType === 'subscription'
            ? [`Redeem in your account: ${links.accountUrl}`]
            : []),
        ]
      : []),
  ].join('\n');

  const rendered = renderBusinessEmailTemplate(
    card.business?.settings as Record<string, unknown> | undefined,
    'gift_card_recipient',
    {
      recipientName,
      senderName,
      businessName,
      giftCardCode: card.code,
      personalMessageSection,
      personalMessageHtml,
      giftCardDetails,
      giftCardDetailsHtml,
      redemptionInstructions,
      redemptionInstructionsHtml,
    },
  );
  return rendered;
}

export function buildPurchaserReceiptEmail(
  card: GiftCard,
  recipientEmail: string,
  links: PublicBookingLinks | null,
): { subject: string; text: string; html: string } | null {
  const businessName = card.business?.name ?? 'the business';
  const businessSettings = card.business?.settings as
    | Record<string, unknown>
    | undefined;
  const locale = getBusinessDefaultLocale(businessSettings);
  const purchaseLine = formatGiftCardPurchaseLine(
    card.purchaseAmount,
    card.currency,
    businessSettings,
    locale,
  );
  const purchaseLineText = purchaseLine ? `${purchaseLine}\n\n` : '';
  const purchaseLineHtml = purchaseLine
    ? `<p>${escapeHtml(purchaseLine)}</p>`
    : '';
  const accountLinksText = links
    ? [
        `View your gift card orders: ${links.accountUrl}`,
        `Book again or browse gifts: ${links.bookingUrl}`,
      ].join('\n')
    : '';
  const accountLinksHtml = links
    ? `<p><a href="${escapeHtml(links.accountUrl)}">View your gift card orders</a> · <a href="${escapeHtml(links.bookingUrl)}">Book an appointment</a></p>`
    : '';

  return renderBusinessEmailTemplate(
    card.business?.settings as Record<string, unknown> | undefined,
    'gift_card_purchaser_receipt',
    {
      businessName,
      recipientEmail,
      purchaseLineText,
      purchaseLineHtml,
      accountLinksText,
      accountLinksHtml,
    },
  );
}

export function buildWhatsAppGiftCardSummary(
  card: GiftCard,
  links: PublicBookingLinks | null,
): string {
  const parts: string[] = [];
  if (card.personalMessage) parts.push(card.personalMessage);
  parts.push(...describeGiftCardValue(card));
  parts.push(...buildRedemptionInstructions(card, links));
  return (
    parts.join(' · ').slice(0, 1024) || 'Redeem your gift on our booking site.'
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
