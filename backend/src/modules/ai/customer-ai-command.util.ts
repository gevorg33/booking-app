import type { CommandResult } from './command-completion.types.js';
import { CHECK_AND_BOOK_CLASSIFIER_RULES } from './ai-check-and-book.fixtures.js';
import { pickSharedBookingContextSlice } from './ai-compound-booking-context.util.js';
import { mergeCheckProvidersHandoffIntoContext } from './ai-check-book-handoff.util.js';
import { CLASSIFIER_MULTILINGUAL_RULES } from './ai-prompt-i18n.js';
import { CHECKOUT_CURRENCY_CLASSIFIER_RULES } from './ai-checkout-currency.fixtures.js';
import { CHECKOUT_TAX_CLASSIFIER_RULES } from './ai-checkout-tax.fixtures.js';
import { NOTIFICATION_CURRENCY_CLASSIFIER_RULES } from './ai-notification-currency.fixtures.js';
import { STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES } from './ai-stripe-checkout-currency.fixtures.js';
import { TENANT_CURRENCY_CLASSIFIER_RULES } from './ai-tenant-currency.fixtures.js';
import { BOOKING_LANGUAGES_CLASSIFIER_RULES } from './ai-booking-languages.fixtures.js';
import { BOOKING_DATE_FORMAT_CLASSIFIER_RULES } from './ai-booking-date-format.fixtures.js';
import { TOUR_BOOKING_CLASSIFIER_RULES } from './ai-tour-booking.fixtures.js';
import { TOUR_CAPACITY_CLASSIFIER_RULES } from './ai-tour-capacity.fixtures.js';
import { CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES } from './ai-checkout-recommendations.fixtures.js';
import { CHECKOUT_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-checkout-recommendations-multilingual.fixtures.js';
import { CONSUMER_CHECKOUT_SUCCESS_CLASSIFIER_RULES } from './ai-consumer-checkout-success.fixtures.js';
import { CONSUMER_CHECKOUT_SUCCESS_EN_CLASSIFIER_RULES } from './ai-consumer-checkout-success-en.fixtures.js';
import { CONSUMER_CHECKOUT_TAX_CLASSIFIER_RULES } from './ai-consumer-checkout-tax.fixtures.js';
import { TAX_DISPLAY_EN_CLASSIFIER_RULES } from './ai-tax-display-en.fixtures.js';
import { DATA_RIGHTS_CLASSIFIER_RULES } from './ai-data-rights.fixtures.js';
import { CUSTOMER_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX } from './ai-clinic-v2-6.fixtures.js';
import { CUSTOMER_PACKAGE_BOOKING_CLASSIFIER_RULES } from './ai-consumer-package-booking.fixtures.js';
import { CONSUMER_ADOPTION_CLASSIFIER_RULES } from './ai-consumer-adoption.fixtures.js';
import { CUSTOMER_EXPLAIN_MY_NOTIFICATIONS_CLASSIFIER_RULES } from './ai-explain-my-notifications.util.js';
import { CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES } from './ai-how-to-download-app.util.js';
import { CUSTOMER_CANCEL_MY_BOOKING_CLASSIFIER_RULES } from './ai-cancel-my-booking.util.js';
import { CUSTOMER_RESCHEDULE_MY_BOOKING_CLASSIFIER_RULES } from './ai-reschedule-my-booking.util.js';
import { CUSTOMER_APP_GUIDE_CLASSIFIER_RULES } from './ai-customer-product-guide.util.js';
import { CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES } from './ai-product-guide-empty-state.fixtures.js';
import { CUSTOMER_PUBLIC_PREPAYMENT_EXPLAIN_CLASSIFIER_RULES } from './ai-explain-prepayment.util.js';
import { CUSTOMER_PUBLIC_CASH_PAYMENT_CLASSIFIER_RULES } from './ai-cash-payment-checkout.util.js';
import { CUSTOMER_PUBLIC_PAY_ONLINE_CLASSIFIER_RULES } from './ai-pay-online-checkout.util.js';
import { CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES } from './ai-multi-service-customer-public.util.js';
import { CUSTOMER_SUBSCRIPTION_MEMBERSHIP_CLASSIFIER_RULES } from './ai-subscription-membership-customer.util.js';
import { CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES } from './ai-promo-code-help-customer-public.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES } from './ai-explain-service-price.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES } from './ai-explain-payment-options-for-service.util.js';
import { CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES } from './ai-find-soonest-appointment.util.js';
import { CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES } from './ai-compare-services.util.js';
import { COMPARE_SERVICES_MULTILINGUAL_CLASSIFIER_RULES } from './ai-compare-services-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES } from './ai-filter-services-no-prepayment.util.js';
import { FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-filter-services-no-prepayment-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES } from './ai-explain-amount-due-now.util.js';
import { CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES } from './ai-explain-guest-checkout-fields.util.js';
import { CUSTOMER_RESUME_PENDING_PAYMENT_CLASSIFIER_RULES } from './ai-resume-pending-payment.util.js';
import { RESUME_PENDING_PAYMENT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-resume-pending-payment-multilingual.fixtures.js';
import { EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-amount-due-now-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES } from './ai-explain-business-hours-and-location.util.js';
import { EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-business-hours-and-location-multilingual.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES } from './ai-explain-provider-specialty.util.js';
import { EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-provider-specialty-multilingual.fixtures.js';
import { CUSTOMER_LOYALTY_POINTS_BALANCE_CLASSIFIER_RULES } from './ai-loyalty-points-balance-customer.util.js';
import {
  CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES,
  GROWTH_LOOPS_MULTILINGUAL_CLASSIFIER_RULES,
} from './ai-growth-loops-customer.util.js';
import { CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES } from './ai-privacy-gdpr-customer.util.js';
import { CUSTOMER_GIFT_CARD_CANCEL_CLASSIFIER_RULES } from './ai-gift-card-cancel-customer.util.js';
import { CUSTOMER_PACKAGE_VISIT_SELF_CLASSIFIER_RULES } from './ai-package-visit-self-customer.util.js';
import { CUSTOMER_LIST_MY_PACKAGE_VISITS_CLASSIFIER_RULES } from './ai-list-my-package-visits-customer.util.js';
import { CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES } from './ai-consumer-clinic-test-results.fixtures.js';
import { CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from './ai-clinic-lab-booking.fixtures.js';
import { CLINIC_BOOKING_CLASSIFIER_RULES } from './ai-clinic-booking.fixtures.js';
import { BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES } from './ai-budget-service-discovery.fixtures.js';
import { FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES } from './ai-flexible-availability.fixtures.js';
import { SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES } from './ai-service-rank-discovery.fixtures.js';
import { TOUR_DAY_SLOTS_CLASSIFIER_RULES } from './ai-tour-day-slots.fixtures.js';
import { CUSTOMER_AVAILABILITY_DISAMBIGUATION_RULES } from './ai-intent-disambiguation.fixtures.js';
import {
  CUSTOMER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import type { PublicAssistantResult } from '../public-booking/public-booking-assistant.service.js';

/** Anonymous public-booking assistant intents routed via PublicBookingAssistantService.
 *  Documented in `ai-capability.matrix.ts` as `CUSTOMER_PUBLIC_DELEGATED_INTENTS`. */
export const PUBLIC_ONLY_ASSISTANT_ACTIONS = [
  'list_providers',
  'list_services',
  'check_availability',
  'recommend_specialists',
  'business_info',
  'book_appointment',
  'booking_help',
] as const;

export type PublicOnlyAssistantAction =
  (typeof PUBLIC_ONLY_ASSISTANT_ACTIONS)[number];

export const CUSTOMER_SURFACE_INTENT_UNION = [
  ...new Set([...CUSTOMER_INTENTS, ...PUBLIC_INTENTS]),
] as const;

export function isPublicOnlyAssistantAction(
  action: string,
): action is PublicOnlyAssistantAction {
  return (PUBLIC_ONLY_ASSISTANT_ACTIONS as readonly string[]).includes(action);
}

export function isCustomerSurfaceIntent(action: string): boolean {
  if (
    action === 'unknown' ||
    action === 'error' ||
    action === 'security_blocked'
  )
    return true;
  return CUSTOMER_SURFACE_INTENT_UNION.includes(action);
}

export function publicAssistantResultToCommandResult(
  result: PublicAssistantResult,
): CommandResult {
  return {
    success: result.success,
    action: result.action,
    summary: result.summary,
    details: {
      sessionContext: result.sessionContext,
      navigate: result.navigate,
      bookingId: result.bookingId,
      ...(result.details ?? {}),
    },
  };
}

const PUBLIC_ASSISTANT_UI_DETAIL_KEYS = [
  'availability',
  'availableProviders',
  'providers',
  'serviceName',
  'serviceId',
  'date',
  'timeOfDay',
  'notBeforeTime',
  'checkProvidersHandoff',
  'slots',
  'serviceNames',
  'serviceIds',
] as const;

function serializePublicAssistantSessionContext(
  sessionContext: unknown,
): PublicAssistantResult['sessionContext'] {
  if (!sessionContext || typeof sessionContext !== 'object') return undefined;
  const out: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(sessionContext as Record<string, unknown>)) {
    if (value == null || value === '') {
      out[key] = null;
      continue;
    }
    if (key === 'completedSteps' && Array.isArray(value)) {
      out[key] = JSON.stringify(value);
      continue;
    }
    out[key] = typeof value === 'string' ? value : String(value);
  }
  return out;
}

export function commandResultToPublicAssistantResult(
  result: CommandResult,
): PublicAssistantResult {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const assistantDetails: Record<string, unknown> = {};
  for (const key of PUBLIC_ASSISTANT_UI_DETAIL_KEYS) {
    if (details[key] !== undefined) {
      assistantDetails[key] = details[key];
    }
  }
  return {
    success: result.success,
    action: result.action ?? 'unknown',
    summary: result.summary,
    sessionContext: serializePublicAssistantSessionContext(details.sessionContext),
    navigate: details.navigate as PublicAssistantResult['navigate'],
    bookingId: details.bookingId as string | undefined,
    guide: result.guide,
    details:
      Object.keys(assistantDetails).length > 0 ? assistantDetails : undefined,
  };
}

export function buildCustomerClassifierSchema(): string {
  const customerActions = CUSTOMER_INTENTS.filter(
    (id) => id !== 'unknown',
  ).join(' | ');
  const publicActions = PUBLIC_ONLY_ASSISTANT_ACTIONS.join(' | ');
  return `You are a customer-facing booking assistant (public web + consumer app).
Classify the user's message and extract parameters. Return JSON:

{
  "action": ${customerActions} | ${publicActions} | unknown,
  "params": {
    "employeeName": "string or null",
    "allProviders": "boolean or null — true when no named provider and user asks who is free / any provider",
    "bookingFirstAvailable": "boolean or null — true for nearest/first/soonest/next/earliest/ASAP; leave timeSlot null",
    "serviceName": "string or null",
    "serviceNames": ["string"] or null,
    "packageName": "string or null",
    "packageId": "string or null",
    "bookingId": "string or null",
    "promoCode": "string or null",
    "giftCardCode": "string or null",
    "date": "DD/MM/YYYY or null",
    "timeSlot": "HH:MM or null — omit when bookingFirstAvailable=true",
    "timeFrom": "HH:MM or null — earliest hour for flexible booking (e.g. after 16:00)",
    "timeOfDay": "morning | afternoon | evening | null",
    "availabilityWindows": [{"date": "DD/MM/YYYY or null", "weekdays": ["monday", "friday", etc.] or null, "timeOfDay": "morning | afternoon | evening | null", "timeFrom": "HH:MM or null", "timeSlot": "HH:MM or null", "employeeName": "string or null — named specialist for that OR window only"}] or null — OR alternatives (tomorrow evening OR Friday afternoon); each window scanned independently",
    "serviceCategory": "string or null — keyword to filter service type names (e.g. haircut, massage)",
    "maxPrice": "number or null — inclusive catalog display-price ceiling when the user states a budget",
    "serviceRank": "highest_price | lowest_price | most_popular | null — rank catalog services for list_services (premium/cheapest/popular service, not specialist ratings)",
    "serviceTier": "standard | premium | null — filter catalog rows by entity metadata tier",
    "paymentMethod": "cash | online | gift_card | null",
    "customerName": "string or null",
    "customerEmail": "string or null",
    "customerPhone": "string or null",
    "topicId": "string or null — optional consumer guide playbook id (consumer-tabs, consumer-account, consumer-packages-gift-cards) for explain_app_feature / guide_user_flow / explain_current_screen"
  },
  "reasoning": "one short sentence"
}

Rules:
- Use public assistant actions (list_providers, check_availability, book_appointment, etc.) for anonymous discovery/booking on the public page.
- Use customer self-service actions (book_package, list_my_appointments, cancel_my_booking, promo_code_help, etc.) for logged-in account flows.
- Check-then-book compound prompts (who is free + book nearest/soonest/ASAP) are executed as multi-step flows automatically — classify the first step as check_providers_for_service when only listing providers, or book_nearest_slot when only booking flexibly; never return create_booking/book_appointment with a missing timeSlot unless bookingFirstAvailable=true.
- Never invent catalog names; use context when provided.
- Default to "unknown" when unclear.
${CHECK_AND_BOOK_CLASSIFIER_RULES}
${CUSTOMER_AVAILABILITY_DISAMBIGUATION_RULES}
${BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES}
${FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES}
${SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES}
${CHECKOUT_CURRENCY_CLASSIFIER_RULES}
${CHECKOUT_TAX_CLASSIFIER_RULES}
${TENANT_CURRENCY_CLASSIFIER_RULES}
${NOTIFICATION_CURRENCY_CLASSIFIER_RULES}
${STRIPE_CHECKOUT_CURRENCY_CLASSIFIER_RULES}
${BOOKING_LANGUAGES_CLASSIFIER_RULES}
${BOOKING_DATE_FORMAT_CLASSIFIER_RULES}
${TOUR_BOOKING_CLASSIFIER_RULES}
${TOUR_DAY_SLOTS_CLASSIFIER_RULES}
${TOUR_CAPACITY_CLASSIFIER_RULES}
${CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES}
${CHECKOUT_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES}
${CONSUMER_CHECKOUT_SUCCESS_CLASSIFIER_RULES}
${CONSUMER_CHECKOUT_SUCCESS_EN_CLASSIFIER_RULES}
${CONSUMER_CHECKOUT_TAX_CLASSIFIER_RULES}
${TAX_DISPLAY_EN_CLASSIFIER_RULES}
${DATA_RIGHTS_CLASSIFIER_RULES}
${CONSUMER_CLINIC_TEST_RESULTS_CLASSIFIER_RULES}
${CONSUMER_CLINIC_LAB_BOOKING_CLASSIFIER_RULES}
${CLINIC_BOOKING_CLASSIFIER_RULES}
${CUSTOMER_CLINIC_TEST_RESULTS_CLASSIFIER_APPENDIX}
${CUSTOMER_PACKAGE_BOOKING_CLASSIFIER_RULES}
${CONSUMER_ADOPTION_CLASSIFIER_RULES}
${CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES}
${GROWTH_LOOPS_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_EXPLAIN_MY_NOTIFICATIONS_CLASSIFIER_RULES}
${CUSTOMER_APP_GUIDE_CLASSIFIER_RULES}
${CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PREPAYMENT_EXPLAIN_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_CASH_PAYMENT_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PAY_ONLINE_CLASSIFIER_RULES}
${CUSTOMER_RESUME_PENDING_PAYMENT_CLASSIFIER_RULES}
${RESUME_PENDING_PAYMENT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_MULTI_SERVICE_CLASSIFIER_RULES}
${CUSTOMER_SUBSCRIPTION_MEMBERSHIP_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_PROMO_CODE_HELP_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_SERVICE_PRICE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_COMPARE_SERVICES_CLASSIFIER_RULES}
${COMPARE_SERVICES_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_FILTER_SERVICES_NO_PREPAYMENT_CLASSIFIER_RULES}
${FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_AMOUNT_DUE_NOW_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES}
${EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CLASSIFIER_RULES}
${EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES}
${EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_CLASSIFIER_RULES}
${CUSTOMER_LOYALTY_POINTS_BALANCE_CLASSIFIER_RULES}
${CUSTOMER_PRIVACY_GDPR_CLASSIFIER_RULES}
${CUSTOMER_GIFT_CARD_CANCEL_CLASSIFIER_RULES}
${CUSTOMER_PACKAGE_VISIT_SELF_CLASSIFIER_RULES}
${CUSTOMER_LIST_MY_PACKAGE_VISITS_CLASSIFIER_RULES}
${CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES}
${CUSTOMER_CANCEL_MY_BOOKING_CLASSIFIER_RULES}
${CUSTOMER_RESCHEDULE_MY_BOOKING_CLASSIFIER_RULES}

${CLASSIFIER_MULTILINGUAL_RULES}`;
}

export function mergeCustomerCompoundContext(
  context: Record<string, unknown>,
  result: CommandResult,
): Record<string, unknown> {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const next = { ...context };
  if (details.sessionContext && typeof details.sessionContext === 'object') {
    Object.assign(next, details.sessionContext);
  }
  for (const key of [
    'cartServiceIds',
    'bookingId',
    'packageId',
    'packageName',
    'manageUrl',
    'promoCode',
    'giftCardCode',
    'paymentMethod',
    'useSubscriptionId',
    'serviceId',
    'employeeId',
  ]) {
    if (details[key] !== undefined) next[key] = details[key];
  }
  Object.assign(next, pickSharedBookingContextSlice(details));
  const sessionSlice = pickSharedBookingContextSlice(
    (details.sessionContext as Record<string, unknown> | undefined) ?? {},
  );
  Object.assign(next, sessionSlice);
  return mergeCheckProvidersHandoffIntoContext(next, result);
}
