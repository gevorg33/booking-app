import { AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES as AI_CMD_DOMAIN_EVAL_CASES } from '../ai-cmd-eval.fixtures.js';
import {
  CHECK_AND_BOOK_EVAL_SCENARIOS,
  FLEXIBLE_BOOKING_EVAL_SCENARIOS,
  type CheckAndBookEvalScenario,
  type FlexibleBookingEvalScenario,
} from '../ai-check-and-book.fixtures.js';
import {
  MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS,
  MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS,
} from '../ai-check-and-book-multilingual.fixtures.js';
import {
  CREATE_TEST_ORDER_PROMPTS,
  LIST_TEST_ORDERS_PROMPTS,
} from '../ai-clinic-test-order.fixtures.js';
import {
  MULTILINGUAL_CLINIC_TEST_ORDER_EVAL_SCENARIOS,
  type ClinicTestOrderEvalScenario,
} from '../ai-clinic-test-order-multilingual.fixtures.js';
import {
  ENTER_TEST_RESULT_PROMPTS,
  RELEASE_TEST_RESULT_PROMPTS,
} from '../ai-clinic-test-result.fixtures.js';
import {
  CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS,
  EXPLAIN_PATIENT_RESULTS_PROMPTS,
  LIST_ABNORMAL_RESULTS_PROMPTS,
  UPLOAD_PATIENT_RESULT_PROMPTS,
} from '../ai-clinic-test-result-ext.fixtures.js';
import {
  MULTILINGUAL_CLINIC_TEST_RESULT_EVAL_SCENARIOS,
  type ClinicTestResultEvalScenario,
} from '../ai-clinic-test-result-multilingual.fixtures.js';
import { EXPLAIN_PATIENT_CHART_PROMPTS } from '../ai-clinic-patient-chart.fixtures.js';
import {
  MULTILINGUAL_CLINIC_PATIENT_CHART_EVAL_SCENARIOS,
  type ClinicPatientChartEvalScenario,
} from '../ai-clinic-patient-chart-multilingual.fixtures.js';
import {
  LIST_MY_COLLECTION_QUEUE_PROMPTS,
  MARK_SPECIMEN_COLLECTED_PROMPTS,
} from '../ai-provider-clinic-collection.fixtures.js';
import {
  MULTILINGUAL_PROVIDER_CLINIC_COLLECTION_EVAL_SCENARIOS,
  type ProviderClinicCollectionEvalScenario,
} from '../ai-provider-clinic-collection-multilingual.fixtures.js';
import {
  EXPLAIN_RESULT_STATUS_PROMPTS,
  LIST_MY_TEST_RESULTS_PROMPTS,
} from '../ai-consumer-clinic-test-results.fixtures.js';
import {
  MULTILINGUAL_CONSUMER_CLINIC_TEST_RESULTS_EVAL_SCENARIOS,
  type ConsumerClinicTestResultsEvalScenario,
} from '../ai-consumer-clinic-test-results-multilingual.fixtures.js';
import {
  AWAITING_PATIENT_BOOKING_LIST_PROMPTS,
  BOOK_LAB_COLLECTION_PROMPTS,
  LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS,
  LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS,
  PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS,
  STAFF_BOOK_LAB_COLLECTION_PROMPTS,
} from '../ai-clinic-lab-booking.fixtures.js';
import { MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS } from '../ai-clinic-lab-booking-multilingual.fixtures.js';
import { clinicLabBookingMultilingualScenarioToEvalCase } from '../ai-clinic-lab-booking-multilingual.util.js';
import {
  EXPLAIN_CLINIC_BOOKING_PROMPTS,
} from '../ai-clinic-booking.fixtures.js';
import { MULTILINGUAL_CLINIC_BOOKING_EVAL_SCENARIOS } from '../ai-clinic-booking-multilingual.fixtures.js';
import { clinicBookingMultilingualScenarioToEvalCase } from '../ai-clinic-booking-multilingual.util.js';
import {
  CLINIC_V2_SURFACE_SCENARIOS,
  type ClinicV2SurfaceScenario,
} from '../ai-clinic-v2-6.fixtures.js';
import { CLINIC_COMPOUND_RESCUE_SCENARIOS } from '../ai-clinic-compound.fixtures.js';
import { MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS } from '../ai-clinic-compound-multilingual.fixtures.js';
import {
  clinicCompoundMultilingualRescueScenarioToEvalCase,
  clinicCompoundMultilingualScenarioToEvalCase,
} from '../ai-clinic-compound-multilingual.util.js';
import { MULTILINGUAL_CLINIC_V2_EVAL_SCENARIOS } from '../ai-clinic-v2-6-multilingual.fixtures.js';
import {
  clinicV2MultilingualScenarioToEvalCase,
  clinicV2ScenarioToEvalCase,
} from '../ai-clinic-v2-6.util.js';
import {
  AVAILABILITY_DISAMBIGUATION_SCENARIOS,
  type AvailabilityDisambiguationScenario,
} from '../ai-intent-disambiguation.fixtures.js';
import { ALL_DASHBOARD_OPS_SCENARIOS } from '../ai-dashboard-ops.fixtures.js';
import { STAFF_OPERATIONS_PROMPT_FIXTURES } from '../ai-staff-operations.fixtures.js';
import {
  AI_COMMAND_EVAL_STAFF_OPERATIONS_MULTILINGUAL_CASES,
} from '../ai-staff-operations-multilingual.eval.util.js';
import { BILLING_LOYALTY_DASHBOARD_PROMPT_FIXTURES } from '../ai-billing-loyalty-dashboard.fixtures.js';
import {
  AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_MULTILINGUAL_CASES,
} from '../ai-billing-loyalty-dashboard-multilingual.eval.util.js';
import { WAITLIST_DASHBOARD_PROMPT_FIXTURES } from '../ai-waitlist-dashboard.fixtures.js';
import {
  AI_COMMAND_EVAL_WAITLIST_DASHBOARD_MULTILINGUAL_CASES,
} from '../ai-waitlist-dashboard-multilingual.eval.util.js';
import { PROVIDER_ONBOARDING_COMPOUND_PROMPTS } from '../ai-provider-onboarding-compound.fixtures.js';
import {
  AI_COMMAND_EVAL_PROVIDER_ONBOARDING_MULTILINGUAL_CASES,
} from '../ai-provider-onboarding-compound-multilingual.eval.util.js';
import {
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS,
  CLINIC_LAB_DAY_CLOSE_RESCUE_SCENARIOS,
} from '../ai-clinic-lab-day-close-compound.fixtures.js';
import {
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  BUDGET_DISCOVER_AND_BOOK_RESCUE_SCENARIOS,
} from '../ai-budget-discover-and-book-compound.fixtures.js';
import {
  AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_CASES,
} from '../ai-budget-discover-and-book-compound-multilingual.eval.util.js';
import {
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  RANK_DISCOVER_AND_BOOK_RESCUE_SCENARIOS,
} from '../ai-rank-discover-and-book-compound.fixtures.js';
import {
  AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_MULTILINGUAL_CASES,
} from '../ai-rank-discover-and-book-compound-multilingual.eval.util.js';
import {
  AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_CASES,
} from '../ai-clinic-lab-day-close-compound-multilingual.eval.util.js';
import {
  RESCHEDULE_NEAREST_FREE_YEAR_PROMPT,
  SUMMARIZE_BOOKINGS_REVENUE_PROMPTS,
} from '../ai-dashboard-summarize-bookings.fixtures.js';
import {
  BULK_UPDATE_SERVICE_CURRENCY_PROMPTS,
  CONFIGURE_BUSINESS_CURRENCY_PROMPTS,
  EXPLAIN_BUSINESS_CURRENCY_PROMPTS,
} from '../ai-business-currency.fixtures.js';
import {
  CONFIGURE_BUSINESS_DATE_FORMAT_PROMPTS,
  EXPLAIN_BUSINESS_DATE_FORMAT_PROMPTS,
} from '../ai-business-date-format.fixtures.js';
import {
  MULTILINGUAL_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS,
  type BusinessDateFormatEvalScenario,
} from '../ai-business-date-format-multilingual.fixtures.js';
import { EXPLAIN_BOOKING_DATE_FORMAT_PROMPTS } from '../ai-booking-date-format.fixtures.js';
import {
  MULTILINGUAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS,
  type PreviewAuditDateFormatEvalScenario,
} from '../ai-business-date-format-preview-audit-multilingual.fixtures.js';
import {
  EXPLAIN_DATE_INPUT_FORMAT_PROMPTS,
  PREVIEW_DATE_INPUT_PARSE_PROMPTS,
} from '../ai-date-input-format.fixtures.js';
import {
  MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS,
  type DateInputProviderFormatEvalScenario,
} from '../ai-date-input-provider-format-multilingual.fixtures.js';
import {
  CONFIGURE_BUSINESS_TAX_PROMPTS,
  EXPLAIN_BUSINESS_TAX_PROMPTS,
  SET_SERVICE_TAX_RATE_PROMPTS,
} from '../ai-business-tax.fixtures.js';
import {
  MULTILINGUAL_BUSINESS_TAX_EVAL_SCENARIOS,
  type BusinessTaxEvalScenario,
} from '../ai-business-tax-multilingual.fixtures.js';
import { EXPLAIN_CHECKOUT_TAX_PROMPTS } from '../ai-checkout-tax.fixtures.js';
import {
  CONFIGURE_STACKED_TAX_RULES_PROMPTS,
  EXPLAIN_STACKED_TAX_PROMPTS,
} from '../ai-stacked-tax.fixtures.js';
import {
  MULTILINGUAL_STACKED_TAX_EVAL_SCENARIOS,
  type StackedTaxEvalScenario,
} from '../ai-stacked-tax-multilingual.fixtures.js';
import { EXPLAIN_STRIPE_TAX_CHARGE_PROMPTS } from '../ai-stripe-tax-charge.fixtures.js';
import { LOOKUP_BOOKING_TAX_METADATA_PROMPTS } from '../ai-lookup-booking-tax-metadata.fixtures.js';
import { EXPLAIN_APPOINTMENT_TAX_PROMPTS } from '../ai-appointment-tax.fixtures.js';
import { QUOTE_STAFF_BOOKING_TAX_PROMPTS } from '../ai-quote-staff-booking-tax.fixtures.js';
import { SUMMARIZE_CUSTOMER_TAX_PAID_PROMPTS } from '../ai-summarize-customer-tax-paid.fixtures.js';
import { EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS } from '../ai-consumer-checkout-tax.fixtures.js';
import {
  EN_TAX_DISPLAY_EVAL_SCENARIOS,
  type TaxDisplayEvalScenario,
} from '../ai-tax-display-en.fixtures.js';
import {
  CONFIGURE_GRANULAR_CONSENT_PROMPTS,
  CONFIGURE_PRIVACY_RETENTION_PROMPTS,
  ADMIN_DELETE_CUSTOMER_DATA_PROMPTS,
  ACCEPT_HIPAA_BAA_PROMPTS,
  CONFIGURE_HIPAA_SESSION_TIMEOUT_PROMPTS,
  ENABLE_HIPAA_MODE_PROMPTS,
  EXPLAIN_COMPLIANCE_STATUS_PROMPTS,
  EXPLAIN_GDPR_CHECKLIST_PROMPTS,
  EXPLAIN_HIPAA_SESSION_TIMEOUT_PROMPTS,
  LIST_SUB_PROCESSORS_PROMPTS,
  EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_PROMPTS,
  EXPLAIN_PHI_ENCRYPTION_STATUS_PROMPTS,
  LIST_BREACH_INCIDENTS_PROMPTS,
  REPORT_DATA_BREACH_PROMPTS,
  SEND_BREACH_NOTIFICATION_PROMPTS,
  OPEN_COMPLIANCE_DASHBOARD_PROMPTS,
  VIEW_PHI_ACCESS_AUDIT_PROMPTS,
} from '../ai-business-compliance.fixtures.js';
import { EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS } from '../ai-provider-session-timeout.fixtures.js';
import { EXPLAIN_DATA_RIGHTS_PROMPTS } from '../ai-data-rights.fixtures.js';
import {
  PHI_GUARD_ALLOW_PROMPTS,
  PHI_GUARD_BLOCK_PROMPTS,
  PHI_GUARD_REDACT_PROMPTS,
} from '../ai-phi-guard.fixtures.js';
import {
  MULTILINGUAL_BUSINESS_COMPLIANCE_EVAL_SCENARIOS,
  type BusinessComplianceEvalScenario,
} from '../ai-business-compliance-multilingual.fixtures.js';
import {
  EXPLAIN_NOTIFICATION_DATE_FORMAT_PROMPTS,
  NOTIFY_PATIENT_RESULT_READY_PROMPTS,
  PREVIEW_NOTIFICATION_DATETIME_PROMPTS,
} from '../ai-notification-date-format.fixtures.js';
import {
  MULTILINGUAL_NOTIFICATION_DATE_FORMAT_EVAL_SCENARIOS,
  type NotificationDateFormatEvalScenario,
} from '../ai-notification-date-format-multilingual.fixtures.js';
import {
  AUDIT_DASHBOARD_DATE_SURFACES_PROMPTS,
  MIGRATE_DASHBOARD_DATE_DISPLAY_PROMPTS,
  PREVIEW_BUSINESS_DATE_FORMAT_PROMPTS,
} from '../ai-dashboard-date-surface-audit.fixtures.js';
import {
  CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS,
  EXPLAIN_RECOMMENDATION_SETUP_PROMPTS,
  LINK_RECOMMENDED_PRODUCTS_PROMPTS,
} from '../ai-recommendation-product.fixtures.js';
import { EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS } from '../ai-recommendation-analytics.fixtures.js';
import { SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS } from '../ai-recommendation-performance.fixtures.js';
import {
  buildEnglishRecommendationAnalyticsEvalScenarios,
  MULTILINGUAL_RECOMMENDATION_ANALYTICS_EVAL_SCENARIOS,
  type RecommendationAnalyticsEvalScenario,
} from '../ai-recommendation-analytics-multilingual.fixtures.js';
import { EXPLAIN_CHECKOUT_CURRENCY_PROMPTS } from '../ai-checkout-currency.fixtures.js';
import { EXPLAIN_TENANT_CURRENCY_PROMPTS } from '../ai-tenant-currency.fixtures.js';
import { EXPLAIN_PACKAGE_CURRENCY_PROMPTS } from '../ai-package-currency.fixtures.js';
import { EXPLAIN_NOTIFICATION_CURRENCY_PROMPTS } from '../ai-notification-currency.fixtures.js';
import { EXPLAIN_STRIPE_CHECKOUT_CURRENCY_PROMPTS } from '../ai-stripe-checkout-currency.fixtures.js';
import { EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS } from '../ai-stripe-currency-warning.fixtures.js';
import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_PROMPTS } from '../ai-stripe-checkout-failure.fixtures.js';
import { EXPLAIN_REPORTS_CURRENCY_PROMPTS } from '../ai-reports-currency.fixtures.js';
import { SUMMARIZE_REVENUE_KPIS_PROMPTS } from '../ai-revenue-kpis.fixtures.js';
import {
  BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_PROMPTS,
  CONFIGURE_BUSINESS_LANGUAGES_PROMPTS,
  EXPLAIN_BUSINESS_LANGUAGES_PROMPTS,
} from '../ai-business-languages.fixtures.js';
import { EXPLAIN_BOOKING_LANGUAGES_PROMPTS } from '../ai-booking-languages.fixtures.js';
import { CONFIGURE_PACKAGE_LOCALIZED_NAMES_PROMPTS } from '../ai-package-localized-names.fixtures.js';
import {
  APPLY_CLINIC_PLAYBOOK_PROMPTS,
  CONFIGURE_CLINIC_SERVICE_PROMPTS,
  EXPLAIN_CLINIC_SERVICES_PROMPTS,
} from '../ai-clinic-service.fixtures.js';
import {
  MULTILINGUAL_CLINIC_SERVICE_EVAL_SCENARIOS,
  type ClinicServiceEvalScenario,
} from '../ai-clinic-service-multilingual.fixtures.js';
import {
  APPLY_TOUR_PLAYBOOK_PROMPTS,
  CONFIGURE_TOUR_SERVICE_PROMPTS,
  EXPLAIN_TOUR_SERVICES_PROMPTS,
} from '../ai-tour-service.fixtures.js';
import {
  MULTILINGUAL_TOUR_SERVICE_EVAL_SCENARIOS,
  type TourServiceEvalScenario,
} from '../ai-tour-service-multilingual.fixtures.js';
import { EXPLAIN_PACKAGE_DISPLAY_NAME_PROMPTS } from '../ai-package-display-name.fixtures.js';
import { EXPLAIN_TOUR_BOOKING_PROMPTS } from '../ai-tour-booking.fixtures.js';
import { DIAGNOSE_TOUR_CAPACITY_PROMPTS } from '../ai-tour-capacity.fixtures.js';
import { LIST_UPCOMING_TOUR_DEPARTURES_PROMPTS } from '../ai-upcoming-tour-departures.fixtures.js';
import { EXPLAIN_TOUR_BOOKING_RECORD_PROMPTS } from '../ai-tour-booking-record.fixtures.js';
import { EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS } from '../ai-tour-calendar-span.fixtures.js';
import { LIST_TOUR_CALENDAR_WEEK_PROMPTS } from '../ai-tour-calendar-week.fixtures.js';
import {
  MULTILINGUAL_TOUR_CALENDAR_EVAL_SCENARIOS,
  type TourCalendarEvalScenario,
} from '../ai-tour-calendar-multilingual.fixtures.js';
import { EXPLAIN_TOUR_DAY_SLOTS_PROMPTS } from '../ai-tour-day-slots.fixtures.js';
import {
  MULTILINGUAL_TOUR_CONSUMER_EVAL_SCENARIOS,
  type TourConsumerEvalScenario,
} from '../ai-tour-consumer-multilingual.fixtures.js';
import {
  MULTILINGUAL_PACKAGE_LOCALIZED_NAMES_EVAL_SCENARIOS,
  type PackageLocalizedNamesEvalScenario,
} from '../ai-package-localized-names-multilingual.fixtures.js';
import {
  MULTILINGUAL_BUSINESS_LANGUAGES_EVAL_SCENARIOS,
  type BusinessLanguagesEvalScenario,
} from '../ai-business-languages-multilingual.fixtures.js';
import {
  CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS,
  EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS,
} from '../ai-provider-date-format.fixtures.js';
import { EXPLAIN_PROVIDER_PAYMENT_CURRENCY_PROMPTS } from '../ai-provider-payment-currency.fixtures.js';
import {
  MULTILINGUAL_BUSINESS_CURRENCY_EVAL_SCENARIOS,
  type BusinessCurrencyEvalScenario,
} from '../ai-business-currency-multilingual.fixtures.js';
import {
  MULTILINGUAL_RECOMMENDATION_PRODUCT_EVAL_SCENARIOS,
  type RecommendationProductEvalScenario,
} from '../ai-recommendation-product-multilingual.fixtures.js';
import { EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS } from '../ai-checkout-recommendations.fixtures.js';
export {
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CASES,
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_DASHBOARD_CASES,
  AI_COMMAND_EVAL_BUDGET_SERVICE_DISCOVERY_PUBLIC_CASES,
  budgetServiceDiscoveryScenarioToEvalCase,
} from '../ai-budget-service-discovery.eval.util.js';
export {
  AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CASES,
  AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_SERVICE_RANK_DISCOVERY_PUBLIC_CASES,
  serviceRankDiscoveryScenarioToEvalCase,
} from '../ai-service-rank-discovery.eval.util.js';
export {
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_CUSTOMER_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_DASHBOARD_CASES,
  AI_COMMAND_EVAL_FLEXIBLE_AVAILABILITY_PUBLIC_CASES,
  flexibleAvailabilityScenarioToEvalCase,
} from '../ai-flexible-availability.eval.util.js';
export {
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CASES,
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_CONSUMER_CHIP_CASES,
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_DISCOVER_CROSS_SPRINT_PUBLIC_INTEGRATION_CASES,
  DISCOVER_CROSS_SPRINT_MIN_EVAL_CASES,
  DISCOVER_CROSS_SPRINT_TRANSLATED_EVAL_IDS,
  evaluateDiscoverCrossSprintEvalCase,
  isMultilingualDiscoverEvalEligible,
} from '../ai-service-discovery.eval.util.js';
export { buildFlexibleAvailabilityEvalParams } from '../ai-flexible-availability-compound.util.js';
import { CONSUMER_ADOPTION_PROMPT_SCENARIOS } from '../ai-consumer-adoption.fixtures.js';
import { AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES } from '../ai-self-service-booking-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_MARKETING_GROWTH_MULTILINGUAL_CASES } from '../ai-marketing-growth-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES } from '../ai-consumer-checkout-success-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CASES } from '../ai-consumer-checkout-tax-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_TYPO_CORPUS_CASES } from '../ai-typo-corpus.eval.util.js';
import { AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CASES } from '../ai-consumer-clinic-test-results-deferred-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_MULTILINGUAL_CASES } from '../ai-provider-push-setup-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_AMBIGUITY_CORPUS_CASES } from '../ai-ambiguity-corpus.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_EARNINGS_MULTILINGUAL_CASES } from '../ai-provider-earnings-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_EXP_2_MULTILINGUAL_CASES } from '../ai-provider-exp-2-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_CASES } from '../ai-provider-client-context-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_EXP_3_MULTILINGUAL_CASES } from '../ai-provider-exp-3-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CASES } from '../ai-provider-session-timeout-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CASES } from '../ai-provider-open-shifts-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CASES } from '../ai-provider-team-whos-next-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CASES } from '../ai-provider-time-off-list-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_PROVIDER_DATE_FORMAT_MULTILINGUAL_CASES } from '../ai-provider-date-format-multilingual.eval.util.js';
import { PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS } from '../ai-provider-push-setup.fixtures.js';
import { PROVIDER_EARNINGS_PROMPT_SCENARIOS } from '../ai-provider-earnings.fixtures.js';
import { PROVIDER_EXP_2_PROMPT_SCENARIOS } from '../ai-provider-exp-2.fixtures.js';
import { PROVIDER_EXP_3_PROMPT_SCENARIOS } from '../ai-provider-exp-3.fixtures.js';
import { SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS } from '../../provider-mobile/provider-open-shifts.fixtures.js';
import { SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS } from '../../provider-mobile/provider-team-whos-next.fixtures.js';
import { SIMILAR_PROVIDER_TIME_OFF_LIST_PROMPTS } from '../../provider-mobile/provider-time-off.fixtures.js';
import { PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS } from '../ai-provider-client-context.fixtures.js';
import { EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS } from '../ai-consumer-checkout-success.fixtures.js';
import {
  EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS,
  type ConsumerCheckoutSuccessEvalScenario,
} from '../ai-consumer-checkout-success-en.fixtures.js';
import { COMPOUND_COMMAND_RECIPES } from '../ai-command-registry.js';
import {
  COMPOUND_DECOMPOSITION_SCENARIOS,
  type CompoundScenarioExpectation,
} from '../intent-decomposition.fixtures.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from '../intent-decomposition.util.js';

import type {
  AiCommandEvalCase,
  AiCommandEvalExpectation,
  AiEvalLocale,
} from './ai-command-eval.types.js';

export const AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES = AI_CMD_DOMAIN_EVAL_CASES;

/** Map check+book fixtures (ai-cmd-h1.3) to eval golden cases. */
export function checkAndBookScenarioToEvalCase(
  scenario: CheckAndBookEvalScenario,
): AiCommandEvalCase {
  const recipeId =
    scenario.surface === 'dashboard'
      ? 'dashboard_payments_compound'
      : 'customer_self_service_compound';

  const checkStepParams: Record<string, unknown> = {
    serviceName: scenario.serviceName,
    allProviders: true,
  };
  if (scenario.timeOfDay) checkStepParams.timeOfDay = scenario.timeOfDay;
  if (scenario.notBeforeTime) {
    checkStepParams.notBeforeTime = scenario.notBeforeTime;
  }
  const bookStepParams: Record<string, unknown> = {
    serviceName: scenario.serviceName,
    bookingFirstAvailable: true,
    allProviders: true,
  };
  if (scenario.timeOfDay) bookStepParams.timeOfDay = scenario.timeOfDay;
  if (scenario.notBeforeTime) {
    bookStepParams.notBeforeTime = scenario.notBeforeTime;
  }

  const expect: AiCommandEvalExpectation = {
    compoundSurface: scenario.surface,
    compoundSteps: ['check_providers_for_service', 'book_nearest_slot'],
    compoundSource: 'golden',
    compoundRecipeId: recipeId,
    compoundStepParams: [
      { stepIndex: 0, paramsPartial: checkStepParams },
      { stepIndex: 1, paramsPartial: bookStepParams },
    ],
  };
  return {
    id: `check-book-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    expect,
  };
}

/** Map availability disambiguation scenarios (ai-cmd-h1.4) to eval golden cases. */
export function availabilityDisambiguationScenarioToEvalCase(
  scenario: AvailabilityDisambiguationScenario,
): AiCommandEvalCase {
  return {
    id: `disambig-${scenario.surface}-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueFromAction: scenario.rescueFromAction,
      rescueReason: scenario.rescueReason,
      paramsPartial: scenario.paramsPartial,
    },
  };
}

/** Map business currency scenarios (ai-cmd-curr-4) to eval golden cases. */
export function businessCurrencyScenarioToEvalCase(
  scenario: BusinessCurrencyEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `business-currency-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishBusinessCurrencyEvalScenarios(): BusinessCurrencyEvalScenario[] {
  return [
    ...CONFIGURE_BUSINESS_CURRENCY_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'configure_business_currency' as const,
      rescueReason: 'configure_business_currency',
      paramsPartial: { currencyCode: entry.currencyCode },
    })),
    ...EXPLAIN_BUSINESS_CURRENCY_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'explain_business_currency' as const,
      rescueReason: 'explain_business_currency',
    })),
    ...BULK_UPDATE_SERVICE_CURRENCY_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'bulk_update_service_currency' as const,
      rescueReason: 'bulk_update_service_currency',
    })),
  ];
}

export const AI_COMMAND_EVAL_BUSINESS_CURRENCY_CASES: AiCommandEvalCase[] = [
  ...buildEnglishBusinessCurrencyEvalScenarios().map(
    businessCurrencyScenarioToEvalCase,
  ),
  ...MULTILINGUAL_BUSINESS_CURRENCY_EVAL_SCENARIOS.map(
    businessCurrencyScenarioToEvalCase,
  ),
];

/** Map business date/time format scenarios (ai-cmd-fmt-1..3) to eval golden cases. */
export function businessDateFormatScenarioToEvalCase(
  scenario: BusinessDateFormatEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `business-date-format-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishBusinessDateFormatEvalScenarios(): BusinessDateFormatEvalScenario[] {
  return [
    ...CONFIGURE_BUSINESS_DATE_FORMAT_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('dateFormat' in entry && entry.dateFormat) {
        paramsPartial.dateFormat = entry.dateFormat;
      }
      if ('timeFormat' in entry && entry.timeFormat) {
        paramsPartial.timeFormat = entry.timeFormat;
      }
      return {
        id: `en-${entry.id}`,
        locale: 'en' as const,
        prompt: entry.prompt,
        expectedAction: 'configure_business_date_format' as const,
        rescueReason: 'configure_business_date_format',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
    ...EXPLAIN_BUSINESS_DATE_FORMAT_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'explain_business_date_format' as const,
      rescueReason: 'explain_business_date_format',
    })),
  ];
}

/** Configure + explain business date/time format prompts for EN/HY/RU (ai-cmd-fmt-1..3). */
export const AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES: AiCommandEvalCase[] = [
  ...buildEnglishBusinessDateFormatEvalScenarios().map(
    businessDateFormatScenarioToEvalCase,
  ),
  ...MULTILINGUAL_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS.map(
    businessDateFormatScenarioToEvalCase,
  ),
];

/** Map preview date format prompts (ai-cmd-fmt-5) to eval golden cases. */
export const AI_COMMAND_EVAL_PREVIEW_BUSINESS_DATE_FORMAT_CASES: AiCommandEvalCase[] =
  PREVIEW_BUSINESS_DATE_FORMAT_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('dateFormat' in entry && entry.dateFormat) {
      paramsPartial.dateFormat = entry.dateFormat;
    }
    if ('timeFormat' in entry && entry.timeFormat) {
      paramsPartial.timeFormat = entry.timeFormat;
    }
    return {
      id: `preview-business-date-format-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'preview_business_date_format',
        rescueReason: 'preview_business_date_format',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map dashboard date surface audit prompts (ai-cmd-fmt-6) to eval golden cases. */
export const AI_COMMAND_EVAL_AUDIT_DASHBOARD_DATE_SURFACES_CASES: AiCommandEvalCase[] =
  AUDIT_DASHBOARD_DATE_SURFACES_PROMPTS.map((entry) => ({
    id: `audit-dashboard-date-surfaces-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
    },
  }));

function previewAuditDateFormatScenarioToEvalCase(
  scenario: PreviewAuditDateFormatEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalCase['expect'] = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `preview-audit-business-date-format-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishPreviewAuditDateFormatEvalScenarios(): PreviewAuditDateFormatEvalScenario[] {
  return [
    ...PREVIEW_BUSINESS_DATE_FORMAT_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('dateFormat' in entry && entry.dateFormat) {
        paramsPartial.dateFormat = entry.dateFormat;
      }
      if ('timeFormat' in entry && entry.timeFormat) {
        paramsPartial.timeFormat = entry.timeFormat;
      }
      return {
        id: `en-${entry.id}`,
        locale: 'en' as const,
        prompt: entry.prompt,
        expectedAction: 'preview_business_date_format' as const,
        rescueReason: 'preview_business_date_format',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
    ...AUDIT_DASHBOARD_DATE_SURFACES_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'audit_dashboard_date_surfaces' as const,
      rescueReason: 'audit_dashboard_date_surfaces',
    })),
  ];
}

/** Preview + audit business date format phrasing for EN/HY/RU (ai-cmd-fmt-8). */
export const AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishPreviewAuditDateFormatEvalScenarios().map(
      previewAuditDateFormatScenarioToEvalCase,
    ),
    ...MULTILINGUAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS.map(
      previewAuditDateFormatScenarioToEvalCase,
    ),
  ];

/** Map guided dashboard date migration prompts (ai-cmd-fmt-7) to eval golden cases. */
export const AI_COMMAND_EVAL_MIGRATE_DASHBOARD_DATE_DISPLAY_CASES: AiCommandEvalCase[] =
  MIGRATE_DASHBOARD_DATE_DISPLAY_PROMPTS.map((entry) => ({
    id: `migrate-dashboard-date-display-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'migrate_dashboard_date_display',
      rescueReason: 'migrate_dashboard_date_display',
      ...('surfaceId' in entry && entry.surfaceId
        ? { paramsPartial: { surfaceId: entry.surfaceId } }
        : {}),
    },
  }));

/** Map notification date format explain prompts (ai-cmd-fmt-9) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_NOTIFICATION_DATE_FORMAT_CASES: AiCommandEvalCase[] =
  EXPLAIN_NOTIFICATION_DATE_FORMAT_PROMPTS.map((entry) => ({
    id: `explain-notification-date-format-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_notification_date_format',
      rescueReason: 'explain_notification_date_format',
    },
  }));

/** Map notification datetime preview prompts (ai-cmd-fmt-10) to eval golden cases. */
export const AI_COMMAND_EVAL_PREVIEW_NOTIFICATION_DATETIME_CASES: AiCommandEvalCase[] =
  PREVIEW_NOTIFICATION_DATETIME_PROMPTS.map((entry) => ({
    id: `preview-notification-datetime-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'preview_notification_datetime',
      rescueReason: 'preview_notification_datetime',
      paramsPartial: { messageKind: entry.messageKind },
    },
  }));

/** Map typed date input explain prompts (ai-cmd-fmt-13) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_DATE_INPUT_FORMAT_CASES: AiCommandEvalCase[] =
  EXPLAIN_DATE_INPUT_FORMAT_PROMPTS.map((entry) => ({
    id: `explain-date-input-format-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_date_input_format',
      rescueReason: 'explain_date_input_format',
    },
  }));

/** Map typed date input parse preview prompts (ai-cmd-fmt-14) to eval golden cases. */
export const AI_COMMAND_EVAL_PREVIEW_DATE_INPUT_PARSE_CASES: AiCommandEvalCase[] =
  PREVIEW_DATE_INPUT_PARSE_PROMPTS.map((entry) => ({
    id: `preview-date-input-parse-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'preview_date_input_parse',
      rescueReason: 'preview_date_input_parse',
    },
  }));

/** Map clinic result-ready notify prompts (ai-cmd-fmt-11) to eval golden cases. */
export const AI_COMMAND_EVAL_NOTIFY_PATIENT_RESULT_READY_CASES: AiCommandEvalCase[] =
  NOTIFY_PATIENT_RESULT_READY_PROMPTS.map((entry) => ({
    id: `notify-patient-result-ready-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
    },
  }));

export function clinicTestOrderScenarioToEvalCase(
  scenario: ClinicTestOrderEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `clinic-test-order-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

/** Map clinic test order prompts (ai-cmd-clinic-v2-1) to eval golden cases. */
export const AI_COMMAND_EVAL_CLINIC_TEST_ORDER_CASES: AiCommandEvalCase[] = [
  ...CREATE_TEST_ORDER_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('customerName' in entry && entry.customerName) {
      paramsPartial.customerName = entry.customerName;
    }
    if ('bookingId' in entry && entry.bookingId) {
      paramsPartial.bookingId = entry.bookingId;
    }
    return {
      id: `create-test-order-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'create_test_order',
        rescueReason: 'create_test_order',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  }),
  ...LIST_TEST_ORDERS_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('customerName' in entry && entry.customerName) {
      paramsPartial.customerName = entry.customerName;
    }
    if ('status' in entry && entry.status) {
      paramsPartial.status = entry.status;
    }
    if ('bookingId' in entry && entry.bookingId) {
      paramsPartial.bookingId = entry.bookingId;
    }
    return {
      id: `list-test-orders-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'list_test_orders',
        rescueReason: 'list_test_orders',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  }),
];

/** Armenian/Russian clinic test order prompts (i18n-clinic-v2-ai-1). */
export const AI_COMMAND_EVAL_CLINIC_TEST_ORDER_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_TEST_ORDER_EVAL_SCENARIOS.map(
    clinicTestOrderScenarioToEvalCase,
  );

export function clinicTestResultScenarioToEvalCase(
  scenario: ClinicTestResultEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `clinic-test-result-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

/** Map clinic test result prompts (ai-cmd-clinic-v2-2) to eval golden cases. */
export const AI_COMMAND_EVAL_CLINIC_TEST_RESULT_CASES: AiCommandEvalCase[] = [
  ...ENTER_TEST_RESULT_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {
      measurementCode: entry.measurementCode,
      value: entry.value,
    };
    if ('orderId' in entry && entry.orderId) {
      paramsPartial.orderId = entry.orderId;
    }
    if ('resultId' in entry && entry.resultId) {
      paramsPartial.resultId = entry.resultId;
    }
    return {
      id: `enter-test-result-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'enter_test_result',
        rescueReason: 'enter_test_result',
        paramsPartial,
      },
    };
  }),
  ...RELEASE_TEST_RESULT_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('customerName' in entry && entry.customerName) {
      paramsPartial.customerName = entry.customerName;
    }
    if ('orderId' in entry && entry.orderId) {
      paramsPartial.orderId = entry.orderId;
    }
    if ('resultId' in entry && entry.resultId) {
      paramsPartial.resultId = entry.resultId;
    }
    return {
      id: `release-test-result-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'release_test_result',
        rescueReason: 'release_test_result',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  }),
];

/** Extended clinic lab dashboard intents (ai-cmd-ext-2.1–2.4). */
export const AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES: AiCommandEvalCase[] = [
  ...UPLOAD_PATIENT_RESULT_PROMPTS.map((entry) => ({
    id: `upload-patient-result-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'upload_patient_result',
      rescueReason: 'upload_patient_result',
      paramsPartial: { orderId: entry.orderId },
    },
  })),
  ...EXPLAIN_PATIENT_RESULTS_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('customerName' in entry && entry.customerName) {
      paramsPartial.customerName = entry.customerName;
    }
    if ('orderId' in entry && entry.orderId) {
      paramsPartial.orderId = entry.orderId;
    }
    return {
      id: `explain-patient-results-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_patient_results',
        rescueReason: 'explain_patient_results',
        paramsPartial,
      },
    };
  }),
  ...CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS.map((entry) => ({
    id: `configure-reference-range-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'configure_test_reference_range',
      rescueReason: 'configure_test_reference_range',
      paramsPartial: {
        measurementCode: entry.measurementCode,
        normalLow: entry.normalLow,
        normalHigh: entry.normalHigh,
      },
    },
  })),
  ...LIST_ABNORMAL_RESULTS_PROMPTS.map((entry) => ({
    id: `list-abnormal-results-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'list_abnormal_results',
      rescueReason: 'list_abnormal_results',
    },
  })),
];

/** Armenian/Russian clinic test result prompts (i18n-clinic-v2-ai-2). */
export const AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_TEST_RESULT_EVAL_SCENARIOS.map(
    clinicTestResultScenarioToEvalCase,
  );

export function clinicPatientChartScenarioToEvalCase(
  scenario: ClinicPatientChartEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `clinic-patient-chart-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

/** Map explain patient chart prompts (ai-cmd-clinic-v2-3) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PATIENT_CHART_CASES: AiCommandEvalCase[] =
  EXPLAIN_PATIENT_CHART_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('customerName' in entry && entry.customerName) {
      paramsPartial.customerName = entry.customerName;
    }
    return {
      id: `explain-patient-chart-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_patient_chart',
        rescueReason: 'explain_patient_chart',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Armenian/Russian explain patient chart prompts (i18n-clinic-v2-ai-3). */
export const AI_COMMAND_EVAL_CLINIC_PATIENT_CHART_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_PATIENT_CHART_EVAL_SCENARIOS.map(
    clinicPatientChartScenarioToEvalCase,
  );

export function providerClinicCollectionScenarioToEvalCase(
  scenario: ProviderClinicCollectionEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `provider-clinic-collection-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: 'provider',
    expect,
  };
}

/** Map provider clinic collection prompts (ai-cmd-clinic-v2-4) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_CASES: AiCommandEvalCase[] =
  [
    ...LIST_MY_COLLECTION_QUEUE_PROMPTS.map((entry) => ({
      id: `list-my-collection-queue-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'list_my_collection_queue',
        rescueReason: 'list_my_collection_queue',
      },
    })),
    ...MARK_SPECIMEN_COLLECTED_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('customerName' in entry && entry.customerName) {
        paramsPartial.customerName = entry.customerName;
      }
      if ('specimenId' in entry && entry.specimenId) {
        paramsPartial.specimenId = entry.specimenId;
      }
      if ('orderId' in entry && entry.orderId) {
        paramsPartial.orderId = entry.orderId;
      }
      return {
        id: `mark-specimen-collected-${entry.id}`,
        prompt: entry.prompt,
        locale: 'en' as const,
        expect: {
          rescuedAction: 'mark_specimen_collected',
          rescueReason: 'mark_specimen_collected',
          ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
        },
      };
    }),
  ];

/** Armenian/Russian provider clinic collection prompts (i18n-clinic-v2-ai-4). */
export const AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_PROVIDER_CLINIC_COLLECTION_EVAL_SCENARIOS.map(
    providerClinicCollectionScenarioToEvalCase,
  );

export function consumerClinicTestResultsScenarioToEvalCase(
  scenario: ConsumerClinicTestResultsEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `consumer-clinic-test-results-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: scenario.surface,
    expect,
  };
}

/** Armenian/Russian consumer/public clinic test results prompts (i18n-clinic-v2-ai-5). */
export const AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CONSUMER_CLINIC_TEST_RESULTS_EVAL_SCENARIOS.map(
    consumerClinicTestResultsScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_CASES: AiCommandEvalCase[] =
  [
    ...LIST_MY_TEST_RESULTS_PROMPTS.map((entry) => ({
      id: `list-my-test-results-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'list_my_test_results',
        rescueReason: 'list_my_test_results',
      },
    })),
    ...EXPLAIN_RESULT_STATUS_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('status' in entry && entry.status) {
        paramsPartial.status = entry.status;
      }
      if ('testName' in entry && entry.testName) {
        paramsPartial.testName = entry.testName;
      }
      return {
        id: `explain-result-status-${entry.id}`,
        prompt: entry.prompt,
        locale: 'en' as const,
        expect: {
          rescuedAction: 'explain_result_status',
          rescueReason: 'explain_result_status',
          ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
        },
      };
    }),
  ];

export const AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_CASES: AiCommandEvalCase[] = [
  ...PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('customerName' in entry && entry.customerName) {
      paramsPartial.customerName = entry.customerName;
    }
    if ('orderId' in entry && entry.orderId) {
      paramsPartial.orderId = entry.orderId;
    }
    return {
      id: `push-lab-booking-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      surface: 'dashboard' as const,
      expect: {
        rescuedAction: 'push_lab_booking_to_patient',
        rescueReason: 'push_lab_booking_to_patient',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  }),
  ...STAFF_BOOK_LAB_COLLECTION_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('customerName' in entry && entry.customerName) {
      paramsPartial.customerName = entry.customerName;
    }
    if ('orderId' in entry && entry.orderId) {
      paramsPartial.orderId = entry.orderId;
    }
    return {
      id: `staff-book-lab-collection-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      surface: 'dashboard' as const,
      expect: {
        rescuedAction: 'staff_book_lab_collection',
        rescueReason: 'staff_book_lab_collection',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  }),
  ...AWAITING_PATIENT_BOOKING_LIST_PROMPTS.map((entry) => ({
    id: `awaiting-patient-booking-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { awaitingPatientBooking: true },
    },
  })),
  ...LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS.map((entry) => ({
    id: `list-my-lab-booking-requests-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    surface: 'customer' as const,
    expect: {
      rescuedAction: 'list_my_lab_booking_requests',
      rescueReason: 'list_my_lab_booking_requests',
    },
  })),
  ...BOOK_LAB_COLLECTION_PROMPTS.map((entry) => ({
    id: `book-lab-collection-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    surface: 'customer' as const,
    expect: {
      rescuedAction: 'book_lab_collection',
      rescueReason: 'book_lab_collection',
    },
  })),
  ...LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS.map((entry) => ({
    id: `list-patient-pending-lab-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    surface: 'provider' as const,
    expect: {
      rescuedAction: 'list_patient_pending_lab_requests',
      rescueReason: 'list_patient_pending_lab_requests',
    },
  })),
];

/** HY/RU clinic lab collection push/book (i18n-clinic-v2-ai-8). */
export const AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS.map(
    clinicLabBookingMultilingualScenarioToEvalCase,
  );

export const AI_COMMAND_EVAL_CLINIC_BOOKING_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_CLINIC_BOOKING_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('aspect' in entry && entry.aspect) {
      paramsPartial.aspect = entry.aspect;
    }
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    return {
      id: `explain-clinic-booking-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      surface: 'public' as const,
      expect: {
        rescuedAction: 'explain_clinic_booking',
        rescueReason: 'explain_clinic_booking',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  }),
];

export const AI_COMMAND_EVAL_CLINIC_BOOKING_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_BOOKING_EVAL_SCENARIOS.map(
    clinicBookingMultilingualScenarioToEvalCase,
  );

/** Surface-tagged clinic v2 NL scenarios (ai-cmd-clinic-v2-6). */
export const AI_COMMAND_EVAL_CLINIC_V2_SURFACE_CASES: AiCommandEvalCase[] =
  CLINIC_V2_SURFACE_SCENARIOS.map((scenario: ClinicV2SurfaceScenario) =>
    clinicV2ScenarioToEvalCase(scenario),
  );

/** Armenian/Russian clinic v2 surface NL parity (i18n-clinic-v2-ai-6). */
export const AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_V2_EVAL_SCENARIOS.map(
    clinicV2MultilingualScenarioToEvalCase,
  );

/** Budget discover and book rescue (ai-cmd-ext-4.3). */
export const AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_RESCUE_CASES: AiCommandEvalCase[] =
  BUDGET_DISCOVER_AND_BOOK_RESCUE_SCENARIOS.map((scenario) => ({
    id: `budget-discover-book-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'budget_discover_and_book_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

/** Rank discover and book rescue (ai-cmd-ext-4.4). */
export const AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_RESCUE_CASES: AiCommandEvalCase[] =
  RANK_DISCOVER_AND_BOOK_RESCUE_SCENARIOS.map((scenario) => ({
    id: `rank-discover-book-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'rank_discover_and_book_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

/** Clinic lab day close rescue (ai-cmd-ext-4.2). */
export const AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_RESCUE_CASES: AiCommandEvalCase[] =
  CLINIC_LAB_DAY_CLOSE_RESCUE_SCENARIOS.map((scenario) => ({
    id: `clinic-lab-day-close-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'clinic_lab_day_close_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

/** Clinic lab order + result-notification compounds (ai-cmd-clinic-v2-7). */
export const AI_COMMAND_EVAL_CLINIC_COMPOUND_CASES: AiCommandEvalCase[] =
  CLINIC_COMPOUND_RESCUE_SCENARIOS.map((scenario) => ({
    id: `clinic-compound-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: scenario.surface,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'clinic_compound',
    },
  }));

/** HY/RU clinic compound decomposition (i18n-clinic-v2-ai-7). */
export const AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS.map(
    clinicCompoundMultilingualScenarioToEvalCase,
  );

/** HY/RU clinic compound rescue per locale (i18n-clinic-v2-ai-7). */
export const AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_RESCUE_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_COMPOUND_EVAL_SCENARIOS.filter(
    (scenario) => scenario.misclassifiedAction,
  ).map(clinicCompoundMultilingualRescueScenarioToEvalCase);

function notificationDateFormatScenarioToEvalCase(
  scenario: NotificationDateFormatEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalCase['expect'] = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `notification-date-format-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishNotificationDateFormatEvalScenarios(): NotificationDateFormatEvalScenario[] {
  return [
    ...EXPLAIN_NOTIFICATION_DATE_FORMAT_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'explain_notification_date_format' as const,
      rescueReason: 'explain_notification_date_format',
    })),
    ...PREVIEW_NOTIFICATION_DATETIME_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'preview_notification_datetime' as const,
      rescueReason: 'preview_notification_datetime',
      paramsPartial: { messageKind: entry.messageKind },
      messageKind: entry.messageKind,
    })),
    ...NOTIFY_PATIENT_RESULT_READY_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'notify_patient_result_ready' as const,
      rescueReason: 'notify_patient_result_ready',
    })),
  ];
}

/** Notification date-format + result-ready phrasing for EN/HY/RU (ai-cmd-fmt-12). */
export const AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishNotificationDateFormatEvalScenarios().map(
      notificationDateFormatScenarioToEvalCase,
    ),
    ...MULTILINGUAL_NOTIFICATION_DATE_FORMAT_EVAL_SCENARIOS.map(
      notificationDateFormatScenarioToEvalCase,
    ),
  ];

function dateInputProviderFormatScenarioToEvalCase(
  scenario: DateInputProviderFormatEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `date-input-provider-format-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishDateInputProviderFormatEvalScenarios(): DateInputProviderFormatEvalScenario[] {
  return [
    ...EXPLAIN_DATE_INPUT_FORMAT_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'explain_date_input_format' as const,
      rescueReason: 'explain_date_input_format',
    })),
    ...PREVIEW_DATE_INPUT_PARSE_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'preview_date_input_parse' as const,
      rescueReason: 'preview_date_input_parse',
    })),
    ...EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'explain_provider_date_display' as const,
      rescueReason: 'explain_provider_date_display',
    })),
    ...CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS.map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'configure_provider_push_date_format' as const,
      rescueReason: 'configure_provider_push_date_format',
    })),
  ];
}

/** Date-input parse preview + provider date-format phrasing for EN/HY/RU (ai-cmd-fmt-17). */
export const AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishDateInputProviderFormatEvalScenarios().map(
      dateInputProviderFormatScenarioToEvalCase,
    ),
    ...MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS.map(
      dateInputProviderFormatScenarioToEvalCase,
    ),
  ];

export function businessTaxScenarioToEvalCase(
  scenario: BusinessTaxEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `business-tax-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

/** Tax configuration phrasing for EN/HY/RU (ai-cmd-tax-4). */
export const AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...CONFIGURE_BUSINESS_TAX_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('enabled' in entry && entry.enabled !== undefined) {
        paramsPartial.enabled = entry.enabled;
      }
      if ('rate' in entry && entry.rate !== undefined) {
        paramsPartial.rate = entry.rate;
      }
      if ('name' in entry && entry.name !== undefined) {
        paramsPartial.name = entry.name;
      }
      if ('model' in entry && entry.model !== undefined) {
        paramsPartial.model = entry.model;
      }
      return businessTaxScenarioToEvalCase({
        id: `en-configure-${entry.id}`,
        locale: 'en',
        prompt: entry.prompt,
        expectedAction: 'configure_business_tax',
        rescueReason: 'configure_business_tax',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      });
    }),
    ...SET_SERVICE_TAX_RATE_PROMPTS.map((entry) =>
      businessTaxScenarioToEvalCase({
        id: `en-set-service-${entry.id}`,
        locale: 'en',
        prompt: entry.prompt,
        expectedAction: 'set_service_tax_rate',
        rescueReason: 'set_service_tax_rate',
        paramsPartial: {
          serviceQuery: entry.serviceQuery,
          taxRatePercent: entry.taxRatePercent,
        },
      }),
    ),
    ...EXPLAIN_BUSINESS_TAX_PROMPTS.map((entry) =>
      businessTaxScenarioToEvalCase({
        id: `en-explain-${entry.id}`,
        locale: 'en',
        prompt: entry.prompt,
        expectedAction: 'explain_business_tax',
        rescueReason: 'explain_business_tax',
      }),
    ),
    ...MULTILINGUAL_BUSINESS_TAX_EVAL_SCENARIOS.map(
      businessTaxScenarioToEvalCase,
    ),
  ];

/** Map checkout tax explain prompts (ai-cmd-tax-5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES: AiCommandEvalCase[] =
  EXPLAIN_CHECKOUT_TAX_PROMPTS.map((entry) => ({
    id: `explain-checkout-tax-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_checkout_tax',
      rescueReason: 'explain_checkout_tax',
    },
  }));

/** Map per-service tax override prompts (ai-cmd-tax-2) to eval golden cases. */
export const AI_COMMAND_EVAL_SET_SERVICE_TAX_RATE_CASES: AiCommandEvalCase[] =
  SET_SERVICE_TAX_RATE_PROMPTS.map((entry) => ({
    id: `set-service-tax-rate-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'set_service_tax_rate',
      rescueReason: 'set_service_tax_rate',
      paramsPartial: {
        serviceQuery: entry.serviceQuery,
        taxRatePercent: entry.taxRatePercent,
      },
    },
  }));

/** Map stacked tax configure prompts (ai-cmd-tax-6) to eval golden cases. */
export const AI_COMMAND_EVAL_CONFIGURE_STACKED_TAX_RULES_CASES: AiCommandEvalCase[] =
  CONFIGURE_STACKED_TAX_RULES_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {
      operation: entry.operation,
    };
    if ('removeRuleName' in entry && entry.removeRuleName) {
      const removeRuleName = entry.removeRuleName;
      paramsPartial.removeRuleName =
        removeRuleName === 'state'
          ? 'State'
          : removeRuleName === 'pst'
            ? 'PST'
            : removeRuleName;
    }
    return {
      id: `configure-stacked-tax-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'configure_stacked_tax_rules',
        rescueReason: 'configure_stacked_tax_rules',
        paramsPartial,
      },
    };
  });

export function stackedTaxScenarioToEvalCase(
  scenario: StackedTaxEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `stacked-tax-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

/** Stacked tax phrasing for EN/HY/RU (ai-cmd-tax-8). */
export const AI_COMMAND_EVAL_STACKED_TAX_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...CONFIGURE_STACKED_TAX_RULES_PROMPTS.filter(
      (entry) =>
        entry.id === 'add-gst-pst' || entry.id === 'stack-gst-at-rates',
    ).map((entry) => ({
      id: `stacked-tax-en-configure-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'configure_stacked_tax_rules' as const,
        rescueReason: 'configure_stacked_tax_rules',
        paramsPartial: { operation: entry.operation },
      },
    })),
    ...EXPLAIN_STACKED_TAX_PROMPTS.filter(
      (entry) =>
        entry.id === 'combined-gst-pst-rate' ||
        entry.id === 'federal-state-breakdown',
    ).map((entry) => ({
      id: `stacked-tax-en-explain-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_stacked_tax' as const,
        rescueReason: 'explain_stacked_tax',
      },
    })),
    ...MULTILINGUAL_STACKED_TAX_EVAL_SCENARIOS.map(
      stackedTaxScenarioToEvalCase,
    ),
  ];

/** Map Stripe tax charge explain prompts (ai-cmd-tax-9) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_STRIPE_TAX_CHARGE_CASES: AiCommandEvalCase[] =
  EXPLAIN_STRIPE_TAX_CHARGE_PROMPTS.map((entry) => ({
    id: `explain-stripe-tax-charge-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_stripe_tax_charge',
      rescueReason: 'explain_stripe_tax_charge',
    },
  }));

/** Map booking tax metadata lookup prompts (ai-cmd-tax-10) to eval golden cases. */
export const AI_COMMAND_EVAL_LOOKUP_BOOKING_TAX_METADATA_CASES: AiCommandEvalCase[] =
  LOOKUP_BOOKING_TAX_METADATA_PROMPTS.map((entry) => ({
    id: `lookup-booking-tax-metadata-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'lookup_booking_tax_metadata',
      rescueReason: 'lookup_booking_tax_metadata',
    },
  }));

/** Map provider appointment tax explain prompts (ai-cmd-tax-11) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_APPOINTMENT_TAX_CASES: AiCommandEvalCase[] =
  EXPLAIN_APPOINTMENT_TAX_PROMPTS.map((entry) => ({
    id: `explain-appointment-tax-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_appointment_tax',
      rescueReason: 'explain_appointment_tax',
    },
  }));

/** Map staff booking tax quote prompts (ai-cmd-tax-12) to eval golden cases. */
export const AI_COMMAND_EVAL_QUOTE_STAFF_BOOKING_TAX_CASES: AiCommandEvalCase[] =
  QUOTE_STAFF_BOOKING_TAX_PROMPTS.map((entry) => ({
    id: `quote-staff-booking-tax-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'quote_staff_booking_tax',
      rescueReason: 'quote_staff_booking_tax',
    },
  }));

/** Map customer tax paid summary prompts (ai-cmd-tax-13) to eval golden cases. */
export const AI_COMMAND_EVAL_SUMMARIZE_CUSTOMER_TAX_PAID_CASES: AiCommandEvalCase[] =
  SUMMARIZE_CUSTOMER_TAX_PAID_PROMPTS.map((entry) => ({
    id: `summarize-customer-tax-paid-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'summarize_customer_tax_paid',
      rescueReason: 'summarize_customer_tax_paid',
    },
  }));

/** Map consumer app checkout tax explain prompts (ai-cmd-tax-14) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_TAX_CASES: AiCommandEvalCase[] =
  EXPLAIN_CONSUMER_CHECKOUT_TAX_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if (entry.aspect) paramsPartial.aspect = entry.aspect;
    return {
      id: `consumer-checkout-tax-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_consumer_checkout_tax',
        rescueReason: 'explain_consumer_checkout_tax',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

export function taxDisplayScenarioToEvalCase(
  scenario: TaxDisplayEvalScenario,
): AiCommandEvalCase {
  const paramsPartial: Record<string, unknown> = {
    ...(scenario.paramsPartial ?? {}),
  };
  if (scenario.aspect) paramsPartial.aspect = scenario.aspect;
  return {
    id: `tax-display-en-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason ?? scenario.expectedAction,
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    },
  };
}

/** EN tax display surface disambiguation (ai-cmd-tax-15). */
export const AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES: AiCommandEvalCase[] =
  EN_TAX_DISPLAY_EVAL_SCENARIOS.map(taxDisplayScenarioToEvalCase);

/** Map privacy retention configure prompts (ai-cmd-compliance-1) to eval golden cases. */
export const AI_COMMAND_EVAL_CONFIGURE_PRIVACY_RETENTION_CASES: AiCommandEvalCase[] =
  CONFIGURE_PRIVACY_RETENTION_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('customerPiiDays' in entry && entry.customerPiiDays != null) {
      paramsPartial.customerPiiDays = entry.customerPiiDays;
    }
    if ('bookingHistoryDays' in entry && entry.bookingHistoryDays != null) {
      paramsPartial.bookingHistoryDays = entry.bookingHistoryDays;
    }
    if ('auditLogsDays' in entry && entry.auditLogsDays != null) {
      paramsPartial.auditLogsDays = entry.auditLogsDays;
    }
    if ('cookieBannerEnabled' in entry && entry.cookieBannerEnabled != null) {
      paramsPartial.cookieBannerEnabled = entry.cookieBannerEnabled;
    }
    return {
      id: `configure-privacy-retention-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'configure_privacy_retention',
        rescueReason: 'configure_privacy_retention',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map HIPAA mode enable prompts (ai-cmd-compliance-3) to eval golden cases. */
export const AI_COMMAND_EVAL_ENABLE_HIPAA_MODE_CASES: AiCommandEvalCase[] =
  ENABLE_HIPAA_MODE_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('enabled' in entry && entry.enabled != null) {
      paramsPartial.enabled = entry.enabled;
    }
    if (
      'sessionTimeoutMinutes' in entry &&
      entry.sessionTimeoutMinutes != null
    ) {
      paramsPartial.sessionTimeoutMinutes = entry.sessionTimeoutMinutes;
    }
    return {
      id: `enable-hipaa-mode-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'enable_hipaa_mode',
        rescueReason: 'enable_hipaa_mode',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map list_sub_processors prompts (ai-cmd-compliance-17) to eval golden cases. */
export const AI_COMMAND_EVAL_LIST_SUB_PROCESSORS_CASES: AiCommandEvalCase[] =
  LIST_SUB_PROCESSORS_PROMPTS.map((entry) => ({
    id: `list-sub-processors-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'list_sub_processors',
      rescueReason: 'list_sub_processors',
      ...('article28' in entry && entry.article28 != null
        ? { paramsPartial: { article28: entry.article28 } }
        : {}),
    },
  }));

/** Map explain_gdpr_checklist prompts (ai-cmd-compliance-18) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_GDPR_CHECKLIST_CASES: AiCommandEvalCase[] =
  EXPLAIN_GDPR_CHECKLIST_PROMPTS.map((entry) => ({
    id: `explain-gdpr-checklist-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_gdpr_checklist',
      rescueReason: 'explain_gdpr_checklist',
      paramsPartial: { aspect: entry.aspect },
    },
  }));

/** Map compliance status explain prompts (ai-cmd-compliance-4) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_COMPLIANCE_STATUS_CASES: AiCommandEvalCase[] =
  EXPLAIN_COMPLIANCE_STATUS_PROMPTS.map((entry) => ({
    id: `explain-compliance-status-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_compliance_status',
      rescueReason: 'explain_compliance_status',
      paramsPartial: { aspect: entry.aspect },
    },
  }));

/** Map admin customer forget prompts (ai-cmd-compliance-5) to eval golden cases. */
export const AI_COMMAND_EVAL_ADMIN_DELETE_CUSTOMER_DATA_CASES: AiCommandEvalCase[] =
  ADMIN_DELETE_CUSTOMER_DATA_PROMPTS.filter(
    (entry) => 'customerName' in entry && entry.customerName != null,
  ).map((entry) => ({
    id: `admin-delete-customer-data-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'admin_delete_customer_data',
      rescueReason: 'admin_delete_customer_data',
      paramsPartial: { customerName: entry.customerName },
    },
  }));

/** Map explain_data_rights prompts (ai-cmd-compliance-7) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_DATA_RIGHTS_CASES: AiCommandEvalCase[] =
  EXPLAIN_DATA_RIGHTS_PROMPTS.map((entry) => ({
    id: `explain-data-rights-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_data_rights',
      rescueReason: 'explain_data_rights',
      paramsPartial: { aspect: entry.aspect },
    },
  }));

/** Map explain_phi_encryption_status prompts (ai-cmd-compliance-11) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PHI_ENCRYPTION_STATUS_CASES: AiCommandEvalCase[] =
  EXPLAIN_PHI_ENCRYPTION_STATUS_PROMPTS.map((entry) => ({
    id: `explain-phi-encryption-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_phi_encryption_status',
      rescueReason: 'explain_phi_encryption_status',
      ...('fieldName' in entry && entry.fieldName != null
        ? { paramsPartial: { fieldName: entry.fieldName } }
        : {}),
    },
  }));

/** Map explain_minimum_necessary_phi_access prompts (ai-cmd-compliance-12) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_CASES: AiCommandEvalCase[] =
  EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_PROMPTS.map((entry) => ({
    id: `explain-minimum-necessary-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_minimum_necessary_phi_access',
      rescueReason: 'explain_minimum_necessary_phi_access',
      paramsPartial: { aspect: entry.aspect },
    },
  }));

/** Map explain_hipaa_session_timeout prompts (ai-cmd-compliance-13) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_HIPAA_SESSION_TIMEOUT_CASES: AiCommandEvalCase[] =
  EXPLAIN_HIPAA_SESSION_TIMEOUT_PROMPTS.map((entry) => ({
    id: `explain-hipaa-session-timeout-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_hipaa_session_timeout',
      rescueReason: 'explain_hipaa_session_timeout',
      paramsPartial: { personalLogout: entry.personalLogout },
    },
  }));

/** Map accept_hipaa_baa prompts (ai-cmd-compliance-16) to eval golden cases. */
export const AI_COMMAND_EVAL_ACCEPT_HIPAA_BAA_CASES: AiCommandEvalCase[] =
  ACCEPT_HIPAA_BAA_PROMPTS.map((entry) => ({
    id: `accept-hipaa-baa-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'accept_hipaa_baa',
      rescueReason: 'accept_hipaa_baa',
      ...('enableHipaa' in entry && entry.enableHipaa != null
        ? { paramsPartial: { enableHipaa: entry.enableHipaa } }
        : {}),
    },
  }));

/** Map configure_hipaa_session_timeout prompts (ai-cmd-compliance-14) to eval golden cases. */
export const AI_COMMAND_EVAL_CONFIGURE_HIPAA_SESSION_TIMEOUT_CASES: AiCommandEvalCase[] =
  CONFIGURE_HIPAA_SESSION_TIMEOUT_PROMPTS.map((entry) => ({
    id: `configure-hipaa-session-timeout-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'configure_hipaa_session_timeout',
      rescueReason: 'configure_hipaa_session_timeout',
      paramsPartial: { sessionTimeoutMinutes: entry.sessionTimeoutMinutes },
    },
  }));

/** Map PHI guard block/redact prompts (ai-cmd-compliance-15) to eval golden cases. */
export const AI_COMMAND_EVAL_PHI_GUARD_CASES: AiCommandEvalCase[] = [
  ...PHI_GUARD_BLOCK_PROMPTS.map((entry) => ({
    id: `phi-guard-block-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      phiGuard: {
        blocked: true,
        reason: entry.reason,
        matchedFields: [...entry.matchedFields],
      },
    },
  })),
  ...PHI_GUARD_ALLOW_PROMPTS.map((entry) => ({
    id: `phi-guard-allow-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      phiGuard: {
        blocked: false,
      },
    },
  })),
  ...PHI_GUARD_REDACT_PROMPTS.map((entry) => ({
    id: `phi-guard-redact-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      phiGuard: {
        blocked: true,
        redactedSubstring: entry.redactedSubstring,
      },
    },
  })),
];

/** Map list_breach_incidents prompts (ai-cmd-compliance-9) to eval golden cases. */
export const AI_COMMAND_EVAL_LIST_BREACH_INCIDENTS_CASES: AiCommandEvalCase[] =
  LIST_BREACH_INCIDENTS_PROMPTS.map((entry) => ({
    id: `list-breach-incidents-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'list_breach_incidents',
      rescueReason: 'list_breach_incidents',
      paramsPartial: { aspect: entry.aspect },
    },
  }));

/** Map view_phi_access_audit prompts (ai-cmd-compliance-10) to eval golden cases. */
export const AI_COMMAND_EVAL_VIEW_PHI_ACCESS_AUDIT_CASES: AiCommandEvalCase[] =
  VIEW_PHI_ACCESS_AUDIT_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('daysBack' in entry && entry.daysBack != null) {
      paramsPartial.daysBack = entry.daysBack;
    }
    if ('fieldName' in entry && entry.fieldName != null) {
      paramsPartial.fieldName = entry.fieldName;
    }
    return {
      id: `view-phi-access-audit-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'view_phi_access_audit',
        rescueReason: 'view_phi_access_audit',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map report_data_breach prompts (ai-cmd-compliance-8) to eval golden cases. */
export const AI_COMMAND_EVAL_REPORT_DATA_BREACH_CASES: AiCommandEvalCase[] =
  REPORT_DATA_BREACH_PROMPTS.map((entry) => ({
    id: `report-data-breach-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'report_data_breach',
      rescueReason: 'report_data_breach',
      ...('affectedCustomerCount' in entry &&
      entry.affectedCustomerCount != null
        ? {
            paramsPartial: {
              affectedCustomerCount: entry.affectedCustomerCount,
            },
          }
        : {}),
    },
  }));

/** Map send_breach_notification prompts (ai-cmd-compliance-19) to eval golden cases. */
export const AI_COMMAND_EVAL_SEND_BREACH_NOTIFICATION_CASES: AiCommandEvalCase[] =
  SEND_BREACH_NOTIFICATION_PROMPTS.map((entry) => ({
    id: `send-breach-notification-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'send_breach_notification',
      rescueReason: 'send_breach_notification',
      paramsPartial: { incidentRef: entry.incidentRef },
    },
  }));

/** Map open_compliance_dashboard prompts (ai-cmd-compliance-21) to eval golden cases. */
export const AI_COMMAND_EVAL_OPEN_COMPLIANCE_DASHBOARD_CASES: AiCommandEvalCase[] =
  OPEN_COMPLIANCE_DASHBOARD_PROMPTS.map((entry) => ({
    id: `open-compliance-dashboard-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'open_compliance_dashboard',
      rescueReason: 'open_compliance_dashboard',
      paramsPartial: { panel: entry.panel },
    },
  }));

/** Map explain_provider_session_timeout prompts (ai-cmd-compliance-20) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SESSION_TIMEOUT_CASES: AiCommandEvalCase[] =
  EXPLAIN_PROVIDER_SESSION_TIMEOUT_PROMPTS.map((entry) => ({
    id: `explain-provider-session-timeout-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_provider_session_timeout',
      rescueReason: 'explain_provider_session_timeout',
    },
  }));

export function complianceScenarioToEvalCase(
  scenario: BusinessComplianceEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `business-compliance-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

/** Compliance configuration phrasing for EN/HY/RU (ai-cmd-compliance-6). */
export const AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...CONFIGURE_PRIVACY_RETENTION_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('customerPiiDays' in entry && entry.customerPiiDays != null) {
        paramsPartial.customerPiiDays = entry.customerPiiDays;
      }
      if ('bookingHistoryDays' in entry && entry.bookingHistoryDays != null) {
        paramsPartial.bookingHistoryDays = entry.bookingHistoryDays;
      }
      if ('auditLogsDays' in entry && entry.auditLogsDays != null) {
        paramsPartial.auditLogsDays = entry.auditLogsDays;
      }
      if ('cookieBannerEnabled' in entry && entry.cookieBannerEnabled != null) {
        paramsPartial.cookieBannerEnabled = entry.cookieBannerEnabled;
      }
      return complianceScenarioToEvalCase({
        id: `en-privacy-${entry.id}`,
        locale: 'en',
        prompt: entry.prompt,
        expectedAction: 'configure_privacy_retention',
        rescueReason: 'configure_privacy_retention',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      });
    }),
    ...CONFIGURE_GRANULAR_CONSENT_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('requireAiProcessing' in entry && entry.requireAiProcessing != null) {
        paramsPartial.requireAiProcessing = entry.requireAiProcessing;
      }
      if (
        'requireThirdPartyIntegrations' in entry &&
        entry.requireThirdPartyIntegrations != null
      ) {
        paramsPartial.requireThirdPartyIntegrations =
          entry.requireThirdPartyIntegrations;
      }
      return complianceScenarioToEvalCase({
        id: `en-granular-${entry.id}`,
        locale: 'en',
        prompt: entry.prompt,
        expectedAction: 'configure_granular_consent',
        rescueReason: 'configure_granular_consent',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      });
    }),
    ...ENABLE_HIPAA_MODE_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('enabled' in entry && entry.enabled != null) {
        paramsPartial.enabled = entry.enabled;
      }
      if (
        'sessionTimeoutMinutes' in entry &&
        entry.sessionTimeoutMinutes != null
      ) {
        paramsPartial.sessionTimeoutMinutes = entry.sessionTimeoutMinutes;
      }
      return complianceScenarioToEvalCase({
        id: `en-hipaa-${entry.id}`,
        locale: 'en',
        prompt: entry.prompt,
        expectedAction: 'enable_hipaa_mode',
        rescueReason: 'enable_hipaa_mode',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      });
    }),
    ...EXPLAIN_COMPLIANCE_STATUS_PROMPTS.map((entry) =>
      complianceScenarioToEvalCase({
        id: `en-explain-${entry.id}`,
        locale: 'en',
        prompt: entry.prompt,
        expectedAction: 'explain_compliance_status',
        rescueReason: 'explain_compliance_status',
        paramsPartial: { aspect: entry.aspect },
      }),
    ),
    ...ADMIN_DELETE_CUSTOMER_DATA_PROMPTS.filter(
      (entry) => 'customerName' in entry && entry.customerName != null,
    ).map((entry) =>
      complianceScenarioToEvalCase({
        id: `en-admin-delete-${entry.id}`,
        locale: 'en',
        prompt: entry.prompt,
        expectedAction: 'admin_delete_customer_data',
        rescueReason: 'admin_delete_customer_data',
        paramsPartial: { customerName: entry.customerName },
      }),
    ),
    ...MULTILINGUAL_BUSINESS_COMPLIANCE_EVAL_SCENARIOS.map(
      complianceScenarioToEvalCase,
    ),
  ];

/** Map granular consent configure prompts (ai-cmd-compliance-2) to eval golden cases. */
export const AI_COMMAND_EVAL_CONFIGURE_GRANULAR_CONSENT_CASES: AiCommandEvalCase[] =
  CONFIGURE_GRANULAR_CONSENT_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('requireAiProcessing' in entry && entry.requireAiProcessing != null) {
      paramsPartial.requireAiProcessing = entry.requireAiProcessing;
    }
    if (
      'requireThirdPartyIntegrations' in entry &&
      entry.requireThirdPartyIntegrations != null
    ) {
      paramsPartial.requireThirdPartyIntegrations =
        entry.requireThirdPartyIntegrations;
    }
    return {
      id: `configure-granular-consent-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'configure_granular_consent',
        rescueReason: 'configure_granular_consent',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map stacked tax explain prompts (ai-cmd-tax-7) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_STACKED_TAX_CASES: AiCommandEvalCase[] =
  EXPLAIN_STACKED_TAX_PROMPTS.map((entry) => ({
    id: `explain-stacked-tax-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_stacked_tax',
      rescueReason: 'explain_stacked_tax',
    },
  }));

/** Map business tax explain prompts (ai-cmd-tax-3) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_BUSINESS_TAX_CASES: AiCommandEvalCase[] =
  EXPLAIN_BUSINESS_TAX_PROMPTS.map((entry) => ({
    id: `explain-business-tax-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_business_tax',
      rescueReason: 'explain_business_tax',
    },
  }));

/** Map business tax configure prompts (ai-cmd-tax-1) to eval golden cases. */
export const AI_COMMAND_EVAL_CONFIGURE_BUSINESS_TAX_CASES: AiCommandEvalCase[] =
  CONFIGURE_BUSINESS_TAX_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('enabled' in entry && entry.enabled !== undefined) {
      paramsPartial.enabled = entry.enabled;
    }
    if ('rate' in entry && entry.rate !== undefined) {
      paramsPartial.rate = entry.rate;
    }
    if ('name' in entry && entry.name !== undefined) {
      paramsPartial.name = entry.name;
    }
    if ('model' in entry && entry.model !== undefined) {
      paramsPartial.model = entry.model;
    }
    return {
      id: `configure-business-tax-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'configure_business_tax',
        rescueReason: 'configure_business_tax',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map booking-page date format prompts (ai-cmd-fmt-4) to eval golden cases. */
export const AI_COMMAND_EVAL_BOOKING_DATE_FORMAT_CASES: AiCommandEvalCase[] =
  EXPLAIN_BOOKING_DATE_FORMAT_PROMPTS.map((entry) => ({
    id: `explain-booking-date-format-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? ('hy' as const)
      : entry.id.startsWith('ru-')
        ? ('ru' as const)
        : ('en' as const),
    expect: {
      rescuedAction: 'explain_booking_date_format',
      rescueReason: 'explain_booking_date_format',
    },
  }));

export function recommendationAnalyticsScenarioToEvalCase(
  scenario: RecommendationAnalyticsEvalScenario,
): AiCommandEvalCase {
  const paramsPartial: Record<string, unknown> = {
    ...(scenario.paramsPartial ?? {}),
    ...(scenario.aspect ? { aspect: scenario.aspect } : {}),
  };
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `recommendation-analytics-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

/** Recommendation analytics + performance phrasing for EN/HY/RU (ai-cmd-rec-10). */
export const AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishRecommendationAnalyticsEvalScenarios().map(
      recommendationAnalyticsScenarioToEvalCase,
    ),
    ...MULTILINGUAL_RECOMMENDATION_ANALYTICS_EVAL_SCENARIOS.map(
      recommendationAnalyticsScenarioToEvalCase,
    ),
  ];

/** Map recommendation performance summary prompts (ai-cmd-rec-9) to eval golden cases. */
export const AI_COMMAND_EVAL_SUMMARIZE_RECOMMENDATION_PERFORMANCE_CASES: AiCommandEvalCase[] =
  SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    if ('surface' in entry && entry.surface)
      paramsPartial.surface = entry.surface;
    if ('daysAhead' in entry && entry.daysAhead) {
      paramsPartial.daysAhead = entry.daysAhead;
    }
    return {
      id: `summarize-recommendation-performance-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'summarize_recommendation_performance',
        rescueReason: 'summarize_recommendation_performance',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map recommendation analytics explain prompts (ai-cmd-rec-8) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_ANALYTICS_CASES: AiCommandEvalCase[] =
  EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    if ('surface' in entry && entry.surface)
      paramsPartial.surface = entry.surface;
    if ('daysAhead' in entry && entry.daysAhead) {
      paramsPartial.daysAhead = entry.daysAhead;
    }
    return {
      id: `explain-recommendation-analytics-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'explain_recommendation_analytics',
        rescueReason: 'explain_recommendation_analytics',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map recommendation setup explain prompts (ai-cmd-rec-3) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_SETUP_CASES: AiCommandEvalCase[] =
  EXPLAIN_RECOMMENDATION_SETUP_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('categoryName' in entry && entry.categoryName) {
      paramsPartial.categoryName = entry.categoryName;
    }
    return {
      id: `explain-recommendation-setup-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'explain_recommendation_setup',
        rescueReason: 'explain_recommendation_setup',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map post-checkout recommendation link prompts (ai-cmd-rec-2) to eval golden cases. */
export const AI_COMMAND_EVAL_LINK_RECOMMENDED_PRODUCTS_CASES: AiCommandEvalCase[] =
  LINK_RECOMMENDED_PRODUCTS_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('categoryName' in entry && entry.categoryName) {
      paramsPartial.categoryName = entry.categoryName;
    }
    return {
      id: `link-recommended-products-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'link_recommended_products',
        rescueReason: 'link_recommended_products',
        paramsPartial,
      },
    };
  });

export function recommendationProductScenarioToEvalCase(
  scenario: RecommendationProductEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `recommendation-product-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishRecommendationProductEvalScenarios(): RecommendationProductEvalScenario[] {
  const scenarios: RecommendationProductEvalScenario[] = [];

  for (const entry of CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS) {
    const paramsPartial: Record<string, unknown> = {};
    if (entry.productName) paramsPartial.productName = entry.productName;
    if ('imageUrl' in entry && entry.imageUrl) {
      paramsPartial.imageUrl = entry.imageUrl;
    }
    if ('externalLink' in entry && entry.externalLink) {
      paramsPartial.externalLink = entry.externalLink;
    }
    if ('description' in entry && entry.description) {
      paramsPartial.description = entry.description;
    }
    if ('retailPrice' in entry && entry.retailPrice !== undefined) {
      paramsPartial.retailPrice = entry.retailPrice;
    }
    if ('wantsImage' in entry && entry.wantsImage) {
      paramsPartial.wantsImage = true;
    }
    if ('wantsLink' in entry && entry.wantsLink) {
      paramsPartial.wantsLink = true;
    }
    if ('isUpdate' in entry && entry.isUpdate) {
      paramsPartial.isUpdate = true;
    }
    scenarios.push({
      id: `en-configure-${entry.id}`,
      locale: 'en',
      prompt: entry.prompt,
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    });
  }

  for (const entry of LINK_RECOMMENDED_PRODUCTS_PROMPTS) {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('categoryName' in entry && entry.categoryName) {
      paramsPartial.categoryName = entry.categoryName;
    }
    scenarios.push({
      id: `en-link-${entry.id}`,
      locale: 'en',
      prompt: entry.prompt,
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    });
  }

  for (const entry of EXPLAIN_RECOMMENDATION_SETUP_PROMPTS) {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('categoryName' in entry && entry.categoryName) {
      paramsPartial.categoryName = entry.categoryName;
    }
    scenarios.push({
      id: `en-explain-${entry.id}`,
      locale: 'en',
      prompt: entry.prompt,
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    });
  }

  return scenarios;
}

/** Post-checkout recommendation configure/link/explain phrasing for EN/HY/RU (ai-cmd-rec-4). */
export const AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishRecommendationProductEvalScenarios().map(
      recommendationProductScenarioToEvalCase,
    ),
    ...MULTILINGUAL_RECOMMENDATION_PRODUCT_EVAL_SCENARIOS.map(
      recommendationProductScenarioToEvalCase,
    ),
  ];

/** Map post-checkout recommendation product prompts (ai-cmd-rec-1) to eval golden cases. */
export const AI_COMMAND_EVAL_CONFIGURE_RECOMMENDATION_PRODUCT_CASES: AiCommandEvalCase[] =
  CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if (entry.productName) paramsPartial.productName = entry.productName;
    if ('imageUrl' in entry && entry.imageUrl) {
      paramsPartial.imageUrl = entry.imageUrl;
    }
    if ('externalLink' in entry && entry.externalLink) {
      paramsPartial.externalLink = entry.externalLink;
    }
    if ('description' in entry && entry.description) {
      paramsPartial.description = entry.description;
    }
    if ('retailPrice' in entry && entry.retailPrice !== undefined) {
      paramsPartial.retailPrice = entry.retailPrice;
    }
    if ('wantsImage' in entry && entry.wantsImage) {
      paramsPartial.wantsImage = true;
    }
    if ('wantsLink' in entry && entry.wantsLink) {
      paramsPartial.wantsLink = true;
    }
    if ('isUpdate' in entry && entry.isUpdate) {
      paramsPartial.isUpdate = true;
    }
    return {
      id: `configure-recommendation-product-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'configure_recommendation_product',
        rescueReason: 'configure_recommendation_product',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

function isEnglishOnlyPrompt(prompt: string): boolean {
  return !/[\u0530-\u058F\u0400-\u04FF]/.test(prompt);
}

/** Map package localized-name scenarios (ai-cmd-lang-8) to eval golden cases. */
export function packageLocalizedNamesScenarioToEvalCase(
  scenario: PackageLocalizedNamesEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `package-localized-names-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishPackageLocalizedNamesEvalScenarios(): PackageLocalizedNamesEvalScenario[] {
  return [
    ...CONFIGURE_PACKAGE_LOCALIZED_NAMES_PROMPTS.filter(
      (entry) => !entry.id.startsWith('hy-') && !entry.id.startsWith('ru-'),
    ).map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'configure_package_localized_names' as const,
      rescueReason: 'configure_package_localized_names',
      paramsPartial: { operation: entry.operation },
    })),
    ...EXPLAIN_PACKAGE_DISPLAY_NAME_PROMPTS.filter((entry) =>
      isEnglishOnlyPrompt(entry.prompt),
    ).map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if (entry.packageName) paramsPartial.packageName = entry.packageName;
      if ('locale' in entry && entry.locale)
        paramsPartial.locale = entry.locale;
      return {
        id: `en-${entry.id}`,
        locale: 'en' as const,
        prompt: entry.prompt,
        expectedAction: 'explain_package_display_name' as const,
        rescueReason: 'explain_package_display_name',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
  ];
}

/** Configure + explain package localized-name prompts for EN/HY/RU (ai-cmd-lang-8). */
export const AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CONFIGURE_EXPLAIN_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishPackageLocalizedNamesEvalScenarios().map(
      packageLocalizedNamesScenarioToEvalCase,
    ),
    ...MULTILINGUAL_PACKAGE_LOCALIZED_NAMES_EVAL_SCENARIOS.map(
      packageLocalizedNamesScenarioToEvalCase,
    ),
  ];

export function tourServiceScenarioToEvalCase(
  scenario: TourServiceEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `tour-service-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishTourServiceEvalScenarios(): TourServiceEvalScenario[] {
  return [
    ...CONFIGURE_TOUR_SERVICE_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('serviceName' in entry && entry.serviceName) {
        paramsPartial.serviceName = entry.serviceName;
      }
      if ('enableTour' in entry && entry.enableTour) {
        paramsPartial.enableTour = true;
      }
      if ('maxGroupSize' in entry && entry.maxGroupSize !== undefined) {
        paramsPartial.maxGroupSize = entry.maxGroupSize;
      }
      if ('difficulty' in entry && entry.difficulty) {
        paramsPartial.difficulty = entry.difficulty;
      }
      return {
        id: `en-configure-${entry.id}`,
        locale: 'en' as const,
        prompt: entry.prompt,
        expectedAction: 'configure_tour_service' as const,
        rescueReason: 'configure_tour_service',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
    ...EXPLAIN_TOUR_SERVICES_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('serviceName' in entry && entry.serviceName) {
        paramsPartial.serviceName = entry.serviceName;
      }
      if ('daysAhead' in entry && entry.daysAhead) {
        paramsPartial.daysAhead = entry.daysAhead;
      }
      return {
        id: `en-explain-${entry.id}`,
        locale: 'en' as const,
        prompt: entry.prompt,
        expectedAction: 'explain_tour_services' as const,
        rescueReason: 'explain_tour_services',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
  ];
}

/** Configure + explain tour service prompts for EN/HY/RU (ai-cmd-tour-4). */
export const AI_COMMAND_EVAL_TOUR_SERVICE_CONFIGURE_EXPLAIN_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishTourServiceEvalScenarios().map(
      tourServiceScenarioToEvalCase,
    ),
    ...MULTILINGUAL_TOUR_SERVICE_EVAL_SCENARIOS.map(
      tourServiceScenarioToEvalCase,
    ),
  ];

/** Map tour service explain prompts (ai-cmd-tour-2) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_TOUR_SERVICES_CASES: AiCommandEvalCase[] =
  EXPLAIN_TOUR_SERVICES_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('daysAhead' in entry && entry.daysAhead) {
      paramsPartial.daysAhead = entry.daysAhead;
    }
    return {
      id: `explain-tour-services-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'explain_tour_services',
        rescueReason: 'explain_tour_services',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map tour playbook apply prompts (ai-cmd-tour-3) to eval golden cases. */
export const AI_COMMAND_EVAL_APPLY_TOUR_PLAYBOOK_CASES: AiCommandEvalCase[] =
  APPLY_TOUR_PLAYBOOK_PROMPTS.map((entry) => ({
    id: `apply-tour-playbook-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en',
    expect: {
      rescuedAction: 'apply_tour_playbook',
      rescueReason: 'apply_tour_playbook',
    },
  }));

/** Map tour service configuration prompts (ai-cmd-tour-1) to eval golden cases. */
export const AI_COMMAND_EVAL_TOUR_SERVICE_CASES: AiCommandEvalCase[] =
  CONFIGURE_TOUR_SERVICE_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('enableTour' in entry && entry.enableTour) {
      paramsPartial.enableTour = true;
    }
    if ('maxGroupSize' in entry && entry.maxGroupSize !== undefined) {
      paramsPartial.maxGroupSize = entry.maxGroupSize;
    }
    if ('difficulty' in entry && entry.difficulty) {
      paramsPartial.difficulty = entry.difficulty;
    }
    return {
      id: `tour-service-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'configure_tour_service',
        rescueReason: 'configure_tour_service',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Configure + explain clinic catalog prompts for EN/HY/RU (ai-cmd-clinic-4). */
export function clinicServiceScenarioToEvalCase(
  scenario: ClinicServiceEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `clinic-service-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishClinicServiceEvalScenarios(): ClinicServiceEvalScenario[] {
  return [
    ...CONFIGURE_CLINIC_SERVICE_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('serviceName' in entry && entry.serviceName) {
        paramsPartial.serviceName = entry.serviceName;
      }
      if ('serviceType' in entry && entry.serviceType) {
        paramsPartial.serviceType = entry.serviceType;
      }
      if ('requiresFasting' in entry && entry.requiresFasting !== undefined) {
        paramsPartial.requiresFasting = entry.requiresFasting;
      }
      if ('preparationNotes' in entry && entry.preparationNotes) {
        paramsPartial.preparationNotes = entry.preparationNotes;
      }
      return {
        id: `en-configure-${entry.id}`,
        locale: 'en' as const,
        prompt: entry.prompt,
        expectedAction: 'configure_clinic_service' as const,
        rescueReason: 'configure_clinic_service',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
    ...EXPLAIN_CLINIC_SERVICES_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('serviceName' in entry && entry.serviceName) {
        paramsPartial.serviceName = entry.serviceName;
      }
      return {
        id: `en-explain-${entry.id}`,
        locale: 'en' as const,
        prompt: entry.prompt,
        expectedAction: 'explain_clinic_services' as const,
        rescueReason: 'explain_clinic_services',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      };
    }),
  ];
}

export const AI_COMMAND_EVAL_CLINIC_SERVICE_CONFIGURE_EXPLAIN_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishClinicServiceEvalScenarios().map(
      clinicServiceScenarioToEvalCase,
    ),
    ...MULTILINGUAL_CLINIC_SERVICE_EVAL_SCENARIOS.map(
      clinicServiceScenarioToEvalCase,
    ),
  ];

export const AI_COMMAND_EVAL_EXPLAIN_CLINIC_SERVICES_CASES: AiCommandEvalCase[] =
  EXPLAIN_CLINIC_SERVICES_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    return {
      id: `explain-clinic-services-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'explain_clinic_services',
        rescueReason: 'explain_clinic_services',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

export const AI_COMMAND_EVAL_APPLY_CLINIC_PLAYBOOK_CASES: AiCommandEvalCase[] =
  APPLY_CLINIC_PLAYBOOK_PROMPTS.map((entry) => ({
    id: `apply-clinic-playbook-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en',
    expect: {
      rescuedAction: 'apply_clinic_playbook',
      rescueReason: 'apply_clinic_playbook',
    },
  }));

export const AI_COMMAND_EVAL_CLINIC_SERVICE_CASES: AiCommandEvalCase[] =
  CONFIGURE_CLINIC_SERVICE_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('serviceType' in entry && entry.serviceType) {
      paramsPartial.serviceType = entry.serviceType;
    }
    if ('requiresFasting' in entry && entry.requiresFasting !== undefined) {
      paramsPartial.requiresFasting = entry.requiresFasting;
    }
    if ('preparationNotes' in entry && entry.preparationNotes) {
      paramsPartial.preparationNotes = entry.preparationNotes;
    }
    return {
      id: `clinic-service-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'configure_clinic_service',
        rescueReason: 'configure_clinic_service',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map package localized name configuration prompts (ai-cmd-lang-6) to eval golden cases. */
export const AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CASES: AiCommandEvalCase[] =
  CONFIGURE_PACKAGE_LOCALIZED_NAMES_PROMPTS.map((entry) => ({
    id: `package-localized-names-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
      paramsPartial: {
        operation: entry.operation,
      },
    },
  }));

/** Map package public display name explain prompts (ai-cmd-lang-7) to eval golden cases. */
export const AI_COMMAND_EVAL_PACKAGE_DISPLAY_NAME_CASES: AiCommandEvalCase[] =
  EXPLAIN_PACKAGE_DISPLAY_NAME_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if (entry.packageName) paramsPartial.packageName = entry.packageName;
    if ('locale' in entry && entry.locale) paramsPartial.locale = entry.locale;
    return {
      id: `package-display-name-${entry.id}`,
      prompt: entry.prompt,
      locale:
        entry.id.startsWith('hy-') || entry.id.includes('-hy-')
          ? 'hy'
          : entry.id.startsWith('ru-') || entry.id.includes('-ru-')
            ? 'ru'
            : 'en',
      expect: {
        rescuedAction: 'explain_package_display_name',
        rescueReason: 'explain_package_display_name',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map booking language visibility prompts (ai-cmd-lang-5) to eval golden cases. */
export const AI_COMMAND_EVAL_BOOKING_LANGUAGES_CASES: AiCommandEvalCase[] =
  EXPLAIN_BOOKING_LANGUAGES_PROMPTS.map((entry) => ({
    id: `booking-languages-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_booking_languages',
      rescueReason: 'explain_booking_languages',
    },
  }));

/** Map tour booking explain prompts (ai-cmd-tour-5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_CASES: AiCommandEvalCase[] =
  EXPLAIN_TOUR_BOOKING_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    return {
      id: `tour-booking-${entry.id}`,
      prompt: entry.prompt,
      locale:
        entry.id.includes('-hy-') || entry.id.startsWith('hy-')
          ? 'hy'
          : entry.id.includes('-ru-') || entry.id.startsWith('ru-')
            ? 'ru'
            : 'en',
      expect: {
        rescuedAction: 'explain_tour_booking',
        rescueReason: 'explain_tour_booking',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map upcoming tour departures list prompts (ai-cmd-tour-8) to eval golden cases. */
export const AI_COMMAND_EVAL_LIST_UPCOMING_TOUR_DEPARTURES_CASES: AiCommandEvalCase[] =
  LIST_UPCOMING_TOUR_DEPARTURES_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('daysAhead' in entry && entry.daysAhead) {
      paramsPartial.daysAhead = entry.daysAhead;
    }
    return {
      id: `tour-departures-${entry.id}`,
      prompt: entry.prompt,
      locale: entry.id.startsWith('ru-')
        ? 'ru'
        : entry.id.startsWith('hy-')
          ? 'hy'
          : 'en',
      expect: {
        rescuedAction: 'list_upcoming_tour_departures',
        rescueReason: 'list_upcoming_tour_departures',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map tour calendar span explain prompts (ai-cmd-tour-11) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_TOUR_CALENDAR_SPAN_CASES: AiCommandEvalCase[] =
  EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    return {
      id: `tour-calendar-span-${entry.id}`,
      prompt: entry.prompt,
      locale: entry.id.startsWith('ru-')
        ? 'ru'
        : entry.id.startsWith('hy-')
          ? 'hy'
          : 'en',
      expect: {
        rescuedAction: 'explain_tour_calendar_span',
        rescueReason: 'explain_tour_calendar_span',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

export function tourCalendarScenarioToEvalCase(
  scenario: TourCalendarEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `tour-calendar-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

const ENGLISH_TOUR_CALENDAR_SPAN_EVAL_PROMPT_IDS = [
  'multi-day-span-general',
  'service-colors',
  'clipped-week',
  'stacked-lanes',
  'vert-tour-mechanics',
  'mountain-trek-span',
] as const;

const ENGLISH_TOUR_CALENDAR_WEEK_EVAL_PROMPT_IDS = [
  'list-calendar-week-departures',
  'summarize-maria-calendar-week',
  'gevorg-provider-week',
  'week-of-june-9',
  'mountain-trek-this-week',
  'visible-tours-calendar-week',
] as const;

const ENGLISH_TOUR_CALENDAR_WEEK_SERVICE_NAME_OVERRIDES: Record<
  string,
  string
> = {
  'mountain-trek-this-week': 'Mountain trek',
};

function buildEnglishTourCalendarEvalScenarios(): TourCalendarEvalScenario[] {
  const scenarios: TourCalendarEvalScenario[] = [];

  for (const id of ENGLISH_TOUR_CALENDAR_SPAN_EVAL_PROMPT_IDS) {
    const entry = EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS.find(
      (prompt) => prompt.id === id,
    );
    if (!entry) continue;
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    scenarios.push({
      id: `en-span-${id}`,
      locale: 'en',
      prompt: entry.prompt,
      expectedAction: 'explain_tour_calendar_span',
      rescueReason: 'explain_tour_calendar_span',
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    });
  }

  for (const id of ENGLISH_TOUR_CALENDAR_WEEK_EVAL_PROMPT_IDS) {
    const entry = LIST_TOUR_CALENDAR_WEEK_PROMPTS.find(
      (prompt) => prompt.id === id,
    );
    if (!entry) continue;
    const paramsPartial: Record<string, unknown> = {};
    if ('employeeName' in entry && entry.employeeName) {
      paramsPartial.employeeName = entry.employeeName;
    }
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName =
        ENGLISH_TOUR_CALENDAR_WEEK_SERVICE_NAME_OVERRIDES[id] ??
        entry.serviceName;
    }
    if ('weekStartDate' in entry && entry.weekStartDate) {
      paramsPartial.weekStartDate = entry.weekStartDate;
    }
    scenarios.push({
      id: `en-week-${id}`,
      locale: 'en',
      prompt: entry.prompt,
      expectedAction: 'list_tour_calendar_week',
      rescueReason: 'list_tour_calendar_week',
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    });
  }

  return scenarios;
}

/** Tour calendar span + week list phrasing for EN/HY/RU (ai-cmd-tour-13). */
export const AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishTourCalendarEvalScenarios().map(
      tourCalendarScenarioToEvalCase,
    ),
    ...MULTILINGUAL_TOUR_CALENDAR_EVAL_SCENARIOS.map(
      tourCalendarScenarioToEvalCase,
    ),
  ];

/** Map tour calendar week list prompts (ai-cmd-tour-12) to eval golden cases. */
export const AI_COMMAND_EVAL_LIST_TOUR_CALENDAR_WEEK_CASES: AiCommandEvalCase[] =
  LIST_TOUR_CALENDAR_WEEK_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('employeeName' in entry && entry.employeeName) {
      paramsPartial.employeeName = entry.employeeName;
    }
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('weekStartDate' in entry && entry.weekStartDate) {
      paramsPartial.weekStartDate = entry.weekStartDate;
    }
    return {
      id: `tour-calendar-week-${entry.id}`,
      prompt: entry.prompt,
      locale: entry.id.startsWith('ru-')
        ? 'ru'
        : entry.id.startsWith('hy-')
          ? 'hy'
          : 'en',
      expect: {
        rescuedAction: 'list_tour_calendar_week',
        rescueReason: 'list_tour_calendar_week',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map tour booking record explain prompts (ai-cmd-tour-7) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_RECORD_CASES: AiCommandEvalCase[] =
  EXPLAIN_TOUR_BOOKING_RECORD_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('bookingId' in entry && entry.bookingId) {
      paramsPartial.bookingId = entry.bookingId;
    }
    if ('customerName' in entry && entry.customerName) {
      paramsPartial.customerName = entry.customerName;
    }
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    return {
      id: `tour-booking-record-${entry.id}`,
      prompt: entry.prompt,
      locale: entry.id.startsWith('ru-')
        ? 'ru'
        : entry.id.startsWith('hy-')
          ? 'hy'
          : 'en',
      expect: {
        rescuedAction: 'explain_tour_booking_record',
        rescueReason: 'explain_tour_booking_record',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map tour capacity diagnosis prompts (ai-cmd-tour-9) to eval golden cases. */
export const AI_COMMAND_EVAL_DIAGNOSE_TOUR_CAPACITY_CASES: AiCommandEvalCase[] =
  DIAGNOSE_TOUR_CAPACITY_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('date' in entry && entry.date) paramsPartial.date = entry.date;
    if ('requestedPax' in entry && entry.requestedPax) {
      paramsPartial.requestedPax = entry.requestedPax;
    }
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    return {
      id: `tour-capacity-${entry.id}`,
      prompt: entry.prompt,
      locale: entry.id.startsWith('ru-')
        ? 'ru'
        : entry.id.startsWith('hy-')
          ? 'hy'
          : 'en',
      expect: {
        rescuedAction: 'diagnose_tour_capacity',
        rescueReason: 'diagnose_tour_capacity',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

export function tourConsumerScenarioToEvalCase(
  scenario: TourConsumerEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `tour-consumer-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

const ENGLISH_TOUR_CONSUMER_EVAL_PROMPT_IDS = [
  'public-one-departure-mountain-trek',
  'public-remaining-spots-date',
  'public-fully-booked-aug-15',
  'public-max-group-city-tour',
  'public-per-person-mountain-trek',
  'public-days-wine-country',
  'reject-4-mountain-date',
  'wont-accept-10-city',
  'fully-booked-checkout',
  'explain-record-bk-tour-1',
  'tour-dates-stored-bk-tour-1',
  'pax-special-john-trek',
] as const;

function buildEnglishTourConsumerEvalScenarios(): TourConsumerEvalScenario[] {
  const scenarios: TourConsumerEvalScenario[] = [];

  for (const id of ENGLISH_TOUR_CONSUMER_EVAL_PROMPT_IDS) {
    const daySlots = EXPLAIN_TOUR_DAY_SLOTS_PROMPTS.find(
      (entry) => entry.id === id,
    );
    if (daySlots) {
      scenarios.push({
        id: `en-day-slots-${id}`,
        locale: 'en',
        prompt: daySlots.prompt,
        expectedAction: 'explain_tour_day_slots',
        rescueReason: 'explain_tour_day_slots',
      });
      continue;
    }

    const tourBooking = EXPLAIN_TOUR_BOOKING_PROMPTS.find(
      (entry) => entry.id === id,
    );
    if (tourBooking) {
      scenarios.push({
        id: `en-tour-booking-${id}`,
        locale: 'en',
        prompt: tourBooking.prompt,
        expectedAction: 'explain_tour_booking',
        rescueReason: 'explain_tour_booking',
      });
      continue;
    }

    const capacity = DIAGNOSE_TOUR_CAPACITY_PROMPTS.find(
      (entry) => entry.id === id,
    );
    if (capacity) {
      scenarios.push({
        id: `en-capacity-${id}`,
        locale: 'en',
        prompt: capacity.prompt,
        expectedAction: 'diagnose_tour_capacity',
        rescueReason: 'diagnose_tour_capacity',
      });
      continue;
    }

    const bookingRecord = EXPLAIN_TOUR_BOOKING_RECORD_PROMPTS.find(
      (entry) => entry.id === id,
    );
    if (bookingRecord) {
      scenarios.push({
        id: `en-booking-record-${id}`,
        locale: 'en',
        prompt: bookingRecord.prompt,
        expectedAction: 'explain_tour_booking_record',
        rescueReason: 'explain_tour_booking_record',
      });
    }
  }

  return scenarios;
}

/** Day slots, tour booking metadata, and capacity phrasing for EN/HY/RU (ai-cmd-tour-10). */
export const AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishTourConsumerEvalScenarios().map(
      tourConsumerScenarioToEvalCase,
    ),
    ...MULTILINGUAL_TOUR_CONSUMER_EVAL_SCENARIOS.map(
      tourConsumerScenarioToEvalCase,
    ),
  ];

export function consumerCheckoutSuccessScenarioToEvalCase(
  scenario: ConsumerCheckoutSuccessEvalScenario,
): AiCommandEvalCase {
  const paramsPartial: Record<string, unknown> = {
    ...(scenario.paramsPartial ?? {}),
  };
  if (scenario.aspect) paramsPartial.aspect = scenario.aspect;
  return {
    id: `consumer-checkout-success-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason:
        scenario.rescueReason ?? 'explain_consumer_checkout_success',
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    },
  };
}

/** EN paraphrase + dismiss phrasing for consumer checkout success (ai-cmd-rec-7). */
export const AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES: AiCommandEvalCase[] =
  EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS.map(
    consumerCheckoutSuccessScenarioToEvalCase,
  );

/** Map consumer adoption assistant prompts (adopt-6.6) to eval golden cases. */
export const AI_COMMAND_EVAL_CONSUMER_ADOPTION_CASES: AiCommandEvalCase[] =
  CONSUMER_ADOPTION_PROMPT_SCENARIOS.map((entry) => ({
    id: `consumer-adoption-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider push setup prompts (adopt-6.7) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_CASES: AiCommandEvalCase[] =
  PROVIDER_PUSH_SETUP_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-push-setup-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider earnings summary prompts to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_EARNINGS_CASES: AiCommandEvalCase[] =
  PROVIDER_EARNINGS_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-earnings-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider exp-2 prompts (prov-exp-2.4) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_EXP_2_CASES: AiCommandEvalCase[] =
  PROVIDER_EXP_2_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-exp-2-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
      ...('paramsPartial' in entry && entry.paramsPartial
        ? { paramsPartial: entry.paramsPartial }
        : {}),
    },
  }));

/** Map provider exp-3 prompts (prov-exp-5.3) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_EXP_3_CASES: AiCommandEvalCase[] =
  PROVIDER_EXP_3_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-exp-3-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason:
        entry.expectedAction === 'add_retail_to_booking'
          ? 'add_retail_booking'
          : entry.expectedAction,
    },
  }));

/** Map provider open shifts prompts (prov-exp-7.3) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_CASES: AiCommandEvalCase[] =
  SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS.map((entry) => ({
    id: `provider-open-shifts-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'fill_gap_waitlist',
    },
  }));

/** Map provider team whos next prompts (prov-exp-4.3) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_CASES: AiCommandEvalCase[] =
  SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS.map((entry) => ({
    id: `provider-team-whos-next-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'team_whos_next',
    },
  }));

/** Map provider time-off list prompts (prov-exp-7.2) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_CASES: AiCommandEvalCase[] =
  SIMILAR_PROVIDER_TIME_OFF_LIST_PROMPTS.map((entry) => ({
    id: `provider-time-off-list-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'my_time_off_list',
    },
  }));

/** Map provider exp-2 i18n prompts (acc-2.4) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_CASES: AiCommandEvalCase[] =
  PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-client-context-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
      ...('paramsPartial' in entry && entry.paramsPartial
        ? { paramsPartial: entry.paramsPartial }
        : {}),
    },
  }));

/** Map provider client context i18n prompts (acc-2.4) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_CASES: AiCommandEvalCase[] =
  EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    return {
      id: `consumer-checkout-success-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'explain_consumer_checkout_success',
        rescueReason: 'explain_consumer_checkout_success',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map checkout success recommendation explain prompts (ai-cmd-rec-5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES: AiCommandEvalCase[] =
  EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    return {
      id: `checkout-recommendations-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en',
      expect: {
        rescuedAction: 'explain_checkout_recommendations',
        rescueReason: 'explain_checkout_recommendations',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map tour day slots explain prompts (ai-cmd-tour-6) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_TOUR_DAY_SLOTS_CASES: AiCommandEvalCase[] =
  EXPLAIN_TOUR_DAY_SLOTS_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('date' in entry && entry.date) paramsPartial.date = entry.date;
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    return {
      id: `tour-day-slots-${entry.id}`,
      prompt: entry.prompt,
      locale:
        entry.id.includes('-hy-') || entry.id.startsWith('hy-')
          ? 'hy'
          : entry.id.includes('-ru-') || entry.id.startsWith('ru-')
            ? 'ru'
            : 'en',
      expect: {
        rescuedAction: 'explain_tour_day_slots',
        rescueReason: 'explain_tour_day_slots',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map checkout currency prompts (ai-cmd-curr-5) to eval golden cases. */
export const AI_COMMAND_EVAL_CHECKOUT_CURRENCY_CASES: AiCommandEvalCase[] =
  EXPLAIN_CHECKOUT_CURRENCY_PROMPTS.map((entry) => ({
    id: `checkout-currency-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_checkout_currency',
      rescueReason: 'explain_checkout_currency',
    },
  }));

/** Map tenant currency prompts (ai-cmd-curr-6) to eval golden cases. */
export const AI_COMMAND_EVAL_TENANT_CURRENCY_CASES: AiCommandEvalCase[] =
  EXPLAIN_TENANT_CURRENCY_PROMPTS.map((entry) => ({
    id: `tenant-currency-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_tenant_currency',
      rescueReason: 'explain_tenant_currency',
    },
  }));

/** Map package currency prompts (ai-cmd-curr-7) to eval golden cases. */
export const AI_COMMAND_EVAL_PACKAGE_CURRENCY_CASES: AiCommandEvalCase[] =
  EXPLAIN_PACKAGE_CURRENCY_PROMPTS.map((entry) => ({
    id: `package-currency-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_package_currency',
      rescueReason: 'explain_package_currency',
    },
  }));

/** Map provider date display explain prompts (ai-cmd-fmt-15) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES: AiCommandEvalCase[] =
  EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS.map((entry) => ({
    id: `explain-provider-date-display-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_provider_date_display',
      rescueReason: 'explain_provider_date_display',
    },
  }));

/** Map provider push time-format configure prompts (ai-cmd-fmt-16) to eval golden cases. */
export const AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES: AiCommandEvalCase[] =
  CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS.map((entry) => ({
    id: `configure-provider-push-date-format-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'configure_provider_push_date_format',
      rescueReason: 'configure_provider_push_date_format',
    },
  }));

/** Map provider payment currency prompts (ai-cmd-curr-8) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_PAYMENT_CURRENCY_CASES: AiCommandEvalCase[] =
  EXPLAIN_PROVIDER_PAYMENT_CURRENCY_PROMPTS.map((entry) => ({
    id: `provider-payment-currency-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_provider_payment_currency',
      rescueReason: 'explain_provider_payment_currency',
    },
  }));

/** Map notification currency prompts (ai-cmd-curr-9) to eval golden cases. */
export const AI_COMMAND_EVAL_NOTIFICATION_CURRENCY_CASES: AiCommandEvalCase[] =
  EXPLAIN_NOTIFICATION_CURRENCY_PROMPTS.map((entry) => ({
    id: `notification-currency-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_notification_currency',
      rescueReason: 'explain_notification_currency',
    },
  }));

/** Map Stripe currency warning prompts (ai-cmd-curr-10) to eval golden cases. */
export const AI_COMMAND_EVAL_STRIPE_CURRENCY_WARNING_CASES: AiCommandEvalCase[] =
  EXPLAIN_STRIPE_CURRENCY_WARNING_PROMPTS.map((entry) => ({
    id: `stripe-currency-warning-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_stripe_currency_warning',
      rescueReason: 'explain_stripe_currency_warning',
    },
  }));

/** Map Stripe checkout currency prompts (ai-cmd-curr-11) to eval golden cases. */
export const AI_COMMAND_EVAL_STRIPE_CHECKOUT_CURRENCY_CASES: AiCommandEvalCase[] =
  EXPLAIN_STRIPE_CHECKOUT_CURRENCY_PROMPTS.map((entry) => ({
    id: `stripe-checkout-currency-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_stripe_checkout_currency',
      rescueReason: 'explain_stripe_checkout_currency',
    },
  }));

/** Map Stripe checkout failure diagnosis prompts (ai-cmd-curr-12) to eval golden cases. */
export const AI_COMMAND_EVAL_STRIPE_CHECKOUT_FAILURE_CASES: AiCommandEvalCase[] =
  DIAGNOSE_STRIPE_CHECKOUT_FAILURE_PROMPTS.map((entry) => ({
    id: `stripe-checkout-failure-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'diagnose_stripe_checkout_failure',
      rescueReason: 'diagnose_stripe_checkout_failure',
    },
  }));

/** Map reports currency explain prompts (ai-cmd-curr-13) to eval golden cases. */
export const AI_COMMAND_EVAL_REPORTS_CURRENCY_CASES: AiCommandEvalCase[] =
  EXPLAIN_REPORTS_CURRENCY_PROMPTS.map((entry) => ({
    id: `reports-currency-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_reports_currency',
      rescueReason: 'explain_reports_currency',
    },
  }));

/** Map revenue KPI summary prompts (ai-cmd-curr-14) to eval golden cases. */
export const AI_COMMAND_EVAL_REVENUE_KPIS_CASES: AiCommandEvalCase[] =
  SUMMARIZE_REVENUE_KPIS_PROMPTS.map((entry) => ({
    id: `revenue-kpis-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'summarize_revenue_kpis',
      rescueReason: 'summarize_revenue_kpis',
    },
  }));

/** Map business language scenarios (ai-cmd-lang-4) to eval golden cases. */
export function businessLanguagesScenarioToEvalCase(
  scenario: BusinessLanguagesEvalScenario,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
    ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
    ...(scenario.paramsPartial
      ? { paramsPartial: scenario.paramsPartial }
      : {}),
    ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
  };
  return {
    id: `business-languages-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    expect,
  };
}

function buildEnglishBusinessLanguagesEvalScenarios(): BusinessLanguagesEvalScenario[] {
  return [
    ...CONFIGURE_BUSINESS_LANGUAGES_PROMPTS.filter(
      (entry) => !entry.id.startsWith('hy-') && !entry.id.startsWith('ru-'),
    ).map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'configure_business_languages' as const,
      rescueReason: 'configure_business_languages',
      paramsPartial: { operation: entry.operation },
    })),
    ...EXPLAIN_BUSINESS_LANGUAGES_PROMPTS.filter(
      (entry) => !entry.id.startsWith('hy-') && !entry.id.startsWith('ru-'),
    ).map((entry) => ({
      id: `en-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'explain_business_languages' as const,
      rescueReason: 'explain_business_languages',
    })),
  ];
}

/** Configure + explain business language prompts for EN/HY/RU (ai-cmd-lang-4). */
export const AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES: AiCommandEvalCase[] =
  [
    ...buildEnglishBusinessLanguagesEvalScenarios().map(
      businessLanguagesScenarioToEvalCase,
    ),
    ...MULTILINGUAL_BUSINESS_LANGUAGES_EVAL_SCENARIOS.map(
      businessLanguagesScenarioToEvalCase,
    ),
  ];

/** @deprecated Prefer AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES */
export const AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CASES: AiCommandEvalCase[] =
  AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES.filter(
    (entry) => entry.expect.rescuedAction === 'configure_business_languages',
  );

/** @deprecated Prefer AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES */
export const AI_COMMAND_EVAL_EXPLAIN_BUSINESS_LANGUAGES_CASES: AiCommandEvalCase[] =
  AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES.filter(
    (entry) => entry.expect.rescuedAction === 'explain_business_languages',
  );

/** Map bulk strip disabled locale translation prompts (ai-cmd-lang-3) to eval golden cases. */
export const AI_COMMAND_EVAL_BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_CASES: AiCommandEvalCase[] =
  BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_PROMPTS.map((entry) => ({
    id: `business-languages-bulk-strip-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'bulk_strip_disabled_locale_translations',
      rescueReason: 'bulk_strip_disabled_locale_translations',
    },
  }));

/** Map flexible-booking rescue scenarios (ai-cmd-h1.3) to eval golden cases. */
export function flexibleBookingScenarioToEvalCase(
  scenario: FlexibleBookingEvalScenario,
  locale: AiEvalLocale = 'en',
  needsMultilingual = false,
): AiCommandEvalCase {
  return {
    id: `flexible-booking-${scenario.id}`,
    prompt: scenario.prompt,
    locale,
    expect: {
      rescuedAction: scenario.rescuedAction,
      rescueFromAction: scenario.rescueFromAction,
      rescueReason: scenario.rescueReason,
      paramsPartial: scenario.paramsPartial,
      ...(needsMultilingual ? { needsMultilingual: true } : {}),
    },
  };
}

/** Map hy/ru check+book scenarios (ai-cmd-h1.5) to eval golden cases. */
export function multilingualCheckAndBookScenarioToEvalCase(
  scenario: CheckAndBookEvalScenario,
  locale: AiEvalLocale,
): AiCommandEvalCase {
  const base = checkAndBookScenarioToEvalCase(scenario);
  return {
    ...base,
    id: `multilingual-${base.id}`,
    locale,
    expect: { ...base.expect, needsMultilingual: true },
  };
}

/** Map shared compound scenarios (ai-cmd-0.3) to eval golden cases (ai-cmd-0.4). */
export function compoundScenarioToEvalCase(
  scenario: CompoundScenarioExpectation,
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    compoundSurface: scenario.surface,
  };

  if (scenario.expectEmpty) {
    expect.compoundExpectEmpty = true;
  } else {
    if (isCompoundPrompt(scenario.prompt)) {
      expect.routeTier = 'compound';
    }
    if (scenario.orderedActions) {
      expect.compoundSteps = scenario.orderedActions;
    }
    if (scenario.actions) {
      expect.compoundActionsContains = scenario.actions;
    }
    if (scenario.minSteps) {
      expect.compoundMinSteps = scenario.minSteps;
    }
    if (scenario.paramChecks?.length) {
      const stepParams: NonNullable<
        AiCommandEvalExpectation['compoundStepParams']
      > = [];
      for (const check of scenario.paramChecks) {
        stepParams.push({
          stepIndex: check.stepIndex,
          paramsPartial:
            check.value !== undefined
              ? { [check.key]: check.value }
              : undefined,
        });
      }
      expect.compoundStepParams = stepParams;
    }
    if (scenario.id.includes('golden') || scenario.compoundRecipeId) {
      expect.compoundSource = scenario.noLlm ? 'golden' : 'deterministic';
      expect.compoundRecipeId =
        scenario.compoundRecipeId ??
        (scenario.surface === 'customer'
          ? 'customer_self_service_compound'
          : 'dashboard_operational_compound');
    }
  }

  return {
    id: `compound-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    expect,
  };
}

/** Dashboard provider onboarding compound (ai-cmd-ext-4.1). */
export const AI_COMMAND_EVAL_PROVIDER_ONBOARDING_COMPOUND_CASES: AiCommandEvalCase[] =
  PROVIDER_ONBOARDING_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams
        ? [
            ...(entry.expectedParams.employeeName
              ? [
                  {
                    stepIndex: 0,
                    key: 'employeeName',
                    value: entry.expectedParams.employeeName,
                  },
                ]
              : []),
            ...(entry.expectedParams.serviceNames
              ? [
                  {
                    stepIndex: 1,
                    key: 'serviceNames',
                    value: entry.expectedParams.serviceNames,
                  },
                ]
              : []),
            ...('templateName' in entry.expectedParams &&
            entry.expectedParams.templateName
              ? [
                  {
                    stepIndex: 2,
                    key: 'templateName',
                    value: entry.expectedParams.templateName,
                  },
                ]
              : []),
            ...(typeof entry.expectedParams.enabled === 'boolean'
              ? [
                  {
                    stepIndex: 3,
                    key: 'enabled',
                    value: entry.expectedParams.enabled,
                  },
                ]
              : []),
          ]
        : undefined,
      noLlm: true,
      compoundRecipeId: 'onboard_new_provider',
    }),
  );

/** Dashboard budget discover and book compound (ai-cmd-ext-4.3). */
export const AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_COMPOUND_CASES: AiCommandEvalCase[] =
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams
        ? [
            ...(entry.expectedParams.maxPrice
              ? [
                  {
                    stepIndex: 0,
                    key: 'maxPrice',
                    value: entry.expectedParams.maxPrice,
                  },
                ]
              : []),
            ...(entry.expectedParams.serviceCategory
              ? [
                  {
                    stepIndex: 0,
                    key: 'serviceCategory',
                    value: entry.expectedParams.serviceCategory,
                  },
                ]
              : []),
            ...('timeOfDay' in entry.expectedParams && entry.expectedParams.timeOfDay
              ? [
                  {
                    stepIndex: 1,
                    key: 'timeOfDay',
                    value: entry.expectedParams.timeOfDay,
                  },
                ]
              : []),
            ...(typeof entry.expectedParams.bookingFirstAvailable === 'boolean'
              ? [
                  {
                    stepIndex: 2,
                    key: 'bookingFirstAvailable',
                    value: entry.expectedParams.bookingFirstAvailable,
                  },
                ]
              : []),
          ]
        : undefined,
      noLlm: true,
      compoundRecipeId: 'budget_discover_and_book',
    }),
  );

/** Dashboard rank discover and book compound (ai-cmd-ext-4.4). */
export const AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_COMPOUND_CASES: AiCommandEvalCase[] =
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams
        ? [
            ...(entry.expectedParams.serviceRank
              ? [
                  {
                    stepIndex: 0,
                    key: 'serviceRank',
                    value: entry.expectedParams.serviceRank,
                  },
                ]
              : []),
            ...(entry.expectedParams.serviceCategory
              ? [
                  {
                    stepIndex: 0,
                    key: 'serviceCategory',
                    value: entry.expectedParams.serviceCategory,
                  },
                ]
              : []),
            ...('timeOfDay' in entry.expectedParams && entry.expectedParams.timeOfDay
              ? [
                  {
                    stepIndex: 1,
                    key: 'timeOfDay',
                    value: entry.expectedParams.timeOfDay,
                  },
                ]
              : []),
            ...(typeof entry.expectedParams.bookingFirstAvailable === 'boolean'
              ? [
                  {
                    stepIndex: 2,
                    key: 'bookingFirstAvailable',
                    value: entry.expectedParams.bookingFirstAvailable,
                  },
                ]
              : []),
          ]
        : undefined,
      noLlm: true,
      compoundRecipeId: 'rank_discover_and_book',
    }),
  );

/** Dashboard clinic lab day close compound (ai-cmd-ext-4.2). */
export const AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_COMPOUND_CASES: AiCommandEvalCase[] =
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams
        ? [
            ...(('date' in entry.expectedParams && entry.expectedParams.date) ||
            ('status' in entry.expectedParams && entry.expectedParams.status)
              ? [
                  {
                    stepIndex: 0,
                    key:
                      'date' in entry.expectedParams && entry.expectedParams.date
                        ? 'date'
                        : 'status',
                    value:
                      ('date' in entry.expectedParams
                        ? entry.expectedParams.date
                        : undefined) ??
                      ('status' in entry.expectedParams
                        ? entry.expectedParams.status
                        : undefined),
                  },
                ]
              : []),
            ...(entry.expectedParams.orderId
              ? [
                  {
                    stepIndex: 1,
                    key: 'orderId',
                    value: entry.expectedParams.orderId,
                  },
                ]
              : []),
            ...(entry.expectedParams.measurementCode
              ? [
                  {
                    stepIndex: 1,
                    key: 'measurementCode',
                    value: entry.expectedParams.measurementCode,
                  },
                ]
              : []),
            ...(entry.expectedParams.value
              ? [
                  {
                    stepIndex: 1,
                    key: 'value',
                    value: entry.expectedParams.value,
                  },
                ]
              : []),
            ...(entry.expectedParams.customerName
              ? [
                  {
                    stepIndex: 2,
                    key: 'customerName',
                    value: entry.expectedParams.customerName,
                  },
                  {
                    stepIndex: 3,
                    key: 'customerName',
                    value: entry.expectedParams.customerName,
                  },
                ]
              : []),
          ]
        : undefined,
      noLlm: true,
      compoundRecipeId: 'clinic_lab_day_close',
    }),
  );

/** Golden compound NL prompts — multi-command decomposition (ai-cmd-0.4). */
export const AI_COMMAND_EVAL_COMPOUND_CASES: AiCommandEvalCase[] = [
  ...COMPOUND_DECOMPOSITION_SCENARIOS.map(compoundScenarioToEvalCase),
  ...AI_COMMAND_EVAL_PROVIDER_ONBOARDING_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_ONBOARDING_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_MULTILINGUAL_CASES,
];

/** Check+book compound golden cases — dashboard + customer (ai-cmd-h1.3). */
export const AI_COMMAND_EVAL_CHECK_AND_BOOK_CASES: AiCommandEvalCase[] =
  CHECK_AND_BOOK_EVAL_SCENARIOS.map(checkAndBookScenarioToEvalCase);

/** Flexible booking rescue/disambiguation golden cases (ai-cmd-h1.3). */
export const AI_COMMAND_EVAL_FLEXIBLE_BOOKING_CASES: AiCommandEvalCase[] =
  FLEXIBLE_BOOKING_EVAL_SCENARIOS.map((scenario) =>
    flexibleBookingScenarioToEvalCase(scenario),
  );

/** hy/ru/translit check+book compound golden cases (ai-cmd-h1.5). */
export const AI_COMMAND_EVAL_MULTILINGUAL_CHECK_AND_BOOK_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS.flatMap((entry) =>
    (['dashboard', 'customer'] as const).map((surface) =>
      multilingualCheckAndBookScenarioToEvalCase(
        {
          id: `${surface}-${entry.id}`,
          surface,
          prompt: entry.prompt,
          serviceName: entry.serviceName,
          notBeforeTime: entry.notBeforeTime,
          timeOfDay: entry.timeOfDay,
        },
        entry.locale,
      ),
    ),
  );

/** hy/ru/translit flexible booking rescue golden cases (ai-cmd-h1.5). */
export const AI_COMMAND_EVAL_MULTILINGUAL_FLEXIBLE_BOOKING_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS.map((entry) =>
    flexibleBookingScenarioToEvalCase(
      {
        id: entry.id,
        prompt: entry.prompt,
        rescueFromAction:
          'rescueFromAction' in entry ? entry.rescueFromAction : undefined,
        rescuedAction: entry.rescuedAction,
        rescueReason: entry.rescueReason,
        paramsPartial:
          'paramsPartial' in entry ? entry.paramsPartial : undefined,
      },
      entry.locale,
      true,
    ),
  );

/** Availability intent disambiguation golden cases (ai-cmd-h1.4). */
export const AI_COMMAND_EVAL_DISAMBIGUATION_CASES: AiCommandEvalCase[] =
  AVAILABILITY_DISAMBIGUATION_SCENARIOS.filter(
    (scenario) => !scenario.classifierOnly,
  ).map(availabilityDisambiguationScenarioToEvalCase);

/** Classifier-documented public disambiguation (LLM regression, ai-cmd-h1.4). */
export const AI_COMMAND_EVAL_DISAMBIGUATION_LLM_CASES: AiCommandEvalCase[] =
  AVAILABILITY_DISAMBIGUATION_SCENARIOS.filter(
    (scenario) => scenario.classifierOnly,
  ).map((scenario) => ({
    id: `llm-disambig-${scenario.surface}-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en' as const,
    requiresLlm: true,
    expect: { action: scenario.expectedAction },
  }));

/** Per-recipe NL fixtures from registry example prompts that decompose deterministically. */
export function buildRegistryCompoundEvalCases(): AiCommandEvalCase[] {
  const cases: AiCommandEvalCase[] = [];
  for (const recipe of COMPOUND_COMMAND_RECIPES) {
    if (!recipe.decomposeUtil || recipe.llmDecompose) continue;
    for (const [index, prompt] of recipe.examplePrompts.entries()) {
      if (!isCompoundPrompt(prompt)) continue;
      const surface = recipe.surfaces[0];
      const decomposition = decomposeDeterministicForSurface(surface, prompt);
      if ((decomposition?.steps.length ?? 0) < 2) continue;
      cases.push({
        id: `registry-compound-${recipe.id}-${index + 1}`,
        prompt,
        locale: 'en',
        expect: {
          routeTier: 'compound',
          compoundSurface: surface,
          compoundMinSteps: 2,
        },
      });
    }
  }
  return cases;
}

export const AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES: AiCommandEvalCase[] =
  buildRegistryCompoundEvalCases();

/** Golden NL prompts — deterministic expectations (no live OpenAI in CI). */
export const AI_COMMAND_EVAL_CASES: AiCommandEvalCase[] = [
  {
    id: 'en-show-today',
    prompt: 'Show all appointments today',
    locale: 'en',
    expect: { routeTier: 'read_only', needsMultilingual: false },
  },
  {
    id: 'en-simple-book',
    prompt: 'Book facemassage with Gevorg tomorrow at 10:00',
    locale: 'en',
    expect: { routeTier: 'simple_mutate', needsMultilingual: false },
  },
  {
    id: 'en-fallback-orchestration',
    prompt:
      'Book facemassage on Gevorg tomorrow at 9; if not available then Mary at 9; if not whoever is free',
    locale: 'en',
    expect: { routeTier: 'orchestration' },
  },
  {
    id: 'en-compound-cancel-clear',
    prompt: 'Cancel all appointments and then clear schedule for Gevorg',
    locale: 'en',
    expect: { routeTier: 'compound' },
  },
  {
    id: 'en-reschedule-am',
    prompt: "Move Maria's appointment to tomorrow at 9 AM",
    locale: 'en',
    expect: { rescheduleTimeSlot: '09:00' },
  },
  {
    id: 'en-reschedule-pm',
    prompt: 'Reschedule Jujo to Friday at 2:30 pm',
    locale: 'en',
    expect: { rescheduleTimeSlot: '14:30' },
  },
  {
    id: 'en-reschedule-to-at-pm',
    prompt: 'Move the 16:00 appointment to tomorrow at 3pm',
    locale: 'en',
    expect: { rescheduleTimeSlot: '15:00' },
  },
  {
    id: 'en-reschedule-nearest-free-2027',
    prompt: RESCHEDULE_NEAREST_FREE_YEAR_PROMPT,
    locale: 'en',
    expect: {
      rescheduleFromTimeSlot: '16:00',
      paramsPartial: {
        bookingFirstAvailable: true,
        fromDate: '10/06/2027',
        date: '11/06/2027',
      },
    },
  },
  {
    id: 'hy-show-today',
    prompt: 'Ցույց տուր բոլոր ամրագրումները այսօր',
    locale: 'hy',
    expect: { needsMultilingual: true },
  },
  {
    id: 'ru-book-tomorrow',
    prompt: 'Запиши массаж на Геворга завтра в 10:00',
    locale: 'ru',
    expect: { needsMultilingual: true, routeTier: 'simple_mutate' },
  },
  {
    id: 'translit-show',
    prompt: 'pokazhi vse zapisi gevorg na vagh@',
    locale: 'translit',
    expect: { needsMultilingual: true },
  },
  {
    id: 'en-clear-schedule-rescue',
    prompt: 'Clear Gevorg schedule for tomorrow',
    locale: 'en',
    expect: { rescuedAction: 'clear_schedule' },
  },
  {
    id: 'en-payment-sweep-rescue',
    prompt: 'Run payment sweep for today',
    locale: 'en',
    expect: { rescuedAction: 'payment_sweep' },
  },
  // Per-intent compound golden cases (ai-cmd-0.4)
  {
    id: 'compound-dashboard-cancel_visit-fill_waitlist',
    prompt: 'Cancel package visit for Anna and notify waitlist customers',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'dashboard',
      compoundSteps: ['cancel_package_visit', 'fill_slot_from_waitlist'],
      compoundSource: 'golden',
      compoundRecipeId: 'dashboard_operational_compound',
    },
  },
  {
    id: 'compound-dashboard-coordinate_waitlist',
    prompt: 'Cancel package visit and coordinate waitlist offer',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'dashboard',
      compoundSteps: ['cancel_package_visit', 'coordinate_waitlist_offer'],
      compoundSource: 'golden',
      compoundRecipeId: 'dashboard_operational_compound',
    },
  },
  {
    id: 'compound-customer-book_package-promo',
    prompt: 'Book spa day package and apply promo code WELCOME',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundSteps: ['book_package', 'promo_code_help'],
      compoundSource: 'golden',
      compoundRecipeId: 'customer_self_service_compound',
      compoundStepParams: [
        { stepIndex: 1, paramsPartial: { promoCode: 'WELCOME' } },
      ],
    },
  },
  {
    id: 'compound-customer-availability-book',
    prompt:
      'Check package availability and book spa day package with cash at visit',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundMinSteps: 2,
      compoundActionsContains: ['check_package_availability', 'book_with_cash'],
      compoundRecipeId: 'customer_self_service_compound',
    },
  },
  {
    id: 'compound-provider-mark-paid',
    prompt: 'Show my package appointments today and mark booking paid',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'provider',
      compoundMinSteps: 2,
      compoundActionsContains: ['mark_paid'],
      compoundRecipeId: 'provider_booking_compound',
    },
  },
  {
    id: 'compound-dashboard-payments-export',
    prompt: 'Summarize unpaid bookings and export accounting',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'dashboard',
      compoundActionsContains: ['summarize_unpaid', 'export_accounting'],
      compoundMinSteps: 2,
    },
  },
  {
    id: 'compound-dashboard-marketing-reengagement',
    prompt: 'Trigger reengagement and list inactive customers',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'dashboard',
      compoundMinSteps: 2,
    },
  },
  {
    id: 'compound-customer-cart-duration',
    prompt: 'Add massage to cart and show cart total duration',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundActionsContains: [
        'add_services_to_cart',
        'show_cart_total_duration',
      ],
      compoundMinSteps: 2,
    },
  },
];

/** Dashboard revenue / earnings analytics golden cases. */
export const AI_COMMAND_EVAL_REVENUE_ANALYTICS_CASES: AiCommandEvalCase[] = [
  {
    id: 'revenue-total-earnings-today',
    prompt: 'Calculate total earnings for today',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'revenue' },
    },
  },
  {
    id: 'revenue-total-earnings-last-month',
    prompt: 'How much did we earn last month?',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'revenue' },
    },
  },
  {
    id: 'revenue-top-specialists-last-week',
    prompt: 'Top 3 specialists by revenue last week',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_staff',
      paramsPartial: { staffMetric: 'most_revenue', limit: 3 },
    },
  },
  {
    id: 'revenue-which-specialist-today',
    prompt: 'Which specialist earned the most today?',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_staff',
      paramsPartial: { staffMetric: 'most_revenue' },
    },
  },
  {
    id: 'revenue-all-time-total',
    prompt: 'Tell me total earnings all time',
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'revenue' },
    },
  },
];

const EXISTING_REVENUE_ANALYTICS_PROMPTS = new Set(
  AI_COMMAND_EVAL_REVENUE_ANALYTICS_CASES.map((entry) => entry.prompt),
);

/** Map summarize_bookings tenant-currency revenue prompts (ai-cmd-ext-1.6). */
export const AI_COMMAND_EVAL_SUMMARIZE_BOOKINGS_CURRENCY_CASES: AiCommandEvalCase[] =
  SUMMARIZE_BOOKINGS_REVENUE_PROMPTS.filter(
    (entry) =>
      entry.bookingMetric === 'revenue' &&
      !EXISTING_REVENUE_ANALYTICS_PROMPTS.has(entry.prompt),
  ).map((entry) => ({
    id: `summarize-bookings-currency-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'revenue' },
    },
  }));

export const AI_COMMAND_EVAL_SUMMARIZE_BOOKINGS_OVERVIEW_CASES: AiCommandEvalCase[] =
  SUMMARIZE_BOOKINGS_REVENUE_PROMPTS.filter(
    (entry) => entry.bookingMetric === 'overview',
  ).map((entry) => ({
    id: `summarize-bookings-overview-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en',
    expect: {
      rescuedAction: 'summarize_bookings',
      paramsPartial: { bookingMetric: 'overview' },
    },
  }));

/** Dashboard staff lifecycle intents (ai-cmd-ext-2.5–2.8). */
export const AI_COMMAND_EVAL_STAFF_OPERATIONS_CASES: AiCommandEvalCase[] =
  STAFF_OPERATIONS_PROMPT_FIXTURES.map((entry) => ({
    id: `staff-operations-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.expectedParams ? { paramsPartial: entry.expectedParams } : {}),
    },
  }));

/** Dashboard billing + loyalty intents (ai-cmd-ext-2.9–2.10). */
export const AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_CASES: AiCommandEvalCase[] =
  BILLING_LOYALTY_DASHBOARD_PROMPT_FIXTURES.map((entry) => ({
    id: `billing-loyalty-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
    },
  }));

/** Dashboard waitlist intents (ai-cmd-ext-2.11–2.12). */
export const AI_COMMAND_EVAL_WAITLIST_DASHBOARD_CASES: AiCommandEvalCase[] =
  WAITLIST_DASHBOARD_PROMPT_FIXTURES.map((entry) => ({
    id: `waitlist-dashboard-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.expectedParams ? { paramsPartial: entry.expectedParams } : {}),
    },
  }));

/** Dashboard ops golden cases (catalog bulk, customer context, provider revenue, upcoming). */
export function dashboardOpsScenarioToEvalCase(
  scenario: (typeof ALL_DASHBOARD_OPS_SCENARIOS)[number],
): AiCommandEvalCase {
  const expect: AiCommandEvalExpectation = {
    rescuedAction: scenario.expectedAction,
  };
  if (scenario.paramsPartial) {
    expect.paramsPartial = scenario.paramsPartial;
  }
  return {
    id: `dashboard-ops-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    expect,
  };
}

export const AI_COMMAND_EVAL_DASHBOARD_OPS_CASES: AiCommandEvalCase[] =
  ALL_DASHBOARD_OPS_SCENARIOS.map(dashboardOpsScenarioToEvalCase);

/** Full deterministic CI suite: routing/rescue + compound decomposition. */
export const AI_COMMAND_EVAL_DETERMINISTIC_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_CASES,
  ...AI_COMMAND_EVAL_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CHECK_AND_BOOK_CASES,
  ...AI_COMMAND_EVAL_FLEXIBLE_BOOKING_CASES,
  ...AI_COMMAND_EVAL_MULTILINGUAL_CHECK_AND_BOOK_CASES,
  ...AI_COMMAND_EVAL_MULTILINGUAL_FLEXIBLE_BOOKING_CASES,
  ...AI_COMMAND_EVAL_DISAMBIGUATION_CASES,
  ...AI_COMMAND_EVAL_REGISTRY_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_REVENUE_ANALYTICS_CASES,
  ...AI_COMMAND_EVAL_SUMMARIZE_BOOKINGS_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_SUMMARIZE_BOOKINGS_OVERVIEW_CASES,
  ...AI_COMMAND_EVAL_STAFF_OPERATIONS_CASES,
  ...AI_COMMAND_EVAL_STAFF_OPERATIONS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_CASES,
  ...AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_WAITLIST_DASHBOARD_CASES,
  ...AI_COMMAND_EVAL_WAITLIST_DASHBOARD_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_DASHBOARD_OPS_CASES,
  ...AI_COMMAND_EVAL_BUSINESS_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_BUSINESS_DATE_FORMAT_CASES,
  ...AI_COMMAND_EVAL_PREVIEW_BUSINESS_DATE_FORMAT_CASES,
  ...AI_COMMAND_EVAL_AUDIT_DASHBOARD_DATE_SURFACES_CASES,
  ...AI_COMMAND_EVAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_MIGRATE_DASHBOARD_DATE_DISPLAY_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_NOTIFICATION_DATE_FORMAT_CASES,
  ...AI_COMMAND_EVAL_PREVIEW_NOTIFICATION_DATETIME_CASES,
  ...AI_COMMAND_EVAL_NOTIFY_PATIENT_RESULT_READY_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_ORDER_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_ORDER_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PATIENT_CHART_CASES,
  ...AI_COMMAND_EVAL_CLINIC_PATIENT_CHART_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_BOOKING_CASES,
  ...AI_COMMAND_EVAL_CLINIC_BOOKING_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_SERVICE_CONFIGURE_EXPLAIN_CASES,
  ...AI_COMMAND_EVAL_APPLY_CLINIC_PLAYBOOK_CASES,
  ...AI_COMMAND_EVAL_CLINIC_V2_SURFACE_CASES,
  ...AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_RESCUE_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_RESCUE_CASES,
  ...AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_RESCUE_CASES,
  ...AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_RESCUE_CASES,
  ...AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_DATE_INPUT_FORMAT_CASES,
  ...AI_COMMAND_EVAL_PREVIEW_DATE_INPUT_PARSE_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_BUSINESS_TAX_CASES,
  ...AI_COMMAND_EVAL_SET_SERVICE_TAX_RATE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_BUSINESS_TAX_CASES,
  ...AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_STACKED_TAX_RULES_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_STACKED_TAX_CASES,
  ...AI_COMMAND_EVAL_STACKED_TAX_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_STRIPE_TAX_CHARGE_CASES,
  ...AI_COMMAND_EVAL_LOOKUP_BOOKING_TAX_METADATA_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_APPOINTMENT_TAX_CASES,
  ...AI_COMMAND_EVAL_QUOTE_STAFF_BOOKING_TAX_CASES,
  ...AI_COMMAND_EVAL_SUMMARIZE_CUSTOMER_TAX_PAID_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_TAX_CASES,
  ...AI_COMMAND_EVAL_TAX_DISPLAY_EN_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_PRIVACY_RETENTION_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_GRANULAR_CONSENT_CASES,
  ...AI_COMMAND_EVAL_ENABLE_HIPAA_MODE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_COMPLIANCE_STATUS_CASES,
  ...AI_COMMAND_EVAL_LIST_SUB_PROCESSORS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_GDPR_CHECKLIST_CASES,
  ...AI_COMMAND_EVAL_ADMIN_DELETE_CUSTOMER_DATA_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_DATA_RIGHTS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PHI_ENCRYPTION_STATUS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_MINIMUM_NECESSARY_PHI_ACCESS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_HIPAA_SESSION_TIMEOUT_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_HIPAA_SESSION_TIMEOUT_CASES,
  ...AI_COMMAND_EVAL_ACCEPT_HIPAA_BAA_CASES,
  ...AI_COMMAND_EVAL_PHI_GUARD_CASES,
  ...AI_COMMAND_EVAL_LIST_BREACH_INCIDENTS_CASES,
  ...AI_COMMAND_EVAL_REPORT_DATA_BREACH_CASES,
  ...AI_COMMAND_EVAL_SEND_BREACH_NOTIFICATION_CASES,
  ...AI_COMMAND_EVAL_OPEN_COMPLIANCE_DASHBOARD_CASES,
  ...AI_COMMAND_EVAL_VIEW_PHI_ACCESS_AUDIT_CASES,
  ...AI_COMMAND_EVAL_BUSINESS_COMPLIANCE_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_BOOKING_DATE_FORMAT_CASES,
  ...AI_COMMAND_EVAL_CHECKOUT_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_TENANT_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_PACKAGE_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PROVIDER_DATE_DISPLAY_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SESSION_TIMEOUT_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_PAYMENT_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_NOTIFICATION_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_STRIPE_CURRENCY_WARNING_CASES,
  ...AI_COMMAND_EVAL_STRIPE_CHECKOUT_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_STRIPE_CHECKOUT_FAILURE_CASES,
  ...AI_COMMAND_EVAL_REPORTS_CURRENCY_CASES,
  ...AI_COMMAND_EVAL_REVENUE_KPIS_CASES,
  ...AI_COMMAND_EVAL_BUSINESS_LANGUAGES_CONFIGURE_EXPLAIN_CASES,
  ...AI_COMMAND_EVAL_BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_CASES,
  ...AI_COMMAND_EVAL_BOOKING_LANGUAGES_CASES,
  ...AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CASES,
  ...AI_COMMAND_EVAL_PACKAGE_DISPLAY_NAME_CASES,
  ...AI_COMMAND_EVAL_PACKAGE_LOCALIZED_NAMES_CONFIGURE_EXPLAIN_CASES,
  ...AI_COMMAND_EVAL_TOUR_SERVICE_CONFIGURE_EXPLAIN_CASES,
  ...AI_COMMAND_EVAL_APPLY_TOUR_PLAYBOOK_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_TOUR_DAY_SLOTS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_RECORD_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_TOUR_CALENDAR_SPAN_CASES,
  ...AI_COMMAND_EVAL_LIST_TOUR_CALENDAR_WEEK_CASES,
  ...AI_COMMAND_EVAL_LIST_UPCOMING_TOUR_DEPARTURES_CASES,
  ...AI_COMMAND_EVAL_DIAGNOSE_TOUR_CAPACITY_CASES,
  ...AI_COMMAND_EVAL_TOUR_CONSUMER_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_TOUR_CALENDAR_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_RECOMMENDATION_PRODUCT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_RECOMMENDATION_ANALYTICS_CASES,
  ...AI_COMMAND_EVAL_SUMMARIZE_RECOMMENDATION_PERFORMANCE_CASES,
  ...AI_COMMAND_EVAL_RECOMMENDATION_ANALYTICS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_CONSUMER_CHECKOUT_SUCCESS_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_ADOPTION_CASES,
  ...AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_MARKETING_GROWTH_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_TYPO_CORPUS_CASES,
  ...AI_COMMAND_EVAL_AMBIGUITY_CORPUS_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EARNINGS_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EARNINGS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EXP_2_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EXP_2_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EXP_3_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EXP_3_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_SESSION_TIMEOUT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_DATE_FORMAT_MULTILINGUAL_CASES,
  ...AI_CMD_DOMAIN_EVAL_CASES,
];

/** Live LLM regression — check+book and flexible booking classification (ai-cmd-h1.3). */
export const AI_COMMAND_EVAL_CHECK_AND_BOOK_LLM_CASES: AiCommandEvalCase[] = [
  {
    id: 'llm-en-dashboard-check-book-classify',
    prompt:
      'check who is free tomorrow evening for permanent lashes, book the nearest slot',
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'create_booking' },
  },
  {
    id: 'llm-en-dashboard-flexible-any-provider',
    prompt:
      'Book first available permanent lashes tomorrow evening on any provider',
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'create_booking' },
  },
  {
    id: 'llm-en-customer-book-nearest',
    prompt: 'book the nearest slot for massage tomorrow evening',
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'book_nearest_slot' },
  },
  {
    id: 'llm-en-customer-check-providers',
    prompt: 'check who is free tomorrow evening for permanent lashes',
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'check_providers_for_service' },
  },
  {
    id: 'llm-en-public-check-book',
    prompt:
      "who's free tomorrow evening for permanent lashes, book the nearest slot",
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'book_appointment' },
  },
  {
    id: 'llm-en-public-flexible-book',
    prompt: 'Book the soonest appointment for massage tomorrow evening',
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'book_appointment' },
  },
  {
    id: 'llm-hy-check-book-compound',
    prompt:
      'Ով է ազատ վաղը երեկոյան permanent lashes-ի համար, ամրագրիր մոտակա slot-ը',
    locale: 'hy',
    requiresLlm: true,
    expect: { action: 'create_booking' },
  },
  {
    id: 'llm-ru-flexible-book',
    prompt: 'Запиши ближайшее свободное время для массажа завтра вечером',
    locale: 'ru',
    requiresLlm: true,
    expect: { action: 'book_nearest_slot' },
  },
  {
    id: 'llm-translit-public-check-book',
    prompt:
      'kto svoboden zavtra vecherom dlya permanent lashes, zabroniruy blizhayshiy slot',
    locale: 'translit',
    requiresLlm: true,
    expect: { action: 'book_appointment' },
  },
];

/** Documented LLM-only cases (skipped in CI regression). */
export const AI_COMMAND_EVAL_LLM_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_DISAMBIGUATION_LLM_CASES,
  ...AI_COMMAND_EVAL_CHECK_AND_BOOK_LLM_CASES,
  {
    id: 'llm-hy-conditional-book',
    prompt:
      'Ամրագրիր facemassage Գևորգի հետ վաղը 09:00, եթե զբաղված է՝ Մարիայի հետ 09:00',
    locale: 'hy',
    requiresLlm: true,
    expect: { action: 'create_booking' },
  },
  {
    id: 'llm-en-bulk-cancel',
    prompt:
      'Cancel all of Maria appointments next Friday between 16:30 and 17:30',
    locale: 'en',
    requiresLlm: true,
    expect: { action: 'cancel_bookings' },
  },
];
