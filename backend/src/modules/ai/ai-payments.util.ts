import { isTrackPhysicalGiftCardPrompt } from './ai-customer-crm.util.js';
import {
  isMultilingualBookNearestPrompt,
  isMultilingualCheckProvidersPrompt,
} from './ai-check-and-book-multilingual.util.js';
import {
  buildSharedBookingContextFromPrompt,
  mergeSharedBookingContext,
  propagateSharedBookingContextAcrossSteps,
} from './ai-compound-booking-context.util.js';

export { buildSharedBookingContextFromPrompt } from './ai-compound-booking-context.util.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import {
  applyRelativeDateFromPrompt,
  getTodayDateKey,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import { resolveTimezone } from '../../common/utils/timezone.util.js';
import {
  isCheckMultiServiceBlockAvailabilityPrompt,
  isCheckPackageLineAvailabilityPrompt,
  isEarliestSlotAllServicesPrompt,
  isProvidersAvailableLaterDaysPrompt,
} from './ai-schedule-resources.util.js';

export const DASHBOARD_PAYMENTS_MUTATE_INTENTS = [
  'configure_cash_payments',
  'adjust_gift_card_balance',
  'extend_gift_card_expiry',
  'refund_gift_card_order',
] as const;

export const DASHBOARD_PAYMENTS_READ_INTENTS = [
  'summarize_unpaid',
  'validate_gift_card',
  'export_accounting',
  'export_commissions',
  'explain_checkout_total',
  'list_subscription_revenue',
] as const;

export const PROVIDER_PAYMENTS_INTENTS = [
  'explain_payment_status',
  'collect_cash_confirm',
] as const;

export const CUSTOMER_PAYMENTS_INTENTS = [
  'check_providers_for_service',
  'book_nearest_slot',
  'apply_gift_card_code',
  'check_gift_card_balance',
  'buy_gift_card',
  'buy_gift_card_physical',
  'choose_payment_method',
  'pay_online',
  'pay_cash_at_visit',
  'purchase_subscription_checkout',
  'explain_checkout_currency',
  'explain_stripe_checkout_currency',
  'explain_tenant_currency',
  'explain_notification_currency',
  'explain_why_stripe_required',
  'receipt_status',
] as const;

export const PAYMENTS_INTENTS = [
  ...DASHBOARD_PAYMENTS_MUTATE_INTENTS,
  ...DASHBOARD_PAYMENTS_READ_INTENTS,
  ...PROVIDER_PAYMENTS_INTENTS,
  ...CUSTOMER_PAYMENTS_INTENTS,
] as const;

export type PaymentsIntent = (typeof PAYMENTS_INTENTS)[number];

export interface PaymentsCompoundStep {
  action: PaymentsIntent;
  params: Record<string, unknown>;
  segment: string;
}

const PAYMENTS_COMPOUND_BOUNDARY =
  'summarize|validate|export|explain|list|configure|adjust|extend|refund|check|book|apply|buy|choose|pay|purchase|collect|who|which|available|nearest|soonest|earliest|find|get|reserve|schedule|free|open|gift|card|cash|stripe|receipt|subscription|accounting|commission|unpaid|balance|checkout|providers?';

const PAYMENTS_VERB = new RegExp(`\\b(${PAYMENTS_COMPOUND_BOUNDARY})\\b`, 'i');

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\?\\s*(?=(?:book|find|get|reserve|schedule)\\b)|\\s*,\\s*(?=(?:${PAYMENTS_COMPOUND_BOUNDARY})\\b)|\\s+and\\s+(?=(?:${PAYMENTS_COMPOUND_BOUNDARY})\\b)|\\s+then\\s+(?=(?:${PAYMENTS_COMPOUND_BOUNDARY})\\b)`,
  'i',
);

const PROVIDER_AVAILABILITY_WORDS =
  /\b(available|availability|avail|free|open|providers?|specialists?|stylists?|stylist|therapists?|cosmetologists?)\b/i;

export function isPaymentsIntent(action: string): action is PaymentsIntent {
  return (PAYMENTS_INTENTS as readonly string[]).includes(action);
}

export function isSummarizeUnpaidPrompt(prompt: string): boolean {
  return (
    /\b(summarize|show|list)\b/i.test(prompt) &&
    /\b(unpaid|outstanding|pending\s+payment|payment\s+pending)\b/i.test(prompt)
  );
}

export function isValidateGiftCardPrompt(prompt: string): boolean {
  return (
    /\b(validate|verify|check)\b/i.test(prompt) &&
    /\bgift\s*card\b/i.test(prompt) &&
    !/\b(balance|buy|purchase|physical)\b/i.test(prompt)
  );
}

export function isExportAccountingPrompt(prompt: string): boolean {
  return (
    /\b(export|generate|run|download)\b/i.test(prompt) &&
    /\b(accounting|books|ledger)\b/i.test(prompt)
  );
}

export function isExportCommissionsPrompt(prompt: string): boolean {
  return (
    /\b(export|generate|run|download)\b/i.test(prompt) &&
    /\b(commissions?|payouts?)\b/i.test(prompt)
  );
}

export function isExplainCheckoutTotalPrompt(prompt: string): boolean {
  return (
    /\b(explain|break\s*down|what(?:'s| is))\b/i.test(prompt) &&
    /\b(checkout|total|price|amount\s+due)\b/i.test(prompt)
  );
}

export function isListSubscriptionRevenuePrompt(prompt: string): boolean {
  return (
    /\b(list|show|summarize)\b/i.test(prompt) &&
    /\b(subscription)\b/i.test(prompt) &&
    /\b(revenue|income|sales)\b/i.test(prompt)
  );
}

export function isConfigureCashPaymentsPrompt(prompt: string): boolean {
  return (
    /\b(configure|enable|disable|turn\s+on|turn\s+off|accept)\b/i.test(
      prompt,
    ) &&
    /\b(cash)\b/i.test(prompt) &&
    /\b(payments?|pay|booking|checkout)\b/i.test(prompt)
  );
}

export function isAdjustGiftCardBalancePrompt(prompt: string): boolean {
  return (
    /\b(adjust|change|update|set|add|deduct)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(balance|amount|\$)\b/i.test(prompt)
  );
}

export function isExtendGiftCardExpiryPrompt(prompt: string): boolean {
  return (
    /\b(extend|prolong|push)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(expir|expiry|expiration)\b/i.test(prompt)
  );
}

export function isRefundGiftCardOrderPrompt(prompt: string): boolean {
  return (
    /\b(refund)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(order|purchase)\b/i.test(prompt)
  );
}

export function isExplainPaymentStatusPrompt(prompt: string): boolean {
  return (
    /\b(explain|what(?:'s| is)|status)\b/i.test(prompt) &&
    /\b(payment)\b/i.test(prompt) &&
    !/\b(stripe|checkout\s+total|subscription\s+revenue)\b/i.test(prompt)
  );
}

export function isCollectCashConfirmPrompt(prompt: string): boolean {
  return (
    /\b(collect|confirm|received|took)\b/i.test(prompt) &&
    /\b(cash)\b/i.test(prompt)
  );
}

export function isCheckProvidersForServicePrompt(prompt: string): boolean {
  if (
    isCheckMultiServiceBlockAvailabilityPrompt(prompt) ||
    isCheckPackageLineAvailabilityPrompt(prompt) ||
    isEarliestSlotAllServicesPrompt(prompt) ||
    isProvidersAvailableLaterDaysPrompt(prompt)
  ) {
    return false;
  }
  return (
    (!/\bpackages?\b/i.test(prompt) &&
      !/\b(membership|subscription)\s+plans?\b/i.test(prompt) &&
      /\b(who|which|what|anyone|anybody)\b/i.test(prompt) &&
      PROVIDER_AVAILABILITY_WORDS.test(prompt)) ||
    (/\b(?:see|look\s+up|find\s+out)\b/i.test(prompt) &&
      /\bwho\b/i.test(prompt) &&
      PROVIDER_AVAILABILITY_WORDS.test(prompt)) ||
    (/\bwho\s+(?:can|has)\s+(?:take|fit|do|availability)\b/i.test(prompt) &&
      !/\bpackages?\b/i.test(prompt)) ||
    (/\b(?:anyone|anybody)\b[\s\S]{0,40}\b(?:free|available|open)\b/i.test(
      prompt,
    ) &&
      !/\bpackages?\b/i.test(prompt)) ||
    (/\bcheck\b/i.test(prompt) &&
      /\b(who|which|providers?)\b/i.test(prompt) &&
      /\b(available|free|open|for)\b/i.test(prompt)) ||
    (/\bcheck\b/i.test(prompt) &&
      /\bproviders?\b/i.test(prompt) &&
      (/\b(available|free|open)\b/i.test(prompt) || /\bfor\b/i.test(prompt))) ||
    isMultilingualCheckProvidersPrompt(prompt)
  );
}

export function isBookNearestSlotPrompt(prompt: string): boolean {
  if (isMultilingualBookNearestPrompt(prompt)) return true;

  const wantsFlexibleSlot =
    /\b(first\s+available|nearest|soonest|next|earliest)\b/i.test(prompt) ||
    /\basap\b/i.test(prompt) ||
    /\bas soon as possible\b/i.test(prompt);
  return (
    /\b(book|find|get|reserve|schedule|grab)\b/i.test(prompt) &&
    wantsFlexibleSlot &&
    (/\b(slot|appointment|opening|time)\b/i.test(prompt) ||
      !!extractServiceNameFromPrompt(prompt) ||
      /\b(haircut|massage|facial|cut|color|service)\b/i.test(prompt) ||
      /\basap\b/i.test(prompt))
  );
}

export function isApplyGiftCardCodePrompt(prompt: string): boolean {
  if (/\bcurrency\s+code\b/i.test(prompt)) return false;
  return (
    /\b(apply|use|redeem|preview)\b/i.test(prompt) &&
    (/\b(gift\s*card)\b/i.test(prompt) || /\bcode\b/i.test(prompt)) &&
    (/\b(code|checkout)\b/i.test(prompt) ||
      /\bmy\s+gift\s+card\b/i.test(prompt) ||
      /\bGCM-|\bGCB-|\bGCS-/i.test(prompt))
  );
}

export function isCheckGiftCardBalancePrompt(prompt: string): boolean {
  return (
    /\b(check|what(?:'s| is)|balance)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    (/\b(code|GCM-|GCB-|GCS-)\b/i.test(prompt) ||
      /\bby\s+code\b/i.test(prompt)) &&
    !/\bmy\s+account\b/i.test(prompt)
  );
}

export function isBuyGiftCardPrompt(prompt: string): boolean {
  return (
    /\b(buy|purchase|order)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    !/\b(cancel|modify|track|request|refund)\b/i.test(prompt) &&
    !/\b(physical|shipped|mail)\b/i.test(prompt)
  );
}

export function isBuyGiftCardPhysicalPrompt(prompt: string): boolean {
  return (
    /\b(buy|purchase|order)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(physical|shipped|mail|deliver)\b/i.test(prompt)
  );
}

export function isChoosePaymentMethodPrompt(prompt: string): boolean {
  return (
    /\b(choose|select|what|which|payment\s+options?)\b/i.test(prompt) &&
    /\b(payment\s+method|pay\s+with|checkout)\b/i.test(prompt)
  );
}

export function isPayOnlinePrompt(prompt: string): boolean {
  if (/\b(why|explain)\b/i.test(prompt) && /\bstripe\b/i.test(prompt))
    return false;
  return /\b(pay\s+online|card\s+payment|checkout\s+online)\b/i.test(prompt);
}

export function isPayCashAtVisitPrompt(prompt: string): boolean {
  return (
    /\b(pay\s+in\s+cash|cash\s+at\s+(?:the\s+)?visit|pay\s+at\s+venue|pay\s+cash)\b/i.test(
      prompt,
    ) && !/\b(show|list|display|appointments?|bookings?)\b/i.test(prompt)
  );
}

export function isPurchaseSubscriptionCheckoutPrompt(prompt: string): boolean {
  return (
    /\b(purchase|buy|subscribe|checkout)\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt)
  );
}

export function isExplainWhyStripeRequiredPrompt(prompt: string): boolean {
  return (
    /\b(why|explain)\b/i.test(prompt) &&
    /\b(stripe|online\s+payment|card\s+required)\b/i.test(prompt)
  );
}

export function isReceiptStatusPrompt(prompt: string): boolean {
  return (
    /\b(receipt|invoice)\b/i.test(prompt) &&
    /\b(status|sent|email|available)\b/i.test(prompt)
  );
}

export function isPaymentsCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !PAYMENTS_VERB.test(trimmed)) return false;
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposePaymentsCompoundPrompt(trimmed).length > 1
  );
}

export function extractGiftCardCodeFromPrompt(prompt: string): string | null {
  const explicit = prompt.match(
    /\b(GCM-[A-Z0-9]{4,}|GCB-[A-Z0-9]{4,}|GCS-[A-Z0-9]{4,})\b/i,
  );
  if (explicit) return explicit[1].toUpperCase();
  const quoted = prompt.match(/"([^"]{4,20})"/);
  if (quoted && /\b(gift|card|code)\b/i.test(prompt))
    return quoted[1].trim().toUpperCase();
  const codeWord = prompt.match(
    /\bcode\s+(GCM-[A-Z0-9-]+|GCB-[A-Z0-9-]+|GCS-[A-Z0-9-]+)\b/i,
  );
  return codeWord?.[1]?.trim().toUpperCase() ?? null;
}

export function extractServiceNameFromPrompt(prompt: string): string | null {
  const quoted = prompt.match(/"([^"]{1,60})"/);
  if (quoted) return quoted[1].trim();
  const forService = prompt.match(
    /\bfor\s+(?:a\s+)?([a-z][\w\s'-]{2,40}?)(?=\s*(?:,|;|\?|\band\b|\bbook\b|\btomorrow\b|\btonight\b|\bevening\b|\bmorning\b|\bafternoon\b|$))/i,
  );
  if (forService) {
    const name = forService[1].trim().replace(/[,.]$/, '');
    if (name && !/^(the|a|an|slot|time|appointment|opening)$/i.test(name)) {
      return name;
    }
  }
  const takeService = prompt.match(
    /\b(?:take|do)\s+(?:a\s+)?([a-z][\w\s'-]{2,40}?)(?=\s*(?:,|;|\?|\band\b|\bbook\b|\btomorrow\b|\btonight\b|\bevening\b|\bmorning\b|\bafternoon\b|$))/i,
  );
  if (takeService) {
    const name = takeService[1].trim().replace(/[,.]$/, '');
    if (name && !/^(the|a|an|slot|time|appointment|opening)$/i.test(name)) {
      return name;
    }
  }
  const nearest = prompt.match(
    /\bnearest\s+(?:available\s+)?([\w\s'-]{2,40}?)(?:\s+(?:slot|appointment|opening|time)\b|\s+and\b|$)/i,
  );
  if (nearest) {
    const name = nearest[1].trim();
    if (name && !/^(the|a|an|slot|time|appointment|opening)$/i.test(name)) {
      return name;
    }
  }
  return null;
}

export function extractAmountFromPrompt(prompt: string): number | null {
  const dollar = prompt.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (dollar) return Number.parseFloat(dollar[1]);
  const amountWord = prompt.match(/\bamount\s+(\d+(?:\.\d{1,2})?)\b/i);
  if (amountWord) return Number.parseFloat(amountWord[1]);
  return null;
}

export function resolveTomorrowDateKey(now: Date = new Date()): string {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return tomorrow.toISOString().slice(0, 10);
}

/** Normalize classifier/prompt dates to YYYY-MM-DD for public slot queries. */
function hasExplicitAvailabilityDate(params: Record<string, unknown>): boolean {
  const raw = params.date;
  return typeof raw === 'string' && raw.trim().length > 0;
}

export function resolveAvailabilityDateKey(
  params: Record<string, unknown>,
  prompt: string | undefined,
  timeZone = 'UTC',
): string {
  const tz = resolveTimezone(timeZone);
  const merged: Record<string, unknown> = { ...params };
  if (!hasExplicitAvailabilityDate(params)) {
    applyRelativeDateFromPrompt(merged, prompt, tz);
  }

  const rawDate = merged.date;
  if (typeof rawDate === 'string' && rawDate.trim()) {
    return toIsoDay(rawDate.trim(), tz);
  }

  return getTodayDateKey(tz);
}

export function notBeforeTimeFromWindow(
  prompt: string,
  params: Record<string, unknown>,
): string | null {
  const window = parseTimeOfDayWindow(prompt, params);
  if (window === 'evening') return '17:00';
  if (window === 'afternoon') return '12:00';
  if (window === 'morning') return '00:00';
  return (params.notBeforeTime as string | undefined) ?? null;
}

export function parseCashPaymentsToggle(prompt: string): boolean | null {
  if (/\b(disable|turn\s+off|reject|stop)\b/i.test(prompt)) return false;
  if (/\b(enable|turn\s+on|accept|allow)\b/i.test(prompt)) return true;
  return null;
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescuePaymentsIntent(
  prompt: string,
  action: string,
): { action: PaymentsIntent; rescueReason: string } | null {
  if (isPaymentsIntent(action)) return null;
  if (isPaymentsCompoundPrompt(prompt) && action !== 'compound_intent')
    return null;
  if (action === 'gift_card_balance' && isCheckGiftCardBalancePrompt(prompt)) {
    return { action: 'check_gift_card_balance', rescueReason: 'code_balance' };
  }

  if (isReceiptStatusPrompt(prompt))
    return { action: 'receipt_status', rescueReason: 'receipt' };
  if (isExplainWhyStripeRequiredPrompt(prompt)) {
    return {
      action: 'explain_why_stripe_required',
      rescueReason: 'stripe_required',
    };
  }
  if (isPurchaseSubscriptionCheckoutPrompt(prompt)) {
    return {
      action: 'purchase_subscription_checkout',
      rescueReason: 'subscription_checkout',
    };
  }
  if (isPayCashAtVisitPrompt(prompt))
    return { action: 'pay_cash_at_visit', rescueReason: 'pay_cash' };
  if (isPayOnlinePrompt(prompt))
    return { action: 'pay_online', rescueReason: 'pay_online' };
  if (isChoosePaymentMethodPrompt(prompt)) {
    return { action: 'choose_payment_method', rescueReason: 'payment_method' };
  }
  if (isTrackPhysicalGiftCardPrompt(prompt)) return null;
  if (isBuyGiftCardPhysicalPrompt(prompt)) {
    return {
      action: 'buy_gift_card_physical',
      rescueReason: 'physical_gift_card',
    };
  }
  if (isBuyGiftCardPrompt(prompt))
    return { action: 'buy_gift_card', rescueReason: 'buy_gift_card' };
  if (isCheckGiftCardBalancePrompt(prompt)) {
    return { action: 'check_gift_card_balance', rescueReason: 'code_balance' };
  }
  if (isApplyGiftCardCodePrompt(prompt)) {
    return { action: 'apply_gift_card_code', rescueReason: 'apply_gift_card' };
  }
  if (isCheckProvidersForServicePrompt(prompt)) {
    return {
      action: 'check_providers_for_service',
      rescueReason: 'providers_for_service',
    };
  }
  if (isBookNearestSlotPrompt(prompt))
    return { action: 'book_nearest_slot', rescueReason: 'nearest_slot' };

  if (isRefundGiftCardOrderPrompt(prompt)) {
    return { action: 'refund_gift_card_order', rescueReason: 'refund_order' };
  }
  if (isCollectCashConfirmPrompt(prompt)) {
    return { action: 'collect_cash_confirm', rescueReason: 'collect_cash' };
  }
  if (isExplainPaymentStatusPrompt(prompt)) {
    return { action: 'explain_payment_status', rescueReason: 'payment_status' };
  }
  if (isExtendGiftCardExpiryPrompt(prompt)) {
    return { action: 'extend_gift_card_expiry', rescueReason: 'extend_expiry' };
  }
  if (isAdjustGiftCardBalancePrompt(prompt)) {
    return {
      action: 'adjust_gift_card_balance',
      rescueReason: 'adjust_balance',
    };
  }
  if (isConfigureCashPaymentsPrompt(prompt)) {
    return { action: 'configure_cash_payments', rescueReason: 'cash_settings' };
  }
  if (isListSubscriptionRevenuePrompt(prompt)) {
    return {
      action: 'list_subscription_revenue',
      rescueReason: 'subscription_revenue',
    };
  }
  if (isExplainCheckoutTotalPrompt(prompt)) {
    return { action: 'explain_checkout_total', rescueReason: 'checkout_total' };
  }
  if (isExportCommissionsPrompt(prompt)) {
    return { action: 'export_commissions', rescueReason: 'export_commissions' };
  }
  if (isExportAccountingPrompt(prompt)) {
    return { action: 'export_accounting', rescueReason: 'export_accounting' };
  }
  if (isValidateGiftCardPrompt(prompt))
    return { action: 'validate_gift_card', rescueReason: 'validate_gift_card' };
  if (isSummarizeUnpaidPrompt(prompt))
    return { action: 'summarize_unpaid', rescueReason: 'summarize_unpaid' };

  return null;
}

function tryDecomposeCheckAndBookPrompt(
  prompt: string,
): PaymentsCompoundStep[] | null {
  if (
    !isCheckProvidersForServicePrompt(prompt) ||
    !isBookNearestSlotPrompt(prompt)
  ) {
    return null;
  }

  const shared = buildSharedBookingContextFromPrompt(prompt);
  const checkStep: PaymentsCompoundStep = {
    action: 'check_providers_for_service',
    params: shared,
    segment: prompt,
  };
  const bookStep: PaymentsCompoundStep = {
    action: 'book_nearest_slot',
    params: { ...shared, bookingFirstAvailable: true },
    segment: prompt,
  };

  return [checkStep, bookStep];
}

function classifyPaymentsSegment(
  segment: string,
  sharedContext?: Record<string, unknown>,
): PaymentsCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base = mergeSharedBookingContext(
    sharedContext ?? {},
    buildSharedBookingContextFromPrompt(text),
  );
  const giftCardCode = extractGiftCardCodeFromPrompt(text);
  if (giftCardCode) base.giftCardCode = giftCardCode;
  const amount = extractAmountFromPrompt(text);
  if (amount != null) base.amount = amount;

  if (isCheckProvidersForServicePrompt(text)) {
    return {
      action: 'check_providers_for_service',
      params: base,
      segment: text,
    };
  }
  if (isBookNearestSlotPrompt(text)) {
    return {
      action: 'book_nearest_slot',
      params: { ...base, bookingFirstAvailable: true },
      segment: text,
    };
  }
  if (
    isApplyGiftCardCodePrompt(text) ||
    (/\bapply\b/i.test(text) && /\bgift\s*card\b/i.test(text))
  ) {
    return { action: 'apply_gift_card_code', params: base, segment: text };
  }
  if (isCheckGiftCardBalancePrompt(text)) {
    return { action: 'check_gift_card_balance', params: base, segment: text };
  }
  if (isBuyGiftCardPhysicalPrompt(text)) {
    return {
      action: 'buy_gift_card_physical',
      params: { ...base, deliveryMethod: 'physical' },
      segment: text,
    };
  }
  if (isBuyGiftCardPrompt(text)) {
    return {
      action: 'buy_gift_card',
      params: { ...base, deliveryMethod: 'digital' },
      segment: text,
    };
  }
  if (isChoosePaymentMethodPrompt(text)) {
    return { action: 'choose_payment_method', params: base, segment: text };
  }
  if (isExplainWhyStripeRequiredPrompt(text)) {
    return {
      action: 'explain_why_stripe_required',
      params: base,
      segment: text,
    };
  }
  if (isPayOnlinePrompt(text))
    return { action: 'pay_online', params: base, segment: text };
  if (isPayCashAtVisitPrompt(text))
    return { action: 'pay_cash_at_visit', params: base, segment: text };
  if (isPurchaseSubscriptionCheckoutPrompt(text)) {
    return {
      action: 'purchase_subscription_checkout',
      params: base,
      segment: text,
    };
  }
  if (isReceiptStatusPrompt(text))
    return { action: 'receipt_status', params: base, segment: text };
  if (isSummarizeUnpaidPrompt(text))
    return { action: 'summarize_unpaid', params: base, segment: text };
  if (isValidateGiftCardPrompt(text))
    return { action: 'validate_gift_card', params: base, segment: text };
  if (isExportAccountingPrompt(text))
    return { action: 'export_accounting', params: base, segment: text };
  if (isExportCommissionsPrompt(text))
    return { action: 'export_commissions', params: base, segment: text };
  if (isExplainCheckoutTotalPrompt(text)) {
    return { action: 'explain_checkout_total', params: base, segment: text };
  }
  if (isListSubscriptionRevenuePrompt(text)) {
    return { action: 'list_subscription_revenue', params: base, segment: text };
  }
  if (isConfigureCashPaymentsPrompt(text)) {
    return { action: 'configure_cash_payments', params: base, segment: text };
  }
  if (isAdjustGiftCardBalancePrompt(text)) {
    return { action: 'adjust_gift_card_balance', params: base, segment: text };
  }
  if (isExtendGiftCardExpiryPrompt(text)) {
    return { action: 'extend_gift_card_expiry', params: base, segment: text };
  }
  if (isRefundGiftCardOrderPrompt(text)) {
    return { action: 'refund_gift_card_order', params: base, segment: text };
  }
  if (isExplainPaymentStatusPrompt(text)) {
    return { action: 'explain_payment_status', params: base, segment: text };
  }
  if (isCollectCashConfirmPrompt(text)) {
    return { action: 'collect_cash_confirm', params: base, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for payments / checkout operations. */
export function decomposePaymentsCompoundPrompt(
  prompt: string,
): PaymentsCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length > 1) {
    const shared = buildSharedBookingContextFromPrompt(trimmed);
    const steps: PaymentsCompoundStep[] = [];
    for (const segment of nonEmpty) {
      const step = classifyPaymentsSegment(segment, shared);
      if (step) steps.push(step);
    }
    return propagateSharedBookingContextAcrossSteps(steps);
  }

  const checkAndBook = tryDecomposeCheckAndBookPrompt(trimmed);
  if (checkAndBook) {
    return propagateSharedBookingContextAcrossSteps(checkAndBook);
  }

  const single = classifyPaymentsSegment(trimmed);
  return single ? propagateSharedBookingContextAcrossSteps([single]) : [];
}
