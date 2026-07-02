import { isGetManageLinkPrompt } from './ai-get-manage-link.util.js';
import { isRecoverLostManageLinkPrompt } from './ai-recover-lost-manage-link.util.js';
import { EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS } from './ai-explain-manage-booking-page-multilingual.fixtures.js';
import {
  EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS,
  type ExplainManageBookingPagePromptFixture,
  type ManageBookingPageAspect,
} from './ai-explain-manage-booking-page.fixtures.js';

export const EXPLAIN_MANAGE_BOOKING_PAGE_INTENTS = [
  'explain_manage_booking_page',
] as const;

export type ExplainManageBookingPageIntent =
  (typeof EXPLAIN_MANAGE_BOOKING_PAGE_INTENTS)[number];

export {
  CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES,
  EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS,
  EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS,
} from './ai-explain-manage-booking-page.fixtures.js';
export { EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-manage-booking-page-multilingual.fixtures.js';

const HY_RU_MANAGE_PAGE_EXPLAIN_CUE =
  /ինչ.{0,16}(?:կառավ|manage)|կառավարման\s+էջ|անվավեր.{0,12}հղում|что.{0,20}(?:управлен|страниц)|страниц.{0,12}управлен|недействител.{0,12}ссылк/i;

const MANAGE_PAGE_EXPLAIN_CUE =
  /\b(?:(?:what|which)\s+(?:can|could)\s+i\s+do|what\s+(?:is|does)|explain|help\s+with|how\s+does).{0,40}\bmanage\s+(?:booking\s+)?page\b|\bmanage\s+(?:booking\s+)?page\s+(?:help|options|for|show|work)|\bexplain\s+(?:the\s+)?manage\s+(?:booking\s+)?(?:page|link)|\bwhat\s+(?:does|can).{0,30}\bmanage\s+(?:link|page)\b|\bguest\s+manage\s+page\b|\bmanage\s+link\s+page\b/i;

const INVALID_MANAGE_LINK_EXPLAIN_CUE =
  /\b(?:invalid|expired|broken|missing|doesn'?t\s+work|not\s+working)\b.+\b(?:manage|booking)\s+link\b|\bmanage\s+link\b.+\b(?:invalid|expired|broken|doesn'?t\s+work|not\s+working)\b|\binvalid\s+manage\s+link\b|\b(?:manage|booking)\s+link\s+(?:error|failed)\b/i;

const SIGN_IN_MANAGE_ACTION_CUE =
  /\b(?:sign[\s-]?in|log[\s-]?in|log[\s-]?ged\s+in)\b.+\b(?:change|reschedule|cancel|manage|appointment|booking|visit)\b|\b(?:change|reschedule|cancel|manage)\b.+\b(?:sign[\s-]?in|log[\s-]?in|account)\b|մուտք\s+գործել|войти\s+чтобы/i;

function isSignInFocusedManagePrompt(prompt: string): boolean {
  return (
    (SIGN_IN_MANAGE_ACTION_CUE.test(prompt) &&
      /\b(?:manage|appointment|booking|visit)\b/i.test(prompt)) ||
    (/\b(?:invalid|expired|broken)\b/i.test(prompt) &&
      /\bmanage\s+link\b/i.test(prompt) &&
      /\b(?:sign[\s-]?in|log[\s-]?in|should\s+i\s+sign|account)\b/i.test(
        prompt,
      ))
  );
}

const DIRECT_MUTATE_CUE =
  /\b(?:cancel|reschedule)\s+my\s+(?:booking|appointment|visit)\b/i;

const EXPLAIN_FRAMING_CUE =
  /\b(?:explain|what|how|help|can\s+i|does|show|options|work|invalid|expired|broken)\b/i;

function matchExplainManageBookingPageScenario(
  prompt: string,
):
  | ExplainManageBookingPagePromptFixture
  | (typeof EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function inferManageBookingPageAspect(
  prompt: string,
): ManageBookingPageAspect {
  const scenario = matchExplainManageBookingPageScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (INVALID_MANAGE_LINK_EXPLAIN_CUE.test(prompt)) return 'invalid_link';
  if (/\bpackage\s+visit\b/i.test(prompt)) return 'package_visit';
  if (
    /\b(?:guest|token|confirmation\s+(?:email|text|sms))\b/i.test(prompt) &&
    /\bmanage\b/i.test(prompt)
  ) {
    return 'guest_token';
  }
  if (
    /\b(?:cancel|reschedule|change|options|actions|do)\b/i.test(prompt) &&
    /\bmanage\b/i.test(prompt)
  ) {
    return 'capabilities';
  }
  if (/\b(?:explain|help|overview|what\s+is)\b/i.test(prompt)) return 'all';
  return 'capabilities';
}

export function isExplainManageBookingPagePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainManageBookingPageScenario(text)) return true;
  if (isRecoverLostManageLinkPrompt(text)) return false;
  if (isGetManageLinkPrompt(text)) return false;
  if (
    isSignInFocusedManagePrompt(text) &&
    !MANAGE_PAGE_EXPLAIN_CUE.test(text)
  ) {
    return false;
  }
  if (DIRECT_MUTATE_CUE.test(text) && !EXPLAIN_FRAMING_CUE.test(text)) {
    return false;
  }
  if (HY_RU_MANAGE_PAGE_EXPLAIN_CUE.test(text)) return true;
  if (INVALID_MANAGE_LINK_EXPLAIN_CUE.test(text)) {
    return !/\b(?:sign[\s-]?in|log[\s-]?in|should\s+i\s+sign)\b/i.test(text);
  }
  return MANAGE_PAGE_EXPLAIN_CUE.test(text);
}

export function isExplainManageBookingPageIntent(
  action: string,
): action is ExplainManageBookingPageIntent {
  return (EXPLAIN_MANAGE_BOOKING_PAGE_INTENTS as readonly string[]).includes(
    action,
  );
}

export function parseExplainManageBookingPageFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: ManageBookingPageAspect } | null {
  if (!isExplainManageBookingPagePrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' &&
    [
      'capabilities',
      'invalid_link',
      'guest_token',
      'package_visit',
      'all',
    ].includes(params.aspect)
      ? (params.aspect as ManageBookingPageAspect)
      : undefined;
  return {
    aspect: aspectFromParams ?? inferManageBookingPageAspect(prompt),
  };
}

export function enrichExplainManageBookingPageParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseExplainManageBookingPageFromPrompt(prompt, params);
  if (!parsed) return params;
  return { ...params, aspect: parsed.aspect };
}

export function rescueExplainManageBookingPageIntent(
  prompt: string,
  action: string,
): { action: ExplainManageBookingPageIntent; rescueReason: string } | null {
  if (isExplainManageBookingPageIntent(action)) return null;
  if (!parseExplainManageBookingPageFromPrompt(prompt)) return null;
  return {
    action: 'explain_manage_booking_page',
    rescueReason: 'manage_booking_page',
  };
}

export function buildExplainManageBookingPageSummary(input: {
  aspect: ManageBookingPageAspect;
  signedIn: boolean;
}): string {
  const capabilities =
    'The manage page shows your appointment details and lets you cancel or reschedule when salon policy allows.';
  const packageVisit =
    'For package visits, it lists each appointment in the package with the same self-service actions.';
  const guestToken =
    'Open the manage link from your confirmation email or text — it includes a secure token so you can manage as a guest without signing in.';
  const invalidLink =
    'An invalid manage link usually means the bookingId or token is missing, expired, or truncated. Use the full link from confirmation, sign in under My appointments, or ask to resend the manage link.';
  const accountPath =
    'You can also sign in and manage the visit from My appointments when the contact matches your booking.';

  if (input.signedIn) {
    return `${capabilities} ${accountPath}`;
  }

  switch (input.aspect) {
    case 'invalid_link':
      return `${invalidLink} ${accountPath}`;
    case 'guest_token':
      return `${guestToken} ${capabilities}`;
    case 'package_visit':
      return `${packageVisit} ${capabilities} ${guestToken}`;
    case 'capabilities':
      return `${capabilities} ${guestToken}`;
    case 'all':
    default:
      return `${capabilities} ${packageVisit} ${guestToken} ${invalidLink}`;
  }
}

export function buildExplainManageBookingPageNavigate(
  aspect: ManageBookingPageAspect,
  params: Record<string, unknown> = {},
):
  | { path: 'manage' | 'account' | 'login'; query: Record<string, string> }
  | undefined {
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

  if (bookingId && token && aspect !== 'invalid_link') {
    return { path: 'manage', query: { bookingId, token } };
  }
  if (aspect === 'invalid_link') {
    return { path: 'login', query: { reason: 'manage_booking' } };
  }
  return undefined;
}
