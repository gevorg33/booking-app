import { Injectable } from '@nestjs/common';
import {
  isClearSchedulePrompt,
  isScheduleTemplateCreationPrompt,
  isProviderOwnServicesPrompt,
} from './ai-orchestration.helpers.js';
import {
  isAnyProviderBookingPrompt,
  isFirstAvailableBookingPrompt,
  enrichBookingTimeHintsFromPrompt,
  isTeamWideProviderAvailabilityQuery,
  extractStatusFiltersFromPrompt,
  isBulkAllAppointmentsPrompt,
  extractBookingStatusFromPrompt,
  extractPaymentStatusFromPrompt,
  extractLimitFromPrompt,
} from './ai-intent-heuristics.js';
import { applyBookingRescheduleActionHints } from './ai-booking-reschedule-hints.util.js';
import {
  applyScheduleOpsPromptHints,
  disambiguateClearScheduleVsHideCalendar,
  isFillGapsFollowUpPrompt,
  isHideAppointmentsFromCalendarPrompt,
} from './ai-schedule-ops-hints.util.js';
import {
  applyPackageMultiServicePromptHints,
  disambiguateStaffPackageMultiBooking,
} from './ai-package-multi-service-hints.util.js';
import {
  applyGiftCardPaymentsPromptHints,
  disambiguateGiftCardPaymentsAction,
} from './ai-gift-card-payments-hints.util.js';
import {
  isTotalEarningsPrompt,
  isTopStaffRevenuePrompt,
} from './dashboard-revenue-analytics.util.js';
import {
  extractCustomerBookingContextFromPrompt,
  extractSingleProviderNameFromPrompt,
  extractUpcomingAppointmentScope,
  isCustomerBookingContextPrompt,
  isSingleProviderRevenuePrompt,
  isUpcomingAppointmentsPrompt,
} from './ai-dashboard-ops.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  isCapacityRebalancePrompt,
  rescueSchedulingIntent,
} from './ai-scheduling.util.js';
import { rescueOperationsIntent } from './ai-operations.util.js';
import {
  isAssignCategoryToProviderPrompt,
  rescueAssignCategoryToProviderIntent,
} from './ai-category-assignment.util.js';
import { rescueBookingDepthIntent } from './ai-booking-depth.util.js';
import { rescueCatalogIntent } from './ai-catalog.util.js';
import { rescueCustomerCrmIntent } from './ai-customer-crm.util.js';
import { rescueScheduleResourceIntent } from './ai-schedule-resources.util.js';
import { rescueGiftFulfillmentIntent } from './ai-gift-fulfillment.util.js';
import { rescueIntegrationsIntent } from './ai-integrations.util.js';
import { rescuePushNotificationsIntent } from './ai-push-notifications.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { rescueProviderBookingIntent } from './ai-provider-booking.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { rescueRetailFinanceIntent } from './ai-retail-finance.util.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';
import {
  disambiguateMisclassifiedAvailabilityIntent,
  resolveAvailabilityIntentFromPrompt,
} from './ai-intent-disambiguation.util.js';
import {
  parseCurrencyFromPrompt,
  rescueBusinessCurrencyIntent,
} from './ai-business-currency.util.js';
import {
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
  rescueBusinessTaxIntent,
} from './ai-business-tax.util.js';
import {
  parseConfigureStackedTaxRulesFromPrompt,
  rescueStackedTaxIntent,
} from './ai-stacked-tax.util.js';
import { rescueStripeTaxChargeIntent } from './ai-stripe-tax-charge.util.js';
import { rescueLookupBookingTaxMetadataIntent } from './ai-lookup-booking-tax-metadata.util.js';
import { rescueQuoteStaffBookingTaxIntent } from './ai-quote-staff-booking-tax.util.js';
import { rescueSummarizeCustomerTaxPaidIntent } from './ai-summarize-customer-tax-paid.util.js';
import { rescueCheckoutCurrencyIntent } from './ai-checkout-currency.util.js';
import { rescueCheckoutTaxIntent } from './ai-checkout-tax.util.js';
import { rescuePackageCurrencyIntent } from './ai-package-currency.util.js';
import { rescueNotificationCurrencyIntent } from './ai-notification-currency.util.js';
import { rescueStripeCheckoutCurrencyIntent } from './ai-stripe-checkout-currency.util.js';
import { rescueStripeCurrencyWarningIntent } from './ai-stripe-currency-warning.util.js';
import {
  isDiagnoseStripeCheckoutFailurePrompt,
  rescueStripeCheckoutFailureIntent,
} from './ai-stripe-checkout-failure.util.js';
import { rescueReportsCurrencyIntent } from './ai-reports-currency.util.js';
import { rescueRevenueKpisIntent } from './ai-revenue-kpis.util.js';
import {
  parseBusinessLanguagesFromPrompt,
  rescueBusinessLanguagesIntent,
  rescueExplainBusinessLanguagesIntent,
  rescueBulkStripDisabledLocaleTranslationsIntent,
} from './ai-business-languages.util.js';
import {
  extractMigrationSurfaceId,
  parseBusinessDateFormatFromPrompt,
  rescueBusinessDateFormatIntent,
} from './ai-business-date-format.util.js';
import {
  parseDateStringsFromPrompt,
  rescueDateInputFormatIntent,
} from './ai-date-input-format.util.js';
import {
  isConfigureProviderPushDateFormatPrompt,
  parseProviderPushTimeFormatFromPrompt,
  rescueProviderDateFormatIntent,
} from './ai-provider-date-format.util.js';
import {
  parseNotificationMessageKind,
  parsePatientResultReadyParams,
  rescueNotificationDateFormatIntent,
} from './ai-notification-date-format.util.js';
import { rescueBookingLanguagesIntent } from './ai-booking-languages.util.js';
import { rescueBookingDateFormatIntent } from './ai-booking-date-format.util.js';
import {
  parsePackageLocalizedNamesFromPrompt,
  rescuePackageLocalizedNamesIntent,
} from './ai-package-localized-names.util.js';
import {
  parsePackageDisplayNameExplainFromPrompt,
  rescuePackageDisplayNameIntent,
} from './ai-package-display-name.util.js';
import {
  isExplainTourBookingRecordPrompt,
  parseExplainTourBookingRecordFromPrompt,
  rescueExplainTourBookingRecordIntent,
} from './ai-tour-booking-record.util.js';
import {
  isExplainTourCalendarSpanPrompt,
  parseExplainTourCalendarSpanFromPrompt,
  rescueExplainTourCalendarSpanIntent,
} from './ai-tour-calendar-span.util.js';
import {
  isListTourCalendarWeekPrompt,
  parseListTourCalendarWeekFromPrompt,
  rescueListTourCalendarWeekIntent,
} from './ai-tour-calendar-week.util.js';
import {
  isListUpcomingTourDeparturesPrompt,
  parseListUpcomingTourDeparturesFromPrompt,
  rescueListUpcomingTourDeparturesIntent,
} from './ai-upcoming-tour-departures.util.js';
import {
  isExplainTourServicesPrompt,
  parseConfigureTourServiceFromPrompt,
  parseExplainTourServicesFromPrompt,
  rescueApplyTourPlaybookIntent,
  rescueConfigureTourServiceIntent,
  rescueExplainTourServicesIntent,
} from './ai-tour-service.util.js';
import {
  parseConfigureClinicServiceFromPrompt,
  parseExplainClinicServicesFromPrompt,
  rescueApplyClinicPlaybookIntent,
  rescueConfigureClinicServiceIntent,
  rescueExplainClinicServicesIntent,
} from './ai-clinic-service.util.js';
import {
  parseExplainClinicBookingFromPrompt,
  rescueExplainClinicBookingIntent,
} from './ai-clinic-booking.util.js';
import {
  parseDiagnoseTourCapacityFromPrompt,
  rescueDiagnoseTourCapacityIntent,
} from './ai-tour-capacity.util.js';
import {
  isExplainTourBookingPrompt,
  parseExplainTourBookingFromPrompt,
  rescueTourBookingIntent,
} from './ai-tour-booking.util.js';
import {
  isExplainTourDaySlotsPrompt,
  parseExplainTourDaySlotsFromPrompt,
  rescueTourDaySlotsIntent,
} from './ai-tour-day-slots.util.js';
import { rescueProviderPaymentCurrencyIntent } from './ai-provider-payment-currency.util.js';
import { rescueAppointmentTaxIntent } from './ai-appointment-tax.util.js';
import { rescueBusinessComplianceIntent } from './ai-business-compliance.util.js';
import {
  parseCreateTestOrderFromPrompt,
  parseListTestOrdersFromPrompt,
  rescueClinicTestOrderIntent,
} from './ai-clinic-test-order.util.js';
import { rescueClinicCompoundIntent } from './ai-clinic-compound.util.js';
import {
  parseEnterTestResultFromPrompt,
  parseReleaseTestResultFromPrompt,
  rescueClinicTestResultIntent,
} from './ai-clinic-test-result.util.js';
import {
  parseExplainPatientChartFromPrompt,
  rescueClinicPatientChartIntent,
} from './ai-clinic-patient-chart.util.js';
import {
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  rescueConsumerClinicTestResultsIntent,
} from './ai-consumer-clinic-test-results.util.js';
import {
  parseListMyCollectionQueueFromPrompt,
  parseMarkSpecimenCollectedFromPrompt,
  rescueProviderClinicCollectionIntent,
} from './ai-provider-clinic-collection.util.js';
import {
  parseBookLabCollectionFromPrompt,
  parseListMyLabBookingRequestsFromPrompt,
  parsePushLabBookingFromPrompt,
  parseStaffBookLabCollectionFromPrompt,
  rescueConsumerClinicLabBookingIntent,
  rescueDashboardClinicLabBookingIntent,
  rescueProviderClinicLabBookingIntent,
} from './ai-clinic-lab-booking.util.js';
import {
  parseAdminDeleteCustomerDataFromPrompt,
  parseConfigureGranularConsentFromPrompt,
  parseConfigurePrivacyRetentionFromPrompt,
  parseAcceptHipaaBaaFromPrompt,
  parseConfigureHipaaSessionTimeoutFromPrompt,
  parseEnableHipaaModeFromPrompt,
  parseExplainComplianceStatusFromPrompt,
  parseExplainGdprChecklistFromPrompt,
  parseExplainHipaaSessionTimeoutFromPrompt,
  parseListSubProcessorsFromPrompt,
  parseExplainMinimumNecessaryPhiAccessFromPrompt,
  parseExplainPhiEncryptionStatusFromPrompt,
  parseListBreachIncidentsFromPrompt,
  parseReportDataBreachFromPrompt,
  parseSendBreachNotificationFromPrompt,
  parseOpenComplianceDashboardFromPrompt,
  parseViewPhiAccessAuditFromPrompt,
} from './ai-business-compliance.util.js';
import { rescueProviderSessionTimeoutIntent } from './ai-provider-session-timeout.util.js';
import {
  parseExplainDataRightsFromPrompt,
  rescueExplainDataRightsIntent,
} from './ai-data-rights.util.js';
import { rescueTenantCurrencyIntent } from './ai-tenant-currency.util.js';
import {
  parseExplainCheckoutRecommendationsFromPrompt,
  rescueExplainCheckoutRecommendationsIntent,
} from './ai-checkout-recommendations.util.js';
import {
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from './ai-consumer-checkout-success.util.js';
import {
  parseExplainConsumerCheckoutTaxFromPrompt,
  rescueExplainConsumerCheckoutTaxIntent,
} from './ai-consumer-checkout-tax.util.js';
import {
  parseExplainRecommendationAnalyticsFromPrompt,
  rescueExplainRecommendationAnalyticsIntent,
} from './ai-recommendation-analytics.util.js';
import {
  parseSummarizeRecommendationPerformanceFromPrompt,
  rescueSummarizeRecommendationPerformanceIntent,
} from './ai-recommendation-performance.util.js';
import {
  parseConfigureRecommendationProductFromPrompt,
  parseExplainRecommendationSetupFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
  rescueConfigureRecommendationProductIntent,
  rescueExplainRecommendationSetupIntent,
  rescueLinkRecommendedProductsIntent,
} from './ai-recommendation-product.util.js';

export interface IntentRescueInput {
  prompt: string;
  action: string;
  params: Record<string, any>;
  reasoning?: string;
  employees?: Array<{ id: string; name: string }>;
  customers?: Array<{ id: string; name: string }>;
  timeZone?: string;
}

export interface IntentRescueResult {
  action: string;
  params: Record<string, any>;
  reasoning?: string;
  rescued: boolean;
  rescueReason: string;
}

const READ_ONLY_ACTIONS = new Set([
  'list_bookings',
  'show_appointments',
  'check_availability',
  'summarize_day',
  'summarize_bookings',
  'analyze_appointments',
  'analyze_services',
  'summarize_staff',
  'lookup_customer',
  'summarize_waitlist',
  'lookup_service_assignment',
  'list_services',
  'list_employees',
  'list_templates',
  'list_schedule_gaps',
  'summarize_utilization',
  'summarize_customers',
  'check_schedule_compliance',
  'revenue_forecast',
  'list_cash_pending_bookings',
  'list_package_bookings',
  'list_multi_service_bookings',
  'explain_booking_policy',
  'list_packages',
  'list_subscription_plans',
  'list_customer_subscriptions',
  'subscription_usage_history',
  'list_customer_gift_cards',
  'list_customer_bookings',
  'customer_no_show_history',
  'my_profile',
  'my_appointments',
  'my_subscriptions',
  'subscription_usage',
  'my_gift_cards',
  'gift_card_balance',
  'gift_card_redemption_history',
  'track_physical_gift_card_order',
  'discover_packages',
  'discover_subscription_plans',
  'discover_gift_card_products',
  'list_scheduling_resources',
  'list_resource_conflicts',
  'explain_resource_conflict',
  'my_resource_assignments',
  'check_multi_service_block_availability',
  'check_package_line_availability',
  'earliest_slot_all_services',
  'providers_available_later_days',
  'explain_why_no_slots',
  'summarize_unpaid',
  'validate_gift_card',
  'export_accounting',
  'export_commissions',
  'explain_checkout_total',
  'list_subscription_revenue',
  'explain_business_currency',
  'explain_checkout_currency',
  'explain_tenant_currency',
  'explain_package_currency',
  'explain_provider_payment_currency',
  'explain_notification_currency',
  'explain_stripe_currency_warning',
  'diagnose_stripe_checkout_failure',
  'explain_reports_currency',
  'explain_business_languages',
  'explain_booking_languages',
  'explain_booking_date_format',
  'summarize_revenue_kpis',
  'explain_stripe_checkout_currency',
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
  'explain_why_stripe_required',
  'receipt_status',
  'explain_payment_status',
  'list_gift_card_orders',
  'filter_awaiting_creation',
  'print_packing_slip',
  'gift_card_creation_queue',
  'list_package_appointments_today',
  'list_my_package_visits',
  'list_my_multi_service_groups',
  'delivery_queue',
  'track_gift_card_shipment',
  'shipping_method_quote',
  'order_status_notifications',
]);

@Injectable()
export class AiIntentRescueService {
  rescue(input: IntentRescueInput): IntentRescueResult | null {
    const { prompt, employees = [], customers = [], timeZone = 'UTC' } = input;
    const { action, params, reasoning } = input;

    if (action !== 'unknown') {
      const disambiguated = this.disambiguateMisclassified(
        prompt,
        action,
        params,
        employees,
        customers,
        timeZone,
      );
      if (disambiguated) return disambiguated;
      const clinicCompoundEarly = this.tryRescueClinicCompound(prompt, action);
      if (clinicCompoundEarly) return clinicCompoundEarly;
      const explainClinicBookingEarly = this.tryRescueExplainClinicBooking(
        prompt,
        action,
      );
      if (explainClinicBookingEarly) return explainClinicBookingEarly;
      const scheduling = this.tryRescueScheduling(prompt, action, params);
      if (scheduling) return scheduling;
      const businessCurrencyEarly = this.tryRescueBusinessCurrency(
        prompt,
        action,
      );
      if (businessCurrencyEarly) return businessCurrencyEarly;
      const clinicTestResultEarly = this.tryRescueClinicTestResult(
        prompt,
        action,
      );
      if (clinicTestResultEarly) return clinicTestResultEarly;
      const notificationDateEarly = this.tryRescueNotificationDateFormat(
        prompt,
        action,
      );
      if (notificationDateEarly) return notificationDateEarly;
      const clinicPatientChartEarly = this.tryRescueClinicPatientChart(
        prompt,
        action,
      );
      if (clinicPatientChartEarly) return clinicPatientChartEarly;
      const providerClinicCollectionEarly =
        this.tryRescueProviderClinicCollection(prompt, action);
      if (providerClinicCollectionEarly) return providerClinicCollectionEarly;
      const providerClinicLabBookingEarly =
        this.tryRescueProviderClinicLabBooking(prompt, action);
      if (providerClinicLabBookingEarly) return providerClinicLabBookingEarly;
      const consumerClinicTestResultsEarly =
        this.tryRescueConsumerClinicTestResults(prompt, action);
      if (consumerClinicTestResultsEarly) return consumerClinicTestResultsEarly;
      const consumerClinicLabBookingEarly =
        this.tryRescueConsumerClinicLabBooking(prompt, action);
      if (consumerClinicLabBookingEarly) return consumerClinicLabBookingEarly;
      const dashboardClinicLabBookingEarly =
        this.tryRescueDashboardClinicLabBooking(prompt, action);
      if (dashboardClinicLabBookingEarly) return dashboardClinicLabBookingEarly;
      const clinicTestOrderEarly = this.tryRescueClinicTestOrder(
        prompt,
        action,
      );
      if (clinicTestOrderEarly) return clinicTestOrderEarly;
      const consumerCheckoutTaxEarly = this.tryRescueConsumerCheckoutTax(
        prompt,
        action,
      );
      if (consumerCheckoutTaxEarly) return consumerCheckoutTaxEarly;
      const consumerCheckoutSuccessEarly =
        this.tryRescueConsumerCheckoutSuccess(prompt, action);
      if (consumerCheckoutSuccessEarly) return consumerCheckoutSuccessEarly;
      const recommendationProductEarly = this.tryRescueRecommendationProduct(
        prompt,
        action,
      );
      if (recommendationProductEarly) return recommendationProductEarly;
      const checkoutRecommendationsEarly =
        this.tryRescueCheckoutRecommendations(prompt, action);
      if (checkoutRecommendationsEarly) return checkoutRecommendationsEarly;
      const operations = this.tryRescueOperations(prompt, action, params);
      if (operations) return operations;
      const providerBookingEarly = this.tryRescueProviderBooking(
        prompt,
        action,
      );
      if (providerBookingEarly) return providerBookingEarly;
      const bookingDepthEarly = this.tryRescueBookingDepth(
        prompt,
        action,
        employees,
        customers,
      );
      if (bookingDepthEarly) return bookingDepthEarly;
      const selfServiceBooking = this.tryRescueSelfServiceBooking(
        prompt,
        action,
      );
      if (selfServiceBooking) return selfServiceBooking;
      const pushNotifications = this.tryRescuePushNotifications(prompt, action);
      if (pushNotifications) return pushNotifications;
      const marketingGrowth = this.tryRescueMarketingGrowth(prompt, action);
      if (marketingGrowth) return marketingGrowth;
      const retailFinance = this.tryRescueRetailFinance(prompt, action);
      if (retailFinance) return retailFinance;
      const integrations = this.tryRescueIntegrations(prompt, action);
      if (integrations) return integrations;
      const giftFulfillment = this.tryRescueGiftFulfillment(prompt, action);
      if (giftFulfillment) return giftFulfillment;
      const payments = this.tryRescuePayments(prompt, action);
      if (payments) return payments;
      const scheduleResources = this.tryRescueScheduleResources(prompt, action);
      if (scheduleResources) return scheduleResources;
      const catalog = this.tryRescueCatalog(prompt, action);
      if (catalog) return catalog;
      const providerBookingBeforeCrm = this.tryRescueProviderBooking(
        prompt,
        action,
      );
      if (providerBookingBeforeCrm) return providerBookingBeforeCrm;
      const customerCrm = this.tryRescueCustomerCrm(prompt, action);
      if (customerCrm) return customerCrm;
      return null;
    }

    const reportsCurrencyUnknown = this.tryRescueReportsCurrency(
      prompt,
      action,
    );
    if (reportsCurrencyUnknown) return reportsCurrencyUnknown;

    const revenueKpisUnknown = this.tryRescueRevenueKpis(prompt, action);
    if (revenueKpisUnknown) return revenueKpisUnknown;

    if (isTopStaffRevenuePrompt(prompt)) {
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          limit: extractLimitFromPrompt(prompt),
        },
        reasoning:
          'Rank specialists/providers by revenue for the requested period.',
        rescued: true,
        rescueReason: 'top_staff_revenue',
      };
    }

    if (isTotalEarningsPrompt(prompt)) {
      return {
        action: 'summarize_bookings',
        params: { ...params, bookingMetric: 'revenue' },
        reasoning: 'Calculate total earnings/revenue for the requested period.',
        rescued: true,
        rescueReason: 'total_earnings',
      };
    }

    const summarizeCustomerTaxPaidUnknown =
      rescueSummarizeCustomerTaxPaidIntent(prompt, action);
    if (summarizeCustomerTaxPaidUnknown) {
      return {
        action: summarizeCustomerTaxPaidUnknown.action,
        params: {},
        reasoning: `Customer tax paid summary rescue → ${summarizeCustomerTaxPaidUnknown.action}`,
        rescued: true,
        rescueReason: summarizeCustomerTaxPaidUnknown.rescueReason,
      };
    }

    const notificationDateBeforeClinic = this.tryRescueNotificationDateFormat(
      prompt,
      action,
    );
    if (notificationDateBeforeClinic) return notificationDateBeforeClinic;

    const clinicCompoundUnknown = this.tryRescueClinicCompound(prompt, action);
    if (clinicCompoundUnknown) return clinicCompoundUnknown;

    const dashboardClinicLabBookingBeforeResults =
      this.tryRescueDashboardClinicLabBooking(prompt, action);
    if (dashboardClinicLabBookingBeforeResults) {
      return dashboardClinicLabBookingBeforeResults;
    }

    const clinicTestResultUnknown = this.tryRescueClinicTestResult(
      prompt,
      action,
    );
    if (clinicTestResultUnknown) return clinicTestResultUnknown;

    const clinicPatientChartUnknown = this.tryRescueClinicPatientChart(
      prompt,
      action,
    );
    if (clinicPatientChartUnknown) return clinicPatientChartUnknown;

    const providerClinicCollectionUnknown =
      this.tryRescueProviderClinicCollection(prompt, action);
    if (providerClinicCollectionUnknown) return providerClinicCollectionUnknown;

    const providerClinicLabBookingUnknown =
      this.tryRescueProviderClinicLabBooking(prompt, action);
    if (providerClinicLabBookingUnknown) return providerClinicLabBookingUnknown;

    const consumerClinicTestResultsUnknown =
      this.tryRescueConsumerClinicTestResults(prompt, action);
    if (consumerClinicTestResultsUnknown)
      return consumerClinicTestResultsUnknown;

    const consumerClinicLabBookingUnknown =
      this.tryRescueConsumerClinicLabBooking(prompt, action);
    if (consumerClinicLabBookingUnknown) return consumerClinicLabBookingUnknown;

    const dashboardClinicLabBookingUnknown =
      this.tryRescueDashboardClinicLabBooking(prompt, action);
    if (dashboardClinicLabBookingUnknown)
      return dashboardClinicLabBookingUnknown;

    const explainClinicBookingUnknown = this.tryRescueExplainClinicBooking(
      prompt,
      action,
    );
    if (explainClinicBookingUnknown) return explainClinicBookingUnknown;

    const explainClinicServicesUnknown = this.tryRescueExplainClinicServices(
      prompt,
      action,
    );
    if (explainClinicServicesUnknown) return explainClinicServicesUnknown;

    const clinicServiceUnknown = this.tryRescueClinicService(prompt, action);
    if (clinicServiceUnknown) return clinicServiceUnknown;

    const clinicTestOrderUnknown = this.tryRescueClinicTestOrder(
      prompt,
      action,
    );
    if (clinicTestOrderUnknown) return clinicTestOrderUnknown;

    const businessComplianceEarly = rescueBusinessComplianceIntent(
      prompt,
      action,
    );
    if (businessComplianceEarly?.action === 'admin_delete_customer_data') {
      const params: Record<string, unknown> = {};
      const parsed = parseAdminDeleteCustomerDataFromPrompt(prompt);
      if (parsed?.customerName) {
        params.customerName = parsed.customerName;
      }
      return {
        action: businessComplianceEarly.action,
        params,
        reasoning: `Business compliance rescue → ${businessComplianceEarly.action}`,
        rescued: true,
        rescueReason: businessComplianceEarly.rescueReason,
      };
    }

    if (isCustomerBookingContextPrompt(prompt)) {
      const ctx = extractCustomerBookingContextFromPrompt(prompt);
      return {
        action: 'lookup_customer',
        params: {
          ...params,
          customerName: ctx.customerName ?? params.customerName,
          employeeName: ctx.employeeName ?? params.employeeName,
          timeSlot: ctx.timeSlot ?? params.timeSlot,
          date: ctx.dateHint ?? params.date ?? 'today',
          bookingContext: true,
        },
        reasoning: 'Customer profile with booking context (provider/time).',
        rescued: true,
        rescueReason: 'customer_booking_context',
      };
    }

    const applyTourPlaybookUnknown = this.tryRescueApplyTourPlaybook(
      prompt,
      action,
    );
    if (applyTourPlaybookUnknown) return applyTourPlaybookUnknown;

    const consumerCheckoutTaxUnknown = this.tryRescueConsumerCheckoutTax(
      prompt,
      action,
    );
    if (consumerCheckoutTaxUnknown) return consumerCheckoutTaxUnknown;

    const consumerCheckoutSuccessUnknown =
      this.tryRescueConsumerCheckoutSuccess(prompt, action);
    if (consumerCheckoutSuccessUnknown) return consumerCheckoutSuccessUnknown;

    const recommendationProductUnknownBeforeCheckout =
      this.tryRescueRecommendationProduct(prompt, action);
    if (recommendationProductUnknownBeforeCheckout) {
      return recommendationProductUnknownBeforeCheckout;
    }

    const checkoutRecommendationsUnknown =
      this.tryRescueCheckoutRecommendations(prompt, action);
    if (checkoutRecommendationsUnknown) return checkoutRecommendationsUnknown;

    const tourConsumerEarly = this.tryRescueTourConsumer(prompt, action);
    if (tourConsumerEarly) return tourConsumerEarly;

    const explainTourRecordUnknown = this.tryRescueExplainTourBookingRecord(
      prompt,
      action,
    );
    if (explainTourRecordUnknown) return explainTourRecordUnknown;

    const listDeparturesUnknown = this.tryRescueListUpcomingTourDepartures(
      prompt,
      action,
    );
    if (listDeparturesUnknown) return listDeparturesUnknown;

    const explainCalendarSpanUnknown = this.tryRescueExplainTourCalendarSpan(
      prompt,
      action,
    );
    if (explainCalendarSpanUnknown) return explainCalendarSpanUnknown;

    const listCalendarWeekUnknown = this.tryRescueListTourCalendarWeek(
      prompt,
      action,
    );
    if (listCalendarWeekUnknown) return listCalendarWeekUnknown;

    const explainToursUnknown = this.tryRescueExplainTourServices(
      prompt,
      action,
    );
    if (explainToursUnknown) return explainToursUnknown;

    if (isUpcomingAppointmentsPrompt(prompt)) {
      const scope = extractUpcomingAppointmentScope(prompt);
      return {
        action: 'show_appointments',
        params: {
          ...params,
          upcomingOnly: true,
          allProviders: scope.allProviders,
          employeeNames: scope.employeeNames.length
            ? scope.employeeNames
            : params.employeeNames,
          date: params.date ?? 'today',
        },
        reasoning: 'List upcoming appointments for selected provider scope.',
        rescued: true,
        rescueReason: 'upcoming_appointments',
      };
    }

    if (isSingleProviderRevenuePrompt(prompt)) {
      const employeeName =
        extractSingleProviderNameFromPrompt(prompt) ?? params.employeeName;
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          employeeName,
          limit: employeeName
            ? 1
            : Math.min(extractLimitFromPrompt(prompt), 10),
        },
        reasoning: 'Provider revenue summary for the requested period.',
        rescued: true,
        rescueReason: 'single_provider_revenue',
      };
    }

    if (isAssignCategoryToProviderPrompt(prompt)) {
      const categoryAssign = rescueAssignCategoryToProviderIntent(
        prompt,
        action,
        params,
      );
      if (categoryAssign) {
        return {
          action: categoryAssign.action,
          params: categoryAssign.params,
          reasoning: 'Assign all services in a category to a named provider.',
          rescued: true,
          rescueReason: categoryAssign.rescueReason,
        };
      }
    }

    const schedulingUnknown = this.tryRescueScheduling(prompt, action, params);
    if (schedulingUnknown) return schedulingUnknown;
    const businessCurrencyUnknown = this.tryRescueBusinessCurrency(
      prompt,
      action,
    );
    if (businessCurrencyUnknown) return businessCurrencyUnknown;
    const recommendationProductUnknownEarly =
      this.tryRescueRecommendationProduct(prompt, action);
    if (recommendationProductUnknownEarly) {
      return recommendationProductUnknownEarly;
    }
    const operationsUnknown = this.tryRescueOperations(prompt, action, params);
    if (operationsUnknown) return operationsUnknown;
    const catalogUnknown = this.tryRescueCatalog(prompt, action);
    if (catalogUnknown) return catalogUnknown;
    const selfServiceBookingUnknown = this.tryRescueSelfServiceBooking(
      prompt,
      action,
    );
    if (selfServiceBookingUnknown) return selfServiceBookingUnknown;
    const pushNotificationsUnknown = this.tryRescuePushNotifications(
      prompt,
      action,
    );
    if (pushNotificationsUnknown) return pushNotificationsUnknown;
    const marketingGrowthUnknown = this.tryRescueMarketingGrowth(
      prompt,
      action,
    );
    if (marketingGrowthUnknown) return marketingGrowthUnknown;
    const retailFinanceUnknown = this.tryRescueRetailFinance(prompt, action);
    if (retailFinanceUnknown) return retailFinanceUnknown;
    const integrationsUnknown = this.tryRescueIntegrations(prompt, action);
    if (integrationsUnknown) return integrationsUnknown;
    const giftFulfillmentUnknown = this.tryRescueGiftFulfillment(
      prompt,
      action,
    );
    if (giftFulfillmentUnknown) return giftFulfillmentUnknown;
    const paymentsUnknown = this.tryRescuePayments(prompt, action);
    if (paymentsUnknown) return paymentsUnknown;
    const scheduleResourcesUnknown = this.tryRescueScheduleResources(
      prompt,
      action,
    );
    if (scheduleResourcesUnknown) return scheduleResourcesUnknown;
    const providerBookingUnknown = this.tryRescueProviderBooking(
      prompt,
      action,
    );
    if (providerBookingUnknown) return providerBookingUnknown;
    const customerCrmUnknown = this.tryRescueCustomerCrm(prompt, action);
    if (customerCrmUnknown) return customerCrmUnknown;
    const bookingDepthUnknown = this.tryRescueBookingDepth(
      prompt,
      action,
      employees,
      customers,
    );
    if (bookingDepthUnknown) return bookingDepthUnknown;

    if (isCapacityRebalancePrompt(prompt)) {
      return {
        action: 'rebalance_capacity',
        params,
        reasoning: 'Move booked capacity between providers.',
        rescued: true,
        rescueReason: 'rebalance_capacity_pattern',
      };
    }

    if (isClearSchedulePrompt(prompt)) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints('clear_schedule', rescuedParams, prompt, {
        employees,
      });
      return {
        action: 'clear_schedule',
        params: rescuedParams,
        reasoning: reasoning ?? 'Clear applied schedule for provider(s)',
        rescued: true,
        rescueReason: 'clear_schedule_heuristic',
      };
    }

    if (isScheduleTemplateCreationPrompt(prompt)) {
      return {
        action: 'create_schedule_template',
        params: {
          ...params,
          templateName: params.templateName ?? params.name,
        },
        reasoning:
          'Create a reusable schedule template from the described hours.',
        rescued: true,
        rescueReason: 'create_schedule_template_pattern',
      };
    }

    if (/\b(mark|flag|set).+no[\s-]?show/i.test(prompt)) {
      return {
        action: 'mark_no_shows',
        params,
        reasoning: 'Mark missed past appointments as no-show.',
        rescued: true,
        rescueReason: 'mark_no_shows_pattern',
      };
    }

    if (
      /\b(payment sweep|unpaid|collect payment|outstanding payment)/i.test(
        prompt,
      )
    ) {
      return {
        action: 'payment_sweep',
        params,
        reasoning: 'Sweep unpaid appointments and mark as paid.',
        rescued: true,
        rescueReason: 'payment_sweep_pattern',
      };
    }

    if (/\b(replan|redo|fix).+(?:day|schedule|calendar)/i.test(prompt)) {
      return {
        action: 'day_replan',
        params,
        reasoning: 'Analyze and replan the schedule for the requested day.',
        rescued: true,
        rescueReason: 'day_replan_pattern',
      };
    }

    const availability = resolveAvailabilityIntentFromPrompt(
      'dashboard',
      prompt,
    );
    if (
      availability &&
      !/\b(book|schedule|reserve|create appointment)\b/i.test(prompt)
    ) {
      return {
        action: availability.action,
        params: { ...params, ...availability.params },
        reasoning: 'Availability intent from disambiguation matrix.',
        rescued: true,
        rescueReason: availability.rescueReason,
      };
    }

    if (/\b(show|list|display|view).+(appointment|booking)/i.test(prompt)) {
      const explainTourRecordListing = this.tryRescueExplainTourBookingRecord(
        prompt,
        action,
      );
      if (explainTourRecordListing) return explainTourRecordListing;

      const explainToursListing = this.tryRescueExplainTourServices(
        prompt,
        action,
      );
      if (explainToursListing) return explainToursListing;

      const statuses = extractStatusFiltersFromPrompt(prompt);
      return {
        action: 'show_appointments',
        params: {
          ...params,
          statusFilters: statuses.length ? statuses : params.statusFilters,
        },
        reasoning: 'Listing appointments.',
        rescued: true,
        rescueReason: 'show_appointments_pattern',
      };
    }

    if (
      /\b(reschedule|move|change time|shift)\b/i.test(prompt) &&
      !/\bmove\s+\d+\s+.+(?:slot|appointment)/i.test(prompt)
    ) {
      const rescuedParams = { ...params };
      applyBookingRescheduleActionHints(
        'reschedule_booking',
        rescuedParams,
        prompt,
        { employees, customers, timeZone },
      );
      return {
        action: 'reschedule_booking',
        params: rescuedParams,
        reasoning: 'Rescheduling appointment.',
        rescued: true,
        rescueReason: 'reschedule_pattern',
      };
    }

    if (
      /\b(book|schedule|reserve|appointment)\b/i.test(prompt) &&
      !/\b(cancel|hide|clear)\b/i.test(prompt)
    ) {
      const rescuedParams = { ...params };
      applyBookingRescheduleActionHints(
        'create_booking',
        rescuedParams,
        prompt,
        { employees, customers, timeZone },
      );
      return {
        action: 'create_booking',
        params: rescuedParams,
        reasoning: 'Booking appointment from rescue heuristics.',
        rescued: true,
        rescueReason: 'create_booking_pattern',
      };
    }

    if (isHideAppointmentsFromCalendarPrompt(prompt)) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints(
        'hide_appointments_from_calendar',
        rescuedParams,
        prompt,
        { employees },
      );
      return {
        action: 'hide_appointments_from_calendar',
        params: rescuedParams,
        reasoning: 'Hiding appointments from calendar.',
        rescued: true,
        rescueReason: 'hide_calendar_pattern',
      };
    }

    if (/\b(cancel|remove).+(appointment|booking)/i.test(prompt)) {
      const rescuedParams = { ...params };
      if (isBulkAllAppointmentsPrompt(prompt)) {
        rescuedParams.allAppointments = true;
        delete rescuedParams.serviceName;
        rescuedParams.serviceNames = null;
      }
      return {
        action: 'cancel_bookings',
        params: rescuedParams,
        reasoning: 'Cancelling appointments.',
        rescued: true,
        rescueReason: 'cancel_bookings_pattern',
      };
    }

    if (
      /\b(mark|set|update)\b.+\b(done|completed|no[\s-]?show|paid|payment|n\/a|not applicable)\b/i.test(
        prompt,
      )
    ) {
      const rescuedParams = { ...params };
      if (isBulkAllAppointmentsPrompt(prompt)) {
        rescuedParams.allAppointments = true;
        delete rescuedParams.serviceName;
        rescuedParams.serviceNames = null;
      }
      const status = extractBookingStatusFromPrompt(prompt);
      const paymentStatus = extractPaymentStatusFromPrompt(prompt);
      if (status && status !== BookingStatus.CANCELLED)
        rescuedParams.status = status;
      if (paymentStatus) rescuedParams.paymentStatus = paymentStatus;
      if (status === BookingStatus.CANCELLED) {
        return {
          action: 'cancel_bookings',
          params: rescuedParams,
          reasoning: 'Cancelling appointments.',
          rescued: true,
          rescueReason: 'cancel_from_update_pattern',
        };
      }
      return {
        action: 'update_bookings',
        params: rescuedParams,
        reasoning: 'Updating appointment status and/or payment.',
        rescued: true,
        rescueReason: 'update_bookings_pattern',
      };
    }

    if (
      /\b(fill|optimize).+(gap|slot|utilization)/i.test(prompt) ||
      isFillGapsFollowUpPrompt(prompt)
    ) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints('fill_unused_slots', rescuedParams, prompt, {
        employees,
      });
      return {
        action: 'fill_unused_slots',
        params: rescuedParams,
        reasoning: 'Filling schedule gaps.',
        rescued: true,
        rescueReason: 'fill_gaps_pattern',
      };
    }

    if (isProviderOwnServicesPrompt(prompt)) {
      return {
        action: 'assign_employee_services',
        params,
        reasoning: 'Assigning services to provider.',
        rescued: true,
        rescueReason: 'assign_services_pattern',
      };
    }

    return null;
  }

  private tryRescueScheduling(
    prompt: string,
    action: string,
    params: Record<string, any>,
  ): IntentRescueResult | null {
    const rescued = rescueSchedulingIntent(prompt, action, params);
    if (!rescued) return null;
    const paramsChanged =
      JSON.stringify(rescued.params) !== JSON.stringify(params);
    if (rescued.action === action && !paramsChanged) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      rescued: true,
      rescueReason: 'scheduling_intent',
    };
  }

  private tryRescueOperations(
    prompt: string,
    action: string,
    params: Record<string, any>,
  ): IntentRescueResult | null {
    const categoryAssign = rescueAssignCategoryToProviderIntent(
      prompt,
      action,
      params,
    );
    if (categoryAssign) {
      return {
        action: categoryAssign.action,
        params: categoryAssign.params,
        reasoning: 'Assign all services in a category to a named provider.',
        rescued: true,
        rescueReason: categoryAssign.rescueReason,
      };
    }
    const rescued = rescueOperationsIntent(prompt, action, params);
    if (!rescued) return null;
    const paramsChanged =
      JSON.stringify(rescued.params) !== JSON.stringify(params);
    if (rescued.action === action && !paramsChanged) return null;
    return {
      action: rescued.action,
      params: rescued.params,
      rescued: true,
      rescueReason: 'operations_booking_ops',
    };
  }

  private tryRescueBookingDepth(
    prompt: string,
    action: string,
    employees: Array<{ id: string; name: string }> = [],
    customers: Array<{ id: string; name: string }> = [],
  ): IntentRescueResult | null {
    const rescued = rescueBookingDepthIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const rescuedParams: Record<string, any> = {};
    applyPackageMultiServicePromptHints(rescued.action, rescuedParams, prompt, {
      employees,
      customers,
    });
    return {
      action: rescued.action,
      params: rescuedParams,
      reasoning: `Booking command rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderBookingIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueSelfServiceBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueSelfServiceBookingIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Customer booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePushNotifications(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePushNotificationsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Push/notifications rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueMarketingGrowth(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueMarketingGrowthIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Marketing/growth rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConsumerCheckoutTax(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainConsumerCheckoutTaxIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainConsumerCheckoutTaxFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Consumer checkout tax explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConsumerCheckoutSuccess(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainConsumerCheckoutSuccessIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainConsumerCheckoutSuccessFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Consumer checkout success explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCheckoutRecommendations(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainCheckoutRecommendationsIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainCheckoutRecommendationsFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.productName) params.productName = parsed.productName;
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Checkout recommendations explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRecommendationProduct(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const performanceRescued = rescueSummarizeRecommendationPerformanceIntent(
      prompt,
      action,
    );
    if (performanceRescued) {
      const parsed = parseSummarizeRecommendationPerformanceFromPrompt(prompt);
      const params: Record<string, unknown> = {};
      if (parsed?.aspect) params.aspect = parsed.aspect;
      if (parsed?.surface) params.surface = parsed.surface;
      if (parsed?.serviceName) params.serviceName = parsed.serviceName;
      if (parsed?.productName) params.productName = parsed.productName;
      if (parsed?.daysAhead) params.daysAhead = parsed.daysAhead;
      return {
        action: performanceRescued.action,
        params,
        reasoning: `Recommendation performance summary rescue → ${performanceRescued.action}`,
        rescued: true,
        rescueReason: performanceRescued.rescueReason,
      };
    }

    const explainRescued = rescueExplainRecommendationSetupIntent(
      prompt,
      action,
    );
    if (explainRescued) {
      const parsed = parseExplainRecommendationSetupFromPrompt(prompt);
      const params: Record<string, unknown> = {};
      if (parsed?.serviceId) params.serviceId = parsed.serviceId;
      if (parsed?.serviceName) params.serviceName = parsed.serviceName;
      if (parsed?.categoryId) params.categoryId = parsed.categoryId;
      if (parsed?.categoryName) params.categoryName = parsed.categoryName;
      return {
        action: explainRescued.action,
        params,
        reasoning: `Recommendation product rescue → ${explainRescued.action}`,
        rescued: true,
        rescueReason: explainRescued.rescueReason,
      };
    }

    const analyticsRescued = rescueExplainRecommendationAnalyticsIntent(
      prompt,
      action,
    );
    if (analyticsRescued) {
      const parsed = parseExplainRecommendationAnalyticsFromPrompt(prompt);
      const params: Record<string, unknown> = {};
      if (parsed?.aspect) params.aspect = parsed.aspect;
      if (parsed?.surface) params.surface = parsed.surface;
      if (parsed?.productName) params.productName = parsed.productName;
      if (parsed?.daysAhead) params.daysAhead = parsed.daysAhead;
      return {
        action: analyticsRescued.action,
        params,
        reasoning: `Recommendation analytics explain rescue → ${analyticsRescued.action}`,
        rescued: true,
        rescueReason: analyticsRescued.rescueReason,
      };
    }

    const linkRescued = rescueLinkRecommendedProductsIntent(prompt, action);
    if (linkRescued) {
      const parsed = parseLinkRecommendedProductsFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.productNames.length > 0) {
        params.productNames = parsed.productNames;
      }
      if (parsed.productIds?.length) params.productIds = parsed.productIds;
      if (parsed.serviceId) params.serviceId = parsed.serviceId;
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.categoryId) params.categoryId = parsed.categoryId;
      if (parsed.categoryName) params.categoryName = parsed.categoryName;
      return {
        action: linkRescued.action,
        params,
        reasoning: `Recommendation product rescue → ${linkRescued.action}`,
        rescued: true,
        rescueReason: linkRescued.rescueReason,
      };
    }

    const rescued = rescueConfigureRecommendationProductIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseConfigureRecommendationProductFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.productId) params.productId = parsed.productId;
    if (parsed.productName) params.productName = parsed.productName;
    if (parsed.description) params.description = parsed.description;
    if (parsed.imageUrl) params.imageUrl = parsed.imageUrl;
    if (parsed.externalLink) params.externalLink = parsed.externalLink;
    if (parsed.retailPrice !== undefined)
      params.retailPrice = parsed.retailPrice;
    if (parsed.wantsImage) params.wantsImage = true;
    if (parsed.wantsLink) params.wantsLink = true;
    if (parsed.isUpdate) params.isUpdate = true;

    return {
      action: rescued.action,
      params,
      reasoning: `Recommendation product rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRetailFinance(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueRetailFinanceIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Retail/finance rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueIntegrations(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueIntegrationsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Integrations rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueGiftFulfillment(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueGiftFulfillmentIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Gift fulfillment rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueReportsCurrency(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueReportsCurrencyIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Reports currency rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueRevenueKpis(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueRevenueKpisIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Revenue KPI summary rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePackageDisplayName(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePackageDisplayNameIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parsePackageDisplayNameExplainFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.packageId) params.packageId = parsed.packageId;
    if (parsed.packageName) params.packageName = parsed.packageName;
    if (parsed.queryLocale) params.locale = parsed.queryLocale;

    return {
      action: rescued.action,
      params,
      reasoning: `Package display name rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueBusinessLanguages(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const packageDisplayName = this.tryRescuePackageDisplayName(prompt, action);
    if (packageDisplayName) return packageDisplayName;

    const packageLocalized = this.tryRescuePackageLocalizedNames(
      prompt,
      action,
    );
    if (packageLocalized) return packageLocalized;

    const bookingLanguages = rescueBookingLanguagesIntent(prompt, action);
    if (bookingLanguages) {
      return {
        action: bookingLanguages.action,
        params: {},
        reasoning: `Booking languages rescue → ${bookingLanguages.action}`,
        rescued: true,
        rescueReason: bookingLanguages.rescueReason,
      };
    }

    const bookingDateFormat = rescueBookingDateFormatIntent(prompt, action);
    if (bookingDateFormat) {
      return {
        action: bookingDateFormat.action,
        params: {},
        reasoning: `Booking date format rescue → ${bookingDateFormat.action}`,
        rescued: true,
        rescueReason: bookingDateFormat.rescueReason,
      };
    }

    const bulkStrip = rescueBulkStripDisabledLocaleTranslationsIntent(
      prompt,
      action,
    );
    if (bulkStrip) {
      return {
        action: bulkStrip.action,
        params: {},
        reasoning: `Business languages rescue → ${bulkStrip.action}`,
        rescued: true,
        rescueReason: bulkStrip.rescueReason,
      };
    }

    const explain = rescueExplainBusinessLanguagesIntent(prompt, action);
    if (explain) {
      return {
        action: explain.action,
        params: {},
        reasoning: `Business languages rescue → ${explain.action}`,
        rescued: true,
        rescueReason: explain.rescueReason,
      };
    }

    const rescued = rescueBusinessLanguagesIntent(prompt, action);
    if (!rescued) return null;

    const parsed = parseBusinessLanguagesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {
      operation: parsed.operation,
      locales: parsed.locales,
    };
    if (parsed.operation === 'set_default') {
      params.defaultLocale = parsed.locales[0];
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Business languages rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueBusinessDateFormat(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    if (isConfigureProviderPushDateFormatPrompt(prompt)) {
      const providerDateFormatEarly = rescueProviderDateFormatIntent(
        prompt,
        action,
      );
      if (!providerDateFormatEarly) {
        return null;
      }
      const params: Record<string, unknown> = {};
      if (
        providerDateFormatEarly.action === 'configure_provider_push_date_format'
      ) {
        const parsedTimeFormat = parseProviderPushTimeFormatFromPrompt(
          prompt,
          params,
        );
        if (parsedTimeFormat?.timeFormat) {
          params.timeFormat = parsedTimeFormat.timeFormat;
        }
      }
      return {
        action: providerDateFormatEarly.action,
        params,
        reasoning: `Provider date format rescue → ${providerDateFormatEarly.action}`,
        rescued: true,
        rescueReason: providerDateFormatEarly.rescueReason,
      };
    }

    const notificationDate = this.tryRescueNotificationDateFormat(prompt, action);
    if (notificationDate) return notificationDate;

    const dateInput = rescueDateInputFormatIntent(prompt, action);
    if (dateInput) {
      const params: Record<string, unknown> = {};
      if (dateInput.action === 'preview_date_input_parse') {
        params.dateStrings = parseDateStringsFromPrompt(prompt, params);
      }
      return {
        action: dateInput.action,
        params,
        reasoning: `Date input format rescue → ${dateInput.action}`,
        rescued: true,
        rescueReason: dateInput.rescueReason,
      };
    }

    const providerSessionTimeout = rescueProviderSessionTimeoutIntent(
      prompt,
      action,
    );
    if (providerSessionTimeout) {
      return {
        action: providerSessionTimeout.action,
        params: {},
        reasoning: `Provider session timeout rescue → ${providerSessionTimeout.action}`,
        rescued: true,
        rescueReason: providerSessionTimeout.rescueReason,
      };
    }

    const rescued = rescueBusinessDateFormatIntent(prompt, action);
    if (rescued) {
      const params: Record<string, unknown> = {};
      if (rescued.action === 'migrate_dashboard_date_display') {
        const surfaceId = extractMigrationSurfaceId(prompt);
        if (surfaceId) params.surfaceId = surfaceId;
      }

      if (
        rescued.action === 'configure_business_date_format' ||
        rescued.action === 'preview_business_date_format'
      ) {
        const parsed = parseBusinessDateFormatFromPrompt(prompt);
        if (rescued.action === 'configure_business_date_format' && !parsed) {
          return null;
        }
        if (parsed?.dateFormat) params.dateFormat = parsed.dateFormat;
        if (parsed?.timeFormat) params.timeFormat = parsed.timeFormat;
      }

      return {
        action: rescued.action,
        params,
        reasoning: `Business date format rescue → ${rescued.action}`,
        rescued: true,
        rescueReason: rescued.rescueReason,
      };
    }

    const providerDateFormat = rescueProviderDateFormatIntent(prompt, action);
    if (!providerDateFormat) return null;

    const params: Record<string, unknown> = {};
    if (providerDateFormat.action === 'configure_provider_push_date_format') {
      const parsedTimeFormat = parseProviderPushTimeFormatFromPrompt(
        prompt,
        params,
      );
      if (parsedTimeFormat?.timeFormat) {
        params.timeFormat = parsedTimeFormat.timeFormat;
      }
    }
    return {
      action: providerDateFormat.action,
      params,
      reasoning: `Provider date format rescue → ${providerDateFormat.action}`,
      rescued: true,
      rescueReason: providerDateFormat.rescueReason,
    };
  }

  private tryRescueBusinessCurrency(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const businessCompliance = rescueBusinessComplianceIntent(prompt, action);
    if (businessCompliance) {
      const params: Record<string, unknown> = {};
      if (businessCompliance.action === 'configure_privacy_retention') {
        const parsed = parseConfigurePrivacyRetentionFromPrompt(prompt);
        if (parsed?.retention) Object.assign(params, parsed.retention);
        if (parsed?.cookieBanner?.enabled !== undefined) {
          params.cookieBannerEnabled = parsed.cookieBanner.enabled;
        }
        if (parsed?.cookieBanner?.message) {
          params.cookieBannerMessage = parsed.cookieBanner.message;
        }
      } else if (businessCompliance.action === 'configure_granular_consent') {
        const parsed = parseConfigureGranularConsentFromPrompt(prompt);
        if (parsed?.requireAiProcessing !== undefined) {
          params.requireAiProcessing = parsed.requireAiProcessing;
        }
        if (parsed?.requireThirdPartyIntegrations !== undefined) {
          params.requireThirdPartyIntegrations =
            parsed.requireThirdPartyIntegrations;
        }
      } else if (
        businessCompliance.action === 'configure_hipaa_session_timeout'
      ) {
        const parsed = parseConfigureHipaaSessionTimeoutFromPrompt(prompt);
        if (parsed?.sessionTimeoutMinutes != null) {
          params.sessionTimeoutMinutes = parsed.sessionTimeoutMinutes;
        }
      } else if (businessCompliance.action === 'accept_hipaa_baa') {
        const parsed = parseAcceptHipaaBaaFromPrompt(prompt);
        if (parsed?.enableHipaa != null) {
          params.enableHipaa = parsed.enableHipaa;
        }
      } else if (businessCompliance.action === 'enable_hipaa_mode') {
        const parsed = parseEnableHipaaModeFromPrompt(prompt);
        if (parsed?.enabled !== undefined) {
          params.enabled = parsed.enabled;
        }
        if (parsed?.sessionTimeoutMinutes !== undefined) {
          params.sessionTimeoutMinutes = parsed.sessionTimeoutMinutes;
        }
      } else if (businessCompliance.action === 'list_sub_processors') {
        const parsed = parseListSubProcessorsFromPrompt(prompt);
        if (parsed?.article28 != null) {
          params.article28 = parsed.article28;
        }
      } else if (businessCompliance.action === 'explain_gdpr_checklist') {
        const parsed = parseExplainGdprChecklistFromPrompt(prompt);
        if (parsed?.aspect) {
          params.aspect = parsed.aspect;
        }
      } else if (businessCompliance.action === 'explain_compliance_status') {
        const parsed = parseExplainComplianceStatusFromPrompt(prompt);
        if (parsed?.aspect) {
          params.aspect = parsed.aspect;
        }
      } else if (businessCompliance.action === 'admin_delete_customer_data') {
        const parsed = parseAdminDeleteCustomerDataFromPrompt(prompt);
        if (parsed?.customerName) {
          params.customerName = parsed.customerName;
        }
      } else if (businessCompliance.action === 'send_breach_notification') {
        const parsed = parseSendBreachNotificationFromPrompt(prompt);
        if (parsed?.incidentRef) {
          params.incidentRef = parsed.incidentRef;
        }
      } else if (businessCompliance.action === 'open_compliance_dashboard') {
        const parsed = parseOpenComplianceDashboardFromPrompt(prompt);
        if (parsed?.panel) {
          params.panel = parsed.panel;
        }
      } else if (businessCompliance.action === 'report_data_breach') {
        const parsed = parseReportDataBreachFromPrompt(prompt);
        if (parsed?.description) {
          params.description = parsed.description;
        }
        if (parsed?.affectedCustomerCount != null) {
          params.affectedCustomerCount = parsed.affectedCustomerCount;
        }
      } else if (businessCompliance.action === 'list_breach_incidents') {
        const parsed = parseListBreachIncidentsFromPrompt(prompt);
        if (parsed?.aspect) {
          params.aspect = parsed.aspect;
        }
      } else if (businessCompliance.action === 'view_phi_access_audit') {
        const parsed = parseViewPhiAccessAuditFromPrompt(prompt);
        if (parsed?.daysBack != null) {
          params.daysBack = parsed.daysBack;
        }
        if (parsed?.fieldName) {
          params.fieldName = parsed.fieldName;
        }
        if (parsed?.limit != null) {
          params.limit = parsed.limit;
        }
      } else if (
        businessCompliance.action === 'explain_phi_encryption_status'
      ) {
        const parsed = parseExplainPhiEncryptionStatusFromPrompt(prompt);
        if (parsed?.fieldName) {
          params.fieldName = parsed.fieldName;
        }
      } else if (
        businessCompliance.action === 'explain_minimum_necessary_phi_access'
      ) {
        const parsed = parseExplainMinimumNecessaryPhiAccessFromPrompt(prompt);
        if (parsed?.aspect) {
          params.aspect = parsed.aspect;
        }
      } else if (
        businessCompliance.action === 'explain_hipaa_session_timeout'
      ) {
        const parsed = parseExplainHipaaSessionTimeoutFromPrompt(prompt);
        if (parsed?.personalLogout != null) {
          params.personalLogout = parsed.personalLogout;
        }
      }
      return {
        action: businessCompliance.action,
        params,
        reasoning: `Business compliance rescue → ${businessCompliance.action}`,
        rescued: true,
        rescueReason: businessCompliance.rescueReason,
      };
    }

    const quoteStaffBookingTax = rescueQuoteStaffBookingTaxIntent(
      prompt,
      action,
    );
    if (quoteStaffBookingTax) {
      return {
        action: quoteStaffBookingTax.action,
        params: {},
        reasoning: `Staff booking tax quote rescue → ${quoteStaffBookingTax.action}`,
        rescued: true,
        rescueReason: quoteStaffBookingTax.rescueReason,
      };
    }

    const stackedTax = rescueStackedTaxIntent(prompt, action);
    if (stackedTax) {
      const params: Record<string, unknown> = {};
      if (stackedTax.action === 'configure_stacked_tax_rules') {
        const parsed = parseConfigureStackedTaxRulesFromPrompt(prompt);
        if (!parsed) return null;
        Object.assign(params, parsed);
      }
      return {
        action: stackedTax.action,
        params,
        reasoning: `Stacked tax rescue → ${stackedTax.action}`,
        rescued: true,
        rescueReason: stackedTax.rescueReason,
      };
    }

    const stripeCheckoutEarly = rescueStripeCheckoutCurrencyIntent(
      prompt,
      action,
    );
    if (stripeCheckoutEarly) {
      return {
        action: stripeCheckoutEarly.action,
        params: {},
        reasoning: `Stripe checkout currency rescue → ${stripeCheckoutEarly.action}`,
        rescued: true,
        rescueReason: stripeCheckoutEarly.rescueReason,
      };
    }

    const stripeTaxCharge = rescueStripeTaxChargeIntent(prompt, action);
    if (stripeTaxCharge) {
      return {
        action: stripeTaxCharge.action,
        params: {},
        reasoning: `Stripe tax charge rescue → ${stripeTaxCharge.action}`,
        rescued: true,
        rescueReason: stripeTaxCharge.rescueReason,
      };
    }

    const lookupBookingTax = rescueLookupBookingTaxMetadataIntent(
      prompt,
      action,
    );
    if (lookupBookingTax) {
      return {
        action: lookupBookingTax.action,
        params: {},
        reasoning: `Booking tax metadata lookup rescue → ${lookupBookingTax.action}`,
        rescued: true,
        rescueReason: lookupBookingTax.rescueReason,
      };
    }

    const appointmentTaxEarly = rescueAppointmentTaxIntent(prompt, action);
    if (appointmentTaxEarly) {
      return {
        action: appointmentTaxEarly.action,
        params: {},
        reasoning: `Appointment tax rescue → ${appointmentTaxEarly.action}`,
        rescued: true,
        rescueReason: appointmentTaxEarly.rescueReason,
      };
    }

    const summarizeCustomerTaxPaid = rescueSummarizeCustomerTaxPaidIntent(
      prompt,
      action,
    );
    if (summarizeCustomerTaxPaid) {
      return {
        action: summarizeCustomerTaxPaid.action,
        params: {},
        reasoning: `Customer tax paid summary rescue → ${summarizeCustomerTaxPaid.action}`,
        rescued: true,
        rescueReason: summarizeCustomerTaxPaid.rescueReason,
      };
    }

    const businessTax = rescueBusinessTaxIntent(prompt, action);
    if (businessTax) {
      const params: Record<string, unknown> = {};
      if (businessTax.action === 'configure_business_tax') {
        const parsed = parseBusinessTaxFromPrompt(prompt);
        if (!parsed) return null;
        Object.assign(params, parsed);
      } else if (businessTax.action === 'set_service_tax_rate') {
        const parsed = parseSetServiceTaxRateFromPrompt(prompt);
        if (!parsed) return null;
        Object.assign(params, parsed);
      }
      return {
        action: businessTax.action,
        params,
        reasoning: `Business tax rescue → ${businessTax.action}`,
        rescued: true,
        rescueReason: businessTax.rescueReason,
      };
    }

    const businessDateFormat = this.tryRescueBusinessDateFormat(prompt, action);
    if (businessDateFormat) return businessDateFormat;

    const businessLanguages = this.tryRescueBusinessLanguages(prompt, action);
    if (businessLanguages) return businessLanguages;

    const reportsCurrency = this.tryRescueReportsCurrency(prompt, action);
    if (reportsCurrency) return reportsCurrency;

    const revenueKpis = this.tryRescueRevenueKpis(prompt, action);
    if (revenueKpis) return revenueKpis;

    const tenant = rescueTenantCurrencyIntent(prompt, action);
    if (tenant) {
      return {
        action: tenant.action,
        params: {},
        reasoning: `Tenant currency rescue → ${tenant.action}`,
        rescued: true,
        rescueReason: tenant.rescueReason,
      };
    }

    const notificationCurrency = rescueNotificationCurrencyIntent(
      prompt,
      action,
    );
    if (notificationCurrency) {
      return {
        action: notificationCurrency.action,
        params: {},
        reasoning: `Notification currency rescue → ${notificationCurrency.action}`,
        rescued: true,
        rescueReason: notificationCurrency.rescueReason,
      };
    }

    const dataRightsEarly = rescueExplainDataRightsIntent(prompt, action);
    if (dataRightsEarly) {
      const params: Record<string, unknown> = {};
      const parsed = parseExplainDataRightsFromPrompt(prompt);
      if (parsed?.aspect) {
        params.aspect = parsed.aspect;
      }
      return {
        action: dataRightsEarly.action,
        params,
        reasoning: `Data rights rescue → ${dataRightsEarly.action}`,
        rescued: true,
        rescueReason: dataRightsEarly.rescueReason,
      };
    }

    const checkoutTaxEarly = rescueCheckoutTaxIntent(prompt, action);
    if (checkoutTaxEarly) {
      return {
        action: checkoutTaxEarly.action,
        params: {},
        reasoning: `Checkout tax rescue → ${checkoutTaxEarly.action}`,
        rescued: true,
        rescueReason: checkoutTaxEarly.rescueReason,
      };
    }

    const packageCurrency = rescuePackageCurrencyIntent(prompt, action);
    if (packageCurrency) {
      return {
        action: packageCurrency.action,
        params: {},
        reasoning: `Package currency rescue → ${packageCurrency.action}`,
        rescued: true,
        rescueReason: packageCurrency.rescueReason,
      };
    }

    const stripeCheckoutFailure = rescueStripeCheckoutFailureIntent(
      prompt,
      action,
    );
    if (stripeCheckoutFailure) {
      return {
        action: stripeCheckoutFailure.action,
        params: {},
        reasoning: `Stripe checkout failure rescue → ${stripeCheckoutFailure.action}`,
        rescued: true,
        rescueReason: stripeCheckoutFailure.rescueReason,
      };
    }

    const stripeWarning = rescueStripeCurrencyWarningIntent(prompt, action);
    if (stripeWarning) {
      return {
        action: stripeWarning.action,
        params: {},
        reasoning: `Stripe currency warning rescue → ${stripeWarning.action}`,
        rescued: true,
        rescueReason: stripeWarning.rescueReason,
      };
    }

    const providerPaymentCurrency = rescueProviderPaymentCurrencyIntent(
      prompt,
      action,
    );
    if (providerPaymentCurrency) {
      return {
        action: providerPaymentCurrency.action,
        params: {},
        reasoning: `Provider payment currency rescue → ${providerPaymentCurrency.action}`,
        rescued: true,
        rescueReason: providerPaymentCurrency.rescueReason,
      };
    }

    const stripeCheckout = rescueStripeCheckoutCurrencyIntent(prompt, action);
    if (stripeCheckout) {
      return {
        action: stripeCheckout.action,
        params: {},
        reasoning: `Stripe checkout currency rescue → ${stripeCheckout.action}`,
        rescued: true,
        rescueReason: stripeCheckout.rescueReason,
      };
    }

    const checkoutTax = rescueCheckoutTaxIntent(prompt, action);
    if (checkoutTax) {
      return {
        action: checkoutTax.action,
        params: {},
        reasoning: `Checkout tax rescue → ${checkoutTax.action}`,
        rescued: true,
        rescueReason: checkoutTax.rescueReason,
      };
    }

    const checkout = rescueCheckoutCurrencyIntent(prompt, action);
    if (checkout) {
      return {
        action: checkout.action,
        params: {},
        reasoning: `Checkout currency rescue → ${checkout.action}`,
        rescued: true,
        rescueReason: checkout.rescueReason,
      };
    }

    const rescued = rescueBusinessCurrencyIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'configure_business_currency') {
      const currencyCode = parseCurrencyFromPrompt(prompt);
      if (!currencyCode) return null;
      params.currencyCode = currencyCode;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Business currency rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePayments(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePaymentsIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    const rescuedParams: Record<string, any> = {};
    applyGiftCardPaymentsPromptHints(rescued.action, rescuedParams, prompt);
    return {
      action: rescued.action,
      params: rescuedParams,
      reasoning: `Payments/checkout rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueScheduleResources(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueScheduleResourceIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Schedule/resource rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCustomerCrm(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueCustomerCrmIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Customer CRM rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescuePackageLocalizedNames(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescuePackageLocalizedNamesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parsePackageLocalizedNamesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {
      operation: parsed.operation,
    };
    if (parsed.packageId) params.packageId = parsed.packageId;
    if (parsed.packageName) params.packageName = parsed.packageName;
    if (parsed.locale) params.locale = parsed.locale;
    if (parsed.displayName) params.displayName = parsed.displayName;

    return {
      action: rescued.action,
      params,
      reasoning: `Package localized names rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueApplyClinicPlaybook(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueApplyClinicPlaybookIntent(prompt, action);
    if (!rescued) return null;

    return {
      action: rescued.action,
      params: {},
      reasoning: `Clinic playbook rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueApplyTourPlaybook(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueApplyTourPlaybookIntent(prompt, action);
    if (!rescued) return null;

    return {
      action: rescued.action,
      params: {},
      reasoning: `Tour playbook rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainTourCalendarSpan(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainTourCalendarSpanIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainTourCalendarSpanFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { aspect: parsed.aspect };
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.weekStartDate) params.weekStartDate = parsed.weekStartDate;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour calendar span explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueListTourCalendarWeek(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueListTourCalendarWeekIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseListTourCalendarWeekFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.employeeId) params.employeeId = parsed.employeeId;
    if (parsed.employeeName) params.employeeName = parsed.employeeName;
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.weekStartDate) params.weekStartDate = parsed.weekStartDate;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour calendar week list rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueListUpcomingTourDepartures(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueListUpcomingTourDeparturesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseListUpcomingTourDeparturesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.daysAhead !== undefined) params.daysAhead = parsed.daysAhead;

    return {
      action: rescued.action,
      params,
      reasoning: `Upcoming tour departures list rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueTourConsumer(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    if (isDiagnoseStripeCheckoutFailurePrompt(prompt)) return null;
    if (parseConfigureTourServiceFromPrompt(prompt)) return null;
    if (isExplainTourBookingRecordPrompt(prompt)) return null;
    if (isExplainTourCalendarSpanPrompt(prompt)) return null;
    if (isListTourCalendarWeekPrompt(prompt)) return null;
    if (isListUpcomingTourDeparturesPrompt(prompt)) return null;

    const diagnose = rescueDiagnoseTourCapacityIntent(prompt, action);
    if (diagnose) {
      const parsed = parseDiagnoseTourCapacityFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.serviceId) params.serviceId = parsed.serviceId;
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.dateKey) params.date = parsed.dateKey;
      if (parsed.requestedPax !== undefined) {
        params.requestedPax = parsed.requestedPax;
      }
      if (parsed.aspect) params.aspect = parsed.aspect;
      return {
        action: diagnose.action,
        params,
        reasoning: `Tour capacity diagnosis rescue → ${diagnose.action}`,
        rescued: true,
        rescueReason: diagnose.rescueReason,
      };
    }

    if (
      isExplainTourServicesPrompt(prompt) &&
      !isExplainTourBookingPrompt(prompt) &&
      !isExplainTourDaySlotsPrompt(prompt)
    ) {
      return null;
    }

    const daySlots = rescueTourDaySlotsIntent(prompt, action);
    if (daySlots) {
      const parsed = parseExplainTourDaySlotsFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.serviceId) params.serviceId = parsed.serviceId;
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.dateKey) params.date = parsed.dateKey;
      if (parsed.aspect) params.aspect = parsed.aspect;
      return {
        action: daySlots.action,
        params,
        reasoning: `Tour day slots explain rescue → ${daySlots.action}`,
        rescued: true,
        rescueReason: daySlots.rescueReason,
      };
    }

    const tourBooking = rescueTourBookingIntent(prompt, action);
    if (tourBooking) {
      const parsed = parseExplainTourBookingFromPrompt(prompt);
      if (!parsed) return null;
      const params: Record<string, unknown> = {};
      if (parsed.serviceId) params.serviceId = parsed.serviceId;
      if (parsed.serviceName) params.serviceName = parsed.serviceName;
      if (parsed.aspect) params.aspect = parsed.aspect;
      return {
        action: tourBooking.action,
        params,
        reasoning: `Tour booking explain rescue → ${tourBooking.action}`,
        rescued: true,
        rescueReason: tourBooking.rescueReason,
      };
    }

    return null;
  }

  private tryRescueExplainTourBookingRecord(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainTourBookingRecordIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainTourBookingRecordFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.bookingId) params.bookingId = parsed.bookingId;
    if (parsed.customerName) params.customerName = parsed.customerName;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.aspect) params.aspect = parsed.aspect;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour booking record explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainClinicBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainClinicBookingIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainClinicBookingFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = { aspect: parsed.aspect };
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic booking explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainClinicServices(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainClinicServicesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainClinicServicesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic services explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClinicService(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConfigureClinicServiceIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseConfigureClinicServiceFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.serviceType) params.serviceType = parsed.serviceType;
    if (parsed.requiresFasting !== undefined) {
      params.requiresFasting = parsed.requiresFasting;
    }
    if (parsed.preparationNotes) {
      params.preparationNotes = parsed.preparationNotes;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic service rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueExplainTourServices(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueExplainTourServicesIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseExplainTourServicesFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.daysAhead !== undefined) params.daysAhead = parsed.daysAhead;

    return {
      action: rescued.action,
      params,
      reasoning: `Tour services explain rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueTourService(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConfigureTourServiceIntent(prompt, action);
    if (!rescued) return null;
    const parsed = parseConfigureTourServiceFromPrompt(prompt);
    if (!parsed) return null;

    const params: Record<string, unknown> = {};
    if (parsed.serviceId) params.serviceId = parsed.serviceId;
    if (parsed.serviceName) params.serviceName = parsed.serviceName;
    if (parsed.enableTour) {
      params.enableTour = true;
      params.serviceType = 'tour';
    }
    if (parsed.maxGroupSize !== undefined) {
      params.maxGroupSize = parsed.maxGroupSize;
    }
    if (parsed.difficulty) params.difficulty = parsed.difficulty;
    if (parsed.coverImage) params.coverImage = parsed.coverImage;
    if (parsed.meetingPoint) params.meetingPoint = parsed.meetingPoint;
    if (parsed.includedItems) params.includedItems = parsed.includedItems;
    if (parsed.durationDays !== undefined) {
      params.durationDays = parsed.durationDays;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Tour service rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueCatalog(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const applyClinicPlaybook = this.tryRescueApplyClinicPlaybook(
      prompt,
      action,
    );
    if (applyClinicPlaybook) return applyClinicPlaybook;

    const applyTourPlaybook = this.tryRescueApplyTourPlaybook(prompt, action);
    if (applyTourPlaybook) return applyTourPlaybook;

    const explainTourRecord = this.tryRescueExplainTourBookingRecord(
      prompt,
      action,
    );
    if (explainTourRecord) return explainTourRecord;

    const listDepartures = this.tryRescueListUpcomingTourDepartures(
      prompt,
      action,
    );
    if (listDepartures) return listDepartures;

    const explainCalendarSpan = this.tryRescueExplainTourCalendarSpan(
      prompt,
      action,
    );
    if (explainCalendarSpan) return explainCalendarSpan;

    const listCalendarWeek = this.tryRescueListTourCalendarWeek(prompt, action);
    if (listCalendarWeek) return listCalendarWeek;

    const explainTours = this.tryRescueExplainTourServices(prompt, action);
    if (explainTours) return explainTours;

    const explainClinic = this.tryRescueExplainClinicServices(prompt, action);
    if (explainClinic) return explainClinic;

    const tourService = this.tryRescueTourService(prompt, action);
    if (tourService) return tourService;

    const clinicService = this.tryRescueClinicService(prompt, action);
    if (clinicService) return clinicService;

    const packageLocalized = this.tryRescuePackageLocalizedNames(
      prompt,
      action,
    );
    if (packageLocalized) return packageLocalized;

    const rescued = rescueCatalogIntent(prompt, action);
    if (!rescued || rescued.action === action) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning: `Catalog command rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private disambiguateMisclassified(
    prompt: string,
    action: string,
    params: Record<string, any>,
    employees: Array<{ id: string; name: string }>,
    customers: Array<{ id: string; name: string }> = [],
    timeZone = 'UTC',
  ): IntentRescueResult | null {
    const scheduling = this.tryRescueScheduling(prompt, action, params);
    if (scheduling) return scheduling;
    const operations = this.tryRescueOperations(prompt, action, params);
    if (operations) return operations;

    const lower = prompt.toLowerCase();

    if (
      action === 'create_booking' &&
      /\b(reschedule|move|shift)\b/i.test(lower) &&
      /\bappointment\b/i.test(lower)
    ) {
      const rescuedParams = { ...params };
      applyBookingRescheduleActionHints(
        'reschedule_booking',
        rescuedParams,
        prompt,
        { employees, customers, timeZone },
      );
      return {
        action: 'reschedule_booking',
        params: rescuedParams,
        reasoning: 'Move/reschedule existing appointment — not a new booking.',
        rescued: true,
        rescueReason: 'create_booking_to_reschedule',
      };
    }

    const packageMultiFix = disambiguateStaffPackageMultiBooking(
      prompt,
      action,
    );
    if (packageMultiFix) {
      const rescuedParams = { ...params };
      applyPackageMultiServicePromptHints(
        packageMultiFix.action,
        rescuedParams,
        prompt,
        { employees, customers, timeZone },
      );
      return {
        action: packageMultiFix.action,
        params: rescuedParams,
        reasoning:
          packageMultiFix.action === 'create_package_booking'
            ? 'Staff-assisted package booking — not a single-service create_booking.'
            : 'Staff-assisted multi-service booking — not a single-service create_booking.',
        rescued: true,
        rescueReason: packageMultiFix.rescueReason,
      };
    }

    const giftCardPaymentsFix = disambiguateGiftCardPaymentsAction(
      prompt,
      action,
    );
    if (giftCardPaymentsFix) {
      const rescuedParams = { ...params };
      applyGiftCardPaymentsPromptHints(
        giftCardPaymentsFix.action,
        rescuedParams,
        prompt,
      );
      return {
        action: giftCardPaymentsFix.action,
        params: rescuedParams,
        reasoning: `Gift card / checkout rescue → ${giftCardPaymentsFix.action}`,
        rescued: true,
        rescueReason: giftCardPaymentsFix.rescueReason,
      };
    }

    for (const surface of ['dashboard', 'customer'] as const) {
      const availabilityFix = disambiguateMisclassifiedAvailabilityIntent(
        surface,
        prompt,
        action,
        params,
      );
      if (availabilityFix) {
        return {
          action: availabilityFix.action,
          params: availabilityFix.params ?? params,
          reasoning: `Availability disambiguation (${surface}) → ${availabilityFix.action}`,
          rescued: true,
          rescueReason: availabilityFix.rescueReason,
        };
      }
    }

    if (
      action === 'create_booking' &&
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt)
    ) {
      const rescuedParams = { ...params };
      enrichBookingTimeHintsFromPrompt('create_booking', rescuedParams, prompt);
      return {
        action: 'create_booking',
        params: rescuedParams,
        reasoning:
          'Check-then-book compound — flexible earliest slot, no fixed start time.',
        rescued: true,
        rescueReason: 'check_and_book_compound',
      };
    }

    if (
      (action === 'create_booking' || action === 'reschedule_booking') &&
      isFirstAvailableBookingPrompt(prompt)
    ) {
      const rescuedParams = { ...params };
      enrichBookingTimeHintsFromPrompt(action, rescuedParams, prompt);
      return {
        action,
        params: rescuedParams,
        reasoning:
          'Nearest/first available slot — no fixed start time required.',
        rescued: true,
        rescueReason: 'booking_first_available',
      };
    }

    if (
      action === 'show_appointments' &&
      /\b(book|schedule|reserve)\b/i.test(lower) &&
      !/\b(show|list|display|who)\b/i.test(lower)
    ) {
      return {
        action: 'create_booking',
        params,
        reasoning: 'Booking intent detected from prompt.',
        rescued: true,
        rescueReason: 'show_to_create_booking',
      };
    }

    if (
      action === 'list_bookings' &&
      /\b(most expensive|longest|shortest|earliest|latest)\b/i.test(lower)
    ) {
      return {
        action: 'analyze_appointments',
        params,
        reasoning: 'Analytics query — analyze appointments.',
        rescued: true,
        rescueReason: 'list_to_analyze_appointments',
      };
    }

    if (
      (action === 'list_bookings' ||
        action === 'show_appointments' ||
        action === 'summarize_day') &&
      isTotalEarningsPrompt(prompt)
    ) {
      return {
        action: 'summarize_bookings',
        params: { ...params, bookingMetric: 'revenue' },
        reasoning: 'Total earnings/revenue query — booking analytics.',
        rescued: true,
        rescueReason: 'list_to_total_earnings',
      };
    }

    if (
      (action === 'list_employees' ||
        action === 'list_bookings' ||
        action === 'show_appointments') &&
      isTopStaffRevenuePrompt(prompt)
    ) {
      return {
        action: 'summarize_staff',
        params: {
          ...params,
          staffMetric: 'most_revenue',
          limit: extractLimitFromPrompt(prompt),
        },
        reasoning: 'Specialist/provider revenue ranking query.',
        rescued: true,
        rescueReason: 'list_to_top_staff_revenue',
      };
    }

    const scheduleDisambiguation = disambiguateClearScheduleVsHideCalendar(
      prompt,
      action,
    );
    if (
      scheduleDisambiguation &&
      (scheduleDisambiguation.rescueReason !== 'read_to_clear_schedule' ||
        READ_ONLY_ACTIONS.has(action))
    ) {
      const rescuedParams = { ...params };
      applyScheduleOpsPromptHints(
        scheduleDisambiguation.action,
        rescuedParams,
        prompt,
        { employees, timeZone },
      );
      return {
        action: scheduleDisambiguation.action,
        params: rescuedParams,
        reasoning:
          scheduleDisambiguation.action === 'hide_appointments_from_calendar'
            ? 'Hiding appointments from calendar — not clearing applied schedule.'
            : 'Clear applied schedule operation detected.',
        rescued: true,
        rescueReason: scheduleDisambiguation.rescueReason,
      };
    }

    if (action === 'unknown') {
      return this.rescue({ prompt, action, params, employees });
    }

    return null;
  }

  private tryRescueNotificationDateFormat(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const notificationDate = rescueNotificationDateFormatIntent(prompt, action);
    if (!notificationDate) return null;

    const params: Record<string, unknown> = {};
    if (notificationDate.action === 'preview_notification_datetime') {
      params.messageKind = parseNotificationMessageKind(prompt);
    }
    if (notificationDate.action === 'notify_patient_result_ready') {
      Object.assign(params, parsePatientResultReadyParams(prompt, params));
    }
    return {
      action: notificationDate.action,
      params,
      reasoning: `Notification date format rescue → ${notificationDate.action}`,
      rescued: true,
      rescueReason: notificationDate.rescueReason,
    };
  }

  private tryRescueClinicTestResult(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueClinicTestResultIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'enter_test_result') {
      const parsed = parseEnterTestResultFromPrompt(prompt);
      if (parsed?.measurementCode)
        params.measurementCode = parsed.measurementCode;
      if (parsed?.value) params.value = parsed.value;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.resultId) params.resultId = parsed.resultId;
      if (parsed?.customerName) params.customerName = parsed.customerName;
    } else {
      const parsed = parseReleaseTestResultFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.resultId) params.resultId = parsed.resultId;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic test result rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClinicPatientChart(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueClinicPatientChartIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    const parsed = parseExplainPatientChartFromPrompt(prompt);
    if (parsed?.customerName) params.customerName = parsed.customerName;
    if (parsed?.customerId) params.customerId = parsed.customerId;

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic patient chart rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConsumerClinicTestResults(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConsumerClinicTestResultsIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'explain_result_status') {
      const parsed = parseExplainResultStatusFromPrompt(prompt);
      if (parsed?.status) params.status = parsed.status;
      if (parsed?.testName) params.testName = parsed.testName;
      if (parsed?.resultId) params.resultId = parsed.resultId;
    } else {
      const parsed = parseListMyTestResultsFromPrompt(prompt);
      if (parsed?.testName) params.testName = parsed.testName;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Consumer clinic test results rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderClinicCollection(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderClinicCollectionIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'mark_specimen_collected') {
      const parsed = parseMarkSpecimenCollectedFromPrompt(prompt);
      if (parsed?.specimenId) params.specimenId = parsed.specimenId;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.customerName) params.customerName = parsed.customerName;
    } else {
      const parsed = parseListMyCollectionQueueFromPrompt(prompt);
      if (parsed?.date) params.date = parsed.date;
      if (parsed?.dateFrom) params.dateFrom = parsed.dateFrom;
      if (parsed?.dateTo) params.dateTo = parsed.dateTo;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Provider clinic collection rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClinicCompound(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueClinicCompoundIntent(prompt, action);
    if (!rescued) return null;
    return {
      action: rescued.action,
      params: {},
      reasoning:
        'Clinic lab order + result notification compound — split into book/order then notify/explain.',
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueDashboardClinicLabBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueDashboardClinicLabBookingIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'push_lab_booking_to_patient') {
      const parsed = parsePushLabBookingFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.collectionServiceName) {
        params.collectionServiceName = parsed.collectionServiceName;
      }
    } else {
      const parsed = parseStaffBookLabCollectionFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.startTime) params.startTime = parsed.startTime;
      if (parsed?.employeeId) params.employeeId = parsed.employeeId;
      if (parsed?.employeeName) params.employeeName = parsed.employeeName;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Dashboard clinic lab booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueConsumerClinicLabBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueConsumerClinicLabBookingIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'book_lab_collection') {
      const parsed = parseBookLabCollectionFromPrompt(prompt);
      if (parsed?.orderId) params.orderId = parsed.orderId;
      if (parsed?.testName) params.testName = parsed.testName;
    } else {
      const parsed = parseListMyLabBookingRequestsFromPrompt(prompt);
      if (parsed?.orderId) params.orderId = parsed.orderId;
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Consumer clinic lab booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueProviderClinicLabBooking(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueProviderClinicLabBookingIntent(prompt, action);
    if (!rescued) return null;

    return {
      action: rescued.action,
      params: {},
      reasoning: `Provider clinic lab booking rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }

  private tryRescueClinicTestOrder(
    prompt: string,
    action: string,
  ): IntentRescueResult | null {
    const rescued = rescueClinicTestOrderIntent(prompt, action);
    if (!rescued) return null;

    const params: Record<string, unknown> = {};
    if (rescued.action === 'create_test_order') {
      const parsed = parseCreateTestOrderFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.bookingId) params.bookingId = parsed.bookingId;
      if (parsed?.testNames) params.testNames = parsed.testNames;
      if (parsed?.date) params.date = parsed.date;
    } else {
      const parsed = parseListTestOrdersFromPrompt(prompt);
      if (parsed?.customerName) params.customerName = parsed.customerName;
      if (parsed?.bookingId) params.bookingId = parsed.bookingId;
      if (parsed?.status) params.status = parsed.status;
      if (parsed?.date) params.date = parsed.date;
      if (parsed?.awaitingPatientBooking) {
        params.awaitingPatientBooking = true;
      }
    }

    return {
      action: rescued.action,
      params,
      reasoning: `Clinic test order rescue → ${rescued.action}`,
      rescued: true,
      rescueReason: rescued.rescueReason,
    };
  }
}
