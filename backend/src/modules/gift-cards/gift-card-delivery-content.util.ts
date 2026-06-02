import type { GiftCard } from './entities/gift-card.entity.js';
import type { GiftCardType } from './gift-card.types.js';

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
): PublicBookingLinks | null {
  if (!businessSlug?.trim()) return null;
  const base = resolveFrontendBaseUrl(frontendUrl);
  const slug = businessSlug.trim();
  return {
    bookingUrl: `${base}/book/${slug}`,
    accountUrl: `${base}/book/${slug}/account`,
    giftCardsUrl: `${base}/book/${slug}/gift-cards`,
  };
}

const CARD_TYPE_LABEL: Record<GiftCardType, string> = {
  monetary: 'Gift card balance',
  service: 'Service gift card',
  bundle: 'Service bundle gift card',
  package: 'Service package gift card',
  subscription: 'Subscription gift card',
};

export function describeGiftCardValue(card: GiftCard): string[] {
  const lines: string[] = [CARD_TYPE_LABEL[card.cardType] ?? 'Gift card'];

  if (card.cardType === 'monetary') {
    lines.push(`Balance: ${card.currency} ${Number(card.balance).toFixed(2)}`);
  } else if (card.cardType === 'package' || card.cardType === 'subscription') {
    lines.push('Redeem this code in your account to activate your gift.');
  } else {
    for (const credit of card.serviceCredits ?? []) {
      lines.push(`${credit.serviceName} × ${credit.quantityRemaining}`);
    }
    lines.push('Apply this code at checkout when booking your appointment.');
  }

  if (card.expiresAt) {
    lines.push(`Expires: ${card.expiresAt.toISOString().slice(0, 10)}`);
  }

  return lines;
}

export function buildRedemptionInstructions(
  card: GiftCard,
  links: PublicBookingLinks | null,
): string[] {
  if (!links) {
    if (card.cardType === 'package' || card.cardType === 'subscription') {
      return ['Sign in to your account on the booking site and redeem this gift code.'];
    }
    return ['Book an appointment on the business booking site and enter this code at checkout.'];
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
    const local = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
    if (local) {
      return local
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
  }

  return 'Someone';
}

export function buildRecipientGiftCardEmail(
  card: GiftCard,
  links: PublicBookingLinks | null,
): GiftCardRecipientEmailContent {
  const businessName = card.business?.name ?? 'your business';
  const recipientName = card.recipientName?.trim() || 'there';
  const senderName = resolveGiftCardSenderName(card);
  const greeting = `Hi ${recipientName},`;
  const intro = `You've received a gift card from ${senderName} for ${businessName} services!`;

  const bodyLines = [
    greeting,
    '',
    intro,
    '',
    ...(card.personalMessage ? [`Message from the sender:`, card.personalMessage, ''] : []),
    `Your gift card code: ${card.code}`,
    '',
    ...describeGiftCardValue(card),
    '',
    ...buildRedemptionInstructions(card, links),
    '',
    ...(links
      ? [
          'Quick links:',
          `Book: ${links.bookingUrl}`,
          ...(card.cardType === 'package' || card.cardType === 'subscription'
            ? [`Redeem in your account: ${links.accountUrl}`]
            : []),
        ]
      : []),
  ];

  const text = bodyLines.filter((line) => line !== undefined).join('\n').trim();

  const htmlParts = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(intro)}</p>`,
  ];
  if (card.personalMessage) {
    htmlParts.push(
      `<p><strong>Message from the sender:</strong></p>`,
      `<p style="margin-left:12px;border-left:3px solid #e5e7eb;padding-left:12px;">${escapeHtml(card.personalMessage)}</p>`,
    );
  }
  htmlParts.push(
    `<p><strong>Your gift card code:</strong> <code style="font-size:1.1em;letter-spacing:0.05em;">${escapeHtml(card.code)}</code></p>`,
    `<ul>${describeGiftCardValue(card).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`,
  );

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
    htmlParts.push(
      `<p><strong>What to do next</strong></p>`,
      `<ul>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>`,
      `<p>${buttons.join('')}</p>`,
    );
  } else {
    htmlParts.push(
      `<p>${escapeHtml(buildRedemptionInstructions(card, links).join(' '))}</p>`,
    );
  }

  const html = htmlParts.join('\n');

  return {
    subject: `Your gift card from ${senderName} for ${businessName}`,
    text,
    html,
  };
}

export function buildPurchaserReceiptEmail(
  card: GiftCard,
  recipientEmail: string,
  links: PublicBookingLinks | null,
): { subject: string; text: string; html: string } {
  const businessName = card.business?.name ?? 'the business';
  const lines = [
    `Your gift card order from ${businessName} was sent to ${recipientEmail}.`,
    '',
    ...(links
      ? [
          `View your gift card orders: ${links.accountUrl}`,
          `Book again or browse gifts: ${links.bookingUrl}`,
        ]
      : []),
  ];
  const text = lines.join('\n');
  const html = [
    `<p>Your gift card order from <strong>${escapeHtml(businessName)}</strong> was sent to ${escapeHtml(recipientEmail)}.</p>`,
    links
      ? `<p><a href="${escapeHtml(links.accountUrl)}">View your gift card orders</a> · <a href="${escapeHtml(links.bookingUrl)}">Book an appointment</a></p>`
      : '',
  ].join('\n');

  return {
    subject: `Gift card sent — ${businessName}`,
    text,
    html,
  };
}

export function buildWhatsAppGiftCardSummary(
  card: GiftCard,
  links: PublicBookingLinks | null,
): string {
  const parts: string[] = [];
  if (card.personalMessage) parts.push(card.personalMessage);
  parts.push(...describeGiftCardValue(card));
  parts.push(...buildRedemptionInstructions(card, links));
  return parts.join(' · ').slice(0, 1024) || 'Redeem your gift on our booking site.';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
