import {
  enrichParamsWithSharedEntities,
  extractPaymentMethodFromPrompt,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import { isTrackPhysicalGiftCardPrompt } from './ai-customer-crm.util.js';
import {
  buildSharedBookingContextFromPrompt,
  mergeSharedBookingContext,
} from './ai-compound-booking-context.util.js';
import { isTrackGiftCardShipmentPrompt } from './ai-gift-fulfillment.util.js';
import { isCashBookingPrompt } from './ai-booking-depth.util.js';
import {
  decomposePaymentsCompoundPrompt,
  extractAmountFromPrompt,
  extractGiftCardCodeFromPrompt,
  isApplyGiftCardCodePrompt,
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
  isBuyGiftCardPhysicalPrompt,
  isChoosePaymentMethodPrompt,
  isPayCashAtVisitPrompt,
  isPayOnlinePrompt,
  type PaymentsCompoundStep,
} from './ai-payments.util.js';

/** Customer gift-card checkout & payment actions (ai-cmd-h3.4). */
export const GIFT_CARD_PAYMENTS_ACTIONS = [
  'book_nearest_slot',
  'check_providers_for_service',
  'apply_gift_card_code',
  'choose_payment_method',
  'pay_online',
  'pay_cash_at_visit',
  'buy_gift_card',
  'buy_gift_card_physical',
  'track_physical_gift_card_order',
] as const;

export type GiftCardPaymentsAction =
  (typeof GIFT_CARD_PAYMENTS_ACTIONS)[number];

const CHECKOUT_FOLLOW_UP_SOURCES = new Set([
  'book_nearest_slot',
  'check_providers_for_service',
  'apply_gift_card_code',
]);

const GIFT_CARD_PAYMENTS_SESSION_KEYS = [
  'giftCardCode',
  'paymentMethod',
  'giftCardOrderId',
  'deliveryMethod',
  'amount',
  'serviceName',
  'date',
  'timeSlot',
  'bookingFirstAvailable',
  'allProviders',
  'timeOfDay',
  'notBeforeTime',
  'lastAction',
] as const;

const HANDOFF_SPLIT =
  /\s*;\s*|\s*,\s*(?=(?:track|where|buy|purchase|order)\b)|\s+and\s+(?=(?:track|where|buy|purchase|order)\b)|\s+then\s+(?=(?:track|where)\b)/i;

export type GiftCardPaymentsCompoundStep = {
  action: GiftCardPaymentsAction;
  params: Record<string, unknown>;
  segment: string;
};

export function isGiftCardPaymentsAction(
  action: string,
): action is GiftCardPaymentsAction {
  return (GIFT_CARD_PAYMENTS_ACTIONS as readonly string[]).includes(action);
}

export function isPhysicalGiftCardHandoffCompoundPrompt(
  prompt?: string,
): boolean {
  const text = prompt ?? '';
  return (
    (isBuyGiftCardPhysicalPrompt(text) ||
      (/\b(buy|purchase|order)\b/i.test(text) &&
        /\b(physical|mail|ship|deliver)\b/i.test(text) &&
        /\bgift\s*card\b/i.test(text))) &&
    isTrackPhysicalGiftCardPrompt(text)
  );
}

export function isGiftCardCheckoutCompoundPrompt(prompt?: string): boolean {
  const text = prompt ?? '';
  const hasBook = isBookNearestSlotPrompt(text) || /\bbook\b/i.test(text);
  const hasGift =
    isApplyGiftCardCodePrompt(text) ||
    (/\b(apply|use|redeem)\b/i.test(text) && /\bgift\s*card\b/i.test(text));
  const hasPay =
    isChoosePaymentMethodPrompt(text) ||
    isPayOnlinePrompt(text) ||
    isPayCashAtVisitPrompt(text);
  return hasBook && (hasGift || hasPay);
}

export function isCheckoutPaymentFollowUpPrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  return (
    isChoosePaymentMethodPrompt(prompt ?? '') ||
    isPayOnlinePrompt(prompt ?? '') ||
    isPayCashAtVisitPrompt(prompt ?? '') ||
    (/\b(apply|use|redeem)\b/.test(lower) && /\bgift\s*card\b/.test(lower)) ||
    (/\bchoose\b/.test(lower) && /\bpayment\b/.test(lower))
  );
}

export function disambiguateGiftCardPaymentsAction(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (
    action === 'create_booking' &&
    isCashBookingPrompt(prompt) &&
    !isBookNearestSlotPrompt(prompt)
  ) {
    return null;
  }
  if (action === 'create_booking' && isGiftCardCheckoutCompoundPrompt(prompt)) {
    return {
      action: 'book_nearest_slot',
      rescueReason: 'create_booking_to_nearest_slot',
    };
  }

  if (action === 'buy_gift_card' && isBuyGiftCardPhysicalPrompt(prompt)) {
    return {
      action: 'buy_gift_card_physical',
      rescueReason: 'digital_to_physical_gift_card',
    };
  }

  if (
    (action === 'buy_gift_card' || action === 'buy_gift_card_physical') &&
    isTrackPhysicalGiftCardPrompt(prompt) &&
    !isBuyGiftCardPhysicalPrompt(prompt) &&
    !/\b(buy|purchase)\b/i.test(prompt)
  ) {
    return {
      action: 'track_physical_gift_card_order',
      rescueReason: 'purchase_to_track_physical_order',
    };
  }

  if (isGiftCardPaymentsAction(action)) return null;

  if (isApplyGiftCardCodePrompt(prompt) && action !== 'apply_gift_card_code') {
    return {
      action: 'apply_gift_card_code',
      rescueReason: 'apply_gift_card_checkout',
    };
  }

  if (
    isChoosePaymentMethodPrompt(prompt) &&
    action !== 'choose_payment_method'
  ) {
    return {
      action: 'choose_payment_method',
      rescueReason: 'choose_payment_checkout',
    };
  }

  return null;
}

export function inheritGiftCardPaymentsFollowUpContext(
  params: Record<string, any>,
  session?: Record<string, any>,
  action?: string,
  prompt = '',
): void {
  if (!session) return;

  const checkoutFollowUp =
    isCheckoutPaymentFollowUpPrompt(prompt) ||
    (action != null && CHECKOUT_FOLLOW_UP_SOURCES.has(session.lastAction));

  for (const key of GIFT_CARD_PAYMENTS_SESSION_KEYS) {
    if (key === 'lastAction') continue;
    const value = params[key];
    if (
      (value == null ||
        value === '' ||
        (Array.isArray(value) && !value.length)) &&
      session[key] != null &&
      session[key] !== ''
    ) {
      params[key] = session[key];
    }
  }

  if (checkoutFollowUp && !params.giftCardCode && session.giftCardCode) {
    params.giftCardCode = session.giftCardCode;
  }
}

export function pickGiftCardPaymentsSessionSlice(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const slice: Record<string, unknown> = {};
  for (const key of GIFT_CARD_PAYMENTS_SESSION_KEYS) {
    const value = params[key];
    if (
      value != null &&
      value !== '' &&
      !(Array.isArray(value) && !value.length)
    ) {
      slice[key] = value;
    }
  }
  return slice;
}

export function mergeGiftCardPaymentsHintsIntoSessionContext(
  sessionContext: Record<string, any>,
  params: Record<string, unknown>,
  action: string,
): Record<string, any> {
  if (!isGiftCardPaymentsAction(action)) return sessionContext;
  return {
    ...sessionContext,
    ...pickGiftCardPaymentsSessionSlice(params),
    lastAction: action,
  };
}

function enrichGiftCardPaymentsBaseParams(
  params: Record<string, any>,
  prompt: string,
): void {
  const giftCardCode = extractGiftCardCodeFromPrompt(prompt);
  if (giftCardCode && !params.giftCardCode) {
    params.giftCardCode = giftCardCode;
  }
  const amount = extractAmountFromPrompt(prompt);
  if (amount != null && params.amount == null) {
    params.amount = amount;
  }
  const paymentMethod = extractPaymentMethodFromPrompt(prompt);
  if (paymentMethod && !params.paymentMethod) {
    params.paymentMethod = paymentMethod;
  }
}

export function applyGiftCardPaymentsPromptHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
  context?: { session?: Record<string, any> },
): void {
  if (!isGiftCardPaymentsAction(action)) return;

  inheritGiftCardPaymentsFollowUpContext(
    params,
    context?.session,
    action,
    prompt,
  );
  enrichGiftCardPaymentsBaseParams(params, prompt);

  if (action === 'buy_gift_card_physical' && !params.deliveryMethod) {
    params.deliveryMethod = 'physical';
  }
  if (action === 'book_nearest_slot' && isBookNearestSlotPrompt(prompt)) {
    params.bookingFirstAvailable = true;
    delete params.timeSlot;
  }
}

export function enrichCompoundSubStepGiftCardPaymentsHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
): boolean {
  if (!isGiftCardPaymentsAction(action)) return false;
  applyGiftCardPaymentsPromptHints(action, params, prompt);
  return true;
}

export function classifyGiftCardPaymentsSegment(
  segment: string,
  sharedContext: Record<string, unknown> = {},
): GiftCardPaymentsCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base = mergeSharedBookingContext(
    sharedContext,
    buildSharedBookingContextFromPrompt(text),
  );
  enrichGiftCardPaymentsBaseParams(base, text);
  const fromShared = enrichParamsWithSharedEntities({}, text);
  const params = { ...base, ...fromShared };

  if (
    isTrackPhysicalGiftCardPrompt(text) &&
    !isTrackGiftCardShipmentPrompt(text) &&
    !/\b(buy|purchase)\b/i.test(text) &&
    !isBuyGiftCardPhysicalPrompt(text)
  ) {
    return {
      action: 'track_physical_gift_card_order',
      params,
      segment: text,
    };
  }

  if (isBuyGiftCardPhysicalPrompt(text)) {
    return {
      action: 'buy_gift_card_physical',
      params: { ...params, deliveryMethod: 'physical' },
      segment: text,
    };
  }

  const hasCheckoutGiftContext =
    /\bgift\s*card\b/i.test(text) ||
    isBookNearestSlotPrompt(text) ||
    isCheckProvidersForServicePrompt(text) ||
    isApplyGiftCardCodePrompt(text) ||
    isChoosePaymentMethodPrompt(text);

  const paymentsSteps = decomposePaymentsCompoundPrompt(text);
  if (paymentsSteps.length === 1 && hasCheckoutGiftContext) {
    const step = paymentsSteps[0];
    if (isGiftCardPaymentsAction(step.action)) {
      return step as GiftCardPaymentsCompoundStep;
    }
  }

  return null;
}

export function tryDecomposePhysicalGiftCardHandoff(
  prompt: string,
): GiftCardPaymentsCompoundStep[] | null {
  if (!isPhysicalGiftCardHandoffCompoundPrompt(prompt)) return null;

  const segments = prompt
    .split(HANDOFF_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
  const shared: Record<string, unknown> = {};
  const steps: GiftCardPaymentsCompoundStep[] = [];

  for (const segment of segments) {
    const step = classifyGiftCardPaymentsSegment(segment, shared);
    if (!step) continue;
    steps.push(step);
    for (const [key, value] of Object.entries(step.params)) {
      if (value != null && value !== '') shared[key] = value;
    }
  }

  if (steps.length < 2) return null;
  return propagateCompoundStepParamsAcrossSteps(steps);
}

/** Gift-card checkout compounds + physical order handoff (ai-cmd-h3.4). */
export function decomposeGiftCardPaymentsCompoundPrompt(
  prompt: string,
): GiftCardPaymentsCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const physical = tryDecomposePhysicalGiftCardHandoff(trimmed);
  if (physical) return physical;

  const payments = decomposePaymentsCompoundPrompt(trimmed);
  if (payments.length >= 2) {
    const filtered: GiftCardPaymentsCompoundStep[] = payments
      .filter((step) => isGiftCardPaymentsAction(step.action))
      .map((step) => ({
        action: step.action as GiftCardPaymentsAction,
        params: step.params,
        segment: step.segment,
      }));
    return propagateCompoundStepParamsAcrossSteps(filtered);
  }

  const single = classifyGiftCardPaymentsSegment(trimmed);
  return single ? [single] : [];
}

export function isGiftCardPaymentsCompoundPrompt(prompt: string): boolean {
  return decomposeGiftCardPaymentsCompoundPrompt(prompt).length >= 2;
}
