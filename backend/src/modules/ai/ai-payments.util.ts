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
import { isExplainIntegrationHealthPrompt } from './ai-explain-integration-health.util.js';
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
import { isPlainServiceCatalogListPrompt } from './ai-list-services-catalog-cue.util.js';

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
  // e2e-bug.287 — team-wide "who is free / is anybody open" must be
  // registry-allowed on dashboard or acceptRescueForSurface drops the remap
  // from check_availability → check_providers_for_service.
  'check_providers_for_service',
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
  if (isExplainIntegrationHealthPrompt(prompt)) return false;
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
  if (
    /\b(explain|what(?:'s| is)|status)\b/i.test(prompt) &&
    /\b(payment)\b/i.test(prompt) &&
    !/\b(stripe|checkout\s+total|subscription\s+revenue)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bwhy\b/i.test(prompt) &&
    /\b(still\s+pending|cash\s+due)\b/i.test(prompt) &&
    !/\b(checkout\s+total|subscription\s+revenue)\b/i.test(prompt)
  ) {
    return true;
  }
  if (/\bprepaid\b/i.test(prompt) && /\bcharge\s+again\b/i.test(prompt)) {
    return true;
  }
  return false;
}

export function isCollectCashConfirmPrompt(prompt: string): boolean {
  return (
    /\b(collect(?:ed)?|confirm(?:ed)?|received|took|record(?:ed)?)\b/i.test(
      prompt,
    ) && /\b(cash)\b/i.test(prompt)
  );
}

export function isCheckProvidersForServicePrompt(prompt: string): boolean {
  if (isFindSoonestAppointmentPrompt(prompt)) return false;
  // e2e-bug.193 — catalog list "what services are available?" is list_services.
  if (isPlainServiceCatalogListPrompt(prompt)) return false;
  if (
    isCheckMultiServiceBlockAvailabilityPrompt(prompt) ||
    isCheckPackageLineAvailabilityPrompt(prompt) ||
    isEarliestSlotAllServicesPrompt(prompt) ||
    isProvidersAvailableLaterDaysPrompt(prompt)
  ) {
    return false;
  }
  // e2e-bug.189 — roster-only "who are your providers/specialists" is list_providers.
  // Inline (avoid circular import with ai-list-providers.util).
  if (
    /\bwho\s+are\s+(?:your|our|the)\s+(?:providers?|specialists?|stylists?|therapists?|staff|team|employees?)(?:\s*\/\s*(?:providers?|specialists?|stylists?|staff|team))?\b/i.test(
      prompt,
    ) &&
    !/\b(?:available|availability|free|open|for)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    (/\b(?:list|show|see)\s+(?:(?:me|us)\s+)?(?:(?:all|your|our|the)\s+)?(?:providers?|specialists?|stylists?|therapists?|staff|team|employees?)\b/i.test(
      prompt,
    ) ||
      /\bwho\s+works\s+here\b/i.test(prompt) ||
      /\bshow\s+me\s+your\s+team\b/i.test(prompt) ||
      /\bwhat\s+(?:providers?|specialists?|stylists?|therapists?)\s+do\s+you\s+have\b/i.test(
        prompt,
      )) &&
    !/\b(?:available|availability|free|open|for|rated|recommend|reviews?)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  // e2e-bug.92 — do not collapse reviews / rank / indifference / timed book / named schedule.
  if (/\breviews?\b/i.test(prompt)) return false;
  if (
    /\b(?:don't\s+care\s+who|any\s+provider\s+works|whoever|any\s+(?:provider|stylist|specialist)\s+(?:is\s+)?fine)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\b(?:best|top|highest)\s+rated\b/i.test(prompt) ||
    /\brecommend(?:\s+me)?\s+(?:a\s+)?(?:specialist|stylist|provider|therapist)/i.test(
      prompt,
    )
  ) {
    return false;
  }
  // Timed book alone (not check-who / check-providers + book compounds).
  if (
    /\b(?:book|schedule|reserve)\b/i.test(prompt) &&
    /\b(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s*(?::\d{2})?\s*(?:am|pm))\b/i.test(
      prompt,
    ) &&
    !/\b(?:who|which|anyone|anybody|check\s+(?:who|providers?|availability)|providers?\s+(?:for|available|free))\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\bwhen\s+(?:is|are)\s+[A-Za-z]/i.test(prompt) &&
    /\bavailable\b/i.test(prompt)
  ) {
    return false;
  }
  // e2e-bug.92 / e2e-bug.269 — named "is Gevorg available …" is availability,
  // not providers-for-service. Exclude indefinites so
  // "is anybody open … and schedule the next available appointment" still
  // matches check_providers (+ book_nearest) compounds.
  if (
    /\b(?:is|are)\s+(?!anybody\b|anyone\b|someone\b|everybody\b|everyone\b)[A-Za-z][\w\s.'-]{1,40}\s+(?:available|free|open)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  // e2e-bug.93 — "What's Karo Mazmanyan's availability this week?" must not
  // match the bare "what" + availability gravity well below.
  if (
    /\b[A-Za-z][\w.'-]{1,40}(?:\s+[A-Za-z][\w.'-]{1,40})?(?:'s|’s)\s+availability\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  // e2e-bug.287 / e2e-bug.190 — open-times browse stays check_availability.
  // Without this, "what times are available…" matches the what+available well
  // and (once dashboard registry allows check_providers) remaps away from
  // named/open-slot browse.
  if (
    /\bwhat\s+times?\b/i.test(prompt) ||
    /\bopen\s+slots?\b/i.test(prompt) ||
    /\bcheck\s+availability\b/i.test(prompt)
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
      // e2e-bug.200 — "book the soonest" / "book nearest" is itself the flexible cue
      // (do not require haircut/massage token — hairstyle / multi-word services).
      /\bbook\s+(?:the\s+)?(?:soonest|nearest)\b/i.test(prompt) ||
      !!extractServiceNameFromPrompt(prompt) ||
      /\b(haircut|hairstyle|hairstyles|massage|facial|cut|color|service)\b/i.test(
        prompt,
      ) ||
      /\basap\b/i.test(prompt))
  );
}

export function isApplyGiftCardCodePrompt(prompt: string): boolean {
  if (/\bcurrency\s+code\b/i.test(prompt)) return false;
  // e2e-bug.231 — balance/left/value by code is check_gift_card_balance, not apply.
  if (isCheckGiftCardBalancePrompt(prompt)) return false;
  // e2e-bug.83 — "redeem referral code X" must not become apply_gift_card_code.
  if (/\breferral\b/i.test(prompt)) return false;
  if (
    /\binvite\s+code\b/i.test(prompt) &&
    !/\bgift\s*card\b/i.test(prompt)
  ) {
    return false;
  }
  // e2e-bug.232 — bare "apply/redeem code X at checkout" is apply_promo_code_checkout.
  // Gift apply requires an explicit gift-card cue or GCM-/GCB-/GCS- token.
  if (
    !/\bgift\s*card\b/i.test(prompt) &&
    !/\bGCM-|\bGCB-|\bGCS-/i.test(prompt)
  ) {
    return false;
  }
  // e2e-bug.80 — purchase / price-quote prompts are not checkout redeem.
  if (isGetGiftCardQuotePrompt(prompt)) return false;
  if (
    /\b(buy|purchase|order)\b/i.test(prompt) &&
    /\bgift\s*card\b/i.test(prompt) &&
    !/\b(GCM-|GCB-|GCS-)\b/i.test(prompt) &&
    !/\b(apply|use|redeem)\b.+\b(code|checkout)\b/i.test(prompt)
  ) {
    return false;
  }
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
    (/\b(code|checkout)\b/i.test(prompt) ||
      /\bmy\s+gift\s+card\b/i.test(prompt) ||
      /\bGCM-|\bGCB-|\bGCS-/i.test(prompt))
  );
}

export function isCheckGiftCardBalancePrompt(prompt: string): boolean {
  if (!/\b(gift\s*card)\b/i.test(prompt)) return false;
  if (/\bmy\s+account\b/i.test(prompt)) return false;
  // Account-wallet asks without a concrete code stay on gift_card_balance.
  const hasCodeCue =
    /\b(GCM-|GCB-|GCS-)\b/i.test(prompt) ||
    /\bby\s+code\b/i.test(prompt) ||
    /\bgift\s*card\s+code\b/i.test(prompt) ||
    /\bcode\s+(?:GCM-|GCB-|GCS-|[A-Z0-9-]{4,})\b/i.test(prompt);
  if (!hasCodeCue) return false;
  // e2e-bug.231 — balance / left / value / remaining by code (not apply/redeem).
  if (
    /\b(apply|use|redeem|preview)\b/i.test(prompt) &&
    /\b(checkout|booking|visit|appointment)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(check|what(?:'s| is)|balance|remaining|left|value|how\s+much)\b/i.test(
      prompt,
    ) || /\bhow\s+much\s+is\s+left\b/i.test(prompt)
  );
}

/** e2e-bug.80 — price-only gift-card asks must not become apply/buy. */
export function isGetGiftCardQuotePrompt(prompt: string): boolean {
  if (!/\bgift\s*card\b/i.test(prompt)) return false;
  if (/\b(GCM-|GCB-|GCS-)\b/i.test(prompt)) return false;
  if (/\b(apply|redeem|use)\b.+\b(code|checkout)\b/i.test(prompt)) return false;
  if (hasGiftCardForSomeoneCue(prompt)) return false;
  const quoteCue =
    /\b(how much|quote|cost|priced?|fees?|total\s+price|including any fees)\b/i.test(
      prompt,
    ) ||
    /\bwhat would .{0,80}\b(cost|total|price|be)\b/i.test(prompt) ||
    /\bwhat(?:'s| is)\s+the\s+total\b/i.test(prompt);
  if (!quoteCue) return false;
  // Hypothetical "if I buy … how much" is still a quote, not a purchase mutate.
  return true;
}

export function isBuyGiftCardPrompt(prompt: string): boolean {
  if (hasGiftCardForSomeoneCue(prompt)) return false;
  if (isGetGiftCardQuotePrompt(prompt)) return false;
  return (
    /\b(buy|purchase|order)\b/i.test(prompt) &&
    /\b(gift\s*card)\b/i.test(prompt) &&
    !/\b(cancel|modify|track|request|refund)\b/i.test(prompt) &&
    !/\b(physical|shipped|mail)\b/i.test(prompt)
  );
}

export function isBuyGiftCardPhysicalPrompt(prompt: string): boolean {
  if (hasGiftCardForSomeoneCue(prompt)) return false;
  if (isGetGiftCardQuotePrompt(prompt)) return false;
  if (/\b(track|cancel|modify|request|refund)\b/i.test(prompt)) return false;
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
  if (isExplainPublicBookingCheckoutPrompt(prompt)) return false;
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
  if (/\b(still\s+)?pending\b/i.test(prompt) && !/\brequired\b/i.test(prompt)) {
    return false;
  }
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
  return decomposePaymentsCompoundPrompt(trimmed).length > 1;
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

/** Free-text reason for a gift card order refund (e.g. "refund GIFT1234 because the item arrived damaged"). */
export function extractRefundReasonFromPrompt(prompt: string): string | null {
  const because = prompt.match(
    /\b(?:because|due\s+to|reason(?:\s+is)?:?)\s+(.+?)(?:\s+and|\s*$)/i,
  );
  return because?.[1]?.trim() || null;
}

/**
 * e2e-bug.89 — "book the next available slot" must not yield serviceName
 * "next available" (or similar availability filler) for cancel/book compounds.
 */
export function isAvailabilityFillerServiceName(
  value: unknown,
): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return true;
  // e2e-bug.89 — nearest/soonest fillers; e2e-bug.237 — date phrases stolen as serviceName.
  return /^(?:the|a|an|slot|time|appointment|appointments|opening|openings|available|free|open|next|first|soonest|nearest|upcoming|earliest|next\s+available|first\s+available|soonest\s+available|nearest\s+available|earliest\s+available|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+instead)?|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+instead)?|tomorrow(?:\s+instead)?|today(?:\s+instead)?)$/i.test(
    trimmed,
  );
}

/**
 * e2e-bug.260 — strip trailing relative/absolute date windows glued onto a
 * service name ("massage this week" → "massage"). Shared by extract + param scrub.
 */
const TRAILING_SERVICE_TIME_WINDOW =
  /\s+(?:this\s+(?:week|weekend|month|morning|afternoon|evening)|next\s+(?:week|weekend|month|morning|afternoon|evening)|(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|today|tomorrow|tonight|(?:early\s+|late\s+)?(?:morning|afternoon|evening)|asap|soon)$/i;

/** Stop capture before date/time windows (align with waitlist / find_soonest). */
const SERVICE_NAME_DATE_BOUNDARY =
  String.raw`(?=\s*(?:,|;|\?|\band\b|\bbook\b|\bwith\b|\bat\b|\bon\b|\btomorrow\b|\btoday\b|\btonight\b|\bnext\b|\bthis\b|\bweek\b|\bevening\b|\bmorning\b|\bafternoon\b|\bmonday\b|\btuesday\b|\bwednesday\b|\bthursday\b|\bfriday\b|\bsaturday\b|\bsunday\b|$))`;

const BARE_SERVICE_TIME_WINDOW =
  /^(?:this\s+(?:week|weekend|month)|next\s+(?:week|weekend|month)|(?:this|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|today|tomorrow|tonight|(?:early\s+|late\s+)?(?:morning|afternoon|evening)|asap|soon)$/i;

export function stripTrailingTimeWindowFromServiceName(
  name: string | null | undefined,
): string | null {
  if (typeof name !== 'string') return null;
  let cleaned = name.trim().replace(/[,.'"“”]+$/g, '').trim();
  if (!cleaned) return null;
  for (let i = 0; i < 3; i++) {
    const next = cleaned.replace(TRAILING_SERVICE_TIME_WINDOW, '').trim();
    if (next === cleaned) break;
    cleaned = next;
  }
  if (!cleaned || BARE_SERVICE_TIME_WINDOW.test(cleaned)) return null;
  return cleaned;
}

function acceptExtractedServiceName(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = stripTrailingTimeWindowFromServiceName(name);
  if (!trimmed || isAvailabilityFillerServiceName(trimmed)) return null;
  return trimmed;
}

export function extractServiceNameFromPrompt(prompt: string): string | null {
  const quoted = prompt.match(/"([^"]{1,60})"/);
  if (quoted) return acceptExtractedServiceName(quoted[1]);
  const forNamedBooking = prompt.match(
    /\bfor\s+(?:(?:a|an|my|the|this|upcoming)\s+)?([a-z][\w'-]{2,40})\s+(?:booking|appointment|visit|reservation)\b/i,
  );
  if (forNamedBooking) {
    const name = acceptExtractedServiceName(forNamedBooking[1]);
    if (name) return name;
  }
  const forService = prompt.match(
    new RegExp(
      String.raw`\bfor\s+(?:(?:a|an|my|the|this)\s+)?([a-z][\w\s'-]{2,40}?)` +
        SERVICE_NAME_DATE_BOUNDARY,
      'i',
    ),
  );
  if (forService) {
    const name = acceptExtractedServiceName(forService[1]);
    if (name) return name;
  }
  const doesRequire = prompt.match(
    /\bdoes\s+([a-z][\w\s'-]{2,40}?)\s+require\b/i,
  );
  if (doesRequire) {
    const name = acceptExtractedServiceName(doesRequire[1]);
    if (name) return name;
  }
  const takeService = prompt.match(
    new RegExp(
      String.raw`\b(?:take|do)\s+(?:a\s+)?([a-z][\w\s'-]{2,40}?)` +
        SERVICE_NAME_DATE_BOUNDARY,
      'i',
    ),
  );
  if (takeService) {
    const name = acceptExtractedServiceName(takeService[1]);
    if (name) return name;
  }
  const bookNamedServiceNearest = prompt.match(
    /\bbook\s+(?:a\s+|an\s+|the\s+)?([a-z][\w\s'-]{2,40}?)\s+(?:nearest|soonest|first|next)\s+(?:available\s+)?(?:slot|appointment|opening|time)\b/i,
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
    const accepted = acceptExtractedServiceName(name);
    if (accepted && !spansClause) return accepted;
  }
  // Include "next available" — otherwise bookService captures "next available"
  // as a fake serviceName (e2e-bug.89).
  const isFlexibleSlotOnlyBookPhrase =
    /\bbook\s+(?:a\s+|an\s+|the\s+)?(?:(?:first|nearest|soonest|next|earliest)\s+(?:available\s+)?(?:slot|appointment|opening|time)|(?:slot|appointment|opening|time))\b/i.test(
      prompt,
    );
  if (!isFlexibleSlotOnlyBookPhrase) {
    // e2e-bug.205 — stop before a capacity-gate/earliest-date tail clause
    // ("book if enough seats", "book the wine tour earliest date for 2
    // people") so those cue words never get glued into the service name.
    const bookService = prompt.match(
      /\bbook\s+(?:a\s+|an\s+|the\s+)?(?:nearest\s+|soonest\s+|first\s+|next\s+)?(?!if\b|when\b|unless\b|only\b)([a-z][\w\s'-]{2,40}?)(?=\s*(?:,|;|\?|\band\b|\bwho\b|\bwhich\b|\btomorrow\b|\btonight\b|\bevening\b|\bmorning\b|\bafternoon\b|\bat\b|\bfor\b|\bon\b|\bwith\b|\btoday\b|\bthis\b|\bif\b|\bwhen\b|\bunless\b|\bonly\b|\bearliest\b|\bnearest\b|\bsoonest\b|\basap\b|\b(?:slot|appointment|opening|time)\b|$))/i,
    );
    if (bookService) {
      const name = acceptExtractedServiceName(bookService[1]);
      if (name) return name;
    }
  }
  const nearest = prompt.match(
    /\bnearest\s+(?:available\s+)?([\w\s'-]{2,40}?)(?:\s+(?:slot|appointment|opening|time)\b|\s+and\b|$)/i,
  );
  if (nearest) {
    const name = acceptExtractedServiceName(nearest[1]);
    if (name) return name;
  }
  return null;
}

export function extractAmountFromPrompt(prompt: string): number | null {
  const dollar = prompt.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (dollar) return Number.parseFloat(dollar[1]);
  const amountWord = prompt.match(/\bamount\s+(\d+(?:\.\d{1,2})?)\b/i);
  if (amountWord) return Number.parseFloat(amountWord[1]);
  // e2e-bug.80 — "50 dollar gift card" / "for 75 dollars"
  const dollarsWord = prompt.match(
    /\b(\d+(?:\.\d{1,2})?)\s*dollars?\b/i,
  );
  if (dollarsWord) return Number.parseFloat(dollarsWord[1]);
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

  // e2e-bug.80 — remap apply_gift_card_code (a payments intent) to purchase/quote
  // before the payments early-return below.
  if (isGetGiftCardQuotePrompt(prompt) && action !== 'get_gift_card_quote') {
    return { action: 'get_gift_card_quote', rescueReason: 'gift_card_quote' };
  }
  if (
    isBuyGiftCardPhysicalPrompt(prompt) &&
    action !== 'buy_gift_card_physical'
  ) {
    return {
      action: 'buy_gift_card_physical',
      rescueReason: 'physical_gift_card',
    };
  }
  if (isBuyGiftCardPrompt(prompt) && action !== 'buy_gift_card') {
    return { action: 'buy_gift_card', rescueReason: 'buy_gift_card' };
  }

  // e2e-bug.231 — remap apply_gift_card_code / nearby payments intents to
  // code-balance lookup before the payments early-return below.
  if (
    isCheckGiftCardBalancePrompt(prompt) &&
    action !== 'check_gift_card_balance'
  ) {
    return { action: 'check_gift_card_balance', rescueReason: 'code_balance' };
  }

  // e2e-bug.231 — gift-card checkout how-it-works before currency/payments stick.
  const explainPublicBookingCheckoutEarly =
    rescueExplainPublicBookingCheckoutIntent(prompt, action);
  if (explainPublicBookingCheckoutEarly) {
    return explainPublicBookingCheckoutEarly;
  }

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
  // e2e-bug.80 — quote before buy/apply so "how much would a $100 gift card cost?"
  // never lands on apply_gift_card_code.
  if (isGetGiftCardQuotePrompt(prompt)) {
    return { action: 'get_gift_card_quote', rescueReason: 'gift_card_quote' };
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
