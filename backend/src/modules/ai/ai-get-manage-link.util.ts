import type { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { isSignInAfterBookingPrompt } from './ai-sign-in-after-booking.util.js';
import { hasSignInToManageBookingCue } from './ai-sign-in-to-manage-booking.util.js';
import { isGuestPayCashManageCompoundCandidate } from './ai-guest-pay-cash-manage-cue.util.js';
import { isConfigureOnlineBookingPrompt } from './ai-staff-operations.util.js';
import { isPushLabBookingToPatientPrompt } from './ai-clinic-lab-booking.util.js';
import {
  GET_MANAGE_LINK_PROMPTS,
  type GetManageLinkDelivery,
  type GetManageLinkPromptFixture,
} from './ai-get-manage-link.fixtures.js';
import { GET_MANAGE_LINK_MULTILINGUAL_SCENARIOS } from './ai-get-manage-link-multilingual.fixtures.js';

export const GET_MANAGE_LINK_INTENTS = ['get_manage_link'] as const;

export type GetManageLinkIntent = (typeof GET_MANAGE_LINK_INTENTS)[number];

export { CUSTOMER_GET_MANAGE_LINK_CLASSIFIER_RULES } from './ai-get-manage-link.fixtures.js';
export type { GetManageLinkDelivery } from './ai-get-manage-link.fixtures.js';

const MANAGE_LINK_CUE = new RegExp(
  String.raw`\b(?:manage\s+link|booking\s+link|reschedule\s+link|cancel\s+link|self[\s-]?service\s+link|appointment\s+link)\b|karavarman\s+hghum|управлен|ссылк.*(?:запис|брон|управлен)`,
  'iu',
);

const GUEST_RESEND_CUE = new RegExp(
  String.raw`\b(?:resend|re-?send|lost|missing|didn'?t\s+get|never\s+got|confirmation\s+email|confirmation\s+text|text\s+me|sms\s+me|email\s+me)\b|կորցր|վերաուղարկ|перешл|потерял|не\s+получил|sms|հաստատման\s+նամակ`,
  'iu',
);

const SHARE_CUE = new RegExp(
  String.raw`\b(?:share|partner|friend|family|forward\s+to\s+someone)\b|կիս|ընկեր|подел|партн`,
  'iu',
);

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/;
const UUID_LIKE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const PHONE_CONTEXT_CUE =
  /\b(?:phone|mobile|cell|call\s+me|text\s+me|sms|whatsapp|reach\s+me|number)\b/i;

/** e2e-bug.102 — strip URLs/UUIDs so manage-link ids are not read as phones. */
function stripNonPhoneContactNoise(prompt: string): string {
  return prompt
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[?&](?:bookingId|token)=[^&\s]+/gi, ' ')
    .replace(UUID_LIKE, ' ');
}

function matchGetManageLinkScenario(
  prompt: string,
): GetManageLinkPromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of GET_MANAGE_LINK_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of GET_MANAGE_LINK_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function normalizeGuestContactPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function extractGuestContactFromPrompt(prompt: string): {
  email?: string;
  phone?: string;
} {
  const email = prompt.match(EMAIL_PATTERN)?.[0]?.trim().toLowerCase();
  // e2e-bug.102 — never scan manage-link URLs / booking UUIDs for phone digits.
  const scrubbed = stripNonPhoneContactNoise(prompt);
  const phoneRaw = scrubbed.match(PHONE_PATTERN)?.[0];
  const phone = phoneRaw ? normalizeGuestContactPhone(phoneRaw) : undefined;
  const plausiblePhone =
    Boolean(phone) &&
    phone!.length >= 10 &&
    phone!.length <= 15 &&
    (PHONE_CONTEXT_CUE.test(scrubbed) ||
      // Allow bare international-looking numbers after scrubbing (no UUID noise).
      /^\+?\d[\d\s().-]{8,}\d$/.test(phoneRaw!.trim()) ||
      /\bat\s+\+?\d[\d\s().-]{7,}\d/i.test(scrubbed));
  return {
    ...(email ? { email } : {}),
    ...(plausiblePhone ? { phone } : {}),
  };
}

export function isGuestManageLinkLookupPrompt(prompt: string): boolean {
  if (matchGetManageLinkScenario(prompt)?.guestLookup) return true;
  return false;
}

function hasGuestManageLinkRecoveryStealCue(prompt: string): boolean {
  if (
    GUEST_RESEND_CUE.test(prompt) &&
    /\b(?:booking|appointment|visit|manage|confirmation|link)\b/i.test(prompt)
  ) {
    return true;
  }
  const contact = extractGuestContactFromPrompt(prompt);
  if (
    (contact.email || contact.phone) &&
    (GUEST_RESEND_CUE.test(prompt) || MANAGE_LINK_CUE.test(prompt))
  ) {
    return true;
  }
  return (
    /(?:guest|without\s+account|as\s+a\s+guest)/i.test(prompt) &&
    MANAGE_LINK_CUE.test(prompt)
  );
}

export function resolveManageLinkDelivery(
  prompt: string,
  contact: { email?: string; phone?: string },
): GetManageLinkDelivery {
  const scenario = matchGetManageLinkScenario(prompt);
  if (scenario?.delivery) return scenario.delivery;
  if (/\b(?:text|sms)\b/i.test(prompt) || /sms/i.test(prompt)) return 'sms';
  if (/\b(?:email|e-mail)\b/i.test(prompt) || contact.email) return 'email';
  if (GUEST_RESEND_CUE.test(prompt)) return 'auto';
  return 'link_only';
}

export function shouldResendManageLinkNotification(
  delivery: GetManageLinkDelivery,
): boolean {
  return delivery !== 'link_only';
}

export function isGetManageLinkPrompt(prompt: string): boolean {
  if (isGuestPayCashManageCompoundCandidate(prompt)) return false;
  if (isConfigureOnlineBookingPrompt(prompt)) return false;
  if (
    /\bpatient\b|հիվանդ|пациент/iu.test(prompt) &&
    isPushLabBookingToPatientPrompt(prompt)
  ) {
    return false;
  }
  if (hasSignInToManageBookingCue(prompt)) return false;
  if (hasGuestManageLinkRecoveryStealCue(prompt)) return false;
  if (isSignInAfterBookingPrompt(prompt)) return false;
  if (SHARE_CUE.test(prompt) && !MANAGE_LINK_CUE.test(prompt)) return false;
  if (
    /\b(?:invalid|expired|broken|missing|doesn'?t\s+work|not\s+working)\b/i.test(
      prompt,
    ) &&
    /\bmanage\s+link\b/i.test(prompt) &&
    !/\b(?:get|send|resend|text|email)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:what|explain|help|how|options|capabilities)\b/i.test(prompt) &&
    /\bmanage\s+(?:booking\s+)?page\b/i.test(prompt)
  ) {
    return false;
  }

  if (matchGetManageLinkScenario(prompt)) return true;

  if (
    /(?:ուղարկ.{0,24}(?:hghum|հղum|link|կառavarman)|կորցր.{0,24}(?:հաստատման|amragr)|перешл.{0,24}(?:ссылк|управлен)|потерял.{0,24}(?:письмо|подтвержд))/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /(?:ուղարկ|send|show|resend|text|sms).{0,40}(?:link|hghum|ссылк|управлен)/iu.test(
      prompt,
    ) &&
    /(?:amrag|booking|appointment|visit|amragrum|ամրագր|запис|брон|визит|manage|karavar|կառավարման|управлен)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (MANAGE_LINK_CUE.test(prompt)) return true;

  return (
    (/\b(get|send|show|resend|text|email)\b/i.test(prompt) &&
      /\b(manage|link)\b/i.test(prompt) &&
      /\b(booking|appointment|visit|confirmation)\b/i.test(prompt)) ||
    (/(ուղարկ|send|show|resend)/i.test(prompt) &&
      /(իմ|my)/i.test(prompt) &&
      /(amրag|amrag|booking|appointment|amragrum|ամրագր)/i.test(prompt) &&
      /(?:link|hghum|հղum|կառavarman|управлен|ссылk)/iu.test(prompt)) ||
    (/(ссылк|управлен|перешл)/i.test(prompt) &&
      /(запис|брон|визит|управлен)/i.test(prompt)) ||
    (GUEST_RESEND_CUE.test(prompt) &&
      /\b(?:booking|appointment|visit|manage|confirmation)\b/i.test(prompt))
  );
}

export function isGetManageLinkIntent(
  action: string,
): action is GetManageLinkIntent {
  return (GET_MANAGE_LINK_INTENTS as readonly string[]).includes(action);
}

export interface ParsedGetManageLink {
  bookingId?: string;
  email?: string;
  phone?: string;
  guestLookup: boolean;
  delivery: GetManageLinkDelivery;
}

export function parseGetManageLinkFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedGetManageLink | null {
  const fromCompound =
    params.guestPayCashManage === true ||
    params.continueAfterCashPayment === true;
  if (!isGetManageLinkPrompt(prompt) && !fromCompound) return null;

  const contactFromPrompt = extractGuestContactFromPrompt(prompt);
  const email =
    (typeof params.email === 'string'
      ? params.email.trim().toLowerCase()
      : undefined) ?? contactFromPrompt.email;
  const phone =
    (typeof params.phone === 'string'
      ? normalizeGuestContactPhone(params.phone)
      : undefined) ?? contactFromPrompt.phone;
  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  const guestLookup =
    isGuestManageLinkLookupPrompt(prompt) || Boolean(email || phone);
  const delivery =
    (params.delivery as GetManageLinkDelivery | undefined) ??
    resolveManageLinkDelivery(prompt, { email, phone });

  return {
    guestLookup,
    delivery,
    ...(bookingId ? { bookingId } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

export function rescueGetManageLinkIntent(
  prompt: string,
  action: string,
): { action: GetManageLinkIntent; rescueReason: string } | null {
  if (isGetManageLinkIntent(action)) return null;
  if (!parseGetManageLinkFromPrompt(prompt)) return null;
  return {
    action: 'get_manage_link',
    rescueReason: 'manage_link',
  };
}

export function contactMatchesBookingCustomer(
  booking: Booking,
  contact: { email?: string; phone?: string },
): boolean {
  const customer = booking.customer;
  if (!customer) return false;
  if (
    contact.email &&
    customer.email?.trim().toLowerCase() === contact.email.toLowerCase()
  ) {
    return true;
  }
  if (
    contact.phone &&
    normalizeGuestContactPhone(customer.phone ?? '') === contact.phone
  ) {
    return true;
  }
  return false;
}

export async function lookupUpcomingBookingsByGuestContact(
  bookingRepo: Repository<Booking>,
  businessId: string,
  contact: { email?: string; phone?: string },
  now = new Date(),
): Promise<Booking[]> {
  if (!contact.email && !contact.phone) return [];

  const bookings = await bookingRepo.find({
    where: { businessId, status: BookingStatus.CONFIRMED },
    relations: { customer: true, service: true, employee: true },
    order: { startTime: 'ASC' },
  });

  return bookings.filter(
    (booking) =>
      booking.startTime.getTime() >= now.getTime() &&
      contactMatchesBookingCustomer(booking, contact),
  );
}

export function buildGuestManageLinkAmbiguousSummary(
  bookings: Booking[],
): string {
  const lines = bookings.slice(0, 5).map((booking) => {
    const service = booking.service?.name ?? 'Appointment';
    const when = booking.startTime.toISOString().slice(0, 16);
    return `• ${service} — ${when}`;
  });
  return `Multiple upcoming bookings match that contact. Specify which visit:\n${lines.join('\n')}`;
}

export function buildManageLinkResendSummary(input: {
  delivery: GetManageLinkDelivery;
  email?: string;
  phone?: string;
  resent: boolean;
  /** e2e-bug.95 — include URL so chat UIs that only render summary still work. */
  manageUrl?: string;
}): string {
  if (!input.resent) {
    return input.manageUrl
      ? `Here is your booking manage link: ${input.manageUrl}`
      : 'Here is your booking manage link.';
  }
  if (input.delivery === 'sms' || (input.delivery === 'auto' && input.phone)) {
    return input.phone
      ? `We resent your booking manage link by text to ${input.phone}.`
      : 'We resent your booking manage link by text.';
  }
  if (
    input.delivery === 'email' ||
    (input.delivery === 'auto' && input.email)
  ) {
    return input.email
      ? `We resent your booking manage link to ${input.email}.`
      : 'We resent your booking manage link to your email.';
  }
  return 'We resent your booking manage link.';
}
