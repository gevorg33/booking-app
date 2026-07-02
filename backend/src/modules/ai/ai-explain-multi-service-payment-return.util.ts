import { isConsumerDiagnoseStripeCheckoutFailurePrompt } from './ai-diagnose-stripe-checkout-failure.util.js';
import { isExplainMultiServiceCartPrompt } from './ai-explain-multi-service-cart.util.js';
import { isResumePendingPaymentPrompt } from './ai-resume-pending-payment.util.js';
import { isResumeBookingDraftPrompt } from './ai-resume-booking-draft.util.js';
import { parseCartServiceIds } from './ai-self-service-booking.util.js';
import { CUSTOMER_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CLASSIFIER_RULES } from './ai-explain-multi-service-payment-return.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_SCENARIOS } from './ai-explain-multi-service-payment-return-multilingual.fixtures.js';
import type { ExplainMultiServicePaymentReturnAspect } from './ai-explain-multi-service-payment-return.fixtures.js';

export { CUSTOMER_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CLASSIFIER_RULES };

/** Matches consumer-app `multiServicePaymentReturnHint`. */
export const MULTI_SERVICE_PAYMENT_RETURN_HINT =
  'Complete payment in your browser, then return here to confirm your booking.';

export const EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_INTENTS = [
  'explain_multi_service_payment_return',
] as const;

export type ExplainMultiServicePaymentReturnIntent =
  (typeof EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_INTENTS)[number];

export interface PendingMultiCheckoutPaymentContext {
  sessionId: string;
  serviceIds: string[];
  slug?: string;
}

const MULTI_SERVICE_CONTEXT = new RegExp(
  String.raw`\b(multi[\s-]?service|spa\s+day|multiple\s+services|several\s+services|two\s+services|massage\s+and\s+facial|facial\s+and\s+massage|treatments?\s+together|services?\s+together|cart)\b|spa\s+day|բազմածառայ|нескольк`,
  'iu',
);

const PAID_NOT_CONFIRMED = new RegExp(
  String.raw`\b(paid|payment\s+(?:went\s+through|succeeded|completed|worked)|charged|finished\s+paying|completed\s+payment)\b.{0,50}\b(?:but|yet|still|nothing\s+happened|—)\b.{0,50}\b(?:not\s+confirm(?:ed)?|unconfirm|no\s+confirm(?:ation)?|did(?:n't| not)\s+confirm|booking\s+not|appointment\s+not|appointments?\s+not|hasn't\s+confirm|pending|where(?:'s|\s+is)\s+my\s+booking)\b|\b(?:payment|paid)\b.{0,40}\bsucceeded\b.{0,40}\bwhere(?:'s|\s+is)\s+my\s+booking\b|\b(booking|appointment|visit|record)\b.{0,40}\b(?:not\s+confirm(?:ed)?|unconfirm|no\s+confirmation|did(?:n't| not)\s+(?:save|book)|still\s+pending)\b.{0,40}\b(?:paid|payment|stripe|pay)\b|\bpaid\s+for\b.{0,40}\b(?:no\s+confirmation|not\s+confirm(?:ed)?)\b|\bվճար.{0,30}(բայց|չի\s+հաստատ)|оплат.{0,30}(но|не\s+подтверж)`,
  'iu',
);

const STRIPE_RETURN = new RegExp(
  String.raw`\b(return(?:ed)?|back|come\s+back)\b.{0,40}\b(?:from\s+)?(?:stripe|browser|payment|checkout|paying)\b|\b(?:stripe|browser|checkout)\b.{0,30}\b(?:return|done|finished)\b|\breturn\s+here\b.{0,30}\b(?:pay|payment|after)\b|վերադարձ.{0,20}stripe|вернул.{0,20}stripe`,
  'iu',
);

const CONFIRM_AFTER_BROWSER = new RegExp(
  String.raw`\b(now\s+what|what\s+(?:now|next|do\s+i\s+do)|how\s+(?:do\s+i|to)\s+confirm)\b.{0,40}\b(?:after|multi[\s-]?service|stripe|browser|payment|checkout)\b|\bconfirm\b.{0,30}\b(?:after|multi[\s-]?service|stripe|browser)\b|\bfinished\s+pay(?:ing)?\s+(?:in\s+)?(?:the\s+)?browser\b|ինչ\s+ան(?:եմ|ել)|что\s+делать`,
  'iu',
);

const PAYMENT_FAILED_CUE = new RegExp(
  String.raw`\b(fail(?:ed|ure|s|ing)?|declin(?:ed|e)|reject(?:ed|ion)|denied|error|broken|won(?:'t| not)\s+(?:go\s+through|work))\b.{0,30}\b(?:payment|checkout|stripe|card)\b|\b(payment|checkout|stripe|card)\b.{0,30}\b(fail(?:ed|ure|s|ing)?|declin(?:ed|e)|reject(?:ed|ion)|denied|error|broken)\b|ձախող|отклон|ошибк`,
  'iu',
);

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function matchMultilingualScenario(
  prompt: string,
):
  | (typeof EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  return (
    EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_SCENARIOS.find(
      (scenario) => scenario.prompt === trimmed,
    ) ?? null
  );
}

function hasMultiServiceContext(
  prompt: string,
  params: Record<string, unknown>,
): boolean {
  const serviceIds = parsePendingMultiCheckoutServiceIds(params);
  if (serviceIds.length >= 2) return true;
  return MULTI_SERVICE_CONTEXT.test(prompt);
}

export function isExplainMultiServicePaymentReturnIntent(
  action: string,
): action is ExplainMultiServicePaymentReturnIntent {
  return (
    EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_INTENTS as readonly string[]
  ).includes(action);
}

export function parsePendingMultiCheckoutServiceIds(
  params: Record<string, unknown> = {},
): string[] {
  const nested = params.pendingMultiCheckoutPayment;
  if (nested && typeof nested === 'object') {
    const fromNested = parseCartServiceIds(
      (nested as Record<string, unknown>).serviceIds,
    );
    if (fromNested.length >= 2) return fromNested;
  }

  const fromCart = parseCartServiceIds(params.cartServiceIds);
  if (fromCart.length >= 2) return fromCart;

  const servicesParam = readString(params.services);
  if (servicesParam) {
    return parseCartServiceIds(servicesParam);
  }

  return fromCart;
}

export function parsePendingMultiCheckoutPaymentFromParams(
  params: Record<string, unknown> = {},
): PendingMultiCheckoutPaymentContext | null {
  const nested = params.pendingMultiCheckoutPayment;
  if (nested && typeof nested === 'object') {
    const record = nested as Record<string, unknown>;
    const sessionId = readString(record.sessionId);
    const serviceIds = parseCartServiceIds(record.serviceIds);
    if (sessionId && serviceIds.length >= 2) {
      return {
        sessionId,
        serviceIds,
        slug: readString(record.slug),
      };
    }
  }

  const sessionId = readString(params.pendingMultiCheckoutSessionId);
  const serviceIds = parsePendingMultiCheckoutServiceIds(params);
  if (!sessionId || serviceIds.length < 2) return null;

  return {
    sessionId,
    serviceIds,
    slug: readString(params.bookingDraftSlug) ?? readString(params.slug),
  };
}

export function parseMultiServicePaymentReturnAspect(
  prompt: string,
  params: Record<string, unknown> = {},
): ExplainMultiServicePaymentReturnAspect {
  const fromParams = readString(params.aspect);
  if (
    fromParams === 'paid_not_confirmed' ||
    fromParams === 'return_from_stripe' ||
    fromParams === 'confirm_after_browser' ||
    fromParams === 'generic' ||
    fromParams === 'all'
  ) {
    return fromParams;
  }

  if (PAID_NOT_CONFIRMED.test(prompt)) return 'paid_not_confirmed';
  if (STRIPE_RETURN.test(prompt)) return 'return_from_stripe';
  if (CONFIRM_AFTER_BROWSER.test(prompt)) return 'confirm_after_browser';
  return 'generic';
}

export function isExplainMultiServicePaymentReturnPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  if (matchMultilingualScenario(prompt)) return true;
  if (isConsumerDiagnoseStripeCheckoutFailurePrompt(prompt)) return false;
  if (isResumePendingPaymentPrompt(prompt)) return false;
  if (isResumeBookingDraftPrompt(prompt)) return false;
  if (isExplainMultiServiceCartPrompt(prompt)) return false;
  if (PAYMENT_FAILED_CUE.test(prompt) && !PAID_NOT_CONFIRMED.test(prompt)) {
    return false;
  }

  const text = prompt.trim();
  if (!text) return false;

  if (/\bI\s+paid\s+but\s+booking\s+not\s+confirmed\b/i.test(text)) return true;
  if (/\breturn\s+from\s+stripe\b/i.test(text) && /\bspa\s+day\b/i.test(text)) {
    return true;
  }
  if (
    /\bpayment\s+went\s+through\b/i.test(text) &&
    /\bnot\s+booked\b/i.test(text)
  ) {
    return true;
  }
  if (
    /\bcompleted\s+payment\b/i.test(text) &&
    /\bnothing\s+happened\b/i.test(text)
  ) {
    return true;
  }
  if (/\bfinished\s+paying\s+in\s+the\s+browser\b/i.test(text)) return true;
  if (/\bback\s+from\s+stripe\b/i.test(text)) return true;
  if (/\bstripe\s+checkout\s+done\b/i.test(text)) return true;
  if (
    /\bpaid\s+for\b/i.test(text) &&
    /\b(?:spa\s+day|no\s+confirmation)\b/i.test(text)
  ) {
    return true;
  }
  if (
    /\bpayment\s+succeeded\b/i.test(text) &&
    /\bwhere(?:'s|\s+is)\s+my\s+booking\b/i.test(text)
  ) {
    return true;
  }
  if (
    /\bpaid\s+for\b/i.test(text) &&
    /\b(?:massage|facial|spa\s+day|multiple\s+services|multi[\s-]?service)\b/i.test(
      text,
    ) &&
    /\b(?:not\s+confirm(?:ed)?|no\s+confirmation)\b/i.test(text)
  ) {
    return true;
  }

  const hasPaymentReturnCue =
    PAID_NOT_CONFIRMED.test(text) ||
    STRIPE_RETURN.test(text) ||
    CONFIRM_AFTER_BROWSER.test(text);

  if (!hasPaymentReturnCue) return false;
  return hasMultiServiceContext(text, params);
}

export function parseExplainMultiServicePaymentReturnFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: ExplainMultiServicePaymentReturnAspect } | null {
  if (!isExplainMultiServicePaymentReturnPrompt(prompt, params)) return null;
  return { aspect: parseMultiServicePaymentReturnAspect(prompt, params) };
}

export function rescueExplainMultiServicePaymentReturnIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown> = {},
): {
  action: ExplainMultiServicePaymentReturnIntent;
  rescueReason: string;
} | null {
  if (isExplainMultiServicePaymentReturnIntent(action)) return null;
  if (!isExplainMultiServicePaymentReturnPrompt(prompt, params)) return null;
  return {
    action: 'explain_multi_service_payment_return',
    rescueReason: 'explain_multi_service_payment_return',
  };
}

export function buildMultiServicePaymentReturnExplanation(
  aspect: ExplainMultiServicePaymentReturnAspect,
): { summaryParts: string[]; nextSteps: string[] } {
  const summaryParts = [MULTI_SERVICE_PAYMENT_RETURN_HINT];
  const nextSteps = [
    'When you return to the app, open your multi-service checkout and tap I completed payment to finalize every appointment.',
  ];

  if (aspect === 'paid_not_confirmed') {
    summaryParts.unshift(
      'If Stripe already charged you, the visit is not confirmed until you finish the return step in the app.',
    );
  } else if (aspect === 'return_from_stripe') {
    summaryParts.unshift(
      'After paying for a spa day or multi-service cart in the browser, switch back to the app to confirm.',
    );
  } else if (aspect === 'confirm_after_browser') {
    summaryParts.unshift(
      'Multi-service online checkout opens Stripe in your browser — the app waits for you to come back.',
    );
  }

  nextSteps.push(
    'If confirmation still fails, check your email receipt or contact the salon before paying again.',
  );

  return { summaryParts, nextSteps };
}

export function buildExplainMultiServicePaymentReturnNavigate(
  params: Record<string, unknown> = {},
): { path: string; query: Record<string, string> } | undefined {
  const pending = parsePendingMultiCheckoutPaymentFromParams(params);
  const serviceIds = pending?.serviceIds.length
    ? pending.serviceIds
    : parsePendingMultiCheckoutServiceIds(params);
  if (serviceIds.length < 2) return undefined;

  const query: Record<string, string> = {
    services: serviceIds.join(','),
    confirmPaymentReturn: '1',
  };
  const sessionId =
    pending?.sessionId ?? readString(params.pendingMultiCheckoutSessionId);
  if (sessionId) query.session_id = sessionId;

  return { path: 'multi/checkout', query };
}
