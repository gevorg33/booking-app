import { AI_COMMAND_EVAL_AI_CMD_DOMAIN_CASES as AI_CMD_DOMAIN_EVAL_CASES } from '../ai-cmd-eval.fixtures.js';
import { INTAKE_MUTATE_CHAIN_PROMPTS } from '../ai-intake-mutate-chain.fixtures.js';
import { CANCEL_ALL_UPCOMING_BOOKINGS_PROMPTS } from '../ai-cancel-all-upcoming-bookings.fixtures.js';
import { CANCEL_ALL_UPCOMING_BOOKINGS_MULTILINGUAL_SCENARIOS } from '../ai-cancel-all-upcoming-bookings-multilingual.fixtures.js';
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
import { buildClinicTestResultExtEvalExpectation } from '../ai-clinic-test-result-ext.eval.util.js';
export { AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CLASSIFIER_CASES } from '../ai-clinic-test-result-ext.eval.util.js';
import { AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CLASSIFIER_CASES } from '../ai-clinic-test-result-ext.eval.util.js';
import { EXPLAIN_PATIENT_CHART_PROMPTS } from '../ai-clinic-patient-chart.fixtures.js';
import {
  MULTILINGUAL_CLINIC_TEST_RESULT_EVAL_SCENARIOS,
  type ClinicTestResultEvalScenario,
} from '../ai-clinic-test-result-multilingual.fixtures.js';
import {
  MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS,
  type ClinicTestResultExtEvalScenario,
} from '../ai-clinic-test-result-ext-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES } from '../ai-product-guide.eval.util.js';
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
import {
  BOOK_LAB_FROM_ORDER_PROMPTS,
  BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS,
} from '../ai-book-lab-from-order.fixtures.js';
import { BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS } from '../ai-book-lab-from-order-multilingual.fixtures.js';
import { MULTILINGUAL_CLINIC_LAB_BOOKING_EVAL_SCENARIOS } from '../ai-clinic-lab-booking-multilingual.fixtures.js';
import { clinicLabBookingMultilingualScenarioToEvalCase } from '../ai-clinic-lab-booking-multilingual.util.js';
import { EXPLAIN_CLINIC_BOOKING_PROMPTS } from '../ai-clinic-booking.fixtures.js';
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
import { SERVICE_ONLINE_PAYMENT_PROMPTS } from '../ai-service-online-payment.fixtures.js';
import {
  EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS,
  EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
} from '../ai-service-online-payment-setup.fixtures.js';
import { AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_MULTILINGUAL_CASES } from '../ai-service-online-payment-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_STAFF_OPERATIONS_MULTILINGUAL_CASES } from '../ai-staff-operations-multilingual.eval.util.js';
import { BILLING_LOYALTY_DASHBOARD_PROMPT_FIXTURES } from '../ai-billing-loyalty-dashboard.fixtures.js';
import { CONFIGURE_STRIPE_CONNECT_PROMPTS } from '../ai-stripe-connect.fixtures.js';
import { CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS } from '../ai-checkout-defaults.fixtures.js';
import { CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS } from '../ai-service-deposit-policy.fixtures.js';
import { CONFIGURE_SERVICE_FEATURED_PROMPTS } from '../ai-configure-service-featured.fixtures.js';
import { BULK_ASSIGN_SERVICES_CATEGORY_PROMPTS } from '../ai-bulk-assign-services-category.fixtures.js';
import { CONFIGURE_PACKAGE_ONLINE_PAYMENT_PROMPTS } from '../ai-configure-package-online-payment.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_SETTINGS_PROMPTS } from '../ai-explain-multi-service-settings.fixtures.js';
import {
  EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
  EXPLAIN_PUBLIC_BOOKING_CHECKOUT_PROMPTS,
} from '../ai-explain-public-booking-checkout.fixtures.js';
import {
  AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
  AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_PROMPTS,
} from '../ai-audit-services-missing-online-payment.fixtures.js';
import { LIST_SERVICES_PAYMENT_FILTER_PROMPTS } from '../ai-list-services-payment-filters.fixtures.js';
import { CREATE_SERVICE_PREPAYMENT_PROMPTS } from '../ai-create-service-prepayment.fixtures.js';
import { CREATE_SERVICES_PREPAYMENT_PROMPTS } from '../ai-create-services-prepayment.fixtures.js';
import { UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS } from '../ai-update-service-prices-online-payment-filter.fixtures.js';
import { DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS } from '../ai-deactivate-service-category-scope.fixtures.js';
import { CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS } from '../ai-notification-settings.fixtures.js';
import { CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS } from '../ai-whatsapp-integration.fixtures.js';
import { CONFIGURE_OPENAI_INTEGRATION_PROMPTS } from '../ai-openai-integration.fixtures.js';
import {
  EXPLAIN_INTEGRATION_HEALTH_INTENT,
  EXPLAIN_INTEGRATION_HEALTH_PROMPTS,
} from '../ai-explain-integration-health.fixtures.js';
import { EXPLAIN_TENANT_APP_INSTALL_PROMPTS } from '../ai-tenant-app-install.fixtures.js';
import { REGENERATE_TENANT_APP_INSTALL_QR_PROMPTS } from '../ai-tenant-app-install.fixtures.js';
import { CREATE_PROMO_CODE_PROMPTS } from '../ai-create-promo-code.fixtures.js';
import { CONFIGURE_LOYALTY_SETTINGS_PROMPTS } from '../ai-configure-loyalty-settings.fixtures.js';
import { UPDATE_SERVICE_DURATION_BUFFER_PROMPTS } from '../ai-service-duration-buffer.fixtures.js';
import { AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_MULTILINGUAL_CASES } from '../ai-billing-loyalty-dashboard-multilingual.eval.util.js';
import { WAITLIST_DASHBOARD_PROMPT_FIXTURES } from '../ai-waitlist-dashboard.fixtures.js';
import { AI_COMMAND_EVAL_WAITLIST_DASHBOARD_MULTILINGUAL_CASES } from '../ai-waitlist-dashboard-multilingual.eval.util.js';
import { PROVIDER_ONBOARDING_COMPOUND_PROMPTS } from '../ai-provider-onboarding-compound.fixtures.js';
import {
  SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS,
  SETUP_SALON_CHECKOUT_RESCUE_SCENARIOS,
} from '../ai-setup-salon-checkout-compound.fixtures.js';
import {
  CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS,
  CONFIGURE_SERVICES_PAYMENT_MATRIX_RESCUE_SCENARIOS,
} from '../ai-configure-services-payment-matrix-compound.fixtures.js';
import {
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS,
  CASH_AND_ONLINE_PAYMENT_RESCUE_SCENARIOS,
} from '../ai-cash-online-payment-compound.fixtures.js';
import {
  DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS,
  DECLINE_ONLINE_PAYMENT_CATEGORY_RESCUE_SCENARIOS,
} from '../ai-decline-online-payment-category-compound.fixtures.js';
import {
  ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS,
  ONBOARD_SALON_NOTIFICATIONS_RESCUE_SCENARIOS,
} from '../ai-onboard-salon-notifications-compound.fixtures.js';
import {
  LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS,
  LAUNCH_CONSUMER_APP_GROWTH_RESCUE_SCENARIOS,
} from '../ai-launch-consumer-app-growth-compound.fixtures.js';
import { AI_COMMAND_EVAL_PROVIDER_ONBOARDING_MULTILINGUAL_CASES } from '../ai-provider-onboarding-compound-multilingual.eval.util.js';
import {
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS,
  CLINIC_LAB_DAY_CLOSE_RESCUE_SCENARIOS,
} from '../ai-clinic-lab-day-close-compound.fixtures.js';
import {
  CLINIC_LAB_REVIEW_COMPOUND_PROMPTS,
  CLINIC_LAB_REVIEW_RESCUE_SCENARIOS,
} from '../ai-clinic-lab-review-compound.fixtures.js';
import {
  BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  BUDGET_DISCOVER_AND_BOOK_RESCUE_SCENARIOS,
} from '../ai-budget-discover-and-book-compound.fixtures.js';
import { AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_CASES } from '../ai-budget-discover-and-book-compound-multilingual.eval.util.js';
import {
  AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_COMPOUND_CASES,
  AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_RESCUE_CASES,
} from '../ai-intake-lab-book-pay-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_COMPOUND_CASES,
  AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_RESCUE_CASES,
} from '../ai-tour-group-checkout-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_COMPOUND_CASES,
  AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_RESCUE_CASES,
} from '../ai-provider-same-day-multi-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_COMPOUND_CASES,
  AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_RESCUE_CASES,
} from '../ai-discover-book-and-pay-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_REBOOK_AND_PAY_COMPOUND_CASES,
  AI_COMMAND_EVAL_REBOOK_AND_PAY_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_REBOOK_AND_PAY_RESCUE_CASES,
} from '../ai-rebook-and-pay-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_COMPOUND_CASES,
  AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_RESCUE_CASES,
} from '../ai-subscription-first-visit-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_COMPOUND_CASES,
  AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_RESCUE_CASES,
} from '../ai-results-then-rebook-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_CANCEL_AND_REBOOK_COMPOUND_CASES,
  AI_COMMAND_EVAL_CANCEL_AND_REBOOK_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CANCEL_AND_REBOOK_RESCUE_CASES,
} from '../ai-cancel-and-rebook-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_CASES,
  AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_CASES,
} from '../ai-cancel-package-rebook-single-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_COMPOUND_CASES,
  AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_RESCUE_CASES,
} from '../ai-gift-card-checkout-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_MULTI_SERVICE_DAY_COMPOUND_CASES,
  AI_COMMAND_EVAL_MULTI_SERVICE_DAY_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_MULTI_SERVICE_DAY_RESCUE_CASES,
} from '../ai-multi-service-day-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_COMPOUND_CASES,
  AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_RESCUE_CASES,
} from '../ai-guest-book-and-manage-compound.eval.util.js';
import {
  AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_COMPOUND_CASES,
  AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_RESCUE_CASES,
} from '../ai-guest-pay-cash-manage-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_COMPOUND_CASES,
  AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_RESCUE_CASES,
} from '../ai-intake-lab-book-pay-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_COMPOUND_CASES,
  AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_RESCUE_CASES,
} from '../ai-tour-group-checkout-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_COMPOUND_CASES,
  AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_RESCUE_CASES,
} from '../ai-provider-same-day-multi-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_COMPOUND_CASES,
  AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_RESCUE_CASES,
} from '../ai-discover-book-and-pay-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_REBOOK_AND_PAY_COMPOUND_CASES,
  AI_COMMAND_EVAL_REBOOK_AND_PAY_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_REBOOK_AND_PAY_RESCUE_CASES,
} from '../ai-rebook-and-pay-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_COMPOUND_CASES,
  AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_RESCUE_CASES,
} from '../ai-subscription-first-visit-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_COMPOUND_CASES,
  AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_RESCUE_CASES,
} from '../ai-results-then-rebook-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_CANCEL_AND_REBOOK_COMPOUND_CASES,
  AI_COMMAND_EVAL_CANCEL_AND_REBOOK_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CANCEL_AND_REBOOK_RESCUE_CASES,
} from '../ai-cancel-and-rebook-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_CASES,
  AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_CASES,
} from '../ai-cancel-package-rebook-single-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_COMPOUND_CASES,
  AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_RESCUE_CASES,
} from '../ai-gift-card-checkout-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_MULTI_SERVICE_DAY_COMPOUND_CASES,
  AI_COMMAND_EVAL_MULTI_SERVICE_DAY_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_MULTI_SERVICE_DAY_RESCUE_CASES,
} from '../ai-multi-service-day-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_COMPOUND_CASES,
  AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_RESCUE_CASES,
} from '../ai-guest-book-and-manage-compound.eval.util.js';
export {
  AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_COMPOUND_CASES,
  AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_MULTILINGUAL_CASES,
  AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_RESCUE_CASES,
} from '../ai-guest-pay-cash-manage-compound.eval.util.js';
import {
  RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS,
  RANK_DISCOVER_AND_BOOK_RESCUE_SCENARIOS,
} from '../ai-rank-discover-and-book-compound.fixtures.js';
import { AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_MULTILINGUAL_CASES } from '../ai-rank-discover-and-book-compound-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_CASES } from '../ai-clinic-lab-day-close-compound-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_MULTILINGUAL_CASES } from '../ai-clinic-lab-review-compound-multilingual.eval.util.js';
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
import { LOCATIONS_RESCUE_SCENARIOS } from '../ai-locations.fixtures.js';
import { RETAIL_FINANCE_E2E146_RESCUE_SCENARIOS } from '../ai-retail-finance-dashboard-classifier.fixtures.js';
import { E2E137_ROUTING_RESCUE_SCENARIOS } from '../ai-e2e137-routing.fixtures.js';
import { E2E136_DELETE_SCHEDULE_BLOCK_SCENARIOS } from '../ai-e2e136-clear-schedule.fixtures.js';
import { E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS } from '../ai-e2e134-guest-manage-link.fixtures.js';
import { E2E133_TOUR_VS_CLINIC_SCENARIOS } from '../ai-e2e133-tour-vs-clinic.fixtures.js';
import { E2E132_CANCEL_POLICY_CASUAL_SCENARIOS } from '../ai-e2e132-cancel-policy-casual.fixtures.js';
import { E2E131_CROSS_SURFACE_HALLUCINATION_SCENARIOS } from '../ai-e2e131-cross-surface-hallucination.fixtures.js';
import { E2E130_GIFT_CARD_PURCHASE_SCENARIOS } from '../ai-e2e130-gift-card-purchase-vs-multi.fixtures.js';
import { E2E129_EXPLAIN_MY_SUBSCRIPTION_SCENARIOS } from '../ai-e2e129-explain-my-subscription.fixtures.js';
import { E2E159_OWNER_CANCEL_ALERT_SCENARIOS } from '../ai-e2e159-owner-cancel-alert.fixtures.js';
import { E2E252_OWNER_RESCHEDULE_ALERT_SCENARIOS } from '../ai-e2e252-owner-reschedule-alert.fixtures.js';
import { E2E157_CREATE_PACKAGE_SCENARIOS } from '../ai-e2e157-create-package.fixtures.js';
import { LIST_SERVICE_RESOURCE_REQUIREMENTS_SCENARIOS } from '../ai-schedule-resources-dashboard-classifier.fixtures.js';
import { CATALOG_E2E144_DEACTIVATE_SERVICE_SCENARIOS } from '../ai-catalog-dashboard-classifier.fixtures.js';

const E2E154_UNSCOPED_BOOKING_COUNT_SCENARIOS = [
  {
    id: 'e2e154-bookings-in-total',
    prompt: 'How many bookings do I have in total?',
  },
  {
    id: 'e2e154-appointments-altogether',
    prompt: 'How many appointments do I have altogether?',
  },
] as const;

const E2E153_UNSCOPED_CUSTOMER_COUNT_SCENARIOS = [
  {
    id: 'e2e153-how-many-customers',
    prompt: 'How many customers do I have?',
  },
  {
    id: 'e2e153-customers-in-total',
    prompt: 'How many customers do I have in total?',
  },
  {
    id: 'e2e153-total-number-of-customers',
    prompt: 'What is my total number of customers?',
  },
] as const;

const E2E152_PENDING_AI_AGENT_TASKS_SCENARIOS = [
  {
    id: 'e2e152-show-me-pending-ai-agent-tasks',
    prompt: 'Show me pending AI agent tasks',
  },
  {
    id: 'e2e152-show-pending-agent-tasks',
    prompt: 'Show pending agent tasks',
  },
] as const;

const E2E151_CREATE_SERVICE_CATEGORY_SCENARIOS = [
  {
    id: 'e2e151-add-new-service-category-called',
    prompt: 'Add a new service category called Wellness',
    categoryName: 'Wellness',
  },
  {
    id: 'e2e151-create-service-category-named',
    prompt: 'Create a service category named Spa',
    categoryName: 'Spa',
  },
  // e2e-bug.251 — "catalog category" synonym must also rescue to create.
  {
    id: 'e2e251-add-new-catalog-category-named',
    prompt: 'Add a new catalog category named QA Nails',
    categoryName: 'QA Nails',
  },
  {
    id: 'e2e251-create-catalog-category-named',
    prompt: 'Create a catalog category named Spa Treatments',
    categoryName: 'Spa Treatments',
  },
] as const;

const E2E148_CREATE_PRODUCT_PRICE_SCENARIOS = [
  {
    id: 'e2e148-priced-at-dollars',
    prompt: 'Add a retail product called QA Test Product priced at 5 dollars',
    price: 5,
    productName: 'QA Test Product',
  },
  {
    id: 'e2e148-price-dollar-sign',
    prompt: 'Add a retail product called QA Test Product 2, price $5',
    price: 5,
    productName: 'QA Test Product 2',
  },
] as const;
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
import { EXPLAIN_APPOINTMENT_TAX_MULTILINGUAL_PROMPTS } from '../ai-appointment-tax-multilingual.fixtures.js';
import { PROVIDER_EXPLAIN_PAYMENT_STATUS_PROMPT_SCENARIOS } from '../ai-provider-explain-payment-status.fixtures.js';
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
import { DATA_RIGHTS_MULTILINGUAL_SCENARIOS } from '../ai-data-rights-multilingual.fixtures.js';
import { SUBSCRIPTION_USAGE_PROMPTS } from '../ai-subscription-usage.fixtures.js';
import { SUBSCRIPTION_USAGE_MULTILINGUAL_SCENARIOS } from '../ai-subscription-usage-multilingual.fixtures.js';
import { GIFT_CARD_MODIFY_PROMPTS } from '../ai-gift-card-modify.fixtures.js';
import { GIFT_CARD_MODIFY_MULTILINGUAL_SCENARIOS } from '../ai-gift-card-modify-multilingual.fixtures.js';
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
import { EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_PROMPTS } from '../ai-tour-booking-record.fixtures.js';
import { EXPLAIN_TOUR_MEETING_POINT_PROMPTS } from '../ai-tour-meeting-point.fixtures.js';
import { EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS } from '../ai-tour-meeting-point-multilingual.fixtures.js';
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
import {
  MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS,
  type CheckoutRecommendationsEvalScenario,
} from '../ai-checkout-recommendations-multilingual.fixtures.js';
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
import { FIND_MY_SAVED_SALONS_PROMPTS } from '../ai-find-my-saved-salons.fixtures.js';
import { FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS } from '../ai-find-my-saved-salons-multilingual.fixtures.js';
import { SWITCH_SALON_TENANT_PROMPTS } from '../ai-switch-salon-tenant.fixtures.js';
import { SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS } from '../ai-switch-salon-tenant-multilingual.fixtures.js';
import {
  GROWTH_LOOPS_CUSTOMER_PROMPTS,
  MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS,
} from '../ai-growth-loops-customer.fixtures.js';
import { CANCEL_MY_BOOKING_PROMPTS } from '../ai-cancel-my-booking.util.js';
import { RESCHEDULE_MY_BOOKING_PROMPTS } from '../ai-reschedule-my-booking.util.js';
import { CHANGE_PROVIDER_ON_RESCHEDULE_PROMPTS } from '../ai-change-provider-on-reschedule-customer.util.js';
import { PAY_ONLINE_CHECKOUT_PROMPTS } from '../ai-pay-online-checkout.util.js';
import {
  EXPLAIN_WHY_STRIPE_REQUIRED_PROMPTS,
  PUBLIC_CATALOG_PREPAYMENT_PROMPTS,
} from '../ai-explain-prepayment.util.js';
import { MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS } from '../ai-multi-service-customer-public.util.js';
import { SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS } from '../ai-subscription-membership-customer.util.js';
import { SELECT_SUBSCRIPTION_PLAN_PROMPTS } from '../ai-select-subscription-plan-customer.util.js';
import { DISCOVER_SUBSCRIPTION_PLANS_PROMPTS } from '../ai-discover-subscription-plans-customer.util.js';
import { DISCOVER_SUBSCRIPTION_PLANS_MULTILINGUAL_SCENARIOS } from '../ai-discover-subscription-plans-multilingual.fixtures.js';
import { PROMO_CODE_HELP_PROMPTS } from '../ai-promo-code-help-customer-public.util.js';
import { APPLY_PROMO_CODE_CHECKOUT_MULTILINGUAL_SCENARIOS } from '../ai-apply-promo-code-checkout-multilingual.fixtures.js';
import { APPLY_PROMO_CODE_CHECKOUT_PROMPTS } from '../ai-apply-promo-code-checkout.util.js';
import {
  APPLY_LOYALTY_AT_CHECKOUT_PROMPTS,
  APPLY_LOYALTY_AT_CHECKOUT_RESCUE_SCENARIOS,
} from '../ai-apply-loyalty-at-checkout.fixtures.js';
import { APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_SCENARIOS } from '../ai-apply-loyalty-at-checkout-multilingual.fixtures.js';
import { EXPLAIN_SERVICE_PRICE_PROMPTS } from '../ai-explain-service-price.util.js';
import { EXPLAIN_SERVICE_PRICE_MULTILINGUAL_SCENARIOS } from '../ai-explain-service-price-multilingual.fixtures.js';
import { EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS } from '../ai-explain-payment-options-for-service.util.js';
import { EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_SCENARIOS } from '../ai-explain-payment-options-for-service-multilingual.fixtures.js';
import { FIND_SOONEST_APPOINTMENT_PROMPTS } from '../ai-find-soonest-appointment.util.js';
import { FIND_SOONEST_APPOINTMENT_MULTILINGUAL_SCENARIOS } from '../ai-find-soonest-appointment-multilingual.fixtures.js';
import { COMPARE_SERVICES_PROMPTS } from '../ai-compare-services.util.js';
import { COMPARE_SERVICES_MULTILINGUAL_SCENARIOS } from '../ai-compare-services-multilingual.fixtures.js';
import { FILTER_SERVICES_NO_PREPAYMENT_PROMPTS } from '../ai-filter-services-no-prepayment.util.js';
import { EXPLAIN_AMOUNT_DUE_NOW_PROMPTS } from '../ai-explain-amount-due-now.util.js';
import { EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_SCENARIOS } from '../ai-explain-amount-due-now-multilingual.fixtures.js';
import { EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS } from '../ai-explain-guest-checkout-fields.fixtures.js';
import {
  EXPLAIN_WHY_SIGN_IN_PROMPTS,
  EXPLAIN_WHY_SIGN_IN_RESCUE_SCENARIOS,
} from '../ai-explain-why-sign-in.fixtures.js';
import {
  SIGN_IN_TO_MANAGE_BOOKING_PROMPTS,
  SIGN_IN_TO_MANAGE_BOOKING_RESCUE_SCENARIOS,
} from '../ai-sign-in-to-manage-booking.fixtures.js';
import { SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS } from '../ai-sign-in-to-manage-booking-multilingual.fixtures.js';
import { EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS } from '../ai-explain-why-sign-in-multilingual.fixtures.js';
import { RESUME_PENDING_PAYMENT_PROMPTS } from '../ai-resume-pending-payment.fixtures.js';
import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS } from '../ai-diagnose-stripe-checkout-failure.fixtures.js';
import { DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_SCENARIOS } from '../ai-diagnose-stripe-checkout-failure-multilingual.fixtures.js';
import { PAY_AT_VENUE_FALLBACK_PROMPTS } from '../ai-pay-at-venue-fallback.fixtures.js';
import { PAY_AT_VENUE_FALLBACK_MULTILINGUAL_SCENARIOS } from '../ai-pay-at-venue-fallback-multilingual.fixtures.js';
import { RESUME_BOOKING_DRAFT_PROMPTS } from '../ai-resume-booking-draft.fixtures.js';
import { RESUME_BOOKING_DRAFT_MULTILINGUAL_SCENARIOS } from '../ai-resume-booking-draft-multilingual.fixtures.js';
import { EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS } from '../ai-explain-slot-no-longer-available.fixtures.js';
import { EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_SCENARIOS } from '../ai-explain-slot-no-longer-available-multilingual.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS } from '../ai-explain-multi-service-payment-return.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_SCENARIOS } from '../ai-explain-multi-service-payment-return-multilingual.fixtures.js';
import { RETRY_FAILED_NETWORK_ACTION_PROMPTS } from '../ai-retry-failed-network-action.fixtures.js';
import { RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_SCENARIOS } from '../ai-retry-failed-network-action-multilingual.fixtures.js';
import { EXPLAIN_VOICE_INPUT_PROMPTS } from '../ai-explain-voice-input.fixtures.js';
import { EXPLAIN_VOICE_INPUT_MULTILINGUAL_SCENARIOS } from '../ai-explain-voice-input-multilingual.fixtures.js';
import { SPEAK_ASSISTANT_REPLY_PROMPTS } from '../ai-speak-assistant-reply.fixtures.js';
import { SPEAK_ASSISTANT_REPLY_MULTILINGUAL_SCENARIOS } from '../ai-speak-assistant-reply-multilingual.fixtures.js';
import { GIVE_AI_FEEDBACK_PROMPTS } from '../ai-give-ai-feedback.fixtures.js';
import { GIVE_AI_FEEDBACK_MULTILINGUAL_SCENARIOS } from '../ai-give-ai-feedback-multilingual.fixtures.js';
import { EXPLAIN_RTL_LAYOUT_PROMPTS } from '../ai-explain-rtl-layout.fixtures.js';
import { EXPLAIN_RTL_LAYOUT_MULTILINGUAL_SCENARIOS } from '../ai-explain-rtl-layout-multilingual.fixtures.js';
import { RESUME_PENDING_PAYMENT_MULTILINGUAL_SCENARIOS } from '../ai-resume-pending-payment-multilingual.fixtures.js';
import { EXPLAIN_GUEST_CHECKOUT_FIELDS_MULTILINGUAL_SCENARIOS } from '../ai-explain-guest-checkout-fields-multilingual.fixtures.js';
import { FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS } from '../ai-fix-checkout-validation-error.fixtures.js';
import { FIX_CHECKOUT_VALIDATION_ERROR_MULTILINGUAL_SCENARIOS } from '../ai-fix-checkout-validation-error-multilingual.fixtures.js';
import { CONFIRM_MY_BOOKING_DETAILS_PROMPTS } from '../ai-confirm-my-booking-details.fixtures.js';
import { CONFIRM_MY_BOOKING_DETAILS_MULTILINGUAL_SCENARIOS } from '../ai-confirm-my-booking-details-multilingual.fixtures.js';
import { ADD_BOOKING_TO_CALENDAR_PROMPTS } from '../ai-add-booking-to-calendar.fixtures.js';
import { ADD_BOOKING_TO_CALENDAR_MULTILINGUAL_SCENARIOS } from '../ai-add-booking-to-calendar-multilingual.fixtures.js';
import { GET_DIRECTIONS_TO_SALON_PROMPTS } from '../ai-get-directions-to-salon.fixtures.js';
import { GET_DIRECTIONS_TO_SALON_MULTILINGUAL_SCENARIOS } from '../ai-get-directions-to-salon-multilingual.fixtures.js';
import { EXPLAIN_PREPARATION_NOTES_PROMPTS } from '../ai-explain-preparation-notes.fixtures.js';
import { EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_SCENARIOS } from '../ai-explain-preparation-notes-multilingual.fixtures.js';
import { BOOK_ANOTHER_SERVICE_PROMPTS } from '../ai-book-another-service.fixtures.js';
import { BOOK_ANOTHER_SERVICE_MULTILINGUAL_SCENARIOS } from '../ai-book-another-service-multilingual.fixtures.js';
import { SHARE_MY_BOOKING_PROMPTS } from '../ai-share-my-booking.fixtures.js';
import { SHARE_MY_BOOKING_MULTILINGUAL_SCENARIOS } from '../ai-share-my-booking-multilingual.fixtures.js';
import { LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS } from '../ai-list-my-upcoming-appointments.fixtures.js';
import { LIST_MY_UPCOMING_APPOINTMENTS_MULTILINGUAL_SCENARIOS } from '../ai-list-my-upcoming-appointments-multilingual.fixtures.js';
import { EXPLAIN_CANCEL_POLICY_PROMPTS } from '../ai-explain-cancel-policy.fixtures.js';
import { EXPLAIN_CANCEL_POLICY_MULTILINGUAL_SCENARIOS } from '../ai-explain-cancel-policy-multilingual.fixtures.js';
import { EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS } from '../ai-explain-deposit-forfeiture.fixtures.js';
import { EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS } from '../ai-explain-deposit-forfeiture-multilingual.fixtures.js';
import { FIND_SERVICES_UNDER_BUDGET_PROMPTS } from '../ai-find-services-under-budget.fixtures.js';
import { FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_SCENARIOS } from '../ai-find-services-under-budget-multilingual.fixtures.js';
import { FIND_EVENING_WEEKEND_SLOTS_PROMPTS } from '../ai-find-evening-weekend-slots.fixtures.js';
import { FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_SCENARIOS } from '../ai-find-evening-weekend-slots-multilingual.fixtures.js';
import { EXPLAIN_SALON_PROFILE_PROMPTS } from '../ai-explain-salon-profile.fixtures.js';
import { EXPLAIN_SALON_PROFILE_MULTILINGUAL_SCENARIOS } from '../ai-explain-salon-profile-multilingual.fixtures.js';
import {
  EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS,
  EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS,
} from '../ai-explain-manage-booking-page.fixtures.js';
import { EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS } from '../ai-explain-manage-booking-page-multilingual.fixtures.js';
import { EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS } from '../ai-explain-package-visit-rules-multilingual.fixtures.js';
import { EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS } from '../ai-explain-package-visit-rules.fixtures.js';
import { DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS } from '../ai-dismiss-recommendations-multilingual.fixtures.js';
import { DISMISS_RECOMMENDATIONS_PROMPTS } from '../ai-dismiss-recommendations.fixtures.js';
import {
  BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS,
  BUY_GIFT_CARD_FOR_SOMEONE_RESCUE_SCENARIOS,
} from '../ai-buy-gift-card-for-someone.fixtures.js';
import { BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS } from '../ai-buy-gift-card-for-someone-multilingual.fixtures.js';
import {
  EXPLAIN_LOYALTY_POINTS_PROMPTS,
  EXPLAIN_LOYALTY_POINTS_RESCUE_SCENARIOS,
} from '../ai-explain-loyalty-points.fixtures.js';
import { EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_SCENARIOS } from '../ai-explain-loyalty-points-multilingual.fixtures.js';
import {
  EXPLAIN_MY_SUBSCRIPTION_PROMPTS,
  EXPLAIN_MY_SUBSCRIPTION_RESCUE_SCENARIOS,
} from '../ai-explain-my-subscription.fixtures.js';
import { EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_SCENARIOS } from '../ai-explain-my-subscription-multilingual.fixtures.js';
import {
  MANAGE_NOTIFICATION_PREFERENCES_PROMPTS,
  MANAGE_NOTIFICATION_PREFERENCES_RESCUE_SCENARIOS,
} from '../ai-manage-notification-preferences.fixtures.js';
import { MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS } from '../ai-manage-notification-preferences-multilingual.fixtures.js';
import {
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS,
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS,
} from '../ai-customer-enable-push-notifications.fixtures.js';
import { CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from '../ai-customer-enable-push-notifications-multilingual.fixtures.js';
import {
  EXPLAIN_PUSH_PERMISSION_PROMPTS,
  EXPLAIN_PUSH_PERMISSION_RESCUE_SCENARIOS,
} from '../ai-explain-push-permission.fixtures.js';
import { EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS } from '../ai-explain-push-permission-multilingual.fixtures.js';
import {
  EXPLAIN_OFFLINE_MODE_PROMPTS,
  EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS,
} from '../ai-explain-offline-mode.fixtures.js';
import { EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS } from '../ai-explain-offline-mode-multilingual.fixtures.js';
import {
  EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS,
  EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS,
} from '../ai-explain-app-update-required.fixtures.js';
import { EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS } from '../ai-explain-app-update-required-multilingual.fixtures.js';
import {
  EXPLAIN_ANALYTICS_CONSENT_PROMPTS,
  EXPLAIN_ANALYTICS_CONSENT_RESCUE_SCENARIOS,
} from '../ai-explain-analytics-consent.fixtures.js';
import { EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS } from '../ai-explain-analytics-consent-multilingual.fixtures.js';
import {
  EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS,
  EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS,
} from '../ai-explain-home-screen-widget.fixtures.js';
import { EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS } from '../ai-explain-home-screen-widget-multilingual.fixtures.js';
import {
  EXPLAIN_PATIENT_ALERT_PROMPTS,
  EXPLAIN_PATIENT_ALERT_RESCUE_SCENARIOS,
} from '../ai-explain-patient-alert.fixtures.js';
import { EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS } from '../ai-explain-patient-alert-multilingual.fixtures.js';
import {
  EXPLAIN_MY_NOTIFICATIONS_PROMPTS,
  EXPLAIN_MY_NOTIFICATIONS_RESCUE_SCENARIOS,
} from '../ai-explain-my-notifications.fixtures.js';
import { EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from '../ai-explain-my-notifications-multilingual.fixtures.js';
import {
  UPDATE_MY_PROFILE_PROMPTS,
  UPDATE_MY_PROFILE_RESCUE_SCENARIOS,
} from '../ai-update-my-profile.fixtures.js';
import { UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS } from '../ai-update-my-profile-multilingual.fixtures.js';
import {
  HOW_TO_DOWNLOAD_APP_PROMPTS,
  HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS,
} from '../ai-how-to-download-app.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS } from '../ai-how-to-download-app-multilingual.fixtures.js';
import {
  EXPLAIN_MULTI_SERVICE_CART_PROMPTS,
  EXPLAIN_MULTI_SERVICE_CART_RESCUE_SCENARIOS,
} from '../ai-explain-multi-service-cart.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS } from '../ai-explain-multi-service-cart-multilingual.fixtures.js';
import {
  BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS,
  BOOK_PACKAGE_WITH_NEAREST_SLOT_RESCUE_SCENARIOS,
} from '../ai-book-package-with-nearest-slot.fixtures.js';
import { BOOK_PACKAGE_WITH_NEAREST_SLOT_MULTILINGUAL_SCENARIOS } from '../ai-book-package-with-nearest-slot-multilingual.fixtures.js';
import {
  BOOK_LAB_COLLECTION_NEAREST_PROMPTS,
  BOOK_LAB_COLLECTION_NEAREST_RESCUE_SCENARIOS,
} from '../ai-book-lab-collection-nearest.fixtures.js';
import { BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_SCENARIOS } from '../ai-book-lab-collection-nearest-multilingual.fixtures.js';
import {
  BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS,
  BOOK_TOUR_NEAREST_DEPARTURE_RESCUE_SCENARIOS,
} from '../ai-book-tour-nearest-departure.fixtures.js';
import { BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_SCENARIOS } from '../ai-book-tour-nearest-departure-multilingual.fixtures.js';
import {
  EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS,
  EXPLAIN_CLINIC_BOOKING_FIELDS_RESCUE_SCENARIOS,
} from '../ai-explain-clinic-booking-fields.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS } from '../ai-explain-clinic-booking-fields-multilingual.fixtures.js';
import {
  EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS,
  EXPLAIN_PUBLIC_INTAKE_FORM_RESCUE_SCENARIOS,
} from '../ai-explain-public-intake-form.fixtures.js';
import { EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS } from '../ai-explain-public-intake-form-multilingual.fixtures.js';
import {
  COMPLETE_INTAKE_AND_BOOK_PROMPTS,
  COMPLETE_INTAKE_AND_BOOK_RESCUE_SCENARIOS,
} from '../ai-complete-intake-and-book.fixtures.js';
import { COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_SCENARIOS } from '../ai-complete-intake-and-book-multilingual.fixtures.js';
import {
  BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS,
  BOOK_WITH_GIFT_CARD_PROMPTS,
  BOOK_WITH_GIFT_CARD_RESCUE_SCENARIOS,
} from '../ai-book-with-gift-card.fixtures.js';
import { BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS } from '../ai-book-with-gift-card-multilingual.fixtures.js';
import { GET_MANAGE_LINK_PROMPTS } from '../ai-get-manage-link.fixtures.js';
import { GET_MANAGE_LINK_MULTILINGUAL_SCENARIOS } from '../ai-get-manage-link-multilingual.fixtures.js';
import {
  RECOVER_LOST_MANAGE_LINK_PROMPTS,
  RECOVER_LOST_MANAGE_LINK_RESCUE_SCENARIOS,
} from '../ai-recover-lost-manage-link.fixtures.js';
import { RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS } from '../ai-recover-lost-manage-link-multilingual.fixtures.js';
import { NOTIFY_RUNNING_LATE_PROMPTS } from '../ai-notify-running-late.fixtures.js';
import { NOTIFY_RUNNING_LATE_MULTILINGUAL_SCENARIOS } from '../ai-notify-running-late-multilingual.fixtures.js';
import { LEAVE_VISIT_REVIEW_PROMPTS } from '../ai-leave-visit-review.fixtures.js';
import { LEAVE_VISIT_REVIEW_MULTILINGUAL_SCENARIOS } from '../ai-leave-visit-review-multilingual.fixtures.js';
import { EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS } from '../ai-explain-post-visit-review-prompt.fixtures.js';
import { EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_SCENARIOS } from '../ai-explain-post-visit-review-prompt-multilingual.fixtures.js';
import { EXPLAIN_SHARE_REWARD_PROMPTS } from '../ai-explain-share-reward.fixtures.js';
import { EXPLAIN_SHARE_REWARD_MULTILINGUAL_SCENARIOS } from '../ai-explain-share-reward-multilingual.fixtures.js';
import { SIGN_IN_AFTER_BOOKING_PROMPTS } from '../ai-sign-in-after-booking.fixtures.js';
import { SIGN_IN_AFTER_BOOKING_MULTILINGUAL_SCENARIOS } from '../ai-sign-in-after-booking-multilingual.fixtures.js';
import { REPORT_BOOKING_PROBLEM_PROMPTS } from '../ai-report-booking-problem.fixtures.js';
import { REPORT_BOOKING_PROBLEM_MULTILINGUAL_SCENARIOS } from '../ai-report-booking-problem-multilingual.fixtures.js';
import {
  CHECK_WAITLIST_STATUS_PROMPTS,
  CUSTOMER_WAITLIST_RESCUE_SCENARIOS,
  JOIN_WAITLIST_PROMPTS,
} from '../ai-customer-waitlist.fixtures.js';
import { CUSTOMER_WAITLIST_MULTILINGUAL_SCENARIOS } from '../ai-customer-waitlist-multilingual.fixtures.js';
import {
  REBOOK_LAST_APPOINTMENT_PROMPTS,
  REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS,
} from '../ai-rebook-last-appointment.fixtures.js';
import { REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS } from '../ai-rebook-last-appointment-multilingual.fixtures.js';
import { FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_SCENARIOS } from '../ai-filter-services-no-prepayment-multilingual.fixtures.js';
import { EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS } from '../ai-explain-business-hours-and-location.util.js';
import { EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_SCENARIOS } from '../ai-explain-business-hours-and-location-multilingual.fixtures.js';
import { EXPLAIN_PROVIDER_SPECIALTY_PROMPTS } from '../ai-explain-provider-specialty.util.js';
import { EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_SCENARIOS } from '../ai-explain-provider-specialty-multilingual.fixtures.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS } from '../ai-explain-any-provider-option.fixtures.js';
import { PICK_PROVIDER_FOR_SERVICE_PROMPTS } from '../ai-pick-provider-for-service.fixtures.js';
import { SWITCH_PROVIDER_SAME_TIME_PROMPTS } from '../ai-switch-provider-same-time.fixtures.js';
import { SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS } from '../ai-switch-provider-same-time-multilingual.fixtures.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS } from '../ai-explain-professional-profile.fixtures.js';
import { EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS } from '../ai-explain-professional-profile-multilingual.fixtures.js';
import { PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS } from '../ai-pick-provider-for-service-multilingual.fixtures.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS } from '../ai-explain-provider-availability.fixtures.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS } from '../ai-explain-provider-availability-multilingual.fixtures.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS } from '../ai-explain-any-provider-option-multilingual.fixtures.js';
import { LOYALTY_POINTS_BALANCE_PROMPTS } from '../ai-loyalty-points-balance-customer.util.js';
import { PRIVACY_GDPR_CUSTOMER_PROMPTS } from '../ai-privacy-gdpr-customer.util.js';
import { PRIVACY_GDPR_MULTILINGUAL_SCENARIOS } from '../ai-privacy-gdpr-multilingual.fixtures.js';
import { GIFT_CARD_CANCEL_CUSTOMER_PROMPTS } from '../ai-gift-card-cancel-customer.util.js';
import {
  TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS,
  TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS,
} from '../ai-track-physical-gift-card-order.fixtures.js';
import { TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS } from '../ai-track-physical-gift-card-order-multilingual.fixtures.js';
import {
  CLAIM_GIFT_CARD_BALANCE_PROMPTS,
  CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS,
} from '../ai-claim-gift-card-balance.fixtures.js';
import { CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS } from '../ai-claim-gift-card-balance-multilingual.fixtures.js';
import {
  EXPLAIN_PACKAGE_SAVINGS_PROMPTS,
  EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS,
} from '../ai-explain-package-savings.fixtures.js';
import { EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS } from '../ai-explain-package-savings-multilingual.fixtures.js';
import {
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS,
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_RESCUE_SCENARIOS,
} from '../ai-explain-subscription-vs-one-time.fixtures.js';
import { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS } from '../ai-explain-subscription-vs-one-time-multilingual.fixtures.js';
import {
  EXPLAIN_LAB_PREP_PROMPTS,
  EXPLAIN_LAB_PREP_RESCUE_SCENARIOS,
} from '../ai-explain-lab-prep.fixtures.js';
import { EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS } from '../ai-explain-lab-prep-multilingual.fixtures.js';
import {
  TRACK_LAB_ORDER_STATUS_PROMPTS,
  TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS,
} from '../ai-track-lab-order-status.fixtures.js';
import { TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS } from '../ai-track-lab-order-status-multilingual.fixtures.js';
import {
  LIST_MY_DOCUMENTS_PROMPTS,
  LIST_MY_DOCUMENTS_RESCUE_SCENARIOS,
} from '../ai-list-my-documents.fixtures.js';
import { LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS } from '../ai-list-my-documents-multilingual.fixtures.js';
import {
  EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS,
  EXPLAIN_ABNORMAL_RESULT_FLAG_RESCUE_SCENARIOS,
} from '../ai-explain-abnormal-result-flag.fixtures.js';
import { EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS } from '../ai-explain-abnormal-result-flag-multilingual.fixtures.js';
import {
  NOTIFY_WHEN_RESULTS_READY_PROMPTS,
  NOTIFY_WHEN_RESULTS_READY_RESCUE_SCENARIOS,
} from '../ai-notify-when-results-ready.fixtures.js';
import { NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS } from '../ai-notify-when-results-ready-multilingual.fixtures.js';
import { CANCEL_PACKAGE_VISIT_SELF_PROMPTS } from '../ai-cancel-package-visit-self.fixtures.js';
import { CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS } from '../ai-cancel-package-visit-self-multilingual.fixtures.js';
import { RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS } from '../ai-reschedule-package-visit-self.fixtures.js';
import { RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS } from '../ai-reschedule-package-visit-self-multilingual.fixtures.js';
import { LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS } from '../ai-list-my-package-visits-customer.util.js';
import { AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES } from '../ai-self-service-booking-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_CASES } from '../ai-customer-intent-promotion-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_MARKETING_GROWTH_MULTILINGUAL_CASES } from '../ai-marketing-growth-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES } from '../ai-consumer-checkout-success-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CASES } from '../ai-consumer-checkout-tax-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_CHECKOUT_TAX_MULTILINGUAL_CASES } from '../ai-checkout-tax-multilingual.eval.util.js';
import { AI_COMMAND_EVAL_TYPO_CORPUS_CASES } from '../ai-typo-corpus.eval.util.js';
import { AI_COMMAND_EVAL_IMPLICATION_CASES } from '../ai-implication-corpus.eval.util.js';
import { AI_COMMAND_EVAL_BOOKING_FIRST_AVAILABLE_SEMANTIC_CASES } from '../booking-first-available.semantic.eval.util.js';
import { AI_COMMAND_EVAL_TEAM_WIDE_AVAILABILITY_SEMANTIC_CASES } from '../team-wide-availability.semantic.eval.util.js';
import { AI_COMMAND_EVAL_ANY_PROVIDER_BOOKING_SEMANTIC_CASES } from '../any-provider-booking.semantic.eval.util.js';
import { AI_COMMAND_EVAL_RECOMMEND_SPECIALISTS_SEMANTIC_CASES } from '../recommend-specialists.semantic.eval.util.js';
import { AI_COMMAND_EVAL_METRIC_RESOLVER_SEMANTIC_CASES } from '../metric-resolvers.semantic.eval.util.js';
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
import { PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS } from '../ai-provider-summarize-day.fixtures.js';
import { PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS } from '../ai-provider-show-appointments.fixtures.js';
import { AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_CASES } from '../ai-provider-show-appointments-multilingual.eval.util.js';
import { PROVIDER_WHO_IS_NEXT_PROMPT_SCENARIOS } from '../ai-provider-who-is-next.fixtures.js';
import { PROVIDER_EXPLAIN_TODAY_TIMELINE_PROMPT_SCENARIOS } from '../ai-provider-explain-today-timeline.fixtures.js';
import { PROVIDER_END_OF_DAY_SUMMARY_PROMPT_SCENARIOS } from '../ai-provider-end-of-day-summary.fixtures.js';
import { PROVIDER_MARK_VISIT_COMPLETE_PROMPT_SCENARIOS } from '../ai-provider-mark-visit-complete.fixtures.js';
import { PROVIDER_MARK_PAID_PROMPT_SCENARIOS } from '../ai-provider-mark-paid.fixtures.js';
import { PROVIDER_COLLECT_REMAINING_BALANCE_PROMPT_SCENARIOS } from '../ai-provider-collect-remaining-balance.fixtures.js';
import { SEARCH_RETAIL_SKU_PROMPT_SCENARIOS } from '../ai-search-retail-sku.fixtures.js';
import { PROVIDER_FILL_UNUSED_SLOTS_PROMPT_SCENARIOS } from '../ai-provider-fill-unused-slots.fixtures.js';
import { PROVIDER_PAYMENT_SWEEP_PROMPT_SCENARIOS } from '../ai-provider-payment-sweep.fixtures.js';
import { PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS } from '../ai-provider-summarize-utilization.fixtures.js';
import { PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_PROMPT_SCENARIOS } from '../ai-provider-list-my-multi-service-groups.fixtures.js';
import { PROVIDER_OPEN_BOOKING_FROM_PUSH_PROMPT_SCENARIOS } from '../ai-provider-open-booking-from-push.fixtures.js';
import { PROVIDER_CONFIRM_BOOKING_FROM_PUSH_PROMPT_SCENARIOS } from '../ai-provider-confirm-booking-from-push.fixtures.js';
import { PROVIDER_BLOCK_SCHEDULE_PROMPT_SCENARIOS } from '../ai-provider-block-schedule.fixtures.js';
import { PROVIDER_SUGGEST_RETAIL_UPSELL_PROMPT_SCENARIOS } from '../ai-provider-suggest-retail-upsell.fixtures.js';
import { PROVIDER_LIST_MY_PACKAGE_VISITS_PROMPT_SCENARIOS } from '../ai-provider-list-my-package-visits.fixtures.js';
import { AI_COMMAND_EVAL_PROVIDER_MARK_PAID_MULTILINGUAL_CASES } from '../ai-provider-mark-paid-multilingual.eval.util.js';
import { PROVIDER_DISMISS_PUSH_PROMPT_SCENARIOS } from '../ai-provider-dismiss-push.fixtures.js';
import { PROVIDER_MARK_NOTIFICATION_READ_PROMPT_SCENARIOS } from '../ai-provider-mark-notification-read.fixtures.js';
import { PROVIDER_EXPLAIN_LAST_PUSH_PROMPT_SCENARIOS } from '../ai-provider-explain-last-push.fixtures.js';
import { PROVIDER_NEW_BOOKING_PUSH_ACTIONS_PROMPT_SCENARIOS } from '../ai-provider-new-booking-push-actions.fixtures.js';
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
import { AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES } from '../ai-semantic-intent.eval.util.js';

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
    surface: 'dashboard',
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
      surface: 'dashboard' as const,
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
      surface: 'dashboard' as const,
      expect: {
        rescuedAction: 'release_test_result',
        rescueReason: 'release_test_result',
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  }),
];

/** Extended clinic lab dashboard intents (ai-cmd-ext-2.1–2.4). */
export const AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES: AiCommandEvalCase[] =
  [
    ...UPLOAD_PATIENT_RESULT_PROMPTS.map((entry) => ({
      id: `upload-patient-result-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      surface: 'dashboard' as const,
      expect: buildClinicTestResultExtEvalExpectation('upload_patient_result', {
        rescueReason: 'upload_patient_result',
        paramsPartial: { orderId: entry.orderId },
      }),
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
        surface: 'dashboard' as const,
        expect: buildClinicTestResultExtEvalExpectation(
          'explain_patient_results',
          {
            rescueReason: 'explain_patient_results',
            paramsPartial,
          },
        ),
      };
    }),
    ...CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS.map((entry) => ({
      id: `configure-reference-range-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      surface: 'dashboard' as const,
      expect: buildClinicTestResultExtEvalExpectation(
        'configure_test_reference_range',
        {
          rescueReason: 'configure_test_reference_range',
          paramsPartial: {
            measurementCode: entry.measurementCode,
            normalLow: entry.normalLow,
            normalHigh: entry.normalHigh,
          },
        },
      ),
    })),
    ...LIST_ABNORMAL_RESULTS_PROMPTS.map((entry) => ({
      id: `list-abnormal-results-${entry.id}`,
      prompt: entry.prompt,
      locale: 'en' as const,
      surface: 'dashboard' as const,
      expect: buildClinicTestResultExtEvalExpectation('list_abnormal_results', {
        rescueReason: 'list_abnormal_results',
      }),
    })),
  ];

/** Armenian/Russian clinic test result prompts (i18n-clinic-v2-ai-2). */
export const AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_TEST_RESULT_EVAL_SCENARIOS.map(
    clinicTestResultScenarioToEvalCase,
  );

export function clinicTestResultExtScenarioToEvalCase(
  scenario: ClinicTestResultExtEvalScenario,
): AiCommandEvalCase {
  const expect = buildClinicTestResultExtEvalExpectation(
    scenario.expectedAction,
    {
      ...(scenario.rescueReason ? { rescueReason: scenario.rescueReason } : {}),
      ...(scenario.paramsPartial
        ? { paramsPartial: scenario.paramsPartial }
        : {}),
      ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
    },
  );
  return {
    id: `clinic-test-result-ext-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: 'dashboard',
    expect,
  };
}

/** Armenian/Russian clinic test result ext prompts (ai-cmd-clinic-6-gap-1.3). */
export const AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS.map(
    clinicTestResultExtScenarioToEvalCase,
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

/** Map customer book lab from order (ai-cmd-customer-4.14.4). */
export const AI_COMMAND_EVAL_BOOK_LAB_FROM_ORDER_CASES: AiCommandEvalCase[] = [
  ...BOOK_LAB_FROM_ORDER_PROMPTS.map((entry) => ({
    id: `book-lab-from-order-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'book_lab_from_order' as const,
      rescueReason: entry.rescueReason,
      ...(entry.orderId || entry.testName
        ? {
            paramsPartial: {
              ...(entry.orderId ? { orderId: entry.orderId } : {}),
              ...(entry.testName ? { testName: entry.testName } : {}),
            },
          }
        : {}),
    },
  })),
  ...BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `book-lab-from-order-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'book_lab_from_order' as const,
      rescueReason: entry.rescueReason,
      needsMultilingual: true,
      ...(entry.orderId || entry.testName
        ? {
            paramsPartial: {
              ...(entry.orderId ? { orderId: entry.orderId } : {}),
              ...(entry.testName ? { testName: entry.testName } : {}),
            },
          }
        : {}),
    },
  })),
  ...BOOK_LAB_FROM_ORDER_RESCUE_SCENARIOS.map((entry) => ({
    id: `book-lab-from-order-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'book_lab_from_order',
      rescueFromAction: entry.misclassifiedAction,
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

/** Map customer/public explain_lab_prep (ai-cmd-customer-4.7.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_LAB_PREP_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_LAB_PREP_PROMPTS.map((entry) => ({
    id: `explain-lab-prep-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_lab_prep',
      rescueReason: entry.rescueReason,
      ...(entry.serviceName
        ? { paramsPartial: { serviceName: entry.serviceName } }
        : {}),
    },
  })),
  ...EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `explain-lab-prep-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'explain_lab_prep',
      rescueReason: entry.rescueReason,
      needsMultilingual: true,
      ...(entry.serviceName
        ? { paramsPartial: { serviceName: entry.serviceName } }
        : {}),
    },
  })),
  ...EXPLAIN_LAB_PREP_RESCUE_SCENARIOS.map((entry) => ({
    id: `explain-lab-prep-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      rescueFromAction: entry.misclassifiedAction,
    },
  })),
];

/** Map customer track_lab_order_status (ai-cmd-customer-4.7.2) to eval golden cases. */
export const AI_COMMAND_EVAL_TRACK_LAB_ORDER_STATUS_CASES: AiCommandEvalCase[] =
  [
    ...TRACK_LAB_ORDER_STATUS_PROMPTS.map((entry) => ({
      id: `track-lab-order-status-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'track_lab_order_status',
        rescueReason: entry.rescueReason,
        useSurfaceTrackLabOrderStatusRescue: true,
        ...(entry.testName
          ? { paramsPartial: { testName: entry.testName } }
          : {}),
      },
    })),
    ...TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `track-lab-order-status-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'track_lab_order_status',
        rescueReason: entry.rescueReason,
        useSurfaceTrackLabOrderStatusRescue: true,
        needsMultilingual: true,
        ...(entry.testName
          ? { paramsPartial: { testName: entry.testName } }
          : {}),
      },
    })),
    ...TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS.map((entry) => ({
      id: `track-lab-order-status-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'track_lab_order_status',
        rescueReason: 'track_lab_order',
        useSurfaceTrackLabOrderStatusRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer list_my_documents (ai-cmd-customer-4.14.5) to eval golden cases. */
export const AI_COMMAND_EVAL_LIST_MY_DOCUMENTS_CASES: AiCommandEvalCase[] = [
  ...LIST_MY_DOCUMENTS_PROMPTS.map((entry) => ({
    id: `list-my-documents-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'list_my_documents',
      rescueReason: entry.rescueReason,
      useSurfaceListMyDocumentsRescue: true,
      ...(entry.category
        ? { paramsPartial: { category: entry.category } }
        : {}),
      ...(entry.title ? { paramsPartial: { title: entry.title } } : {}),
    },
  })),
  ...LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `list-my-documents-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'list_my_documents',
      rescueReason: entry.rescueReason,
      useSurfaceListMyDocumentsRescue: true,
      needsMultilingual: true,
      ...(entry.category
        ? { paramsPartial: { category: entry.category } }
        : {}),
    },
  })),
  ...LIST_MY_DOCUMENTS_RESCUE_SCENARIOS.map((entry) => ({
    id: `list-my-documents-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      useSurfaceListMyDocumentsRescue: true,
      rescueFromAction: entry.misclassifiedAction,
    },
  })),
];

/** Map customer explain_abnormal_result_flag (ai-cmd-customer-4.14.6) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_ABNORMAL_RESULT_FLAG_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS.map((entry) => ({
      id: `explain-abnormal-result-flag-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_abnormal_result_flag',
        rescueReason: entry.rescueReason,
        useSurfaceExplainAbnormalResultFlagRescue: true,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
          ...(entry.flag ? { flag: entry.flag } : {}),
          ...(entry.testName ? { testName: entry.testName } : {}),
        },
      },
    })),
    ...EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-abnormal-result-flag-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_abnormal_result_flag',
        rescueReason: entry.rescueReason,
        useSurfaceExplainAbnormalResultFlagRescue: true,
        needsMultilingual: true,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
          ...(entry.flag ? { flag: entry.flag } : {}),
          ...(entry.testName ? { testName: entry.testName } : {}),
        },
      },
    })),
    ...EXPLAIN_ABNORMAL_RESULT_FLAG_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-abnormal-result-flag-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_abnormal_result_flag',
        rescueReason: 'abnormal_result_flag',
        useSurfaceExplainAbnormalResultFlagRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer notify_when_results_ready (ai-cmd-customer-4.14.7) to eval golden cases. */
export const AI_COMMAND_EVAL_NOTIFY_WHEN_RESULTS_READY_CASES: AiCommandEvalCase[] =
  [
    ...NOTIFY_WHEN_RESULTS_READY_PROMPTS.map((entry) => ({
      id: `notify-when-results-ready-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'notify_when_results_ready',
        rescueReason: entry.rescueReason,
        useSurfaceNotifyWhenResultsReadyRescue: true,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
          ...(entry.channel ? { channel: entry.channel } : {}),
          ...(entry.testName ? { testName: entry.testName } : {}),
        },
      },
    })),
    ...NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `notify-when-results-ready-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'notify_when_results_ready',
        rescueReason: entry.rescueReason,
        useSurfaceNotifyWhenResultsReadyRescue: true,
        needsMultilingual: true,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
          ...(entry.channel ? { channel: entry.channel } : {}),
          ...(entry.testName ? { testName: entry.testName } : {}),
        },
      },
    })),
    ...NOTIFY_WHEN_RESULTS_READY_RESCUE_SCENARIOS.map((entry) => ({
      id: `notify-when-results-ready-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'notify_when_results_ready',
        rescueReason: 'notify_when_results_ready',
        useSurfaceNotifyWhenResultsReadyRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

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

/** Clinic lab review compound rescue (ai-cmd-clinic-6-gap-6.1). */
export const AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_RESCUE_CASES: AiCommandEvalCase[] =
  CLINIC_LAB_REVIEW_RESCUE_SCENARIOS.map((scenario) => ({
    id: `clinic-lab-review-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'clinic_lab_review_compound',
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

/** e2e-bug.144 — natural delete/remove service → deactivate_service soft-delete. */
export const AI_COMMAND_EVAL_E2E144_DEACTIVATE_SERVICE_CASES: AiCommandEvalCase[] =
  CATALOG_E2E144_DEACTIVATE_SERVICE_SCENARIOS.map((row) => ({
    id: `e2e144-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: row.expectedAction,
      rescueReason: 'deactivate_service',
      paramsPartial: { serviceName: row.serviceName },
    },
  }));

/** e2e-bug.136 — unblock / remove block → delete_schedule_block (not clear_schedule). */
export const AI_COMMAND_EVAL_E2E136_DELETE_SCHEDULE_BLOCK_CASES: AiCommandEvalCase[] =
  E2E136_DELETE_SCHEDULE_BLOCK_SCENARIOS.map((row) => ({
    id: `e2e136-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: row.expectedAction,
    },
  }));

/** e2e-bug.134 — guest manage-link cancel → cancel_booking_with_token (not my_appointments). */
export const AI_COMMAND_EVAL_E2E134_GUEST_MANAGE_LINK_CASES: AiCommandEvalCase[] =
  E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS.map((row) => ({
    id: `e2e134-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: row.surface,
    expect: {
      rescuedAction: row.expectedAction,
      paramsPartial: {
        bookingId: row.bookingId,
        manageToken: row.manageToken,
      },
    },
  }));

/** e2e-bug.133 — tour capacity booking must not rescue to clinic explain_result_status. */
export const AI_COMMAND_EVAL_E2E133_TOUR_VS_CLINIC_CASES: AiCommandEvalCase[] =
  E2E133_TOUR_VS_CLINIC_SCENARIOS.map((row) => ({
    id: `e2e133-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: row.surface,
    expect: {
      rescuedAction: row.expectedAction,
      rescueReason: row.expectedRescueReason,
    },
  }));

/** e2e-bug.132 — casual cancel policy must not rescue to explain_package_savings. */
export const AI_COMMAND_EVAL_E2E132_CANCEL_POLICY_CASUAL_CASES: AiCommandEvalCase[] =
  E2E132_CANCEL_POLICY_CASUAL_SCENARIOS.map((row) => ({
    id: `e2e132-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: row.surface,
    expect: {
      rescuedAction: row.expectedAction,
      rescueReason: 'cancel_policy',
    },
  }));

/** e2e-bug.131 — wrong-surface hallucinations remapped to customer/public intents. */
export const AI_COMMAND_EVAL_E2E131_CROSS_SURFACE_CASES: AiCommandEvalCase[] =
  E2E131_CROSS_SURFACE_HALLUCINATION_SCENARIOS.map((row) => ({
    id: `e2e131-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: row.surface,
    expect: {
      rescuedAction: row.expectedAction,
    },
  }));

/** e2e-bug.130 — gift-card purchase must not become multi-service / budget list. */
/** e2e-bug.129 — explain_my_subscription must remap billing/AI-quota hallucinations. */
export const AI_COMMAND_EVAL_E2E129_EXPLAIN_MY_SUBSCRIPTION_CASES: AiCommandEvalCase[] =
  E2E129_EXPLAIN_MY_SUBSCRIPTION_SCENARIOS.map((row) => ({
    id: `e2e129-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: row.surface,
    expect: {
      rescuedAction: row.expectedAction,
    },
  }));

export const AI_COMMAND_EVAL_E2E130_GIFT_CARD_PURCHASE_CASES: AiCommandEvalCase[] =
  E2E130_GIFT_CARD_PURCHASE_SCENARIOS.map((row) => ({
    id: `e2e130-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: row.surface,
    expect: {
      rescuedAction: row.expectedAction,
    },
  }));

/** e2e-bug.146 — real mutates must rescue instead of falling to react_agent. */
export const AI_COMMAND_EVAL_E2E146_ROUTING_RESCUE_CASES: AiCommandEvalCase[] = [
  ...LOCATIONS_RESCUE_SCENARIOS.map((row) => ({
    id: `e2e146-locations-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: row.expectedAction,
      rescueReason: row.expectedAction,
      paramsPartial: { ...row.paramsPartial },
    },
  })),
  ...RETAIL_FINANCE_E2E146_RESCUE_SCENARIOS.map((row) => ({
    id: `e2e146-retail-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: row.expectedAction,
      rescueReason: row.expectedAction,
      paramsPartial: { ...row.paramsPartial },
    },
  })),
  ...CONFIGURE_BUSINESS_TAX_PROMPTS.filter(
    (row) => row.id === 'e2e146-set-sales-tax-rate-percent-word',
  ).map((row) => ({
    id: `e2e146-tax-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'configure_business_tax' as const,
      rescueReason: 'configure_business_tax',
      paramsPartial: {
        rate: row.rate,
        enabled: row.enabled,
      },
    },
  })),
];

/** e2e-bug.137 — out-of-toolset domains must rescue to real dashboard actions. */
export const AI_COMMAND_EVAL_E2E137_ROUTING_RESCUE_CASES: AiCommandEvalCase[] =
  E2E137_ROUTING_RESCUE_SCENARIOS.map((row) => ({
    id: `e2e137-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: row.expectedAction,
      rescueReason: row.rescueReason,
    },
  }));

/** e2e-bug.159 — owner cancel alert → business email toggle, not customer notify. */
export const AI_COMMAND_EVAL_E2E159_OWNER_CANCEL_ALERT_CASES: AiCommandEvalCase[] =
  E2E159_OWNER_CANCEL_ALERT_SCENARIOS.map((row) => ({
    id: `e2e159-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: row.expectedAction,
      rescueReason: row.rescueReason,
      paramsPartial: { enabled: row.enabled },
    },
  }));

/** e2e-bug.252 — "a customer reschedules" (-s) → same owner email toggle. */
export const AI_COMMAND_EVAL_E2E252_OWNER_RESCHEDULE_ALERT_CASES: AiCommandEvalCase[] =
  E2E252_OWNER_RESCHEDULE_ALERT_SCENARIOS.filter((row) => row.expectToggle).map(
    (row) => ({
      id: `e2e252-${row.id}`,
      prompt: row.prompt,
      locale: 'en' as const,
      surface: 'dashboard' as const,
      expect: {
        rescuedAction: 'toggle_business_email_on_customer_change',
        rescueReason: 'business_email_toggle',
        ...(typeof row.enabled === 'boolean'
          ? { paramsPartial: { enabled: row.enabled } }
          : {}),
      },
    }),
  );

/** e2e-bug.157 — multi-service package ≠ gift-card bundle. */
export const AI_COMMAND_EVAL_E2E157_CREATE_PACKAGE_CASES: AiCommandEvalCase[] =
  E2E157_CREATE_PACKAGE_SCENARIOS.map((row) => ({
    id: `e2e157-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: row.expectedAction,
      rescueReason: row.rescueReason,
      paramsPartial: {
        packageName: row.packageName,
        serviceNames: [...row.serviceNames],
      },
    },
  }));

/** e2e-bug.154 — unscoped booking totals → summarize_bookings count/all-time. */
export const AI_COMMAND_EVAL_E2E154_UNSCOPED_BOOKING_COUNT_CASES: AiCommandEvalCase[] =
  E2E154_UNSCOPED_BOOKING_COUNT_SCENARIOS.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'summarize_bookings',
      rescueReason: 'unscoped_booking_count',
      paramsPartial: { bookingMetric: 'count', allTime: true },
    },
  }));

/** e2e-bug.153 — unscoped customer roster totals → summarize_customers overview. */
export const AI_COMMAND_EVAL_E2E153_UNSCOPED_CUSTOMER_COUNT_CASES: AiCommandEvalCase[] =
  E2E153_UNSCOPED_CUSTOMER_COUNT_SCENARIOS.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'summarize_customers',
      rescueReason: 'unscoped_customer_count',
      paramsPartial: { customerMetric: 'overview' },
    },
  }));

/** e2e-bug.152 — pending AI agent tasks must not flip to clinic/react_agent. */
export const AI_COMMAND_EVAL_E2E152_PENDING_AI_AGENT_TASKS_CASES: AiCommandEvalCase[] =
  E2E152_PENDING_AI_AGENT_TASKS_SCENARIOS.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'list_agent_tasks',
      rescueReason: 'list_tasks',
      paramsPartial: { scope: 'pending' },
    },
  }));

/** e2e-bug.151 — service category create ≠ promo code. */
export const AI_COMMAND_EVAL_E2E151_CREATE_SERVICE_CATEGORY_CASES: AiCommandEvalCase[] =
  E2E151_CREATE_SERVICE_CATEGORY_SCENARIOS.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'create_service_category',
      rescueReason: 'service_category',
      paramsPartial: { categoryName: row.categoryName },
    },
  }));

/** e2e-bug.148 — natural "priced at N dollars" must populate create_product price. */
export const AI_COMMAND_EVAL_E2E148_CREATE_PRODUCT_PRICE_CASES: AiCommandEvalCase[] =
  E2E148_CREATE_PRODUCT_PRICE_SCENARIOS.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'create_product',
      rescueReason: 'create_product',
      paramsPartial: {
        price: row.price,
        retailPrice: row.price,
        productName: row.productName,
      },
    },
  }));

/** e2e-bug.147 — service equipment/resource requirements must not invent via react_agent. */
export const AI_COMMAND_EVAL_E2E147_SERVICE_RESOURCE_REQUIREMENTS_CASES: AiCommandEvalCase[] =
  LIST_SERVICE_RESOURCE_REQUIREMENTS_SCENARIOS.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'list_service_resource_requirements',
      rescueReason: 'list_service_resource_requirements',
      paramsPartial: { serviceName: row.serviceName },
    },
  }));

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

/** Map checkout tax explain prompts (ai-cmd-tax-5 / ai-cmd-customer-4.20.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_CHECKOUT_TAX_PROMPTS.map((entry) => ({
    id: `explain-checkout-tax-${entry.id}`,
    prompt: entry.prompt,
    surface: 'public' as const,
    locale: (entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en') as AiEvalLocale,
    expect: {
      rescuedAction: 'explain_checkout_tax',
      rescueReason: 'explain_checkout_tax',
      useSurfaceExplainCheckoutTaxRescue: true,
      ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      ...(entry.id.startsWith('hy-') || entry.id.startsWith('ru-')
        ? { needsMultilingual: true }
        : {}),
    },
  })),
  ...AI_COMMAND_EVAL_CHECKOUT_TAX_MULTILINGUAL_CASES,
];

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

/** ai-cmd-provider-5.17.1 — HY/RU coverage for explain_appointment_tax. */
export const AI_COMMAND_EVAL_EXPLAIN_APPOINTMENT_TAX_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  EXPLAIN_APPOINTMENT_TAX_MULTILINGUAL_PROMPTS.map((entry) => ({
    id: `explain-appointment-tax-${entry.id}`,
    prompt: entry.prompt,
    locale: entry.locale,
    expect: {
      rescuedAction: 'explain_appointment_tax',
      rescueReason: 'explain_appointment_tax',
      needsMultilingual: true,
    },
  }));

/** ai-cmd-provider-5.17.2 — provider explain_payment_status fixtures + eval. */
export const AI_COMMAND_EVAL_PROVIDER_EXPLAIN_PAYMENT_STATUS_CASES: AiCommandEvalCase[] =
  PROVIDER_EXPLAIN_PAYMENT_STATUS_PROMPT_SCENARIOS.map((entry) => ({
    id: entry.id,
    prompt: entry.prompt,
    locale: 'en' as const,
    surface: entry.surface,
    expect: {
      rescuedAction: 'explain_payment_status',
      rescueReason: 'payment_status',
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
export const AI_COMMAND_EVAL_EXPLAIN_DATA_RIGHTS_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_DATA_RIGHTS_PROMPTS.map((entry) => ({
    id: `explain-data-rights-${entry.id}`,
    prompt: entry.prompt,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_data_rights',
      rescueReason: 'explain_data_rights',
      paramsPartial: { aspect: entry.aspect },
    },
  })),
  ...DATA_RIGHTS_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: entry.id,
    prompt: entry.prompt,
    locale: entry.locale,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.rescueReason,
      needsMultilingual: true,
      paramsPartial: { aspect: 'all' as const },
    },
  })),
];

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
      surface: entry.surface,
      locale:
        entry.id.includes('-hy-') || entry.id.startsWith('hy-')
          ? 'hy'
          : entry.id.includes('-ru-') || entry.id.startsWith('ru-')
            ? 'ru'
            : 'en',
      expect: {
        rescuedAction: 'explain_tour_booking',
        rescueReason: 'explain_tour_booking',
        useSurfaceTourCustomerPublicRescue: true,
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

/** Map tour meeting point explain prompts (ai-cmd-customer-4.10.6) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_TOUR_MEETING_POINT_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_TOUR_MEETING_POINT_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('serviceName' in entry && entry.serviceName) {
        paramsPartial.serviceName = entry.serviceName;
      }
      if ('aspect' in entry && entry.aspect)
        paramsPartial.aspect = entry.aspect;
      return {
        id: `tour-meeting-point-${entry.id}`,
        prompt: entry.prompt,
        surface: entry.surface,
        locale: 'en' as const,
        expect: {
          rescuedAction: 'explain_tour_meeting_point',
          rescueReason: 'explain_tour_meeting_point',
          useSurfaceTourCustomerPublicRescue: true,
          ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
        },
      };
    }),
    ...EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('serviceName' in entry && entry.serviceName) {
        paramsPartial.serviceName = entry.serviceName;
      }
      if ('aspect' in entry && entry.aspect)
        paramsPartial.aspect = entry.aspect;
      return {
        id: `tour-meeting-point-${entry.id}`,
        prompt: entry.prompt,
        surface: entry.surface,
        locale: entry.locale,
        expect: {
          rescuedAction: 'explain_tour_meeting_point',
          rescueReason: 'explain_tour_meeting_point',
          useSurfaceTourCustomerPublicRescue: true,
          ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
        },
      };
    }),
  ];

/** Map customer tour booking record prompts (ai-cmd-customer-4.10.4) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_CASES: AiCommandEvalCase[] =
  EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('bookingId' in entry && entry.bookingId) {
      paramsPartial.bookingId = entry.bookingId;
    }
    if ('serviceName' in entry && entry.serviceName) {
      paramsPartial.serviceName = entry.serviceName;
    }
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    return {
      id: `tour-booking-record-customer-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.id.startsWith('ru-')
        ? 'ru'
        : entry.id.startsWith('hy-')
          ? 'hy'
          : 'en',
      expect: {
        rescuedAction: 'explain_tour_booking_record',
        rescueReason: 'explain_tour_booking_record',
        useSurfaceTourCustomerPublicRescue: true,
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
      surface: entry.surface,
      locale: entry.id.startsWith('ru-')
        ? 'ru'
        : entry.id.startsWith('hy-')
          ? 'hy'
          : 'en',
      expect: {
        rescuedAction: 'diagnose_tour_capacity',
        rescueReason: 'diagnose_tour_capacity',
        useSurfaceTourCustomerPublicRescue: true,
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
    surface: 'customer',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason:
        scenario.rescueReason ?? 'explain_consumer_checkout_success',
      useSurfaceConsumerCheckoutSuccessRescue: true,
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    },
  };
}

/** EN paraphrase + dismiss phrasing for consumer checkout success (ai-cmd-rec-7). */
export const AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_EN_CASES: AiCommandEvalCase[] =
  EN_CONSUMER_CHECKOUT_SUCCESS_EVAL_SCENARIOS.map(
    consumerCheckoutSuccessScenarioToEvalCase,
  );

/** Map customer cancel-my-booking prompts (ai-cmd-customer-4.4.2) to eval golden cases. */
export const AI_COMMAND_EVAL_CANCEL_MY_BOOKING_CASES: AiCommandEvalCase[] =
  CANCEL_MY_BOOKING_PROMPTS.map((entry) => ({
    id: `cancel-my-booking-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'cancel_my_booking',
      rescueReason: 'cancel_my',
      useSurfaceSelfServiceRescue: true,
      ...(entry.serviceName
        ? { paramsPartial: { serviceName: entry.serviceName } }
        : {}),
    },
  }));

/** Map customer cancel-all-upcoming-bookings prompts (ai-cmd-customer-6.12.7) to eval golden cases. */
export const AI_COMMAND_EVAL_CANCEL_ALL_UPCOMING_BOOKINGS_CASES: AiCommandEvalCase[] =
  [
    ...CANCEL_ALL_UPCOMING_BOOKINGS_PROMPTS.map((entry) => ({
      id: `cancel-all-upcoming-bookings-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'cancel_all_upcoming_bookings',
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue: true,
      },
    })),
    ...CANCEL_ALL_UPCOMING_BOOKINGS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `cancel-all-upcoming-bookings-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'cancel_all_upcoming_bookings',
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue: true,
        needsMultilingual: true,
      },
    })),
  ];

/** Map customer reschedule-my-booking prompts (ai-cmd-customer-4.4.3) to eval golden cases. */
export const AI_COMMAND_EVAL_RESCHEDULE_MY_BOOKING_CASES: AiCommandEvalCase[] =
  RESCHEDULE_MY_BOOKING_PROMPTS.map((entry) => ({
    id: `reschedule-my-booking-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'reschedule_my_booking',
      rescueReason: 'reschedule_my',
      useSurfaceSelfServiceRescue: true,
      ...(entry.serviceName
        ? { paramsPartial: { serviceName: entry.serviceName } }
        : {}),
    },
  }));

/** Map customer change-provider-on-reschedule prompts (ai-cmd-customer-6.3.1 promotion) to eval golden cases. */
export const AI_COMMAND_EVAL_CHANGE_PROVIDER_ON_RESCHEDULE_CASES: AiCommandEvalCase[] =
  CHANGE_PROVIDER_ON_RESCHEDULE_PROMPTS.map((entry) => ({
    id: `change-provider-on-reschedule-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'change_provider_on_reschedule',
      rescueReason: 'change_provider',
      useSurfaceSelfServiceRescue: true,
    },
  }));

/** Map customer/public explain-why-stripe prompts (ai-cmd-customer-4.0 P0) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_WHY_STRIPE_REQUIRED_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_WHY_STRIPE_REQUIRED_PROMPTS.map((entry) => ({
      id: `explain-why-stripe-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_why_stripe_required' as const,
        useSurfacePaymentsRescue: true,
        ...(entry.serviceName
          ? { paramsPartial: { serviceName: entry.serviceName } }
          : {}),
      },
    })),
  ];

/** Map customer/public multi-service booking prompts (ai-cmd-customer-4.0 P1) to eval golden cases. */
export const AI_COMMAND_EVAL_MULTI_SERVICE_CUSTOMER_PUBLIC_CASES: AiCommandEvalCase[] =
  MULTI_SERVICE_CUSTOMER_PUBLIC_PROMPTS.map((entry) => ({
    id: `multi-service-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason:
        entry.rescueReason ??
        (entry.expectedAction === 'book_multi_service'
          ? 'book_multi'
          : entry.expectedAction === 'add_services_to_cart'
            ? 'add_cart'
            : 'multi_availability'),
      useSurfaceSelfServiceRescue: true,
      ...(entry.serviceNames
        ? { paramsPartial: { serviceNames: entry.serviceNames } }
        : {}),
    },
  }));

/** Map customer membership/subscription prompts (ai-cmd-customer-4.0 P1) to eval golden cases. */
export const AI_COMMAND_EVAL_SUBSCRIPTION_MEMBERSHIP_CUSTOMER_CASES: AiCommandEvalCase[] =
  SUBSCRIPTION_MEMBERSHIP_CUSTOMER_PROMPTS.map((entry) => ({
    id: `subscription-membership-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.rescueReason,
      useSurfaceMembershipCustomerRescue: true,
      ...(entry.serviceName
        ? { paramsPartial: { serviceName: entry.serviceName } }
        : {}),
    },
  }));

/** Map customer select-subscription-plan prompts (ai-cmd-customer-6.1 promotion) to eval golden cases. */
export const AI_COMMAND_EVAL_SELECT_SUBSCRIPTION_PLAN_CASES: AiCommandEvalCase[] =
  SELECT_SUBSCRIPTION_PLAN_PROMPTS.map((entry) => ({
    id: `select-subscription-plan-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.rescueReason,
      useSurfaceMembershipCustomerRescue: true,
    },
  }));

/** Map customer discover-subscription-plans prompts (ai-cmd-customer-6.1 promotion) to eval golden cases. */
export const AI_COMMAND_EVAL_DISCOVER_SUBSCRIPTION_PLANS_CASES: AiCommandEvalCase[] =
  [
    ...DISCOVER_SUBSCRIPTION_PLANS_PROMPTS.map((entry) => ({
      id: `discover-subscription-plans-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfaceMembershipCustomerRescue: true,
      },
    })),
    ...DISCOVER_SUBSCRIPTION_PLANS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `discover-subscription-plans-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfaceMembershipCustomerRescue: true,
        needsMultilingual: true,
      },
    })),
  ];

/** Map customer/public apply-promo-code-checkout prompts (ai-cmd-customer-4.2.5) to eval golden cases. */
export const AI_COMMAND_EVAL_APPLY_PROMO_CODE_CHECKOUT_CASES: AiCommandEvalCase[] =
  [
    ...APPLY_PROMO_CODE_CHECKOUT_PROMPTS.map((entry) => ({
      id: `apply-promo-code-checkout-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'apply_promo_code_checkout',
        rescueReason: entry.rescueReason,
        useSurfaceMarketingGrowthRescue: true,
        ...(entry.promoCode
          ? { paramsPartial: { promoCode: entry.promoCode } }
          : {}),
      },
    })),
    ...APPLY_PROMO_CODE_CHECKOUT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `apply-promo-code-checkout-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'apply_promo_code_checkout',
        rescueReason: entry.rescueReason,
        useSurfaceMarketingGrowthRescue: true,
        ...(entry.promoCode
          ? { paramsPartial: { promoCode: entry.promoCode } }
          : {}),
      },
    })),
  ];

/** Map customer/public promo-code-help prompts (ai-cmd-customer-4.0 P1) to eval golden cases. */
export const AI_COMMAND_EVAL_PROMO_CODE_HELP_CUSTOMER_PUBLIC_CASES: AiCommandEvalCase[] =
  PROMO_CODE_HELP_PROMPTS.map((entry) => ({
    id: `promo-code-help-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'promo_code_help',
      rescueReason: entry.rescueReason,
      useSurfaceMarketingGrowthRescue: true,
      ...(entry.promoCode
        ? { paramsPartial: { promoCode: entry.promoCode } }
        : {}),
    },
  }));

/** Map customer/public explain-service-price prompts (ai-cmd-customer-4.1.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_SERVICE_PRICE_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_SERVICE_PRICE_PROMPTS.map((entry) => ({
      id: `explain-service-price-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_service_price' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
        ...(entry.serviceName
          ? { paramsPartial: { serviceName: entry.serviceName } }
          : {}),
      },
    })),
    ...EXPLAIN_SERVICE_PRICE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-service-price-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_service_price' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
  ];

/** Map customer/public explain-payment-options-for-service prompts (ai-cmd-customer-4.1.2) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_PROMPTS.map((entry) => ({
      id: `explain-payment-options-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_payment_options_for_service' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
        ...(entry.serviceName
          ? { paramsPartial: { serviceName: entry.serviceName } }
          : {}),
      },
    })),
    ...EXPLAIN_PAYMENT_OPTIONS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-payment-options-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_payment_options_for_service' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
  ];

/** Map customer/public find-soonest-appointment prompts (ai-cmd-customer-4.1.3) to eval golden cases. */
export const AI_COMMAND_EVAL_FIND_SOONEST_APPOINTMENT_CASES: AiCommandEvalCase[] =
  [
    ...FIND_SOONEST_APPOINTMENT_PROMPTS.map((entry) => ({
      id: `find-soonest-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'find_soonest_appointment' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
        ...(entry.serviceName
          ? { paramsPartial: { serviceName: entry.serviceName } }
          : {}),
      },
    })),
    ...FIND_SOONEST_APPOINTMENT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `find-soonest-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'find_soonest_appointment' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
  ];

/** Map customer/public compare-services prompts (ai-cmd-customer-4.1.4) to eval golden cases. */
export const AI_COMMAND_EVAL_COMPARE_SERVICES_CASES: AiCommandEvalCase[] = [
  ...COMPARE_SERVICES_PROMPTS.map((entry) => ({
    id: `compare-services-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'compare_services' as const,
      rescueReason: entry.rescueReason,
      useSurfacePaymentsRescue: true,
      paramsPartial: { serviceNames: [...entry.serviceNames] },
    },
  })),
  ...COMPARE_SERVICES_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `compare-services-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'compare_services' as const,
      rescueReason: entry.rescueReason,
      useSurfacePaymentsRescue: true,
      paramsPartial: { serviceNames: [...entry.serviceNames] },
    },
  })),
];

/** Map customer/public no-prepayment service browse prompts (ai-cmd-customer-4.1.7) to eval golden cases. */
export const AI_COMMAND_EVAL_FILTER_SERVICES_NO_PREPAYMENT_CASES: AiCommandEvalCase[] =
  [
    ...FILTER_SERVICES_NO_PREPAYMENT_PROMPTS.map((entry) => ({
      id: `filter-no-prepayment-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'filter_services_no_prepayment' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
        paramsPartial: {
          prepaymentMode: 'none' as const,
          onlinePaymentEnabled: false,
          ...(entry.serviceCategory
            ? { serviceCategory: entry.serviceCategory }
            : {}),
        },
      },
    })),
    ...FILTER_SERVICES_NO_PREPAYMENT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `filter-no-prepayment-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'filter_services_no_prepayment' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
        paramsPartial: {
          prepaymentMode: 'none' as const,
          onlinePaymentEnabled: false,
        },
      },
    })),
  ];

/** Map customer/public amount-due-now checkout prompts (ai-cmd-customer-4.2.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_AMOUNT_DUE_NOW_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_AMOUNT_DUE_NOW_PROMPTS.map((entry) => ({
      id: `amount-due-now-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_amount_due_now' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
        ...(entry.serviceName
          ? { paramsPartial: { serviceName: entry.serviceName } }
          : {}),
      },
    })),
    ...EXPLAIN_AMOUNT_DUE_NOW_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `amount-due-now-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_amount_due_now' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
    ...PUBLIC_CATALOG_PREPAYMENT_PROMPTS.filter(
      (entry) => entry.expectedAction === 'explain_amount_due_now',
    ).map((entry) => ({
      id: `amount-due-now-catalog-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_amount_due_now' as const,
        rescueReason: 'amount_due_now' as const,
        useSurfacePaymentsRescue: true,
      },
    })),
  ];

/** Map customer/public guest checkout field prompts (ai-cmd-customer-4.2.2) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_GUEST_CHECKOUT_FIELDS_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_GUEST_CHECKOUT_FIELDS_PROMPTS.map((entry) => ({
      id: `guest-checkout-fields-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_guest_checkout_fields' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: { aspect: entry.aspect },
      },
    })),
    ...EXPLAIN_GUEST_CHECKOUT_FIELDS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `guest-checkout-fields-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_guest_checkout_fields' as const,
        rescueReason: entry.rescueReason,
        ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
      },
    })),
  ];

/** Map customer/public why-sign-in prompts (ai-cmd-customer-4.17.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_WHY_SIGN_IN_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_WHY_SIGN_IN_PROMPTS.map((entry) => ({
    id: `why-sign-in-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_why_sign_in' as const,
      rescueReason: entry.rescueReason,
      ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
    },
  })),
  ...EXPLAIN_WHY_SIGN_IN_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `why-sign-in-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'explain_why_sign_in' as const,
      rescueReason: entry.rescueReason,
      ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
    },
  })),
  ...EXPLAIN_WHY_SIGN_IN_RESCUE_SCENARIOS.map((entry) => ({
    id: `why-sign-in-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_why_sign_in' as const,
      rescueReason: 'why_sign_in',
      rescueFromAction: entry.misclassifiedAction,
    },
  })),
];

/** Map customer/public manage-page sign-in prompts (ai-cmd-customer-4.17.2) to eval golden cases. */
export const AI_COMMAND_EVAL_SIGN_IN_TO_MANAGE_BOOKING_CASES: AiCommandEvalCase[] =
  [
    ...SIGN_IN_TO_MANAGE_BOOKING_PROMPTS.map((entry) => ({
      id: `sign-in-manage-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'sign_in_to_manage_booking' as const,
        rescueReason: entry.rescueReason,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...SIGN_IN_TO_MANAGE_BOOKING_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `sign-in-manage-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'sign_in_to_manage_booking' as const,
        rescueReason: entry.rescueReason,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...SIGN_IN_TO_MANAGE_BOOKING_RESCUE_SCENARIOS.map((entry) => ({
      id: `sign-in-manage-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'sign_in_to_manage_booking' as const,
        rescueReason: 'sign_in_to_manage_booking',
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public checkout validation error prompts (ai-cmd-customer-4.2.7) to eval golden cases. */
export const AI_COMMAND_EVAL_FIX_CHECKOUT_VALIDATION_ERROR_CASES: AiCommandEvalCase[] =
  [
    ...FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS.map((entry) => ({
      id: `fix-checkout-validation-error-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'fix_checkout_validation_error' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: { aspect: entry.aspect },
      },
    })),
    ...FIX_CHECKOUT_VALIDATION_ERROR_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `fix-checkout-validation-error-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'fix_checkout_validation_error' as const,
        rescueReason: entry.rescueReason,
        ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
      },
    })),
  ];

/** Map customer/public confirm booking details prompts (ai-cmd-customer-4.3.1) to eval golden cases. */
export const AI_COMMAND_EVAL_CONFIRM_MY_BOOKING_DETAILS_CASES: AiCommandEvalCase[] =
  [
    ...CONFIRM_MY_BOOKING_DETAILS_PROMPTS.map((entry) => ({
      id: `confirm-my-booking-details-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'confirm_my_booking_details' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue:
          entry.surface === 'customer' || entry.surface === 'public',
        paramsPartial: { aspect: entry.aspect },
      },
    })),
    ...CONFIRM_MY_BOOKING_DETAILS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `confirm-my-booking-details-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'confirm_my_booking_details' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue:
          entry.surface === 'customer' || entry.surface === 'public',
        ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
      },
    })),
  ];

/** Map customer/public add booking to calendar prompts (ai-cmd-customer-4.3.2) to eval golden cases. */
export const AI_COMMAND_EVAL_ADD_BOOKING_TO_CALENDAR_CASES: AiCommandEvalCase[] =
  [
    ...ADD_BOOKING_TO_CALENDAR_PROMPTS.map((entry) => ({
      id: `add-booking-to-calendar-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'add_booking_to_calendar' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue:
          entry.surface === 'customer' || entry.surface === 'public',
        paramsPartial: { format: entry.format },
      },
    })),
    ...ADD_BOOKING_TO_CALENDAR_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `add-booking-to-calendar-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'add_booking_to_calendar' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue:
          entry.surface === 'customer' || entry.surface === 'public',
        ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
      },
    })),
  ];

/** Map customer/public book another service prompts (ai-cmd-customer-4.3.6) to eval golden cases. */
export const AI_COMMAND_EVAL_BOOK_ANOTHER_SERVICE_CASES: AiCommandEvalCase[] = [
  ...BOOK_ANOTHER_SERVICE_PROMPTS.map((entry) => ({
    id: `book-another-service-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'book_another_service' as const,
      rescueReason: entry.rescueReason,
      useSurfaceSelfServiceRescue:
        entry.surface === 'customer' || entry.surface === 'public',
      ...(entry.sameDay ? { paramsPartial: { sameDay: true } } : {}),
    },
  })),
  ...BOOK_ANOTHER_SERVICE_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `book-another-service-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'book_another_service' as const,
      rescueReason: entry.rescueReason,
      useSurfaceSelfServiceRescue:
        entry.surface === 'customer' || entry.surface === 'public',
      needsMultilingual: true,
      ...(entry.sameDay ? { paramsPartial: { sameDay: true } } : {}),
    },
  })),
];

/** Map customer share my booking prompts (ai-cmd-customer-4.3.7) to eval golden cases. */
export const AI_COMMAND_EVAL_SHARE_MY_BOOKING_CASES: AiCommandEvalCase[] = [
  ...SHARE_MY_BOOKING_PROMPTS.map((entry) => ({
    id: `share-my-booking-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'share_my_booking' as const,
      rescueReason: entry.rescueReason,
      useSurfaceShareMyBookingRescue: true,
      ...(entry.bookingId
        ? { paramsPartial: { bookingId: entry.bookingId } }
        : {}),
    },
  })),
  ...SHARE_MY_BOOKING_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `share-my-booking-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'share_my_booking' as const,
      rescueReason: entry.rescueReason,
      useSurfaceShareMyBookingRescue: true,
      needsMultilingual: true,
    },
  })),
];

/** Map customer get manage link (ai-cmd-customer-4.4.5). */
export const AI_COMMAND_EVAL_GET_MANAGE_LINK_CASES: AiCommandEvalCase[] = [
  ...GET_MANAGE_LINK_PROMPTS.map((entry) => ({
    id: `get-manage-link-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'get_manage_link' as const,
      rescueReason: entry.rescueReason,
      useSurfaceGetManageLinkRescue: true,
    },
  })),
  ...GET_MANAGE_LINK_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `get-manage-link-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'get_manage_link' as const,
      rescueReason: entry.rescueReason,
      useSurfaceGetManageLinkRescue: true,
      needsMultilingual: true,
    },
  })),
];

/** Map customer/public recover lost manage link (ai-cmd-customer-4.17.3). */
export const AI_COMMAND_EVAL_RECOVER_LOST_MANAGE_LINK_CASES: AiCommandEvalCase[] =
  [
    ...RECOVER_LOST_MANAGE_LINK_PROMPTS.map((entry) => ({
      id: `recover-manage-link-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'recover_lost_manage_link' as const,
        rescueReason: entry.rescueReason,
        useSurfaceRecoverLostManageLinkRescue: true,
        ...(entry.email ? { paramsPartial: { email: entry.email } } : {}),
        ...(entry.phone ? { paramsPartial: { phone: entry.phone } } : {}),
      },
    })),
    ...RECOVER_LOST_MANAGE_LINK_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `recover-manage-link-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'recover_lost_manage_link' as const,
        rescueReason: entry.rescueReason,
        useSurfaceRecoverLostManageLinkRescue: true,
        needsMultilingual: true,
      },
    })),
    ...RECOVER_LOST_MANAGE_LINK_RESCUE_SCENARIOS.map((entry) => ({
      id: `recover-manage-link-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'recover_lost_manage_link' as const,
        rescueReason: 'recover_manage_link',
        useSurfaceRecoverLostManageLinkRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer notify running late (ai-cmd-customer-4.4.6). */
export const AI_COMMAND_EVAL_NOTIFY_RUNNING_LATE_CASES: AiCommandEvalCase[] = [
  ...NOTIFY_RUNNING_LATE_PROMPTS.map((entry) => ({
    id: `notify-running-late-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'notify_running_late' as const,
      rescueReason: entry.rescueReason,
      useSurfaceNotifyRunningLateRescue: true,
      paramsPartial: {
        ...(entry.minutesLate ? { minutesLate: entry.minutesLate } : {}),
        ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
      },
    },
  })),
  ...NOTIFY_RUNNING_LATE_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `notify-running-late-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'notify_running_late' as const,
      rescueReason: entry.rescueReason,
      useSurfaceNotifyRunningLateRescue: true,
      needsMultilingual: true,
      ...(entry.minutesLate
        ? { paramsPartial: { minutesLate: entry.minutesLate } }
        : {}),
    },
  })),
];

/** Map customer leave visit review (ai-cmd-customer-4.12.1). */
export const AI_COMMAND_EVAL_LEAVE_VISIT_REVIEW_CASES: AiCommandEvalCase[] = [
  ...LEAVE_VISIT_REVIEW_PROMPTS.map((entry) => ({
    id: `leave-visit-review-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'leave_visit_review' as const,
      rescueReason: entry.rescueReason,
      useSurfaceLeaveVisitReviewRescue: true,
      paramsPartial: {
        ...(entry.rating ? { rating: entry.rating } : {}),
        ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
      },
    },
  })),
  ...LEAVE_VISIT_REVIEW_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `leave-visit-review-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'leave_visit_review' as const,
      rescueReason: entry.rescueReason,
      useSurfaceLeaveVisitReviewRescue: true,
      needsMultilingual: true,
      paramsPartial: {
        ...(entry.rating ? { rating: entry.rating } : {}),
        ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
      },
    },
  })),
];

/** Map customer explain post-visit review popup (ai-cmd-customer-4.12.2). */
export const AI_COMMAND_EVAL_EXPLAIN_POST_VISIT_REVIEW_PROMPT_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS.map((entry) => ({
      id: `explain-post-visit-review-prompt-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_post_visit_review_prompt' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainPostVisitReviewPromptRescue: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_POST_VISIT_REVIEW_PROMPT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-post-visit-review-prompt-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_post_visit_review_prompt' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainPostVisitReviewPromptRescue: true,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
  ];

/** Map customer report booking problem (ai-cmd-customer-4.12.3). */
export const AI_COMMAND_EVAL_REPORT_BOOKING_PROBLEM_CASES: AiCommandEvalCase[] =
  [
    ...REPORT_BOOKING_PROBLEM_PROMPTS.map((entry) => ({
      id: `report-booking-problem-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'report_booking_problem' as const,
        rescueReason: entry.rescueReason,
        useSurfaceReportBookingProblemRescue: true,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
          ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
        },
      },
    })),
    ...REPORT_BOOKING_PROBLEM_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `report-booking-problem-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'report_booking_problem' as const,
        rescueReason: entry.rescueReason,
        useSurfaceReportBookingProblemRescue: true,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
  ];

/** Map customer explain share reward (ai-cmd-customer-4.12.4). */
export const AI_COMMAND_EVAL_EXPLAIN_SHARE_REWARD_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_SHARE_REWARD_PROMPTS.map((entry) => ({
    id: `explain-share-reward-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_share_reward' as const,
      rescueReason: entry.rescueReason,
      useSurfaceExplainShareRewardRescue: true,
      ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
    },
  })),
  ...EXPLAIN_SHARE_REWARD_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `explain-share-reward-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'explain_share_reward' as const,
      rescueReason: entry.rescueReason,
      useSurfaceExplainShareRewardRescue: true,
      needsMultilingual: true,
      ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
    },
  })),
];

/** Map customer sign in after booking (ai-cmd-customer-4.12.5). */
export const AI_COMMAND_EVAL_SIGN_IN_AFTER_BOOKING_CASES: AiCommandEvalCase[] =
  [
    ...SIGN_IN_AFTER_BOOKING_PROMPTS.map((entry) => ({
      id: `sign-in-after-booking-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'sign_in_after_booking' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSignInAfterBookingRescue: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...SIGN_IN_AFTER_BOOKING_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `sign-in-after-booking-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'sign_in_after_booking' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSignInAfterBookingRescue: true,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
  ];

/** Map customer/public waitlist join + status (ai-cmd-customer-4.4.7). */
export const AI_COMMAND_EVAL_CUSTOMER_WAITLIST_CASES: AiCommandEvalCase[] = [
  ...JOIN_WAITLIST_PROMPTS.map((entry) => ({
    id: `join-waitlist-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'join_waitlist' as const,
      rescueReason: entry.rescueReason,
      useSurfaceCustomerWaitlistRescue: true,
      ...(entry.serviceName || entry.timeOfDay
        ? {
            paramsPartial: {
              ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
              ...(entry.timeOfDay ? { timeOfDay: entry.timeOfDay } : {}),
            },
          }
        : {}),
    },
  })),
  ...CHECK_WAITLIST_STATUS_PROMPTS.map((entry) => ({
    id: `check-waitlist-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'check_waitlist_status' as const,
      rescueReason: entry.rescueReason,
      useSurfaceCustomerWaitlistRescue: true,
    },
  })),
  ...CUSTOMER_WAITLIST_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `customer-waitlist-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.rescueReason,
      useSurfaceCustomerWaitlistRescue: true,
      needsMultilingual: true,
      ...(entry.serviceName
        ? { paramsPartial: { serviceName: entry.serviceName } }
        : {}),
    },
  })),
  ...CUSTOMER_WAITLIST_RESCUE_SCENARIOS.map((entry) => ({
    id: `customer-waitlist-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      useSurfaceCustomerWaitlistRescue: true,
      rescueFromAction: entry.misclassifiedAction,
    },
  })),
];

/** Map customer rebook-last-appointment prompts (ai-cmd-customer-4.4.8). */
export const AI_COMMAND_EVAL_REBOOK_LAST_APPOINTMENT_CASES: AiCommandEvalCase[] =
  [
    ...REBOOK_LAST_APPOINTMENT_PROMPTS.map((entry) => ({
      id: `rebook-last-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'rebook_last_appointment' as const,
        rescueReason: entry.rescueReason,
        useSurfaceRebookLastAppointmentRescue: true,
        ...(entry.serviceName
          ? { paramsPartial: { serviceName: entry.serviceName } }
          : {}),
      },
    })),
    ...REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `rebook-last-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'rebook_last_appointment' as const,
        rescueReason: entry.rescueReason,
        useSurfaceRebookLastAppointmentRescue: true,
        needsMultilingual: true,
      },
    })),
    ...REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS.map((entry) => ({
      id: `rebook-last-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        useSurfaceRebookLastAppointmentRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer explain cancel policy + deposit forfeiture (ai-cmd-customer-4.4.4). */
export const AI_COMMAND_EVAL_EXPLAIN_CANCEL_POLICY_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_CANCEL_POLICY_PROMPTS.map((entry) => ({
      id: `explain-cancel-policy-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_cancel_policy' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainCancelPolicyRescue: true,
      },
    })),
    ...EXPLAIN_CANCEL_POLICY_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-cancel-policy-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_cancel_policy' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainCancelPolicyRescue: true,
        needsMultilingual: true,
      },
    })),
  ];

/** Map customer/public explain deposit forfeiture (ai-cmd-customer-4.20.2). */
export const AI_COMMAND_EVAL_EXPLAIN_DEPOSIT_FORFEITURE_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS.map((entry) => ({
      id: `explain-deposit-forfeiture-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_deposit_forfeiture' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainDepositForfeitureRescue: true,
      },
    })),
    ...EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-deposit-forfeiture-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_deposit_forfeiture' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainDepositForfeitureRescue: true,
        needsMultilingual: true,
      },
    })),
  ];

/** Map customer/public budget discover chip → find_services_under_budget (ai-cmd-customer-4.20.3). */
export const AI_COMMAND_EVAL_FIND_SERVICES_UNDER_BUDGET_CASES: AiCommandEvalCase[] =
  [
    ...FIND_SERVICES_UNDER_BUDGET_PROMPTS.map((entry) => ({
      id: `find-services-under-budget-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'find_services_under_budget' as const,
        rescueReason: entry.rescueReason,
        useSurfaceFindServicesUnderBudgetRescue: true,
        paramsPartial: entry.expectedParams,
      },
    })),
    ...FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `find-services-under-budget-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'find_services_under_budget' as const,
        rescueReason: entry.rescueReason,
        useSurfaceFindServicesUnderBudgetRescue: true,
        needsMultilingual: true,
        paramsPartial: entry.expectedParams,
      },
    })),
  ];

/** Map customer/public evening/weekend discover chip → find_evening_weekend_slots (ai-cmd-customer-4.20.4). */
export const AI_COMMAND_EVAL_FIND_EVENING_WEEKEND_SLOTS_CASES: AiCommandEvalCase[] =
  [
    ...FIND_EVENING_WEEKEND_SLOTS_PROMPTS.map((entry) => ({
      id: `find-evening-weekend-slots-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'find_evening_weekend_slots' as const,
        rescueReason: entry.rescueReason,
        useSurfaceFindEveningWeekendSlotsRescue: true,
        paramsPartial: entry.expectedParams,
      },
    })),
    ...FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `find-evening-weekend-slots-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'find_evening_weekend_slots' as const,
        rescueReason: entry.rescueReason,
        useSurfaceFindEveningWeekendSlotsRescue: true,
        needsMultilingual: true,
        paramsPartial: entry.expectedParams,
      },
    })),
  ];

/** Map customer/public manage booking page UX prompts (ai-cmd-customer-4.20.7) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_MANAGE_BOOKING_PAGE_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS.map((entry) => ({
      id: `explain-manage-booking-page-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_manage_booking_page' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue:
          entry.surface === 'customer' || entry.surface === 'public',
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
        },
      },
    })),
    ...EXPLAIN_MANAGE_BOOKING_PAGE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-manage-booking-page-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_manage_booking_page' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue:
          entry.surface === 'customer' || entry.surface === 'public',
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
        },
        needsMultilingual: true,
      },
    })),
    ...EXPLAIN_MANAGE_BOOKING_PAGE_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-manage-booking-page-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_manage_booking_page' as const,
        rescueReason: 'manage_booking_page',
        rescueFromAction: entry.misclassifiedAction,
        useSurfaceSelfServiceRescue: true,
      },
    })),
  ];

/** Map customer/public salon profile prompts (ai-cmd-customer-4.20.5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_SALON_PROFILE_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_SALON_PROFILE_PROMPTS.map((entry) => ({
      id: `explain-salon-profile-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_salon_profile' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
        },
      },
    })),
    ...EXPLAIN_SALON_PROFILE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-salon-profile-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_salon_profile' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
        },
        needsMultilingual: true,
      },
    })),
  ];

/** Map customer explain loyalty points (ai-cmd-customer-4.5.1). */
export const AI_COMMAND_EVAL_EXPLAIN_LOYALTY_POINTS_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_LOYALTY_POINTS_PROMPTS.map((entry) => ({
      id: `explain-loyalty-points-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_loyalty_points' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainLoyaltyPointsRescue: true,
      },
    })),
    ...EXPLAIN_LOYALTY_POINTS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-loyalty-points-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_loyalty_points' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainLoyaltyPointsRescue: true,
        needsMultilingual: true,
      },
    })),
    ...EXPLAIN_LOYALTY_POINTS_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-loyalty-points-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        useSurfaceExplainLoyaltyPointsRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer apply loyalty at checkout (ai-cmd-customer-4.5.2) to eval golden cases. */
export const AI_COMMAND_EVAL_APPLY_LOYALTY_AT_CHECKOUT_CASES: AiCommandEvalCase[] =
  [
    ...APPLY_LOYALTY_AT_CHECKOUT_PROMPTS.map((entry) => ({
      id: `apply-loyalty-at-checkout-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'apply_loyalty_at_checkout',
        rescueReason: entry.rescueReason,
        useSurfaceMarketingGrowthRescue: true,
        ...(typeof entry.loyaltyPointsToRedeem === 'number'
          ? {
              paramsPartial: {
                loyaltyPointsToRedeem: entry.loyaltyPointsToRedeem,
              },
            }
          : {}),
      },
    })),
    ...APPLY_LOYALTY_AT_CHECKOUT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `apply-loyalty-at-checkout-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'apply_loyalty_at_checkout',
        rescueReason: entry.rescueReason,
        useSurfaceMarketingGrowthRescue: true,
        needsMultilingual: true,
        ...(typeof entry.loyaltyPointsToRedeem === 'number'
          ? {
              paramsPartial: {
                loyaltyPointsToRedeem: entry.loyaltyPointsToRedeem,
              },
            }
          : {}),
      },
    })),
    ...APPLY_LOYALTY_AT_CHECKOUT_RESCUE_SCENARIOS.map((entry) => ({
      id: `apply-loyalty-at-checkout-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        useSurfaceMarketingGrowthRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer explain my subscription (ai-cmd-customer-4.5.3) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_MY_SUBSCRIPTION_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_MY_SUBSCRIPTION_PROMPTS.map((entry) => ({
      id: `explain-my-subscription-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_my_subscription',
        rescueReason: entry.rescueReason,
        useSurfaceExplainMySubscriptionRescue: true,
      },
    })),
    ...EXPLAIN_MY_SUBSCRIPTION_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-my-subscription-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_my_subscription',
        rescueReason: entry.rescueReason,
        useSurfaceExplainMySubscriptionRescue: true,
        needsMultilingual: true,
      },
    })),
    ...EXPLAIN_MY_SUBSCRIPTION_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-my-subscription-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        useSurfaceExplainMySubscriptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map subscription_usage prompts (ai-cmd-customer-6.6.7) to eval golden cases. */
export const AI_COMMAND_EVAL_SUBSCRIPTION_USAGE_CASES: AiCommandEvalCase[] = [
  ...SUBSCRIPTION_USAGE_PROMPTS.map((entry) => ({
    id: `subscription-usage-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'subscription_usage',
      rescueReason: entry.rescueReason,
      useSurfaceCustomerCrmRescue: true,
    },
  })),
  ...SUBSCRIPTION_USAGE_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `subscription-usage-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'subscription_usage',
      rescueReason: entry.rescueReason,
      useSurfaceCustomerCrmRescue: true,
      needsMultilingual: true,
    },
  })),
];

/** Map request_gift_card_modify prompts (ai-cmd-customer-6.7.4) to eval golden cases. */
export const AI_COMMAND_EVAL_GIFT_CARD_MODIFY_CASES: AiCommandEvalCase[] = [
  ...GIFT_CARD_MODIFY_PROMPTS.map((entry) => ({
    id: `gift-card-modify-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'request_gift_card_modify',
      rescueReason: entry.rescueReason,
      useSurfaceCustomerCrmRescue: true,
    },
  })),
  ...GIFT_CARD_MODIFY_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `gift-card-modify-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'request_gift_card_modify',
      rescueReason: entry.rescueReason,
      useSurfaceCustomerCrmRescue: true,
      needsMultilingual: true,
    },
  })),
];

/** Map customer manage notification preferences (ai-cmd-customer-4.5.4) to eval golden cases. */
export const AI_COMMAND_EVAL_MANAGE_NOTIFICATION_PREFERENCES_CASES: AiCommandEvalCase[] =
  [
    ...MANAGE_NOTIFICATION_PREFERENCES_PROMPTS.map((entry) => ({
      id: `manage-notification-preferences-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'manage_notification_preferences',
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
      },
    })),
    ...MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `manage-notification-preferences-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'manage_notification_preferences',
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        needsMultilingual: true,
      },
    })),
    ...MANAGE_NOTIFICATION_PREFERENCES_RESCUE_SCENARIOS.map((entry) => ({
      id: `manage-notification-preferences-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        useSurfaceConsumerAdoptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer enable push notifications (ai-cmd-customer-4.13.1). */
export const AI_COMMAND_EVAL_CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CASES: AiCommandEvalCase[] =
  [
    ...CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS.map((entry) => ({
      id: `customer-enable-push-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'enable_push_notifications',
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
      },
    })),
    ...CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS.map(
      (entry) => ({
        id: `customer-enable-push-${entry.id}`,
        prompt: entry.prompt,
        surface: entry.surface,
        locale: entry.locale,
        expect: {
          rescuedAction: 'enable_push_notifications',
          rescueReason: entry.rescueReason,
          useSurfaceConsumerAdoptionRescue: true,
          needsMultilingual: true,
        },
      }),
    ),
    ...CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS.map((entry) => ({
      id: `customer-enable-push-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: 'customer_enable_push',
        useSurfaceConsumerAdoptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer explain push permission (ai-cmd-customer-4.13.2). */
export const AI_COMMAND_EVAL_EXPLAIN_PUSH_PERMISSION_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PUSH_PERMISSION_PROMPTS.map((entry) => ({
      id: `explain-push-permission-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_push_permission' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_PUSH_PERMISSION_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-push-permission-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_push_permission' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_PUSH_PERMISSION_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-push-permission-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: 'push_permission',
        useSurfaceConsumerAdoptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer explain offline mode (ai-cmd-customer-4.13.3). */
export const AI_COMMAND_EVAL_EXPLAIN_OFFLINE_MODE_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_OFFLINE_MODE_PROMPTS.map((entry) => ({
    id: `explain-offline-mode-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_offline_mode' as const,
      rescueReason: entry.rescueReason,
      useSurfaceConsumerAdoptionRescue: true,
      ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
    },
  })),
  ...EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `explain-offline-mode-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'explain_offline_mode' as const,
      rescueReason: entry.rescueReason,
      useSurfaceConsumerAdoptionRescue: true,
      needsMultilingual: true,
      ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
    },
  })),
  ...EXPLAIN_OFFLINE_MODE_RESCUE_SCENARIOS.map((entry) => ({
    id: `explain-offline-mode-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'consumer_offline',
      useSurfaceConsumerAdoptionRescue: true,
      rescueFromAction: entry.misclassifiedAction,
    },
  })),
];

/** Map customer explain app update required (ai-cmd-customer-4.13.4). */
export const AI_COMMAND_EVAL_EXPLAIN_APP_UPDATE_REQUIRED_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_APP_UPDATE_REQUIRED_PROMPTS.map((entry) => ({
      id: `explain-app-update-required-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_app_update_required' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-app-update-required-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_app_update_required' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_APP_UPDATE_REQUIRED_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-app-update-required-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: 'app_update_gate',
        useSurfaceConsumerAdoptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer explain analytics consent (ai-cmd-customer-4.13.5). */
export const AI_COMMAND_EVAL_EXPLAIN_ANALYTICS_CONSENT_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_ANALYTICS_CONSENT_PROMPTS.map((entry) => ({
      id: `explain-analytics-consent-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_analytics_consent' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_ANALYTICS_CONSENT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-analytics-consent-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_analytics_consent' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_ANALYTICS_CONSENT_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-analytics-consent-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: 'analytics_consent',
        useSurfaceConsumerAdoptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer explain home screen widget (ai-cmd-customer-4.13.6). */
export const AI_COMMAND_EVAL_EXPLAIN_HOME_SCREEN_WIDGET_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_HOME_SCREEN_WIDGET_PROMPTS.map((entry) => ({
      id: `explain-home-screen-widget-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_home_screen_widget' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_HOME_SCREEN_WIDGET_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-home-screen-widget-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_home_screen_widget' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_HOME_SCREEN_WIDGET_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-home-screen-widget-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: 'home_screen_widget',
        useSurfaceConsumerAdoptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer explain patient alert banner (ai-cmd-customer-4.14.3). */
export const AI_COMMAND_EVAL_EXPLAIN_PATIENT_ALERT_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PATIENT_ALERT_PROMPTS.map((entry) => ({
      id: `explain-patient-alert-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_patient_alert' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-patient-alert-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_patient_alert' as const,
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_PATIENT_ALERT_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-patient-alert-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: 'patient_alert',
        useSurfaceConsumerAdoptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer explain multi-service cart (ai-cmd-customer-4.6.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_MULTI_SERVICE_CART_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_MULTI_SERVICE_CART_PROMPTS.map((entry) => ({
      id: `explain-multi-service-cart-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_multi_service_cart',
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue: true,
      },
    })),
    ...EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-multi-service-cart-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_multi_service_cart',
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue: true,
        needsMultilingual: true,
      },
    })),
    ...EXPLAIN_MULTI_SERVICE_CART_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-multi-service-cart-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: 'explain_multi_service_cart',
        useSurfaceSelfServiceRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public book package nearest slot compound (ai-cmd-customer-4.6.2). */
export const AI_COMMAND_EVAL_BOOK_PACKAGE_WITH_NEAREST_SLOT_CASES: AiCommandEvalCase[] =
  [
    ...BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS.map((entry) => ({
      id: `book-package-with-nearest-slot-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: [...entry.orderedActions],
        compoundSource: 'golden' as const,
        compoundRecipeId:
          entry.surface === 'public'
            ? 'public_book_package_with_nearest_slot'
            : 'book_package_with_nearest_slot',
        compoundStepParams: entry.packageName
          ? [
              {
                stepIndex: 1,
                paramsPartial: { packageName: entry.packageName },
              },
            ]
          : undefined,
      },
    })),
    ...BOOK_PACKAGE_WITH_NEAREST_SLOT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `book-package-with-nearest-slot-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.id.startsWith('hy-') ? ('hy' as const) : ('ru' as const),
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: [...entry.orderedActions],
        compoundSource: 'golden' as const,
        compoundRecipeId:
          entry.surface === 'public'
            ? 'public_book_package_with_nearest_slot'
            : 'book_package_with_nearest_slot',
        needsMultilingual: true,
      },
    })),
    ...BOOK_PACKAGE_WITH_NEAREST_SLOT_RESCUE_SCENARIOS.map((entry) => ({
      id: `book-package-with-nearest-slot-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: ['discover_packages', 'book_package'],
        compoundSource: 'golden' as const,
        rescueReason: 'book_package_with_nearest_slot_compound',
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public book lab collection nearest compound (ai-cmd-customer-4.7.3). */
export const AI_COMMAND_EVAL_BOOK_LAB_COLLECTION_NEAREST_CASES: AiCommandEvalCase[] =
  [
    ...BOOK_LAB_COLLECTION_NEAREST_PROMPTS.map((entry) => ({
      id: `book-lab-collection-nearest-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: [...entry.orderedActions],
        compoundSource: 'golden' as const,
        compoundRecipeId:
          entry.surface === 'public'
            ? 'public_book_lab_collection_nearest'
            : 'book_lab_collection_nearest',
        compoundStepParams: entry.testName
          ? [{ stepIndex: 1, paramsPartial: { testName: entry.testName } }]
          : [{ stepIndex: 1, paramsPartial: { bookingFirstAvailable: true } }],
      },
    })),
    ...BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `book-lab-collection-nearest-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: [...entry.orderedActions],
        compoundSource: 'golden' as const,
        compoundRecipeId:
          entry.surface === 'public'
            ? 'public_book_lab_collection_nearest'
            : 'book_lab_collection_nearest',
        needsMultilingual: true,
      },
    })),
    ...BOOK_LAB_COLLECTION_NEAREST_RESCUE_SCENARIOS.map((entry) => ({
      id: `book-lab-collection-nearest-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: ['list_my_lab_booking_requests', 'book_lab_collection'],
        compoundSource: 'golden' as const,
        rescueReason: 'book_lab_collection_nearest_compound',
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public book tour nearest departure compound (ai-cmd-customer-4.10.5). */
export const AI_COMMAND_EVAL_BOOK_TOUR_NEAREST_DEPARTURE_CASES: AiCommandEvalCase[] =
  [
    ...BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS.map((entry) => ({
      id: `book-tour-nearest-departure-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: [...entry.orderedActions],
        compoundSource: 'golden' as const,
        compoundRecipeId:
          entry.surface === 'public'
            ? 'public_book_tour_nearest_departure'
            : 'book_tour_nearest_departure',
        compoundStepParams: [
          {
            stepIndex: 2,
            paramsPartial: {
              bookingFirstAvailable: true,
              ...(entry.paxCount != null ? { paxCount: entry.paxCount } : {}),
              ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
            },
          },
        ],
      },
    })),
    ...BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `book-tour-nearest-departure-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: [...entry.orderedActions],
        compoundSource: 'golden' as const,
        compoundRecipeId:
          entry.surface === 'public'
            ? 'public_book_tour_nearest_departure'
            : 'book_tour_nearest_departure',
        needsMultilingual: true,
      },
    })),
    ...BOOK_TOUR_NEAREST_DEPARTURE_RESCUE_SCENARIOS.map((entry) => ({
      id: `book-tour-nearest-departure-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps:
          entry.surface === 'public'
            ? [
                'explain_tour_booking',
                'explain_tour_day_slots',
                'book_appointment',
              ]
            : [
                'explain_tour_booking',
                'explain_tour_day_slots',
                'book_nearest_slot',
              ],
        compoundSource: 'golden' as const,
        rescueReason: 'book_tour_nearest_departure_compound',
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public explain_public_intake_form (ai-cmd-customer-4.14.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PUBLIC_INTAKE_FORM_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS.map((entry) => ({
      id: `explain-public-intake-form-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_public_intake_form',
        rescueReason: entry.rescueReason,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-public-intake-form-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_public_intake_form',
        rescueReason: entry.rescueReason,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_PUBLIC_INTAKE_FORM_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-public-intake-form-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_public_intake_form',
        rescueReason: 'public_intake_form',
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public complete_intake_and_book compound (ai-cmd-customer-4.14.2). */
export const AI_COMMAND_EVAL_COMPLETE_INTAKE_AND_BOOK_CASES: AiCommandEvalCase[] =
  [
    ...COMPLETE_INTAKE_AND_BOOK_PROMPTS.map((entry) => ({
      id: `complete-intake-and-book-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: [...entry.orderedActions],
        compoundSource: 'golden' as const,
        compoundRecipeId:
          entry.surface === 'public'
            ? 'public_complete_intake_and_book'
            : 'complete_intake_and_book',
        compoundStepParams: entry.serviceName
          ? [
              {
                stepIndex: 0,
                paramsPartial: {
                  preVisitIntakeRequired: true,
                  serviceName: entry.serviceName,
                },
              },
            ]
          : [{ stepIndex: 0, paramsPartial: { preVisitIntakeRequired: true } }],
      },
    })),
    ...COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `complete-intake-and-book-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps: [...entry.orderedActions],
        compoundSource: 'golden' as const,
        compoundRecipeId:
          entry.surface === 'public'
            ? 'public_complete_intake_and_book'
            : 'complete_intake_and_book',
        needsMultilingual: true,
      },
    })),
    ...COMPLETE_INTAKE_AND_BOOK_RESCUE_SCENARIOS.map((entry) => ({
      id: `complete-intake-and-book-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        routeTier: 'compound' as const,
        compoundSurface: entry.surface,
        compoundSteps:
          entry.surface === 'public'
            ? ['complete_intake_and_book', 'book_appointment']
            : ['complete_intake_and_book', 'book_nearest_slot'],
        compoundSource: 'golden' as const,
        rescueReason: 'complete_intake_and_book_compound',
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public explain_clinic_booking_fields (ai-cmd-customer-4.7.4) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_CLINIC_BOOKING_FIELDS_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS.map((entry) => ({
      id: `explain-clinic-booking-fields-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_clinic_booking_fields',
        rescueReason: entry.rescueReason,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-clinic-booking-fields-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_clinic_booking_fields',
        rescueReason: entry.rescueReason,
        needsMultilingual: true,
        ...(entry.aspect ? { paramsPartial: { aspect: entry.aspect } } : {}),
      },
    })),
    ...EXPLAIN_CLINIC_BOOKING_FIELDS_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-clinic-booking-fields-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_clinic_booking_fields',
        rescueReason: 'clinic_booking_fields',
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer book_with_gift_card (ai-cmd-customer-4.6.3) to eval golden cases. */
export const AI_COMMAND_EVAL_BOOK_WITH_GIFT_CARD_CASES: AiCommandEvalCase[] = [
  ...BOOK_WITH_GIFT_CARD_PROMPTS.map((entry) => ({
    id: `book-with-gift-card-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'book_with_gift_card',
      rescueReason: entry.rescueReason,
      useSurfaceSelfServiceRescue: true,
    },
  })),
  ...BOOK_WITH_GIFT_CARD_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `book-with-gift-card-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: entry.locale,
    expect: {
      rescuedAction: 'book_with_gift_card',
      rescueReason: entry.rescueReason,
      useSurfaceSelfServiceRescue: true,
      needsMultilingual: true,
    },
  })),
  ...BOOK_WITH_GIFT_CARD_RESCUE_SCENARIOS.map((entry) => ({
    id: `book-with-gift-card-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'book_with_gift_card',
      rescueReason: 'book_gift_card',
      useSurfaceSelfServiceRescue: true,
      rescueFromAction: entry.misclassifiedAction,
    },
  })),
  ...BOOK_WITH_GIFT_CARD_COMPOUND_SCENARIOS.map((entry) => ({
    id: `book-with-gift-card-compound-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      routeTier: 'compound' as const,
      compoundSurface: 'customer' as const,
      compoundSteps: [...entry.orderedActions],
      compoundSource: 'golden' as const,
      compoundRecipeId: 'customer_book_with_gift_card_compound',
      compoundStepParams: entry.giftCardCode
        ? [
            {
              stepIndex: 1,
              paramsPartial: { giftCardCode: entry.giftCardCode },
            },
          ]
        : undefined,
    },
  })),
];

/** Map customer/public explain_package_savings (ai-cmd-customer-4.6.5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PACKAGE_SAVINGS_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PACKAGE_SAVINGS_PROMPTS.map((entry) => ({
      id: `explain-package-savings-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_package_savings',
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue: true,
        ...(entry.packageName
          ? { paramsPartial: { packageName: entry.packageName } }
          : {}),
      },
    })),
    ...EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-package-savings-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_package_savings',
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue: true,
        needsMultilingual: true,
        ...(entry.packageName
          ? { paramsPartial: { packageName: entry.packageName } }
          : {}),
      },
    })),
    ...EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-package-savings-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_package_savings',
        rescueReason: 'package_savings',
        useSurfaceSelfServiceRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public explain_subscription_vs_one_time (ai-cmd-customer-4.16.3) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS.map((entry) => ({
      id: `explain-subscription-vs-one-time-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_subscription_vs_one_time',
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue: true,
        ...(entry.serviceName || entry.planName || entry.focus
          ? {
              paramsPartial: {
                ...(entry.serviceName
                  ? { serviceName: entry.serviceName }
                  : {}),
                ...(entry.planName ? { planName: entry.planName } : {}),
                ...(entry.focus ? { focus: entry.focus } : {}),
              },
            }
          : {}),
      },
    })),
    ...EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-subscription-vs-one-time-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_subscription_vs_one_time',
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue: true,
        needsMultilingual: true,
        ...(entry.serviceName
          ? { paramsPartial: { serviceName: entry.serviceName } }
          : {}),
        ...(entry.focus ? { paramsPartial: { focus: entry.focus } } : {}),
      },
    })),
    ...EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-subscription-vs-one-time-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_subscription_vs_one_time',
        rescueReason: 'subscription_vs_one_time',
        useSurfaceSelfServiceRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer/public how_to_download_app (ai-cmd-customer-4.5.7) to eval golden cases. */
export const AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES: AiCommandEvalCase[] = [
  ...HOW_TO_DOWNLOAD_APP_PROMPTS.map((entry) => ({
    id: `how-to-download-app-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'how_to_download_app',
      rescueReason: entry.rescueReason,
      useSurfaceMarketingGrowthRescue: true,
    },
  })),
  ...HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `how-to-download-app-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'how_to_download_app',
      rescueReason: entry.rescueReason,
      useSurfaceMarketingGrowthRescue: true,
      needsMultilingual: true,
    },
  })),
  ...HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS.map((entry) => ({
    id: `how-to-download-app-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'download_app',
      useSurfaceMarketingGrowthRescue: true,
      rescueFromAction: entry.misclassifiedAction,
    },
  })),
];

/** Map customer update my profile (ai-cmd-customer-4.5.6) to eval golden cases. */
export const AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES: AiCommandEvalCase[] = [
  ...UPDATE_MY_PROFILE_PROMPTS.map((entry) => ({
    id: `update-my-profile-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'update_my_profile',
      rescueReason: entry.rescueReason,
      useSurfaceUpdateMyProfileRescue: true,
    },
  })),
  ...UPDATE_MY_PROFILE_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `update-my-profile-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: entry.locale,
    expect: {
      rescuedAction: 'update_my_profile',
      rescueReason: entry.rescueReason,
      useSurfaceUpdateMyProfileRescue: true,
      needsMultilingual: true,
    },
  })),
  ...UPDATE_MY_PROFILE_RESCUE_SCENARIOS.map((entry) => ({
    id: `update-my-profile-rescue-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      useSurfaceUpdateMyProfileRescue: true,
      rescueFromAction: entry.misclassifiedAction,
    },
  })),
];

/** Map customer explain my notifications (ai-cmd-customer-4.5.5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_MY_NOTIFICATIONS_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_MY_NOTIFICATIONS_PROMPTS.map((entry) => ({
      id: `explain-my-notifications-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_my_notifications',
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
      },
    })),
    ...EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-my-notifications-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_my_notifications',
        rescueReason: entry.rescueReason,
        useSurfaceConsumerAdoptionRescue: true,
        needsMultilingual: true,
      },
    })),
    ...EXPLAIN_MY_NOTIFICATIONS_RESCUE_SCENARIOS.map((entry) => ({
      id: `explain-my-notifications-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.expectedAction,
        useSurfaceConsumerAdoptionRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer list upcoming appointments prompts (ai-cmd-customer-4.4.1) to eval golden cases. */
export const AI_COMMAND_EVAL_LIST_MY_UPCOMING_APPOINTMENTS_CASES: AiCommandEvalCase[] =
  [
    ...LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS.map((entry) => ({
      id: `list-my-upcoming-appointments-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'list_my_upcoming_appointments' as const,
        rescueReason: entry.rescueReason,
        useSurfaceListMyUpcomingAppointmentsRescue: true,
        paramsPartial: { scope: entry.scope },
      },
    })),
    ...LIST_MY_UPCOMING_APPOINTMENTS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `list-my-upcoming-appointments-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'list_my_upcoming_appointments' as const,
        rescueReason: entry.rescueReason,
        useSurfaceListMyUpcomingAppointmentsRescue: true,
        needsMultilingual: true,
        paramsPartial: { scope: entry.scope },
      },
    })),
  ];

/** Map customer resume pending payment prompts (ai-cmd-customer-4.2.3) to eval golden cases. */
export const AI_COMMAND_EVAL_RESUME_PENDING_PAYMENT_CASES: AiCommandEvalCase[] =
  [
    ...RESUME_PENDING_PAYMENT_PROMPTS.map((entry) => ({
      id: `resume-pending-payment-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'resume_pending_payment' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
    ...RESUME_PENDING_PAYMENT_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `resume-pending-payment-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'resume_pending_payment' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
  ];

/** Map customer/public diagnose checkout payment failure prompts (ai-cmd-customer-4.18.1) to eval golden cases. */
export const AI_COMMAND_EVAL_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_CASES: AiCommandEvalCase[] =
  [
    ...DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_PROMPTS.map((entry) => ({
      id: `diagnose-stripe-checkout-failure-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'diagnose_stripe_checkout_failure' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
    ...DIAGNOSE_STRIPE_CHECKOUT_FAILURE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `diagnose-stripe-checkout-failure-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'diagnose_stripe_checkout_failure' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
  ];

/** Map customer/public pay-at-venue fallback prompts (ai-cmd-customer-4.18.2) to eval golden cases. */
export const AI_COMMAND_EVAL_PAY_AT_VENUE_FALLBACK_CASES: AiCommandEvalCase[] =
  [
    ...PAY_AT_VENUE_FALLBACK_PROMPTS.map((entry) => ({
      id: `pay-at-venue-fallback-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'pay_at_venue_fallback' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
    ...PAY_AT_VENUE_FALLBACK_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `pay-at-venue-fallback-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'pay_at_venue_fallback' as const,
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
      },
    })),
  ];

/** Map customer/public resume booking draft prompts (ai-cmd-customer-4.18.3) to eval golden cases. */
export const AI_COMMAND_EVAL_RESUME_BOOKING_DRAFT_CASES: AiCommandEvalCase[] = [
  ...RESUME_BOOKING_DRAFT_PROMPTS.map((entry) => ({
    id: `resume-booking-draft-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'resume_booking_draft' as const,
      rescueReason: entry.rescueReason,
      useSurfaceResumeBookingDraftRescue: true,
    },
  })),
  ...RESUME_BOOKING_DRAFT_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `resume-booking-draft-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'resume_booking_draft' as const,
      rescueReason: entry.rescueReason,
      useSurfaceResumeBookingDraftRescue: true,
    },
  })),
];

/** Map customer/public explain slot no longer available prompts (ai-cmd-customer-4.18.4) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_SLOT_NO_LONGER_AVAILABLE_PROMPTS.map((entry) => ({
      id: `explain-slot-no-longer-available-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_slot_no_longer_available' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainSlotNoLongerAvailableRescue: true,
      },
    })),
    ...EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-slot-no-longer-available-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_slot_no_longer_available' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainSlotNoLongerAvailableRescue: true,
      },
    })),
  ];

/** Map customer explain multi-service payment return prompts (ai-cmd-customer-4.18.5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_PROMPTS.map((entry) => ({
      id: `explain-multi-service-payment-return-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_multi_service_payment_return' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainMultiServicePaymentReturnRescue: true,
      },
    })),
    ...EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_MULTILINGUAL_SCENARIOS.map(
      (entry) => ({
        id: `explain-multi-service-payment-return-${entry.id}`,
        prompt: entry.prompt,
        surface: entry.surface,
        locale: entry.locale,
        expect: {
          rescuedAction: 'explain_multi_service_payment_return' as const,
          rescueReason: entry.rescueReason,
          useSurfaceExplainMultiServicePaymentReturnRescue: true,
        },
      }),
    ),
  ];

/** Map customer retry failed network action prompts (ai-cmd-customer-4.18.6) to eval golden cases. */
export const AI_COMMAND_EVAL_RETRY_FAILED_NETWORK_ACTION_CASES: AiCommandEvalCase[] =
  [
    ...RETRY_FAILED_NETWORK_ACTION_PROMPTS.map((entry) => ({
      id: `retry-failed-network-action-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'retry_failed_network_action' as const,
        rescueReason: entry.rescueReason,
        useSurfaceRetryFailedNetworkActionRescue: true,
      },
    })),
    ...RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `retry-failed-network-action-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'retry_failed_network_action' as const,
        rescueReason: entry.rescueReason,
        useSurfaceRetryFailedNetworkActionRescue: true,
      },
    })),
  ];

/** Map customer/public explain voice input prompts (ai-cmd-customer-4.19.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_VOICE_INPUT_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_VOICE_INPUT_PROMPTS.map((entry) => ({
    id: `explain-voice-input-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_voice_input' as const,
      rescueReason: entry.rescueReason,
      useSurfaceExplainVoiceInputRescue: true,
    },
  })),
  ...EXPLAIN_VOICE_INPUT_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `explain-voice-input-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'explain_voice_input' as const,
      rescueReason: entry.rescueReason,
      useSurfaceExplainVoiceInputRescue: true,
    },
  })),
];

/** Map customer/public speak assistant reply prompts (ai-cmd-customer-4.19.2) to eval golden cases. */
export const AI_COMMAND_EVAL_SPEAK_ASSISTANT_REPLY_CASES: AiCommandEvalCase[] =
  [
    ...SPEAK_ASSISTANT_REPLY_PROMPTS.map((entry) => ({
      id: `speak-assistant-reply-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'speak_assistant_reply' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSpeakAssistantReplyRescue: true,
      },
    })),
    ...SPEAK_ASSISTANT_REPLY_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `speak-assistant-reply-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'speak_assistant_reply' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSpeakAssistantReplyRescue: true,
      },
    })),
  ];

/** Map customer/public give AI feedback prompts (ai-cmd-customer-4.19.3) to eval golden cases. */
export const AI_COMMAND_EVAL_GIVE_AI_FEEDBACK_CASES: AiCommandEvalCase[] = [
  ...GIVE_AI_FEEDBACK_PROMPTS.map((entry) => ({
    id: `give-ai-feedback-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'give_ai_feedback' as const,
      rescueReason: entry.rescueReason,
      useSurfaceGiveAiFeedbackRescue: true,
    },
  })),
  ...GIVE_AI_FEEDBACK_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `give-ai-feedback-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'give_ai_feedback' as const,
      rescueReason: entry.rescueReason,
      useSurfaceGiveAiFeedbackRescue: true,
    },
  })),
];

/** Map customer/public explain RTL layout prompts (ai-cmd-customer-4.19.4) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_RTL_LAYOUT_CASES: AiCommandEvalCase[] = [
  ...EXPLAIN_RTL_LAYOUT_PROMPTS.map((entry) => ({
    id: `explain-rtl-layout-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'explain_rtl_layout' as const,
      rescueReason: entry.rescueReason,
      useSurfaceExplainRtlLayoutRescue: true,
    },
  })),
  ...EXPLAIN_RTL_LAYOUT_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `explain-rtl-layout-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'explain_rtl_layout' as const,
      rescueReason: entry.rescueReason,
      useSurfaceExplainRtlLayoutRescue: true,
    },
  })),
];

/** Map customer/public get directions to salon prompts (ai-cmd-customer-4.3.3) to eval golden cases. */
export const AI_COMMAND_EVAL_GET_DIRECTIONS_TO_SALON_CASES: AiCommandEvalCase[] =
  [
    ...GET_DIRECTIONS_TO_SALON_PROMPTS.map((entry) => ({
      id: `get-directions-to-salon-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'get_directions_to_salon' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: { aspect: entry.aspect },
      },
    })),
    ...GET_DIRECTIONS_TO_SALON_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `get-directions-to-salon-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'get_directions_to_salon' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: { aspect: entry.aspect },
      },
    })),
  ];

/** Map customer/public explain preparation notes prompts (ai-cmd-customer-4.3.4) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PREPARATION_NOTES_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PREPARATION_NOTES_PROMPTS.map((entry) => ({
      id: `explain-preparation-notes-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_preparation_notes' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue:
          entry.surface === 'customer' || entry.surface === 'public',
        paramsPartial: { aspect: entry.aspect },
      },
    })),
    ...EXPLAIN_PREPARATION_NOTES_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-preparation-notes-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_preparation_notes' as const,
        rescueReason: entry.rescueReason,
        useSurfaceSelfServiceRescue:
          entry.surface === 'customer' || entry.surface === 'public',
        paramsPartial: { aspect: entry.aspect },
      },
    })),
  ];

/** Map customer/public business hours & location prompts (ai-cmd-customer-4.1.5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS.map((entry) => ({
      id: `business-hours-location-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_business_hours_and_location' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
          ...(entry.weekday ? { weekday: entry.weekday } : {}),
        },
      },
    })),
    ...EXPLAIN_BUSINESS_HOURS_AND_LOCATION_MULTILINGUAL_SCENARIOS.map(
      (entry) => ({
        id: `business-hours-location-${entry.id}`,
        prompt: entry.prompt,
        surface: entry.surface,
        locale: entry.locale,
        expect: {
          rescuedAction: 'explain_business_hours_and_location' as const,
          rescueReason: entry.rescueReason,
          paramsPartial: {
            ...(entry.aspect ? { aspect: entry.aspect } : {}),
            ...(entry.weekday ? { weekday: entry.weekday } : {}),
          },
        },
      }),
    ),
  ];

/** Map customer/public provider specialty prompts (ai-cmd-customer-4.1.6) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SPECIALTY_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PROVIDER_SPECIALTY_PROMPTS.map((entry) => ({
      id: `provider-specialty-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_provider_specialty' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
          ...(entry.providerName ? { providerName: entry.providerName } : {}),
          ...(entry.specialtyTopic
            ? { specialtyTopic: entry.specialtyTopic }
            : {}),
        },
      },
    })),
    ...EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `provider-specialty-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_provider_specialty' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
          ...(entry.providerName ? { providerName: entry.providerName } : {}),
          ...(entry.specialtyTopic
            ? { specialtyTopic: entry.specialtyTopic }
            : {}),
        },
      },
    })),
  ];

/** Map customer/public Any stylist option prompts (ai-cmd-customer-4.11.1) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_ANY_PROVIDER_OPTION_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS.map((entry) => ({
      id: `any-provider-option-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_any_provider_option' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
        },
      },
    })),
    ...EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `any-provider-option-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_any_provider_option' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          ...(entry.aspect ? { aspect: entry.aspect } : {}),
        },
      },
    })),
  ];

/** Map pick provider for service prompts (ai-cmd-customer-4.11.2) to eval golden cases. */
export const AI_COMMAND_EVAL_PICK_PROVIDER_FOR_SERVICE_CASES: AiCommandEvalCase[] =
  [
    ...PICK_PROVIDER_FOR_SERVICE_PROMPTS.map((entry) => ({
      id: `pick-provider-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'pick_provider_for_service' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          mode: entry.mode,
          ...(entry.providerName ? { providerName: entry.providerName } : {}),
          ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
        },
      },
    })),
    ...PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `pick-provider-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'pick_provider_for_service' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          mode: entry.mode,
          ...(entry.providerName ? { providerName: entry.providerName } : {}),
          ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
        },
      },
    })),
  ];

/** Map switch provider same time prompts (ai-cmd-customer-4.11.4) to eval golden cases. */
export const AI_COMMAND_EVAL_SWITCH_PROVIDER_SAME_TIME_CASES: AiCommandEvalCase[] =
  [
    ...SWITCH_PROVIDER_SAME_TIME_PROMPTS.map((entry) => ({
      id: `switch-provider-same-time-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'switch_provider_same_time' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          mode: entry.mode,
          ...(entry.providerName ? { providerName: entry.providerName } : {}),
          ...(entry.timeSlot ? { timeSlot: entry.timeSlot } : {}),
        },
      },
    })),
    ...SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `switch-provider-same-time-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'switch_provider_same_time' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          mode: entry.mode,
          ...(entry.providerName ? { providerName: entry.providerName } : {}),
          ...(entry.timeSlot ? { timeSlot: entry.timeSlot } : {}),
        },
      },
    })),
  ];

/** Map explain professional profile prompts (ai-cmd-customer-4.11.5) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PROFESSIONAL_PROFILE_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PROFESSIONAL_PROFILE_PROMPTS.map((entry) => ({
      id: `professional-profile-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_professional_profile' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          aspect: entry.aspect,
          ...(entry.providerName ? { providerName: entry.providerName } : {}),
        },
      },
    })),
    ...EXPLAIN_PROFESSIONAL_PROFILE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `professional-profile-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_professional_profile' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          aspect: entry.aspect,
          ...(entry.providerName ? { providerName: entry.providerName } : {}),
        },
      },
    })),
  ];

/** Map explain provider availability prompts (ai-cmd-customer-4.11.3) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PROVIDER_AVAILABILITY_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS.map((entry) => ({
      id: `provider-availability-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_provider_availability' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          aspect: entry.aspect,
          ...(entry.employeeName ? { employeeName: entry.employeeName } : {}),
        },
      },
    })),
    ...EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `provider-availability-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_provider_availability' as const,
        rescueReason: entry.rescueReason,
        paramsPartial: {
          aspect: entry.aspect,
          ...(entry.employeeName ? { employeeName: entry.employeeName } : {}),
        },
      },
    })),
  ];

/** Map customer loyalty points balance prompts (ai-cmd-customer-4.0 P1) to eval golden cases. */
export const AI_COMMAND_EVAL_LOYALTY_POINTS_BALANCE_CUSTOMER_CASES: AiCommandEvalCase[] =
  LOYALTY_POINTS_BALANCE_PROMPTS.map((entry) => ({
    id: `loyalty-points-balance-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.rescueReason,
      useSurfaceMarketingGrowthRescue: true,
    },
  }));

/** Map customer GDPR privacy export/delete prompts (ai-cmd-customer-4.17.5) to eval golden cases. */
export const AI_COMMAND_EVAL_PRIVACY_GDPR_CUSTOMER_CASES: AiCommandEvalCase[] =
  [
    ...PRIVACY_GDPR_CUSTOMER_PROMPTS.map((entry) => ({
      id: `privacy-gdpr-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfacePrivacyGdprCustomerRescue: true,
      },
    })),
    ...PRIVACY_GDPR_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `privacy-gdpr-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfacePrivacyGdprCustomerRescue: true,
        needsMultilingual: true,
      },
    })),
  ];

/** Map customer physical gift card delivery tracking (ai-cmd-customer-4.6.4) to eval golden cases. */
export const AI_COMMAND_EVAL_TRACK_PHYSICAL_GIFT_CARD_ORDER_CASES: AiCommandEvalCase[] =
  [
    ...TRACK_PHYSICAL_GIFT_CARD_ORDER_PROMPTS.map((entry) => ({
      id: `track-physical-gift-card-order-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'track_physical_gift_card_order',
        rescueReason: entry.rescueReason,
        useSurfaceTrackPhysicalGiftCardOrderRescue: true,
        ...(entry.giftCardOrderId
          ? { paramsPartial: { giftCardId: entry.giftCardOrderId } }
          : {}),
      },
    })),
    ...TRACK_PHYSICAL_GIFT_CARD_ORDER_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `track-physical-gift-card-order-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'track_physical_gift_card_order',
        rescueReason: entry.rescueReason,
        useSurfaceTrackPhysicalGiftCardOrderRescue: true,
        needsMultilingual: true,
      },
    })),
    ...TRACK_PHYSICAL_GIFT_CARD_ORDER_RESCUE_SCENARIOS.map((entry) => ({
      id: `track-physical-gift-card-order-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'track_physical_gift_card_order',
        rescueReason: 'track_gift_card',
        useSurfaceTrackPhysicalGiftCardOrderRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer claim gift card balance prompts (ai-cmd-customer-4.20.6) to eval golden cases. */
export const AI_COMMAND_EVAL_CLAIM_GIFT_CARD_BALANCE_CASES: AiCommandEvalCase[] =
  [
    ...CLAIM_GIFT_CARD_BALANCE_PROMPTS.map((entry) => ({
      id: `claim-gift-card-balance-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'claim_gift_card_balance',
        rescueReason: entry.rescueReason,
        useSurfaceClaimGiftCardBalanceCustomerRescue: true,
        ...(entry.giftCardCode
          ? { paramsPartial: { giftCardCode: entry.giftCardCode } }
          : {}),
      },
    })),
    ...CLAIM_GIFT_CARD_BALANCE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `claim-gift-card-balance-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.id.includes('-hy-') ? ('hy' as const) : ('ru' as const),
      expect: {
        rescuedAction: 'claim_gift_card_balance',
        rescueReason: entry.rescueReason,
        useSurfaceClaimGiftCardBalanceCustomerRescue: true,
        needsMultilingual: true,
        ...(entry.giftCardCode
          ? { paramsPartial: { giftCardCode: entry.giftCardCode } }
          : {}),
      },
    })),
    ...CLAIM_GIFT_CARD_BALANCE_RESCUE_SCENARIOS.map((entry) => ({
      id: `claim-gift-card-balance-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'claim_gift_card_balance',
        rescueReason: entry.rescueReason,
        useSurfaceClaimGiftCardBalanceCustomerRescue: true,
        rescueFromAction: entry.misclassifiedAction,
        ...('giftCardCode' in entry && entry.giftCardCode
          ? { paramsPartial: { giftCardCode: entry.giftCardCode } }
          : {}),
      },
    })),
  ];

/** Map customer gift card cancel-request prompts (ai-cmd-customer-4.0 P2) to eval golden cases. */
export const AI_COMMAND_EVAL_GIFT_CARD_CANCEL_CUSTOMER_CASES: AiCommandEvalCase[] =
  GIFT_CARD_CANCEL_CUSTOMER_PROMPTS.map((entry) => ({
    id: `gift-card-cancel-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.rescueReason,
      useSurfaceGiftCardCancelCustomerRescue: true,
      ...(entry.giftCardId
        ? { paramsPartial: { giftCardId: entry.giftCardId } }
        : {}),
    },
  }));

/** Map customer cancel package visit prompts (ai-cmd-customer-4.15.2) to eval golden cases. */
export const AI_COMMAND_EVAL_CANCEL_PACKAGE_VISIT_SELF_CASES: AiCommandEvalCase[] =
  [
    ...CANCEL_PACKAGE_VISIT_SELF_PROMPTS.map((entry) => ({
      id: `cancel-package-visit-self-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfaceCancelPackageVisitSelfRescue: true,
        ...((entry.packageName || entry.visitIndex != null) && {
          paramsPartial: {
            ...(entry.packageName ? { packageName: entry.packageName } : {}),
            ...(entry.visitIndex != null
              ? { visitIndex: entry.visitIndex }
              : {}),
          },
        }),
      },
    })),
    ...CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `cancel-package-visit-self-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfaceCancelPackageVisitSelfRescue: true,
        needsMultilingual: true,
        ...(entry.packageName
          ? { paramsPartial: { packageName: entry.packageName } }
          : {}),
      },
    })),
  ];

/** Map customer reschedule package visit prompts (ai-cmd-customer-4.15.3) to eval golden cases. */
export const AI_COMMAND_EVAL_RESCHEDULE_PACKAGE_VISIT_SELF_CASES: AiCommandEvalCase[] =
  [
    ...RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS.map((entry) => ({
      id: `reschedule-package-visit-self-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfaceReschedulePackageVisitSelfRescue: true,
        ...((entry.packageName || entry.visitIndex != null) && {
          paramsPartial: {
            ...(entry.packageName ? { packageName: entry.packageName } : {}),
            ...(entry.visitIndex != null
              ? { visitIndex: entry.visitIndex }
              : {}),
          },
        }),
      },
    })),
    ...RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `reschedule-package-visit-self-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfaceReschedulePackageVisitSelfRescue: true,
        needsMultilingual: true,
        ...(entry.packageName || entry.visitIndex != null
          ? {
              paramsPartial: {
                ...(entry.packageName
                  ? { packageName: entry.packageName }
                  : {}),
                ...(entry.visitIndex != null
                  ? { visitIndex: entry.visitIndex }
                  : {}),
              },
            }
          : {}),
      },
    })),
  ];

/** @deprecated use AI_COMMAND_EVAL_RESCHEDULE_PACKAGE_VISIT_SELF_CASES */
export const AI_COMMAND_EVAL_PACKAGE_VISIT_SELF_CUSTOMER_CASES: AiCommandEvalCase[] =
  AI_COMMAND_EVAL_RESCHEDULE_PACKAGE_VISIT_SELF_CASES;

/** Map customer explain package visit rules (ai-cmd-customer-4.15.4) to eval golden cases. */
export const AI_COMMAND_EVAL_EXPLAIN_PACKAGE_VISIT_RULES_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS.map((entry) => ({
      id: `explain-package-visit-rules-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'explain_package_visit_rules' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainPackageVisitRulesRescue: true,
        ...(entry.packageName
          ? { paramsPartial: { packageName: entry.packageName } }
          : {}),
      },
    })),
    ...EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `explain-package-visit-rules-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'explain_package_visit_rules' as const,
        rescueReason: entry.rescueReason,
        useSurfaceExplainPackageVisitRulesRescue: true,
        needsMultilingual: true,
        ...(entry.packageName
          ? { paramsPartial: { packageName: entry.packageName } }
          : {}),
      },
    })),
  ];

/** Map customer dismiss recommendations (ai-cmd-customer-4.16.2) to eval golden cases. */
export const AI_COMMAND_EVAL_DISMISS_RECOMMENDATIONS_CASES: AiCommandEvalCase[] =
  [
    ...DISMISS_RECOMMENDATIONS_PROMPTS.map((entry) => ({
      id: `dismiss-recommendations-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'dismiss_recommendations' as const,
        rescueReason: entry.rescueReason,
        useSurfaceDismissRecommendationsRescue: true,
        ...(entry.bookingId
          ? { paramsPartial: { bookingId: entry.bookingId } }
          : {}),
        ...(entry.serviceId
          ? { paramsPartial: { serviceId: entry.serviceId } }
          : {}),
      },
    })),
    ...DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `dismiss-recommendations-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: entry.locale,
      expect: {
        rescuedAction: 'dismiss_recommendations' as const,
        rescueReason: entry.rescueReason,
        useSurfaceDismissRecommendationsRescue: true,
        needsMultilingual: true,
      },
    })),
  ];

/** Map customer buy_gift_card_for_someone (ai-cmd-customer-4.16.4) to eval golden cases. */
export const AI_COMMAND_EVAL_BUY_GIFT_CARD_FOR_SOMEONE_CASES: AiCommandEvalCase[] =
  [
    ...BUY_GIFT_CARD_FOR_SOMEONE_PROMPTS.map((entry) => ({
      id: `buy-gift-card-for-someone-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'buy_gift_card_for_someone',
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
        ...(entry.amount != null ||
        entry.recipientName ||
        entry.recipientEmail ||
        entry.deliveryMethod
          ? {
              paramsPartial: {
                buyAsGift: true,
                ...(entry.amount != null ? { amount: entry.amount } : {}),
                ...(entry.recipientName
                  ? { recipientName: entry.recipientName }
                  : {}),
                ...(entry.recipientEmail
                  ? { recipientEmail: entry.recipientEmail }
                  : {}),
                ...(entry.deliveryMethod
                  ? { deliveryMethod: entry.deliveryMethod }
                  : {}),
              },
            }
          : { paramsPartial: { buyAsGift: true } }),
      },
    })),
    ...BUY_GIFT_CARD_FOR_SOMEONE_MULTILINGUAL_SCENARIOS.map((entry) => ({
      id: `buy-gift-card-for-someone-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: entry.locale,
      expect: {
        rescuedAction: 'buy_gift_card_for_someone',
        rescueReason: entry.rescueReason,
        useSurfacePaymentsRescue: true,
        needsMultilingual: true,
        ...(entry.amount != null || entry.recipientName || entry.deliveryMethod
          ? {
              paramsPartial: {
                buyAsGift: true,
                ...(entry.amount != null ? { amount: entry.amount } : {}),
                ...(entry.recipientName
                  ? { recipientName: entry.recipientName }
                  : {}),
                ...(entry.deliveryMethod
                  ? { deliveryMethod: entry.deliveryMethod }
                  : {}),
              },
            }
          : { paramsPartial: { buyAsGift: true } }),
      },
    })),
    ...BUY_GIFT_CARD_FOR_SOMEONE_RESCUE_SCENARIOS.map((entry) => ({
      id: `buy-gift-card-for-someone-rescue-${entry.id}`,
      prompt: entry.prompt,
      surface: entry.surface,
      locale: 'en' as const,
      expect: {
        rescuedAction: 'buy_gift_card_for_someone',
        rescueReason: 'gift_card_for_someone',
        useSurfacePaymentsRescue: true,
        rescueFromAction: entry.misclassifiedAction,
      },
    })),
  ];

/** Map customer package visit list prompts (ai-cmd-customer-4.0 P2) to eval golden cases. */
export const AI_COMMAND_EVAL_LIST_MY_PACKAGE_VISITS_CUSTOMER_CASES: AiCommandEvalCase[] =
  LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS.map((entry) => ({
    id: `list-my-package-visits-${entry.id}`,
    prompt: entry.prompt,
    surface: 'customer' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.rescueReason,
      useSurfaceListMyPackageVisitsCustomerRescue: true,
      ...(entry.packageName
        ? { paramsPartial: { packageName: entry.packageName } }
        : {}),
    },
  }));

/** Map customer/public pay-online checkout prompts (ai-cmd-customer-4.2.4) to eval golden cases. */
export const AI_COMMAND_EVAL_PAY_ONLINE_CHECKOUT_CASES: AiCommandEvalCase[] =
  PAY_ONLINE_CHECKOUT_PROMPTS.map((entry) => ({
    id: `pay-online-checkout-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'pay_online',
      rescueReason: 'pay_online',
      useSurfacePaymentsRescue: true,
    },
  }));

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
      useSurfaceConsumerAdoptionRescue: true,
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map customer find saved salons (ai-cmd-customer-4.17.4). */
export const AI_COMMAND_EVAL_FIND_MY_SAVED_SALONS_CASES: AiCommandEvalCase[] = [
  ...FIND_MY_SAVED_SALONS_PROMPTS.map((entry) => ({
    id: `find-saved-salons-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'find_my_saved_salons' as const,
      rescueReason: entry.rescueReason,
      useSurfaceConsumerAdoptionRescue: true,
    },
  })),
  ...FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `find-saved-salons-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'find_my_saved_salons' as const,
      rescueReason: entry.rescueReason,
      useSurfaceConsumerAdoptionRescue: true,
      needsMultilingual: true,
    },
  })),
];

/** Map customer switch salon tenant (ai-cmd-customer-4.17.4). */
export const AI_COMMAND_EVAL_SWITCH_SALON_TENANT_CASES: AiCommandEvalCase[] = [
  ...SWITCH_SALON_TENANT_PROMPTS.map((entry) => ({
    id: `switch-salon-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: 'switch_salon_tenant' as const,
      rescueReason: entry.rescueReason,
      useSurfaceConsumerAdoptionRescue: true,
    },
  })),
  ...SWITCH_SALON_TENANT_MULTILINGUAL_SCENARIOS.map((entry) => ({
    id: `switch-salon-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: entry.locale,
    expect: {
      rescuedAction: 'switch_salon_tenant' as const,
      rescueReason: entry.rescueReason,
      useSurfaceConsumerAdoptionRescue: true,
      needsMultilingual: true,
    },
  })),
];

function growthLoopsScenarioToEvalCase(
  scenario: (typeof MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `growth-loops-${scenario.id}`,
    prompt: scenario.prompt,
    surface: scenario.surface,
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      useSurfaceGrowthLoopsCustomerRescue: true,
      ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_GROWTH_LOOPS_CUSTOMER_CASES: AiCommandEvalCase[] =
  [
    ...GROWTH_LOOPS_CUSTOMER_PROMPTS.map((entry) => ({
      id: `growth-loops-${entry.id}`,
      prompt: entry.prompt,
      surface: 'customer' as const,
      locale: 'en' as const,
      expect: {
        rescuedAction: entry.expectedAction,
        rescueReason: entry.rescueReason,
        useSurfaceGrowthLoopsCustomerRescue: true,
      },
    })),
    ...MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS.map(
      growthLoopsScenarioToEvalCase,
    ),
  ];

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

/** Map provider summarize_day prompts (prov-exp-1 / ai-cmd-provider-5.1.1) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_SUMMARIZE_DAY_CASES: AiCommandEvalCase[] =
  PROVIDER_SUMMARIZE_DAY_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-summarize-day-${entry.id}`,
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

/** Map provider summarize_utilization prompts (prov-exp-1 / ai-cmd-provider-5.1.6) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_SUMMARIZE_UTILIZATION_CASES: AiCommandEvalCase[] =
  PROVIDER_SUMMARIZE_UTILIZATION_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-summarize-utilization-${entry.id}`,
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

/** Map provider show_appointments prompts (ai-cmd-provider-5.1.2) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_CASES: AiCommandEvalCase[] =
  PROVIDER_SHOW_APPOINTMENTS_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-show-appointments-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'show_appointments_pattern',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider who_is_next prompts (ai-cmd-provider-5.1.4) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_WHO_IS_NEXT_CASES: AiCommandEvalCase[] =
  PROVIDER_WHO_IS_NEXT_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-who-is-next-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'who_is_next',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider explain_today_timeline prompts (ai-cmd-provider-5.1.5) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_EXPLAIN_TODAY_TIMELINE_CASES: AiCommandEvalCase[] =
  PROVIDER_EXPLAIN_TODAY_TIMELINE_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-explain-today-timeline-${entry.id}`,
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

/** Map provider end_of_day_summary prompts (ai-cmd-provider-5.1.7) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_END_OF_DAY_SUMMARY_CASES: AiCommandEvalCase[] =
  PROVIDER_END_OF_DAY_SUMMARY_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-end-of-day-summary-${entry.id}`,
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

/** Map provider mark_visit_complete prompts (ai-cmd-provider-5.2.7) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_MARK_VISIT_COMPLETE_CASES: AiCommandEvalCase[] =
  PROVIDER_MARK_VISIT_COMPLETE_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-mark-visit-complete-${entry.id}`,
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
      ...('paramsPartial' in entry ? { paramsPartial: entry.paramsPartial } : {}),
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider mark_paid prompts (ai-cmd-provider-5.3.1) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_MARK_PAID_CASES: AiCommandEvalCase[] =
  PROVIDER_MARK_PAID_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-mark-paid-${entry.id}`,
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

/** Map provider collect_remaining_balance prompts (ai-cmd-provider-5.3.6) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_COLLECT_REMAINING_BALANCE_CASES: AiCommandEvalCase[] =
  PROVIDER_COLLECT_REMAINING_BALANCE_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-collect-remaining-balance-${entry.id}`,
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

/** Map provider search_retail_sku prompts (ai-cmd-provider-5.4.5) to eval golden cases. */
export const AI_COMMAND_EVAL_SEARCH_RETAIL_SKU_CASES: AiCommandEvalCase[] =
  SEARCH_RETAIL_SKU_PROMPT_SCENARIOS.map((entry) => ({
    id: `search-retail-sku-${entry.id}`,
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

/** Map provider fill_unused_slots prompts (ai-cmd-provider-5.6.2) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_FILL_UNUSED_SLOTS_CASES: AiCommandEvalCase[] =
  PROVIDER_FILL_UNUSED_SLOTS_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-fill-unused-slots-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'fill_gaps_pattern',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider payment_sweep prompts (ai-cmd-provider-5.3.2) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_PAYMENT_SWEEP_CASES: AiCommandEvalCase[] =
  PROVIDER_PAYMENT_SWEEP_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-payment-sweep-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'payment_sweep_pattern',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider list_my_multi_service_groups prompts (prov-exp-1 / ai-cmd-provider-5.18.1) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_CASES: AiCommandEvalCase[] =
  PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-list-my-multi-service-groups-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'my_multi_groups',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider open_booking_from_push prompts (prov-exp-1 / ai-cmd-provider-5.10.2) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_OPEN_BOOKING_FROM_PUSH_CASES: AiCommandEvalCase[] =
  PROVIDER_OPEN_BOOKING_FROM_PUSH_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-open-booking-from-push-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'open_from_push',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider confirm_booking_from_push prompts (ai-cmd-provider-5.0.1) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_CONFIRM_BOOKING_FROM_PUSH_CASES: AiCommandEvalCase[] =
  PROVIDER_CONFIRM_BOOKING_FROM_PUSH_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-confirm-booking-from-push-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'confirm_from_push',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider block_schedule prompts (ai-cmd-provider-5.0.1) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_BLOCK_SCHEDULE_CASES: AiCommandEvalCase[] =
  PROVIDER_BLOCK_SCHEDULE_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-block-schedule-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'provider_block_schedule',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider suggest_retail_upsell prompts (ai-cmd-provider-5.0.1) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_SUGGEST_RETAIL_UPSELL_CASES: AiCommandEvalCase[] =
  PROVIDER_SUGGEST_RETAIL_UPSELL_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-suggest-retail-upsell-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'suggest_retail_upsell',
    },
  }));

/** Map provider list_my_package_visits prompts (ai-cmd-provider-5.0.1) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_LIST_MY_PACKAGE_VISITS_CASES: AiCommandEvalCase[] =
  PROVIDER_LIST_MY_PACKAGE_VISITS_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-list-my-package-visits-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'my_package_visits',
    },
  }));

/** Map provider dismiss_push prompts (prov-exp-1 / ai-cmd-provider-5.10.4) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_DISMISS_PUSH_CASES: AiCommandEvalCase[] =
  PROVIDER_DISMISS_PUSH_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-dismiss-push-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'dismiss_push',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider mark_notification_read prompts (ai-cmd-provider-6.8.6) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_MARK_NOTIFICATION_READ_CASES: AiCommandEvalCase[] =
  PROVIDER_MARK_NOTIFICATION_READ_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-mark-notification-read-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'mark_notification_read',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider explain_last_push prompts (prov-exp-1 / ai-cmd-provider-5.10.3) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_EXPLAIN_LAST_PUSH_CASES: AiCommandEvalCase[] =
  PROVIDER_EXPLAIN_LAST_PUSH_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-explain-last-push-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'explain_push',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
        : {}),
    },
  }));

/** Map provider new_booking_push_actions prompts (prov-exp-1 / ai-cmd-provider-5.10.7) to eval golden cases. */
export const AI_COMMAND_EVAL_PROVIDER_NEW_BOOKING_PUSH_ACTIONS_CASES: AiCommandEvalCase[] =
  PROVIDER_NEW_BOOKING_PUSH_ACTIONS_PROMPT_SCENARIOS.map((entry) => ({
    id: `provider-new-booking-push-actions-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: entry.id.endsWith('-hy')
      ? 'hy'
      : entry.id.endsWith('-ru')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'booking_push_actions',
      ...(entry.id.endsWith('-hy') || entry.id.endsWith('-ru')
        ? { needsMultilingual: true }
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
const OPEN_SHIFTS_EVAL_RESCUE_REASON_BY_ACTION: Record<string, string> = {
  suggest_waitlist_for_gap: 'fill_gap_waitlist',
  draft_waitlist_offer_message: 'draft_waitlist_offer_message',
  list_waitlist_for_my_services: 'list_waitlist_for_my_services',
  list_rebooking_candidates: 'list_rebooking_candidates',
  book_walk_in_gap: 'book_walk_in_gap',
};

export const AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_CASES: AiCommandEvalCase[] =
  SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS.map((entry) => ({
    id: `provider-open-shifts-${entry.id}`,
    prompt: entry.prompt,
    surface: 'provider',
    locale: 'en',
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason:
        OPEN_SHIFTS_EVAL_RESCUE_REASON_BY_ACTION[entry.expectedAction] ??
        'fill_gap_waitlist',
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
      surface: 'customer',
      locale: 'en',
      expect: {
        rescuedAction: 'explain_consumer_checkout_success',
        rescueReason: 'explain_consumer_checkout_success',
        useSurfaceConsumerCheckoutSuccessRescue: true,
        ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
      },
    };
  });

/** Map checkout success recommendation explain prompts (ai-cmd-rec-5) to eval golden cases. */
export function checkoutRecommendationsScenarioToEvalCase(
  scenario: CheckoutRecommendationsEvalScenario,
): AiCommandEvalCase {
  return {
    id: `checkout-recommendations-${scenario.id}`,
    prompt: scenario.prompt,
    surface: scenario.surface,
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason ?? 'explain_checkout_recommendations',
      useSurfaceCheckoutRecommendationsCustomerPublicRescue: true,
      ...(scenario.needsMultilingual ? { needsMultilingual: true } : {}),
      ...(scenario.paramsPartial
        ? { paramsPartial: scenario.paramsPartial }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_RECOMMENDATIONS_CASES: AiCommandEvalCase[] =
  [
    ...EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS.map((entry) => {
      const paramsPartial: Record<string, unknown> = {};
      if ('aspect' in entry && entry.aspect)
        paramsPartial.aspect = entry.aspect;
      if ('serviceName' in entry && entry.serviceName) {
        paramsPartial.serviceName = entry.serviceName;
      }
      if ('productName' in entry && entry.productName) {
        paramsPartial.productName = entry.productName;
      }
      return {
        id: `checkout-recommendations-${entry.id}`,
        prompt: entry.prompt,
        surface: entry.surface,
        locale: 'en' as const,
        expect: {
          rescuedAction: 'explain_checkout_recommendations',
          rescueReason: 'explain_checkout_recommendations',
          useSurfaceCheckoutRecommendationsCustomerPublicRescue: true,
          ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
        },
      };
    }),
    ...MULTILINGUAL_CHECKOUT_RECOMMENDATIONS_EVAL_SCENARIOS.map(
      checkoutRecommendationsScenarioToEvalCase,
    ),
  ];

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
      surface: entry.surface,
      locale:
        entry.id.includes('-hy-') || entry.id.startsWith('hy-')
          ? 'hy'
          : entry.id.includes('-ru-') || entry.id.startsWith('ru-')
            ? 'ru'
            : 'en',
      expect: {
        rescuedAction: 'explain_tour_day_slots',
        rescueReason: 'explain_tour_day_slots',
        useSurfaceTourCustomerPublicRescue: true,
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
    surface: 'provider',
    locale: entry.id.startsWith('hy-')
      ? 'hy'
      : entry.id.startsWith('ru-')
        ? 'ru'
        : 'en',
    expect: {
      rescuedAction: 'explain_provider_payment_currency',
      rescueReason: 'explain_provider_payment_currency',
      ...(entry.id.startsWith('hy-') || entry.id.startsWith('ru-')
        ? { needsMultilingual: true }
        : {}),
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

/** Dashboard salon checkout setup compound (ai-cmd-ext-4.5). */
export const AI_COMMAND_EVAL_SETUP_SALON_CHECKOUT_COMPOUND_CASES: AiCommandEvalCase[] =
  SETUP_SALON_CHECKOUT_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams
        ? [
            ...(typeof entry.expectedParams.startOnboarding === 'boolean'
              ? [
                  {
                    stepIndex: 0,
                    key: 'startOnboarding',
                    value: entry.expectedParams.startOnboarding,
                  },
                ]
              : []),
            ...(typeof entry.expectedParams.acceptCashPayments === 'boolean'
              ? [
                  {
                    stepIndex: 1,
                    key: 'acceptCashPayments',
                    value: entry.expectedParams.acceptCashPayments,
                  },
                ]
              : []),
            ...(entry.expectedParams.allServices === true
              ? [
                  {
                    stepIndex: 2,
                    key: 'allServices',
                    value: true,
                  },
                ]
              : []),
            ...(typeof entry.expectedParams.depositPercent === 'number'
              ? [
                  {
                    stepIndex: 2,
                    key: 'depositPercent',
                    value: entry.expectedParams.depositPercent,
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
      compoundRecipeId: 'setup_salon_checkout',
    }),
  );

export const AI_COMMAND_EVAL_SETUP_SALON_CHECKOUT_RESCUE_CASES: AiCommandEvalCase[] =
  SETUP_SALON_CHECKOUT_RESCUE_SCENARIOS.map((scenario) => ({
    id: `salon-checkout-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'setup_salon_checkout_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

/** Dashboard services payment matrix compound (ai-cmd-ext-4.6). */
export const AI_COMMAND_EVAL_CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_CASES: AiCommandEvalCase[] =
  CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams
        ? [
            ...(typeof entry.expectedParams.percentChange === 'number'
              ? [
                  {
                    stepIndex: 0,
                    key: 'percentChange',
                    value: entry.expectedParams.percentChange,
                  },
                ]
              : []),
            ...(typeof entry.expectedParams.acceptCashPayments === 'boolean'
              ? [
                  {
                    stepIndex: entry.orderedActions.length - 1,
                    key: 'acceptCashPayments',
                    value: entry.expectedParams.acceptCashPayments,
                  },
                ]
              : []),
          ]
        : undefined,
      noLlm: true,
      compoundRecipeId: 'configure_services_payment_matrix',
    }),
  );

export const AI_COMMAND_EVAL_CONFIGURE_SERVICES_PAYMENT_MATRIX_RESCUE_CASES: AiCommandEvalCase[] =
  CONFIGURE_SERVICES_PAYMENT_MATRIX_RESCUE_SCENARIOS.map((scenario) => ({
    id: `payment-matrix-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'configure_services_payment_matrix_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

/** Dashboard decline/accept category online payment compound (ai-cmd-ext-4.7). */
export const AI_COMMAND_EVAL_DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_CASES: AiCommandEvalCase[] =
  DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.categorySteps.flatMap((step, stepIndex) => [
        { stepIndex, key: 'categoryName', value: step.categoryName },
        { stepIndex, key: 'prepaymentMode', value: step.prepaymentMode },
        ...(step.depositPercent != null
          ? [{ stepIndex, key: 'depositPercent', value: step.depositPercent }]
          : []),
      ]),
      noLlm: true,
      compoundRecipeId: 'decline_online_payment_category',
    }),
  );

export const AI_COMMAND_EVAL_DECLINE_ONLINE_PAYMENT_CATEGORY_RESCUE_CASES: AiCommandEvalCase[] =
  DECLINE_ONLINE_PAYMENT_CATEGORY_RESCUE_SCENARIOS.map((scenario) => ({
    id: `decline-category-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'decline_online_payment_category_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

/** Dashboard cash + online payment compound (ai-cmd-ext-5.6). */
export const AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_COMPOUND_CASES: AiCommandEvalCase[] =
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS.filter(
    (entry) => entry.compoundRecipeId === 'cash_and_online_payment',
  ).map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.paramChecks,
      noLlm: true,
      compoundRecipeId: 'cash_and_online_payment',
    }),
  );

export const AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_DECLINE_CATEGORY_CASES: AiCommandEvalCase[] =
  CASH_AND_ONLINE_PAYMENT_COMPOUND_PROMPTS.filter(
    (entry) => entry.compoundRecipeId === 'decline_online_payment_category',
  ).map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.paramChecks,
      noLlm: true,
      compoundRecipeId: 'decline_online_payment_category',
    }),
  );

export const AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_RESCUE_CASES: AiCommandEvalCase[] =
  CASH_AND_ONLINE_PAYMENT_RESCUE_SCENARIOS.map((scenario) => ({
    id: `cash-online-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'cash_and_online_payment_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

/** Dashboard salon notification onboarding compound (ai-cmd-ext-4.8). */
export const AI_COMMAND_EVAL_ONBOARD_SALON_NOTIFICATIONS_COMPOUND_CASES: AiCommandEvalCase[] =
  ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams
        ? [
            ...(entry.expectedParams.emailEnabled === true
              ? [{ stepIndex: 0, key: 'emailEnabled', value: true }]
              : []),
            ...(entry.expectedParams.whatsappEnabled === true
              ? [{ stepIndex: 0, key: 'whatsappEnabled', value: true }]
              : []),
            ...(entry.expectedParams.reminder24hEmail === true
              ? [{ stepIndex: 0, key: 'reminder24hEmail', value: true }]
              : []),
            ...(entry.expectedParams.reminder24hWhatsapp === true
              ? [{ stepIndex: 0, key: 'reminder24hWhatsapp', value: true }]
              : []),
            ...(entry.expectedParams.usePlatformDefault === true
              ? [{ stepIndex: 1, key: 'usePlatformDefault', value: true }]
              : []),
          ]
        : undefined,
      noLlm: true,
      compoundRecipeId: 'onboard_salon_notifications',
    }),
  );

export const AI_COMMAND_EVAL_ONBOARD_SALON_NOTIFICATIONS_RESCUE_CASES: AiCommandEvalCase[] =
  ONBOARD_SALON_NOTIFICATIONS_RESCUE_SCENARIOS.map((scenario) => ({
    id: `salon-notifications-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'onboard_salon_notifications_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

/** Dashboard consumer app growth launch compound (ai-cmd-ext-4.9). */
export const AI_COMMAND_EVAL_LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_CASES: AiCommandEvalCase[] =
  LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams
        ? [
            ...(entry.expectedParams.emailOnNewCustomerRegistration === true
              ? [
                  {
                    stepIndex: 2,
                    key: 'emailOnNewCustomerRegistration',
                    value: true,
                  },
                ]
              : []),
            ...(entry.expectedParams.marketingTeamEmails
              ? [
                  {
                    stepIndex: 2,
                    key: 'marketingTeamEmails',
                    value: entry.expectedParams.marketingTeamEmails,
                  },
                ]
              : []),
          ]
        : undefined,
      noLlm: true,
      compoundRecipeId: 'launch_consumer_app_growth',
    }),
  );

export const AI_COMMAND_EVAL_LAUNCH_CONSUMER_APP_GROWTH_RESCUE_CASES: AiCommandEvalCase[] =
  LAUNCH_CONSUMER_APP_GROWTH_RESCUE_SCENARIOS.map((scenario) => ({
    id: `consumer-app-growth-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    surface: 'dashboard' as const,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'launch_consumer_app_growth_compound',
      rescueFromAction: scenario.misclassifiedAction ?? 'unknown',
    },
  }));

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
            ...('timeOfDay' in entry.expectedParams &&
            entry.expectedParams.timeOfDay
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
            ...('timeOfDay' in entry.expectedParams &&
            entry.expectedParams.timeOfDay
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
                      'date' in entry.expectedParams &&
                      entry.expectedParams.date
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

/** Dashboard clinic lab review compound (ai-cmd-clinic-6-gap-6.1). */
export const AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_COMPOUND_CASES: AiCommandEvalCase[] =
  CLINIC_LAB_REVIEW_COMPOUND_PROMPTS.map((entry) =>
    compoundScenarioToEvalCase({
      id: entry.id,
      surface: 'dashboard',
      prompt: entry.prompt,
      orderedActions: [...entry.orderedActions],
      paramChecks: entry.expectedParams?.customerName
        ? [
            {
              stepIndex: 0,
              key: 'customerName',
              value: entry.expectedParams.customerName,
            },
            {
              stepIndex: 1,
              key: 'customerName',
              value: entry.expectedParams.customerName,
            },
          ]
        : entry.expectedParams?.orderId
          ? [
              {
                stepIndex: 0,
                key: 'orderId',
                value: entry.expectedParams.orderId,
              },
              {
                stepIndex: 1,
                key: 'orderId',
                value: entry.expectedParams.orderId,
              },
            ]
          : undefined,
      noLlm: true,
      compoundRecipeId: 'clinic_lab_review',
    }),
  );

/** Dashboard clinic ext multi-step recipes (ai-cmd-ext-4.2, parity-3.2). */
export const CLINIC_EXT_COMPOUND_RECIPE_IDS = [
  'clinic_lab_day_close',
  'clinic_lab_review',
] as const;

/** EN + HY/RU eval rows with explicit compoundSteps (ai-cmd-clinic-6-gap-6.2). */
export const AI_COMMAND_EVAL_CLINIC_EXT_COMPOUND_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_MULTILINGUAL_CASES,
];

/** Golden compound NL prompts — multi-command decomposition (ai-cmd-0.4). */
export const AI_COMMAND_EVAL_COMPOUND_CASES: AiCommandEvalCase[] = [
  ...COMPOUND_DECOMPOSITION_SCENARIOS.map(compoundScenarioToEvalCase),
  ...AI_COMMAND_EVAL_PROVIDER_ONBOARDING_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_ONBOARDING_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_SETUP_SALON_CHECKOUT_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_SERVICES_PAYMENT_MATRIX_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_DECLINE_ONLINE_PAYMENT_CATEGORY_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_DECLINE_CATEGORY_CASES,
  ...AI_COMMAND_EVAL_ONBOARD_SALON_NOTIFICATIONS_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_REBOOK_AND_PAY_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_REBOOK_AND_PAY_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CANCEL_AND_REBOOK_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CANCEL_AND_REBOOK_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_MULTI_SERVICE_DAY_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_MULTI_SERVICE_DAY_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_MULTILINGUAL_CASES,
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
          compoundSteps: decomposition!.steps.map((step) => step.action),
          compoundRecipeId: decomposition!.recipeId,
          compoundSource: decomposition!.source,
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
    id: 'compound-customer-book_package-nearest',
    prompt: 'Book the spa package earliest available',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundSteps: ['discover_packages', 'book_package'],
      compoundSource: 'golden',
      compoundRecipeId: 'book_package_with_nearest_slot',
      compoundStepParams: [
        { stepIndex: 1, paramsPartial: { bookingFirstAvailable: true } },
      ],
    },
  },
  {
    id: 'compound-public-book_package-nearest',
    prompt: 'Book the spa package earliest available',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'public',
      compoundSteps: ['discover_packages', 'book_package'],
      compoundSource: 'golden',
      compoundRecipeId: 'public_book_package_with_nearest_slot',
    },
  },
  {
    id: 'compound-customer-book_lab_collection-nearest',
    prompt: 'Book lab draw earliest slot',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundSteps: ['list_my_lab_booking_requests', 'book_lab_collection'],
      compoundSource: 'golden',
      compoundRecipeId: 'book_lab_collection_nearest',
      compoundStepParams: [
        { stepIndex: 1, paramsPartial: { bookingFirstAvailable: true } },
      ],
    },
  },
  {
    id: 'compound-public-book_lab_collection-nearest',
    prompt: 'Schedule my lab blood draw soonest opening',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'public',
      compoundSteps: ['list_my_lab_booking_requests', 'book_lab_collection'],
      compoundSource: 'golden',
      compoundRecipeId: 'public_book_lab_collection_nearest',
    },
  },
  {
    id: 'compound-customer-complete_intake_and_book',
    prompt: 'Fill intake and book blood draw',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundSteps: ['complete_intake_and_book', 'book_nearest_slot'],
      compoundSource: 'golden',
      compoundRecipeId: 'complete_intake_and_book',
    },
  },
  {
    id: 'compound-public-complete_intake_and_book',
    prompt: 'Complete the health questionnaire and book my lab test',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'public',
      compoundSteps: ['complete_intake_and_book', 'book_appointment'],
      compoundSource: 'golden',
      compoundRecipeId: 'public_complete_intake_and_book',
    },
  },
  {
    id: 'compound-customer-intake_lab_book_pay',
    prompt: 'Complete health form, book earliest blood draw, pay deposit',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundSteps: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_online',
      ],
      compoundSource: 'golden',
      compoundRecipeId: 'intake_lab_book_pay',
    },
  },
  {
    id: 'compound-public-intake_lab_book_pay',
    prompt: 'Complete health questionnaire, schedule lab test, pay with card',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'public',
      compoundSteps: [
        'complete_intake_and_book',
        'book_appointment',
        'pay_online',
      ],
      compoundSource: 'golden',
      compoundRecipeId: 'public_intake_lab_book_pay',
    },
  },
  {
    id: 'compound-customer-book_tour_nearest_departure',
    prompt: 'Book the wine tour earliest date for 2 people',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundSteps: [
        'explain_tour_booking',
        'explain_tour_day_slots',
        'book_nearest_slot',
      ],
      compoundSource: 'golden',
      compoundRecipeId: 'book_tour_nearest_departure',
      compoundStepParams: [
        {
          stepIndex: 2,
          paramsPartial: {
            bookingFirstAvailable: true,
            paxCount: 2,
            serviceName: 'wine tour',
          },
        },
      ],
    },
  },
  {
    id: 'compound-public-book_tour_nearest_departure',
    prompt: 'Reserve mountain trek soonest departure for 4 people',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'public',
      compoundSteps: [
        'explain_tour_booking',
        'explain_tour_day_slots',
        'book_appointment',
      ],
      compoundSource: 'golden',
      compoundRecipeId: 'public_book_tour_nearest_departure',
      compoundStepParams: [
        {
          stepIndex: 2,
          paramsPartial: { bookingFirstAvailable: true, paxCount: 4 },
        },
      ],
    },
  },
  {
    id: 'compound-customer-book_package-promo',
    prompt: 'Book spa day package and apply promo code WELCOME',
    locale: 'en',
    expect: {
      routeTier: 'compound',
      compoundSurface: 'customer',
      compoundSteps: ['book_package', 'apply_promo_code_checkout'],
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

/** Dashboard per-service online payment on public booking (Sprint 30+). */
export const AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_CASES: AiCommandEvalCase[] =
  SERVICE_ONLINE_PAYMENT_PROMPTS.map((entry) => ({
    id: `service-online-payment-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'service_online_payment',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard read companion for service online payment setup (ai-cmd-ext-2.13.5). */
export const AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_SETUP_CASES: AiCommandEvalCase[] =
  EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS.map((entry) => ({
    id: `service-online-payment-setup-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_INTENT,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
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

/** Dashboard Stripe Connect onboarding (ai-cmd-ext-2.15). */
export const AI_COMMAND_EVAL_STRIPE_CONNECT_CASES: AiCommandEvalCase[] =
  CONFIGURE_STRIPE_CONNECT_PROMPTS.map((entry) => ({
    id: `stripe-connect-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard checkout defaults (ai-cmd-ext-2.16). */
export const AI_COMMAND_EVAL_CHECKOUT_DEFAULTS_CASES: AiCommandEvalCase[] =
  CONFIGURE_CHECKOUT_DEFAULTS_PROMPTS.map((entry) => ({
    id: `checkout-defaults-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard notification settings (ai-cmd-ext-2.19). */
export const AI_COMMAND_EVAL_NOTIFICATION_SETTINGS_CASES: AiCommandEvalCase[] =
  CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS.map((entry) => ({
    id: `notification-settings-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard WhatsApp integration (ai-cmd-ext-2.20). */
export const AI_COMMAND_EVAL_WHATSAPP_INTEGRATION_CASES: AiCommandEvalCase[] =
  CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS.map((entry) => ({
    id: `whatsapp-integration-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard tenant app install regenerate (ai-cmd-ext-2.23). */
export const AI_COMMAND_EVAL_REGENERATE_TENANT_APP_INSTALL_CASES: AiCommandEvalCase[] =
  REGENERATE_TENANT_APP_INSTALL_QR_PROMPTS.map((entry) => ({
    id: `regenerate-tenant-app-install-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'tenant_app_install_regenerate',
    },
  }));

/** Dashboard configure loyalty settings (ai-cmd-ext-2.25). */
export const AI_COMMAND_EVAL_CONFIGURE_LOYALTY_SETTINGS_CASES: AiCommandEvalCase[] =
  CONFIGURE_LOYALTY_SETTINGS_PROMPTS.map((entry) => ({
    id: `configure-loyalty-settings-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'configure_loyalty_settings',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard create promo code (ai-cmd-ext-2.24). */
export const AI_COMMAND_EVAL_CREATE_PROMO_CODE_CASES: AiCommandEvalCase[] =
  CREATE_PROMO_CODE_PROMPTS.map((entry) => ({
    id: `create-promo-code-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'create_promo_code',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard tenant app install explain (ai-cmd-ext-2.22). */
export const AI_COMMAND_EVAL_TENANT_APP_INSTALL_CASES: AiCommandEvalCase[] =
  EXPLAIN_TENANT_APP_INSTALL_PROMPTS.map((entry) => ({
    id: `tenant-app-install-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'tenant_app_install_explain',
    },
  }));

/** Dashboard explain integration health (ai-cmd-ext-2.31). */
export const AI_COMMAND_EVAL_EXPLAIN_INTEGRATION_HEALTH_CASES: AiCommandEvalCase[] =
  EXPLAIN_INTEGRATION_HEALTH_PROMPTS.map((entry) => ({
    id: `explain-integration-health-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: EXPLAIN_INTEGRATION_HEALTH_INTENT,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard OpenAI integration (ai-cmd-ext-2.21). */
export const AI_COMMAND_EVAL_OPENAI_INTEGRATION_CASES: AiCommandEvalCase[] =
  CONFIGURE_OPENAI_INTEGRATION_PROMPTS.map((entry) => ({
    id: `openai-integration-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard configure service featured (ai-cmd-ext-2.26). */
export const AI_COMMAND_EVAL_CONFIGURE_SERVICE_FEATURED_CASES: AiCommandEvalCase[] =
  CONFIGURE_SERVICE_FEATURED_PROMPTS.map((entry) => ({
    id: `configure-service-featured-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'configure_service_featured',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard bulk assign services category (ai-cmd-ext-2.27). */
export const AI_COMMAND_EVAL_BULK_ASSIGN_SERVICES_CATEGORY_CASES: AiCommandEvalCase[] =
  BULK_ASSIGN_SERVICES_CATEGORY_PROMPTS.map((entry) => ({
    id: `bulk-assign-services-category-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'bulk_assign_services_category',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard configure package online payment (ai-cmd-ext-2.28). */
export const AI_COMMAND_EVAL_CONFIGURE_PACKAGE_ONLINE_PAYMENT_CASES: AiCommandEvalCase[] =
  CONFIGURE_PACKAGE_ONLINE_PAYMENT_PROMPTS.map((entry) => ({
    id: `configure-package-online-payment-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'configure_package_online_payment',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard explain multi-service settings (ai-cmd-ext-2.29). */
export const AI_COMMAND_EVAL_EXPLAIN_MULTI_SERVICE_SETTINGS_CASES: AiCommandEvalCase[] =
  EXPLAIN_MULTI_SERVICE_SETTINGS_PROMPTS.map((entry) => ({
    id: `explain-multi-service-settings-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'explain_multi_service_settings',
    },
  }));

/** Dashboard explain public booking checkout (ai-cmd-ext-2.30). */
export const AI_COMMAND_EVAL_EXPLAIN_PUBLIC_BOOKING_CHECKOUT_CASES: AiCommandEvalCase[] =
  EXPLAIN_PUBLIC_BOOKING_CHECKOUT_PROMPTS.map((entry) => ({
    id: `explain-public-booking-checkout-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: EXPLAIN_PUBLIC_BOOKING_CHECKOUT_INTENT,
    },
  }));

/** Dashboard audit services missing online payment (ai-cmd-ext-2.32). */
export const AI_COMMAND_EVAL_AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_CASES: AiCommandEvalCase[] =
  AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_PROMPTS.map((entry) => ({
    id: `audit-services-missing-online-payment-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_INTENT,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard create_services bulk prepayment (ai-cmd-ext-5.3). */
export const AI_COMMAND_EVAL_CREATE_SERVICES_PREPAYMENT_CASES: AiCommandEvalCase[] =
  CREATE_SERVICES_PREPAYMENT_PROMPTS.map((entry) => ({
    id: `create-services-prepayment-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'create_services_prepayment',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard create_service prepayment on create (ai-cmd-ext-5.2). */
export const AI_COMMAND_EVAL_CREATE_SERVICE_PREPAYMENT_CASES: AiCommandEvalCase[] =
  CREATE_SERVICE_PREPAYMENT_PROMPTS.map((entry) => ({
    id: `create-service-prepayment-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'create_service_prepayment',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard deactivate_service category scope (ai-cmd-ext-5.5). */
export const AI_COMMAND_EVAL_DEACTIVATE_SERVICE_CATEGORY_SCOPE_CASES: AiCommandEvalCase[] =
  DEACTIVATE_SERVICE_CATEGORY_SCOPE_PROMPTS.map((entry) => ({
    id: `deactivate-service-category-scope-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.paramsPartial?.allInCategory
        ? 'deactivate_service_category_scope'
        : 'deactivate_service',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard update_service_prices online payment scope (ai-cmd-ext-5.4). */
export const AI_COMMAND_EVAL_UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_CASES: AiCommandEvalCase[] =
  UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_PROMPTS.map((entry) => ({
    id: `update-service-prices-online-payment-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.paramsPartial?.onlyWithOnlinePayment
        ? 'update_service_prices_online_payment_filter'
        : 'operations_booking_ops',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard list_services payment filters (ai-cmd-ext-5.1). */
export const AI_COMMAND_EVAL_LIST_SERVICES_PAYMENT_FILTER_CASES: AiCommandEvalCase[] =
  LIST_SERVICES_PAYMENT_FILTER_PROMPTS.map((entry) => ({
    id: `list-services-payment-filter-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: 'list_services_payment_filter',
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard service deposit policy (ai-cmd-ext-2.18). */
export const AI_COMMAND_EVAL_SERVICE_DEPOSIT_POLICY_CASES: AiCommandEvalCase[] =
  CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS.map((entry) => ({
    id: `service-deposit-policy-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
    },
  }));

/** Dashboard service duration/buffer bulk update (ai-cmd-ext-2.17). */
export const AI_COMMAND_EVAL_SERVICE_DURATION_BUFFER_CASES: AiCommandEvalCase[] =
  UPDATE_SERVICE_DURATION_BUFFER_PROMPTS.map((entry) => ({
    id: `service-duration-buffer-${entry.id}`,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    locale: 'en' as const,
    expect: {
      rescuedAction: entry.expectedAction,
      rescueReason: entry.expectedAction,
      ...(entry.paramsPartial ? { paramsPartial: entry.paramsPartial } : {}),
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

export { AI_COMMAND_EVAL_IMPLICATION_CASES };
export { AI_COMMAND_EVAL_BOOKING_FIRST_AVAILABLE_SEMANTIC_CASES };
export { AI_COMMAND_EVAL_TEAM_WIDE_AVAILABILITY_SEMANTIC_CASES };
export { AI_COMMAND_EVAL_ANY_PROVIDER_BOOKING_SEMANTIC_CASES };
export { AI_COMMAND_EVAL_RECOMMEND_SPECIALISTS_SEMANTIC_CASES };
export { AI_COMMAND_EVAL_METRIC_RESOLVER_SEMANTIC_CASES };

export { AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES };

/** Full deterministic CI suite: routing/rescue + compound decomposition. */
export const AI_COMMAND_EVAL_DETERMINISTIC_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_SEMANTIC_INTENT_CASES,
  ...AI_COMMAND_EVAL_IMPLICATION_CASES,
  ...AI_COMMAND_EVAL_BOOKING_FIRST_AVAILABLE_SEMANTIC_CASES,
  ...AI_COMMAND_EVAL_TEAM_WIDE_AVAILABILITY_SEMANTIC_CASES,
  ...AI_COMMAND_EVAL_ANY_PROVIDER_BOOKING_SEMANTIC_CASES,
  ...AI_COMMAND_EVAL_RECOMMEND_SPECIALISTS_SEMANTIC_CASES,
  ...AI_COMMAND_EVAL_METRIC_RESOLVER_SEMANTIC_CASES,
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
  ...AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_CASES,
  ...AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_SETUP_CASES,
  ...AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_STAFF_OPERATIONS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_CASES,
  ...AI_COMMAND_EVAL_STRIPE_CONNECT_CASES,
  ...AI_COMMAND_EVAL_CHECKOUT_DEFAULTS_CASES,
  ...AI_COMMAND_EVAL_SERVICE_DEPOSIT_POLICY_CASES,
  ...AI_COMMAND_EVAL_LIST_SERVICES_PAYMENT_FILTER_CASES,
  ...AI_COMMAND_EVAL_CREATE_SERVICE_PREPAYMENT_CASES,
  ...AI_COMMAND_EVAL_CREATE_SERVICES_PREPAYMENT_CASES,
  ...AI_COMMAND_EVAL_UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_CASES,
  ...AI_COMMAND_EVAL_DEACTIVATE_SERVICE_CATEGORY_SCOPE_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_SERVICE_FEATURED_CASES,
  ...AI_COMMAND_EVAL_BULK_ASSIGN_SERVICES_CATEGORY_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_PACKAGE_ONLINE_PAYMENT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_MULTI_SERVICE_SETTINGS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PUBLIC_BOOKING_CHECKOUT_CASES,
  ...AI_COMMAND_EVAL_AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_CASES,
  ...AI_COMMAND_EVAL_NOTIFICATION_SETTINGS_CASES,
  ...AI_COMMAND_EVAL_WHATSAPP_INTEGRATION_CASES,
  ...AI_COMMAND_EVAL_OPENAI_INTEGRATION_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_INTEGRATION_HEALTH_CASES,
  ...AI_COMMAND_EVAL_TENANT_APP_INSTALL_CASES,
  ...AI_COMMAND_EVAL_REGENERATE_TENANT_APP_INSTALL_CASES,
  ...AI_COMMAND_EVAL_CREATE_PROMO_CODE_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_LOYALTY_SETTINGS_CASES,
  ...AI_COMMAND_EVAL_SERVICE_DURATION_BUFFER_CASES,
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
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CLASSIFIER_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_TEST_RESULT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PATIENT_CHART_CASES,
  ...AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES,
  ...AI_COMMAND_EVAL_CLINIC_PATIENT_CHART_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_CASES,
  ...AI_COMMAND_EVAL_BOOK_LAB_FROM_ORDER_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_BOOKING_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_BOOKING_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_LAB_PREP_CASES,
  ...AI_COMMAND_EVAL_TRACK_LAB_ORDER_STATUS_CASES,
  ...AI_COMMAND_EVAL_LIST_MY_DOCUMENTS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_ABNORMAL_RESULT_FLAG_CASES,
  ...AI_COMMAND_EVAL_NOTIFY_WHEN_RESULTS_READY_CASES,
  ...AI_COMMAND_EVAL_BOOK_LAB_COLLECTION_NEAREST_CASES,
  ...AI_COMMAND_EVAL_BOOK_TOUR_NEAREST_DEPARTURE_CASES,
  ...AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_CLINIC_BOOKING_FIELDS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PUBLIC_INTAKE_FORM_CASES,
  ...AI_COMMAND_EVAL_COMPLETE_INTAKE_AND_BOOK_CASES,
  ...AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_BOOKING_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_SERVICE_CONFIGURE_EXPLAIN_CASES,
  ...AI_COMMAND_EVAL_APPLY_CLINIC_PLAYBOOK_CASES,
  ...AI_COMMAND_EVAL_CLINIC_V2_SURFACE_CASES,
  ...AI_COMMAND_EVAL_CLINIC_V2_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_COMPOUND_CASES,
  ...AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CLINIC_COMPOUND_MULTILINGUAL_RESCUE_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_RESCUE_CASES,
  ...AI_COMMAND_EVAL_CLINIC_LAB_REVIEW_RESCUE_CASES,
  ...AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_RESCUE_CASES,
  ...AI_COMMAND_EVAL_DISCOVER_BOOK_AND_PAY_RESCUE_CASES,
  ...AI_COMMAND_EVAL_INTAKE_LAB_BOOK_PAY_RESCUE_CASES,
  ...AI_COMMAND_EVAL_TOUR_GROUP_CHECKOUT_RESCUE_CASES,
  ...AI_COMMAND_EVAL_REBOOK_AND_PAY_RESCUE_CASES,
  ...AI_COMMAND_EVAL_SUBSCRIPTION_FIRST_VISIT_RESCUE_CASES,
  ...AI_COMMAND_EVAL_RESULTS_THEN_REBOOK_RESCUE_CASES,
  ...AI_COMMAND_EVAL_CANCEL_PACKAGE_REBOOK_SINGLE_RESCUE_CASES,
  ...AI_COMMAND_EVAL_CANCEL_AND_REBOOK_RESCUE_CASES,
  ...AI_COMMAND_EVAL_GIFT_CARD_CHECKOUT_RESCUE_CASES,
  ...AI_COMMAND_EVAL_MULTI_SERVICE_DAY_RESCUE_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_SAME_DAY_MULTI_RESCUE_CASES,
  ...AI_COMMAND_EVAL_GUEST_PAY_CASH_MANAGE_RESCUE_CASES,
  ...AI_COMMAND_EVAL_GUEST_BOOK_AND_MANAGE_RESCUE_CASES,
  ...AI_COMMAND_EVAL_SETUP_SALON_CHECKOUT_RESCUE_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_SERVICES_PAYMENT_MATRIX_RESCUE_CASES,
  ...AI_COMMAND_EVAL_DECLINE_ONLINE_PAYMENT_CATEGORY_RESCUE_CASES,
  ...AI_COMMAND_EVAL_CASH_AND_ONLINE_PAYMENT_RESCUE_CASES,
  ...AI_COMMAND_EVAL_ONBOARD_SALON_NOTIFICATIONS_RESCUE_CASES,
  ...AI_COMMAND_EVAL_LAUNCH_CONSUMER_APP_GROWTH_RESCUE_CASES,
  ...AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_RESCUE_CASES,
  ...AI_COMMAND_EVAL_NOTIFICATION_DATE_FORMAT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_DATE_INPUT_PROVIDER_FORMAT_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_DATE_INPUT_FORMAT_CASES,
  ...AI_COMMAND_EVAL_PREVIEW_DATE_INPUT_PARSE_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_BUSINESS_TAX_CASES,
  ...AI_COMMAND_EVAL_SET_SERVICE_TAX_RATE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_BUSINESS_TAX_CASES,
  ...AI_COMMAND_EVAL_BUSINESS_TAX_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_E2E146_ROUTING_RESCUE_CASES,
  ...AI_COMMAND_EVAL_E2E137_ROUTING_RESCUE_CASES,
  ...AI_COMMAND_EVAL_E2E159_OWNER_CANCEL_ALERT_CASES,
  ...AI_COMMAND_EVAL_E2E252_OWNER_RESCHEDULE_ALERT_CASES,
  ...AI_COMMAND_EVAL_E2E157_CREATE_PACKAGE_CASES,
  ...AI_COMMAND_EVAL_E2E154_UNSCOPED_BOOKING_COUNT_CASES,
  ...AI_COMMAND_EVAL_E2E153_UNSCOPED_CUSTOMER_COUNT_CASES,
  ...AI_COMMAND_EVAL_E2E152_PENDING_AI_AGENT_TASKS_CASES,
  ...AI_COMMAND_EVAL_E2E151_CREATE_SERVICE_CATEGORY_CASES,
  ...AI_COMMAND_EVAL_E2E148_CREATE_PRODUCT_PRICE_CASES,
  ...AI_COMMAND_EVAL_E2E147_SERVICE_RESOURCE_REQUIREMENTS_CASES,
  ...AI_COMMAND_EVAL_E2E144_DEACTIVATE_SERVICE_CASES,
  ...AI_COMMAND_EVAL_E2E136_DELETE_SCHEDULE_BLOCK_CASES,
  ...AI_COMMAND_EVAL_E2E134_GUEST_MANAGE_LINK_CASES,
  ...AI_COMMAND_EVAL_E2E133_TOUR_VS_CLINIC_CASES,
  ...AI_COMMAND_EVAL_E2E132_CANCEL_POLICY_CASUAL_CASES,
  ...AI_COMMAND_EVAL_E2E131_CROSS_SURFACE_CASES,
  ...AI_COMMAND_EVAL_E2E129_EXPLAIN_MY_SUBSCRIPTION_CASES,
  ...AI_COMMAND_EVAL_E2E130_GIFT_CARD_PURCHASE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_CHECKOUT_TAX_CASES,
  ...AI_COMMAND_EVAL_CONFIGURE_STACKED_TAX_RULES_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_STACKED_TAX_CASES,
  ...AI_COMMAND_EVAL_STACKED_TAX_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_STRIPE_TAX_CHARGE_CASES,
  ...AI_COMMAND_EVAL_LOOKUP_BOOKING_TAX_METADATA_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_APPOINTMENT_TAX_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_APPOINTMENT_TAX_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EXPLAIN_PAYMENT_STATUS_CASES,
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
  ...AI_COMMAND_EVAL_EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_TOUR_MEETING_POINT_CASES,
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
  ...AI_COMMAND_EVAL_FIND_MY_SAVED_SALONS_CASES,
  ...AI_COMMAND_EVAL_SWITCH_SALON_TENANT_CASES,
  ...AI_COMMAND_EVAL_GROWTH_LOOPS_CUSTOMER_CASES,
  ...AI_COMMAND_EVAL_CANCEL_MY_BOOKING_CASES,
  ...AI_COMMAND_EVAL_CANCEL_ALL_UPCOMING_BOOKINGS_CASES,
  ...AI_COMMAND_EVAL_RESCHEDULE_MY_BOOKING_CASES,
  ...AI_COMMAND_EVAL_CHANGE_PROVIDER_ON_RESCHEDULE_CASES,
  ...AI_COMMAND_EVAL_PAY_ONLINE_CHECKOUT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_WHY_STRIPE_REQUIRED_CASES,
  ...AI_COMMAND_EVAL_MULTI_SERVICE_CUSTOMER_PUBLIC_CASES,
  ...AI_COMMAND_EVAL_SUBSCRIPTION_MEMBERSHIP_CUSTOMER_CASES,
  ...AI_COMMAND_EVAL_SELECT_SUBSCRIPTION_PLAN_CASES,
  ...AI_COMMAND_EVAL_DISCOVER_SUBSCRIPTION_PLANS_CASES,
  ...AI_COMMAND_EVAL_PROMO_CODE_HELP_CUSTOMER_PUBLIC_CASES,
  ...AI_COMMAND_EVAL_APPLY_PROMO_CODE_CHECKOUT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_SERVICE_PRICE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PAYMENT_OPTIONS_FOR_SERVICE_CASES,
  ...AI_COMMAND_EVAL_FIND_SOONEST_APPOINTMENT_CASES,
  ...AI_COMMAND_EVAL_COMPARE_SERVICES_CASES,
  ...AI_COMMAND_EVAL_FILTER_SERVICES_NO_PREPAYMENT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_AMOUNT_DUE_NOW_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_GUEST_CHECKOUT_FIELDS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_WHY_SIGN_IN_CASES,
  ...AI_COMMAND_EVAL_SIGN_IN_TO_MANAGE_BOOKING_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_MANAGE_BOOKING_PAGE_CASES,
  ...AI_COMMAND_EVAL_RECOVER_LOST_MANAGE_LINK_CASES,
  ...AI_COMMAND_EVAL_FIX_CHECKOUT_VALIDATION_ERROR_CASES,
  ...AI_COMMAND_EVAL_CONFIRM_MY_BOOKING_DETAILS_CASES,
  ...AI_COMMAND_EVAL_ADD_BOOKING_TO_CALENDAR_CASES,
  ...AI_COMMAND_EVAL_GET_DIRECTIONS_TO_SALON_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PREPARATION_NOTES_CASES,
  ...AI_COMMAND_EVAL_BOOK_ANOTHER_SERVICE_CASES,
  ...AI_COMMAND_EVAL_SHARE_MY_BOOKING_CASES,
  ...AI_COMMAND_EVAL_LIST_MY_UPCOMING_APPOINTMENTS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_CANCEL_POLICY_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_DEPOSIT_FORFEITURE_CASES,
  ...AI_COMMAND_EVAL_FIND_SERVICES_UNDER_BUDGET_CASES,
  ...AI_COMMAND_EVAL_FIND_EVENING_WEEKEND_SLOTS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_SALON_PROFILE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_LOYALTY_POINTS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_MY_SUBSCRIPTION_CASES,
  ...AI_COMMAND_EVAL_SUBSCRIPTION_USAGE_CASES,
  ...AI_COMMAND_EVAL_GIFT_CARD_MODIFY_CASES,
  ...AI_COMMAND_EVAL_MANAGE_NOTIFICATION_PREFERENCES_CASES,
  ...AI_COMMAND_EVAL_CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PUSH_PERMISSION_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_OFFLINE_MODE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_APP_UPDATE_REQUIRED_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_ANALYTICS_CONSENT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_HOME_SCREEN_WIDGET_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PATIENT_ALERT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_MY_NOTIFICATIONS_CASES,
  ...AI_COMMAND_EVAL_UPDATE_MY_PROFILE_CASES,
  ...AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_MULTI_SERVICE_CART_CASES,
  ...AI_COMMAND_EVAL_BOOK_PACKAGE_WITH_NEAREST_SLOT_CASES,
  ...AI_COMMAND_EVAL_BOOK_WITH_GIFT_CARD_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PACKAGE_SAVINGS_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CASES,
  ...AI_COMMAND_EVAL_TRACK_PHYSICAL_GIFT_CARD_ORDER_CASES,
  ...AI_COMMAND_EVAL_CLAIM_GIFT_CARD_BALANCE_CASES,
  ...AI_COMMAND_EVAL_APPLY_LOYALTY_AT_CHECKOUT_CASES,
  ...AI_COMMAND_EVAL_GET_MANAGE_LINK_CASES,
  ...AI_COMMAND_EVAL_NOTIFY_RUNNING_LATE_CASES,
  ...AI_COMMAND_EVAL_LEAVE_VISIT_REVIEW_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_POST_VISIT_REVIEW_PROMPT_CASES,
  ...AI_COMMAND_EVAL_REPORT_BOOKING_PROBLEM_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_SHARE_REWARD_CASES,
  ...AI_COMMAND_EVAL_SIGN_IN_AFTER_BOOKING_CASES,
  ...AI_COMMAND_EVAL_CUSTOMER_WAITLIST_CASES,
  ...AI_COMMAND_EVAL_REBOOK_LAST_APPOINTMENT_CASES,
  ...AI_COMMAND_EVAL_RESUME_PENDING_PAYMENT_CASES,
  ...AI_COMMAND_EVAL_DIAGNOSE_STRIPE_CHECKOUT_FAILURE_CONSUMER_CASES,
  ...AI_COMMAND_EVAL_PAY_AT_VENUE_FALLBACK_CASES,
  ...AI_COMMAND_EVAL_RESUME_BOOKING_DRAFT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_SLOT_NO_LONGER_AVAILABLE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_MULTI_SERVICE_PAYMENT_RETURN_CASES,
  ...AI_COMMAND_EVAL_RETRY_FAILED_NETWORK_ACTION_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_VOICE_INPUT_CASES,
  ...AI_COMMAND_EVAL_SPEAK_ASSISTANT_REPLY_CASES,
  ...AI_COMMAND_EVAL_GIVE_AI_FEEDBACK_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_RTL_LAYOUT_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_BUSINESS_HOURS_AND_LOCATION_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SPECIALTY_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_ANY_PROVIDER_OPTION_CASES,
  ...AI_COMMAND_EVAL_PICK_PROVIDER_FOR_SERVICE_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PROVIDER_AVAILABILITY_CASES,
  ...AI_COMMAND_EVAL_SWITCH_PROVIDER_SAME_TIME_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PROFESSIONAL_PROFILE_CASES,
  ...AI_COMMAND_EVAL_LOYALTY_POINTS_BALANCE_CUSTOMER_CASES,
  ...AI_COMMAND_EVAL_PRIVACY_GDPR_CUSTOMER_CASES,
  ...AI_COMMAND_EVAL_GIFT_CARD_CANCEL_CUSTOMER_CASES,
  ...AI_COMMAND_EVAL_CANCEL_PACKAGE_VISIT_SELF_CASES,
  ...AI_COMMAND_EVAL_RESCHEDULE_PACKAGE_VISIT_SELF_CASES,
  ...AI_COMMAND_EVAL_EXPLAIN_PACKAGE_VISIT_RULES_CASES,
  ...AI_COMMAND_EVAL_DISMISS_RECOMMENDATIONS_CASES,
  ...AI_COMMAND_EVAL_BUY_GIFT_CARD_FOR_SOMEONE_CASES,
  ...AI_COMMAND_EVAL_LIST_MY_PACKAGE_VISITS_CUSTOMER_CASES,
  ...AI_COMMAND_EVAL_SELF_SERVICE_BOOKING_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_CASES,
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
  ...AI_COMMAND_EVAL_PROVIDER_SUMMARIZE_DAY_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_SHOW_APPOINTMENTS_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_WHO_IS_NEXT_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EXPLAIN_TODAY_TIMELINE_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_END_OF_DAY_SUMMARY_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_MARK_VISIT_COMPLETE_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_MARK_PAID_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_COLLECT_REMAINING_BALANCE_CASES,
  ...AI_COMMAND_EVAL_SEARCH_RETAIL_SKU_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_FILL_UNUSED_SLOTS_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_PAYMENT_SWEEP_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_SUMMARIZE_UTILIZATION_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_OPEN_BOOKING_FROM_PUSH_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_CONFIRM_BOOKING_FROM_PUSH_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_BLOCK_SCHEDULE_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_SUGGEST_RETAIL_UPSELL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_LIST_MY_PACKAGE_VISITS_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_MARK_PAID_MULTILINGUAL_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_DISMISS_PUSH_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_MARK_NOTIFICATION_READ_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_EXPLAIN_LAST_PUSH_CASES,
  ...AI_COMMAND_EVAL_PROVIDER_NEW_BOOKING_PUSH_ACTIONS_CASES,
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
/** Map intake mutate chain prompts (ai-cmd-customer-6.12.6) to LLM-only eval cases — no deterministic rescue exists for this chain, classification is LLM-only. */
export const AI_COMMAND_EVAL_INTAKE_MUTATE_CHAIN_LLM_CASES: AiCommandEvalCase[] =
  INTAKE_MUTATE_CHAIN_PROMPTS.map((entry) => ({
    id: `intake-mutate-chain-${entry.id}`,
    prompt: entry.prompt,
    surface: entry.surface,
    locale: 'en' as const,
    requiresLlm: true,
    expect: { action: entry.expectedAction },
  }));

export const AI_COMMAND_EVAL_LLM_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_DISAMBIGUATION_LLM_CASES,
  ...AI_COMMAND_EVAL_CHECK_AND_BOOK_LLM_CASES,
  ...AI_COMMAND_EVAL_INTAKE_MUTATE_CHAIN_LLM_CASES,
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
