import { isSignInAfterBookingPrompt } from './ai-sign-in-after-booking.util.js';
import { isExplainManageBookingPagePrompt } from './ai-explain-manage-booking-page.util.js';
import { SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-sign-in-to-manage-booking-multilingual.fixtures.js';
import {
  SIGN_IN_TO_MANAGE_BOOKING_PROMPTS,
  type SignInToManageBookingAspect,
  type SignInToManageBookingPromptFixture,
} from './ai-sign-in-to-manage-booking.fixtures.js';

export const SIGN_IN_TO_MANAGE_BOOKING_INTENTS = [
  'sign_in_to_manage_booking',
] as const;

export type SignInToManageBookingIntent =
  (typeof SIGN_IN_TO_MANAGE_BOOKING_INTENTS)[number];

export {
  CUSTOMER_PUBLIC_SIGN_IN_TO_MANAGE_BOOKING_CLASSIFIER_RULES,
  SIGN_IN_TO_MANAGE_BOOKING_PROMPTS,
  SIGN_IN_TO_MANAGE_BOOKING_RESCUE_SCENARIOS,
} from './ai-sign-in-to-manage-booking.fixtures.js';
export { SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_CLASSIFIER_RULES } from './ai-sign-in-to-manage-booking-multilingual.fixtures.js';

const HY_RU_MANAGE_SIGN_IN_CUE =
  /մուտք.{0,16}(?:փոխել|կառավար)|կառավարման\s+հղում|վերաճակել|войти.{0,16}(?:измен|управлен)|ссылк.{0,16}управлен|недействителен/i;

const MANAGE_PAGE_CUE =
  /\b(?:manage\s+(?:booking\s+)?page|manage\s+link|booking\s+manage\s+page|self[\s-]?service\s+link|manage\s+from\s+(?:my|your)\s+account)\b|կառավարման\s+էջ|հղում|страниц.{0,12}управлен|ссылк.{0,12}управлен/i;

const SIGN_IN_MANAGE_ACTION_CUE =
  /\b(?:sign[\s-]?in|log[\s-]?in|log[\s-]?ged\s+in)\b.+\b(?:change|reschedule|cancel|manage|appointment|booking|visit)\b|\b(?:change|reschedule|cancel|manage)\b.+\b(?:sign[\s-]?in|log[\s-]?in|account)\b|մուտք\s+գործել|войти\s+чтобы/i;

const INVALID_MANAGE_LINK_CUE =
  /\b(?:invalid|expired|broken|missing|doesn'?t\s+work|not\s+working)\b.+\b(?:manage|booking)\s+link\b|\bmanage\s+link\b.+\b(?:invalid|expired|broken|doesn'?t\s+work)\b|կիրառ\s+չէ\s+հղում|недействител/i;

const RESEND_MANAGE_LINK_CUE =
  /\b(?:resend|re-?send|lost|send\s+me|text\s+me|email\s+me|show\s+me)\b.+\b(?:manage|booking)\s+link\b|\b(?:manage|booking)\s+link\b.+\b(?:to\s+\S+@|resend|re-?send)\b/i;

const DIRECT_MUTATE_CUE =
  /\b(?:cancel|reschedule)\s+my\s+(?:booking|appointment|visit)\b/i;

function matchSignInToManageBookingScenario(
  prompt: string,
):
  | SignInToManageBookingPromptFixture
  | (typeof SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of SIGN_IN_TO_MANAGE_BOOKING_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function hasSignInToManageBookingCue(prompt: string): boolean {
  return (
    (SIGN_IN_MANAGE_ACTION_CUE.test(prompt) && MANAGE_PAGE_CUE.test(prompt)) ||
    (SIGN_IN_MANAGE_ACTION_CUE.test(prompt) &&
      /\b(?:manage|appointment|booking|visit)\b/i.test(prompt)) ||
    (INVALID_MANAGE_LINK_CUE.test(prompt) &&
      /\b(?:sign[\s-]?in|log[\s-]?in|account)\b/i.test(prompt))
  );
}

export function inferSignInToManageBookingAspect(
  prompt: string,
): SignInToManageBookingAspect {
  const scenario = matchSignInToManageBookingScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (INVALID_MANAGE_LINK_CUE.test(prompt)) return 'invalid_link';
  if (
    /\b(how\s+do\s+i\s+sign|how\s+to\s+(?:sign|log)\s+in)\b/i.test(prompt) &&
    /\bmanage\b/i.test(prompt)
  ) {
    return 'how_to';
  }
  if (/\bmanage\s+from\s+(?:my|your)\s+account\b/i.test(prompt)) {
    return 'account_path';
  }
  if (SIGN_IN_MANAGE_ACTION_CUE.test(prompt)) return 'manage_hint';
  return 'all';
}

function isBareExplainWhySignInPrompt(prompt: string): boolean {
  return (
    /\b(do i need an account|benefit of signing in|why should i sign in before booking|book without an account|what do i get with an account)\b/i.test(
      prompt,
    ) &&
    !MANAGE_PAGE_CUE.test(prompt) &&
    !SIGN_IN_MANAGE_ACTION_CUE.test(prompt) &&
    !INVALID_MANAGE_LINK_CUE.test(prompt)
  );
}

export function isSignInToManageBookingPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isExplainManageBookingPagePrompt(text)) return false;
  if (matchSignInToManageBookingScenario(text)) return true;
  if (isSignInAfterBookingPrompt(text)) return false;
  if (isBareExplainWhySignInPrompt(text)) return false;
  if (RESEND_MANAGE_LINK_CUE.test(text)) return false;
  if (
    DIRECT_MUTATE_CUE.test(text) &&
    !/\b(?:sign|log|account|why|need)\b/i.test(text)
  ) {
    return false;
  }
  if (HY_RU_MANAGE_SIGN_IN_CUE.test(text)) return true;
  return hasSignInToManageBookingCue(text);
}

export function isSignInToManageBookingIntent(
  action: string,
): action is SignInToManageBookingIntent {
  return (SIGN_IN_TO_MANAGE_BOOKING_INTENTS as readonly string[]).includes(
    action,
  );
}

export function parseSignInToManageBookingFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: SignInToManageBookingAspect } | null {
  if (!isSignInToManageBookingPrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' &&
    ['manage_hint', 'invalid_link', 'account_path', 'how_to', 'all'].includes(
      params.aspect,
    )
      ? (params.aspect as SignInToManageBookingAspect)
      : undefined;
  return {
    aspect: aspectFromParams ?? inferSignInToManageBookingAspect(prompt),
  };
}

export function enrichSignInToManageBookingParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseSignInToManageBookingFromPrompt(prompt, params);
  if (!parsed) return params;
  return { ...params, aspect: parsed.aspect };
}

export function rescueSignInToManageBookingIntent(
  prompt: string,
  action: string,
): { action: SignInToManageBookingIntent; rescueReason: string } | null {
  if (isSignInToManageBookingIntent(action)) return null;
  if (!parseSignInToManageBookingFromPrompt(prompt)) return null;
  return {
    action: 'sign_in_to_manage_booking',
    rescueReason: 'sign_in_to_manage_booking',
  };
}

export function buildSignInToManageBookingSummary(input: {
  aspect: SignInToManageBookingAspect;
  signedIn: boolean;
}): string {
  if (input.signedIn) {
    return 'You are signed in. Open My appointments to cancel or reschedule this visit without the email manage link.';
  }

  const tokenPath =
    'If you have a valid manage link from your confirmation email or text, open it to cancel or reschedule as a guest.';
  const accountPath =
    'Or sign in with Google, Apple, or phone and manage the visit from My appointments — the same booking links to your account when the contact matches.';
  const invalidLink =
    'If the manage link is invalid or expired, sign in to find the visit under My appointments or ask to resend a fresh manage link.';
  const howTo =
    'Tap Sign in on the manage page or salon home, verify with Google, Apple, or phone, then open My appointments.';

  switch (input.aspect) {
    case 'invalid_link':
      return `${invalidLink} ${accountPath}`;
    case 'account_path':
      return accountPath;
    case 'how_to':
      return howTo;
    case 'manage_hint':
      return `The manage page may ask you to sign in when the visit cannot be changed with the link alone. ${tokenPath} ${accountPath}`;
    default:
      return `${tokenPath} ${accountPath}`;
  }
}

export function buildSignInToManageBookingNavigate(
  aspect: SignInToManageBookingAspect,
  signedIn: boolean,
  params: Record<string, unknown> = {},
): { path: string; query: Record<string, string> } | undefined {
  const bookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()) ||
    (typeof params.sessionBookingId === 'string' &&
      params.sessionBookingId.trim()) ||
    undefined;
  const token =
    typeof params.manageToken === 'string'
      ? params.manageToken.trim()
      : typeof params.token === 'string'
        ? params.token.trim()
        : undefined;

  if (signedIn) {
    return { path: 'account', query: {} };
  }
  if (aspect === 'invalid_link') {
    return { path: 'login', query: { reason: 'manage_booking' } };
  }
  if (bookingId && token && aspect !== 'how_to') {
    return {
      path: 'manage',
      query: { bookingId, token },
    };
  }
  if (
    aspect === 'how_to' ||
    aspect === 'manage_hint' ||
    aspect === 'account_path'
  ) {
    return { path: 'login', query: { reason: 'manage_booking' } };
  }
  return { path: 'login', query: { reason: 'manage_booking' } };
}
