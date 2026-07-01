import { hasSignInToManageBookingCue } from './ai-sign-in-to-manage-booking.util.js';
import {
  extractGuestContactFromPrompt,
  normalizeGuestContactPhone,
  resolveManageLinkDelivery,
  type GetManageLinkDelivery,
} from './ai-get-manage-link.util.js';
import { RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS } from './ai-recover-lost-manage-link-multilingual.fixtures.js';
import {
  RECOVER_LOST_MANAGE_LINK_PROMPTS,
  type RecoverLostManageLinkPromptFixture,
} from './ai-recover-lost-manage-link.fixtures.js';

export const RECOVER_LOST_MANAGE_LINK_INTENTS = [
  'recover_lost_manage_link',
] as const;

export type RecoverLostManageLinkIntent =
  (typeof RECOVER_LOST_MANAGE_LINK_INTENTS)[number];

export {
  CUSTOMER_PUBLIC_RECOVER_LOST_MANAGE_LINK_CLASSIFIER_RULES,
  RECOVER_LOST_MANAGE_LINK_PROMPTS,
  RECOVER_LOST_MANAGE_LINK_RESCUE_SCENARIOS,
} from './ai-recover-lost-manage-link.fixtures.js';
export { RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_CLASSIFIER_RULES } from './ai-recover-lost-manage-link-multilingual.fixtures.js';

const GUEST_RESEND_CUE = new RegExp(
  String.raw`\b(?:resend|re-?send|lost|missing|didn'?t\s+get|never\s+got|confirmation\s+email|confirmation\s+text|text\s+me|sms\s+me|email\s+me)\b|կորցր|վերաուղարկ|перешл|потерял|не\s+получил|sms|հաստատման\s+նամակ`,
  'iu',
);

const MANAGE_LINK_CUE = new RegExp(
  String.raw`\b(?:manage\s+link|booking\s+link|reschedule\s+link|cancel\s+link|self[\s-]?service\s+link|appointment\s+link|manage\s+my\s+booking)\b|karavarman\s+hghum|управлен|ссылк.*(?:запис|брон|управлен)`,
  'iu',
);

const SHARE_CUE = new RegExp(
  String.raw`\b(?:share|partner|friend|family|forward\s+to\s+someone)\b|կիս|ընկեր|подел|партн`,
  'iu',
);

function matchRecoverLostManageLinkScenario(
  prompt: string,
):
  | RecoverLostManageLinkPromptFixture
  | (typeof RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of RECOVER_LOST_MANAGE_LINK_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function hasRecoverLostManageLinkCue(prompt: string): boolean {
  if (matchRecoverLostManageLinkScenario(prompt)) return true;
  const contact = extractGuestContactFromPrompt(prompt);
  if (
    (contact.email || contact.phone) &&
    (GUEST_RESEND_CUE.test(prompt) || MANAGE_LINK_CUE.test(prompt))
  ) {
    return true;
  }
  if (
    GUEST_RESEND_CUE.test(prompt) &&
    /\b(?:booking|appointment|visit|manage|confirmation|link)\b/i.test(prompt)
  ) {
    return true;
  }
  return (
    /(?:guest|without\s+account|as\s+a\s+guest)/i.test(prompt) &&
    MANAGE_LINK_CUE.test(prompt)
  );
}

export function isRecoverLostManageLinkPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (hasSignInToManageBookingCue(text)) return false;
  if (SHARE_CUE.test(text) && !MANAGE_LINK_CUE.test(text)) return false;
  if (matchRecoverLostManageLinkScenario(text)) return true;

  if (
    /(?:կորցր.{0,24}(?:հաստատման|amragr)|потерял.{0,24}(?:письмо|подтвержд)|не\s+получил.{0,24}(?:письмо|sms|ссылк))/iu.test(
      text,
    )
  ) {
    return true;
  }

  if (
    /(?:ուղարկ|send|resend|text|sms|email).{0,40}(?:link|hghum|ссылк|управлен)/iu.test(
      text,
    ) &&
    (/@/.test(text) ||
      /\d[\d\s().-]{6,}\d/.test(text) ||
      GUEST_RESEND_CUE.test(text))
  ) {
    return true;
  }

  return hasRecoverLostManageLinkCue(text);
}

export function isRecoverLostManageLinkIntent(
  action: string,
): action is RecoverLostManageLinkIntent {
  return (RECOVER_LOST_MANAGE_LINK_INTENTS as readonly string[]).includes(
    action,
  );
}

export interface ParsedRecoverLostManageLink {
  email?: string;
  phone?: string;
  guestLookup: true;
  delivery: GetManageLinkDelivery;
}

export function parseRecoverLostManageLinkFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedRecoverLostManageLink | null {
  if (!isRecoverLostManageLinkPrompt(prompt)) return null;

  const contactFromPrompt = extractGuestContactFromPrompt(prompt);
  const email =
    (typeof params.email === 'string'
      ? params.email.trim().toLowerCase()
      : undefined) ?? contactFromPrompt.email;
  const phone =
    (typeof params.phone === 'string'
      ? normalizeGuestContactPhone(params.phone)
      : undefined) ?? contactFromPrompt.phone;

  const delivery =
    (params.delivery as GetManageLinkDelivery | undefined) ??
    resolveManageLinkDelivery(prompt, { email, phone });

  return {
    guestLookup: true,
    delivery,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

export function rescueRecoverLostManageLinkIntent(
  prompt: string,
  action: string,
): { action: RecoverLostManageLinkIntent; rescueReason: string } | null {
  if (isRecoverLostManageLinkIntent(action)) return null;
  if (!parseRecoverLostManageLinkFromPrompt(prompt)) return null;
  return {
    action: 'recover_lost_manage_link',
    rescueReason: 'recover_manage_link',
  };
}
