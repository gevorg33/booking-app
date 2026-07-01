import { isExplainDataRightsPrompt } from './ai-data-rights.util.js';
import { isExplainTenantCurrencyPrompt } from './ai-tenant-currency.util.js';
import { isExplainCheckoutRecommendationsPrompt } from './ai-checkout-recommendations.util.js';
import { isExplainConsumerCheckoutSuccessPrompt } from './ai-consumer-checkout-success.util.js';
import { hasSignInToManageBookingCue } from './ai-sign-in-to-manage-booking.util.js';
import { EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS } from './ai-explain-why-sign-in-multilingual.fixtures.js';
import {
  EXPLAIN_WHY_SIGN_IN_PROMPTS,
  type ExplainWhySignInAspect,
  type ExplainWhySignInPromptFixture,
} from './ai-explain-why-sign-in.fixtures.js';

export const EXPLAIN_WHY_SIGN_IN_INTENTS = ['explain_why_sign_in'] as const;

export type ExplainWhySignInIntent =
  (typeof EXPLAIN_WHY_SIGN_IN_INTENTS)[number];

export {
  CUSTOMER_PUBLIC_EXPLAIN_WHY_SIGN_IN_CLASSIFIER_RULES,
  EXPLAIN_WHY_SIGN_IN_PROMPTS,
  EXPLAIN_WHY_SIGN_IN_RESCUE_SCENARIOS,
} from './ai-explain-why-sign-in.fixtures.js';
export { EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-why-sign-in-multilingual.fixtures.js';

const HY_RU_SIGN_IN_CUE =
  /պետք.{0,12}հաշիվ|մուտք.{0,12}օգուտ|առանց\s+հաշվի|нужен\s+ли\s+аккаунт|зачем\s+вход|без\s+аккаунта|гостевой\s+вход/iu;

const CHECKOUT_FIELD_TOPIC =
  /\b(?:e-?mail|email\s+address|phone|mobile|whatsapp|sms|name\s+field|contact\s+details?|reminder\s+toggle|privacy\s+consent|email\s+or\s+phone|phone\s+or\s+email|both\s+email)\b|էլ\.?\s*փոստ|հեռախոս|անուն|контактн|телефон|email\s+или/i;

const POST_BOOKING_SAVE_CUE =
  /\b(save (?:this )?booking to (?:my )?account|sign in with google after|post-booking sign|after (?:my )?booking|maybe later on save|confirmation screen save|turn my guest checkout into an account)\b/i;

const MANAGE_LINK_SIGN_IN_CUE =
  /\b(manage link says sign in|sign in to change my appointment|invalid manage link)\b/i;

const GUEST_CHECKOUT_FIELD_FOCUS =
  /\b(?:guest\s+checkout\s+requires?|what\s+guest\s+checkout|guest\s+checkout\s+fields?|pre-?fill(?:s|ed)?\s+(?:my\s+)?profile|signed[\s-]?in\s+checkout\s+pre-?fill|guest\s+booking\s+link|same\s+(?:email|phone).*(?:merge|link)|book(?:s|ed)?\s+as\s+a?\s+guest\s+with\s+the\s+same)\b/iu;

const ACCOUNT_SIGN_IN_TOPIC =
  /\b(?:account|sign[\s-]?in|log[\s-]?in|register|create\s+(?:an?\s+)?account|guest\s+checkout|without\s+(?:an?\s+)?account|signed[\s-]?in|stay\s+as\s+a?\s+guest|my\s+appointments?|past\s+appointments?|booking\s+history|benefit|worth\s+it)\b|հաշիվ|մուտք|գրանցվել|аккаунт|войти|регистрац|гостев/i;

const READ_CUE =
  /\b(what|why|how|do i|should i|can i|need|required|benefit|worth|explain|tell|difference|without|guest)\b|ինչ|ինչու|ինչպես|պետք|օգուտ|что|зачем|нужно|можно\s+ли|почему|объясни/i;

function matchExplainWhySignInScenario(
  prompt: string,
):
  | ExplainWhySignInPromptFixture
  | (typeof EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_WHY_SIGN_IN_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function hasExplainWhySignInCue(prompt: string): boolean {
  return ACCOUNT_SIGN_IN_TOPIC.test(prompt) && READ_CUE.test(prompt);
}

export function inferExplainWhySignInAspect(
  prompt: string,
): ExplainWhySignInAspect {
  const scenario = matchExplainWhySignInScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;

  if (
    /\b(how\s+do\s+i\s+sign|how\s+to\s+(?:sign|log)\s+in|where\s+(?:do\s+i|to)\s+sign\s+in)\b/i.test(
      prompt,
    )
  ) {
    return 'how_to';
  }
  if (
    /\b(past\s+appointments?|booking\s+history|my\s+appointments?|see\s+my\s+visits?)\b/i.test(
      prompt,
    )
  ) {
    return 'history';
  }
  if (
    /\b(benefit|worth|why\s+sign|what\s+do\s+i\s+get|manage\s+my\s+appointments?)\b/i.test(
      prompt,
    )
  ) {
    return 'benefits';
  }
  if (
    /\b(guest\s+vs|difference\s+between\s+guest|stay\s+as\s+a?\s+guest|guest\s+checkout\s+without)\b/i.test(
      prompt,
    )
  ) {
    return 'guest_vs_signed_in';
  }
  if (
    /\b(do\s+i\s+need|need\s+(?:an?\s+)?account|required|sign\s+up\s+to\s+book|without\s+(?:an?\s+)?account|book\s+without)\b/i.test(
      prompt,
    )
  ) {
    return 'required';
  }
  return 'all';
}

export function isExplainWhySignInPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isExplainCheckoutRecommendationsPrompt(text)) return false;
  if (isExplainConsumerCheckoutSuccessPrompt(text)) return false;
  if (matchExplainWhySignInScenario(text)) return true;
  if (POST_BOOKING_SAVE_CUE.test(text)) return false;
  if (MANAGE_LINK_SIGN_IN_CUE.test(text) || hasSignInToManageBookingCue(text)) {
    return false;
  }
  if (GUEST_CHECKOUT_FIELD_FOCUS.test(text)) return false;
  if (isExplainDataRightsPrompt(text)) return false;
  if (isExplainTenantCurrencyPrompt(text)) return false;
  if (CHECKOUT_FIELD_TOPIC.test(text) && !ACCOUNT_SIGN_IN_TOPIC.test(text)) {
    return false;
  }
  if (CHECKOUT_FIELD_TOPIC.test(text)) {
    if (
      /\b(why|what|do i need both|email\s+or\s+phone|phone\s+or\s+email)\b/i.test(
        text,
      ) &&
      !/\b(benefit|worth|account\s+required|sign\s+up\s+to\s+book)\b/i.test(
        text,
      )
    ) {
      return false;
    }
  }
  if (HY_RU_SIGN_IN_CUE.test(text)) return true;
  return hasExplainWhySignInCue(text);
}

export function isExplainWhySignInIntent(
  action: string,
): action is ExplainWhySignInIntent {
  return (EXPLAIN_WHY_SIGN_IN_INTENTS as readonly string[]).includes(action);
}

export function parseExplainWhySignInFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: ExplainWhySignInAspect } | null {
  if (!isExplainWhySignInPrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' &&
    [
      'required',
      'benefits',
      'guest_vs_signed_in',
      'history',
      'how_to',
      'all',
    ].includes(params.aspect)
      ? (params.aspect as ExplainWhySignInAspect)
      : undefined;
  return {
    aspect: aspectFromParams ?? inferExplainWhySignInAspect(prompt),
  };
}

export function enrichExplainWhySignInParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseExplainWhySignInFromPrompt(prompt, params);
  if (!parsed) return params;
  return { ...params, aspect: parsed.aspect };
}

export function rescueExplainWhySignInIntent(
  prompt: string,
  action: string,
): { action: ExplainWhySignInIntent; rescueReason: string } | null {
  if (isExplainWhySignInIntent(action)) return null;
  if (!parseExplainWhySignInFromPrompt(prompt)) return null;
  return {
    action: 'explain_why_sign_in',
    rescueReason: 'why_sign_in',
  };
}

export function buildExplainWhySignInSummary(input: {
  aspect: ExplainWhySignInAspect;
  signedIn: boolean;
}): string {
  if (input.signedIn) {
    if (input.aspect === 'how_to') {
      return 'You are already signed in. Open My appointments from the account tab to see upcoming and past visits, or Profile to update your details.';
    }
    if (input.aspect === 'history') {
      return 'You are signed in — upcoming and past appointments are in My appointments on this salon.';
    }
    return 'You are already signed in. Your profile pre-fills checkout, and you can manage visits, loyalty points, and packages from your account.';
  }

  const required =
    'You do not need an account to book. Guest checkout works with your name plus email or phone. Signing in is optional before you confirm.';
  const benefits =
    'Signing in pre-fills checkout from your profile, shows upcoming and past appointments, lets you manage visits, redeem loyalty points, and keeps subscriptions or packages on your account.';
  const guestVsSignedIn =
    'Guest checkout books one visit with the contact details you enter. Signed-in checkout reuses your profile, lists your visits at this salon, and links guest bookings made with the same email or phone when you sign in later.';
  const history =
    'Full booking history appears in My appointments after you sign in. As a guest you still get confirmation and manage links by email or SMS, but you will not see all past visits until you create an account.';
  const howTo =
    'Tap Sign in on the app or booking page and choose Google, Apple, or phone verification. You can also save a guest booking from the confirmation screen after checkout.';

  switch (input.aspect) {
    case 'required':
      return required;
    case 'benefits':
      return benefits;
    case 'guest_vs_signed_in':
      return guestVsSignedIn;
    case 'history':
      return history;
    case 'how_to':
      return howTo;
    default:
      return [required, benefits, guestVsSignedIn].join(' ');
  }
}

export function buildExplainWhySignInNavigate(
  aspect: ExplainWhySignInAspect,
  signedIn: boolean,
): { path: string; query: Record<string, string> } | undefined {
  if (signedIn) {
    if (aspect === 'history' || aspect === 'all') {
      return { path: 'account', query: {} };
    }
    return undefined;
  }
  if (aspect === 'how_to') {
    return { path: 'login', query: {} };
  }
  if (aspect === 'history' || aspect === 'benefits') {
    return { path: 'login', query: { reason: 'account_benefits' } };
  }
  return undefined;
}
