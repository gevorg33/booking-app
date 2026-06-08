import { BUSINESS_COMPLIANCE_CLASSIFIER_RULES } from './ai-business-compliance.fixtures.js';
import { BUSINESS_CURRENCY_CLASSIFIER_RULES } from './ai-business-currency.fixtures.js';
import { BUSINESS_DATE_FORMAT_CLASSIFIER_RULES } from './ai-business-date-format.fixtures.js';
import { BUSINESS_LANGUAGES_CLASSIFIER_RULES } from './ai-business-languages.fixtures.js';
import { BUSINESS_TAX_CLASSIFIER_RULES } from './ai-business-tax.fixtures.js';
import { CLINIC_PATIENT_CHART_CLASSIFIER_RULES } from './ai-clinic-patient-chart.fixtures.js';
import { CLINIC_TEST_ORDER_CLASSIFIER_RULES } from './ai-clinic-test-order.fixtures.js';
import { CLINIC_TEST_RESULT_CLASSIFIER_RULES } from './ai-clinic-test-result.fixtures.js';
import { DASHBOARD_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from './ai-clinic-lab-booking.fixtures.js';
import { CLINIC_SERVICE_CLASSIFIER_RULES } from './ai-clinic-service.fixtures.js';
import { DASHBOARD_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES } from './ai-package-display-name.fixtures.js';
import { LOOKUP_BOOKING_TAX_METADATA_CLASSIFIER_RULES } from './ai-lookup-booking-tax-metadata.fixtures.js';
import { PACKAGE_LOCALIZED_NAMES_CLASSIFIER_RULES } from './ai-package-localized-names.fixtures.js';
import { QUOTE_STAFF_BOOKING_TAX_CLASSIFIER_RULES } from './ai-quote-staff-booking-tax.fixtures.js';
import { RECOMMENDATION_ANALYTICS_CLASSIFIER_RULES } from './ai-recommendation-analytics.fixtures.js';
import { RECOMMENDATION_PERFORMANCE_CLASSIFIER_RULES } from './ai-recommendation-performance.fixtures.js';
import { RECOMMENDATION_PRODUCT_CLASSIFIER_RULES } from './ai-recommendation-product.fixtures.js';
import { REPORTS_CURRENCY_CLASSIFIER_RULES } from './ai-reports-currency.fixtures.js';
import { REVENUE_KPIS_CLASSIFIER_RULES } from './ai-revenue-kpis.fixtures.js';
import { STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES } from './ai-stripe-checkout-failure.fixtures.js';
import { STRIPE_CURRENCY_WARNING_CLASSIFIER_RULES } from './ai-stripe-currency-warning.fixtures.js';
import { STRIPE_TAX_CHARGE_CLASSIFIER_RULES } from './ai-stripe-tax-charge.fixtures.js';
import { SUMMARIZE_CUSTOMER_TAX_PAID_CLASSIFIER_RULES } from './ai-summarize-customer-tax-paid.fixtures.js';
import { TOUR_BOOKING_RECORD_CLASSIFIER_RULES } from './ai-tour-booking-record.fixtures.js';
import { TOUR_CALENDAR_SPAN_CLASSIFIER_RULES } from './ai-tour-calendar-span.fixtures.js';
import { TOUR_CALENDAR_WEEK_CLASSIFIER_RULES } from './ai-tour-calendar-week.fixtures.js';
import { TOUR_SERVICE_CLASSIFIER_RULES } from './ai-tour-service.fixtures.js';
import { UPCOMING_TOUR_DEPARTURES_CLASSIFIER_RULES } from './ai-upcoming-tour-departures.fixtures.js';
import { CLASSIFIER_MULTILINGUAL_RULES } from './ai-prompt-i18n.js';
import { DASHBOARD_INTENT_SCHEMA } from './ai-command-intent-schema.js';

export interface DashboardClassifierSystemOptions {
  catalogContext: string;
  securityRules?: string;
  intelligenceBlock?: string;
  sessionBlock?: string;
  routeHintBlock?: string;
}

/** Shared dashboard classify_intent system prompt (acc-2.10 nightly eval + AiCommandService). */
export function buildDashboardClassifierSystemContent(
  options: DashboardClassifierSystemOptions,
): string {
  const {
    catalogContext,
    securityRules = '',
    intelligenceBlock = '',
    sessionBlock = '',
    routeHintBlock = '',
  } = options;
  return `${DASHBOARD_INTENT_SCHEMA}

${CLASSIFIER_MULTILINGUAL_RULES}

${BUSINESS_CURRENCY_CLASSIFIER_RULES}

${BUSINESS_TAX_CLASSIFIER_RULES}

${BUSINESS_COMPLIANCE_CLASSIFIER_RULES}

${CLINIC_TEST_ORDER_CLASSIFIER_RULES}

${CLINIC_TEST_RESULT_CLASSIFIER_RULES}

${CLINIC_PATIENT_CHART_CLASSIFIER_RULES}

${DASHBOARD_CLINIC_LAB_BOOKING_CLASSIFIER_RULES}

${CLINIC_SERVICE_CLASSIFIER_RULES}

${QUOTE_STAFF_BOOKING_TAX_CLASSIFIER_RULES}

${SUMMARIZE_CUSTOMER_TAX_PAID_CLASSIFIER_RULES}

${LOOKUP_BOOKING_TAX_METADATA_CLASSIFIER_RULES}

${STRIPE_TAX_CHARGE_CLASSIFIER_RULES}

${BUSINESS_LANGUAGES_CLASSIFIER_RULES}

${BUSINESS_DATE_FORMAT_CLASSIFIER_RULES}

${PACKAGE_LOCALIZED_NAMES_CLASSIFIER_RULES}

${DASHBOARD_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES}

${TOUR_SERVICE_CLASSIFIER_RULES}

${TOUR_BOOKING_RECORD_CLASSIFIER_RULES}

${TOUR_CALENDAR_SPAN_CLASSIFIER_RULES}

${TOUR_CALENDAR_WEEK_CLASSIFIER_RULES}

${UPCOMING_TOUR_DEPARTURES_CLASSIFIER_RULES}

${RECOMMENDATION_PRODUCT_CLASSIFIER_RULES}

${RECOMMENDATION_ANALYTICS_CLASSIFIER_RULES}

${RECOMMENDATION_PERFORMANCE_CLASSIFIER_RULES}

${STRIPE_CURRENCY_WARNING_CLASSIFIER_RULES}

${STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES}

${REPORTS_CURRENCY_CLASSIFIER_RULES}

${REVENUE_KPIS_CLASSIFIER_RULES}

${securityRules}

${catalogContext}${intelligenceBlock}${sessionBlock}${routeHintBlock}`;
}
