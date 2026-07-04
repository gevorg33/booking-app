import { DASHBOARD_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from './ai-clinic-lab-booking.fixtures.js';
import { BUSINESS_COMPLIANCE_CLASSIFIER_RULES } from './ai-business-compliance.fixtures.js';
import { BUSINESS_CURRENCY_CLASSIFIER_RULES } from './ai-business-currency.fixtures.js';
import { BUSINESS_TAX_CLASSIFIER_RULES } from './ai-business-tax.fixtures.js';
import { STRIPE_CURRENCY_WARNING_CLASSIFIER_RULES } from './ai-stripe-currency-warning.fixtures.js';
import { STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES } from './ai-stripe-checkout-failure.fixtures.js';
import { REPORTS_CURRENCY_CLASSIFIER_RULES } from './ai-reports-currency.fixtures.js';
import { REVENUE_KPIS_CLASSIFIER_RULES } from './ai-revenue-kpis.fixtures.js';
import { BUSINESS_LANGUAGES_CLASSIFIER_RULES } from './ai-business-languages.fixtures.js';
import { BUSINESS_DATE_FORMAT_CLASSIFIER_RULES } from './ai-business-date-format.fixtures.js';
import { PACKAGE_LOCALIZED_NAMES_CLASSIFIER_RULES } from './ai-package-localized-names.fixtures.js';
import { CATALOG_NOTIFY_CLASSIFIER_RULES } from './ai-catalog-notify.fixtures.js';
import { DASHBOARD_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES } from './ai-package-display-name.fixtures.js';
import { STRIPE_TAX_CHARGE_CLASSIFIER_RULES } from './ai-stripe-tax-charge.fixtures.js';
import { LOOKUP_BOOKING_TAX_METADATA_CLASSIFIER_RULES } from './ai-lookup-booking-tax-metadata.fixtures.js';
import { QUOTE_STAFF_BOOKING_TAX_CLASSIFIER_RULES } from './ai-quote-staff-booking-tax.fixtures.js';
import { SUMMARIZE_CUSTOMER_TAX_PAID_CLASSIFIER_RULES } from './ai-summarize-customer-tax-paid.fixtures.js';
import { UPCOMING_TOUR_DEPARTURES_CLASSIFIER_RULES } from './ai-upcoming-tour-departures.fixtures.js';
import { TOUR_BOOKING_RECORD_CLASSIFIER_RULES } from './ai-tour-booking-record.fixtures.js';
import { TOUR_CALENDAR_SPAN_CLASSIFIER_RULES } from './ai-tour-calendar-span.fixtures.js';
import { TOUR_CALENDAR_WEEK_CLASSIFIER_RULES } from './ai-tour-calendar-week.fixtures.js';
import { TOUR_SERVICE_CLASSIFIER_RULES } from './ai-tour-service.fixtures.js';
import { CLINIC_SERVICE_CLASSIFIER_RULES } from './ai-clinic-service.fixtures.js';
import { RECOMMENDATION_ANALYTICS_CLASSIFIER_RULES } from './ai-recommendation-analytics.fixtures.js';
import { RECOMMENDATION_PERFORMANCE_CLASSIFIER_RULES } from './ai-recommendation-performance.fixtures.js';
import { RECOMMENDATION_PRODUCT_CLASSIFIER_RULES } from './ai-recommendation-product.fixtures.js';
import { DASHBOARD_TIME_OFF_CLASSIFIER_RULES } from '../provider-mobile/provider-time-off.fixtures.js';
import { CREATE_SERVICE_PREPAYMENT_CLASSIFIER_RULES } from './ai-create-service-prepayment.util.js';
import { UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_CLASSIFIER_RULES } from './ai-update-service-prices-online-payment-filter.util.js';
import { DEACTIVATE_SERVICE_CATEGORY_SCOPE_CLASSIFIER_RULES } from './ai-deactivate-service-category-scope.util.js';
import { NOTIFICATION_SETTINGS_CLASSIFIER_RULES } from './ai-notification-settings.fixtures.js';
import { WHATSAPP_INTEGRATION_CLASSIFIER_RULES } from './ai-whatsapp-integration.fixtures.js';
import { EXPLAIN_INTEGRATION_HEALTH_CLASSIFIER_RULES } from './ai-explain-integration-health.fixtures.js';
import { OPENAI_INTEGRATION_CLASSIFIER_RULES } from './ai-openai-integration.fixtures.js';
import { TENANT_APP_INSTALL_CLASSIFIER_RULES } from './ai-tenant-app-install.fixtures.js';
import { CREATE_PROMO_CODE_CLASSIFIER_RULES } from './ai-create-promo-code.fixtures.js';
import { CONFIGURE_LOYALTY_SETTINGS_CLASSIFIER_RULES } from './ai-configure-loyalty-settings.fixtures.js';
import { CONFIGURE_SERVICE_FEATURED_CLASSIFIER_RULES } from './ai-configure-service-featured.fixtures.js';
import { BULK_ASSIGN_SERVICES_CATEGORY_CLASSIFIER_RULES } from './ai-bulk-assign-services-category.fixtures.js';
import { CONFIGURE_PACKAGE_ONLINE_PAYMENT_CLASSIFIER_RULES } from './ai-configure-package-online-payment.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_SETTINGS_CLASSIFIER_RULES } from './ai-explain-multi-service-settings.fixtures.js';
import { EXPLAIN_PUBLIC_BOOKING_CHECKOUT_CLASSIFIER_RULES } from './ai-explain-public-booking-checkout.fixtures.js';
import { AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_CLASSIFIER_RULES } from './ai-audit-services-missing-online-payment.fixtures.js';
import { BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES } from './ai-budget-service-discovery.fixtures.js';
import { CHECK_AND_BOOK_CLASSIFIER_RULES } from './ai-check-and-book.fixtures.js';
import { CLINIC_TEST_ORDER_CLASSIFIER_RULES } from './ai-clinic-test-order.fixtures.js';
import { CLINIC_TEST_RESULT_CLASSIFIER_RULES } from './ai-clinic-test-result.fixtures.js';
import { CLINIC_PATIENT_CHART_CLASSIFIER_RULES } from './ai-clinic-patient-chart.fixtures.js';
import { APP_GUIDE_CLASSIFIER_RULES } from './ai-product-guide.fixtures.js';
import { META_PRODUCT_GUIDE_CLASSIFIER_RULES } from './ai-meta-product-guide.fixtures.js';
import { DASHBOARD_EMPTY_STATE_GUIDE_CLASSIFIER_RULES } from './ai-product-guide-empty-state.fixtures.js';
import { DASHBOARD_PACKAGE_MULTI_CLASSIFIER_RULES } from './ai-package-multi-service.fixtures.js';
import { GIFT_CARD_PAYMENTS_CLASSIFIER_RULES } from './ai-gift-card-payments.fixtures.js';
import { SERVICE_ONLINE_PAYMENT_CLASSIFIER_RULES } from './ai-service-online-payment.fixtures.js';
import { SERVICE_ONLINE_PAYMENT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-service-online-payment-multilingual.fixtures.js';
import { SERVICE_ONLINE_PAYMENT_SETUP_CLASSIFIER_RULES } from './ai-service-online-payment-setup.fixtures.js';
import { DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES } from './ai-intent-disambiguation.fixtures.js';
import { DASHBOARD_FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES } from './ai-flexible-availability.fixtures.js';
import { DASHBOARD_SUMMARIZE_BOOKINGS_CURRENCY_CLASSIFIER_RULES } from './ai-dashboard-summarize-bookings.fixtures.js';
import { AGENT_OPS_CLASSIFIER_RULES } from './ai-agent-ops.fixtures.js';
import { BUSINESS_PROFILE_CLASSIFIER_RULES } from './ai-business-profile.fixtures.js';
import { ONBOARDING_CLASSIFIER_RULES } from './ai-onboarding.fixtures.js';
import { CLINIC_PRE_VISIT_INTAKE_CLASSIFIER_RULES } from './ai-clinic-pre-visit-intake.fixtures.js';
import {
  STAFF_OPERATIONS_CLASSIFIER_RULES,
  STAFF_OPERATIONS_MULTILINGUAL_CLASSIFIER_RULES,
} from './ai-staff-operations.util.js';
import { PROVIDER_ONBOARDING_COMPOUND_CLASSIFIER_RULES } from './ai-provider-onboarding-compound.util.js';
import { SETUP_SALON_CHECKOUT_COMPOUND_CLASSIFIER_RULES } from './ai-setup-salon-checkout-compound.util.js';
import { CONFIGURE_SERVICES_PAYMENT_MATRIX_CLASSIFIER_RULES } from './ai-configure-services-payment-matrix-compound.util.js';
import { CONFIGURE_CASH_PAYMENTS_CLASSIFIER_RULES } from './ai-cash-online-payment-compound.util.js';
import { DECLINE_ONLINE_PAYMENT_CATEGORY_CLASSIFIER_RULES } from './ai-decline-online-payment-category-compound.util.js';
import { ONBOARD_SALON_NOTIFICATIONS_CLASSIFIER_RULES } from './ai-onboard-salon-notifications-compound.util.js';
import { LAUNCH_CONSUMER_APP_GROWTH_CLASSIFIER_RULES } from './ai-launch-consumer-app-growth-compound.util.js';
import { CLINIC_LAB_DAY_CLOSE_CLASSIFIER_RULES } from './ai-clinic-lab-day-close-compound.util.js';
import { CLINIC_LAB_REVIEW_CLASSIFIER_RULES } from './ai-clinic-lab-review-compound.util.js';
import { BUDGET_DISCOVER_AND_BOOK_CLASSIFIER_RULES } from './ai-budget-discover-and-book-compound.util.js';
import { RANK_DISCOVER_AND_BOOK_CLASSIFIER_RULES } from './ai-rank-discover-and-book-compound.util.js';
import {
  WAITLIST_DASHBOARD_CLASSIFIER_RULES,
  WAITLIST_DASHBOARD_MULTILINGUAL_CLASSIFIER_RULES,
} from './ai-waitlist-dashboard.util.js';
import { CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES } from './ai-clinic-test-result-ext.util.js';
import {
  BILLING_LOYALTY_DASHBOARD_CLASSIFIER_RULES,
  BILLING_LOYALTY_MULTILINGUAL_CLASSIFIER_RULES,
} from './ai-billing-loyalty-dashboard.util.js';
import { STRIPE_CONNECT_CLASSIFIER_RULES } from './ai-stripe-connect.fixtures.js';
import { CHECKOUT_DEFAULTS_CLASSIFIER_RULES } from './ai-checkout-defaults.fixtures.js';
import { SERVICE_DEPOSIT_POLICY_CLASSIFIER_RULES } from './ai-service-deposit-policy.fixtures.js';
import { SERVICE_DURATION_BUFFER_CLASSIFIER_RULES } from './ai-service-duration-buffer.fixtures.js';
import { DASHBOARD_CORE_CLASSIFIER_RULES } from './ai-dashboard-core-classifier.fixtures.js';
import { CATALOG_DASHBOARD_CLASSIFIER_RULES } from './ai-catalog-dashboard-classifier.fixtures.js';
import { CUSTOMER_CRM_DASHBOARD_CLASSIFIER_RULES } from './ai-customer-crm-dashboard-classifier.fixtures.js';
import { SCHEDULE_RESOURCES_DASHBOARD_CLASSIFIER_RULES } from './ai-schedule-resources-dashboard-classifier.fixtures.js';
import { PAYMENTS_DASHBOARD_CLASSIFIER_RULES } from './ai-payments-dashboard-classifier.fixtures.js';
import { RETAIL_FINANCE_DASHBOARD_CLASSIFIER_RULES } from './ai-retail-finance-dashboard-classifier.fixtures.js';
import { MARKETING_GROWTH_DASHBOARD_CLASSIFIER_RULES } from './ai-marketing-growth-dashboard-classifier.fixtures.js';
import { PUSH_NOTIFICATIONS_DASHBOARD_CLASSIFIER_RULES } from './ai-push-notifications-dashboard-classifier.fixtures.js';
import { INTEGRATIONS_DASHBOARD_CLASSIFIER_RULES } from './ai-integrations-dashboard-classifier.fixtures.js';
import { SELF_SERVICE_BOOKING_DASHBOARD_CLASSIFIER_RULES } from './ai-self-service-booking-dashboard-classifier.fixtures.js';
import { SCHEDULING_DASHBOARD_CLASSIFIER_RULES } from './ai-scheduling-dashboard-classifier.fixtures.js';

/** Ordered dashboard appendix sections — one *_CLASSIFIER_RULES import per domain (ai-cmd-ext-6.3). */
export const DASHBOARD_INTENT_SCHEMA_APPENDIX_SECTIONS = [
  DASHBOARD_CORE_CLASSIFIER_RULES,
  CATALOG_DASHBOARD_CLASSIFIER_RULES,
  CREATE_SERVICE_PREPAYMENT_CLASSIFIER_RULES,
  DEACTIVATE_SERVICE_CATEGORY_SCOPE_CLASSIFIER_RULES,
  CUSTOMER_CRM_DASHBOARD_CLASSIFIER_RULES,
  SCHEDULE_RESOURCES_DASHBOARD_CLASSIFIER_RULES,
  PAYMENTS_DASHBOARD_CLASSIFIER_RULES,
  RETAIL_FINANCE_DASHBOARD_CLASSIFIER_RULES,
  MARKETING_GROWTH_DASHBOARD_CLASSIFIER_RULES,
  PUSH_NOTIFICATIONS_DASHBOARD_CLASSIFIER_RULES,
  INTEGRATIONS_DASHBOARD_CLASSIFIER_RULES,
  SELF_SERVICE_BOOKING_DASHBOARD_CLASSIFIER_RULES,
  SCHEDULING_DASHBOARD_CLASSIFIER_RULES,
  UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_CLASSIFIER_RULES,
  DASHBOARD_TIME_OFF_CLASSIFIER_RULES,
  CHECK_AND_BOOK_CLASSIFIER_RULES,
  DASHBOARD_PACKAGE_MULTI_CLASSIFIER_RULES,
  GIFT_CARD_PAYMENTS_CLASSIFIER_RULES,
  SERVICE_ONLINE_PAYMENT_CLASSIFIER_RULES,
  CHECKOUT_DEFAULTS_CLASSIFIER_RULES,
  SERVICE_DEPOSIT_POLICY_CLASSIFIER_RULES,
  NOTIFICATION_SETTINGS_CLASSIFIER_RULES,
  WHATSAPP_INTEGRATION_CLASSIFIER_RULES,
  OPENAI_INTEGRATION_CLASSIFIER_RULES,
  EXPLAIN_INTEGRATION_HEALTH_CLASSIFIER_RULES,
  SERVICE_DURATION_BUFFER_CLASSIFIER_RULES,
  SERVICE_ONLINE_PAYMENT_SETUP_CLASSIFIER_RULES,
  SERVICE_ONLINE_PAYMENT_MULTILINGUAL_CLASSIFIER_RULES,
  DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES,
  DASHBOARD_FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES,
  DASHBOARD_SUMMARIZE_BOOKINGS_CURRENCY_CLASSIFIER_RULES,
  STAFF_OPERATIONS_CLASSIFIER_RULES,
  STAFF_OPERATIONS_MULTILINGUAL_CLASSIFIER_RULES,
  PROVIDER_ONBOARDING_COMPOUND_CLASSIFIER_RULES,
  SETUP_SALON_CHECKOUT_COMPOUND_CLASSIFIER_RULES,
  CONFIGURE_SERVICES_PAYMENT_MATRIX_CLASSIFIER_RULES,
  CONFIGURE_CASH_PAYMENTS_CLASSIFIER_RULES,
  DECLINE_ONLINE_PAYMENT_CATEGORY_CLASSIFIER_RULES,
  ONBOARD_SALON_NOTIFICATIONS_CLASSIFIER_RULES,
  LAUNCH_CONSUMER_APP_GROWTH_CLASSIFIER_RULES,
  CLINIC_LAB_DAY_CLOSE_CLASSIFIER_RULES,
  CLINIC_LAB_REVIEW_CLASSIFIER_RULES,
  BUDGET_DISCOVER_AND_BOOK_CLASSIFIER_RULES,
  RANK_DISCOVER_AND_BOOK_CLASSIFIER_RULES,
  WAITLIST_DASHBOARD_CLASSIFIER_RULES,
  WAITLIST_DASHBOARD_MULTILINGUAL_CLASSIFIER_RULES,
  CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES,
  BILLING_LOYALTY_DASHBOARD_CLASSIFIER_RULES,
  BILLING_LOYALTY_MULTILINGUAL_CLASSIFIER_RULES,
  STRIPE_CONNECT_CLASSIFIER_RULES,
  TENANT_APP_INSTALL_CLASSIFIER_RULES,
  CREATE_PROMO_CODE_CLASSIFIER_RULES,
  CONFIGURE_LOYALTY_SETTINGS_CLASSIFIER_RULES,
  CONFIGURE_SERVICE_FEATURED_CLASSIFIER_RULES,
  BULK_ASSIGN_SERVICES_CATEGORY_CLASSIFIER_RULES,
  CONFIGURE_PACKAGE_ONLINE_PAYMENT_CLASSIFIER_RULES,
  EXPLAIN_MULTI_SERVICE_SETTINGS_CLASSIFIER_RULES,
  EXPLAIN_PUBLIC_BOOKING_CHECKOUT_CLASSIFIER_RULES,
  AUDIT_SERVICES_MISSING_ONLINE_PAYMENT_CLASSIFIER_RULES,
  APP_GUIDE_CLASSIFIER_RULES,
  META_PRODUCT_GUIDE_CLASSIFIER_RULES,
  DASHBOARD_EMPTY_STATE_GUIDE_CLASSIFIER_RULES,
  BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES,
  BUSINESS_CURRENCY_CLASSIFIER_RULES,
  BUSINESS_TAX_CLASSIFIER_RULES,
  BUSINESS_COMPLIANCE_CLASSIFIER_RULES,
  CLINIC_TEST_ORDER_CLASSIFIER_RULES,
  CLINIC_TEST_RESULT_CLASSIFIER_RULES,
  CLINIC_PATIENT_CHART_CLASSIFIER_RULES,
  DASHBOARD_CLINIC_LAB_BOOKING_CLASSIFIER_RULES,
  CLINIC_SERVICE_CLASSIFIER_RULES,
  QUOTE_STAFF_BOOKING_TAX_CLASSIFIER_RULES,
  SUMMARIZE_CUSTOMER_TAX_PAID_CLASSIFIER_RULES,
  LOOKUP_BOOKING_TAX_METADATA_CLASSIFIER_RULES,
  STRIPE_TAX_CHARGE_CLASSIFIER_RULES,
  BUSINESS_LANGUAGES_CLASSIFIER_RULES,
  BUSINESS_DATE_FORMAT_CLASSIFIER_RULES,
  PACKAGE_LOCALIZED_NAMES_CLASSIFIER_RULES,
  CATALOG_NOTIFY_CLASSIFIER_RULES,
  DASHBOARD_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES,
  TOUR_SERVICE_CLASSIFIER_RULES,
  TOUR_BOOKING_RECORD_CLASSIFIER_RULES,
  TOUR_CALENDAR_SPAN_CLASSIFIER_RULES,
  TOUR_CALENDAR_WEEK_CLASSIFIER_RULES,
  UPCOMING_TOUR_DEPARTURES_CLASSIFIER_RULES,
  RECOMMENDATION_PRODUCT_CLASSIFIER_RULES,
  RECOMMENDATION_ANALYTICS_CLASSIFIER_RULES,
  RECOMMENDATION_PERFORMANCE_CLASSIFIER_RULES,
  STRIPE_CURRENCY_WARNING_CLASSIFIER_RULES,
  STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES,
  REPORTS_CURRENCY_CLASSIFIER_RULES,
  REVENUE_KPIS_CLASSIFIER_RULES,
  AGENT_OPS_CLASSIFIER_RULES,
  BUSINESS_PROFILE_CLASSIFIER_RULES,
  ONBOARDING_CLASSIFIER_RULES,
  CLINIC_PRE_VISIT_INTAKE_CLASSIFIER_RULES,
] as const;

export function buildDashboardIntentSchemaAppendix(): string {
  return DASHBOARD_INTENT_SCHEMA_APPENDIX_SECTIONS.join('\n\n');
}
