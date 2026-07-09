import { isExplicitPayOnlinePrompt } from './ai-pay-online-checkout.util.js';

export const RESUME_PENDING_PAYMENT_INTENTS = [
  'resume_pending_payment',
] as const;

export type ResumePendingPaymentIntent =
  (typeof RESUME_PENDING_PAYMENT_INTENTS)[number];

export interface PendingCheckoutPaymentContext {
  sessionId: string;
  serviceId: string;
  startTime: string;
  employeeId?: string;
}

export const CUSTOMER_RESUME_PENDING_PAYMENT_CLASSIFIER_RULES = `- resume_pending_payment: READ — customer app only: restore an in-progress Stripe checkout saved on this device (PendingCheckoutPayment) after the user closed the app or left mid-payment. Triggers: "Continue my payment", "I closed the app mid-checkout", "pick up where I left off on payment", "restore my pending payment". Requires pendingCheckoutSessionId + pendingCheckoutServiceId + pendingCheckoutStartTime in session from device storage. Returns navigate back to checkout with session_id. NOT resume_booking_draft (mid-booking draft before payment — customer + public), NOT pay_online (start or continue card checkout explicitly), NOT explain_why_stripe_required, NOT explain_amount_due_now, and NOT public booking web (no device session restore).`;

const RESUME_PAYMENT_CUE = new RegExp(
  String.raw`\b(resume|restore|pick\s+up\s+where|left\s+off|abandoned|incomplete|interrupted|did(?:n't| not)\s+finish|was\s+paying|mid[\s-]?checkout|closed\s+(?:the\s+)?app|left\s+during|take\s+me\s+back)\b|շարունակ.{0,20}վճար|կիսատ.{0,15}checkout|продолж.{0,20}оплат|закрыл.{0,15}приложен`,
  'iu',
);

const PAYMENT_CHECKOUT_CONTEXT = new RegExp(
  String.raw`\b(?:my\s+)?payment|checkout|stripe|paying|card\s+checkout\b|վճար|оплат`,
  'iu',
);

const EXPLICIT_NEW_PAY_ONLINE = new RegExp(
  String.raw`\b(pay\s+online|pay\s+with\s+card|pay\s+by\s+card|open\s+stripe|secure\s+card\s+checkout)\b`,
  'iu',
);

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function parsePendingCheckoutPaymentFromParams(
  params: Record<string, unknown> = {},
): PendingCheckoutPaymentContext | null {
  const nested = params.pendingCheckoutPayment;
  if (nested && typeof nested === 'object') {
    const record = nested as Record<string, unknown>;
    const sessionId = readString(record.sessionId);
    const serviceId = readString(record.serviceId);
    const startTime = readString(record.startTime);
    if (sessionId && serviceId && startTime) {
      return {
        sessionId,
        serviceId,
        startTime,
        employeeId: readString(record.employeeId),
      };
    }
  }

  const sessionId =
    readString(params.pendingCheckoutSessionId) ??
    readString(params.pendingSessionId);
  const serviceId = readString(params.pendingCheckoutServiceId);
  const startTime = readString(params.pendingCheckoutStartTime);
  if (!sessionId || !serviceId || !startTime) return null;

  return {
    sessionId,
    serviceId,
    startTime,
    employeeId: readString(params.pendingCheckoutEmployeeId),
  };
}

export function isResumePendingPaymentIntent(
  action: string,
): action is ResumePendingPaymentIntent {
  return (RESUME_PENDING_PAYMENT_INTENTS as readonly string[]).includes(action);
}

export function isResumePendingPaymentPrompt(prompt: string): boolean {
  if (/\bcontinue\s+where\s+I\s+left\s+off\b/i.test(prompt)) return false;
  if (/\brestore\s+my\s+half[\s-]?finished\s+booking\b/i.test(prompt)) {
    return false;
  }
  if (
    /\bcontinue\s+my\s+(?:unfinished|half[\s-]?finished)\s+booking\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (/\bcontinue\s+my\s+payment\b/i.test(prompt)) return true;

  const hasCardMention = /քարտ|карт/iu.test(prompt);
  if (
    /(?:վերականգն.{0,20}վճար|կիսատ.{0,15}checkout|закрыл.{0,20}приложени)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    !hasCardMention &&
    /(?:շարունակ.{0,20}վճարում|продолжить\s+оплату)/iu.test(prompt)
  ) {
    return true;
  }
  if (/не\s+закончил/iu.test(prompt) && /оплат/iu.test(prompt)) {
    return true;
  }

  if (hasCardMention && isExplicitPayOnlinePrompt(prompt)) return false;

  if (
    EXPLICIT_NEW_PAY_ONLINE.test(prompt) &&
    !RESUME_PAYMENT_CUE.test(prompt)
  ) {
    return false;
  }
  if (isExplicitPayOnlinePrompt(prompt) && !RESUME_PAYMENT_CUE.test(prompt)) {
    return false;
  }

  if (!RESUME_PAYMENT_CUE.test(prompt)) return false;

  if (/\bcontinue\s+checkout\b/i.test(prompt)) return true;

  return PAYMENT_CHECKOUT_CONTEXT.test(prompt);
}

export function parseResumePendingPaymentFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { pending: PendingCheckoutPaymentContext | null } | null {
  if (!isResumePendingPaymentPrompt(prompt)) return null;
  return { pending: parsePendingCheckoutPaymentFromParams(params) };
}

export function rescueResumePendingPaymentIntent(
  prompt: string,
  action: string,
): { action: ResumePendingPaymentIntent; rescueReason: string } | null {
  if (isResumePendingPaymentIntent(action)) return null;
  if (!isResumePendingPaymentPrompt(prompt)) return null;
  return {
    action: 'resume_pending_payment',
    rescueReason: 'resume_pending_payment',
  };
}

export function buildResumePendingPaymentNavigate(input: {
  serviceId: string;
  startTime: string;
  sessionId: string;
  employeeId?: string;
}): { path: string; query: Record<string, string> } {
  return {
    path: 'checkout',
    query: {
      serviceId: input.serviceId,
      startTime: input.startTime,
      session_id: input.sessionId,
      resumePayment: '1',
      ...(input.employeeId ? { employeeId: input.employeeId } : {}),
    },
  };
}
