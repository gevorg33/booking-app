import { isConsumerDiagnoseStripeCheckoutFailurePrompt } from './ai-diagnose-stripe-checkout-failure.util.js';
import {
  isAskPaymentOptionsPrompt,
  isExplicitPayCashAtVisitPrompt,
} from './ai-cash-payment-checkout.util.js';
import { isExplainWhyStripeRequiredPrompt } from './ai-payments.util.js';
import { CUSTOMER_PUBLIC_PAY_AT_VENUE_FALLBACK_CLASSIFIER_RULES } from './ai-pay-at-venue-fallback.fixtures.js';

export { CUSTOMER_PUBLIC_PAY_AT_VENUE_FALLBACK_CLASSIFIER_RULES };

export const PAY_AT_VENUE_FALLBACK_INTENTS = ['pay_at_venue_fallback'] as const;

export type PayAtVenueFallbackIntent =
  (typeof PAY_AT_VENUE_FALLBACK_INTENTS)[number];

function normalizePromptApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'");
}

const SKIP_ONLINE_CUE = new RegExp(
  String.raw`\b(skip|without|bypass|avoid|no|won't)\b.{0,30}\b(online\s+(?:card\s+)?pay(?:ment)?|stripe|card\s+pay(?:ment)?|online\s+checkout)\b|\b(?:don't|do not)\s+pay\s+online\b|\b(skip|bypass)\b.{0,15}\b(stripe|online)\b`,
  'iu',
);

/**
 * e2e-bug.114 — bare `\binstead\b` stole cancel/rebook prompts ("…Friday instead").
 * Require payment/venue/online context whenever "instead" / "rather" appears.
 */
const INSTEAD_CUE = new RegExp(
  String.raw`\bnot\s+online\b|\bthan\s+online\b|\b(pay\s+at\s+(?:the\s+)?(?:salon|venue|visit)).{0,25}\b(instead|rather)\b|\b(instead|rather\s+than).{0,25}\b(pay\s+online|online\s+pay|online|stripe|card)\b|\binstead\b.{0,40}\b(?:pay\s+(?:at\s+(?:the\s+)?(?:salon|venue|visit)|cash|online)|cash|stripe|card)\b|\brather\b.{0,40}\b(?:pay\s+at\s+(?:the\s+)?(?:salon|venue|visit)|online|cash|stripe|card)\b`,
  'iu',
);

/** Cancel/rebook/reschedule booking lifecycle — never pay-at-venue (e2e-bug.114). */
function isBookingLifecycleManagePrompt(prompt: string): boolean {
  if (/\bcancel\b/i.test(prompt) && /\brebook\b/i.test(prompt)) return true;
  if (
    /\b(cancel|rebook|reschedule)\b/i.test(prompt) &&
    /\b(booking|appointment|visit|reservation)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

const CONFIRM_AT_VISIT = new RegExp(
  String.raw`\bconfirm.{0,20}(?:and\s+)?pay.{0,20}at\s+(?:the\s+)?(?:visit|venue|salon)\b|\b(pay\s+at\s+(?:the\s+)?(?:salon|venue|visit)).{0,20}\bwithout\b.{0,20}\bonline\b`,
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

export function isPayAtVenueFallbackIntent(
  action: string,
): action is PayAtVenueFallbackIntent {
  return (PAY_AT_VENUE_FALLBACK_INTENTS as readonly string[]).includes(action);
}

export function isPayAtVenueFallbackPrompt(prompt: string): boolean {
  const text = normalizePromptApostrophes(prompt);

  const isFallbackPrompt =
    SKIP_ONLINE_CUE.test(text) ||
    INSTEAD_CUE.test(text) ||
    CONFIRM_AT_VISIT.test(text) ||
    (/\bpay\s+at\s+(?:the\s+)?(?:salon|venue)\b/i.test(text) &&
      /\b(instead|without|skip|no\s+online)\b/i.test(text)) ||
    (containsArmenianScript(text) &&
      /(բաց\s+թող|առանց|instead)/i.test(text) &&
      /(առցանց|online|stripe|salon|visit|այց|վճար)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(пропуст|без|вместо|instead)/i.test(text) &&
      /(онлайн|online|stripe|салон|визит|карт|оплат)/i.test(text));

  if (!isFallbackPrompt) return false;
  if (isBookingLifecycleManagePrompt(text)) return false;
  if (isConsumerDiagnoseStripeCheckoutFailurePrompt(text)) return false;
  if (isExplainWhyStripeRequiredPrompt(text)) return false;
  if (isAskPaymentOptionsPrompt(text)) return false;

  return true;
}

export function parsePayAtVenueFallbackFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { skipOnlinePayment: true } | null {
  if (!isPayAtVenueFallbackPrompt(prompt)) return null;
  void params;
  return { skipOnlinePayment: true };
}

export function rescuePayAtVenueFallbackIntent(
  prompt: string,
  action: string,
): { action: PayAtVenueFallbackIntent; rescueReason: string } | null {
  if (isPayAtVenueFallbackIntent(action)) return null;
  if (!isPayAtVenueFallbackPrompt(prompt)) return null;
  return {
    action: 'pay_at_venue_fallback',
    rescueReason: 'pay_at_venue_fallback',
  };
}

export function buildPayAtVenueFallbackNavigate(
  params: Record<string, unknown>,
): { path: string; query: Record<string, string> } | undefined {
  const serviceId = readString(params.serviceId);
  const startTime = readString(params.startTime);
  const employeeId = readString(params.employeeId);
  if (!serviceId && !startTime) return undefined;

  return {
    path: 'checkout',
    query: {
      ...(serviceId ? { serviceId } : {}),
      ...(startTime ? { startTime } : {}),
      ...(employeeId ? { employeeId } : {}),
      payment: 'cash',
      payAtVenue: '1',
      skipOnline: '1',
    },
  };
}
