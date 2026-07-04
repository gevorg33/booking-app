import { isTrackPhysicalGiftCardPrompt } from './ai-customer-crm.util.js';
import {
  hasGiftCardForSomeoneCue,
  isBuyGiftCardForSomeonePrompt,
  rescueBuyGiftCardForSomeoneIntent,
} from './ai-buy-gift-card-for-someone.util.js';
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
  isConfigureCheckoutDefaultsPrompt,
  rescueConfigureCheckoutDefaultsIntent,
} from './ai-checkout-defaults.util.js';
import {
  isConfigureServiceDepositPolicyPrompt,
  enrichServiceDepositPolicyParamsFromPrompt,
  rescueConfigureServiceDepositPolicyIntent,
} from './ai-service-deposit-policy.util.js';
import {
  isConfigureServiceOnlinePaymentPrompt,
  enrichServiceOnlinePaymentParamsFromPrompt,
} from './ai-service-online-payment.util.js';
import { rescueListServicesPaymentFilterIntent } from './ai-list-services-payment-filters.util.js';
import { rescueFilterServicesNoPrepaymentIntent } from './ai-filter-services-no-prepayment.util.js';
import { rescueExplainAmountDueNowIntent } from './ai-explain-amount-due-now.util.js';
import {
  rescueCreateServicePrepaymentIntent,
  enrichCreateServicePrepaymentParamsFromPrompt,
} from './ai-create-service-prepayment.util.js';
import {
  isAuditServicesMissingOnlinePaymentPrompt,
  parseAuditServicesMissingOnlinePaymentFromPrompt,
  rescueAuditServicesMissingOnlinePaymentIntent,
} from './ai-audit-services-missing-online-payment.util.js';
import {
  isExplainPublicBookingCheckoutPrompt,
  rescueExplainPublicBookingCheckoutIntent,
} from './ai-explain-public-booking-checkout.util.js';
import {
  isExplainAmountDueNowPrompt,
  isExplainWhyPrepaymentPrompt,
  rescueExplainPrepaymentIntent,
} from './ai-explain-prepayment.util.js';
import { isExplainServicePricePrompt } from './ai-explain-service-price.util.js';
import { isExplainPaymentOptionsForServicePrompt } from './ai-explain-payment-options-for-service.util.js';
import { isFindSoonestAppointmentPrompt } from './ai-find-soonest-appointment.util.js';
import { isCompareServicesPrompt } from './ai-compare-services.util.js';
import {
  isAskPaymentOptionsPrompt,
  isExplicitPayCashAtVisitPrompt,
  rescueCashPaymentCheckoutIntent,
} from './ai-cash-payment-checkout.util.js';
import {
  isExplicitPayOnlinePrompt,
  rescuePayOnlineCheckoutIntent,
} from './ai-pay-online-checkout.util.js';
import { rescueResumePendingPaymentIntent } from './ai-resume-pending-payment.util.js';
import { rescueConsumerDiagnoseStripeCheckoutFailureIntent } from './ai-diagnose-stripe-checkout-failure.util.js';
import { rescuePayAtVenueFallbackIntent } from './ai-pay-at-venue-fallback.util.js';
import {
  isExplainServiceOnlinePaymentSetupPrompt,
  parseExplainServiceOnlinePaymentSetupFromPrompt,
  rescueExplainServiceOnlinePaymentSetupIntent,
} from './ai-service-online-payment-setup.util.js';
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
  'configure_checkout_defaults',
  'configure_service_deposit_policy',
  'configure_service_online_payment',
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
  'explain_service_online_payment_setup',
  'explain_public_booking_checkout',
  'audit_services_missing_online_payment',
  'list_subscription_revenue',
] as const;

export const PROVIDER_PAYMENTS_INTENTS = [
  'explain_payment_status',
  'collect_cash_confirm',
] as const;

/** Customer intents handled by AiPaymentsService (currency explainers use AiBusinessCurrencyService). */
export const CUSTOMER_PAYMENTS_INTENTS = [
  'check_providers_for_service',
  'book_nearest_slot',
  'apply_gift_card_code',
  'check_gift_card_balance',
  'buy_gift_card',
  'buy_gift_card_physical',
  'buy_gift_card_for_someone',
  'get_gift_card_quote',
  'choose_payment_method',
  'pay_online',
  'pay_cash_at_visit',
  'purchase_subscription_checkout',
  'explain_why_stripe_required',
  'receipt_status',
  'get_booking_quote',
  'get_package_quote',
  'get_multi_service_quote',
  'confirm_stripe_payment',
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
  if (isExplainAmountDueNowPrompt(prompt)) return false;
  if (
    /\b(?:listed\s+)?price\s+(?:of|for)\b/i.test(prompt) &&
    !/\b(checkout|total|amount\s+due|due\s+now|due\s+today)\b/i.test(prompt)
  ) {
    return false;
  }
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
  if (isConfigureCheckoutDefaultsPrompt(prompt)) return false;
  if (isConfigureServiceOnlinePaymentPrompt(prompt)) return false;
  if (
    /\b(?:online\s+payment|online\s+prepayment|prepayment)\b/i.test(prompt) &&
    /\b(?:decline|disable|turn\s+off|accept|require|enable)\b/i.test(prompt)
  ) {
    return false;
  }
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
  if (isFindSoonestAppointmentPrompt(prompt)) return false;
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
  if (isFindSoonestAppointmentPrompt(prompt)) return false;
  if (isMultilingualBookNearestPrompt(prompt)) return true;

  const hasBookVerb = /\b(book|find|get|reserve|schedule|grab)\b/i.test(prompt);
  if (!hasBookVerb) return false;

  // Dashboard create_booking — "book first available lashes", not nearest-slot checkout.
  if (/\bfirst\s+available\b/i.test(prompt)) {
    return /\bfirst\s+available\s+(?:slot|appointment|opening|time)\b/i.test(
      prompt,
    );
  }

  const wantsFlexibleSlot =
    /\b(nearest|soonest|next|earliest)\b/i.test(prompt) ||
    /\basap\b/i.test(prompt) ||
    /\bas soon as possible\b/i.test(prompt);
  return (
    wantsFlexibleSlot &&
    (/\b(slot|appointment|opening|time)\b/i.test(prompt) ||
      !!extractServiceNameFromPrompt(prompt) ||
      /\b(haircut|massage|facial|cut|color|service)\b/i.test(prompt) ||
      /\basap\b/i.test(prompt))
  );
}

export function isApplyGiftCardCodePrompt(prompt: string): boolean {
  if (/\bcurrency\s+code\b/i.test(prompt)) return false;
  if (
    /\b(redeem|claim|add|link|register|attach|activate)\b/i.test(prompt) &&
    /\b(gift\s*card|code)\b/i.test(prompt) &&
    (/\b(account|my account|to my account|on my account)\b/i.test(prompt) ||
      (/\b(GCM-|GCB-|GCS-)\b/i.test(prompt) &&
        !/\b(checkout|booking|visit|appointment|book|reserve|schedule|balance)\b/i.test(
          prompt,
        )))
  ) {
    return false;
  }
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
  if (hasGiftCardForSomeoneCue(prompt)) return false;
  return (
    /\b(buy|purchase|order)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    !/\b(cancel|modify|track|request|refund)\b/i.test(prompt) &&
    !/\b(physical|shipped|mail)\b/i.test(prompt)
  );
}

export function isBuyGiftCardPhysicalPrompt(prompt: string): boolean {
  if (hasGiftCardForSomeoneCue(prompt)) return false;
  return (
    /\b(buy|purchase|order)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    /\b(physical|shipped|mail|deliver)\b/i.test(prompt)
  );
}

export function isChoosePaymentMethodPrompt(prompt: string): boolean {
  if (
    isExplainAmountDueNowPrompt(prompt) ||
    isExplainCheckoutTotalPrompt(prompt)
  ) {
    return false;
  }
  if (
    /\b(explain|describe|show|summarize|how)\b/i.test(prompt) &&
    /\b(?:public\s+booking|booking\s+page)\b/i.test(prompt)
  ) {
    return false;
  }
  if (isAskPaymentOptionsPrompt(prompt)) return true;
  return (
    /\b(choose|select|what|which|payment\s+options?)\b/i.test(prompt) &&
    /\b(payment\s+method|pay\s+with|checkout)\b/i.test(prompt)
  );
}

export function isPayOnlinePrompt(prompt: string): boolean {
  return isExplicitPayOnlinePrompt(prompt);
}

export function isPayCashAtVisitPrompt(prompt: string): boolean {
  if (isConfigureCheckoutDefaultsPrompt(prompt)) return false;
  return isExplicitPayCashAtVisitPrompt(prompt);
}

export function isPurchaseSubscriptionCheckoutPrompt(prompt: string): boolean {
  return (
    /\b(purchase|buy|subscribe|checkout)\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt)
  );
}

export function isExplainWhyStripeRequiredPrompt(prompt: string): boolean {
  if (isExplainServiceOnlinePaymentSetupPrompt(prompt)) return false;
  if (isExplainAmountDueNowPrompt(prompt)) return false;
  if (isExplainWhyPrepaymentPrompt(prompt)) return true;
  return (
    /\b(why|explain)\b/i.test(prompt) &&
    /\b(stripe|online\s+payment|card\s+required|card\s+payment|pay\s+by\s+card)\b/i.test(
      prompt,
    )
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
  const doesRequire = prompt.match(
    /\bdoes\s+([a-z][\w\s'-]{2,40}?)\s+require\b/i,
  );
  if (doesRequire) {
    const name = doesRequire[1].trim().replace(/[,.]$/, '');
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
  const bookNamedServiceNearest = prompt.match(
    /\bbook\s+(?:a\s+|an\s+|the\s+)?([a-z][\w\s'-]{2,40}?)\s+(?:nearest|soonest|first)\s+(?:available\s+)?(?:slot|appointment|opening|time)\b/i,
  );
  if (bookNamedServiceNearest) {
    const name = bookNamedServiceNearest[1].trim().replace(/[,.]$/, '');
    // Guard against the capture spanning a date/availability clause such as
    // "book hairstyle tomorrow who is free at nearest time" — the real service
    // is the head token; defer to the boundary-aware matcher below.
    const spansClause =
      /\b(tomorrow|tonight|today|who|whom|which|when|where|free|available|open|this|next)\b/i.test(
        name,
      );
    if (
      name &&
      !spansClause &&
      !/^(the|a|an|slot|time|appointment|opening|available|free|open)$/i.test(
        name,
      )
    ) {
      return name;
    }
  }
  const isFlexibleSlotOnlyBookPhrase =
    /\bbook\s+(?:a\s+|an\s+|the\s+)?(?:(?:first|nearest|soonest)\s+(?:available\s+)?(?:slot|appointment|opening|time)|(?:slot|appointment|opening|time))\b/i.test(
      prompt,
    );
  if (!isFlexibleSlotOnlyBookPhrase) {
    const bookService = prompt.match(
      /\bbook\s+(?:a\s+|an\s+|the\s+)?(?:nearest\s+|soonest\s+|first\s+)?([a-z][\w\s'-]{2,40}?)(?=\s*(?:,|;|\?|\band\b|\bwho\b|\bwhich\b|\btomorrow\b|\btonight\b|\bevening\b|\bmorning\b|\bafternoon\b|\bat\b|\bfor\b|\bon\b|\bwith\b|\btoday\b|\bthis\b|\b(?:slot|appointment|opening|time)\b|$))/i,
    );
    if (bookService) {
      const name = bookService[1].trim().replace(/[,.]$/, '');
      if (
        name &&
        !/^(the|a|an|slot|time|appointment|opening|available|free|open)$/i.test(
          name,
        )
      ) {
        return name;
      }
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
  const cashEnable =
    /\b(?:enable|turn\s+on|accept|allow)\b.{0,48}\b(?:cash|pay\s+at\s+(?:the\s+)?venue)\b/i.test(
      prompt,
    ) ||
    /\b(?:cash|pay\s+at\s+(?:the\s+)?venue)\b.{0,48}\b(?:enable|turn\s+on|accept|allow)\b/i.test(
      prompt,
    );
  const cashDisable =
    /\b(?:disable|turn\s+off|reject|stop)\b.{0,48}\b(?:cash|pay\s+at\s+(?:the\s+)?venue)\b/i.test(
      prompt,
    ) ||
    /\b(?:cash|pay\s+at\s+(?:the\s+)?venue)\b.{0,48}\b(?:disable|turn\s+off|reject|stop)\b/i.test(
      prompt,
    );
  if (cashEnable) return true;
  if (cashDisable) return false;
  if (/\b(disable|turn\s+off|reject|stop)\b/i.test(prompt)) return false;
  if (/\b(enable|turn\s+on|accept|allow)\b/i.test(prompt)) return true;
  return null;
}

export function hasCashMutateCue(prompt: string): boolean {
  return (
    /\b(?:cash|pay\s+at\s+(?:the\s+)?venue)\b/i.test(prompt) &&
    /\b(?:enable|turn\s+on|accept|allow|disable|turn\s+off|reject|stop)\b/i.test(
      prompt,
    )
  );
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescuePaymentsIntent(
  prompt: string,
  action: string,
): {
  action:
    | PaymentsIntent
    | 'list_services'
    | 'create_service'
    | 'create_services'
    | 'filter_services_no_prepayment'
    | 'compare_services'
    | 'find_soonest_appointment'
    | 'explain_payment_options_for_service'
    | 'explain_service_price'
    | 'explain_amount_due_now'
    | 'explain_checkout_total'
    | 'resume_pending_payment'
    | 'diagnose_stripe_checkout_failure'
    | 'pay_at_venue_fallback';
  rescueReason: string;
} | null {
  const filterNoPrepayment = rescueFilterServicesNoPrepaymentIntent(
    prompt,
    action,
  );
  if (filterNoPrepayment) return filterNoPrepayment;

  const listServicesPaymentFilter = rescueListServicesPaymentFilterIntent(
    prompt,
    action,
  );
  if (listServicesPaymentFilter) return listServicesPaymentFilter;

  const createServicePrepayment = rescueCreateServicePrepaymentIntent(
    prompt,
    action,
  );
  if (createServicePrepayment) return createServicePrepayment;

  const buyGiftCardForSomeone = rescueBuyGiftCardForSomeoneIntent(
    prompt,
    action,
  );
  if (buyGiftCardForSomeone) return buyGiftCardForSomeone;

  if (isPaymentsIntent(action)) return null;

  if (isExplainPaymentOptionsForServicePrompt(prompt)) {
    return {
      action: 'explain_payment_options_for_service',
      rescueReason: 'service_payment_options',
    };
  }

  if (isFindSoonestAppointmentPrompt(prompt)) {
    return {
      action: 'find_soonest_appointment',
      rescueReason: 'soonest_appointment',
    };
  }

  if (isCompareServicesPrompt(prompt)) {
    return {
      action: 'compare_services',
      rescueReason: 'service_compare',
    };
  }

  const cashCheckout = rescueCashPaymentCheckoutIntent(prompt, action);
  if (cashCheckout) return cashCheckout;

  const explainPublicBookingCheckout = rescueExplainPublicBookingCheckoutIntent(
    prompt,
    action,
  );
  if (explainPublicBookingCheckout) return explainPublicBookingCheckout;

  const auditMissingOnlinePayment =
    rescueAuditServicesMissingOnlinePaymentIntent(prompt, action);
  if (auditMissingOnlinePayment) return auditMissingOnlinePayment;

  if (isPaymentsCompoundPrompt(prompt) && action !== 'compound_intent')
    return null;
  if (action === 'gift_card_balance' && isCheckGiftCardBalancePrompt(prompt)) {
    return { action: 'check_gift_card_balance', rescueReason: 'code_balance' };
  }

  if (isReceiptStatusPrompt(prompt))
    return { action: 'receipt_status', rescueReason: 'receipt' };
  const explainOnlinePaymentSetup =
    rescueExplainServiceOnlinePaymentSetupIntent(prompt, action);
  if (explainOnlinePaymentSetup) return explainOnlinePaymentSetup;
  const amountDueNow = rescueExplainAmountDueNowIntent(prompt, action);
  if (amountDueNow) return amountDueNow;
  if (isExplainServicePricePrompt(prompt)) {
    return { action: 'explain_service_price', rescueReason: 'service_price' };
  }
  const prepaymentExplain = rescueExplainPrepaymentIntent(prompt, action);
  if (prepaymentExplain) return prepaymentExplain;
  const checkoutDefaults = rescueConfigureCheckoutDefaultsIntent(
    prompt,
    action,
  );
  if (checkoutDefaults) return checkoutDefaults;
  const depositPolicy = rescueConfigureServiceDepositPolicyIntent(
    prompt,
    action,
  );
  if (depositPolicy) return depositPolicy;
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
  const payAtVenueFallbackRescue = rescuePayAtVenueFallbackIntent(
    prompt,
    action,
  );
  if (payAtVenueFallbackRescue) return payAtVenueFallbackRescue;
  const diagnoseCheckoutFailureRescue =
    rescueConsumerDiagnoseStripeCheckoutFailureIntent(prompt, action);
  if (diagnoseCheckoutFailureRescue) return diagnoseCheckoutFailureRescue;
  const resumePendingPaymentRescue = rescueResumePendingPaymentIntent(
    prompt,
    action,
  );
  if (resumePendingPaymentRescue) return resumePendingPaymentRescue;
  const payOnlineRescue = rescuePayOnlineCheckoutIntent(prompt, action);
  if (payOnlineRescue) return payOnlineRescue;
  if (isChoosePaymentMethodPrompt(prompt)) {
    return { action: 'choose_payment_method', rescueReason: 'payment_method' };
  }
  if (isTrackPhysicalGiftCardPrompt(prompt)) return null;
  if (isBuyGiftCardForSomeonePrompt(prompt)) {
    return {
      action: 'buy_gift_card_for_someone',
      rescueReason: 'gift_card_for_someone',
    };
  }
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
  if (isConfigureServiceOnlinePaymentPrompt(prompt)) {
    return {
      action: 'configure_service_online_payment',
      rescueReason: 'service_online_payment',
    };
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
  if (isExplainPublicBookingCheckoutPrompt(text)) {
    return {
      action: 'explain_public_booking_checkout',
      params: base,
      segment: text,
    };
  }
  if (isAuditServicesMissingOnlinePaymentPrompt(text)) {
    const parsed = parseAuditServicesMissingOnlinePaymentFromPrompt(text, base);
    return {
      action: 'audit_services_missing_online_payment',
      params: parsed ? { ...base, ...parsed } : base,
      segment: text,
    };
  }
  if (isExplainServiceOnlinePaymentSetupPrompt(text)) {
    const parsed = parseExplainServiceOnlinePaymentSetupFromPrompt(text, base);
    return {
      action: 'explain_service_online_payment_setup',
      params: parsed ? { ...base, ...parsed } : base,
      segment: text,
    };
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
  if (isConfigureCheckoutDefaultsPrompt(text)) {
    return {
      action: 'configure_checkout_defaults',
      params: base,
      segment: text,
    };
  }
  if (isConfigureServiceDepositPolicyPrompt(text)) {
    return {
      action: 'configure_service_deposit_policy',
      params: enrichServiceDepositPolicyParamsFromPrompt(base, text),
      segment: text,
    };
  }
  if (isConfigureCashPaymentsPrompt(text)) {
    return { action: 'configure_cash_payments', params: base, segment: text };
  }
  if (isConfigureServiceOnlinePaymentPrompt(text)) {
    return {
      action: 'configure_service_online_payment',
      params: enrichServiceOnlinePaymentParamsFromPrompt(base, text),
      segment: text,
    };
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
