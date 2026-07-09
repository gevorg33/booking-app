import {
  hasStripeCheckoutFailureContext,
  isStripeCheckoutFailureIntent,
  type StripeCheckoutFailureIntent,
} from './ai-stripe-checkout-failure.util.js';
import { isExplainWhyStripeRequiredPrompt } from './ai-payments.util.js';
import { isResumePendingPaymentPrompt } from './ai-resume-pending-payment.util.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';
import { CUSTOMER_PUBLIC_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES } from './ai-diagnose-stripe-checkout-failure.fixtures.js';

export { CUSTOMER_PUBLIC_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES };

export type ConsumerCheckoutFailureAspect =
  | 'card_declined'
  | 'session_error'
  | 'not_charged'
  | 'generic'
  | 'all';

const CARD_DECLINED = new RegExp(
  String.raw`\b(card|bank)\b.{0,40}\b(declin(?:ed|e)|reject(?:ed|ion)|denied|refus(?:ed|al)|do not honor|insufficient)\b|\b(declin(?:ed|e)|reject(?:ed|ion)|denied|refus(?:ed|al))\b.{0,40}\b(card|bank|charge)\b|քart.{0,20}մերժ|карт.{0,20}(отклон|отказ)|отклон.{0,20}карт`,
  'iu',
);

const PAYMENT_FAILED = new RegExp(
  String.raw`\b(payment|pay(?:ment)?|charge|checkout|online\s+(?:card\s+)?pay(?:ment)?|stripe)\b.{0,40}\b(fail(?:ed|ure|s|ing)?|did(?:n't| not)\s+(?:go\s+through|complete|work)|not\s+complete|unsuccessful|error|broken|could(?:n't| not)|can(?:not|'t)|won(?:'t| not)\s+(?:go\s+through|work|complete))\b|\b(fail(?:ed|ure|s|ing)?|error|broken)\b.{0,40}\b(payment|checkout|stripe|pay(?:ment)?)\b|\b(could(?:n't| not)|can(?:not|'t))\b.{0,20}\b(complete|pay|finish)\b.{0,20}\b(payment|checkout|online)\b|վճար.{0,20}(ձախող|չի\s+ավարտ)|оплат.{0,20}(не\s+прош|ошибк|сбой)`,
  'iu',
);

const NOT_CHARGED = new RegExp(
  String.raw`\b(was(?:n't| not)|not|no)\s+charg(?:ed|e)\b|\b(did(?:n't| not)\s+(?:get\s+)?charg(?:ed|e))\b|\bno\s+charge\b|չի\s+գանձ|не\s+списал`,
  'iu',
);

const SESSION_ERROR = new RegExp(
  String.raw`\b(checkout\s+session|session\s+expir|create\s+checkout|stripe\s+checkout)\b.{0,40}\b(fail|error|expir|invalid|broken)\b|\b(checkout|stripe)\b.{0,20}\b(did(?:n't| not)\s+work|error|expir)\b|session.{0,20}սխալ|сесси.{0,20}(ошибк|истек)`,
  'iu',
);

const WHAT_NOW = new RegExp(
  String.raw`\b(what\s+(?:now|should\s+i\s+do|next|can\s+i\s+do)|help|next\s+steps?)\b|ինչ\s+ան(?:եմ|ել)|что\s+делать`,
  'iu',
);

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function parseConsumerCheckoutFailureAspect(
  prompt: string,
  params: Record<string, unknown> = {},
): ConsumerCheckoutFailureAspect {
  const fromParams = readString(params.aspect);
  if (
    fromParams === 'card_declined' ||
    fromParams === 'session_error' ||
    fromParams === 'not_charged' ||
    fromParams === 'generic' ||
    fromParams === 'all'
  ) {
    return fromParams;
  }

  if (NOT_CHARGED.test(prompt)) return 'not_charged';
  if (CARD_DECLINED.test(prompt)) return 'card_declined';
  if (SESSION_ERROR.test(prompt)) return 'session_error';
  if (PAYMENT_FAILED.test(prompt) || WHAT_NOW.test(prompt)) return 'generic';
  if (containsArmenianScript(prompt) || containsCyrillicScript(prompt)) {
    return 'generic';
  }
  return 'generic';
}

export function isConsumerDiagnoseStripeCheckoutFailurePrompt(
  prompt: string,
): boolean {
  if (hasStripeCheckoutFailureContext(prompt)) return false;

  const isFailurePrompt =
    CARD_DECLINED.test(prompt) ||
    (NOT_CHARGED.test(prompt) && PAYMENT_FAILED.test(prompt)) ||
    SESSION_ERROR.test(prompt) ||
    PAYMENT_FAILED.test(prompt) ||
    (/\bpayment\b/i.test(prompt) &&
      /\bgo\s+through\b/i.test(prompt) &&
      /\b(won(?:'t| not)|can(?:not|'t))\b/i.test(prompt)) ||
    (WHAT_NOW.test(prompt) &&
      /\b(pay|payment|checkout|card|stripe)\b/i.test(prompt)) ||
    (containsArmenianScript(prompt) &&
      /(վճար|checkout|stripe|քart|card)/i.test(prompt) &&
      /(ձախող|մերժ|չի\s+ավարտ|սխալ|help)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(оплат|checkout|stripe|карт|плат)/i.test(prompt) &&
      /(не\s+прош|отклон|ошибк|сбой|что\s+делать|help)/i.test(prompt));

  if (!isFailurePrompt) return false;
  if (isResumePendingPaymentPrompt(prompt)) return false;
  if (isExplainWhyStripeRequiredPrompt(prompt)) return false;
  if (isAskPaymentOptionsPrompt(prompt)) return false;

  return true;
}

export function parseConsumerDiagnoseStripeCheckoutFailureFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: ConsumerCheckoutFailureAspect } | null {
  if (!isConsumerDiagnoseStripeCheckoutFailurePrompt(prompt)) return null;
  return { aspect: parseConsumerCheckoutFailureAspect(prompt, params) };
}

export function rescueConsumerDiagnoseStripeCheckoutFailureIntent(
  prompt: string,
  action: string,
): { action: StripeCheckoutFailureIntent; rescueReason: string } | null {
  if (isStripeCheckoutFailureIntent(action)) return null;
  if (!isConsumerDiagnoseStripeCheckoutFailurePrompt(prompt)) return null;
  return {
    action: 'diagnose_stripe_checkout_failure',
    rescueReason: 'diagnose_stripe_checkout_failure',
  };
}

export function buildConsumerDiagnoseStripeCheckoutFailureNavigate(
  params: Record<string, unknown>,
  input: {
    acceptCashPayments: boolean;
    aspect: ConsumerCheckoutFailureAspect;
  },
): { path: string; query: Record<string, string> } | undefined {
  const serviceId = readString(params.serviceId);
  const startTime = readString(params.startTime);
  const employeeId = readString(params.employeeId);
  if (!serviceId && !startTime) return undefined;

  const query: Record<string, string> = {};
  if (serviceId) query.serviceId = serviceId;
  if (startTime) query.startTime = startTime;
  if (employeeId) query.employeeId = employeeId;

  if (
    input.acceptCashPayments &&
    (input.aspect === 'card_declined' ||
      input.aspect === 'session_error' ||
      input.aspect === 'generic')
  ) {
    query.payment = 'cash';
  }

  return { path: 'checkout', query };
}
