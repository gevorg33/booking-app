import { Injectable, Logger } from '@nestjs/common';
import { DASHBOARD_CLASSIFIER_ACTION_UNION } from './ai-command-intent-schema.build.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import OpenAI from 'openai';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import {
  SchedulingSlot,
  SlotStatus,
} from '../schedule/entities/scheduling-slot.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import { AgentType } from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  CommandOrchestrationService,
  OrchestrationResult,
} from './command-orchestration.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  todayDisplay,
  toIsoDay,
  getTodayDateKey,
  parseDateInput,
  buildUtcStartTimeFromDayAndTime,
} from '../../common/utils/date-format.util.js';
import { timeToMinutes } from '../../common/utils/time-format.util.js';
import {
  pickTimezone,
  addDaysToDateKey,
} from '../../common/utils/timezone.util.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import { AiSchedulingService } from './ai-scheduling.service.js';
import { AiOperationsService } from './ai-operations.service.js';
import { AiBusinessCurrencyService } from './ai-business-currency.service.js';
import { AiBusinessLanguagesService } from './ai-business-languages.service.js';
import { AiBusinessDateFormatService } from './ai-business-date-format.service.js';
import { AiBusinessTaxService } from './ai-business-tax.service.js';
import { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import { AiClinicTestOrderService } from './ai-clinic-test-order.service.js';
import { AiClinicLabBookingService } from './ai-clinic-lab-booking.service.js';
import { DASHBOARD_CLINIC_LAB_BOOKING_CLASSIFIER_RULES } from './ai-clinic-lab-booking.fixtures.js';
import { AiClinicTestResultService } from './ai-clinic-test-result.service.js';
import { AiClinicPatientChartService } from './ai-clinic-patient-chart.service.js';
import { BUSINESS_COMPLIANCE_CLASSIFIER_RULES } from './ai-business-compliance.fixtures.js';
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
  parseOpenComplianceDashboardFromPrompt,
  parseExplainMinimumNecessaryPhiAccessFromPrompt,
  parseExplainPhiEncryptionStatusFromPrompt,
  parseListBreachIncidentsFromPrompt,
  parseReportDataBreachFromPrompt,
  parseSendBreachNotificationFromPrompt,
  parseViewPhiAccessAuditFromPrompt,
} from './ai-business-compliance.util.js';
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
import { applyCatalogNotifyPromptHints } from './ai-catalog-notify.util.js';
import { DASHBOARD_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES } from './ai-package-display-name.fixtures.js';
import { parsePackageDisplayNameExplainFromPrompt } from './ai-package-display-name.util.js';
import { parseBusinessLanguagesFromPrompt } from './ai-business-languages.util.js';
import { parseBusinessDateFormatFromPrompt } from './ai-business-date-format.util.js';
import { parseDateStringsFromPrompt } from './ai-date-input-format.util.js';
import {
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
} from './ai-business-tax.util.js';
import { parseConfigureStackedTaxRulesFromPrompt } from './ai-stacked-tax.util.js';
import { parseExplainStripeTaxChargeFromPrompt } from './ai-stripe-tax-charge.util.js';
import { STRIPE_TAX_CHARGE_CLASSIFIER_RULES } from './ai-stripe-tax-charge.fixtures.js';
import { LOOKUP_BOOKING_TAX_METADATA_CLASSIFIER_RULES } from './ai-lookup-booking-tax-metadata.fixtures.js';
import { parseLookupBookingTaxMetadataFromPrompt } from './ai-lookup-booking-tax-metadata.util.js';
import { QUOTE_STAFF_BOOKING_TAX_CLASSIFIER_RULES } from './ai-quote-staff-booking-tax.fixtures.js';
import { parseQuoteStaffBookingTaxFromPrompt } from './ai-quote-staff-booking-tax.util.js';
import { SUMMARIZE_CUSTOMER_TAX_PAID_CLASSIFIER_RULES } from './ai-summarize-customer-tax-paid.fixtures.js';
import { parseSummarizeCustomerTaxPaidFromPrompt } from './ai-summarize-customer-tax-paid.util.js';
import { parsePackageLocalizedNamesFromPrompt } from './ai-package-localized-names.util.js';
import { AiPackageLocalizedNamesService } from './ai-package-localized-names.service.js';
import { UPCOMING_TOUR_DEPARTURES_CLASSIFIER_RULES } from './ai-upcoming-tour-departures.fixtures.js';
import { TOUR_BOOKING_RECORD_CLASSIFIER_RULES } from './ai-tour-booking-record.fixtures.js';
import { TOUR_CALENDAR_SPAN_CLASSIFIER_RULES } from './ai-tour-calendar-span.fixtures.js';
import { TOUR_CALENDAR_WEEK_CLASSIFIER_RULES } from './ai-tour-calendar-week.fixtures.js';
import { parseListUpcomingTourDeparturesFromPrompt } from './ai-upcoming-tour-departures.util.js';
import { parseExplainTourBookingRecordFromPrompt } from './ai-tour-booking-record.util.js';
import { parseExplainTourCalendarSpanFromPrompt } from './ai-tour-calendar-span.util.js';
import { parseListTourCalendarWeekFromPrompt } from './ai-tour-calendar-week.util.js';
import { TOUR_SERVICE_CLASSIFIER_RULES } from './ai-tour-service.fixtures.js';
import { CLINIC_SERVICE_CLASSIFIER_RULES } from './ai-clinic-service.fixtures.js';
import {
  parseConfigureTourServiceFromPrompt,
  parseExplainTourServicesFromPrompt,
} from './ai-tour-service.util.js';
import {
  parseConfigureClinicServiceFromPrompt,
  parseExplainClinicServicesFromPrompt,
} from './ai-clinic-service.util.js';
import { AiTourServiceService } from './ai-tour-service.service.js';
import { AiClinicServiceService } from './ai-clinic-service.service.js';
import { AiRecommendationProductService } from './ai-recommendation-product.service.js';
import { RECOMMENDATION_ANALYTICS_CLASSIFIER_RULES } from './ai-recommendation-analytics.fixtures.js';
import { RECOMMENDATION_PERFORMANCE_CLASSIFIER_RULES } from './ai-recommendation-performance.fixtures.js';
import { RECOMMENDATION_PRODUCT_CLASSIFIER_RULES } from './ai-recommendation-product.fixtures.js';
import { parseExplainRecommendationAnalyticsFromPrompt } from './ai-recommendation-analytics.util.js';
import { parseSummarizeRecommendationPerformanceFromPrompt } from './ai-recommendation-performance.util.js';
import {
  parseConfigureRecommendationProductFromPrompt,
  parseExplainRecommendationSetupFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
} from './ai-recommendation-product.util.js';
import { parseCurrencyFromPrompt } from './ai-business-currency.util.js';
import { AiPlatformService } from './ai-platform.service.js';
import { AiProviderTimeOffService } from './ai-provider-time-off.service.js';
import { DASHBOARD_TIME_OFF_CLASSIFIER_RULES } from '../provider-mobile/provider-time-off.fixtures.js';
import { AiCatalogService } from './ai-catalog.service.js';
import { AiBookingDepthService } from './ai-booking-depth.service.js';
import { AiCustomerCrmService } from './ai-customer-crm.service.js';
import { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiRetailFinanceService } from './ai-retail-finance.service.js';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import {
  filterSlotsByTimeOfDay,
  type TimeOfDayWindow,
  formatTimeOfDayLabel,
  isNoShowRecoveryPrompt,
  parseTimeOfDayWindow,
} from './ai-operations.util.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import {
  resolveEmployees,
  resolveDateRange,
  resolveAutoExecute,
  fuzzyMatchServiceByName,
  getEmployeeServices,
  hasExplicitTimeWindow,
  isProviderOwnServicesPrompt,
  parseTimeWindow,
  filterBookingsByTimeConstraints,
  isClearSchedulePrompt,
  matchEmployeesInPrompt,
  sanitizeProviderScopeFromPrompt,
  inferDirectSchedulePeriods,
  resolveServicesFromCatalogParams,
  enrichListServicesParamsFromPrompt,
} from './ai-orchestration.helpers.js';
import { BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES } from './ai-budget-service-discovery.fixtures.js';
import {
  enrichDiscoveryParamsFromPrompt,
  enrichServiceDiscoveryFromPrompt,
} from './ai-service-discovery-enrichment.util.js';
import {
  enrichDashboardCreateBookingParams,
  findDashboardFirstAvailableAcrossWindows,
  findEarliestSlotOnDayForProviders,
  resolveDashboardCreateBookingService,
  shouldScanExplicitAvailabilityWindows,
  buildDashboardFirstAvailableWindowQueries,
} from './ai-dashboard-create-booking.logic.js';
import {
  enrichDashboardLookupAssignmentParams,
  formatLookupAssignmentDiscoveryNote,
  resolveLookupAssignmentService,
} from './ai-dashboard-lookup-assignment.logic.js';
import { extractServiceRankMetadata } from '../../common/utils/service-rank-metadata.util.js';
import { loadServiceBookingCounts90d } from '../../common/utils/service-booking-popularity.util.js';
import { composeDashboardListServicesBudgetResponse } from './ai-budget-list-services.logic.js';
import {
  buildRankEmptyCategorySummary,
  composeDashboardListServicesRankResponse,
  resolveListServicesRankLimitFromPrompt,
} from './ai-rank-list-services.logic.js';
import { resolveServiceRankParam } from './ai-service-rank-discovery.util.js';
import { isWallClockSlotBookable } from '../../common/utils/timezone.util.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { resolveAssignEmployeeServicesInput } from './ai-category-assignment.util.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { shouldValidateAction } from './command-completion.validator.js';
import { CommandResult } from './command-completion.types.js';
import { buildUnwiredDashboardIntentResult } from './ai-command-unwired-intent.util.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiEventsService } from './ai-events.service.js';
import { recordMisrouteTelemetry } from './ai-misroute-telemetry.util.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  CustomerService,
  type CustomerInsightMetric,
} from '../customer/customer.service.js';
import {
  extractServiceFromPrompt,
  extractCustomerFromBookingPrompt,
  isTeamWideProviderAvailabilityQuery,
  matchEntityInPrompt,
  resolveCustomerMetric,
  resolveAppointmentMetric,
  resolveBookingMetric,
  resolveServiceMetric,
  resolveStaffMetric,
  extractLimitFromPrompt,
  isBulkAllAppointmentsPrompt,
  normalizeBookingStatusValue,
  normalizePaymentStatusValue,
  extractBookingStatusFromPrompt,
  extractPaymentStatusFromPrompt,
  type ServiceInsightMetric,
  type StaffInsightMetric,
} from './ai-intent-heuristics.js';
import { CLASSIFIER_MULTILINGUAL_RULES } from './ai-prompt-i18n.js';
import {
  AiPromptNormalizationService,
  type PromptNormalizationResult,
} from './ai-prompt-normalization.service.js';
import { BookingCommandGraphService } from './booking-command-graph.service.js';
import { BookingSlotResolverService } from '../booking/booking-slot-resolver.service.js';
import {
  CommandComplexityRouterService,
  type ComplexityRoute,
} from './command-complexity-router.service.js';
import { AiIntelligenceService } from './ai-intelligence.service.js';
import {
  appendMultilingualClassifierContext,
  buildClassifierCatalogContext,
  resolveMergedComplexityRoute,
  resolveParsedIntent,
  runParallelRouteAndClassification,
  type ClassifiedIntent,
} from './ai-command-routing.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { AiPromptSecurityService } from './ai-prompt-security.service.js';
import {
  clampReadDateRangeDays,
  MAX_AI_CUSTOMER_ROWS,
  MAX_AI_LIST_BOOKINGS,
  MAX_AI_READ_DATE_RANGE_DAYS,
} from './ai-prompt-security.util.js';
import { isIntentAllowed, normalizeActorRole } from './ai-capability.matrix.js';
import { applyEntityMemoryToParams } from './ai-entity-memory.util.js';
import {
  buildIntelligenceClassifierAppendix,
  extractIntelligenceBlocks,
  stripIntelligenceKeysFromSessionContext,
} from './ai-intelligence-context.util.js';
import { isDashboardAiIntentAllowedByPlan } from '../billing/plan-dashboard-ai-intents.util.js';
import type { PlanTierId } from '../billing/plan-limits.js';
import {
  buildExecutionConfirmationResult,
  isExecutionConfirmed,
} from './ai-execution-confirm.util.js';
import { CHECK_AND_BOOK_CLASSIFIER_RULES } from './ai-check-and-book.fixtures.js';
import { CLINIC_TEST_ORDER_CLASSIFIER_RULES } from './ai-clinic-test-order.fixtures.js';
import { CLINIC_TEST_RESULT_CLASSIFIER_RULES } from './ai-clinic-test-result.fixtures.js';
import { CLINIC_PATIENT_CHART_CLASSIFIER_RULES } from './ai-clinic-patient-chart.fixtures.js';
import { DASHBOARD_PACKAGE_MULTI_CLASSIFIER_RULES } from './ai-package-multi-service.fixtures.js';
import { GIFT_CARD_PAYMENTS_CLASSIFIER_RULES } from './ai-gift-card-payments.fixtures.js';
import { DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES } from './ai-intent-disambiguation.fixtures.js';
import { DASHBOARD_FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES } from './ai-flexible-availability.fixtures.js';
import { DASHBOARD_SUMMARIZE_BOOKINGS_CURRENCY_CLASSIFIER_RULES } from './ai-dashboard-summarize-bookings.fixtures.js';
import {
  composeSummarizeBookingsResult,
} from './ai-dashboard-summarize-bookings.logic.js';
import {
  STAFF_OPERATIONS_CLASSIFIER_RULES,
  STAFF_OPERATIONS_MULTILINGUAL_CLASSIFIER_RULES,
} from './ai-staff-operations.util.js';
import { PROVIDER_ONBOARDING_COMPOUND_CLASSIFIER_RULES } from './ai-provider-onboarding-compound.util.js';
import { CLINIC_LAB_DAY_CLOSE_CLASSIFIER_RULES } from './ai-clinic-lab-day-close-compound.util.js';
import { BUDGET_DISCOVER_AND_BOOK_CLASSIFIER_RULES } from './ai-budget-discover-and-book-compound.util.js';
import { RANK_DISCOVER_AND_BOOK_CLASSIFIER_RULES } from './ai-rank-discover-and-book-compound.util.js';
import {
  WAITLIST_DASHBOARD_CLASSIFIER_RULES,
  WAITLIST_DASHBOARD_MULTILINGUAL_CLASSIFIER_RULES,
  enrichOfferWaitlistSlotParams,
} from './ai-waitlist-dashboard.util.js';
import { CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES } from './ai-clinic-test-result-ext.util.js';
import {
  BILLING_LOYALTY_DASHBOARD_CLASSIFIER_RULES,
  BILLING_LOYALTY_MULTILINGUAL_CLASSIFIER_RULES,
} from './ai-billing-loyalty-dashboard.util.js';
import {
  buildDashboardAvailabilityWindowLabel,
  buildSingleWindowCheckParams,
  dashboardAvailabilityTodayKey,
  enrichDashboardCheckAvailabilityParams,
  resolveDashboardCheckAvailabilityWindows,
  shouldGroupDashboardAvailabilityByWindow,
} from './ai-dashboard-availability-windows.logic.js';
import {
  handleListWaitlistEntriesLogic,
  handleOfferWaitlistSlotLogic,
} from './ai-waitlist-dashboard.logic.js';
import { enrichCompoundSubStepBookingHints } from './ai-compound-booking-hints.util.js';
import {
  applyBookingRescheduleActionHints,
  buildRescheduleFirstAvailableNoSlotMessage,
  resolveFirstAvailableNotBeforeTime,
} from './ai-booking-reschedule-hints.util.js';
import {
  applyScheduleOpsPromptHints,
  enrichCompoundSubStepScheduleHints,
} from './ai-schedule-ops-hints.util.js';
import {
  applyPackageMultiServicePromptHints,
  enrichCompoundSubStepPackageMultiHints,
} from './ai-package-multi-service-hints.util.js';
import {
  applyGiftCardPaymentsPromptHints,
  enrichCompoundSubStepGiftCardPaymentsHints,
} from './ai-gift-card-payments-hints.util.js';

export type { CommandResult };

interface ParsedServiceDraft {
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency: string;
}

const INTENT_SCHEMA = `You are the Orchestrix operational AI — the sole intent classifier for this system (no heuristic fallback).
Given a user's natural-language command and the available business data, classify the intent
and extract structured parameters. Return a JSON object with:

{
  "action": ${DASHBOARD_CLASSIFIER_ACTION_UNION},
  "params": {
    "employeeName": "string or null — one service provider",
    "employeeNames": ["string"] or null — multiple providers,
    "providerFallbackNames": ["string"] or null — ordered provider preference for conditional booking (try Gevorg, then Mary, then whoever is free),
    "fallbackAnyProvider": boolean or null — true when the last fallback is any available provider at the fixed time,
    "allProviders": boolean or null — true when user says all providers/everyone/all staff/any provider,
    "bookingFirstAvailable": boolean or null — true when user wants the earliest open bookable slot (first available, next available, ASAP),
    "templateName": "string or null — schedule template name for apply_schedule",
    "customerName": "string or null",
    "serviceName": "string or null — single service (for create_booking or create_service name)",
    "serviceNames": ["string"] or null — one or more service types to filter (for cancel_bookings / list_bookings), e.g. ["hairdrying", "hairstyle"],
    "services": [
      {
        "serviceName": "string",
        "durationMinutes": number,
        "price": number,
        "description": "string or null",
        "bufferMinutes": number or null,
        "currency": "string or null"
      }
    ] or null — for create_services (bulk add to catalog), one object per new service,
    "description": "string or null — service description (create_service) or booking description",
    "durationMinutes": number or null — service duration in minutes (create_service), minimum 10,
    "bufferMinutes": number or null — buffer after service in minutes (create_service), default 0,
    "price": number or null — service price (create_service), e.g. 50 or 29.99,
    "maxPrice": number or null — inclusive catalog display-price ceiling for list_services when the user states a budget (under $X, I have $X),
    "serviceRank": "highest_price" | "lowest_price" | "most_popular" | null — rank catalog services for list_services or check_availability when user asks premium/cheapest/popular service (not specialist ratings),
    "availabilityWindows": [{"date":"DD/MM/YYYY or tomorrow","weekdays":["monday"],"timeOfDay":"morning|afternoon|evening","timeFrom":"HH:MM","timeSlot":"HH:MM"}] or null — OR alternatives for check_availability / create_booking with bookingFirstAvailable,
    "serviceCategory": "string or null — keyword to filter service type names for list_services (e.g. haircut, massage)",
    "currency": "string or null — ISO currency code (create_service), default USD",
    "date": "DD/MM/YYYY or null — for reschedule_booking: the NEW destination date (tomorrow, Friday, 31/05/2026). For other actions: the date referenced.",
    "dateFrom": "DD/MM/YYYY or null — start of range if a range is mentioned",
    "dateTo": "DD/MM/YYYY or null — end of range",
    "fromDate": "DD/MM/YYYY or null — for reschedule_booking only: current appointment date when identifying which booking to move",
    "fromTimeSlot": "HH:MM or null — for reschedule_booking only: current appointment start time when identifying which booking to move",
    "reason": "string or null — reason given for cancellation or note",
    "notes": "string or null — booking notes or description",
    "timeSlot": "HH:MM in 24h format or null — appointment start time (e.g. 09:00, 14:30)",
    "timeOfDay": "morning | afternoon | evening | null — time-of-day window for availability or flexible booking (tonight = evening)",
    "timeFrom": "HH:MM or null — start of a daily time window (fill/optimize, or cancel/list/hide when a range is given, e.g. 16:30); also earliest hour for bookingFirstAvailable (e.g. after 16:00)",
    "timeTo": "HH:MM or null — end of that window (e.g. 17:30 for 'between 16:30-17:30')",
    "blockFullDay": boolean or null — true when blocking entire day(s),
    "weeksCount": number or null — repeat weeks for repetitive blocks,
    "skipHolidays": boolean or null — skip business holiday dates when propagating blocks,
    "holidayDates": ["YYYY-MM-DD"] or null — explicit holidays to skip or close,
    "closeDates": ["YYYY-MM-DD"] or null — full-day closure dates for holiday_mode,
    "swapWithEmployeeName": "string or null — second provider for swap_schedules",
    "fromEmployeeName": "string or null — source provider for rebalance_capacity",
    "toEmployeeName": "string or null — target provider for rebalance_capacity",
    "slotCount": number or null — how many appointments/slots to move for rebalance_capacity,
    "extendDate": "DD/MM/YYYY or null — day before closure to extend hours (holiday_mode)",
    "extendTimeFrom": "HH:MM or null — extended open time on extendDate",
    "extendTimeTo": "HH:MM or null — extended close time on extendDate",
    "applyDays": [0-6] or null — weekdays (0=Sun) for template apply or repetitive blocks,
    "repeatWeeksCount": number or null — template apply repeat weeks,
    "periods": [{"startTime":"HH:MM","endTime":"HH:MM","type":"service_block|unavailable_block","serviceNames":["string"],"label":"string"}] or null — for create_direct_schedule,
    "bookingId": "string or null — if a specific booking ID is mentioned",
    "customerMetric": "most_no_shows | most_bookings | most_cancellations | at_risk | high_no_show | vip | top_spenders | new_customers | overview | null — for summarize_customers",
    "appointmentMetric": "most_expensive | longest | shortest | earliest | latest | null — for analyze_appointments",
    "bookingMetric": "count | revenue | busiest_provider | cancelled | no_shows | unpaid | upcoming | confirmed | pending | completed | overview | null — for summarize_bookings",
    "statusFilter": "cancelled | no_show | confirmed | pending | completed | in_progress | null — filter appointments by status",
    "statusFilters": ["cancelled", "no_show", "completed"] or null — multiple statuses for hide/list filters,
    "serviceMetric": "most_booked | top_revenue | least_booked | overview | null — for analyze_services",
    "staffMetric": "busiest | most_revenue | most_bookings | overview | null — for summarize_staff",
    "assignmentLookup": "providers_for_service | services_for_provider | null — for lookup_service_assignment",
    "limit": number or null — max rows to list (default 5),
    "status": "completed | in_progress | no_show | confirmed | pending | cancelled | null — for update_bookings",
    "paymentStatus": "paid | pending | refunded | not_applicable | null — for update_bookings",
    "allAppointments": boolean or null — true when user says all/every/any appointment(s) for the day (do NOT set serviceName/serviceNames)
  },
  "reasoning": "one sentence explaining your interpretation",
  "confidence": number from 0.0 to 1.0 — how certain you are about action and extracted params
}

Rules:
- Always resolve relative dates (today, tomorrow, next Monday, etc.) from the provided current date.
- If the user says "all appointments" or "all bookings", set allAppointments=true and leave serviceName/serviceNames null — match every service for that provider/day.
- Extract names exactly as mentioned. The system will fuzzy-match them to real entities.
- For cancel_bookings, filter by service type ONLY when the user explicitly names a service in this message — use serviceNames. Do NOT inherit service from prior conversation when allAppointments=true.
- cancel_bookings can combine employeeName + serviceNames + date to cancel only matching appointments.
- cancel_bookings with a time range (e.g. "between 16:30-17:30", "from 9 to 11") must set timeFrom and timeTo (HH:MM 24h). Only appointments that overlap that window on the given date(s) are cancelled. Use timeSlot only for a single start time (e.g. "at 16:00").
- If the user mentions a reason/note for cancellation (e.g. "he is sick", "with a reason that he is sick"), put it in "reason".
- cancel_bookings with a reason or when the user asks to notify/message/whatsapp customers should notify customers after cancelling (includes cancellation reason in WhatsApp/SMS/email).
- hide_appointments_from_calendar: hide matching appointments from the schedule calendar WITHOUT deleting or cancelling them. Use for hide/remove/clear/delete from calendar. Filter by status, employeeName/allProviders, date/dateFrom/dateTo, serviceName, timeSlot, customerName, limit.
- unhide_appointments_from_calendar: restore previously hidden appointments back onto the schedule calendar. Use for unhide/restore/show back on calendar/bring back to schedule. Same filters as hide. Only affects appointments already marked hidden.
- Example unhide: "Unhide all hidden cancelled appointments for Gevorg today" → unhide_appointments_from_calendar with statusFilter cancelled, employeeName, date.
- Example unhide: "Restore hidden done appointments for all providers this week on the calendar" → unhide_appointments_from_calendar with statusFilter completed, allProviders, dateFrom/dateTo.
- For new appointments (book, schedule, create appointment), use action "create_booking".
- create_booking requires serviceName at minimum. Normally also employeeName, date, and timeSlot. Leave customerName null for walk-in unless the user explicitly names a client (e.g. "for customer Maria", "book facemassage for John") — never set customerName to the provider/employee name or to the dashboard user.
- "Book first available {service} on any provider" → create_booking with serviceName, allProviders=true, bookingFirstAvailable=true, employeeName=null, timeSlot=null, date=today if omitted. The system picks the earliest open slot across providers.
- Conditional fallback at a fixed time: "Book {service} on Gevorg tomorrow at 9; if not available then Mary at 9; if not then whoever is free" → create_booking with serviceName, date, timeSlot="09:00", providerFallbackNames=["Gevorg ...", "Mary ..."], fallbackAnyProvider=true. Do NOT use bookingFirstAvailable for this pattern — keep the fixed timeSlot.
- "Book the nearest time slot for {service} on any specialist" / "nearest available" / "soonest slot" / "next available appointment" / "ASAP" → same as first available (bookingFirstAvailable=true). Leave timeSlot null. For a named specialist only, set employeeName and bookingFirstAvailable=true without allProviders. Optional lower bound: "after 16:00" → set timeFrom="16:00" (earliest slot must be after current time and after that hour). Set timeOfDay for morning/afternoon/evening/tonight.
- bookingFirstAvailable without allProviders: pick earliest open slot for the named provider only. allProviders without bookingFirstAvailable still requires timeSlot unless the user gives one.
- Dashboard staff simulating customer checkout: check_providers_for_service + book_nearest_slot compound prompts are decomposed automatically before classification — if you must classify a single intent from combined wording, use create_booking with bookingFirstAvailable=true, allProviders=true, timeSlot=null, never a bare create_booking missing start time.
- For adding a new service type to the catalog (add service, create service, new offering), use action "create_service" for ONE service, or "create_services" for TWO OR MORE.
- create_service requires serviceName, durationMinutes, and price at minimum. Extract duration from phrases like "60 minutes" or "1 hour" (60). Extract price from "$50", "50 USD", etc.
- create_services requires a "services" array — each entry needs serviceName, durationMinutes, and price. Use when the user lists multiple services, paste a menu, or says "add these services".
- Example bulk: "Add services: facemassage 60min $50, haircut 30min $25, manicure 45min $40" → action create_services with services=[{serviceName:"facemassage",durationMinutes:60,price:50}, ...].
- Do not use create_service when booking an appointment — that is create_booking.
- bulk_create_catalog: create a category AND multiple services in one command (e.g. "Create category Hair with Women's cut 60m $65, Men's cut 30m $35").
- create_service_category: add a single category; optional placeholderCount for stub services.
- create_package / update_package / deactivate_package / duplicate_package: service package CRUD (NOT package visit booking — use create_package_booking for appointments).
- create_subscription_plan / update_subscription_plan / deactivate_subscription_plan: membership plan CRUD for a service.
- assign_subscription_to_customer: admin enrolls a customer on a plan (customerName + planName).
- configure_gift_card_products: enable presets and purchasable service cards (presetAmounts, serviceName).
- create_gift_card_bundle: bundle multiple services as a gift card product (bundleName + serviceNames).
- configure_multi_service_settings: enable multi-service booking limits (maxServiceCount, maxDurationMinutes).
- configure_tour_service: enable tour mode and set tour metadata on one service (maxGroupSize, difficulty, durationDays, meetingPoint, coverImage, includedItems). "Mark City Tour as a tour with max 12 people" → serviceName, enableTour, maxGroupSize. NOT create_service or configure_multi_service_settings.
- explain_tour_services: READ-ONLY — list tour catalog services (group sizes, cover images) and upcoming tour bookings with pax / tourStartDate–tourEndDate. Optional serviceName filter and daysAhead. NOT configure_tour_service (mutate), NOT explain_tour_booking_record (one booking's stored metadata), or list_bookings (all appointment types).
- explain_tour_booking_record: READ-ONLY — explain one tour booking's paxCount, tourStartDate, tourEndDate, specialRequirements, and provider calendar multi-day span (vert-tour-1.10). Optional bookingId or customerName. NOT explain_tour_services (catalog/upcoming list), NOT explain_tour_calendar_span (general calendar UI), NOT list_bookings (all types), NOT explain_booking_policy (cancellation/deposit).
- explain_tour_calendar_span: READ-ONLY — explain vert-tour-1.10 provider calendar rendering: multi-day spans, service colors, clipped weeks, stacked departure lanes. Optional serviceName or weekStartDate. NOT explain_tour_booking_record (one booking metadata), NOT list_tour_calendar_week, NOT list_upcoming_tour_departures, NOT explain_tour_services (catalog list).
- list_tour_calendar_week: READ-ONLY — summarize confirmed tour departures visible on a provider calendar week (dates, pax, service). Optional employeeName, serviceName, weekStartDate. NOT explain_tour_calendar_span, NOT list_upcoming_tour_departures, NOT show_appointments, NOT explain_tour_services.
- list_upcoming_tour_departures: READ-ONLY — summarize confirmed tour bookings grouped by departure date with booked pax and remaining capacity (max group − booked pax). Optional serviceName and daysAhead. NOT explain_tour_services (catalog metadata or per-guest booking lines), NOT explain_tour_calendar_span, NOT list_tour_calendar_week, NOT list_bookings (all appointment types).
- apply_tour_playbook: MUTATE — tour_operator shortcut to seed tour vertical playbook catalog (Day/Multi-Day/Private tours) and Tour operating hours 08:00–18:00 schedule. "Apply tour playbook" / "Set up tour operator starter catalog and schedule". NOT bulk_create_catalog or apply_schedule.
- configure_clinic_service: MUTATE — set clinic metadata on one catalog service (serviceType=consultation|lab_test|procedure, requiresFasting, preparationNotes). "Mark CBC as a lab test requiring fasting" → serviceName, serviceType=lab_test, requiresFasting=true. NOT create_service, NOT create_test_order (patient lab order), NOT explain_clinic_services (read list).
- explain_clinic_services: READ-ONLY — summarize clinic catalog: departments, consultation vs lab_test vs procedure counts, fasting requirements. Optional serviceName filter. NOT configure_clinic_service (mutate), NOT explain_clinic_booking (consumer checkout fields), NOT list_services (general catalog).
- apply_clinic_playbook: MUTATE — clinic|polyclinic|beauty_clinic|dental shortcut to seed clinic vertical playbook catalog and clinic operating hours schedule. "Apply clinic playbook" / "Set up polyclinic starter catalog and schedule". NOT bulk_create_catalog or apply_schedule.
- set_service_compatibility: block two services from same visit (incompatibleServiceNames).
- deactivate_service: hide a service from public catalog (NOT deactivate_package).
- list_packages / list_subscription_plans: READ-ONLY catalog monetization lists.
- list_customer_subscriptions / subscription_usage_history / list_customer_gift_cards / list_customer_bookings / customer_no_show_history: READ-ONLY customer 360 (requires customerName).
- extend_subscription / cancel_subscription_admin / tag_customer / merge_customers / export_customer_data / delete_customer_data / send_reengagement_message: dashboard CRM mutations.
- my_appointments / my_subscriptions / my_gift_cards / subscription_usage / my_profile: signed-in customer account (session customerId).
- request_gift_card_cancel / request_gift_card_modify / track_physical_gift_card_order / privacy_export / privacy_delete: customer self-service.
- discover_packages / discover_subscription_plans / discover_gift_card_products: public catalog discovery (not admin CRUD).
- list_scheduling_resources / create_resource / update_resource / deactivate_resource / assign_resource_hours / list_resource_conflicts / explain_resource_conflict: scheduling resource CRUD and conflict checks (gap-8.2).
- configure_multi_service_scheduling_mode: set same_visit vs per_service scheduling (not full multi-service limits — use configure_multi_service_settings).
- my_resource_assignments / block_resource_unavailable: provider resource views and marking a room/chair unavailable.
- check_multi_service_block_availability / check_package_line_availability / earliest_slot_all_services / providers_available_later_days / explain_why_no_slots: customer multi-service and package availability (serviceNames or serviceIds, packageId).
- summarize_unpaid / configure_cash_payments / validate_gift_card / adjust_gift_card_balance / extend_gift_card_expiry / refund_gift_card_order / export_accounting / export_commissions / explain_checkout_total / list_subscription_revenue: payments, gift cards, and accounting (Sprint 30).
- list_products / create_product / link_product_to_service / adjust_inventory / add_retail_sale_to_booking / remove_retail_line / record_expense / list_expenses / summarize_pl / commission_report / payout_export: inventory, retail POS, and finance (Sprint 33).
- configure_recommendation_product: MUTATE — create or update a post-checkout recommendation product (name, description, imageUrl, externalLink, retailPrice). "Add a shampoo product for post-checkout with image and link" → productName, wantsImage, wantsLink. NOT create_product (retail SKU/stock), NOT link_recommended_products (service/category links).
- link_recommended_products: MUTATE — attach existing products to a service or category for post-checkout recommendations. "Recommend shampoo and conditioner after haircut service" → productNames, serviceName. NOT link_product_to_service (inventory consumption), NOT configure_recommendation_product (create product).
- explain_recommendation_setup: READ — summarize max checkout product count, active catalog products, and linked products per service/category. "Explain recommendation setup" or "Which products are linked for post-checkout recommendations?" Optional serviceName or categoryName filter. NOT link_recommended_products (mutate), NOT list_products (retail inventory).
- explain_recommendation_analytics: READ — explain product_recommendation.shown impressions and product_recommendation.clicked shop-link clicks with top products and web_checkout vs consumer_app surfaces. Optional daysAhead. NOT explain_recommendation_setup (configuration), NOT summarize_recommendation_performance (CTR summary).
- summarize_recommendation_performance: READ — summarize checkout recommendation CTR (overall, by product, by booked service) and bookings with recommendation cards shown from product_recommendation events. Optional daysAhead and surface. NOT explain_recommendation_analytics (raw counts), NOT explain_recommendation_setup (configuration).
- configure_business_date_format: MUTATE — set business dateFormat (DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD) and/or timeFormat (24h | 12h). "Use US date format", "Switch to 12-hour time", "Set ISO dates for our salon". NOT explain_business_date_format (read-only status).
- explain_business_date_format: READ — explain current salon date/time format and show examples of today's date in each supported date format plus a sample time display. NOT configure_business_date_format (mutate) and NOT explain_booking_date_format (customer booking page).
- preview_business_date_format: READ — preview sample booking date/time in current vs alternate dateFormat/timeFormat before saving settings. NOT configure_business_date_format (mutate) and NOT explain_business_date_format (status only).
- audit_dashboard_date_surfaces: READ — list dashboard pages/components still using locale/toLocaleString vs business format cache (deferred fmt-1.6 sweep). NOT migrate_dashboard_date_display (mutate sweep).
- migrate_dashboard_date_display: MUTATE — guided sweep checklist to replace deferred toLocaleString/Intl calls with formatDateDisplay/formatTimeDisplay. NOT audit_dashboard_date_surfaces (inventory).
- explain_notification_date_format: READ — how confirmation/reminder/gift-card emails and WhatsApp format dates vs dashboard (same business dateFormat/timeFormat). NOT explain_notification_currency (amount symbol) and NOT explain_business_date_format (settings without notification channels).
- preview_notification_datetime: READ — sample confirmation/reminder/gift-card email or WhatsApp line with current business date/time format. NOT preview_business_date_format (alternate format before saving).
- notify_patient_result_ready: MUTATE — clinic result-ready email/WhatsApp (vert-clinic-1.7) using formatResultReadyNotificationWhen. NOT preview_notification_datetime (read-only sample).
- create_test_order: MUTATE — clinic only: order catalog lab tests/panels for a patient visit. Requires customerName or bookingId and testNames. NOT create_booking and NOT list_test_orders.
- create_catalog_test_order: alias of create_test_order — same params and handler.
- list_test_orders: READ — clinic only: list lab test orders by patient, visit date, or status. Use awaitingPatientBooking=true when prompt asks for orders awaiting patient self-booking. NOT list_bookings and NOT create_test_order.
- push_lab_booking_to_patient: MUTATE — clinic only: push lab collection self-booking link to patient for existing lab order. NOT create_booking and NOT staff_book_lab_collection.
- staff_book_lab_collection: MUTATE — clinic only: staff books collection slot linked to lab order. NOT push_lab_booking_to_patient and NOT create_booking without lab order.
- enter_test_result: MUTATE — clinic only: record manual lab measurement value on an order/result (WBC, glucose, etc.). Requires measurementCode, value, orderId or resultId. NOT create_test_order and NOT release_test_result.
- release_test_result: MUTATE — clinic only: release reviewed lab results to the patient chart. Optional customerName, orderId, resultId. NOT notify_patient_result_ready (notification) and NOT enter_test_result.
- explain_patient_chart: READ — clinic only: summarize patient chart — allergies, recent visits, pending lab results/orders. Requires customerName or customerId. NOT lookup_customer (CRM profile), NOT list_test_orders (lab queue), NOT list_bookings (all appointments).
- explain_date_input_format: READ — how typed dashboard date fields parse slash input using business dateFormat vs calendar picker ISO selection. NOT preview_date_input_parse (sample parse) and NOT explain_business_date_format (display settings).
- preview_date_input_parse: READ — preview typed date strings → ISO calendar day under current dateFormat (DD/MM vs MM/DD). Optional dateStrings. NOT explain_date_input_format (rules) and NOT preview_business_date_format (booking display).
- configure_business_tax: MUTATE — set business.settings.tax enabled, name (VAT/GST), rate percent, and inclusive/exclusive pricing model. "Enable 20% VAT", "Switch to tax-inclusive pricing", "Set our GST rate to 5%". NOT explain_business_tax (read-only), NOT configure_stacked_tax_rules (parallel rules), and NOT set_service_tax_rate (per-service).
- set_service_tax_rate: MUTATE — set service.metadata.taxRatePercent override (0 = tax-exempt). "Make massage services tax-exempt", "Apply 10% tax to medical consultations only". NOT configure_business_tax (salon-wide) and NOT explain_business_tax (read-only).
- configure_stacked_tax_rules: MUTATE — add, stack, or remove parallel tax rules in business.settings.tax.rules (GST + PST, federal + state). "Add 5% GST and 8% PST", "Remove the state tax rule". NOT configure_business_tax (single rate) and NOT explain_stacked_tax (read-only).
- explain_business_tax: READ — current tax name, rate, inclusive/exclusive model, tax number; example breakdown on a sample price. NOT configure_business_tax, NOT set_service_tax_rate, and NOT explain_stacked_tax.
- explain_stacked_tax: READ — list each stacked rule, combined effective rate, per-rule breakdown on a sample price. NOT explain_business_tax (single-rate) and NOT configure_stacked_tax_rules.
- quote_staff_booking_tax: READ — preview tax on a catalog service before staff creates a booking; explain stacked rules vs per-service override. Optional serviceName and sample price. NOT set_service_tax_rate (mutate) and NOT explain_stacked_tax (rules list without a service).
- summarize_customer_tax_paid: READ — total tax paid across a customer's paid appointment history from metadata.pricing.taxAmount. Requires customerName. NOT lookup_customer (general profile) and NOT summarize_customers (rankings).
- lookup_booking_tax_metadata: READ — retrieve frozen metadata.pricing tax fields from a booking after Stripe checkout (disputes/receipts). Optional bookingId or customerName. NOT explain_stripe_tax_charge (why charged) and NOT explain_appointment_tax (provider breakdown).
- explain_stripe_tax_charge: READ — why Stripe charged a booking amount using frozen metadata.pricing tax fields (inclusive gross vs exclusive net+tax). Optional bookingId or customerName. NOT explain_stripe_checkout_currency (ISO currency) and NOT explain_checkout_tax (booking page settings).
- configure_privacy_retention: MUTATE — set business.settings.privacy retention days and cookie banner on the booking page. "Keep customer data for 3 years", "Enable cookie banner on our booking page". NOT configure_granular_consent (AI/integration consent), NOT explain_compliance_status (read-only), and NOT privacy_delete (customer forget).
- configure_granular_consent: MUTATE — set requireAiProcessing and requireThirdPartyIntegrations in business.settings.privacy.granularConsent. "Require AI processing consent at checkout", "Ask for third-party integration consent". NOT configure_privacy_retention (retention/cookie banner) and NOT explain_compliance_status (read-only).
- enable_hipaa_mode: MUTATE — enable/disable HIPAA safeguards and session timeout for clinic businesses (business.settings.hipaa). "Enable HIPAA safeguards", "Set 15-minute session timeout for HIPAA". Requires BAA before enabling. NOT explain_compliance_status (read-only) and NOT configure_hipaa_session_timeout (timeout-only mutate).
- configure_hipaa_session_timeout: MUTATE — clinic only: set HIPAA session timeout minutes without enabling/disabling HIPAA mode. "Set HIPAA timeout to 10 minutes", "Require 15-minute auto logout". NOT enable_hipaa_mode (enable/disable or "for HIPAA" wording) and NOT explain_hipaa_session_timeout (read-only).
- accept_hipaa_baa: MUTATE — clinic owner accepts/signs HIPAA BAA (business.settings.hipaa.baaAcceptedAt). "Accept the HIPAA business associate agreement", "Sign BAA to enable HIPAA mode". NOT explain_compliance_status (BAA status read) and NOT enable_hipaa_mode (enable without BAA acceptance wording).
- explain_compliance_status: READ — general compliance overview, retention periods, HIPAA/BAA status. "What is our compliance status?", "What is our HIPAA BAA status?". NOT list_sub_processors (processor list), NOT explain_gdpr_checklist (GDPR checklist/missing items), and NOT configure_privacy_retention.
- list_sub_processors: READ — owner lists Article 28 data sub-processors. "Who are our data sub-processors?", "Show Article 28 processor list". NOT explain_compliance_status (general overview) and NOT explain_gdpr_checklist.
- explain_gdpr_checklist: READ — owner reviews GDPR privacy checklist and missing items. "Are we GDPR compliant?", "What privacy items are still missing?". NOT explain_compliance_status (general overview) and NOT list_sub_processors.
- admin_delete_customer_data: MUTATE — GDPR right-to-erasure for a named customer (anonymize PII on profile). "Forget this customer Anna", "Anonymize PII from Anna's customer profile". NOT privacy_delete (customer self-service) and NOT delete_customer_data (generic CRM delete).
- report_data_breach: MUTATE — owner logs a data breach or security incident (GDPR 72-hour deadline, draft notification). "Report a data breach", "Log security incident affecting customer emails". NOT explain_compliance_status (read-only) and NOT list_breach_incidents (read incident list).
- list_breach_incidents: READ — owner lists logged breach incidents and GDPR 72-hour deadlines. "Show breach incidents", "What is our GDPR 72-hour deadline?". NOT report_data_breach (mutate) and NOT explain_compliance_status (general checklist).
- send_breach_notification: MUTATE — owner emails affected customers using saved draft breach notice. "Email affected customers about breach BR-42", "Send draft breach notice for incident X". NOT report_data_breach and NOT list_breach_incidents.
- open_compliance_dashboard: READ — owner deep-links into Settings → Compliance panels (compliance-1.16 dedicated page deferred). "Open compliance settings", "Take me to breach log". NOT explain_compliance_status (text overview) and NOT list_breach_incidents (AI lists incidents).
- view_phi_access_audit: READ — owner views HIPAA PHI access audit log. "Who accessed patient notes?", "Who viewed lab result comments?", "Show HIPAA PHI audit log for last week". NOT explain_minimum_necessary_phi_access (policy) and NOT explain_phi_encryption_status.
- explain_phi_encryption_status: READ — clinic only: HIPAA PHI encryption at rest. "Is HIPAA encryption on?", "Are referral notes encrypted at rest?". NOT explain_compliance_status and NOT enable_hipaa_mode.
- explain_minimum_necessary_phi_access: READ — who can see PHI under minimum-necessary rules. "Who can see patient notes?", "What PHI can staff access?". NOT view_phi_access_audit (past audit log).
- explain_hipaa_session_timeout: READ — clinic only: HIPAA session timeout and auto-logout after inactivity. "When will I be logged out?", "What is our HIPAA session timeout?". NOT explain_compliance_status and NOT configure_hipaa_session_timeout.
- configure_marketing_automation / summarize_automation_performance / trigger_reengagement / list_inactive_customers / explain_plan_limits / suggest_upgrade / toggle_annual_billing / summarize_new_registrations: marketing automation, billing, and growth (Sprint 34). trigger_reengagement is bulk automation — NOT send_reengagement_message (single customer Zendesk).
- explain_last_push / open_booking_from_push / offline_queue_status / retry_offline_action / dismiss_push / end_of_day_summary / new_booking_push_actions: provider push and offline queue (Sprint 35).
- configure_push_recipients / test_push / notification_history / toggle_business_email_on_customer_change: dashboard notification settings (Sprint 35). test_push is NOT test_webhook.
- enable_notifications / appointment_reminder_preferences: customer notification and reminder prefs (Sprint 35). NOT order_status_notifications (gift card orders).
- book_package / book_multi_service / check_package_availability / check_multi_service_availability / select_subscription_plan / use_subscription_credit: customer package, multi-service, and subscription booking flows (Sprint 36). NOT create_package_booking (dashboard staff).
- cancel_my_booking / reschedule_my_booking / cancel_package_visit_self / reschedule_package_visit_self / list_my_appointments / get_manage_link / explain_cancel_policy: customer self-service (Sprint 36). NOT cancel_bookings (staff).
- book_with_cash / book_with_gift_card / change_provider_on_reschedule / add_services_to_cart / remove_service_from_cart / show_cart_total_duration: customer checkout cart and payment prefs (Sprint 36). book_with_cash is booking-flow cash; pay_cash_at_visit is checkout step (Sprint 30).
- how_to_download_app / switch_to_consumer_app / promo_code_help / loyalty_points_balance: customer app, promo, and loyalty (Sprint 34).
- suggest_retail_upsell / add_retail_to_my_booking: provider retail at chair (Sprint 33).
- list_webhooks / create_webhook / test_webhook / rotate_api_key / list_zapier_triggers / configure_zapier / run_accounting_export / configure_zendesk / create_support_ticket / sync_customer_to_zendesk / configure_marketing_registration_email / list_integration_health: integrations and back-office (Sprint 32).
- contact_support / open_ticket_for_order: customer Zendesk support (Sprint 32).
- explain_payment_status / collect_cash_confirm: provider payment collection.
- check_providers_for_service / book_nearest_slot / apply_gift_card_code / check_gift_card_balance / buy_gift_card / buy_gift_card_physical / choose_payment_method / pay_online / pay_cash_at_visit / purchase_subscription_checkout / explain_why_stripe_required / receipt_status: customer checkout and payments (code-based gift card balance, not my_gift_cards account balance).
- "Who has a X schedule today at 9" / "which provider is working at 09:00" are READ-ONLY show_appointments — NOT create_booking. Never interpret the noun "schedule" in a question as a booking verb.
- Use "show_appointments" or "list_bookings" when the user wants to view/display/see existing appointments or bookings for a day — e.g. "show Gevorg's appointments on Friday", "what appointments does Maria have tomorrow".
- Use "check_availability" when the user asks about available slots, open times, schedule blocks, what services can be booked, or availability on a day — e.g. "which slots are available for Gevorg on 30/06/2026", "what is Gevorg's schedule on Friday", "does Gevorg do face massage today at 9", "is Gevorg available to give facemassage at 09:00". Always set employeeName, serviceName, date, and timeSlot when mentioned. NEVER use create_booking for these questions.
- lookup_service_assignment: READ-ONLY — which providers can perform a service, or which services a provider can perform. Set assignmentLookup and employeeName or serviceName. When a date is mentioned (today/tomorrow/specific day), return only providers with an applied SERVICE_BLOCK for that service on that day AND at least one unbooked open window inside those blocks — NOT the general catalog assignment list. Use for "who is doing facemassage today", "who has a free slot for facemassage today", "who can do face massage tomorrow". Optional maxPrice / serviceRank when the user asks who can do the cheapest/premium service under a budget (e.g. "who can do a haircut under $50").
- analyze_appointments: READ-ONLY — find extreme appointments for a day (most expensive, longest, shortest, earliest, latest). Use for "which appointment is the most expensive today", "longest appointment tomorrow". Set date (default today). NOT the same as listing all appointments.
- summarize_bookings: READ-ONLY booking analytics — counts, revenue/earnings, busiest provider, cancelled/no-show/unpaid totals. Revenue/earnings totals are formatted in the salon tenant business currency (AMD/EUR/USD via business settings). Use for "how many appointments today", "total revenue this week", "calculate total earnings for today", "how much did we earn last month", "who is the busiest provider today". Set bookingMetric="revenue" for earnings/revenue questions. NOT for listing individual appointments (use show_appointments), utilization gaps (use summarize_utilization), or multi-source dashboard+reports KPI bundles (use summarize_revenue_kpis).
- show_appointments / list_bookings: set employeeName when a specific provider is mentioned; leave null for all providers. Always set date when mentioned (required for a meaningful day view).
- optimize_schedule / fill_unused_slots: fill_unused_slots creates schedule service periods (not bookings). Supports multiple providers, date ranges, time windows. For two or more providers use employeeNames array, e.g. ["Gevorg Gasparyan", "Mary Torgomyan"], or employeeName "Gevorg and Mary".
- list_schedule_gaps: READ-ONLY — list open/unfilled time windows per day for specific provider(s). Use when user asks "which days have gaps", "exact days with gaps", "show gaps by day", or follow-ups after a utilization summary. Requires employeeName (or allProviders) and a date range. Inherit dateFrom/dateTo from session when omitted.
- summarize_utilization: team-level utilization percentages for a date range — NOT per-day gap detail. Do not use for "which days" or "show gaps" questions.
- summarize_customers: READ-ONLY customer CRM insights — rankings and segments. Use for "which customer has the most no-shows", "at-risk customers", "top VIPs", "who books the most", "which customer pays the most" / "who paid the most", "top 10 customers who paid the most", "new customers", "most cancellations". Set customerMetric when clear (e.g. top_spenders for payment/spend questions); set limit from "top N" (default 5). NEVER use overview when the user asks for a specific ranking like who pays the most.
- list_services: READ-ONLY service catalog — list offerings or look up price/duration. Use for "what services do we offer", "how much is facemassage", "show our service menu", "options under $50", "what can we offer for $40". Set maxPrice when the user states a spending limit; optional serviceCategory/serviceName filter. NOT package catalog (list_packages), NOT gift card codes (validate_gift_card), NOT create_service.
- analyze_services: READ-ONLY — most booked / top revenue / least popular services for a date range.
- summarize_staff: READ-ONLY — provider/specialist rankings (busiest, most revenue, most bookings) for a date range. Use for "which specialist earned the most today", "top 3 specialists by revenue last week", "who brought in the most revenue all time". Set staffMetric="most_revenue" and limit from "top N".
- lookup_customer: READ-ONLY — single customer profile, last visit, appointment history snippet. Requires customerName.
- summarize_waitlist: READ-ONLY — count and list CRM customers tagged "waitlist". Use for "how many on waitlist", "show waitlist customers". NOT for filling a slot (use fill_slot_from_waitlist).
- Example follow-up: after "who can do facemassage tomorrow", "book Gevorg at 10:00" or "at 10:00" → create_booking with inherited serviceName, date, employeeName, timeSlot.
- list_employees: READ-ONLY — list active providers/team members.
- list_templates: READ-ONLY — list schedule template names.
- create_schedule_template: create a reusable schedule template (name + hours + weekday flags + optional services). Example: "Create template Weekday 9-17 with facemassage Mon-Fri" → templateName, periods or timeFrom/timeTo, applyDays.
- mark_no_shows: mark past missed appointments as no-show. Requires date or date range; optional employeeName, customerName, timeSlot filters. Only appointments that already started and are not cancelled.
- no_show_recovery: mark no-shows AND release slots with waitlist rebooking proposals. Use when user also wants "release slots", "suggest rebooking messages", or waitlist recovery.
- payment_sweep: mark unpaid completed/in-progress appointments as paid. Use for "payment sweep", "collect outstanding payments", "mark unpaid as paid". Optional date range and employeeName filters. "except walk-ins" → excludeWalkIns=true; "completed today" → statusFilter=COMPLETED.
- update_bookings: change appointment status and/or payment without cancelling. Use for "mark as done", "set payment to paid/N/A", "mark appointments 16:00-17:15 as done and paid". Supports employeeName/employeeNames/allProviders, date, timeFrom/timeTo, allAppointments. Use cancel_bookings when user wants cancelled status.
- day_replan: analyze and replan a day — detect conflicts, find gaps, recommend fixes. Use for "replan my day", "fix tomorrow's schedule", "redo the calendar for Friday". Sets date or dateFrom/dateTo.
- sick_day_replan: provider sick day — cancel their bookings, redistribute urgent appointments, block the day. "Maria is sick — cancel her day and redistribute urgent bookings" → employeeName=Maria, date=today.
- import_services_from_menu: OCR/menu import with human review before catalog mutation. Paste menu lines or menuText param.
- update_service_prices: bulk price adjustment by percent. "Raise all massage prices 10% from June 1" → percentChange=10, categoryName=massage, effectiveFrom.
- staff_service_matrix: assign service category to senior providers and remove from juniors. "Assign all color services to senior stylists only".
- check_schedule_compliance: READ-ONLY — find appointments outside business hours for a date range.
- revenue_forecast: READ-ONLY — project revenue from scheduled bookings adjusted by historical no-show rate.
- check_availability timeOfDay: morning (before 12:00), afternoon (12:00–17:00), evening (after 17:00). Set timeOfDay when user asks about morning/afternoon/evening availability. When OR phrasing appears ("tomorrow evening or Friday afternoon"), set availabilityWindows with one object per alternative instead of a single timeOfDay. Optional maxPrice/serviceRank when combined with budget/rank discovery language.
- show_appointments respects statusFilter for cancelled/no-show/confirmed views. Inherit todayOnly and page statusFilter from session context.
- block_schedule: block time or full days for provider(s) or all providers. Creates block schedules. "Block lunch 12-13 for everyone, repeat 4 weeks, skip holidays" → allProviders=true, timeFrom/timeTo, weeksCount=4, skipHolidays=true.
${DASHBOARD_TIME_OFF_CLASSIFIER_RULES}
- swap_schedules: exchange applied schedules between two providers on a day or range. "Swap Friday schedules between Gevorg and Maria" → employeeNames=[Gevorg, Maria], date or applyDays for Friday.
- rebalance_capacity: move N booked slots of a service from one provider to another on a day. "Move 2 facemassage slots from Gevorg to Maria on Friday" → fromEmployeeName, toEmployeeName, serviceName, slotCount=2, date.
- holiday_mode: close business days for all providers and optionally extend hours before closure. "Close Dec 24-26 for all, extend Dec 23 hours until 21:00" → closeDates/holidayDates, allProviders=true, extendDate, extendTimeTo.
- onboard_provider_schedule: new hire first week — apply weekday template + assign services. "Set up Anna's first week from weekday template + assign massage" → employeeName=Anna, templateName, dateFrom/dateTo for first week, serviceNames.
- create_direct_schedule: set/replace applied schedule for one or more providers (allProviders=true for "all employees") for a day or date range. Hours like "9-19, 12-13 unavailable" can omit explicit periods — the system splits service blocks around lunch. When the user says "his/her/their services" or does not name specific services, leave serviceNames null — uses only services assigned to each provider. For ranges like "this week", set dateFrom and dateTo.
- clear_schedule: remove/cleanup/wipe/reset a provider's applied schedule for a day or date range — deletes schedule periods and micro-slots so the day is free to re-apply a template. Does NOT cancel appointments. Requires employeeName (or allProviders for whole team) and date (or dateFrom/dateTo). "Clear all schedules for Karo" means Karo only — set employeeName=Karo, allProviders=false. NOT hide_appointments_from_calendar.
- fill_unused_slots / create_direct_schedule with "for his services" / "their services": do not list every catalog service in serviceNames — leave serviceNames null so only the provider's assigned services are used.
- assign_employee_services: assign services from catalog to a provider. For category bulk: "Assign all services from Color category to Gevorg" → categoryName=Color, employeeName=Gevorg, assignFromCategory=true (merges with existing provider skills).
- apply_schedule: apply a schedule template to provider(s) for a date range or "this week". Set templateName when mentioned.
- setup_week_schedule: apply templates + fill gaps for the team this week (orchestration combo).
- bulk_smart_cancel: cancel bookings AND notify customers AND propose waitlist recovery (use when user mentions notify/waitlist/rebook).
- fill_slot_from_waitlist: fill a specific cancelled/freed slot from waitlist (employee + date + timeSlot).
- reschedule_booking: move an existing appointment to a new time and/or change its service type. Requires identifying the booking (customerName, bookingId, or employeeName — provider alone is enough to pick their next upcoming appointment). Set date/timeSlot to the NEW destination (tomorrow, Friday, 31/05/2026, 13:30). Set fromDate/fromTimeSlot only when naming the current slot (e.g. Maria's 14:00 appointment). "Move Mary's appointment to tomorrow from 13:30" → employeeName=Mary, date=tomorrow, timeSlot=13:30. Set serviceName when changing service.
- CRITICAL: "{Provider}'s appointment on {date}" (e.g. "Move Gevorg's appointment on June 1") refers to a slot on that provider's calendar — set employeeName=Gevorg, fromDate=June 1, customerName=null. NEVER treat the provider name as customerName.
- "Move to June 11 nearest free time" / "earliest available slot on Friday" → reschedule_booking with fromDate for the current slot, date=destination day, employeeName when provider possessive is used, bookingFirstAvailable=true, timeSlot=null. The system picks the first open slot on that day for the same provider and service.
- resolve_conflicts: staff/scheduling conflicts, overlapping appointments, double-booked providers.
- reassign_cancelled: recover from cancellations, rebook freed slots, reassign cancelled appointments.
- Mutating actions compile into workflow plans — they do not execute directly.
- If you cannot determine the action, use "unknown".
- Multi-turn conversation: read prior messages and Active session context. Follow-up commands often omit provider, date, or customer — inherit them unless the user clearly switches topic.
- CRITICAL: When the user's message mentions a service by name (e.g. "facemassage", "face massage", "permanent lips"), set serviceName to THAT service from the Available services list — never inherit a different serviceName from session context.
- CRITICAL: For team-wide questions ("who can do X today", "who is doing facemassage", "who has a free slot for X"), leave employeeName null and set serviceName from the message.
- Example follow-up: after utilization summary for this week, "which exact days does Gevorg have gaps" → action list_schedule_gaps, employeeName="Gevorg Gasparyan", inherit dateFrom/dateTo from session.
- Example follow-up: after list_schedule_gaps or summarize_utilization, "fill those gaps" / "fill them with his services" → action fill_unused_slots, inherit employeeName, dateFrom/dateTo, timeFrom/timeTo from session.
- Example follow-up: after "how many appointments today", "who is the busiest" → action summarize_bookings, bookingMetric="busiest_provider", inherit date from session.
- Example follow-up: after "available slots for Gevorg on 30/06/2026", the message "book facemassage at 16:00" → action create_booking, employeeName="Gevorg Gasparyan" (or "Gevorg"), date="30/06/2026", serviceName="facemassage", timeSlot="16:00".
- Example follow-up: after show_appointments, "change service to hot stone massage" → action reschedule_booking, inherit customerName/date/timeSlot from session, serviceName="hot stone massage".
- Use DD/MM/YYYY for all date params (legacy DD_MM_YYYY is still accepted when parsing).
${CHECK_AND_BOOK_CLASSIFIER_RULES}
${DASHBOARD_PACKAGE_MULTI_CLASSIFIER_RULES}
${GIFT_CARD_PAYMENTS_CLASSIFIER_RULES}
${DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES}
${DASHBOARD_FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES}

${DASHBOARD_SUMMARIZE_BOOKINGS_CURRENCY_CLASSIFIER_RULES}
${STAFF_OPERATIONS_CLASSIFIER_RULES}
${STAFF_OPERATIONS_MULTILINGUAL_CLASSIFIER_RULES}
${PROVIDER_ONBOARDING_COMPOUND_CLASSIFIER_RULES}
${CLINIC_LAB_DAY_CLOSE_CLASSIFIER_RULES}
${BUDGET_DISCOVER_AND_BOOK_CLASSIFIER_RULES}
${RANK_DISCOVER_AND_BOOK_CLASSIFIER_RULES}
${WAITLIST_DASHBOARD_CLASSIFIER_RULES}
${WAITLIST_DASHBOARD_MULTILINGUAL_CLASSIFIER_RULES}
${CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES}
${BILLING_LOYALTY_DASHBOARD_CLASSIFIER_RULES}
${BILLING_LOYALTY_MULTILINGUAL_CLASSIFIER_RULES}`;

export interface CommandSessionOptions {
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: Record<string, any>;
  confirmed?: boolean;
}

export type { ClassifiedIntent } from './ai-command-routing.util.js';

@Injectable()
export class AiCommandService {
  private readonly logger = new Logger(AiCommandService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(SchedulingSlot)
    private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(ScheduleTemplate)
    private templateRepo: Repository<ScheduleTemplate>,
    private orchestration: CommandOrchestrationService,
    private planBuilder: OperationalPlanBuilderService,
    private scheduleHandlers: AiScheduleHandlersService,
    private scheduling: AiSchedulingService,
    private operations: AiOperationsService,
    private businessCurrency: AiBusinessCurrencyService,
    private businessLanguages: AiBusinessLanguagesService,
    private businessDateFormat: AiBusinessDateFormatService,
    private businessTax: AiBusinessTaxService,
    private businessCompliance: AiBusinessComplianceService,
    private clinicTestOrder: AiClinicTestOrderService,
    private clinicLabBooking: AiClinicLabBookingService,
    private clinicTestResult: AiClinicTestResultService,
    private clinicPatientChart: AiClinicPatientChartService,
    private packageLocalizedNames: AiPackageLocalizedNamesService,
    private tourService: AiTourServiceService,
    private clinicService: AiClinicServiceService,
    private recommendationProduct: AiRecommendationProductService,
    private platform: AiPlatformService,
    private bookingDepth: AiBookingDepthService,
    private catalog: AiCatalogService,
    private customerCrm: AiCustomerCrmService,
    private scheduleResources: AiScheduleResourcesService,
    private payments: AiPaymentsService,
    private giftFulfillment: AiGiftFulfillmentService,
    private integrations: AiIntegrationsService,
    private retailFinance: AiRetailFinanceService,
    private marketingGrowth: AiMarketingGrowthService,
    private pushNotifications: AiPushNotificationsService,
    private selfServiceBooking: AiSelfServiceBookingService,
    private schedulingEngine: SchedulingEngineService,
    private completionPipeline: CommandCompletionPipelineService,
    private openAi: OpenAiGatewayService,
    private aiEvents: AiEventsService,
    private decomposition: IntentDecompositionService,
    private aiSettings: AiSettingsService,
    private customerService: CustomerService,
    private bookingCommandGraph: BookingCommandGraphService,
    private slotResolver: BookingSlotResolverService,
    private complexityRouter: CommandComplexityRouterService,
    private intelligence: AiIntelligenceService,
    private intentRescue: AiIntentRescueService,
    private promptSecurity: AiPromptSecurityService,
    private promptNormalization: AiPromptNormalizationService,
    private providerTimeOff: AiProviderTimeOffService,
  ) {}

  async approveTask(
    taskId: string,
    userId: string,
    businessId?: string,
  ): Promise<CommandResult> {
    const orch = await this.orchestration.approveTask(taskId, userId);
    const result = this.toCommandResult(orch);
    if (businessId) {
      this.aiEvents.emitTaskCompleted(businessId, {
        taskId,
        action: result.action,
        success: result.success,
        summary: result.summary,
      });
    }
    return result;
  }

  async retryWorkflowStep(
    businessId: string,
    taskId: string,
    stepId: string,
    userId?: string,
  ): Promise<CommandResult> {
    const orch = await this.orchestration.retryFailedStep(
      businessId,
      taskId,
      stepId,
      userId,
    );
    const result = this.toCommandResult(orch);
    this.aiEvents.emitTaskCompleted(businessId, {
      taskId,
      action: result.action,
      success: result.success,
      summary: result.summary,
    });
    return result;
  }

  async executeCommand(
    businessId: string,
    prompt: string,
    userId?: string,
    session?: CommandSessionOptions,
  ): Promise<CommandResult> {
    if (!(await this.openAi.isAvailableForBusiness(businessId))) {
      return {
        success: false,
        action: 'error',
        summary:
          'AI is not configured. Add an OpenAI API key in Settings → API Keys, or contact your platform administrator.',
        details: {},
      };
    }

    const timeZone = await this.resolveCommandTimezone(businessId, session);

    const [employees, services, customers, templates] = await Promise.all([
      this.employeeRepo.find({ where: { businessId, isActive: true } }),
      this.serviceRepo.find({ where: { businessId } }),
      this.customerRepo.find({ where: { businessId, isActive: true } }),
      this.templateRepo.find({
        where: { businessId, isDeleted: false },
        order: { name: 'ASC' },
      }),
    ]);

    const catalog = { employees, services, customers, templates };
    const aiConfig = await this.aiSettings.getSettings(businessId);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    const businessType = business?.settings?.businessType as string | undefined;
    const { scope, classifierHint } = this.platform.resolveBranchContext(
      session?.context,
      aiConfig,
    );
    const scopedCatalog = scope.locationId
      ? await this.platform.scopeCatalog(businessId, catalog, scope)
      : catalog;
    const verticalHints = this.platform.buildVerticalHints(
      businessType,
      aiConfig,
    );

    const playbook = this.aiSettings.matchPlaybook(aiConfig, prompt);
    const effectivePrompt = playbook ? playbook.prompt : prompt;
    const promptNorm = await this.promptNormalization.normalizeForClassifier(
      businessId,
      userId,
      effectivePrompt,
    );
    const classifierPrompt = promptNorm.normalized;

    const sessionContext = {
      ...session?.context,
      timeZone,
      _branchScope: scope,
      _businessType: businessType,
    };
    const classifierCatalogContext = buildClassifierCatalogContext(
      scopedCatalog,
      timeZone,
    );
    const branchAugmented = classifierHint
      ? `${classifierCatalogContext}\n${classifierHint}\n${verticalHints}`
      : `${classifierCatalogContext}\n${verticalHints}`;
    const contextWithI18n = appendMultilingualClassifierContext(
      branchAugmented,
      promptNorm.classifierContext,
    );

    const presetRoute = session?.context?._complexityRoute as
      | ComplexityRoute
      | undefined;
    const { route: mergedRoute, classification: preclassified } =
      await runParallelRouteAndClassification({
        resolveRoute: () =>
          resolveMergedComplexityRoute(
            businessId,
            classifierPrompt,
            employees,
            this.complexityRouter,
            this.intelligence,
            presetRoute,
          ),
        classify: () =>
          this.classifyIntent(
            businessId,
            userId,
            classifierPrompt,
            contextWithI18n,
            session?.history,
            sessionContext,
          ),
      });

    const sessionWithRoute: CommandSessionOptions = {
      ...session,
      context: {
        ...session?.context,
        _complexityRoute: mergedRoute,
      },
    };

    if (this.selfServiceBooking.isCustomerBookingCompound(effectivePrompt)) {
      const customerBookingCompound =
        await this.selfServiceBooking.handleCustomerBookingCompound(
          businessId,
          effectivePrompt,
          {
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            cartServiceIds: session?.context?.cartServiceIds,
            packageId: session?.context?.packageId,
            packageName: session?.context?.packageName,
            giftCardCode: session?.context?.giftCardCode,
            paymentMethod: session?.context?.paymentMethod,
            useSubscriptionId: session?.context?.useSubscriptionId,
            bookingId: session?.context?.bookingId,
          },
        );
      if (
        customerBookingCompound.success ||
        customerBookingCompound.details?.failedStep
      ) {
        return customerBookingCompound;
      }
    }

    if (this.pushNotifications.isPushNotificationsCompound(effectivePrompt)) {
      const pushNotificationsCompound =
        await this.pushNotifications.handlePushNotificationsCompound(
          businessId,
          effectivePrompt,
          {
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            sessionEmployeeId: session?.context?.scopedEmployeeId as
              | string
              | undefined,
            userId,
            lastPush: session?.context?.lastPush,
            offlineQueueCount: session?.context?.offlineQueueCount,
            online: session?.context?.online,
          },
        );
      if (
        pushNotificationsCompound.success ||
        pushNotificationsCompound.details?.failedStep
      ) {
        return pushNotificationsCompound;
      }
    }

    if (this.marketingGrowth.isMarketingGrowthCompound(effectivePrompt)) {
      const marketingGrowthCompound =
        await this.marketingGrowth.handleMarketingGrowthCompound(
          businessId,
          effectivePrompt,
          {
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
          session?.context?.userEmail as string | undefined,
        );
      if (
        marketingGrowthCompound.success ||
        marketingGrowthCompound.details?.failedStep
      ) {
        return marketingGrowthCompound;
      }
    }

    if (this.retailFinance.isRetailFinanceCompound(effectivePrompt)) {
      const retailFinanceCompound =
        await this.retailFinance.handleRetailFinanceCompound(
          businessId,
          effectivePrompt,
          {
            sessionEmployeeId: session?.context?.employeeId as
              | string
              | undefined,
          },
          userId,
        );
      if (
        retailFinanceCompound.success ||
        retailFinanceCompound.details?.failedStep
      ) {
        return retailFinanceCompound;
      }
    }

    if (this.integrations.isIntegrationsCompound(effectivePrompt)) {
      const integrationsCompound =
        await this.integrations.handleIntegrationsCompound(
          businessId,
          effectivePrompt,
          {
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
          userId,
          session?.context?.userEmail as string | undefined,
          session?.context?.userName as string | undefined,
        );
      if (
        integrationsCompound.success ||
        integrationsCompound.details?.failedStep
      ) {
        return integrationsCompound;
      }
    }

    if (this.giftFulfillment.isFulfillmentCompound(effectivePrompt)) {
      const fulfillmentCompound =
        await this.giftFulfillment.handleFulfillmentCompound(
          businessId,
          effectivePrompt,
          {
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
          userId,
        );
      if (
        fulfillmentCompound.success ||
        fulfillmentCompound.details?.failedStep
      ) {
        return fulfillmentCompound;
      }
    }

    if (this.payments.isPaymentsCompound(effectivePrompt)) {
      const paymentsCompound = await this.payments.handlePaymentsCompound(
        businessId,
        effectivePrompt,
        {
          sessionCustomerId: session?.context?.customerId as string | undefined,
        },
        userId,
      );
      if (paymentsCompound.success || paymentsCompound.details?.failedStep) {
        return paymentsCompound;
      }
    }

    if (this.scheduleResources.isScheduleResourceCompound(effectivePrompt)) {
      const scheduleCompound =
        await this.scheduleResources.handleScheduleResourceCompound(
          businessId,
          effectivePrompt,
          {
            sessionEmployeeId: session?.context?.employeeId as
              | string
              | undefined,
          },
          scopedCatalog.services,
          userId,
        );
      if (scheduleCompound.success || scheduleCompound.details?.failedStep) {
        return scheduleCompound;
      }
    }

    if (this.customerCrm.isCrmCompound(effectivePrompt)) {
      const crmCompound = await this.customerCrm.handleCrmCompound(
        businessId,
        effectivePrompt,
        {
          ...{},
          sessionCustomerId: session?.context?.customerId as string | undefined,
        },
        scopedCatalog.customers,
        (list, name) => this.resolveCustomer(list, name),
        userId,
      );
      if (crmCompound.success || crmCompound.details?.failedStep) {
        return crmCompound;
      }
    }

    if (this.catalog.isCatalogCompound(effectivePrompt)) {
      const catalogCompound = await this.catalog.handleCatalogCompound(
        businessId,
        effectivePrompt,
        {},
        scopedCatalog.services,
        scopedCatalog.customers,
        (list, name) => this.resolveCustomer(list, name),
        userId,
      );
      if (catalogCompound.success || catalogCompound.details?.failedStep) {
        return catalogCompound;
      }
    }

    if (this.bookingCommandGraph.isEnabled()) {
      const complexityRoute = sessionWithRoute.context?._complexityRoute as
        | {
            tier: 'read_only' | 'simple_mutate' | 'orchestration' | 'compound';
            useDecomposition?: boolean;
          }
        | undefined;

      return this.bookingCommandGraph.run({
        businessId,
        prompt,
        effectivePrompt,
        userId,
        session: sessionWithRoute,
        catalog: scopedCatalog,
        timeZone,
        confidenceThresholds: {
          low: aiConfig.confidence.low,
          high:
            (session?.context?._confidenceHigh as number | undefined) ??
            aiConfig.confidence.high,
        },
        complexityRoute,
        delegates: {
          executeSingleIntent: () =>
            this.executeSingleIntent(
              businessId,
              effectivePrompt,
              userId,
              sessionWithRoute,
              scopedCatalog,
              timeZone,
              aiConfig,
              playbook,
              promptNorm,
              preclassified,
            ),
          buildCompoundPlan: (
            action,
            params,
            employeeId,
            pendingCancelBookingIds,
          ) =>
            this.buildPlanForResolvedIntent(
              businessId,
              effectivePrompt,
              action,
              params,
              employeeId,
              catalog,
              userId,
              pendingCancelBookingIds,
            ),
          toCommandResult: (orch) => this.toCommandResult(orch),
          executeLegacyCompound: async () => {
            const subIntents = await this.decomposition.decompose(
              businessId,
              userId,
              classifierPrompt,
              timeZone,
            );
            return this.executeCompoundIntents(
              businessId,
              effectivePrompt,
              userId,
              sessionWithRoute,
              subIntents,
              catalog,
              aiConfig.confidence,
              timeZone,
            );
          },
          executeReadOnlySubIntent: (action, params) =>
            this.executeReadOnlySubIntent(
              businessId,
              effectivePrompt,
              action,
              params,
              scopedCatalog,
              timeZone,
              userId,
            ),
        },
      });
    }

    if (this.decomposition.isCompoundPrompt(classifierPrompt)) {
      const subIntents = await this.decomposition.decompose(
        businessId,
        userId,
        classifierPrompt,
        timeZone,
      );
      if (subIntents.length > 1) {
        recordMisrouteTelemetry(this.aiEvents, businessId, {
          surface: 'dashboard',
          prompt: effectivePrompt,
          classifierAction: 'compound_intent',
          rescuedAction: 'compound_intent',
          rescueReason: 'compound_decomposition',
          compoundStepCount: subIntents.length,
        });
        return this.executeCompoundIntents(
          businessId,
          effectivePrompt,
          userId,
          sessionWithRoute,
          subIntents,
          scopedCatalog,
          {
            low: aiConfig.confidence.low,
            high:
              (session?.context?._confidenceHigh as number | undefined) ??
              aiConfig.confidence.high,
          },
          timeZone,
        );
      }
    }

    return this.executeSingleIntent(
      businessId,
      effectivePrompt,
      userId,
      sessionWithRoute,
      scopedCatalog,
      timeZone,
      aiConfig,
      playbook,
      promptNorm,
      preclassified,
    );
  }

  private async executeSingleIntent(
    businessId: string,
    effectivePrompt: string,
    userId: string | undefined,
    session: CommandSessionOptions | undefined,
    catalog: {
      employees: Employee[];
      services: Service[];
      customers: Customer[];
      templates: ScheduleTemplate[];
    },
    timeZone: string,
    aiConfig: Awaited<ReturnType<AiSettingsService['getSettings']>>,
    playbook: ReturnType<AiSettingsService['matchPlaybook']>,
    promptNorm?: PromptNormalizationResult,
    preclassified?: ClassifiedIntent | null,
  ): Promise<CommandResult> {
    const { employees, services, customers, templates } = catalog;

    const sessionContext = { ...session?.context, timeZone };

    let parsed = await resolveParsedIntent({
      preclassified,
      classify: async () => {
        const norm =
          promptNorm ??
          (await this.promptNormalization.normalizeForClassifier(
            businessId,
            userId,
            effectivePrompt,
          ));
        const contextBlock = buildClassifierCatalogContext(catalog, timeZone);
        const contextWithI18n = appendMultilingualClassifierContext(
          contextBlock,
          norm.classifierContext,
        );
        return this.classifyIntent(
          businessId,
          userId,
          norm.normalized,
          contextWithI18n,
          session?.history,
          sessionContext,
        );
      },
    });
    if (!parsed) {
      const fallbackRescue = this.intentRescue.rescue({
        prompt: effectivePrompt,
        action: 'unknown',
        params: {},
        employees: employees.map((e) => ({ id: e.id, name: e.name })),
        customers: customers.map((c) => ({ id: c.id, name: c.name })),
        timeZone,
        surface: 'dashboard',
      });
      if (fallbackRescue?.rescued) {
        parsed = {
          action: fallbackRescue.action,
          params: { ...fallbackRescue.params },
          reasoning:
            fallbackRescue.reasoning ??
            'Recovered via deterministic rescue after classifier returned no result.',
          confidence: 0.85,
        };
      }
    }
    if (!parsed) {
      return {
        success: false,
        action: 'error',
        summary: 'Failed to understand the command. Please try rephrasing.',
        details: {},
      };
    }

    parsed.params = this.completionPipeline.mergeSessionContext(
      parsed.params,
      sessionContext,
      parsed.action,
    );
    parsed.params = applyEntityMemoryToParams(
      parsed.params,
      aiConfig.entityMemory ?? { aliases: {} },
      effectivePrompt,
    );
    if (parsed.action === 'create_booking') {
      parsed.params.customerName = null;
      delete parsed.params.customerId;
    }
    this.applyPromptEntityOverrides(
      effectivePrompt,
      parsed.params,
      parsed.action,
      employees,
      services,
      customers,
      sessionContext,
    );
    parsed.params._timeZone = timeZone;
    this.enrichMultiEmployeeFromPrompt(
      effectivePrompt,
      parsed.params,
      employees,
    );
    this.applyScheduleScopeFromPrompt(
      effectivePrompt,
      parsed.params,
      parsed.action,
      employees,
    );

    if (parsed.action === 'unknown' && isClearSchedulePrompt(effectivePrompt)) {
      parsed.action = 'clear_schedule';
      parsed.reasoning =
        'Clear applied schedule periods and micro-slots for the provider on the specified date(s).';
      parsed.confidence = Math.max(
        typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        0.88,
      );
    }

    if (parsed.action === 'unknown') {
      const vertical = this.platform.rescueVerticalIntent(
        effectivePrompt,
        (session?.context?._businessType as string | undefined) ?? undefined,
        aiConfig,
      );
      if (vertical) {
        parsed.action = vertical.action;
        parsed.reasoning = `Vertical plugin rescue → ${vertical.action}`;
        parsed.confidence = Math.max(
          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
          0.84,
        );
      }
    }

    const classifierAction = parsed.action;
    const classifierConfidence =
      typeof parsed.confidence === 'number' ? parsed.confidence : undefined;

    const rescued = this.intentRescue.rescue({
      prompt: effectivePrompt,
      action: parsed.action,
      params: parsed.params,
      reasoning: parsed.reasoning,
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
      customers: customers.map((c) => ({ id: c.id, name: c.name })),
      timeZone,
    });
    if (rescued?.rescued) {
      parsed.action = rescued.action;
      parsed.params = { ...parsed.params, ...rescued.params };
      parsed.reasoning = rescued.reasoning ?? parsed.reasoning;
      parsed.confidence = Math.max(
        typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        0.85,
      );
      applyBookingRescheduleActionHints(
        parsed.action,
        parsed.params,
        effectivePrompt,
        {
          employees: employees.map((e) => ({ id: e.id, name: e.name })),
          customers: customers.map((c) => ({ id: c.id, name: c.name })),
          timeZone,
        },
      );
      applyScheduleOpsPromptHints(
        parsed.action,
        parsed.params,
        effectivePrompt,
        {
          employees: employees.map((e) => ({ id: e.id, name: e.name })),
          timeZone,
          session: sessionContext,
        },
      );
      applyPackageMultiServicePromptHints(
        parsed.action,
        parsed.params,
        effectivePrompt,
        {
          employees: employees.map((e) => ({ id: e.id, name: e.name })),
          customers: customers.map((c) => ({ id: c.id, name: c.name })),
          timeZone,
          session: sessionContext,
        },
      );
      applyGiftCardPaymentsPromptHints(
        parsed.action,
        parsed.params,
        effectivePrompt,
        { session: sessionContext },
      );
      applyCatalogNotifyPromptHints(
        parsed.action,
        parsed.params,
        effectivePrompt,
      );
    }

    recordMisrouteTelemetry(this.aiEvents, businessId, {
      surface: 'dashboard',
      prompt: effectivePrompt,
      classifierAction,
      rescuedAction: parsed.action,
      rescueReason: rescued?.rescued ? rescued.rescueReason : undefined,
      classifierConfidence,
      compoundStepCount: 1,
    });

    this.applyBulkAppointmentScope(
      effectivePrompt,
      parsed.params,
      parsed.action,
      services,
    );

    const actorTier = normalizeActorRole(
      (session?.context?._accessTier as string | undefined) ??
        (session?.context?._actorRole as string | undefined) ??
        'owner',
    );
    if (!isIntentAllowed('dashboard', actorTier, parsed.action)) {
      return {
        success: false,
        action: parsed.action,
        summary: `Action "${parsed.action.replace(/_/g, ' ')}" is not allowed for your role (${actorTier}).`,
        details: { tier: actorTier, action: parsed.action },
      };
    }

    const roleProfile = this.platform.resolveRoleProfile(
      (session?.context?._membershipRole as string | undefined) ??
        (session?.context?._actorRole as string | undefined),
      aiConfig,
    );
    const roleDenied = this.platform.gateRoleIntent(
      roleProfile,
      'dashboard',
      parsed.action,
    );
    if (roleDenied) return roleDenied;

    const planTierId =
      (session?.context?._planTierId as PlanTierId | undefined) ?? 'solo';
    if (!isDashboardAiIntentAllowedByPlan(planTierId, parsed.action)) {
      return {
        success: false,
        action: parsed.action,
        summary: `Action "${parsed.action.replace(/_/g, ' ')}" requires a paid plan. Upgrade to unlock advanced AI operations.`,
        details: { planTierId, action: parsed.action, upgradeRequired: true },
      };
    }

    parsed.params = this.promptSecurity.stripParams(parsed.params) as Record<
      string,
      any
    >;
    parsed.params = this.promptSecurity.applyStaffScope(
      actorTier,
      parsed.action,
      parsed.params,
      session?.context?._scopedEmployeeId as string | undefined,
    ) as Record<string, any>;
    parsed.params = enrichDiscoveryParamsFromPrompt(
      parsed.params,
      effectivePrompt,
    );

    const securityDenied = this.promptSecurity.enforceAction(
      businessId,
      'dashboard',
      actorTier,
      parsed.action,
      effectivePrompt,
      parsed.params,
    );
    if (securityDenied) {
      return securityDenied;
    }

    const confidence =
      typeof parsed.confidence === 'number' ? parsed.confidence : 0.75;

    this.logger.log(
      `AI (LLM) classified action="${parsed.action}" confidence=${confidence} — ${parsed.reasoning}`,
    );

    this.completionPipeline.normalizeDateParams(
      parsed.params,
      effectivePrompt,
      timeZone,
    );
    if (parsed.action === 'reschedule_booking') {
      this.completionPipeline.finalizeRescheduleParams(
        parsed.params,
        effectivePrompt,
        timeZone,
      );
    } else if (
      parsed.action === 'create_direct_schedule' ||
      parsed.action === 'clear_schedule' ||
      parsed.action === 'apply_schedule' ||
      parsed.action === 'block_schedule' ||
      parsed.action === 'swap_schedules' ||
      parsed.action === 'rebalance_capacity' ||
      parsed.action === 'holiday_mode' ||
      parsed.action === 'onboard_provider_schedule' ||
      parsed.action === 'fill_unused_slots' ||
      parsed.action === 'cancel_bookings' ||
      parsed.action === 'hide_appointments_from_calendar'
    ) {
      this.completionPipeline.enrichDateRangeParams(
        parsed.params,
        effectivePrompt,
        timeZone,
      );
      this.completionPipeline.normalizeDateParams(
        parsed.params,
        effectivePrompt,
        timeZone,
      );
    }
    if (parsed.action === 'create_direct_schedule') {
      parsed.params.periods = inferDirectSchedulePeriods(
        parsed.params,
        effectivePrompt,
      );
    }

    const resolved = this.completionPipeline.resolve(
      businessId,
      effectivePrompt,
      parsed,
      catalog,
      timeZone,
    );
    const pipelineTrace = [
      this.completionPipeline.trace(
        'classify',
        parsed.action,
        parsed.reasoning,
      ),
      this.completionPipeline.trace('resolve', parsed.action),
    ];

    if (shouldValidateAction(parsed.action)) {
      const validation = this.completionPipeline.validate(resolved);
      pipelineTrace.push(
        this.completionPipeline.trace(
          'validate',
          parsed.action,
          validation.ok ? 'passed' : `${validation.issues.length} issue(s)`,
        ),
      );

      if (!validation.ok) {
        const clarify = this.completionPipeline.toClarifyResult(
          resolved,
          validation,
        );
        clarify.details.pipelineTrace = pipelineTrace;
        this.aiEvents.emitClarify(businessId, {
          action: parsed.action,
          summary: clarify.summary,
          missing: clarify.details.missing,
        });
        return clarify;
      }
    }

    const mutatingActions = new Set([
      'create_booking',
      'create_service',
      'create_services',
      'cancel_bookings',
      'update_bookings',
      'bulk_smart_cancel',
      'hide_appointments_from_calendar',
      'unhide_appointments_from_calendar',
      'fill_slot_from_waitlist',
      'reschedule_booking',
      'fill_unused_slots',
      'apply_schedule',
      'clear_schedule',
      'block_schedule',
      'setup_week_schedule',
      'swap_schedules',
      'rebalance_capacity',
      'holiday_mode',
      'onboard_provider_schedule',
      'create_schedule_template',
      'mark_no_shows',
      'no_show_recovery',
      'payment_sweep',
      'day_replan',
      'sick_day_replan',
      'import_services_from_menu',
      'update_service_prices',
      'staff_service_matrix',
      'create_booking_subscription_credit',
      'create_booking_cash',
      'create_package_booking',
      'create_multi_service_booking',
      'cancel_package_visit',
      'cancel_multi_service_group',
      'reschedule_package_visit',
      'reschedule_multi_service_group',
      'mark_paid',
      'assign_booking_resource',
      'create_service_category',
      'bulk_create_catalog',
      'deactivate_service',
      'create_package',
      'update_package',
      'deactivate_package',
      'duplicate_package',
      'create_subscription_plan',
      'update_subscription_plan',
      'deactivate_subscription_plan',
      'assign_subscription_to_customer',
      'configure_gift_card_products',
      'create_gift_card_bundle',
      'configure_multi_service_settings',
      'set_service_compatibility',
      'extend_subscription',
      'cancel_subscription_admin',
      'merge_customers',
      'export_customer_data',
      'delete_customer_data',
      'send_reengagement_message',
      'tag_customer',
      'request_gift_card_cancel',
      'request_gift_card_modify',
      'privacy_export',
      'privacy_delete',
      'create_resource',
      'update_resource',
      'deactivate_resource',
      'assign_resource_hours',
      'configure_multi_service_scheduling_mode',
      'block_resource_unavailable',
      'configure_cash_payments',
      'configure_business_currency',
      'configure_business_tax',
      'configure_privacy_retention',
      'configure_granular_consent',
      'enable_hipaa_mode',
      'configure_hipaa_session_timeout',
      'admin_delete_customer_data',
      'report_data_breach',
      'send_breach_notification',
      'configure_stacked_tax_rules',
      'set_service_tax_rate',
      'configure_business_languages',
      'configure_business_date_format',
      'configure_package_localized_names',
      'configure_tour_service',
      'configure_clinic_service',
      'apply_clinic_playbook',
      'configure_recommendation_product',
      'link_recommended_products',
      'apply_tour_playbook',
      'bulk_strip_disabled_locale_translations',
      'migrate_dashboard_date_display',
      'notify_patient_result_ready',
      'create_test_order',
      'create_catalog_test_order',
      'push_lab_booking_to_patient',
      'staff_book_lab_collection',
      'enter_test_result',
      'release_test_result',
      'bulk_update_service_currency',
      'adjust_gift_card_balance',
      'extend_gift_card_expiry',
      'refund_gift_card_order',
      'collect_cash_confirm',
      'assign_card_creator',
      'assign_delivery_staff',
      'mark_shipped',
      'mark_delivered',
      'cancel_gift_card_order',
      'extend_cancel_window',
      'start_card_preparation',
      'mark_card_ready',
      'accept_delivery',
      'mark_out_for_delivery',
      'capture_delivery_proof',
      'notify_delay',
      'enter_shipping_address',
      'create_webhook',
      'rotate_api_key',
      'configure_zapier',
      'run_accounting_export',
      'configure_zendesk',
      'create_support_ticket',
      'sync_customer_to_zendesk',
      'configure_marketing_registration_email',
      'contact_support',
      'open_ticket_for_order',
      'configure_marketing_automation',
      'trigger_reengagement',
      'toggle_annual_billing',
      'configure_push_recipients',
      'test_push',
      'toggle_business_email_on_customer_change',
      'retry_offline_action',
      'dismiss_push',
      'enable_notifications',
    ]);
    if (
      mutatingActions.has(parsed.action) &&
      confidence < aiConfig.confidence.low
    ) {
      return {
        success: false,
        action: parsed.action,
        summary: `I'm not fully confident I understood that (${Math.round(confidence * 100)}% confidence). Did you mean to "${parsed.action.replace(/_/g, ' ')}"? Please rephrase or add more detail.`,
        details: {
          needsClarification: true,
          confidence,
          reasoning: parsed.reasoning,
          playbook: playbook?.name,
        },
      };
    }

    const confidenceThresholds = {
      low: aiConfig.confidence.low,
      high:
        (session?.context?._confidenceHigh as number | undefined) ??
        aiConfig.confidence.high,
    };
    const autoExecuteFlag = resolveAutoExecute({
      action: parsed.action,
      stepCount: 1,
      providerCount:
        resolveEmployees(employees, resolved.enrichedParams).length || 1,
      confidence,
      thresholds: confidenceThresholds,
    });

    const confirmed = isExecutionConfirmed(session);
    const bulkConfirmActions = new Set([
      'cancel_bookings',
      'update_bookings',
      'bulk_smart_cancel',
      'clear_schedule',
      'hide_appointments_from_calendar',
      'setup_week_schedule',
      'create_services',
      'mark_no_shows',
      'no_show_recovery',
      'payment_sweep',
      'day_replan',
      'sick_day_replan',
      'import_services_from_menu',
      'update_service_prices',
      'staff_service_matrix',
      'bulk_create_catalog',
      'create_package',
      'create_subscription_plan',
      'merge_customers',
      'delete_customer_data',
      'privacy_delete',
    ]);
    if (
      bulkConfirmActions.has(parsed.action) &&
      !confirmed &&
      autoExecuteFlag &&
      confidence >= aiConfig.confidence.low
    ) {
      const confirmResult = buildExecutionConfirmationResult(
        parsed.action,
        parsed.reasoning,
        effectivePrompt,
        resolved.enrichedParams,
      );
      confirmResult.details = {
        ...confirmResult.details,
        pipelineTrace,
        confidence,
        playbook: playbook?.name ?? null,
      };
      return confirmResult;
    }

    const params = resolved.enrichedParams;
    const employeeId = params.employeeId ?? resolved.entities.employeeId;
    const resolvedEmployee = resolved.entities.employee;

    let result: CommandResult;

    switch (parsed.action) {
      case 'create_booking':
        result = await this.handleCreateBooking(
          businessId,
          params,
          employees,
          services,
          customers,
          userId,
          effectivePrompt,
        );
        break;
      case 'create_booking_subscription_credit': {
        const prepared =
          await this.bookingDepth.prepareSubscriptionCreditParams(
            businessId,
            params,
            customers,
            services,
            (list, name) => this.resolveCustomer(list, name),
            (list, name) => this.resolveService(list, name) ?? undefined,
          );
        if (!prepared.ok) {
          result = prepared.result;
          break;
        }
        result = await this.handleCreateBooking(
          businessId,
          prepared.params,
          employees,
          services,
          customers,
          userId,
          effectivePrompt,
        );
        if (result.action === 'create_booking') {
          result = { ...result, action: 'create_booking_subscription_credit' };
        }
        break;
      }
      case 'create_booking_cash': {
        const businessRow = await this.businessRepo.findOne({
          where: { id: businessId },
          select: { settings: true },
        });
        const prepared = this.bookingDepth.prepareCashCreateParams(
          params,
          businessRow?.settings ?? null,
        );
        if (!prepared.ok) {
          result = prepared.result;
          break;
        }
        result = await this.handleCreateBooking(
          businessId,
          prepared.params,
          employees,
          services,
          customers,
          userId,
          effectivePrompt,
        );
        if (result.action === 'create_booking') {
          result = { ...result, action: 'create_booking_cash' };
        }
        break;
      }
      case 'create_package_booking': {
        const businessRow = await this.businessRepo.findOne({
          where: { id: businessId },
        });
        if (!businessRow) {
          result = {
            success: false,
            action: 'create_package_booking',
            summary: 'Business not found',
            details: {},
          };
          break;
        }
        result = await this.bookingDepth.handleCreatePackageBooking(
          businessId,
          params,
          businessRow,
          employees,
          services,
          customers,
          (list, name) => this.resolveEmployee(list, name),
          (list, name) => this.resolveCustomer(list, name),
          userId,
        );
        break;
      }
      case 'create_multi_service_booking': {
        const businessRow = await this.businessRepo.findOne({
          where: { id: businessId },
        });
        if (!businessRow) {
          result = {
            success: false,
            action: 'create_multi_service_booking',
            summary: 'Business not found',
            details: {},
          };
          break;
        }
        result = await this.bookingDepth.handleCreateMultiServiceBooking(
          businessId,
          params,
          businessRow,
          employees,
          services,
          customers,
          (list, name) => this.resolveEmployee(list, name),
          (list, p) => this.resolveServices(list, p),
          (list, name) => this.resolveCustomer(list, name),
          userId,
        );
        break;
      }
      case 'cancel_package_visit':
        result = await this.bookingDepth.handleCancelPackageVisit(
          businessId,
          params,
          userId,
        );
        break;
      case 'cancel_multi_service_group':
        result = await this.bookingDepth.handleCancelMultiServiceGroup(
          businessId,
          params,
          userId,
        );
        break;
      case 'reschedule_package_visit':
        result = await this.bookingDepth.handleReschedulePackageVisit(
          businessId,
          params,
          userId,
        );
        break;
      case 'reschedule_multi_service_group':
        result = await this.bookingDepth.handleRescheduleMultiServiceGroup(
          businessId,
          params,
          userId,
        );
        break;
      case 'list_cash_pending_bookings':
        result = await this.bookingDepth.handleListCashPending(
          businessId,
          effectivePrompt,
          params,
        );
        break;
      case 'list_package_bookings':
        result = await this.bookingDepth.handleListPackageBookings(
          businessId,
          effectivePrompt,
          params,
        );
        break;
      case 'list_multi_service_bookings':
        result = await this.bookingDepth.handleListMultiServiceBookings(
          businessId,
          effectivePrompt,
          params,
        );
        break;
      case 'mark_paid':
        result = await this.bookingDepth.handleMarkPaid(
          businessId,
          params,
          userId,
        );
        break;
      case 'assign_booking_resource':
        result = await this.bookingDepth.handleAssignResource(
          businessId,
          params,
          userId,
        );
        break;
      case 'explain_booking_policy':
        result = await this.bookingDepth.handleExplainPolicy(
          businessId,
          params,
        );
        break;
      case 'create_service_category':
        result = await this.catalog.handleCreateServiceCategory(
          businessId,
          params,
        );
        break;
      case 'bulk_create_catalog':
        result = await this.catalog.handleBulkCreateCatalog(
          businessId,
          effectivePrompt,
          params,
        );
        break;
      case 'deactivate_service':
        result = await this.catalog.handleDeactivateService(
          businessId,
          params,
          services,
        );
        break;
      case 'list_packages':
        result = await this.catalog.handleListPackages(businessId);
        break;
      case 'create_package':
        result = await this.catalog.handleCreatePackage(
          businessId,
          params,
          services,
        );
        break;
      case 'update_package':
        result = await this.catalog.handleUpdatePackage(businessId, params);
        break;
      case 'deactivate_package':
        result = await this.catalog.handleDeactivatePackage(businessId, params);
        break;
      case 'duplicate_package':
        result = await this.catalog.handleDuplicatePackage(businessId, params);
        break;
      case 'list_subscription_plans':
        result = await this.catalog.handleListSubscriptionPlans(
          businessId,
          params,
          services,
        );
        break;
      case 'create_subscription_plan':
        result = await this.catalog.handleCreateSubscriptionPlan(
          businessId,
          params,
          services,
        );
        break;
      case 'update_subscription_plan':
        result = await this.catalog.handleUpdateSubscriptionPlan(
          businessId,
          params,
        );
        break;
      case 'deactivate_subscription_plan':
        result = await this.catalog.handleDeactivateSubscriptionPlan(
          businessId,
          params,
        );
        break;
      case 'assign_subscription_to_customer':
        result = await this.catalog.handleAssignSubscription(
          businessId,
          params,
          services,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'configure_gift_card_products':
        result = await this.catalog.handleConfigureGiftCardProducts(
          businessId,
          params,
          services,
        );
        break;
      case 'create_gift_card_bundle':
        result = await this.catalog.handleCreateGiftCardBundle(
          businessId,
          params,
          services,
        );
        break;
      case 'configure_multi_service_settings':
        result = await this.catalog.handleConfigureMultiServiceSettings(
          businessId,
          params,
        );
        break;
      case 'set_service_compatibility':
        result = await this.catalog.handleSetServiceCompatibility(
          businessId,
          params,
          services,
        );
        break;
      case 'list_customer_subscriptions':
        result = await this.customerCrm.handleListCustomerSubscriptions(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'subscription_usage_history':
        result = await this.customerCrm.handleSubscriptionUsageHistory(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'extend_subscription':
        result = await this.customerCrm.handleExtendSubscription(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'cancel_subscription_admin':
        result = await this.customerCrm.handleCancelSubscriptionAdmin(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'list_customer_gift_cards':
        result = await this.customerCrm.handleListCustomerGiftCards(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'list_customer_bookings':
        result = await this.customerCrm.handleListCustomerBookings(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'customer_no_show_history':
        result = await this.customerCrm.handleCustomerNoShowHistory(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'tag_customer':
        result = await this.customerCrm.handleTagCustomer(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'export_customer_data':
        result = await this.customerCrm.handleExportCustomerData(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'delete_customer_data':
        result = await this.customerCrm.handleDeleteCustomerData(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'send_reengagement_message':
        result = await this.customerCrm.handleSendReengagementMessage(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'merge_customers':
        result = await this.customerCrm.handleMergeCustomers(
          businessId,
          params,
          customers,
          (list, name) => this.resolveCustomer(list, name),
        );
        break;
      case 'my_profile':
        result = await this.customerCrm.handleMyProfile(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId,
        });
        break;
      case 'my_appointments':
        result = await this.customerCrm.handleMyAppointments(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId,
        });
        break;
      case 'my_subscriptions':
        result = await this.customerCrm.handleMySubscriptions(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId,
        });
        break;
      case 'subscription_usage':
        result = await this.customerCrm.handleSubscriptionUsage(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId,
        });
        break;
      case 'my_gift_cards':
        result = await this.customerCrm.handleMyGiftCards(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId,
        });
        break;
      case 'gift_card_balance':
        result = await this.customerCrm.handleGiftCardBalance(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId,
        });
        break;
      case 'gift_card_redemption_history':
        result = await this.customerCrm.handleGiftCardRedemptionHistory(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId,
          },
        );
        break;
      case 'request_gift_card_cancel':
        result = await this.customerCrm.handleRequestGiftCardCancel(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId,
          },
        );
        break;
      case 'request_gift_card_modify':
        result = await this.customerCrm.handleRequestGiftCardModify(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId,
          },
        );
        break;
      case 'track_physical_gift_card_order':
        result = await this.customerCrm.handleTrackPhysicalGiftCardOrder(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId,
          },
        );
        break;
      case 'privacy_export':
        result = await this.customerCrm.handlePrivacyExport(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId,
        });
        break;
      case 'privacy_delete':
        result = await this.customerCrm.handlePrivacyDelete(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId,
        });
        break;
      case 'discover_packages':
        result = await this.customerCrm.handleDiscoverPackages(businessId);
        break;
      case 'discover_subscription_plans':
        result = await this.customerCrm.handleDiscoverSubscriptionPlans(
          businessId,
          params,
        );
        break;
      case 'discover_gift_card_products':
        result =
          await this.customerCrm.handleDiscoverGiftCardProducts(businessId);
        break;
      case 'list_scheduling_resources':
        result =
          await this.scheduleResources.handleListSchedulingResources(
            businessId,
          );
        break;
      case 'create_resource':
        result = await this.scheduleResources.handleCreateResource(
          businessId,
          params,
        );
        break;
      case 'update_resource':
        result = await this.scheduleResources.handleUpdateResource(
          businessId,
          params,
        );
        break;
      case 'deactivate_resource':
        result = await this.scheduleResources.handleDeactivateResource(
          businessId,
          params,
        );
        break;
      case 'assign_resource_hours':
        result = await this.scheduleResources.handleAssignResourceHours(
          businessId,
          params,
          services,
        );
        break;
      case 'list_resource_conflicts':
        result = await this.scheduleResources.handleListResourceConflicts(
          businessId,
          params,
        );
        break;
      case 'explain_resource_conflict':
        result = await this.scheduleResources.handleExplainResourceConflict(
          businessId,
          params,
        );
        break;
      case 'configure_multi_service_scheduling_mode':
        result =
          await this.scheduleResources.handleConfigureMultiServiceSchedulingMode(
            businessId,
            params,
          );
        break;
      case 'my_resource_assignments':
        result = await this.scheduleResources.handleMyResourceAssignments(
          businessId,
          {
            ...params,
            sessionEmployeeId: employeeId,
          },
        );
        break;
      case 'block_resource_unavailable':
        result = await this.scheduleResources.handleBlockResourceUnavailable(
          businessId,
          params,
        );
        break;
      case 'check_multi_service_block_availability':
        result =
          await this.scheduleResources.handleCheckMultiServiceBlockAvailability(
            businessId,
            params,
          );
        break;
      case 'check_package_line_availability':
        result =
          await this.scheduleResources.handleCheckPackageLineAvailability(
            businessId,
            params,
          );
        break;
      case 'earliest_slot_all_services':
        result = await this.scheduleResources.handleEarliestSlotAllServices(
          businessId,
          params,
        );
        break;
      case 'providers_available_later_days':
        result = await this.scheduleResources.handleProvidersAvailableLaterDays(
          businessId,
          params,
        );
        break;
      case 'explain_why_no_slots':
        result = await this.scheduleResources.handleExplainWhyNoSlots(
          businessId,
          params,
        );
        break;
      case 'list_products':
        result = await this.retailFinance.handleListProducts(
          businessId,
          params,
        );
        break;
      case 'configure_marketing_automation':
        result = await this.marketingGrowth.handleConfigureMarketingAutomation(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'summarize_automation_performance':
        result =
          await this.marketingGrowth.handleSummarizeAutomationPerformance(
            businessId,
          );
        break;
      case 'trigger_reengagement':
        result =
          await this.marketingGrowth.handleTriggerReengagement(businessId);
        break;
      case 'list_inactive_customers':
        result =
          await this.marketingGrowth.handleListInactiveCustomers(businessId);
        break;
      case 'explain_plan_limits':
        result = await this.marketingGrowth.handleExplainPlanLimits(businessId);
        break;
      case 'suggest_upgrade':
        result = await this.marketingGrowth.handleSuggestUpgrade(businessId);
        break;
      case 'toggle_annual_billing':
        result = await this.marketingGrowth.handleToggleAnnualBilling(
          businessId,
          params,
          session?.context?.userEmail as string | undefined,
        );
        break;
      case 'summarize_new_registrations':
        result = await this.marketingGrowth.handleSummarizeNewRegistrations(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'open_billing_settings':
        result =
          await this.marketingGrowth.handleOpenBillingSettings(businessId);
        break;
      case 'summarize_loyalty_program':
        result =
          await this.marketingGrowth.handleSummarizeLoyaltyProgram(businessId);
        break;
      case 'how_to_download_app':
        result = await this.marketingGrowth.handleHowToDownloadApp(businessId);
        break;
      case 'switch_to_consumer_app':
        result =
          await this.marketingGrowth.handleSwitchToConsumerApp(businessId);
        break;
      case 'promo_code_help':
        result = await this.marketingGrowth.handlePromoCodeHelp(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'loyalty_points_balance':
        result = await this.marketingGrowth.handleLoyaltyPointsBalance(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
        );
        break;
      case 'explain_last_push':
        result = await this.pushNotifications.handleExplainLastPush({
          ...params,
          lastPush: params.lastPush ?? session?.context?.lastPush,
        });
        break;
      case 'open_booking_from_push':
        result = await this.pushNotifications.handleOpenBookingFromPush(
          businessId,
          {
            ...params,
            lastPush: params.lastPush ?? session?.context?.lastPush,
          },
          effectivePrompt,
        );
        break;
      case 'offline_queue_status':
        result = await this.pushNotifications.handleOfflineQueueStatus({
          ...params,
          offlineQueueCount:
            params.offlineQueueCount ?? session?.context?.offlineQueueCount,
          online: params.online ?? session?.context?.online,
        });
        break;
      case 'retry_offline_action':
        result = await this.pushNotifications.handleRetryOfflineAction({
          ...params,
          offlineQueueCount:
            params.offlineQueueCount ?? session?.context?.offlineQueueCount,
          online: params.online ?? session?.context?.online,
        });
        break;
      case 'dismiss_push':
        result = await this.pushNotifications.handleDismissPush({
          ...params,
          lastPush: params.lastPush ?? session?.context?.lastPush,
        });
        break;
      case 'end_of_day_summary':
        result = await this.pushNotifications.handleEndOfDaySummary(
          businessId,
          {
            ...params,
            sessionEmployeeId:
              (params.sessionEmployeeId as string | undefined) ??
              (session?.context?.scopedEmployeeId as string | undefined) ??
              employeeId,
          },
        );
        break;
      case 'new_booking_push_actions':
        result = await this.pushNotifications.handleNewBookingPushActions();
        break;
      case 'configure_push_recipients':
        result = await this.pushNotifications.handleConfigurePushRecipients(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'test_push':
        result = await this.pushNotifications.handleTestPush(businessId, {
          ...params,
          userId,
        });
        break;
      case 'notification_history':
        result = await this.pushNotifications.handleNotificationHistory(
          businessId,
          params,
        );
        break;
      case 'toggle_business_email_on_customer_change':
        result =
          await this.pushNotifications.handleToggleBusinessEmailOnCustomerChange(
            businessId,
            params,
            effectivePrompt,
          );
        break;
      case 'enable_notifications':
        result = await this.pushNotifications.handleEnableNotifications(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
          effectivePrompt,
        );
        break;
      case 'appointment_reminder_preferences':
        result =
          await this.pushNotifications.handleAppointmentReminderPreferences(
            businessId,
            {
              ...params,
              sessionCustomerId: session?.context?.customerId as
                | string
                | undefined,
            },
            effectivePrompt,
          );
        break;
      case 'book_package':
        result = await this.selfServiceBooking.handleBookPackage(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId as string | undefined,
          _prompt: effectivePrompt,
        });
        break;
      case 'book_multi_service':
        result = await this.selfServiceBooking.handleBookMultiService(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            cartServiceIds:
              session?.context?.cartServiceIds ?? params.cartServiceIds,
            _prompt: effectivePrompt,
          },
        );
        break;
      case 'check_package_availability':
        result = await this.selfServiceBooking.handleCheckPackageAvailability(
          businessId,
          {
            ...params,
            _prompt: effectivePrompt,
          },
        );
        break;
      case 'check_multi_service_availability':
        result =
          await this.selfServiceBooking.handleCheckMultiServiceAvailability(
            businessId,
            {
              ...params,
              cartServiceIds:
                session?.context?.cartServiceIds ?? params.cartServiceIds,
              _prompt: effectivePrompt,
            },
          );
        break;
      case 'select_subscription_plan':
        result = await this.selfServiceBooking.handleSelectSubscriptionPlan(
          businessId,
          {
            ...params,
            _prompt: effectivePrompt,
          },
        );
        break;
      case 'use_subscription_credit':
        result = await this.selfServiceBooking.handleUseSubscriptionCredit(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
        );
        break;
      case 'cancel_my_booking':
        result = await this.selfServiceBooking.handleCancelMyBooking(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            bookingId: params.bookingId ?? session?.context?.bookingId,
          },
        );
        break;
      case 'reschedule_my_booking':
        result = await this.selfServiceBooking.handleRescheduleMyBooking(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            bookingId: params.bookingId ?? session?.context?.bookingId,
          },
        );
        break;
      case 'cancel_package_visit_self':
        result = await this.selfServiceBooking.handleCancelPackageVisitSelf(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            bookingId: params.bookingId ?? session?.context?.bookingId,
          },
        );
        break;
      case 'reschedule_package_visit_self':
        result = await this.selfServiceBooking.handleReschedulePackageVisitSelf(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            bookingId: params.bookingId ?? session?.context?.bookingId,
          },
        );
        break;
      case 'list_my_appointments':
        result = await this.selfServiceBooking.handleListMyAppointments(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
        );
        break;
      case 'get_manage_link':
        result = await this.selfServiceBooking.handleGetManageLink(businessId, {
          ...params,
          sessionCustomerId: session?.context?.customerId as string | undefined,
          bookingId: params.bookingId ?? session?.context?.bookingId,
        });
        break;
      case 'explain_cancel_policy':
        result = await this.selfServiceBooking.handleExplainCancelPolicy(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
        );
        break;
      case 'book_with_cash':
        result = await this.selfServiceBooking.handleBookWithCash(
          businessId,
          params,
        );
        break;
      case 'book_with_gift_card':
        result = await this.selfServiceBooking.handleBookWithGiftCard(
          businessId,
          {
            ...params,
            _prompt: effectivePrompt,
          },
        );
        break;
      case 'change_provider_on_reschedule':
        result = await this.selfServiceBooking.handleChangeProviderOnReschedule(
          businessId,
          {
            ...params,
            _prompt: effectivePrompt,
          },
        );
        break;
      case 'add_services_to_cart':
        result = await this.selfServiceBooking.handleAddServicesToCart(
          businessId,
          {
            ...params,
            cartServiceIds:
              session?.context?.cartServiceIds ?? params.cartServiceIds,
            _prompt: effectivePrompt,
          },
        );
        break;
      case 'remove_service_from_cart':
        result = await this.selfServiceBooking.handleRemoveServiceFromCart(
          businessId,
          {
            ...params,
            cartServiceIds:
              session?.context?.cartServiceIds ?? params.cartServiceIds,
            _prompt: effectivePrompt,
          },
        );
        break;
      case 'show_cart_total_duration':
        result = await this.selfServiceBooking.handleShowCartTotalDuration(
          businessId,
          {
            ...params,
            cartServiceIds:
              session?.context?.cartServiceIds ?? params.cartServiceIds,
          },
        );
        break;
      case 'explain_recommendation_setup': {
        const parsedExplainSetup = parseExplainRecommendationSetupFromPrompt(
          effectivePrompt,
          params,
        );
        result =
          await this.recommendationProduct.handleExplainRecommendationSetup(
            businessId,
            parsedExplainSetup
              ? {
                  ...params,
                  ...(parsedExplainSetup.serviceId
                    ? { serviceId: parsedExplainSetup.serviceId }
                    : {}),
                  ...(parsedExplainSetup.serviceName
                    ? { serviceName: parsedExplainSetup.serviceName }
                    : {}),
                  ...(parsedExplainSetup.categoryId
                    ? { categoryId: parsedExplainSetup.categoryId }
                    : {}),
                  ...(parsedExplainSetup.categoryName
                    ? { categoryName: parsedExplainSetup.categoryName }
                    : {}),
                }
              : params,
            effectivePrompt,
          );
        break;
      }
      case 'explain_recommendation_analytics': {
        const parsedAnalytics = parseExplainRecommendationAnalyticsFromPrompt(
          effectivePrompt,
          params,
        );
        result =
          await this.recommendationProduct.handleExplainRecommendationAnalytics(
            businessId,
            parsedAnalytics
              ? {
                  ...params,
                  ...(parsedAnalytics.aspect
                    ? { aspect: parsedAnalytics.aspect }
                    : {}),
                  ...(parsedAnalytics.surface
                    ? { surface: parsedAnalytics.surface }
                    : {}),
                  ...(parsedAnalytics.productName
                    ? { productName: parsedAnalytics.productName }
                    : {}),
                  ...(parsedAnalytics.daysAhead
                    ? { daysAhead: parsedAnalytics.daysAhead }
                    : {}),
                }
              : params,
            effectivePrompt,
          );
        break;
      }
      case 'summarize_recommendation_performance': {
        const parsedPerformance =
          parseSummarizeRecommendationPerformanceFromPrompt(
            effectivePrompt,
            params,
          );
        result =
          await this.recommendationProduct.handleSummarizeRecommendationPerformance(
            businessId,
            parsedPerformance
              ? {
                  ...params,
                  ...(parsedPerformance.aspect
                    ? { aspect: parsedPerformance.aspect }
                    : {}),
                  ...(parsedPerformance.surface
                    ? { surface: parsedPerformance.surface }
                    : {}),
                  ...(parsedPerformance.serviceName
                    ? { serviceName: parsedPerformance.serviceName }
                    : {}),
                  ...(parsedPerformance.productName
                    ? { productName: parsedPerformance.productName }
                    : {}),
                  ...(parsedPerformance.daysAhead
                    ? { daysAhead: parsedPerformance.daysAhead }
                    : {}),
                }
              : params,
            effectivePrompt,
          );
        break;
      }
      case 'configure_recommendation_product': {
        const parsedRecommendation =
          parseConfigureRecommendationProductFromPrompt(
            effectivePrompt,
            params,
          );
        result =
          await this.recommendationProduct.handleConfigureRecommendationProduct(
            businessId,
            parsedRecommendation
              ? {
                  ...params,
                  ...(parsedRecommendation.productId
                    ? { productId: parsedRecommendation.productId }
                    : {}),
                  ...(parsedRecommendation.productName
                    ? {
                        productName: parsedRecommendation.productName,
                        name: parsedRecommendation.productName,
                      }
                    : {}),
                  ...(parsedRecommendation.description
                    ? { description: parsedRecommendation.description }
                    : {}),
                  ...(parsedRecommendation.imageUrl
                    ? { imageUrl: parsedRecommendation.imageUrl }
                    : {}),
                  ...(parsedRecommendation.externalLink
                    ? { externalLink: parsedRecommendation.externalLink }
                    : {}),
                  ...(parsedRecommendation.retailPrice !== undefined
                    ? { retailPrice: parsedRecommendation.retailPrice }
                    : {}),
                  ...(parsedRecommendation.wantsImage
                    ? { wantsImage: true }
                    : {}),
                  ...(parsedRecommendation.wantsLink
                    ? { wantsLink: true }
                    : {}),
                  ...(parsedRecommendation.isUpdate ? { isUpdate: true } : {}),
                }
              : params,
            effectivePrompt,
          );
        break;
      }
      case 'link_recommended_products': {
        const parsedLinks = parseLinkRecommendedProductsFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.recommendationProduct.handleLinkRecommendedProducts(
          businessId,
          parsedLinks
            ? {
                ...params,
                ...(parsedLinks.productNames.length > 0
                  ? { productNames: parsedLinks.productNames }
                  : {}),
                ...(parsedLinks.productIds
                  ? { productIds: parsedLinks.productIds }
                  : {}),
                ...(parsedLinks.serviceId
                  ? { serviceId: parsedLinks.serviceId }
                  : {}),
                ...(parsedLinks.serviceName
                  ? { serviceName: parsedLinks.serviceName }
                  : {}),
                ...(parsedLinks.categoryId
                  ? { categoryId: parsedLinks.categoryId }
                  : {}),
                ...(parsedLinks.categoryName
                  ? { categoryName: parsedLinks.categoryName }
                  : {}),
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'create_product':
        result = await this.retailFinance.handleCreateProduct(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'link_product_to_service':
        result = await this.retailFinance.handleLinkProductToService(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'adjust_inventory':
        result = await this.retailFinance.handleAdjustInventory(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'add_retail_sale_to_booking':
        result = await this.retailFinance.handleAddRetailSaleToBooking(
          businessId,
          params,
          userId,
          effectivePrompt,
        );
        break;
      case 'remove_retail_line':
        result = await this.retailFinance.handleRemoveRetailLine(
          businessId,
          params,
          userId,
          effectivePrompt,
        );
        break;
      case 'record_expense':
        result = await this.retailFinance.handleRecordExpense(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'list_expenses':
        result = await this.retailFinance.handleListExpenses(
          businessId,
          params,
        );
        break;
      case 'summarize_pl':
        result = await this.retailFinance.handleSummarizePl(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'commission_report':
        result = await this.retailFinance.handleCommissionReport(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'payout_export':
        result = await this.retailFinance.handlePayoutExport(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'suggest_retail_upsell':
        result = await this.retailFinance.handleSuggestRetailUpsell(
          businessId,
          {
            ...params,
            sessionEmployeeId: session?.context?.employeeId as
              | string
              | undefined,
            _prompt: effectivePrompt,
          },
          effectivePrompt,
        );
        break;
      case 'add_retail_to_my_booking':
        result = await this.retailFinance.handleAddRetailToMyBooking(
          businessId,
          {
            ...params,
            sessionEmployeeId: session?.context?.employeeId as
              | string
              | undefined,
            _prompt: effectivePrompt,
          },
          userId,
          effectivePrompt,
        );
        break;
      case 'list_webhooks':
        result = await this.integrations.handleListWebhooks(businessId);
        break;
      case 'create_webhook':
        result = await this.integrations.handleCreateWebhook(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'test_webhook':
        result = await this.integrations.handleTestWebhook(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'rotate_api_key':
        result = await this.integrations.handleRotateApiKey(
          businessId,
          params,
          userId,
          effectivePrompt,
        );
        break;
      case 'list_zapier_triggers':
        result = await this.integrations.handleListZapierTriggers(businessId);
        break;
      case 'configure_zapier':
        result = await this.integrations.handleConfigureZapier(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'run_accounting_export':
        result = await this.integrations.handleRunAccountingExport(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'configure_zendesk':
        result = await this.integrations.handleConfigureZendesk(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'create_support_ticket':
        result = await this.integrations.handleCreateSupportTicket(
          businessId,
          params,
          effectivePrompt,
          session?.context?.userEmail as string | undefined,
          session?.context?.userName as string | undefined,
        );
        break;
      case 'sync_customer_to_zendesk':
        result = await this.integrations.handleSyncCustomerToZendesk(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'configure_marketing_registration_email':
        result =
          await this.integrations.handleConfigureMarketingRegistrationEmail(
            businessId,
            params,
            effectivePrompt,
          );
        break;
      case 'list_integration_health':
        result =
          await this.integrations.handleListIntegrationHealth(businessId);
        break;
      case 'contact_support':
        result = await this.integrations.handleContactSupport(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            _prompt: effectivePrompt,
          },
          effectivePrompt,
          session?.context?.userEmail as string | undefined,
          session?.context?.userName as string | undefined,
        );
        break;
      case 'open_ticket_for_order':
        result = await this.integrations.handleOpenTicketForOrder(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            _prompt: effectivePrompt,
          },
          effectivePrompt,
          session?.context?.userEmail as string | undefined,
          session?.context?.userName as string | undefined,
        );
        break;
      case 'list_gift_card_orders':
        result = await this.giftFulfillment.handleListGiftCardOrders(
          businessId,
          params,
        );
        break;
      case 'filter_awaiting_creation':
        result = await this.giftFulfillment.handleFilterAwaitingCreation(
          businessId,
          params,
        );
        break;
      case 'assign_card_creator':
        result = await this.giftFulfillment.handleAssignCardCreator(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'assign_delivery_staff':
        result = await this.giftFulfillment.handleAssignDeliveryStaff(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'mark_shipped':
        result = await this.giftFulfillment.handleMarkShipped(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'mark_delivered':
        result = await this.giftFulfillment.handleMarkDelivered(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'cancel_gift_card_order':
        result = await this.giftFulfillment.handleCancelGiftCardOrder(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'extend_cancel_window':
        result = await this.giftFulfillment.handleExtendCancelWindow(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'print_packing_slip':
        result = await this.giftFulfillment.handlePrintPackingSlip(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'gift_card_creation_queue':
        result =
          await this.giftFulfillment.handleGiftCardCreationQueue(businessId);
        break;
      case 'start_card_preparation':
        result = await this.giftFulfillment.handleStartCardPreparation(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'mark_card_ready':
        result = await this.giftFulfillment.handleMarkCardReady(
          businessId,
          params,
          userId,
          effectivePrompt,
        );
        break;
      case 'delivery_queue':
        result = await this.giftFulfillment.handleDeliveryQueue(businessId);
        break;
      case 'accept_delivery':
        result = await this.giftFulfillment.handleAcceptDelivery(
          businessId,
          params,
          userId,
          effectivePrompt,
        );
        break;
      case 'mark_out_for_delivery':
        result = await this.giftFulfillment.handleMarkOutForDelivery(
          businessId,
          params,
          userId,
          effectivePrompt,
        );
        break;
      case 'capture_delivery_proof':
        result = await this.giftFulfillment.handleCaptureDeliveryProof(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'notify_delay':
        result = await this.giftFulfillment.handleNotifyDelay(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'track_gift_card_shipment':
        result = await this.giftFulfillment.handleTrackGiftCardShipment(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
        );
        break;
      case 'enter_shipping_address':
        result = await this.giftFulfillment.handleEnterShippingAddress(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
            _prompt: effectivePrompt,
          },
          effectivePrompt,
        );
        break;
      case 'shipping_method_quote':
        result = await this.giftFulfillment.handleShippingMethodQuote(
          businessId,
          params,
        );
        break;
      case 'order_status_notifications':
        result = await this.giftFulfillment.handleOrderStatusNotifications(
          businessId,
          {
            ...params,
            sessionCustomerId: session?.context?.customerId as
              | string
              | undefined,
          },
        );
        break;
      case 'summarize_unpaid':
        result = await this.payments.handleSummarizeUnpaid(businessId, params);
        break;
      case 'validate_gift_card':
        result = await this.payments.handleValidateGiftCard(businessId, {
          ...params,
          _prompt: effectivePrompt,
        });
        break;
      case 'export_accounting':
        result = await this.payments.handleExportAccounting(businessId, params);
        break;
      case 'export_commissions':
        result = await this.payments.handleExportCommissions(
          businessId,
          params,
        );
        break;
      case 'explain_checkout_total':
        result = await this.payments.handleExplainCheckoutTotal(businessId, {
          ...params,
          _prompt: effectivePrompt,
        });
        break;
      case 'list_subscription_revenue':
        result = await this.payments.handleListSubscriptionRevenue(
          businessId,
          params,
        );
        break;
      case 'configure_cash_payments':
        result = await this.payments.handleConfigureCashPayments(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'configure_business_currency': {
        const currencyCode =
          parseCurrencyFromPrompt(effectivePrompt, params) ??
          (params.currencyCode as string | undefined);
        result = await this.businessCurrency.handleConfigureBusinessCurrency(
          businessId,
          { ...params, currencyCode },
          effectivePrompt,
        );
        break;
      }
      case 'configure_business_tax': {
        const parsedTax = parseBusinessTaxFromPrompt(effectivePrompt, params);
        result = await this.businessTax.handleConfigureBusinessTax(
          businessId,
          parsedTax
            ? { ...params, ...parsedTax, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'configure_privacy_retention': {
        const parsedPrivacy = parseConfigurePrivacyRetentionFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleConfigurePrivacyRetention(
          businessId,
          parsedPrivacy
            ? { ...params, ...parsedPrivacy, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'configure_granular_consent': {
        const parsedConsent = parseConfigureGranularConsentFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleConfigureGranularConsent(
          businessId,
          parsedConsent
            ? { ...params, ...parsedConsent, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'enable_hipaa_mode': {
        const parsedHipaa = parseEnableHipaaModeFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleEnableHipaaMode(
          businessId,
          parsedHipaa
            ? { ...params, ...parsedHipaa, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'configure_hipaa_session_timeout': {
        const parsedHipaaTimeout = parseConfigureHipaaSessionTimeoutFromPrompt(
          effectivePrompt,
          params,
        );
        result =
          await this.businessCompliance.handleConfigureHipaaSessionTimeout(
            businessId,
            parsedHipaaTimeout
              ? {
                  ...params,
                  ...parsedHipaaTimeout,
                  _prompt: effectivePrompt,
                }
              : params,
            effectivePrompt,
          );
        break;
      }
      case 'accept_hipaa_baa': {
        const parsedBaa = parseAcceptHipaaBaaFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleAcceptHipaaBaa(
          businessId,
          userId,
          parsedBaa
            ? { ...params, ...parsedBaa, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_compliance_status': {
        const parsedComplianceStatus = parseExplainComplianceStatusFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleExplainComplianceStatus(
          businessId,
          parsedComplianceStatus
            ? { ...params, ...parsedComplianceStatus, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'list_sub_processors': {
        const parsedSubProcessors = parseListSubProcessorsFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleListSubProcessors(
          businessId,
          userId,
          parsedSubProcessors
            ? { ...params, ...parsedSubProcessors, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_gdpr_checklist': {
        const parsedGdprChecklist = parseExplainGdprChecklistFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleExplainGdprChecklist(
          businessId,
          userId,
          parsedGdprChecklist
            ? { ...params, ...parsedGdprChecklist, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'open_compliance_dashboard': {
        const parsedOpenCompliance = parseOpenComplianceDashboardFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleOpenComplianceDashboard(
          businessId,
          userId,
          parsedOpenCompliance
            ? { ...params, ...parsedOpenCompliance, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'admin_delete_customer_data': {
        const parsedAdminDelete = parseAdminDeleteCustomerDataFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleAdminDeleteCustomerData(
          businessId,
          parsedAdminDelete
            ? { ...params, ...parsedAdminDelete, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'report_data_breach': {
        const parsedBreach = parseReportDataBreachFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleReportDataBreach(
          businessId,
          userId,
          parsedBreach
            ? { ...params, ...parsedBreach, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'send_breach_notification': {
        const parsedSendBreach = parseSendBreachNotificationFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleSendBreachNotification(
          businessId,
          userId,
          parsedSendBreach
            ? { ...params, ...parsedSendBreach, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'list_breach_incidents': {
        const parsedBreachList = parseListBreachIncidentsFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleListBreachIncidents(
          businessId,
          userId,
          parsedBreachList
            ? { ...params, ...parsedBreachList, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'view_phi_access_audit': {
        const parsedPhiAudit = parseViewPhiAccessAuditFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleViewPhiAccessAudit(
          businessId,
          userId,
          parsedPhiAudit
            ? { ...params, ...parsedPhiAudit, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_phi_encryption_status': {
        const parsedPhiEncryption = parseExplainPhiEncryptionStatusFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessCompliance.handleExplainPhiEncryptionStatus(
          businessId,
          parsedPhiEncryption
            ? { ...params, ...parsedPhiEncryption, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_minimum_necessary_phi_access': {
        const parsedMinimumNecessary =
          parseExplainMinimumNecessaryPhiAccessFromPrompt(
            effectivePrompt,
            params,
          );
        result =
          await this.businessCompliance.handleExplainMinimumNecessaryPhiAccess(
            businessId,
            parsedMinimumNecessary
              ? {
                  ...params,
                  ...parsedMinimumNecessary,
                  _prompt: effectivePrompt,
                }
              : params,
            effectivePrompt,
          );
        break;
      }
      case 'explain_hipaa_session_timeout': {
        const parsedHipaaTimeoutExplain =
          parseExplainHipaaSessionTimeoutFromPrompt(effectivePrompt, params);
        result = await this.businessCompliance.handleExplainHipaaSessionTimeout(
          businessId,
          parsedHipaaTimeoutExplain
            ? {
                ...params,
                ...parsedHipaaTimeoutExplain,
                _prompt: effectivePrompt,
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'set_service_tax_rate': {
        const parsedServiceTax = parseSetServiceTaxRateFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessTax.handleSetServiceTaxRate(
          businessId,
          parsedServiceTax
            ? { ...params, ...parsedServiceTax, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
          isExecutionConfirmed(session),
        );
        break;
      }
      case 'explain_business_tax':
        result = await this.businessTax.handleExplainBusinessTax(
          businessId,
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
        );
        break;
      case 'configure_stacked_tax_rules': {
        const parsedStackedTax = parseConfigureStackedTaxRulesFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessTax.handleConfigureStackedTaxRules(
          businessId,
          parsedStackedTax
            ? { ...params, ...parsedStackedTax, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_stacked_tax':
        result = await this.businessTax.handleExplainStackedTax(
          businessId,
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
        );
        break;
      case 'explain_stripe_tax_charge': {
        const parsedStripeTax = parseExplainStripeTaxChargeFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessTax.handleExplainStripeTaxCharge(
          businessId,
          parsedStripeTax
            ? { ...params, ...parsedStripeTax, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'quote_staff_booking_tax': {
        const parsedQuoteTax = parseQuoteStaffBookingTaxFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessTax.handleQuoteStaffBookingTax(
          businessId,
          parsedQuoteTax
            ? { ...params, ...parsedQuoteTax, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'summarize_customer_tax_paid': {
        const parsedCustomerTax = parseSummarizeCustomerTaxPaidFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessTax.handleSummarizeCustomerTaxPaid(
          businessId,
          parsedCustomerTax
            ? { ...params, ...parsedCustomerTax, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'lookup_booking_tax_metadata': {
        const parsedLookupTax = parseLookupBookingTaxMetadataFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessTax.handleLookupBookingTaxMetadata(
          businessId,
          parsedLookupTax
            ? { ...params, ...parsedLookupTax, _prompt: effectivePrompt }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_business_languages':
        result =
          await this.businessLanguages.handleExplainBusinessLanguages(
            businessId,
          );
        break;
      case 'bulk_strip_disabled_locale_translations':
        result =
          await this.businessLanguages.handleBulkStripDisabledLocaleTranslations(
            businessId,
            { ...params, _prompt: effectivePrompt },
            effectivePrompt,
            isExecutionConfirmed(session),
          );
        break;
      case 'configure_business_languages': {
        const parsedLanguages = parseBusinessLanguagesFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessLanguages.handleConfigureBusinessLanguages(
          businessId,
          parsedLanguages
            ? {
                ...params,
                operation: parsedLanguages.operation,
                locales: parsedLanguages.locales,
                defaultLocale:
                  parsedLanguages.operation === 'set_default'
                    ? parsedLanguages.locales[0]
                    : params.defaultLocale,
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_business_date_format':
        result =
          await this.businessDateFormat.handleExplainBusinessDateFormat(
            businessId,
          );
        break;
      case 'preview_business_date_format': {
        const parsedPreview = parseBusinessDateFormatFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.businessDateFormat.handlePreviewBusinessDateFormat(
          businessId,
          parsedPreview
            ? {
                ...params,
                ...(parsedPreview.dateFormat
                  ? { dateFormat: parsedPreview.dateFormat }
                  : {}),
                ...(parsedPreview.timeFormat
                  ? { timeFormat: parsedPreview.timeFormat }
                  : {}),
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'audit_dashboard_date_surfaces':
        result =
          await this.businessDateFormat.handleAuditDashboardDateSurfaces(
            businessId,
          );
        break;
      case 'migrate_dashboard_date_display':
        result =
          await this.businessDateFormat.handleMigrateDashboardDateDisplay(
            businessId,
            { ...params, _prompt: effectivePrompt },
            effectivePrompt,
            isExecutionConfirmed(session),
          );
        break;
      case 'explain_notification_date_format':
        result =
          await this.businessDateFormat.handleExplainNotificationDateFormat(
            businessId,
          );
        break;
      case 'preview_notification_datetime': {
        const messageKind =
          typeof params.messageKind === 'string'
            ? params.messageKind
            : undefined;
        result =
          await this.businessDateFormat.handlePreviewNotificationDatetime(
            businessId,
            messageKind ? { ...params, messageKind } : params,
            effectivePrompt,
          );
        break;
      }
      case 'notify_patient_result_ready':
        result = await this.businessDateFormat.handleNotifyPatientResultReady(
          businessId,
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
          isExecutionConfirmed(session),
        );
        break;
      case 'create_test_order':
      case 'create_catalog_test_order': {
        result = await this.clinicTestOrder.handleCreateTestOrder(
          businessId,
          userId ?? '',
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
          isExecutionConfirmed(session),
        );
        break;
      }
      case 'push_lab_booking_to_patient':
        result = await this.clinicLabBooking.handlePushLabBookingToPatient(
          businessId,
          userId ?? '',
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
          isExecutionConfirmed(session),
        );
        break;
      case 'staff_book_lab_collection':
        result = await this.clinicLabBooking.handleStaffBookLabCollection(
          businessId,
          userId ?? '',
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
          isExecutionConfirmed(session),
        );
        break;
      case 'list_test_orders':
        result = await this.clinicTestOrder.handleListTestOrders(
          businessId,
          userId ?? '',
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
        );
        break;
      case 'enter_test_result': {
        result = await this.clinicTestResult.handleEnterTestResult(
          businessId,
          userId ?? '',
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
          isExecutionConfirmed(session),
        );
        break;
      }
      case 'release_test_result': {
        result = await this.clinicTestResult.handleReleaseTestResult(
          businessId,
          userId ?? '',
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
          isExecutionConfirmed(session),
        );
        break;
      }
      case 'upload_patient_result':
        result = await this.clinicTestResult.handleUploadPatientResult(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'explain_patient_results':
        result = await this.clinicTestResult.handleExplainPatientResults(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'configure_test_reference_range':
        result =
          await this.clinicTestResult.handleConfigureTestReferenceRange(params);
        break;
      case 'list_abnormal_results':
        result = await this.clinicTestResult.handleListAbnormalResults(
          businessId,
          params,
        );
        break;
      case 'explain_patient_chart':
        result = await this.clinicPatientChart.handleExplainPatientChart(
          businessId,
          userId ?? '',
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
        );
        break;
      case 'explain_date_input_format':
        result =
          await this.businessDateFormat.handleExplainDateInputFormat(
            businessId,
          );
        break;
      case 'preview_date_input_parse': {
        const dateStrings = parseDateStringsFromPrompt(effectivePrompt, params);
        result = await this.businessDateFormat.handlePreviewDateInputParse(
          businessId,
          { ...params, dateStrings, _prompt: effectivePrompt },
          effectivePrompt,
        );
        break;
      }
      case 'configure_business_date_format': {
        const parsedDateFormat = parseBusinessDateFormatFromPrompt(
          effectivePrompt,
          params,
        );
        result =
          await this.businessDateFormat.handleConfigureBusinessDateFormat(
            businessId,
            parsedDateFormat
              ? {
                  ...params,
                  ...(parsedDateFormat.dateFormat
                    ? { dateFormat: parsedDateFormat.dateFormat }
                    : {}),
                  ...(parsedDateFormat.timeFormat
                    ? { timeFormat: parsedDateFormat.timeFormat }
                    : {}),
                }
              : params,
            effectivePrompt,
          );
        break;
      }
      case 'configure_package_localized_names': {
        const parsedPackageNames = parsePackageLocalizedNamesFromPrompt(
          effectivePrompt,
          params,
        );
        result =
          await this.packageLocalizedNames.handleConfigurePackageLocalizedNames(
            businessId,
            parsedPackageNames
              ? {
                  ...params,
                  operation: parsedPackageNames.operation,
                  packageId: parsedPackageNames.packageId,
                  packageName: parsedPackageNames.packageName,
                  locale: parsedPackageNames.locale,
                  displayName: parsedPackageNames.displayName,
                }
              : params,
            effectivePrompt,
          );
        break;
      }
      case 'configure_tour_service': {
        const parsedTour = parseConfigureTourServiceFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.tourService.handleConfigureTourService(
          businessId,
          parsedTour
            ? {
                ...params,
                serviceId: parsedTour.serviceId,
                serviceName: parsedTour.serviceName,
                ...(parsedTour.enableTour
                  ? { enableTour: true, serviceType: 'tour' }
                  : {}),
                ...(parsedTour.maxGroupSize !== undefined
                  ? { maxGroupSize: parsedTour.maxGroupSize }
                  : {}),
                ...(parsedTour.difficulty
                  ? { difficulty: parsedTour.difficulty }
                  : {}),
                ...(parsedTour.coverImage
                  ? { coverImage: parsedTour.coverImage }
                  : {}),
                ...(parsedTour.meetingPoint
                  ? { meetingPoint: parsedTour.meetingPoint }
                  : {}),
                ...(parsedTour.includedItems
                  ? { includedItems: parsedTour.includedItems }
                  : {}),
                ...(parsedTour.durationDays !== undefined
                  ? { durationDays: parsedTour.durationDays }
                  : {}),
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_tour_services': {
        const parsedExplainTours = parseExplainTourServicesFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.tourService.handleExplainTourServices(
          businessId,
          parsedExplainTours
            ? {
                ...params,
                serviceId: parsedExplainTours.serviceId,
                serviceName: parsedExplainTours.serviceName,
                daysAhead: parsedExplainTours.daysAhead,
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_tour_booking_record': {
        const parsedRecord = parseExplainTourBookingRecordFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.tourService.handleExplainTourBookingRecord(
          businessId,
          parsedRecord
            ? {
                ...params,
                bookingId: parsedRecord.bookingId,
                customerName: parsedRecord.customerName,
                serviceName: parsedRecord.serviceName,
                aspect: parsedRecord.aspect,
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_tour_calendar_span': {
        const parsedCalendarSpan = parseExplainTourCalendarSpanFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.tourService.handleExplainTourCalendarSpan(
          businessId,
          parsedCalendarSpan
            ? {
                ...params,
                serviceId: parsedCalendarSpan.serviceId,
                serviceName: parsedCalendarSpan.serviceName,
                weekStartDate: parsedCalendarSpan.weekStartDate,
                aspect: parsedCalendarSpan.aspect,
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'list_tour_calendar_week': {
        const parsedCalendarWeek = parseListTourCalendarWeekFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.tourService.handleListTourCalendarWeek(
          businessId,
          parsedCalendarWeek
            ? {
                ...params,
                employeeId: parsedCalendarWeek.employeeId,
                employeeName: parsedCalendarWeek.employeeName,
                serviceId: parsedCalendarWeek.serviceId,
                serviceName: parsedCalendarWeek.serviceName,
                weekStartDate: parsedCalendarWeek.weekStartDate,
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'list_upcoming_tour_departures': {
        const parsedDepartures = parseListUpcomingTourDeparturesFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.tourService.handleListUpcomingTourDepartures(
          businessId,
          parsedDepartures
            ? {
                ...params,
                serviceId: parsedDepartures.serviceId,
                serviceName: parsedDepartures.serviceName,
                daysAhead: parsedDepartures.daysAhead,
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'apply_tour_playbook':
        result = await this.tourService.handleApplyTourPlaybook(
          businessId,
          userId,
          params,
          effectivePrompt,
        );
        break;
      case 'configure_clinic_service': {
        const parsedClinic = parseConfigureClinicServiceFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.clinicService.handleConfigureClinicService(
          businessId,
          parsedClinic
            ? {
                ...params,
                serviceId: parsedClinic.serviceId,
                serviceName: parsedClinic.serviceName,
                ...(parsedClinic.serviceType
                  ? { serviceType: parsedClinic.serviceType }
                  : {}),
                ...(parsedClinic.requiresFasting !== undefined
                  ? { requiresFasting: parsedClinic.requiresFasting }
                  : {}),
                ...(parsedClinic.preparationNotes
                  ? { preparationNotes: parsedClinic.preparationNotes }
                  : {}),
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'explain_clinic_services': {
        const parsedExplainClinic = parseExplainClinicServicesFromPrompt(
          effectivePrompt,
          params,
        );
        result = await this.clinicService.handleExplainClinicServices(
          businessId,
          parsedExplainClinic
            ? {
                ...params,
                serviceId: parsedExplainClinic.serviceId,
                serviceName: parsedExplainClinic.serviceName,
              }
            : params,
          effectivePrompt,
        );
        break;
      }
      case 'apply_clinic_playbook':
        result = await this.clinicService.handleApplyClinicPlaybook(
          businessId,
          userId,
          params,
          effectivePrompt,
        );
        break;
      case 'explain_package_display_name': {
        const parsedDisplayName = parsePackageDisplayNameExplainFromPrompt(
          effectivePrompt,
          params,
        );
        result =
          await this.packageLocalizedNames.handleExplainPackageDisplayName(
            businessId,
            parsedDisplayName
              ? {
                  ...params,
                  packageId: parsedDisplayName.packageId,
                  packageName: parsedDisplayName.packageName,
                  locale: parsedDisplayName.queryLocale,
                }
              : params,
            effectivePrompt,
            typeof session?.context?.locale === 'string'
              ? session.context.locale
              : undefined,
          );
        break;
      }
      case 'explain_business_currency':
        result =
          await this.businessCurrency.handleExplainBusinessCurrency(businessId);
        break;
      case 'explain_stripe_currency_warning':
        result =
          await this.businessCurrency.handleExplainStripeCurrencyWarning(
            businessId,
          );
        break;
      case 'diagnose_stripe_checkout_failure':
        result =
          await this.businessCurrency.handleDiagnoseStripeCheckoutFailure(
            businessId,
          );
        break;
      case 'explain_reports_currency':
        result =
          await this.businessCurrency.handleExplainReportsCurrency(businessId);
        break;
      case 'summarize_revenue_kpis':
        result = await this.businessCurrency.handleSummarizeRevenueKpis(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'bulk_update_service_currency':
        result = await this.businessCurrency.handleBulkUpdateServiceCurrency(
          businessId,
          { ...params, _prompt: effectivePrompt },
          effectivePrompt,
          isExecutionConfirmed(session),
        );
        break;
      case 'adjust_gift_card_balance':
        result = await this.payments.handleAdjustGiftCardBalance(
          businessId,
          { ...params, _prompt: effectivePrompt },
          userId,
        );
        break;
      case 'extend_gift_card_expiry':
        result = await this.payments.handleExtendGiftCardExpiry(
          businessId,
          { ...params, _prompt: effectivePrompt },
          userId,
        );
        break;
      case 'refund_gift_card_order':
        result = await this.payments.handleRefundGiftCardOrder(businessId, {
          ...params,
          _prompt: effectivePrompt,
        });
        break;
      case 'explain_payment_status':
        result = await this.payments.handleExplainPaymentStatus(
          businessId,
          params,
        );
        break;
      case 'collect_cash_confirm':
        result = await this.payments.handleCollectCashConfirm(
          businessId,
          params,
          userId,
        );
        break;
      case 'check_providers_for_service':
        result = await this.payments.handleCheckProvidersForService(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'book_nearest_slot':
        result = await this.payments.handleBookNearestSlot(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'apply_gift_card_code':
        result = await this.payments.handleApplyGiftCardCode(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'check_gift_card_balance':
        result = await this.payments.handleCheckGiftCardBalance(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'buy_gift_card':
        result = await this.payments.handleBuyGiftCard(
          businessId,
          { ...params, _prompt: effectivePrompt },
          false,
        );
        break;
      case 'buy_gift_card_physical':
        result = await this.payments.handleBuyGiftCard(
          businessId,
          { ...params, _prompt: effectivePrompt },
          true,
        );
        break;
      case 'choose_payment_method':
        result = await this.payments.handleChoosePaymentMethod(businessId);
        break;
      case 'pay_online':
        result = await this.payments.handlePayOnline(businessId);
        break;
      case 'pay_cash_at_visit':
        result = await this.payments.handlePayCashAtVisit(businessId);
        break;
      case 'purchase_subscription_checkout':
        result = await this.payments.handlePurchaseSubscriptionCheckout(
          businessId,
          params,
        );
        break;
      case 'explain_why_stripe_required':
        result = await this.payments.handleExplainWhyStripeRequired(businessId);
        break;
      case 'receipt_status':
        result = await this.payments.handleReceiptStatus(businessId, params);
        break;
      case 'create_service':
        if (Array.isArray(params.services) && params.services.length > 1) {
          result = await this.handleCreateServices(
            businessId,
            params,
            services,
            userId,
          );
        } else {
          result = await this.handleCreateService(
            businessId,
            params,
            services,
            userId,
          );
        }
        break;
      case 'create_services':
        result = await this.handleCreateServices(
          businessId,
          params,
          services,
          userId,
        );
        break;
      case 'cancel_bookings':
        if (
          /notify|waitlist|rebook|whatsapp|message|customer|text/i.test(
            effectivePrompt,
          ) ||
          params.notifyCustomers ||
          params.reason
        ) {
          result = await this.handleBulkSmartCancel(
            businessId,
            effectivePrompt,
            params,
            catalog.services,
            catalog.employees,
            employeeId,
            userId,
            { notifyOnly: !/waitlist|rebook/i.test(effectivePrompt) },
          );
        } else {
          result = await this.handleCancelBookings(
            businessId,
            effectivePrompt,
            params,
            catalog.services,
            catalog.employees,
            employeeId,
            userId,
          );
        }
        break;
      case 'bulk_smart_cancel':
        result = await this.handleBulkSmartCancel(
          businessId,
          effectivePrompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      case 'hide_appointments_from_calendar':
        result = await this.handleHideAppointmentsFromCalendar(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          catalog.customers,
          employeeId,
          userId,
        );
        break;
      case 'unhide_appointments_from_calendar':
        result = await this.handleUnhideAppointmentsFromCalendar(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          catalog.customers,
          employeeId,
          userId,
        );
        break;
      case 'fill_slot_from_waitlist':
        result = await this.handleFillSlotFromWaitlist(
          businessId,
          params,
          employeeId,
          userId,
        );
        break;
      case 'list_bookings':
      case 'show_appointments':
        result = await this.handleListBookings(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
          services,
        );
        break;
      case 'check_availability':
        result = await this.handleCheckAvailability(
          businessId,
          params,
          employeeId,
          resolvedEmployee?.name,
          effectivePrompt,
        );
        break;
      case 'summarize_day':
        result = await this.handleSummarizeDay(
          businessId,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
        break;
      case 'summarize_bookings':
        result = await this.handleSummarizeBookings(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
        break;
      case 'analyze_appointments':
        result = await this.handleAnalyzeAppointments(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
        break;
      case 'list_services':
        result = await this.handleListServices(
          businessId,
          services,
          params,
          effectivePrompt,
        );
        break;
      case 'analyze_services':
        result = await this.handleAnalyzeServices(
          businessId,
          effectivePrompt,
          params,
        );
        break;
      case 'summarize_staff':
        result = await this.handleSummarizeStaff(
          businessId,
          effectivePrompt,
          params,
          employees,
        );
        break;
      case 'lookup_customer':
        result = await this.handleLookupCustomer(
          businessId,
          params,
          customers,
          (session?.context?._accessTier as string | undefined) ??
            (session?.context?._actorRole as string | undefined),
        );
        break;
      case 'summarize_waitlist':
        result = await this.handleSummarizeWaitlist(businessId, params);
        break;
      case 'lookup_service_assignment':
        result = await this.handleLookupServiceAssignment(
          businessId,
          employees,
          services,
          params,
          effectivePrompt,
        );
        break;
      case 'list_employees':
        result = this.handleListEmployees(employees, params);
        break;
      case 'list_templates':
        result = this.handleListTemplates(templates);
        break;
      case 'create_schedule_template':
        result = await this.scheduleHandlers.handleCreateScheduleTemplate(
          businessId,
          effectivePrompt,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'mark_no_shows':
        result = await this.handleMarkNoShows(
          businessId,
          effectivePrompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      case 'no_show_recovery':
        result = await this.handleNoShowRecovery(
          businessId,
          effectivePrompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      case 'payment_sweep':
        result = await this.handlePaymentSweep(
          businessId,
          effectivePrompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      case 'update_bookings':
        result = await this.handleUpdateBookings(
          businessId,
          effectivePrompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      case 'day_replan':
        result = await this.handleDayReplan(
          businessId,
          effectivePrompt,
          params,
          employees,
          services,
          timeZone,
          userId,
        );
        break;
      case 'sick_day_replan':
        result = await this.operations.handleSickDayReplan(
          businessId,
          effectivePrompt,
          params,
          employees,
          timeZone,
          userId,
        );
        break;
      case 'import_services_from_menu':
        result = await this.operations.handleImportServicesFromMenu(
          businessId,
          effectivePrompt,
          params,
          userId,
        );
        break;
      case 'update_service_prices':
        result = await this.operations.handleUpdateServicePrices(
          businessId,
          effectivePrompt,
          params,
          services,
          userId,
        );
        break;
      case 'staff_service_matrix':
        result = await this.operations.handleStaffServiceMatrix(
          businessId,
          effectivePrompt,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'check_schedule_compliance':
        result = await this.operations.handleCheckScheduleCompliance(
          businessId,
          effectivePrompt,
          params,
        );
        break;
      case 'revenue_forecast':
        result = await this.operations.handleRevenueForecast(
          businessId,
          effectivePrompt,
          params,
        );
        break;
      case 'create_employee':
        result = await this.operations.handleCreateEmployee(
          businessId,
          params,
          effectivePrompt,
          userId,
        );
        break;
      case 'invite_staff_member':
        result = await this.operations.handleInviteStaffMember(
          businessId,
          params,
          effectivePrompt,
          userId,
        );
        break;
      case 'deactivate_employee':
        result = await this.operations.handleDeactivateEmployee(
          businessId,
          params,
          effectivePrompt,
          userId,
        );
        break;
      case 'configure_online_booking':
        result = await this.operations.handleConfigureOnlineBooking(
          businessId,
          params,
          effectivePrompt,
        );
        break;
      case 'list_waitlist_entries':
        result = await handleListWaitlistEntriesLogic(
          { customerRepo: this.customerRepo },
          businessId,
          params,
        );
        break;
      case 'offer_waitlist_slot':
        result = await handleOfferWaitlistSlotLogic(
          { customerRepo: this.customerRepo },
          businessId,
          enrichOfferWaitlistSlotParams(effectivePrompt, params),
        );
        break;
      case 'fill_unused_slots':
        result = await this.scheduleHandlers.handleFillScheduleGaps(
          businessId,
          effectivePrompt,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'list_schedule_gaps':
        result = await this.scheduleHandlers.handleListScheduleGaps(
          businessId,
          effectivePrompt,
          params,
          employees,
        );
        break;
      case 'apply_schedule':
        result = await this.scheduleHandlers.handleApplySchedule(
          businessId,
          effectivePrompt,
          params,
          employees,
          userId,
        );
        break;
      case 'block_schedule':
        result = await this.scheduleHandlers.handleBlockSchedule(
          businessId,
          effectivePrompt,
          params,
          employees,
          userId,
        );
        break;
      case 'list_time_off_requests':
      case 'approve_time_off_request':
      case 'deny_time_off_request':
        result =
          (await this.providerTimeOff.handleIntent(
            businessId,
            userId!,
            parsed.action,
            params,
            'dashboard',
          )) ?? {
            success: false,
            action: parsed.action,
            summary: 'Could not process time-off request.',
            details: { clarify: true },
          };
        break;
      case 'clear_schedule':
        result = await this.scheduleHandlers.handleClearSchedule(
          businessId,
          effectivePrompt,
          params,
          employees,
          userId,
        );
        break;
      case 'create_direct_schedule':
        result = await this.scheduleHandlers.handleCreateDirectSchedule(
          businessId,
          effectivePrompt,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'assign_employee_services':
        result = await this.handleAssignEmployeeServices(
          businessId,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'summarize_utilization':
        result = await this.handleSummarizeUtilization(
          businessId,
          effectivePrompt,
          params,
          employees,
        );
        break;
      case 'summarize_customers':
        result = await this.handleSummarizeCustomers(
          businessId,
          effectivePrompt,
          params,
        );
        break;
      case 'setup_week_schedule':
        result = await this.scheduleHandlers.handleTemplateCascade(
          businessId,
          effectivePrompt,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'swap_schedules':
        result = await this.scheduling.handleSwapSchedules(
          businessId,
          effectivePrompt,
          params,
          employees,
          userId,
        );
        break;
      case 'rebalance_capacity':
        result = await this.scheduling.handleRebalanceCapacity(
          businessId,
          effectivePrompt,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'holiday_mode':
        result = await this.scheduling.handleHolidayMode(
          businessId,
          effectivePrompt,
          params,
          employees,
          userId,
        );
        break;
      case 'onboard_provider_schedule':
        result = await this.scheduling.handleOnboardProviderSchedule(
          businessId,
          effectivePrompt,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'optimize_schedule':
        result = this.toCommandResult(
          await this.orchestration.runOrchestrationIntent({
            businessId,
            intent: effectivePrompt,
            agentType: AgentType.SCHEDULING_OPTIMIZATION,
            userId,
            date: params.date,
            employeeId,
          }),
        );
        break;
      case 'resolve_conflicts':
        result = this.toCommandResult(
          await this.orchestration.runOrchestrationIntent({
            businessId,
            intent: effectivePrompt,
            agentType: AgentType.CONFLICT_RESOLUTION,
            userId,
            date: params.date,
            employeeId,
          }),
        );
        break;
      case 'reassign_cancelled':
        result = this.toCommandResult(
          await this.orchestration.runOrchestrationIntent({
            businessId,
            intent: effectivePrompt,
            agentType: AgentType.CANCELLATION_RECOVERY,
            userId,
            date: params.date,
            employeeId,
          }),
        );
        break;
      case 'reschedule_booking':
        result = await this.handleRescheduleBooking(
          businessId,
          params,
          employeeId,
          userId,
        );
        break;
      default:
        result = buildUnwiredDashboardIntentResult(parsed.action, {
          reasoning: parsed.reasoning,
          parsed: parsed as unknown as Record<string, unknown>,
        });
        break;
    }

    result.details = {
      ...result.details,
      pipelineTrace,
      confidence,
      playbook: playbook?.name ?? null,
    };
    const final = this.completionPipeline.attachSessionToResult(
      result,
      resolved,
    );
    this.emitCommandEvents(businessId, final);
    return final;
  }

  private emitCommandEvents(businessId: string, result: CommandResult) {
    if (result.details?.needsClarification) {
      this.aiEvents.emitClarify(businessId, {
        action: result.action,
        summary: result.summary,
        missing: result.details.missing,
      });
      return;
    }

    if (result.details?.requiresApproval && result.details?.taskId) {
      this.aiEvents.emitTaskProgress(businessId, {
        taskId: String(result.details.taskId),
        action: result.action,
        status: 'requires_approval',
        summary: result.summary,
      });
      if (result.action === 'resolve_conflicts') {
        this.aiEvents.emitAlert(businessId, {
          alertType: 'conflict',
          title: 'Conflict detected',
          message: result.summary,
          prompt: 'Resolve scheduling conflicts this week',
          taskId: String(result.details.taskId),
          route: '/dashboard/calendar',
        });
      }
      return;
    }

    if (result.success && result.details?.taskId) {
      this.aiEvents.emitTaskCompleted(businessId, {
        taskId: String(result.details.taskId),
        action: result.action,
        success: true,
        summary: result.summary,
      });
    }
  }

  private enrichMultiEmployeeFromPrompt(
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
  ): void {
    if (params.allProviders || (params.employeeNames?.length ?? 0) > 1) return;

    const mentionsMultiple =
      /\bboth\b/i.test(prompt) ||
      /\band\b/i.test(prompt) ||
      /[,/]/.test(prompt);

    if (!mentionsMultiple) return;

    const matched = matchEmployeesInPrompt(prompt, employees);
    if (matched.length > 1) {
      params.employeeNames = matched.map((e) => e.name);
      params.employeeName = null;
    }
  }

  private applyScheduleScopeFromPrompt(
    prompt: string,
    params: Record<string, any>,
    action: string,
    employees: Employee[],
  ): void {
    const scheduleActions = new Set([
      'clear_schedule',
      'create_direct_schedule',
      'block_schedule',
      'swap_schedules',
      'rebalance_capacity',
      'holiday_mode',
      'onboard_provider_schedule',
      'fill_unused_slots',
      'apply_schedule',
      'cancel_bookings',
      'hide_appointments_from_calendar',
    ]);
    if (!scheduleActions.has(action)) return;
    sanitizeProviderScopeFromPrompt(prompt, params, employees);
  }

  private applyBulkAppointmentScope(
    prompt: string,
    params: Record<string, any>,
    action: string,
    services: Service[],
  ): void {
    const bulkActions = new Set([
      'cancel_bookings',
      'bulk_smart_cancel',
      'update_bookings',
      'mark_no_shows',
      'payment_sweep',
      'hide_appointments_from_calendar',
      'unhide_appointments_from_calendar',
    ]);
    if (!bulkActions.has(action)) return;

    const promptService = extractServiceFromPrompt(
      prompt,
      services.map((s) => ({ id: s.id, name: s.name })),
    );
    if (
      (isBulkAllAppointmentsPrompt(prompt) ||
        params.allAppointments === true) &&
      !promptService
    ) {
      params.allAppointments = true;
      delete params.serviceName;
      params.serviceNames = null;
    }

    if (action === 'update_bookings') {
      params.status =
        normalizeBookingStatusValue(params.status) ??
        extractBookingStatusFromPrompt(prompt) ??
        params.status;
      params.paymentStatus =
        normalizePaymentStatusValue(params.paymentStatus) ??
        extractPaymentStatusFromPrompt(prompt) ??
        params.paymentStatus;
    }
  }

  /** Prompt-mentioned entities override stale session / LLM inheritance. */
  private applyPromptEntityOverrides(
    prompt: string,
    params: Record<string, any>,
    action: string,
    employees: Employee[],
    services: Service[],
    customers: Customer[],
    session?: Record<string, any>,
  ): void {
    const promptService = extractServiceFromPrompt(
      prompt,
      services.map((s) => ({ id: s.id, name: s.name })),
    );
    if (isBulkAllAppointmentsPrompt(prompt) && !promptService) {
      params.allAppointments = true;
      delete params.serviceName;
      params.serviceNames = null;
    } else if (promptService) {
      params.serviceName = promptService.name;
      delete params.serviceId;
    }

    if (action === 'create_booking' || action === 'fill_slot_from_waitlist') {
      const bookingCustomer = extractCustomerFromBookingPrompt(
        prompt,
        customers.map((c) => ({ id: c.id, name: c.name })),
        employees.map((e) => ({ id: e.id, name: e.name })),
        params.employeeName as string | undefined,
      );
      if (bookingCustomer) {
        params.customerName = bookingCustomer.name;
        params.customerId = bookingCustomer.id;
      } else {
        params.customerName = null;
        delete params.customerId;
      }
    } else if (action !== 'reschedule_booking') {
      const promptCustomer = matchEntityInPrompt(
        prompt,
        customers.map((c) => ({ name: c.name })),
      );
      if (promptCustomer) {
        params.customerName = promptCustomer.name;
      }
    }

    if (isTeamWideProviderAvailabilityQuery(prompt)) {
      const emp = matchEntityInPrompt(prompt, employees);
      if (!emp) params.employeeName = null;
    } else {
      const emp = matchEntityInPrompt(prompt, employees);
      if (emp) params.employeeName = emp.name;
    }

    if (
      action === 'lookup_service_assignment' &&
      params.date &&
      !params.assignmentLookup
    ) {
      params.assignmentLookup = 'providers_for_service';
    }

    if (action === 'summarize_customers') {
      params.customerMetric = resolveCustomerMetric({}, prompt);
    }

    if (action === 'summarize_bookings') {
      const metric = resolveBookingMetric({}, prompt);
      if (metric) params.bookingMetric = metric;
    }

    if (action === 'analyze_appointments') {
      const metric = resolveAppointmentMetric({}, prompt);
      if (metric) params.appointmentMetric = metric;
    }

    if (action === 'analyze_services') {
      params.serviceMetric = resolveServiceMetric({}, prompt);
    }

    if (action === 'summarize_staff') {
      params.staffMetric = resolveStaffMetric({}, prompt);
    }

    if (
      action === 'cancel_bookings' ||
      action === 'bulk_smart_cancel' ||
      action === 'update_bookings' ||
      action === 'list_bookings' ||
      action === 'show_appointments' ||
      action === 'hide_appointments_from_calendar' ||
      action === 'unhide_appointments_from_calendar'
    ) {
      if (hasExplicitTimeWindow(params, prompt)) {
        const window = parseTimeWindow(params, prompt);
        params.timeFrom = window.timeFrom;
        params.timeTo = window.timeTo;
      }
    }

    enrichCompoundSubStepBookingHints(
      action,
      params,
      prompt,
      params._timeZone as string | undefined,
    );

    applyBookingRescheduleActionHints(action, params, prompt, {
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
      customers: customers.map((c) => ({ id: c.id, name: c.name })),
      timeZone: params._timeZone as string | undefined,
    });
    applyScheduleOpsPromptHints(action, params, prompt, {
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
      timeZone: params._timeZone as string | undefined,
      session,
    });
    applyPackageMultiServicePromptHints(action, params, prompt, {
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
      customers: customers.map((c) => ({ id: c.id, name: c.name })),
      timeZone: params._timeZone as string | undefined,
      session,
    });
    applyGiftCardPaymentsPromptHints(action, params, prompt, { session });
    applyCatalogNotifyPromptHints(action, params, prompt);

    if (action === 'check_providers_for_service' && params.allProviders) {
      params.employeeName = null;
      delete params.employeeId;
    }

    if (
      (action === 'fill_unused_slots' ||
        action === 'create_direct_schedule' ||
        action === 'setup_week_schedule') &&
      isProviderOwnServicesPrompt(prompt)
    ) {
      delete params.serviceName;
      params.serviceNames = null;
    }
  }

  private async classifyIntent(
    businessId: string,
    userId: string | undefined,
    prompt: string,
    context: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, any>,
  ): Promise<ClassifiedIntent | null> {
    const strippedSession =
      stripIntelligenceKeysFromSessionContext(sessionContext);
    const sessionBlock =
      strippedSession &&
      Object.values(strippedSession).some((v) => v != null && v !== '')
        ? `\nActive session context (inherit in params when not overridden by the latest message):\n${JSON.stringify(strippedSession, null, 2)}`
        : '';

    const routeHintBlock = sessionContext?.routeHint
      ? `\nPage context hint (prefer actions relevant to the current dashboard page):\n${sessionContext.routeHint}`
      : '';

    const intelligenceBlock = buildIntelligenceClassifierAppendix(
      extractIntelligenceBlocks(sessionContext),
    );

    const historyMessages = (history ?? [])
      .slice(-10)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${INTENT_SCHEMA}\n\n${CLASSIFIER_MULTILINGUAL_RULES}\n\n${BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES}\n\n${BUSINESS_CURRENCY_CLASSIFIER_RULES}\n\n${BUSINESS_TAX_CLASSIFIER_RULES}\n\n${BUSINESS_COMPLIANCE_CLASSIFIER_RULES}\n\n${CLINIC_TEST_ORDER_CLASSIFIER_RULES}\n\n${CLINIC_TEST_RESULT_CLASSIFIER_RULES}\n\n${CLINIC_PATIENT_CHART_CLASSIFIER_RULES}\n\n${DASHBOARD_CLINIC_LAB_BOOKING_CLASSIFIER_RULES}\n\n${CLINIC_SERVICE_CLASSIFIER_RULES}\n\n${QUOTE_STAFF_BOOKING_TAX_CLASSIFIER_RULES}\n\n${SUMMARIZE_CUSTOMER_TAX_PAID_CLASSIFIER_RULES}\n\n${LOOKUP_BOOKING_TAX_METADATA_CLASSIFIER_RULES}\n\n${STRIPE_TAX_CHARGE_CLASSIFIER_RULES}\n\n${BUSINESS_LANGUAGES_CLASSIFIER_RULES}\n\n${BUSINESS_DATE_FORMAT_CLASSIFIER_RULES}\n\n${PACKAGE_LOCALIZED_NAMES_CLASSIFIER_RULES}\n\n${CATALOG_NOTIFY_CLASSIFIER_RULES}\n\n${DASHBOARD_PACKAGE_DISPLAY_NAME_CLASSIFIER_RULES}\n\n${TOUR_SERVICE_CLASSIFIER_RULES}\n\n${TOUR_BOOKING_RECORD_CLASSIFIER_RULES}\n\n${TOUR_CALENDAR_SPAN_CLASSIFIER_RULES}\n\n${TOUR_CALENDAR_WEEK_CLASSIFIER_RULES}\n\n${UPCOMING_TOUR_DEPARTURES_CLASSIFIER_RULES}\n\n${RECOMMENDATION_PRODUCT_CLASSIFIER_RULES}\n\n${RECOMMENDATION_ANALYTICS_CLASSIFIER_RULES}\n\n${RECOMMENDATION_PERFORMANCE_CLASSIFIER_RULES}\n\n${STRIPE_CURRENCY_WARNING_CLASSIFIER_RULES}\n\n${STRIPE_CHECKOUT_FAILURE_CLASSIFIER_RULES}\n\n${REPORTS_CURRENCY_CLASSIFIER_RULES}\n\n${REVENUE_KPIS_CLASSIFIER_RULES}\n\n${this.promptSecurity.getClassifierSecurityRules()}\n\n${context}${intelligenceBlock}${sessionBlock}${routeHintBlock}`,
      },
      ...historyMessages,
      {
        role: 'user',
        content: this.promptSecurity.prepareUserPromptForClassifier(prompt),
      },
    ];

    const response = await this.openAi.chatCompletion(
      {
        businessId,
        surface: 'dashboard',
        operation: 'classify_intent',
        actorType: 'manager',
        userId,
      },
      {
        messages,
        responseFormat: 'json_object',
        temperature: 0.1,
        maxTokens: 500,
      },
    );

    const raw = response?.choices[0]?.message?.content;
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (err: any) {
      this.logger.error(`Intent classification parse failed: ${err.message}`);
      return null;
    }
  }

  private resolveEmployee(
    employees: Employee[],
    name: string,
  ): Employee | undefined {
    return this.fuzzyMatchByName(employees, name);
  }

  private resolveService(
    services: Service[],
    name: string,
  ): Service | undefined {
    return fuzzyMatchServiceByName(services, name);
  }

  /** Resolve one or many service names (supports "hairdrying / hairstyle", arrays from LLM). */
  private resolveServices(
    services: Service[],
    params: { serviceName?: string | null; serviceNames?: string[] | null },
  ): Service[] {
    const rawNames: string[] = [];

    if (params.serviceNames?.length) {
      rawNames.push(...params.serviceNames);
    } else if (params.serviceName) {
      rawNames.push(
        ...params.serviceName
          .split(/[/,]|(?:\s+and\s+)|(?:\s+or\s+)/i)
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }

    const resolved: Service[] = [];
    const seen = new Set<string>();
    for (const name of rawNames) {
      const svc = this.resolveService(services, name);
      if (svc && !seen.has(svc.id)) {
        seen.add(svc.id);
        resolved.push(svc);
      }
    }
    return resolved;
  }

  private resolveCustomer(
    customers: Customer[],
    name: string,
  ): Customer | undefined {
    return this.fuzzyMatchByName(customers, name);
  }

  private fuzzyMatchByName<T extends { name: string }>(
    items: T[],
    name: string,
  ): T | undefined {
    const lower = name.toLowerCase().trim();
    return (
      items.find((item) => item.name.toLowerCase() === lower) ||
      items.find((item) => item.name.toLowerCase().includes(lower)) ||
      items.find((item) => lower.includes(item.name.toLowerCase()))
    );
  }

  /** Snap HH:mm down to nearest 10-minute boundary (matches booking UI). */
  private snapTo10min(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    return `${String(h).padStart(2, '0')}:${String(Math.floor(m / 10) * 10).padStart(2, '0')}`;
  }

  private toCommandResult(result: OrchestrationResult): CommandResult {
    return {
      success: result.success,
      action: result.action,
      summary: result.summary,
      details: {
        ...result.details,
        taskId: result.taskId,
        requiresApproval: result.requiresApproval,
      },
    };
  }

  // ─── Action handlers ────────────────────────────────────────────────────────

  private async handleCreateBooking(
    businessId: string,
    params: any,
    employees: Employee[],
    services: Service[],
    customers: Customer[],
    userId?: string,
    prompt?: string,
  ): Promise<CommandResult> {
    params = enrichDashboardCreateBookingParams({ ...params }, prompt);

    const serviceResolved = await this.resolveCreateBookingServiceForParams(
      businessId,
      services,
      params,
    );
    if (serviceResolved.noMatchSummary) {
      return {
        success: false,
        action: 'create_booking',
        summary: serviceResolved.noMatchSummary,
        details: { params },
      };
    }

    const service = serviceResolved.service;
    const customer = params.customerId
      ? customers.find((c) => c.id === params.customerId)
      : params.customerName
        ? this.resolveCustomer(customers, params.customerName)
        : undefined;

    if (!service) {
      return {
        success: false,
        action: 'create_booking',
        summary: 'Cannot book appointment — specify which service to book.',
        details: { params },
      };
    }

    let resolvedEmployee = params.employeeId
      ? employees.find((e) => e.id === params.employeeId)
      : params.employeeName
        ? this.resolveEmployee(employees, params.employeeName)
        : undefined;
    let timeSlot = params.timeSlot ? this.snapTo10min(params.timeSlot) : null;

    if (params.bookingFirstAvailable) {
      const firstAvailable = await this.pickCreateBookingFirstAvailable(
        businessId,
        service,
        params,
        employees,
        resolvedEmployee,
        prompt,
      );
      if (!firstAvailable.ok) {
        return {
          success: false,
          action: 'create_booking',
          summary: firstAvailable.summary,
          details: firstAvailable.details ?? { params },
        };
      }

      const pick = firstAvailable.pick;
      resolvedEmployee =
        employees.find((entry) => entry.id === pick.employeeId) ?? resolvedEmployee;
      timeSlot = this.snapTo10min(pick.timeSlot);
      params.date = pick.isoDay;
      params.employeeName = pick.employeeName;
      params.employeeId = pick.employeeId;
    }

    const wantsProviderFallback =
      !params.bookingFirstAvailable &&
      !!params.date &&
      !!timeSlot &&
      (params.fallbackAnyProvider === true ||
        (Array.isArray(params.providerFallbackNames) &&
          params.providerFallbackNames.length > 0) ||
        (Array.isArray(params.employeeNames) &&
          params.employeeNames.length >= 2));

    if (wantsProviderFallback && timeSlot) {
      const fixedTimeSlot = timeSlot;
      const timeZone = params._timeZone ?? 'UTC';
      const isoDay = toIsoDay(params.date, timeZone);
      const priorityNames: string[] = Array.isArray(
        params.providerFallbackNames,
      )
        ? params.providerFallbackNames
        : Array.isArray(params.employeeNames) &&
            params.employeeNames.length >= 2
          ? params.employeeNames
          : params.employeeName
            ? [params.employeeName]
            : resolvedEmployee
              ? [resolvedEmployee.name]
              : [];

      const providerPriority = priorityNames
        .map((name) => this.resolveEmployee(employees, name))
        .filter((e): e is Employee => !!e)
        .map((e) => ({ id: e.id, name: e.name }));

      const pick = await this.slotResolver.resolveWithFallback({
        businessId,
        serviceId: service.id,
        isoDay,
        timeSlot: fixedTimeSlot,
        timeZone,
        providerPriority,
        fallbackAnyProvider: params.fallbackAnyProvider === true,
        allActiveProviders: employees
          .filter((e) => e.isActive)
          .map((e) => ({ id: e.id, name: e.name })),
      });

      if (!pick) {
        const tried =
          providerPriority.map((p) => p.name).join(', ') ||
          'requested providers';
        return {
          success: false,
          action: 'create_booking',
          summary: `No one is available for ${service.name} at ${timeSlot} on ${formatDateDisplay(isoDay)}. Tried: ${tried}${
            params.fallbackAnyProvider ? ' and other active providers' : ''
          }.`,
          details: { params, isoDay, timeSlot },
        };
      }

      resolvedEmployee = employees.find((e) => e.id === pick.employeeId);
      timeSlot = pick.timeSlot;
      params.date = pick.isoDay;
      params.employeeName = pick.employeeName;
      params.employeeId = pick.employeeId;
    }

    if (!resolvedEmployee || !params.date || !timeSlot) {
      return {
        success: false,
        action: 'create_booking',
        summary: 'Cannot book appointment — missing provider, date, or time.',
        details: { params },
      };
    }

    const timeZone = params._timeZone ?? 'UTC';
    const isoDay = toIsoDay(params.date, timeZone);
    const availability = await this.slotResolver.checkSlotAvailability(
      businessId,
      resolvedEmployee.id,
      resolvedEmployee.name,
      service.id,
      isoDay,
      timeSlot,
      timeZone,
    );
    if (!availability.available) {
      return {
        success: false,
        action: 'create_booking',
        summary: this.slotResolver.describeUnavailable(
          availability,
          service.name,
          timeSlot,
          formatDateDisplay(isoDay),
        ),
        details: {
          params,
          availability,
          isoDay,
          timeSlot,
        },
      };
    }

    const startTime = buildUtcStartTimeFromDayAndTime(params.date, timeSlot);

    const plan = this.planBuilder.buildCreateBookingPlan({
      businessId,
      employeeId: resolvedEmployee.id,
      serviceId: service.id,
      customerId: customer?.id,
      startTime,
      notes: params.notes || params.reason || undefined,
      userId,
      employeeName: resolvedEmployee.name,
      serviceName: service.name,
      customerName: customer?.name,
      date: formatDateDisplay(params.date),
      timeSlot,
      useSubscriptionId: params.useSubscriptionId,
      metadata: params._bookingMetadata,
      paymentStatus: params._paymentStatus,
      packagePurchaseId: params.packagePurchaseId,
      multiServiceGroupId: params.multiServiceGroupId,
      resourceIds: params.resourceIds,
      sameVisitMultiService: params.sameVisitMultiService,
    });

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: true,
      }),
    );
  }

  private async resolveCreateBookingServiceForParams(
    businessId: string,
    services: Service[],
    params: Record<string, unknown>,
  ): Promise<{
    service: Service | undefined;
    noMatchSummary: string | null;
  }> {
    const serviceRank = resolveServiceRankParam(params.serviceRank);
    const bookingCounts =
      serviceRank === 'most_popular'
        ? await loadServiceBookingCounts90d(
            this.bookingRepo,
            businessId,
            services.map((entry) => entry.id),
          )
        : null;

    const catalog = services.map((entry) => {
      const rank = extractServiceRankMetadata(entry.metadata);
      return {
        id: entry.id,
        name: entry.name,
        price: Number(entry.price),
        durationMinutes: entry.durationMinutes,
        bookingCount: bookingCounts?.get(entry.id) ?? 0,
        ...(rank.isFeatured ? { isFeatured: true } : {}),
        ...(rank.serviceTier ? { serviceTier: rank.serviceTier } : {}),
      };
    });

    const resolved = resolveDashboardCreateBookingService(
      catalog,
      params,
      (name) => {
        const found = this.resolveService(services, name);
        return found ? catalog.find((entry) => entry.id === found.id) : undefined;
      },
    );
    if (resolved.noMatchSummary) {
      return { service: undefined, noMatchSummary: resolved.noMatchSummary };
    }

    const service = resolved.service
      ? services.find((entry) => entry.id === resolved.service!.id)
      : undefined;
    return { service, noMatchSummary: null };
  }

  private async pickCreateBookingFirstAvailable(
    businessId: string,
    service: Service,
    params: any,
    employees: Employee[],
    resolvedEmployee: Employee | undefined,
    prompt?: string,
  ): Promise<
    | {
        ok: true;
        pick: {
          employeeId: string;
          employeeName: string;
          timeSlot: string;
          isoDay: string;
        };
      }
    | {
        ok: false;
        summary: string;
        details?: Record<string, unknown>;
      }
  > {
    const timeZone = params._timeZone ?? 'UTC';
    const searchTargets = params.allProviders
      ? employees.filter((e) => e.isActive)
      : resolvedEmployee
        ? [resolvedEmployee]
        : [];

    if (searchTargets.length === 0) {
      return {
        ok: false,
        summary: params.allProviders
          ? 'No active providers found to search for availability.'
          : 'Specify a provider or say "any provider" for first-available booking.',
      };
    }

    const notBeforeTime = resolveFirstAvailableNotBeforeTime(params);
    const windowQueries = buildDashboardFirstAvailableWindowQueries(
      params,
      prompt,
      timeZone,
    );

    let pick: {
      employeeId: string;
      employeeName: string;
      timeSlot: string;
      isoDay: string;
    } | null = null;

    if (shouldScanExplicitAvailabilityWindows(params, windowQueries)) {
      const orPick = await findDashboardFirstAvailableAcrossWindows(
        windowQueries,
        async ({ isoDay, timeOfDay, notBeforeTime: windowNotBefore }) =>
          this.findFirstAvailableBookingSlotOnDay(
            businessId,
            service,
            searchTargets,
            isoDay,
            timeZone,
            timeOfDay,
            windowNotBefore ?? notBeforeTime,
          ),
      );
      if (orPick) {
        pick = orPick;
      }
    } else {
      const startIsoDay = params.date
        ? toIsoDay(params.date, timeZone)
        : toIsoDay(todayDisplay(timeZone), timeZone);
      const legacyPick = await this.findFirstAvailableBookingSlot(
        businessId,
        service,
        startIsoDay,
        searchTargets,
        timeZone,
        notBeforeTime,
      );
      if (legacyPick) {
        pick = {
          employeeId: legacyPick.employee.id,
          employeeName: legacyPick.employee.name,
          timeSlot: legacyPick.timeSlot,
          isoDay: legacyPick.isoDay,
        };
      }
    }

    if (!pick) {
      const afterLabel = notBeforeTime ? ` after ${notBeforeTime}` : '';
      return {
        ok: false,
        summary: `No upcoming open ${service.name} slots found${afterLabel}${
          params.allProviders
            ? ' for any provider'
            : ` for ${resolvedEmployee?.name ?? 'that provider'}`
        }${
          shouldScanExplicitAvailabilityWindows(params, windowQueries)
            ? ' in the requested time windows.'
            : ' in the next two weeks.'
        }`,
        details: {
          serviceName: service.name,
          allProviders: !!params.allProviders,
          timeFrom: params.timeFrom ?? null,
          availabilityWindows: params.availabilityWindows ?? null,
        },
      };
    }

    return { ok: true, pick };
  }

  private static readonly FIRST_AVAILABLE_SCAN_DAYS = 14;

  private async findFirstAvailableBookingSlot(
    businessId: string,
    service: Service,
    startIsoDay: string,
    providers: Employee[],
    timeZone = 'UTC',
    notBeforeTime?: string | null,
  ): Promise<{ employee: Employee; timeSlot: string; isoDay: string } | null> {
    let best: {
      employee: Employee;
      timeSlot: string;
      isoDay: string;
      sortKey: number;
    } | null = null;

    for (
      let offset = 0;
      offset < AiCommandService.FIRST_AVAILABLE_SCAN_DAYS;
      offset++
    ) {
      const isoDay = addDaysToDateKey(startIsoDay, offset, timeZone);

      for (const provider of providers) {
        const row = await this.getProviderAvailabilityForService(
          businessId,
          provider.id,
          service.id,
          isoDay,
        );
        if (!row.hasServiceBlock || row.openSlots.length === 0) continue;

        for (const slot of row.openSlots) {
          if (
            !isWallClockSlotBookable(
              isoDay,
              slot.start,
              timeZone,
              notBeforeTime,
            )
          )
            continue;

          const sortKey = offset * 24 * 60 + timeToMinutes(slot.start);
          if (!best || sortKey < best.sortKey) {
            best = {
              employee: provider,
              timeSlot: slot.start,
              isoDay,
              sortKey,
            };
          }
        }
      }
    }

    return best
      ? {
          employee: best.employee,
          timeSlot: best.timeSlot,
          isoDay: best.isoDay,
        }
      : null;
  }

  private async findFirstAvailableBookingSlotOnDay(
    businessId: string,
    service: Service,
    providers: Employee[],
    isoDay: string,
    timeZone: string,
    timeOfDay: TimeOfDayWindow | null,
    notBeforeTime: string | null,
  ) {
    const rows = await Promise.all(
      providers.map(async (provider) => {
        const row = await this.getProviderAvailabilityForService(
          businessId,
          provider.id,
          service.id,
          isoDay,
        );
        return {
          id: provider.id,
          name: provider.name,
          hasServiceBlock: row.hasServiceBlock,
          openSlots: row.openSlots,
        };
      }),
    );

    return findEarliestSlotOnDayForProviders({
      isoDay,
      timeZone,
      timeOfDay,
      notBeforeTime,
      providers: rows,
      isSlotBookable: isWallClockSlotBookable,
    });
  }

  private async handleAssignEmployeeServices(
    businessId: string,
    params: any,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const resolved = resolveAssignEmployeeServicesInput(
      employees,
      services,
      params,
    );
    if (!resolved.ok) {
      return {
        success: false,
        action: 'assign_employee_services',
        summary: resolved.summary,
        details: resolved.details ?? { params },
      };
    }

    const plan = this.planBuilder.buildAssignEmployeeServicesPlan({
      businessId,
      employeeId: resolved.employeeId,
      employeeName: resolved.employeeName,
      serviceIds: resolved.serviceIds,
      serviceNames: resolved.serviceNames,
      userId,
    });

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: true,
      }),
    );
  }

  private async handleSummarizeUtilization(
    businessId: string,
    prompt: string,
    params: any,
    employees: Employee[],
  ): Promise<CommandResult> {
    const range =
      resolveDateRange(params, prompt) ??
      (() => {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 6);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      })();

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const util = await Promise.all(
      employees.map(async (e) => ({
        employeeName: e.name,
        ...(await this.schedulingEngine.getEmployeeUtilization(
          e.id,
          start,
          end,
        )),
      })),
    );

    const sorted = [...util].sort(
      (a, b) => (a.utilizationPercent ?? 0) - (b.utilizationPercent ?? 0),
    );
    const lines = sorted.map(
      (u) =>
        `• ${u.employeeName}: ${u.utilizationPercent ?? 0}% utilized (${u.bookedMinutes ?? 0}/${u.totalMinutes ?? 0} min)`,
    );

    return {
      success: true,
      action: 'summarize_utilization',
      summary: [`Utilization ${range.start} → ${range.end}:`, ...lines].join(
        '\n',
      ),
      details: { range, utilization: sorted },
    };
  }

  private async handleSummarizeCustomers(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    const metric = resolveCustomerMetric(params, prompt);
    const limit =
      typeof params.limit === 'number' && params.limit > 0
        ? Math.min(params.limit, MAX_AI_CUSTOMER_ROWS)
        : Math.min(extractLimitFromPrompt(prompt), MAX_AI_CUSTOMER_ROWS);

    const insights = await this.customerService.getCustomerInsights(
      businessId,
      metric,
      limit,
    );
    const { rows, summary } = insights;

    const metricTitles: Record<CustomerInsightMetric, string> = {
      most_no_shows: 'Customers with the most no-shows',
      most_bookings: 'Customers with the most appointments',
      most_cancellations: 'Customers with the most cancellations',
      at_risk: 'At-risk customers (90+ days since last visit)',
      high_no_show: 'High no-show segment customers',
      vip: 'VIP customers',
      top_spenders: 'Top customers by total paid',
      new_customers: 'New customers (no appointments yet)',
      overview: 'Customer overview',
    };

    const lines: string[] = [
      metricTitles[metric] +
        (metric === 'top_spenders' ? ` (top ${limit})` : '') +
        ':',
    ];

    if (metric === 'overview') {
      lines.push(
        `• ${summary.totalCustomers} active customers`,
        `• ${summary.totalNoShows} total no-shows across all customers`,
        `• ${summary.atRiskCount} at-risk · ${summary.highNoShowCount} high no-show · ${summary.vipCount} VIP`,
      );
      if (rows.length > 0) {
        lines.push('', 'Top no-shows:');
      }
    }

    if (rows.length === 0) {
      lines.push('• No matching customers found.');
    } else {
      for (const row of rows) {
        const cancelled = row.stats.byStatus.cancelled ?? 0;
        const completed = row.stats.byStatus.completed ?? 0;
        let detail = `${row.stats.noShowCount} no-show(s), ${row.stats.total} total appt(s)`;
        if (metric === 'most_cancellations')
          detail = `${cancelled} cancellation(s)`;
        if (metric === 'most_bookings')
          detail = `${row.stats.total} appointment(s)`;
        if (metric === 'at_risk' && row.stats.lastBookingAt) {
          detail = `last visit ${formatDateDisplay(row.stats.lastBookingAt)}, ${completed} completed`;
        }
        if (metric === 'vip')
          detail = `${completed} completed, ${row.stats.total} total`;
        if (metric === 'top_spenders') {
          const currency = row.currency ?? 'USD';
          detail = `${currency} ${Number(row.paidTotal ?? 0).toFixed(2)} from ${row.paidCount ?? 0} paid appt(s)`;
        }
        if (metric === 'new_customers') {
          detail =
            row.stats.total === 0
              ? 'no appointments yet'
              : `${row.stats.total} appointment(s)`;
        }
        lines.push(
          `• ${row.name}: ${detail}${metric === 'top_spenders' ? '' : ` · segment: ${row.segment}`}`,
        );
      }
    }

    return {
      success: true,
      action: 'summarize_customers',
      summary: lines.join('\n'),
      details: {
        metric,
        rowCount: rows.length,
        summary,
      },
    };
  }

  private async handleSummarizeBookings(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employeeId?: string,
    employeeName?: string,
  ): Promise<CommandResult> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    const businessSettings = business?.settings ?? {};

    const metric = resolveBookingMetric(params, prompt) ?? 'overview';
    const range =
      resolveDateRange(params, prompt) ??
      (() => {
        const iso = params.date ?? new Date().toISOString().split('T')[0];
        return { start: iso, end: iso };
      })();

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(start, end),
    };
    if (employeeId) where.employeeId = employeeId;

    const bookings = await this.bookingRepo.find({
      where: where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    return composeSummarizeBookingsResult({
      bookings,
      businessSettings,
      metric,
      range,
      employeeId,
      employeeName,
      statusFilter: params.statusFilter as string | undefined,
    });
  }

  private async handleListServices(
    businessId: string,
    services: Service[],
    params: Record<string, any>,
    prompt: string,
  ): Promise<CommandResult> {
    const withBudgetAndRank = enrichServiceDiscoveryFromPrompt(params, prompt);
    const enriched = enrichListServicesParamsFromPrompt(prompt, withBudgetAndRank);

    if (services.length === 0) {
      return {
        success: true,
        action: 'list_services',
        summary:
          'No services in catalog yet. Add one with "Add service facemassage 60min $50".',
        details: { services: [] },
      };
    }

    const bookingCounts = await loadServiceBookingCounts90d(
      this.bookingRepo,
      businessId,
      services.map((service) => service.id),
    );

    const toCatalogRow = (service: Service) => {
      const rank = extractServiceRankMetadata(service.metadata);
      return {
        id: service.id,
        name: service.name,
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
        currency: service.currency || 'USD',
        description: service.description,
        bookingCount: bookingCounts.get(service.id) ?? 0,
        ...(rank.isFeatured ? { isFeatured: true } : {}),
        ...(rank.serviceTier ? { serviceTier: rank.serviceTier } : {}),
      };
    };

    if (enriched.serviceName) {
      const target = this.resolveService(services, String(enriched.serviceName));
      if (target) {
        const composed = composeDashboardListServicesBudgetResponse({
          matchedServices: [toCatalogRow(target)],
          maxPrice: withBudgetAndRank.maxPrice,
          minPrice: withBudgetAndRank.minPrice,
          preferShortDuration: withBudgetAndRank.preferShortDuration,
          minDurationMinutes: withBudgetAndRank.minDurationMinutes,
          header: `${target.name}:`,
        });
        if (composed.services.length === 1) {
          const service = composed.services[0]!;
          const currency = service.currency || 'USD';
          return {
            success: true,
            action: 'list_services',
            summary: [
              `${service.name}:`,
              `• Duration: ${service.durationMinutes} min${service.bufferMinutes ? ` (+${service.bufferMinutes} min buffer)` : ''}`,
              `• Price: ${currency} ${Number(service.price).toFixed(2)}`,
              service.description ? `• ${service.description}` : '',
            ]
              .filter(Boolean)
              .join('\n'),
            details: { services: composed.detailsServices },
          };
        }
        return {
          success: composed.success,
          action: 'list_services',
          summary: composed.summary,
          details: { services: composed.detailsServices },
        };
      }
    }

    const hasFilter = !!(
      enriched.serviceCategory ||
      (Array.isArray(enriched.serviceNames) && enriched.serviceNames.length)
    );
    const catalog = services.map(toCatalogRow);
    const matched = hasFilter
      ? resolveServicesFromCatalogParams(catalog, enriched)
      : catalog;

    if (hasFilter && matched.length === 0) {
      const category = enriched.serviceCategory ?? enriched.serviceName;
      return {
        success: false,
        action: 'list_services',
        summary: buildRankEmptyCategorySummary(String(category), catalog),
        details: { services: [] },
      };
    }

    const serviceRank = resolveServiceRankParam(withBudgetAndRank.serviceRank);
    if (serviceRank) {
      const rankLimit = resolveListServicesRankLimitFromPrompt(
        prompt,
        withBudgetAndRank,
      );
      const composed = composeDashboardListServicesRankResponse({
        matchedServices: matched,
        serviceRank,
        limit: rankLimit,
        maxPrice: withBudgetAndRank.maxPrice,
        serviceCategory: enriched.serviceCategory ?? null,
        allCatalogServices: catalog,
      });
      return {
        success: composed.success,
        action: 'list_services',
        summary: composed.summary,
        details: { services: composed.detailsServices },
      };
    }

    const composed = composeDashboardListServicesBudgetResponse({
      matchedServices: matched,
      maxPrice: withBudgetAndRank.maxPrice,
      minPrice: withBudgetAndRank.minPrice,
      preferShortDuration: withBudgetAndRank.preferShortDuration,
      minDurationMinutes: withBudgetAndRank.minDurationMinutes,
      maxTotalPrice: withBudgetAndRank.maxTotalPrice,
      serviceCount: withBudgetAndRank.serviceCount,
      header:
        withBudgetAndRank.maxTotalPrice != null
          ? 'Service combos within budget:'
          : withBudgetAndRank.maxPrice != null
            ? 'Services within budget:'
            : `Service catalog (${matched.length}):`,
    });

    return {
      success: composed.success,
      action: 'list_services',
      summary: composed.summary,
      details: { services: composed.detailsServices },
    };
  }

  private async handleAnalyzeServices(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    const metric = resolveServiceMetric(params, prompt);
    const limit =
      typeof params.limit === 'number' && params.limit > 0
        ? Math.min(params.limit, 20)
        : extractLimitFromPrompt(prompt);

    const range =
      resolveDateRange(params, prompt) ??
      (() => {
        const start = new Date();
        start.setUTCDate(start.getUTCDate() - 30);
        const end = new Date();
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      })();

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(start, end),
        status: Not(BookingStatus.CANCELLED),
      },
      relations: { service: true },
    });

    const byService = new Map<
      string,
      { name: string; count: number; revenue: number; currency: string }
    >();
    for (const b of bookings) {
      if (!b.service) continue;
      const key = b.service.id;
      const row = byService.get(key) ?? {
        name: b.service.name,
        count: 0,
        revenue: 0,
        currency: b.service.currency || 'USD',
      };
      row.count += 1;
      row.revenue += Number(b.service.price ?? 0);
      byService.set(key, row);
    }

    let rows = [...byService.values()];
    const titles: Record<ServiceInsightMetric, string> = {
      most_booked: 'Most booked services',
      top_revenue: 'Top services by revenue',
      least_booked: 'Least booked services',
      overview: 'Service performance overview',
    };

    switch (metric) {
      case 'top_revenue':
        rows.sort((a, b) => b.revenue - a.revenue);
        break;
      case 'least_booked':
        rows.sort((a, b) => a.count - b.count);
        break;
      case 'most_booked':
      default:
        rows.sort((a, b) => b.count - a.count);
        break;
    }

    rows = rows.slice(0, limit);
    const rangeLabel =
      range.start === range.end
        ? formatDateDisplay(range.start)
        : `${formatDateDisplay(range.start)} → ${formatDateDisplay(range.end)}`;

    const lines = [`${titles[metric]} (${rangeLabel}):`];
    if (rows.length === 0) {
      lines.push('• No service bookings in this period.');
    } else {
      for (const row of rows) {
        lines.push(
          `• ${row.name}: ${row.count} booking(s) · ${row.currency} ${row.revenue.toFixed(2)} revenue`,
        );
      }
    }

    return {
      success: true,
      action: 'analyze_services',
      summary: lines.join('\n'),
      details: { metric, range, rows },
    };
  }

  private async handleSummarizeStaff(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
  ): Promise<CommandResult> {
    const metric = resolveStaffMetric(params, prompt);
    const limit =
      typeof params.limit === 'number' && params.limit > 0
        ? Math.min(params.limit, 20)
        : extractLimitFromPrompt(prompt);

    const range =
      resolveDateRange(params, prompt) ??
      (() => {
        const iso = params.date ?? new Date().toISOString().split('T')[0];
        return { start: iso, end: iso };
      })();

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const targetEmployees = params.employeeName
      ? employees.filter((e) =>
          e.name
            .toLowerCase()
            .includes(String(params.employeeName).toLowerCase()),
        )
      : employees;
    const targetIds = new Set(targetEmployees.map((e) => e.id));

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(start, end),
        status: Not(BookingStatus.CANCELLED),
      },
      relations: { employee: true, service: true },
    });

    const byEmployee = new Map<
      string,
      { name: string; count: number; revenue: number; currency: string }
    >();
    for (const e of targetEmployees) {
      byEmployee.set(e.id, {
        name: e.name,
        count: 0,
        revenue: 0,
        currency: 'USD',
      });
    }
    for (const b of bookings) {
      if (targetIds.size > 0 && !targetIds.has(b.employeeId)) continue;
      const row = byEmployee.get(b.employeeId);
      if (!row) continue;
      row.count += 1;
      row.revenue += Number(b.service?.price ?? 0);
      if (b.service?.currency) row.currency = b.service.currency;
    }

    let rows = [...byEmployee.values()].filter((r) => r.count > 0);
    const titles: Record<StaffInsightMetric, string> = {
      busiest: 'Busiest providers',
      most_revenue: 'Top providers by revenue',
      most_bookings: 'Providers with most bookings',
      overview: 'Staff performance overview',
    };

    switch (metric) {
      case 'most_revenue':
        rows.sort((a, b) => b.revenue - a.revenue);
        break;
      case 'most_bookings':
      case 'busiest':
      default:
        rows.sort((a, b) => b.count - a.count);
        break;
    }

    rows = rows.slice(0, limit);
    const rangeLabel =
      range.start === range.end
        ? formatDateDisplay(range.start)
        : `${formatDateDisplay(range.start)} → ${formatDateDisplay(range.end)}`;

    const lines = [`${titles[metric]} (${rangeLabel}):`];
    if (rows.length === 0) {
      lines.push('• No provider bookings in this period.');
    } else {
      for (const row of rows) {
        lines.push(
          `• ${row.name}: ${row.count} appt(s) · ${row.currency} ${row.revenue.toFixed(2)}`,
        );
      }
    }

    return {
      success: true,
      action: 'summarize_staff',
      summary: lines.join('\n'),
      details: { metric, range, rows },
    };
  }

  private async handleLookupCustomer(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    accessTier?: string,
  ): Promise<CommandResult> {
    const name = params.customerName as string | undefined;
    if (!name) {
      return {
        success: false,
        action: 'lookup_customer',
        summary: 'Which customer should I look up? Mention their name.',
        details: {},
      };
    }

    const customer = this.resolveCustomer(customers, name);
    if (!customer) {
      return {
        success: false,
        action: 'lookup_customer',
        summary: `No customer found matching "${name}".`,
        details: {},
      };
    }

    const detail = await this.customerService.getCustomerDetail(
      businessId,
      customer.id,
    );
    const { stats, appointments } = detail;
    const lastAppt = appointments[0];
    const upcoming = appointments.filter(
      (a) => new Date(a.startTime) > new Date() && a.status !== 'cancelled',
    ).length;

    const bookingContext = params.bookingContext === true;
    const contextEmployee = params.employeeName as string | undefined;
    const contextTime = params.timeSlot as string | undefined;
    const contextDate = params.date as string | undefined;
    let contextMatch: (typeof appointments)[number] | undefined;
    if (bookingContext && (contextEmployee || contextTime || contextDate)) {
      const range = resolveDateRange(
        { date: contextDate },
        contextDate ?? 'today',
      ) ?? {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      };
      contextMatch = appointments.find((appt) => {
        if (appt.status === 'cancelled') return false;
        const day = new Date(appt.startTime).toISOString().split('T')[0];
        if (day < range.start || day > range.end) return false;
        if (contextEmployee && appt.employee?.name) {
          const needle = contextEmployee.toLowerCase();
          if (!appt.employee.name.toLowerCase().includes(needle)) return false;
        }
        if (contextTime) {
          const slot = this.snapTo10min(contextTime);
          if (formatTimeDisplay(appt.startTime) !== slot) return false;
        }
        return true;
      });
    }

    const tier = normalizeActorRole(accessTier);
    const limitedView = tier === 'staff';

    const lines = [
      `Customer: ${detail.customer.name}`,
      ...(limitedView
        ? [
            `• Upcoming appointments: ${upcoming}`,
            lastAppt
              ? `• Most recent: ${formatDateDisplay(lastAppt.startTime)} ${formatTimeDisplay(lastAppt.startTime)} — ${lastAppt.service?.name ?? 'Service'}`
              : null,
          ].filter(Boolean)
        : [
            `• Segment: ${detail.customer.segment}${detail.customer.isVip ? ' (VIP)' : ''}`,
            `• Total appointments: ${stats.total} · No-shows: ${stats.noShowCount} · Upcoming: ${upcoming}`,
            stats.lastBookingAt
              ? `• Last visit: ${formatDateDisplay(stats.lastBookingAt)}`
              : null,
            lastAppt
              ? `• Most recent: ${formatDateDisplay(lastAppt.startTime)} ${formatTimeDisplay(lastAppt.startTime)} — ${lastAppt.service?.name ?? 'Service'} (${lastAppt.status})`
              : null,
            detail.customer.email ? `• Email: ${detail.customer.email}` : null,
            detail.customer.phone ? `• Phone: ${detail.customer.phone}` : null,
          ].filter(Boolean)),
    ];

    if (contextMatch) {
      lines.push(
        `• Booking match: ${formatDateDisplay(contextMatch.startTime)} ${formatTimeDisplay(contextMatch.startTime)} — ${contextMatch.service?.name ?? 'Service'} with ${contextMatch.employee?.name ?? 'provider'} (${contextMatch.status})`,
      );
    } else if (bookingContext && (contextEmployee || contextTime)) {
      lines.push('• No matching booking found for the provider/time filter.');
    }

    return {
      success: true,
      action: 'lookup_customer',
      summary: lines.join('\n'),
      details: limitedView
        ? {
            customerId: detail.customer.id,
            name: detail.customer.name,
            upcoming,
            contextBookingId: contextMatch?.id,
          }
        : {
            customer: detail.customer,
            stats,
            recentAppointments: appointments.slice(0, 5),
            contextBooking: contextMatch ?? null,
          },
    };
  }

  private async handleSummarizeWaitlist(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    const limit = typeof params.limit === 'number' ? params.limit : 10;

    const waitlist = await this.customerRepo
      .createQueryBuilder('c')
      .where('c.business_id = :businessId', { businessId })
      .andWhere(`'waitlist' = ANY(c.tags)`)
      .orderBy('c.name', 'ASC')
      .getMany();

    const cancelledWhere: Record<string, unknown> = {
      businessId,
      status: BookingStatus.CANCELLED,
    };
    if (params.date) {
      const d = new Date(params.date);
      const dayStart = new Date(d);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setUTCHours(23, 59, 59, 999);
      cancelledWhere.startTime = Between(dayStart, dayEnd);
    }

    const recoverableSlots = await this.bookingRepo.count({
      where: cancelledWhere,
    });

    if (waitlist.length === 0) {
      const lines = [
        'No customers on the waitlist. Tag customers with "waitlist" in CRM.',
      ];
      if (recoverableSlots > 0) {
        lines.push(
          `Cancelled slots available for recovery: ${recoverableSlots}`,
        );
      }
      return {
        success: true,
        action: 'summarize_waitlist',
        summary: lines.join('\n'),
        details: {
          count: 0,
          customers: [],
          recoverableCancelledSlots: recoverableSlots,
        },
      };
    }

    const shown = waitlist.slice(0, limit);
    const lines = [
      `Waitlist: ${waitlist.length} customer(s)`,
      ...shown.map((c) => `• ${c.name}`),
    ];
    if (waitlist.length > limit) {
      lines.push(`… and ${waitlist.length - limit} more`);
    }
    if (recoverableSlots > 0) {
      lines.push(`Cancelled slots available for recovery: ${recoverableSlots}`);
    }

    return {
      success: true,
      action: 'summarize_waitlist',
      summary: lines.join('\n'),
      details: {
        count: waitlist.length,
        customers: shown.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
        })),
        recoverableCancelledSlots: recoverableSlots,
      },
    };
  }

  private async handleLookupServiceAssignment(
    businessId: string,
    employees: Employee[],
    services: Service[],
    params: Record<string, any>,
    prompt?: string,
  ): Promise<CommandResult> {
    params = enrichDashboardLookupAssignmentParams({ ...params }, prompt);

    const lookup = params.assignmentLookup as
      | 'providers_for_service'
      | 'services_for_provider'
      | undefined;

    if (lookup === 'services_for_provider') {
      const name = params.employeeName as string | undefined;
      if (!name) {
        return {
          success: false,
          action: 'lookup_service_assignment',
          summary: 'Which provider should I look up? Mention their name.',
          details: {},
        };
      }

      const employee = this.resolveEmployee(employees, name);
      if (!employee) {
        return {
          success: false,
          action: 'lookup_service_assignment',
          summary: `No provider found matching "${name}".`,
          details: {},
        };
      }

      const assigned = getEmployeeServices(employee, services);
      if (assigned.length === 0 && employee.serviceIds?.length) {
        return {
          success: true,
          action: 'lookup_service_assignment',
          summary: `${employee.name} has no services assigned in the catalog.`,
          details: { employeeName: employee.name, services: [] },
        };
      }

      if (assigned.length === 0) {
        return {
          success: true,
          action: 'lookup_service_assignment',
          summary: `${employee.name} can perform all catalog services (no restriction set).`,
          details: {
            employeeName: employee.name,
            services: services.map((s) => ({ id: s.id, name: s.name })),
            unrestricted: true,
          },
        };
      }

      const lines = [
        `Services ${employee.name} can perform (${assigned.length}):`,
        ...assigned.map((s) => `• ${s.name}`),
      ];
      return {
        success: true,
        action: 'lookup_service_assignment',
        summary: lines.join('\n'),
        details: {
          employeeName: employee.name,
          services: assigned.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
          })),
        },
      };
    }

    const catalog = services.map((entry) => ({
      id: entry.id,
      name: entry.name,
      price: Number(entry.price),
      durationMinutes: entry.durationMinutes,
    }));

    const serviceResolved = resolveLookupAssignmentService(
      catalog,
      params,
      (name) => this.resolveService(services, name),
    );

    if (serviceResolved.noMatchSummary && !serviceResolved.service) {
      const isMissingName =
        serviceResolved.noMatchSummary === 'Which service should I look up?';
      return {
        success: false,
        action: 'lookup_service_assignment',
        summary: isMissingName
          ? 'Which service should I look up? Mention the service name.'
          : serviceResolved.noMatchSummary,
        details: {},
      };
    }

    const service = serviceResolved.service
      ? services.find((entry) => entry.id === serviceResolved.service!.id)
      : undefined;

    if (!service) {
      return {
        success: false,
        action: 'lookup_service_assignment',
        summary: 'Which service should I look up? Mention the service name.',
        details: {},
      };
    }

    const discoveryNote = formatLookupAssignmentDiscoveryNote(params, service.name);
    const active = employees.filter((e) => e.isActive);

    if (params.date) {
      const isoDay =
        parseDateInput(params.date)?.toISOString().split('T')[0] ?? params.date;
      const displayDay = formatDateDisplay(isoDay);

      const availabilityRows = await Promise.all(
        active.map(async (provider) => {
          const row = await this.getProviderAvailabilityForService(
            businessId,
            provider.id,
            service.id,
            isoDay,
          );
          return { provider, ...row };
        }),
      );

      const availableProviders = availabilityRows.filter(
        (r) => r.hasServiceBlock && r.openSlots.length > 0,
      );
      const scheduledButFull = availabilityRows.filter(
        (r) => r.hasServiceBlock && r.openSlots.length === 0,
      );

      if (availableProviders.length === 0) {
        const lines = [
          `No providers with open ${service.name} time on ${displayDay}.`,
          scheduledButFull.length > 0
            ? `${scheduledButFull.length} scheduled but fully booked: ${scheduledButFull.map((r) => r.provider.name).join(', ')}`
            : `No applied ${service.name} service blocks on ${displayDay}.`,
        ];
        return {
          success: true,
          action: 'lookup_service_assignment',
          summary: lines.join('\n'),
          details: {
            serviceName: service.name,
            date: displayDay,
            availableProviders: [],
            scheduledButFull: scheduledButFull.map((r) => ({
              name: r.provider.name,
              blocks: r.scheduledBlocks,
            })),
            availability: availabilityRows
              .filter((r) => r.hasServiceBlock)
              .map((r) => ({
                name: r.provider.name,
                scheduledBlocks: r.scheduledBlocks,
                openSlots: r.openSlots,
              })),
          },
        };
      }

      const lines = [
        `Providers scheduled for ${service.name} on ${displayDay} with open time (${availableProviders.length})${discoveryNote ? ` ${discoveryNote}` : ''}:`,
        ...availableProviders.map((r) => {
          const blocks = r.scheduledBlocks
            .map((b) => `${b.start}–${b.end}`)
            .join(', ');
          const open = r.openSlots.map((s) => `${s.start}–${s.end}`).join(', ');
          return `• ${r.provider.name} — shift: ${blocks} | open: ${open}`;
        }),
        '',
        'Reply with a provider and time to book, e.g. "Book Gevorg at 10:00".',
      ];

      return {
        success: true,
        action: 'lookup_service_assignment',
        summary: lines.join('\n'),
        details: {
          serviceName: service.name,
          date: displayDay,
          availableProviders: availableProviders.map((r) => r.provider.name),
          availability: availableProviders.map((r) => ({
            name: r.provider.name,
            scheduledBlocks: r.scheduledBlocks,
            openSlots: r.openSlots,
          })),
        },
      };
    }

    const providers = active.filter((e) => {
      if (!e.serviceIds?.length) return true;
      return e.serviceIds.includes(service.id);
    });

    if (providers.length === 0) {
      return {
        success: true,
        action: 'lookup_service_assignment',
        summary: `No providers assigned to "${service.name}".`,
        details: { serviceName: service.name, providers: [] },
      };
    }

    const lines = [
      `Providers who can perform ${service.name} (${providers.length})${discoveryNote ? ` ${discoveryNote}` : ''}:`,
      ...providers.map((p) => `• ${p.name}`),
    ];
    return {
      success: true,
      action: 'lookup_service_assignment',
      summary: lines.join('\n'),
      details: {
        serviceName: service.name,
        maxPrice: params.maxPrice ?? null,
        serviceRank: params.serviceRank ?? null,
        providers: providers.map((p) => ({ id: p.id, name: p.name })),
      },
    };
  }

  private handleListEmployees(
    employees: Employee[],
    _params: Record<string, any>,
  ): CommandResult {
    const active = employees.filter((e) => e.isActive);
    if (active.length === 0) {
      return {
        success: true,
        action: 'list_employees',
        summary: 'No active providers on the team yet.',
        details: { employees: [] },
      };
    }

    const lines = active.map((e) => `• ${e.name}`);
    return {
      success: true,
      action: 'list_employees',
      summary: [`Team (${active.length} providers):`, ...lines].join('\n'),
      details: {
        employees: active.map((e) => ({ id: e.id, name: e.name })),
      },
    };
  }

  private handleListTemplates(templates: ScheduleTemplate[]): CommandResult {
    const active = templates.filter((t) => !t.isDeleted);
    if (active.length === 0) {
      return {
        success: true,
        action: 'list_templates',
        summary:
          'No schedule templates yet. Create one in Schedule → Templates.',
        details: { templates: [] },
      };
    }

    const lines = active.map((t) => `• ${t.name}`);
    return {
      success: true,
      action: 'list_templates',
      summary: [`Schedule templates (${active.length}):`, ...lines].join('\n'),
      details: { templates: active.map((t) => ({ id: t.id, name: t.name })) },
    };
  }

  private bookingDurationMinutes(booking: Booking): number {
    return Math.round(
      (booking.endTime.getTime() - booking.startTime.getTime()) / 60_000,
    );
  }

  private formatServicePrice(service: Service | null | undefined): string {
    if (!service) return '—';
    const currency = service.currency || 'USD';
    return `${currency} ${Number(service.price).toFixed(2)}`;
  }

  private formatAppointmentLine(booking: Booking): string {
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    const duration = this.bookingDurationMinutes(booking);
    const price = this.formatServicePrice(booking.service);
    return `• ${time} | ${booking.service?.name || 'Service'} | ${booking.customer?.name || 'Walk-in'} | ${booking.employee?.name || 'Unknown'} | ${duration} min | ${price} | ${booking.status}`;
  }

  private async handleAnalyzeAppointments(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employeeId?: string,
    employeeName?: string,
  ): Promise<CommandResult> {
    const metric = resolveAppointmentMetric(params, prompt);
    if (!metric) {
      return {
        success: false,
        action: 'analyze_appointments',
        summary:
          'Specify what to analyze: most expensive, longest, shortest, earliest, or latest appointment.',
        details: { params },
      };
    }

    const range = resolveDateRange(params, prompt);
    const isoDay =
      range?.start ?? params.date ?? new Date().toISOString().split('T')[0];
    const displayDay = formatDateDisplay(isoDay);
    const d = new Date(isoDay);
    const dayStart = new Date(d);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      businessId,
      startTime: Between(dayStart, dayEnd),
    };
    if (employeeId) where.employeeId = employeeId;

    const bookings = await this.bookingRepo.find({
      where: where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    const active = bookings.filter((b) => b.status !== BookingStatus.CANCELLED);
    const scopeLabel = employeeName || 'all providers';

    if (active.length === 0) {
      return {
        success: true,
        action: 'analyze_appointments',
        summary: `No appointments found for ${scopeLabel} on ${displayDay}.`,
        details: { metric, date: displayDay, count: 0 },
      };
    }

    const metricTitles: Record<typeof metric, string> = {
      most_expensive: 'Most expensive appointment',
      longest: 'Longest appointment',
      shortest: 'Shortest appointment',
      earliest: 'Earliest appointment',
      latest: 'Latest appointment',
    };

    let matches: Booking[] = [];

    switch (metric) {
      case 'most_expensive': {
        const priced = active.filter(
          (b) => b.service && Number(b.service.price) >= 0,
        );
        if (priced.length === 0) {
          return {
            success: true,
            action: 'analyze_appointments',
            summary: `No priced appointments found for ${scopeLabel} on ${displayDay}.`,
            details: { metric, date: displayDay, count: 0 },
          };
        }
        const maxPrice = Math.max(
          ...priced.map((b) => Number(b.service.price)),
        );
        matches = priced.filter((b) => Number(b.service.price) === maxPrice);
        break;
      }
      case 'longest': {
        const maxDuration = Math.max(
          ...active.map((b) => this.bookingDurationMinutes(b)),
        );
        matches = active.filter(
          (b) => this.bookingDurationMinutes(b) === maxDuration,
        );
        break;
      }
      case 'shortest': {
        const minDuration = Math.min(
          ...active.map((b) => this.bookingDurationMinutes(b)),
        );
        matches = active.filter(
          (b) => this.bookingDurationMinutes(b) === minDuration,
        );
        break;
      }
      case 'earliest':
        matches = [active[0]];
        break;
      case 'latest':
        matches = [active[active.length - 1]];
        break;
    }

    const lines = [
      `${metricTitles[metric]} on ${displayDay} (${scopeLabel}):`,
      ...matches.map((b) => this.formatAppointmentLine(b)),
    ];
    if (matches.length > 1) {
      lines.push(`(${matches.length} tied)`);
    }

    return {
      success: true,
      action: 'analyze_appointments',
      summary: lines.join('\n'),
      details: {
        metric,
        date: displayDay,
        count: active.length,
        matches: matches.map((b) => ({
          id: b.id,
          service: b.service?.name,
          customer: b.customer?.name,
          employee: b.employee?.name,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
          durationMinutes: this.bookingDurationMinutes(b),
          price: b.service ? Number(b.service.price) : null,
          currency: b.service?.currency ?? null,
          status: b.status,
        })),
      },
    };
  }

  private async handleBulkSmartCancel(
    businessId: string,
    prompt: string,
    params: any,
    services: Service[],
    employees: Employee[],
    employeeId?: string,
    userId?: string,
    options?: { notifyOnly?: boolean },
  ): Promise<CommandResult> {
    const matchedServices = this.resolveServices(services, params);

    if (
      params.employeeName &&
      !this.resolveEmployee(employees, params.employeeName)
    ) {
      return {
        success: false,
        action: 'bulk_smart_cancel',
        summary: `No provider found matching "${params.employeeName}".`,
        details: { params },
      };
    }

    const bookings = await this.findBookingsForCancel(
      businessId,
      params,
      services,
      employees,
      employeeId,
      prompt,
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'bulk_smart_cancel',
        summary: 'No matching bookings to cancel.',
        details: { matchedCount: 0 },
      };
    }

    const reason = params.reason || 'Cancelled via AI command';
    const dateRange =
      params.dateFrom && params.dateTo
        ? { start: toIsoDay(params.dateFrom), end: toIsoDay(params.dateTo) }
        : params.date
          ? { start: toIsoDay(params.date), end: toIsoDay(params.date) }
          : undefined;

    const plan = options?.notifyOnly
      ? this.planBuilder.buildCancelBookingsPlan(
          businessId,
          bookings.map((b) => b.id),
          reason,
          userId,
          {
            employeeName: params.employeeName,
            date: params.date ? formatDateDisplay(params.date) : undefined,
            services: matchedServices.map((s) => s.name),
            notifyCustomers: true,
          },
        )
      : this.planBuilder.buildBulkSmartCancelPlan(
          businessId,
          bookings.map((b) => b.id),
          reason,
          userId,
          {
            employeeName: params.employeeName,
            date: params.date ? formatDateDisplay(params.date) : undefined,
            services: matchedServices.map((s) => s.name),
            dateRange,
          },
        );

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: bookings.length <= 5,
      }),
    );
  }

  private async handleFillSlotFromWaitlist(
    businessId: string,
    params: any,
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const where: any = {
      businessId,
      status: BookingStatus.CANCELLED,
    };
    if (employeeId) where.employeeId = employeeId;

    if (params.date) {
      const d = new Date(params.date);
      const dayStart = new Date(d);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setUTCHours(23, 59, 59, 999);
      where.startTime = Between(dayStart, dayEnd);
    }

    const cancelled = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    let slot = cancelled[0] ?? null;
    if (params.timeSlot && slot) {
      const target = this.snapTo10min(params.timeSlot);
      slot =
        cancelled.find((b) => formatTimeDisplay(b.startTime) === target) ??
        cancelled[0] ??
        null;
    }

    if (!slot) {
      return {
        success: false,
        action: 'fill_slot_from_waitlist',
        summary:
          'No cancelled slot found to fill. Specify provider, date, and time (e.g. "Fill cancelled 14:00 slot from waitlist").',
        details: { params },
      };
    }

    const waitlist = await this.customerRepo
      .createQueryBuilder('c')
      .where('c.business_id = :businessId', { businessId })
      .andWhere(`'waitlist' = ANY(c.tags)`)
      .getMany();

    if (waitlist.length === 0) {
      return {
        success: false,
        action: 'fill_slot_from_waitlist',
        summary:
          'No waitlist customers found. Tag customers with "waitlist" in CRM.',
        details: { slotId: slot.id },
      };
    }

    const candidate = waitlist[0];
    const plan = this.planBuilder.buildFillSlotFromWaitlistPlan({
      businessId,
      slot: {
        bookingId: slot.id,
        employeeId: slot.employeeId,
        serviceId: slot.serviceId,
        startTime: slot.startTime.toISOString(),
        customerName: slot.customer?.name,
      },
      candidate: { customerId: candidate.id, customerName: candidate.name },
      userId,
    });

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: true,
      }),
    );
  }

  private async resolveCommandTimezone(
    businessId: string,
    session?: CommandSessionOptions,
  ): Promise<string> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: { timezone: true },
    });
    return pickTimezone(
      session?.context?.timeZone,
      session?.context?.timezone,
      business?.timezone,
    );
  }

  private async executeCompoundIntents(
    businessId: string,
    prompt: string,
    userId: string | undefined,
    session: CommandSessionOptions | undefined,
    subIntents: Array<{
      action: string;
      params: Record<string, any>;
      reasoning: string;
    }>,
    catalog: {
      employees: Employee[];
      services: Service[];
      customers: Customer[];
      templates: ScheduleTemplate[];
    },
    confidenceThresholds: { low: number; high: number },
    timeZone: string,
  ): Promise<CommandResult> {
    const plans: AgentPlan[] = [];
    const pipelineTrace = [
      this.completionPipeline.trace(
        'classify',
        'compound_intent',
        `${subIntents.length} sub-intent(s)`,
      ),
    ];

    let pendingCancelBookingIds: string[] | undefined;

    for (const sub of subIntents) {
      const parsedParams: Record<string, any> = {
        ...this.completionPipeline.mergeSessionContext(
          sub.params,
          {
            ...session?.context,
            timeZone,
          },
          sub.action,
        ),
        _timeZone: timeZone,
      };
      const parsed = {
        action: sub.action,
        params: parsedParams,
        reasoning: sub.reasoning,
      };
      this.applyScheduleScopeFromPrompt(
        prompt,
        parsedParams,
        parsed.action,
        catalog.employees,
      );
      enrichCompoundSubStepBookingHints(
        parsed.action,
        parsedParams,
        prompt,
        timeZone,
      );
      enrichCompoundSubStepScheduleHints(
        parsed.action,
        parsedParams,
        prompt,
        timeZone,
        catalog.employees.map((e) => ({ id: e.id, name: e.name })),
      );
      enrichCompoundSubStepPackageMultiHints(
        parsed.action,
        parsedParams,
        prompt,
        catalog.employees.map((e) => ({ id: e.id, name: e.name })),
        catalog.customers.map((c) => ({ id: c.id, name: c.name })),
      );
      enrichCompoundSubStepGiftCardPaymentsHints(
        parsed.action,
        parsedParams,
        prompt,
      );
      this.completionPipeline.normalizeDateParams(
        parsedParams,
        prompt,
        timeZone,
      );
      if (parsed.action === 'reschedule_booking') {
        this.completionPipeline.finalizeRescheduleParams(
          parsedParams,
          prompt,
          timeZone,
        );
      } else if (
        parsed.action === 'create_direct_schedule' ||
        parsed.action === 'clear_schedule' ||
        parsed.action === 'apply_schedule' ||
        parsed.action === 'block_schedule' ||
        parsed.action === 'fill_unused_slots' ||
        parsed.action === 'cancel_bookings' ||
        parsed.action === 'hide_appointments_from_calendar'
      ) {
        this.completionPipeline.enrichDateRangeParams(
          parsedParams,
          prompt,
          timeZone,
        );
        this.completionPipeline.normalizeDateParams(
          parsedParams,
          prompt,
          timeZone,
        );
      }
      if (parsed.action === 'create_direct_schedule') {
        parsedParams.periods = inferDirectSchedulePeriods(parsedParams, prompt);
      }
      if (
        parsed.action === 'hide_appointments_from_calendar' &&
        pendingCancelBookingIds?.length
      ) {
        parsedParams.statusFilter = parsedParams.statusFilter ?? 'cancelled';
      }
      const resolved = this.completionPipeline.resolve(
        businessId,
        prompt,
        parsed,
        catalog,
        timeZone,
      );

      if (shouldValidateAction(parsed.action)) {
        const validation = this.completionPipeline.validate(resolved);
        if (!validation.ok) {
          const clarify = this.completionPipeline.toClarifyResult(
            resolved,
            validation,
          );
          clarify.details.pipelineTrace = pipelineTrace;
          clarify.details.compoundStep = parsed.action;
          return clarify;
        }
      }

      let plan: AgentPlan | null = null;

      if (
        parsed.action === 'hide_appointments_from_calendar' &&
        pendingCancelBookingIds?.length
      ) {
        plan = this.planBuilder.buildHideAppointmentsPlan(
          businessId,
          pendingCancelBookingIds,
          userId,
          {
            employeeName: resolved.enrichedParams.employeeName,
            date: resolved.enrichedParams.date
              ? formatDateDisplay(resolved.enrichedParams.date)
              : undefined,
            statuses: ['cancelled'],
          },
        );
      } else {
        plan = await this.buildPlanForResolvedIntent(
          businessId,
          prompt,
          parsed.action,
          resolved.enrichedParams,
          resolved.entities.employeeId,
          catalog,
          userId,
        );
      }

      if (plan) {
        plans.push(plan);
        if (parsed.action === 'cancel_bookings') {
          const cancelStep = plan.steps.find(
            (s) => s.action === 'cancel_bookings',
          );
          pendingCancelBookingIds = cancelStep?.params?.bookingIds as
            | string[]
            | undefined;
        }
      }
    }

    if (plans.length === 0) {
      return {
        success: false,
        action: 'compound_intent',
        summary: 'Could not build a plan from the compound command.',
        details: { subIntents },
      };
    }

    const merged = this.planBuilder.mergePlans(
      businessId,
      'compound_intent',
      plans,
    );
    const providerCount =
      new Set(
        merged.steps
          .map((s) => s.params?.employeeId as string | undefined)
          .filter(Boolean),
      ).size || 1;

    const result = this.toCommandResult(
      await this.orchestration.executePlan({
        plan: merged,
        businessId,
        userId,
        autoExecute: resolveAutoExecute({
          action: 'compound_intent',
          stepCount: merged.steps.length,
          providerCount,
          confidence: 0.9,
          thresholds: confidenceThresholds,
        }),
      }),
    );

    result.details = {
      ...result.details,
      pipelineTrace,
      subIntents: subIntents.map((s) => s.action),
      decomposed: true,
    };
    return result;
  }

  private async buildPlanForResolvedIntent(
    businessId: string,
    prompt: string,
    action: string,
    params: Record<string, any>,
    employeeId: string | undefined,
    catalog: {
      employees: Employee[];
      services: Service[];
      customers: Customer[];
      templates: ScheduleTemplate[];
    },
    userId?: string,
    _pendingCancelBookingIds?: string[],
  ): Promise<AgentPlan | null> {
    switch (action) {
      case 'create_booking': {
        const plan = await this.buildCreateBookingPlanOnly(
          businessId,
          params,
          catalog.employees,
          catalog.services,
          catalog.customers,
          userId,
          prompt,
        );
        return plan;
      }
      case 'create_service': {
        const parsed = this.parseServiceDraft(params, params.currency || 'USD');
        if (parsed.errors.length > 0 || !parsed.draft) return null;
        const existing = this.resolveService(
          catalog.services,
          parsed.draft.name,
        );
        if (existing) return null;
        return this.planBuilder.buildCreateServicePlan({
          businessId,
          ...parsed.draft,
          userId,
        });
      }
      case 'create_services': {
        const rawList = Array.isArray(params.services) ? params.services : [];
        if (rawList.length === 0) return null;
        const defaultCurrency = (params.currency || 'USD').trim().toUpperCase();
        const toCreate: ParsedServiceDraft[] = [];
        const batchNames = new Set<string>();
        for (const raw of rawList.slice(0, 25)) {
          const parsed = this.parseServiceDraft(raw ?? {}, defaultCurrency);
          if (parsed.errors.length > 0 || !parsed.draft) continue;
          const key = parsed.draft.name.toLowerCase();
          if (batchNames.has(key)) continue;
          if (this.resolveService(catalog.services, parsed.draft.name))
            continue;
          batchNames.add(key);
          toCreate.push(parsed.draft);
        }
        if (toCreate.length === 0) return null;
        return this.planBuilder.buildCreateServicesPlan({
          businessId,
          services: toCreate,
          userId,
        });
      }
      case 'assign_employee_services': {
        const resolved = resolveAssignEmployeeServicesInput(
          catalog.employees,
          catalog.services,
          params,
        );
        if (!resolved.ok) return null;
        return this.planBuilder.buildAssignEmployeeServicesPlan({
          businessId,
          employeeId: resolved.employeeId,
          employeeName: resolved.employeeName,
          serviceIds: resolved.serviceIds,
          serviceNames: resolved.serviceNames,
          userId,
        });
      }
      case 'create_schedule_template': {
        return this.scheduleHandlers.prepareCreateScheduleTemplatePlan(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
      }
      case 'mark_no_shows': {
        const bookings = await this.findBookingsForMarkNoShows(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          prompt,
        );
        if (!bookings.length) return null;
        if (isNoShowRecoveryPrompt(prompt)) {
          return this.operations.prepareNoShowRecoveryPlan(
            businessId,
            prompt,
            params,
            bookings.map((b) => b.id),
            userId,
          );
        }
        return this.planBuilder.buildUpdateBookingsPlan({
          businessId,
          bookingIds: bookings.map((b) => b.id),
          status: BookingStatus.NO_SHOW,
          userId,
          label: `Mark ${bookings.length} appointment(s) as no-show`,
        });
      }
      case 'no_show_recovery': {
        const bookings = await this.findBookingsForMarkNoShows(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          prompt,
        );
        if (!bookings.length) return null;
        return this.operations.prepareNoShowRecoveryPlan(
          businessId,
          prompt,
          params,
          bookings.map((b) => b.id),
          userId,
        );
      }
      case 'update_bookings': {
        const bookings = await this.findBookingsForBulkUpdate(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          prompt,
        );
        if (!bookings.length) return null;
        const status = normalizeBookingStatusValue(params.status);
        const paymentStatus = normalizePaymentStatusValue(params.paymentStatus);
        if (!status && !paymentStatus) return null;
        const changeParts = [
          status ? `status → ${status}` : null,
          paymentStatus ? `payment → ${paymentStatus}` : null,
        ].filter(Boolean);
        return this.planBuilder.buildUpdateBookingsPlan({
          businessId,
          bookingIds: bookings.map((b) => b.id),
          status,
          paymentStatus,
          userId,
          planAction: 'update_bookings',
          label: `Update ${bookings.length} appointment(s) (${changeParts.join(', ')})`,
        });
      }
      case 'payment_sweep': {
        const rawBookings = await this.findUnpaidBookingsForSweep(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
        );
        const { bookings } = this.operations.applyPaymentSweepFilters(
          prompt,
          params,
          rawBookings,
        );
        if (!bookings.length) return null;
        return this.planBuilder.buildUpdateBookingsPlan({
          businessId,
          bookingIds: bookings.map((b) => b.id),
          paymentStatus: PaymentStatus.PAID,
          userId,
          label: `Mark ${bookings.length} unpaid appointment(s) as paid`,
        });
      }
      case 'day_replan': {
        const range = resolveDateRange(
          params,
          prompt,
          params._timeZone ?? 'UTC',
        );
        if (!range) return null;
        const targets = resolveEmployees(catalog.employees, params);
        return this.planBuilder.buildDayReplanPlan({
          businessId,
          date:
            params.date ??
            (range.start === range.end ? range.start : undefined),
          dateFrom: range.start !== range.end ? range.start : undefined,
          dateTo: range.start !== range.end ? range.end : undefined,
          employeeIds: targets.length ? targets.map((e) => e.id) : undefined,
          userId,
        });
      }
      case 'setup_week_schedule': {
        const cascadeResult =
          await this.scheduleHandlers.prepareTemplateCascadePlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            catalog.services,
            userId,
          );
        return cascadeResult;
      }
      case 'swap_schedules':
        return this.scheduling.prepareSwapSchedulesPlan(
          businessId,
          prompt,
          params,
          catalog.employees,
          userId,
        );
      case 'rebalance_capacity':
        return this.scheduling.prepareRebalanceCapacityPlan(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
      case 'holiday_mode':
        return this.scheduling.prepareHolidayModePlan(
          businessId,
          prompt,
          params,
          catalog.employees,
          userId,
        );
      case 'onboard_provider_schedule':
        return this.scheduling.prepareOnboardProviderSchedulePlan(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
      case 'sick_day_replan':
        return this.operations.prepareSickDayReplanPlan(
          businessId,
          prompt,
          params,
          catalog.employees,
          params._timeZone ?? 'UTC',
          userId,
        );
      case 'import_services_from_menu':
        return this.operations.prepareImportServicesFromMenuPlan(
          businessId,
          prompt,
          params,
          userId,
        );
      case 'update_service_prices':
        return this.operations.prepareUpdateServicePricesPlan(
          businessId,
          prompt,
          params,
          catalog.services,
          userId,
        );
      case 'staff_service_matrix':
        return this.operations.prepareStaffServiceMatrixPlan(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
      case 'apply_schedule':
      case 'clear_schedule':
      case 'fill_unused_slots':
      case 'block_schedule':
      case 'create_direct_schedule':
      case 'bulk_smart_cancel':
      case 'fill_slot_from_waitlist':
      case 'cancel_bookings':
      case 'hide_appointments_from_calendar':
      case 'unhide_appointments_from_calendar':
      case 'reschedule_booking': {
        const effectiveAction =
          action === 'cancel_bookings' && /notify|waitlist|rebook/i.test(prompt)
            ? 'bulk_smart_cancel'
            : action;
        const handlerResult = await this.dispatchMutatingIntent(
          businessId,
          prompt,
          effectiveAction,
          params,
          catalog,
          employeeId,
          userId,
          { planOnly: true },
        );
        return (handlerResult.details?.plan as AgentPlan) ?? null;
      }
      default:
        return null;
    }
  }

  private async executeReadOnlySubIntent(
    businessId: string,
    effectivePrompt: string,
    action: string,
    params: Record<string, any>,
    catalog: {
      employees: Employee[];
      services: Service[];
      customers: Customer[];
      templates: ScheduleTemplate[];
    },
    timeZone: string,
    _userId?: string,
  ): Promise<CommandResult | null> {
    params._timeZone = timeZone;
    const employeeId = params.employeeId as string | undefined;
    const resolvedEmployee = employeeId
      ? catalog.employees.find((e) => e.id === employeeId)
      : params.employeeName
        ? this.resolveEmployee(catalog.employees, params.employeeName)
        : undefined;

    switch (action) {
      case 'list_bookings':
      case 'show_appointments':
        return this.handleListBookings(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
          catalog.services,
        );
      case 'check_availability':
        return this.handleCheckAvailability(
          businessId,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
      case 'summarize_day':
        return this.handleSummarizeDay(
          businessId,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
      case 'summarize_bookings':
        return this.handleSummarizeBookings(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
      case 'analyze_appointments':
        return this.handleAnalyzeAppointments(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
      case 'analyze_services':
        return this.handleAnalyzeServices(businessId, effectivePrompt, params);
      case 'summarize_staff':
        return this.handleSummarizeStaff(
          businessId,
          effectivePrompt,
          params,
          catalog.employees,
        );
      case 'lookup_customer':
        return this.handleLookupCustomer(businessId, params, catalog.customers);
      case 'summarize_waitlist':
        return this.handleSummarizeWaitlist(businessId, params);
      case 'lookup_service_assignment':
        return this.handleLookupServiceAssignment(
          businessId,
          catalog.employees,
          catalog.services,
          params,
          effectivePrompt,
        );
      case 'list_services':
        return this.handleListServices(
          businessId,
          catalog.services,
          params,
          effectivePrompt,
        );
      case 'list_employees':
        return this.handleListEmployees(catalog.employees, params);
      case 'list_templates':
        return this.handleListTemplates(catalog.templates);
      case 'list_schedule_gaps':
        return this.scheduleHandlers.handleListScheduleGaps(
          businessId,
          effectivePrompt,
          params,
          catalog.employees,
        );
      case 'summarize_utilization':
        return this.handleSummarizeUtilization(
          businessId,
          effectivePrompt,
          params,
          catalog.employees,
        );
      case 'summarize_customers':
        return this.handleSummarizeCustomers(
          businessId,
          effectivePrompt,
          params,
        );
      default:
        return null;
    }
  }

  private async buildCreateBookingPlanOnly(
    businessId: string,
    params: any,
    employees: Employee[],
    services: Service[],
    customers: Customer[],
    userId?: string,
    prompt?: string,
  ): Promise<AgentPlan | null> {
    params = enrichDashboardCreateBookingParams({ ...params }, prompt);

    const serviceResolved = await this.resolveCreateBookingServiceForParams(
      businessId,
      services,
      params,
    );
    const service = serviceResolved.service;
    if (!service) return null;

    const customer = params.customerId
      ? customers.find((c) => c.id === params.customerId)
      : params.customerName
        ? this.resolveCustomer(customers, params.customerName)
        : undefined;

    let resolvedEmployee = params.employeeId
      ? employees.find((e) => e.id === params.employeeId)
      : params.employeeName
        ? this.resolveEmployee(employees, params.employeeName)
        : undefined;
    let timeSlot = params.timeSlot ? this.snapTo10min(params.timeSlot) : null;

    if (params.bookingFirstAvailable) {
      const firstAvailable = await this.pickCreateBookingFirstAvailable(
        businessId,
        service,
        params,
        employees,
        resolvedEmployee,
        prompt,
      );
      if (!firstAvailable.ok) return null;

      const pick = firstAvailable.pick;
      resolvedEmployee =
        employees.find((entry) => entry.id === pick.employeeId) ?? resolvedEmployee;
      timeSlot = this.snapTo10min(pick.timeSlot);
      params.date = pick.isoDay;
      params.employeeName = pick.employeeName;
      params.employeeId = pick.employeeId;
    }

    const wantsProviderFallback =
      !params.bookingFirstAvailable &&
      !!params.date &&
      !!timeSlot &&
      (params.fallbackAnyProvider === true ||
        (Array.isArray(params.providerFallbackNames) &&
          params.providerFallbackNames.length > 0) ||
        (Array.isArray(params.employeeNames) &&
          params.employeeNames.length >= 2));

    if (wantsProviderFallback && timeSlot) {
      const fixedTimeSlot = timeSlot;
      const timeZone = params._timeZone ?? 'UTC';
      const isoDay = toIsoDay(params.date, timeZone);
      const priorityNames: string[] = Array.isArray(
        params.providerFallbackNames,
      )
        ? params.providerFallbackNames
        : Array.isArray(params.employeeNames) &&
            params.employeeNames.length >= 2
          ? params.employeeNames
          : params.employeeName
            ? [params.employeeName]
            : resolvedEmployee
              ? [resolvedEmployee.name]
              : [];

      const providerPriority = priorityNames
        .map((name) => this.resolveEmployee(employees, name))
        .filter((e): e is Employee => !!e)
        .map((e) => ({ id: e.id, name: e.name }));

      const pick = await this.slotResolver.resolveWithFallback({
        businessId,
        serviceId: service.id,
        isoDay,
        timeSlot: fixedTimeSlot,
        timeZone,
        providerPriority,
        fallbackAnyProvider: params.fallbackAnyProvider === true,
        allActiveProviders: employees
          .filter((e) => e.isActive)
          .map((e) => ({ id: e.id, name: e.name })),
      });
      if (!pick) return null;
      resolvedEmployee = employees.find((e) => e.id === pick.employeeId);
      timeSlot = pick.timeSlot;
      params.date = pick.isoDay;
    }

    if (!resolvedEmployee || !params.date || !timeSlot) return null;

    const startTime = buildUtcStartTimeFromDayAndTime(params.date, timeSlot);
    return this.planBuilder.buildCreateBookingPlan({
      businessId,
      employeeId: resolvedEmployee.id,
      serviceId: service.id,
      customerId: customer?.id,
      startTime,
      notes: params.notes || params.reason || undefined,
      userId,
      employeeName: resolvedEmployee.name,
      serviceName: service.name,
      customerName: customer?.name,
      date: formatDateDisplay(params.date),
      timeSlot,
    });
  }

  private async dispatchMutatingIntent(
    businessId: string,
    prompt: string,
    action: string,
    params: any,
    catalog: {
      employees: Employee[];
      services: Service[];
      customers: Customer[];
      templates: ScheduleTemplate[];
    },
    employeeId: string | undefined,
    userId: string | undefined,
    options?: { planOnly?: boolean },
  ): Promise<CommandResult> {
    let result: CommandResult;

    switch (action) {
      case 'fill_unused_slots':
        if (options?.planOnly) {
          const plan = await this.scheduleHandlers.prepareFillGapsPlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            catalog.services,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduleHandlers.handleFillScheduleGaps(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
        break;
      case 'apply_schedule':
        if (options?.planOnly) {
          const plan = await this.scheduleHandlers.prepareApplySchedulePlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduleHandlers.handleApplySchedule(
          businessId,
          prompt,
          params,
          catalog.employees,
          userId,
        );
        break;
      case 'clear_schedule': {
        if (options?.planOnly) {
          const plan = await this.scheduleHandlers.prepareClearSchedulePlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduleHandlers.handleClearSchedule(
          businessId,
          prompt,
          params,
          catalog.employees,
          userId,
        );
        break;
      }
      case 'block_schedule':
        if (options?.planOnly) {
          const plan = await this.scheduleHandlers.prepareBlockSchedulePlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduleHandlers.handleBlockSchedule(
          businessId,
          prompt,
          params,
          catalog.employees,
          userId,
        );
        break;
      case 'swap_schedules':
        if (options?.planOnly) {
          const plan = await this.scheduling.prepareSwapSchedulesPlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduling.handleSwapSchedules(
          businessId,
          prompt,
          params,
          catalog.employees,
          userId,
        );
        break;
      case 'rebalance_capacity':
        if (options?.planOnly) {
          const plan = await this.scheduling.prepareRebalanceCapacityPlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            catalog.services,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduling.handleRebalanceCapacity(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
        break;
      case 'holiday_mode':
        if (options?.planOnly) {
          const plan = await this.scheduling.prepareHolidayModePlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduling.handleHolidayMode(
          businessId,
          prompt,
          params,
          catalog.employees,
          userId,
        );
        break;
      case 'onboard_provider_schedule':
        if (options?.planOnly) {
          const plan = await this.scheduling.prepareOnboardProviderSchedulePlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            catalog.services,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduling.handleOnboardProviderSchedule(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
        break;
      case 'create_direct_schedule': {
        if (options?.planOnly) {
          const plan = await this.scheduleHandlers.prepareDirectSchedulePlan(
            businessId,
            prompt,
            params,
            catalog.employees,
            catalog.services,
            userId,
          );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduleHandlers.handleCreateDirectSchedule(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
        break;
      }
      case 'cancel_bookings': {
        if (options?.planOnly) {
          const bookings = await this.findBookingsForCancel(
            businessId,
            params,
            catalog.services,
            catalog.employees,
            employeeId,
            prompt,
          );
          if (!bookings.length)
            return { success: false, action, summary: '', details: {} };
          const plan = this.planBuilder.buildCancelBookingsPlan(
            businessId,
            bookings.map((b) => b.id),
            params.reason || 'Cancelled via AI',
            userId,
            {
              employeeName: params.employeeName,
              date: params.date ? formatDateDisplay(params.date) : undefined,
              services: this.resolveServices(catalog.services, params).map(
                (s) => s.name,
              ),
              notifyCustomers: Boolean(params.notifyCustomers),
            },
          );
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handleCancelBookings(
          businessId,
          prompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      }
      case 'bulk_smart_cancel': {
        if (options?.planOnly) {
          const bookings = await this.findBookingsForCancel(
            businessId,
            params,
            catalog.services,
            catalog.employees,
            employeeId,
            prompt,
          );
          if (!bookings.length)
            return { success: false, action, summary: '', details: {} };
          const plan = this.planBuilder.buildBulkSmartCancelPlan(
            businessId,
            bookings.map((b) => b.id),
            params.reason || 'Cancelled via AI',
            userId,
            {
              employeeName: params.employeeName,
              services: params.serviceNames,
            },
          );
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handleBulkSmartCancel(
          businessId,
          prompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      }
      case 'fill_slot_from_waitlist':
        if (options?.planOnly) {
          const fillResult = await this.handleFillSlotFromWaitlist(
            businessId,
            params,
            employeeId,
            userId,
          );
          return { ...fillResult, details: { plan: fillResult.details?.plan } };
        }
        result = await this.handleFillSlotFromWaitlist(
          businessId,
          params,
          employeeId,
          userId,
        );
        break;
      case 'hide_appointments_from_calendar': {
        if (options?.planOnly) {
          const bookings = await this.findBookingsForHide(
            businessId,
            params,
            catalog.services,
            catalog.employees,
            catalog.customers,
            employeeId,
          );
          if (!bookings.length)
            return { success: false, action, summary: '', details: {} };
          const statuses =
            this.resolveCalendarVisibilityStatusFilters(params, 'hide') ?? [];
          const plan = this.planBuilder.buildHideAppointmentsPlan(
            businessId,
            bookings.map((b) => b.id),
            userId,
            {
              employeeName: params.employeeName,
              date: params.date ? formatDateDisplay(params.date) : undefined,
              services: this.resolveServices(catalog.services, params).map(
                (s) => s.name,
              ),
              statuses,
            },
          );
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handleHideAppointmentsFromCalendar(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          catalog.customers,
          employeeId,
          userId,
        );
        break;
      }
      case 'unhide_appointments_from_calendar': {
        if (options?.planOnly) {
          const bookings = await this.findBookingsForCalendarVisibility(
            businessId,
            params,
            catalog.services,
            catalog.employees,
            catalog.customers,
            employeeId,
            'unhide',
          );
          if (!bookings.length)
            return { success: false, action, summary: '', details: {} };
          const statuses = this.resolveCalendarVisibilityStatusFilters(
            params,
            'unhide',
          );
          const plan = this.planBuilder.buildUnhideAppointmentsPlan(
            businessId,
            bookings.map((b) => b.id),
            userId,
            {
              employeeName: params.employeeName,
              date: params.date ? formatDateDisplay(params.date) : undefined,
              dateFrom: params.dateFrom
                ? formatDateDisplay(params.dateFrom)
                : undefined,
              dateTo: params.dateTo
                ? formatDateDisplay(params.dateTo)
                : undefined,
              services: this.resolveServices(catalog.services, params).map(
                (s) => s.name,
              ),
              statuses: statuses ?? undefined,
            },
          );
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handleUnhideAppointmentsFromCalendar(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          catalog.customers,
          employeeId,
          userId,
        );
        break;
      }
      case 'create_schedule_template': {
        if (options?.planOnly) {
          const plan =
            await this.scheduleHandlers.prepareCreateScheduleTemplatePlan(
              businessId,
              prompt,
              params,
              catalog.employees,
              catalog.services,
              userId,
            );
          return { success: !!plan, action, summary: '', details: { plan } };
        }
        result = await this.scheduleHandlers.handleCreateScheduleTemplate(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
        break;
      }
      case 'mark_no_shows': {
        if (options?.planOnly) {
          const bookings = await this.findBookingsForMarkNoShows(
            businessId,
            params,
            catalog.services,
            catalog.employees,
            employeeId,
            prompt,
          );
          if (!bookings.length)
            return { success: false, action, summary: '', details: {} };
          const plan = this.planBuilder.buildUpdateBookingsPlan({
            businessId,
            bookingIds: bookings.map((b) => b.id),
            status: BookingStatus.NO_SHOW,
            userId,
            label: `Mark ${bookings.length} appointment(s) as no-show`,
          });
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handleMarkNoShows(
          businessId,
          prompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      }
      case 'payment_sweep': {
        if (options?.planOnly) {
          const bookings = await this.findUnpaidBookingsForSweep(
            businessId,
            params,
            catalog.services,
            catalog.employees,
            employeeId,
          );
          if (!bookings.length)
            return { success: false, action, summary: '', details: {} };
          const plan = this.planBuilder.buildUpdateBookingsPlan({
            businessId,
            bookingIds: bookings.map((b) => b.id),
            paymentStatus: PaymentStatus.PAID,
            userId,
            label: `Mark ${bookings.length} unpaid appointment(s) as paid`,
          });
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handlePaymentSweep(
          businessId,
          prompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      }
      case 'update_bookings': {
        if (options?.planOnly) {
          const bookings = await this.findBookingsForBulkUpdate(
            businessId,
            params,
            catalog.services,
            catalog.employees,
            employeeId,
            prompt,
          );
          if (!bookings.length)
            return { success: false, action, summary: '', details: {} };
          const status = normalizeBookingStatusValue(params.status);
          const paymentStatus = normalizePaymentStatusValue(
            params.paymentStatus,
          );
          if (!status && !paymentStatus)
            return { success: false, action, summary: '', details: {} };
          const changeParts = [
            status ? `status → ${status}` : null,
            paymentStatus ? `payment → ${paymentStatus}` : null,
          ].filter(Boolean);
          const plan = this.planBuilder.buildUpdateBookingsPlan({
            businessId,
            bookingIds: bookings.map((b) => b.id),
            status,
            paymentStatus,
            userId,
            planAction: 'update_bookings',
            label: `Update ${bookings.length} appointment(s) (${changeParts.join(', ')})`,
          });
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handleUpdateBookings(
          businessId,
          prompt,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
          userId,
        );
        break;
      }
      case 'day_replan': {
        if (options?.planOnly) {
          const range = resolveDateRange(
            params,
            prompt,
            params._timeZone ?? 'UTC',
          );
          if (!range)
            return { success: false, action, summary: '', details: {} };
          const targets = resolveEmployees(catalog.employees, params);
          const plan = this.planBuilder.buildDayReplanPlan({
            businessId,
            date:
              params.date ??
              (range.start === range.end ? range.start : undefined),
            dateFrom: range.start !== range.end ? range.start : undefined,
            dateTo: range.start !== range.end ? range.end : undefined,
            employeeIds: targets.length ? targets.map((e) => e.id) : undefined,
            userId,
          });
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handleDayReplan(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          params._timeZone ?? 'UTC',
          userId,
        );
        break;
      }
      default:
        result = {
          success: false,
          action,
          summary: 'Unsupported compound step',
          details: {},
        };
    }

    return result;
  }

  private async handleNoShowRecovery(
    businessId: string,
    prompt: string,
    params: any,
    services: Service[],
    employees: Employee[],
    scopedEmployeeId: string | undefined,
    userId?: string,
  ): Promise<CommandResult> {
    const bookings = await this.findBookingsForMarkNoShows(
      businessId,
      params,
      services,
      employees,
      scopedEmployeeId,
      prompt,
    );
    return this.operations.handleNoShowRecovery(
      businessId,
      prompt,
      params,
      bookings.map((b) => b.id),
      userId,
    );
  }

  private async handleMarkNoShows(
    businessId: string,
    prompt: string,
    params: any,
    services: Service[],
    employees: Employee[],
    scopedEmployeeId: string | undefined,
    userId?: string,
  ): Promise<CommandResult> {
    if (isNoShowRecoveryPrompt(prompt)) {
      return this.handleNoShowRecovery(
        businessId,
        prompt,
        params,
        services,
        employees,
        scopedEmployeeId,
        userId,
      );
    }

    const bookings = await this.findBookingsForMarkNoShows(
      businessId,
      params,
      services,
      employees,
      scopedEmployeeId,
      prompt,
    );

    if (!bookings.length) {
      return {
        success: false,
        action: 'mark_no_shows',
        summary: 'No eligible past appointments found to mark as no-show.',
        details: { params },
      };
    }

    const plan = this.planBuilder.buildUpdateBookingsPlan({
      businessId,
      bookingIds: bookings.map((b) => b.id),
      status: BookingStatus.NO_SHOW,
      userId,
      label: `Mark ${bookings.length} appointment(s) as no-show`,
    });

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: resolveAutoExecute({
          action: 'mark_no_shows',
          stepCount: 1,
          providerCount: 1,
          confidence: 0.9,
        }),
      }),
    );
  }

  private async handlePaymentSweep(
    businessId: string,
    prompt: string,
    params: any,
    services: Service[],
    employees: Employee[],
    scopedEmployeeId: string | undefined,
    userId?: string,
  ): Promise<CommandResult> {
    const rawBookings = await this.findUnpaidBookingsForSweep(
      businessId,
      params,
      services,
      employees,
      scopedEmployeeId,
    );
    const { params: sweepParams, bookings } =
      this.operations.applyPaymentSweepFilters(prompt, params, rawBookings);

    if (!bookings.length) {
      return {
        success: false,
        action: 'payment_sweep',
        summary: 'No unpaid appointments found for the given filters.',
        details: { params: sweepParams },
      };
    }

    const preview = bookings
      .slice(0, 8)
      .map(
        (b) =>
          `• ${b.customer?.name ?? 'Walk-in'} — ${b.service?.name ?? 'Service'} (${formatDateDisplay(b.startTime)} ${formatTimeDisplay(b.startTime)})`,
      )
      .join('\n');

    const plan = this.planBuilder.buildUpdateBookingsPlan({
      businessId,
      bookingIds: bookings.map((b) => b.id),
      paymentStatus: PaymentStatus.PAID,
      userId,
      label: `Mark ${bookings.length} unpaid appointment(s) as paid`,
    });

    const orch = await this.orchestration.executePlan({
      plan,
      businessId,
      userId,
      autoExecute: resolveAutoExecute({
        action: 'payment_sweep',
        stepCount: 1,
        providerCount: 1,
        confidence: 0.9,
      }),
    });

    const result = this.toCommandResult(orch);
    if (bookings.length <= 8) {
      result.summary = `${result.summary}\n\n${preview}`;
    }
    result.details = {
      ...result.details,
      unpaidCount: bookings.length,
      bookingIds: bookings.map((b) => b.id),
    };
    return result;
  }

  private async handleDayReplan(
    businessId: string,
    prompt: string,
    params: any,
    employees: Employee[],
    services: Service[],
    timeZone: string,
    userId?: string,
  ): Promise<CommandResult> {
    params._timeZone = timeZone;
    const range = resolveDateRange(params, prompt, timeZone);
    if (!range) {
      return {
        success: false,
        action: 'day_replan',
        summary: 'Specify which day to replan (today, tomorrow, or a date).',
        details: { params },
      };
    }
    const targets = resolveEmployees(employees, params);
    const plans: AgentPlan[] = [];

    plans.push(
      this.planBuilder.buildDayReplanPlan({
        businessId,
        date:
          params.date ?? (range.start === range.end ? range.start : undefined),
        dateFrom: range.start !== range.end ? range.start : undefined,
        dateTo: range.start !== range.end ? range.end : undefined,
        employeeIds: targets.length ? targets.map((e) => e.id) : undefined,
        userId,
      }),
    );

    const fillPlan = await this.scheduleHandlers.prepareFillGapsPlan(
      businessId,
      prompt,
      {
        ...params,
        date: params.date ?? range.start,
        dateFrom: range.start,
        dateTo: range.end,
      },
      employees,
      services,
      userId,
    );
    if (fillPlan) plans.push(fillPlan);

    const merged =
      plans.length === 1
        ? plans[0]
        : this.planBuilder.mergePlans(businessId, 'day_replan', plans);

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan: merged,
        businessId,
        userId,
        autoExecute: false,
      }),
    );
  }

  private applyEmployeeScopeToWhere(
    where: Record<string, unknown>,
    params: Record<string, any>,
    employees: Employee[],
    scopedEmployeeId?: string,
  ): boolean {
    if (params.allProviders === true) return true;

    if (params.employeeNames?.length) {
      const resolved = resolveEmployees(employees, params);
      if (resolved.length === 0) return false;
      where.employeeId = In(resolved.map((e) => e.id));
      return true;
    }

    if (params.employeeName) {
      const employee = this.resolveEmployee(employees, params.employeeName);
      if (!employee) return false;
      where.employeeId = employee.id;
      return true;
    }

    if (scopedEmployeeId) {
      where.employeeId = scopedEmployeeId;
    }
    return true;
  }

  private applyServiceScopeToWhere(
    where: Record<string, unknown>,
    params: Record<string, any>,
    matchedServices: Service[],
  ): void {
    if (params.allAppointments === true) return;
    if (matchedServices.length > 0) {
      where.serviceId = In(matchedServices.map((s) => s.id));
    }
  }

  private applyDateScopeToWhere(
    where: Record<string, unknown>,
    params: Record<string, any>,
  ): void {
    if (params.date) {
      const isoDay = toIsoDay(params.date, params._timeZone);
      const dayStart = new Date(`${isoDay}T00:00:00.000Z`);
      const dayEnd = new Date(`${isoDay}T23:59:59.999Z`);
      where.startTime = Between(dayStart, dayEnd);
    } else if (params.dateFrom && params.dateTo) {
      const from = new Date(
        `${toIsoDay(params.dateFrom, params._timeZone)}T00:00:00.000Z`,
      );
      const to = new Date(
        `${toIsoDay(params.dateTo, params._timeZone)}T23:59:59.999Z`,
      );
      where.startTime = Between(from, to);
    }
  }

  private async findBookingsForBulkUpdate(
    businessId: string,
    params: any,
    services: Service[],
    employees: Employee[],
    scopedEmployeeId?: string,
    prompt?: string,
  ): Promise<Booking[]> {
    const matchedServices = this.resolveServices(services, params);
    const where: Record<string, unknown> = {
      businessId,
      status: Not(BookingStatus.CANCELLED),
    };

    if (
      !this.applyEmployeeScopeToWhere(
        where,
        params,
        employees,
        scopedEmployeeId,
      )
    ) {
      return [];
    }
    this.applyServiceScopeToWhere(where, params, matchedServices);
    this.applyDateScopeToWhere(where, params);

    const bookings = await this.bookingRepo.find({
      where: where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    return filterBookingsByTimeConstraints(bookings, params, prompt);
  }

  private async handleUpdateBookings(
    businessId: string,
    prompt: string,
    params: any,
    services: Service[],
    employees: Employee[],
    scopedEmployeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const status = normalizeBookingStatusValue(params.status);
    const paymentStatus = normalizePaymentStatusValue(params.paymentStatus);

    if (status === BookingStatus.CANCELLED) {
      return this.handleCancelBookings(
        businessId,
        prompt,
        params,
        services,
        employees,
        scopedEmployeeId,
        userId,
      );
    }

    if (!status && !paymentStatus) {
      return {
        success: false,
        action: 'update_bookings',
        summary:
          'Tell me what to change — e.g. mark as done, set payment to paid or N/A.',
        details: { params },
      };
    }

    if (
      params.employeeName &&
      !this.resolveEmployee(employees, params.employeeName)
    ) {
      return {
        success: false,
        action: 'update_bookings',
        summary: `No provider found matching "${params.employeeName}".`,
        details: { params },
      };
    }

    const bookings = await this.findBookingsForBulkUpdate(
      businessId,
      params,
      services,
      employees,
      scopedEmployeeId,
      prompt,
    );

    if (!bookings.length) {
      return {
        success: false,
        action: 'update_bookings',
        summary: this.buildBulkBookingNoMatchMessage(
          'update',
          params,
          services,
          prompt,
        ),
        details: { matchedCount: 0, params },
      };
    }

    const changeParts = [
      status ? `status → ${status}` : null,
      paymentStatus ? `payment → ${paymentStatus}` : null,
    ].filter(Boolean);

    const plan = this.planBuilder.buildUpdateBookingsPlan({
      businessId,
      bookingIds: bookings.map((b) => b.id),
      status,
      paymentStatus,
      userId,
      planAction: 'update_bookings',
      label: `Update ${bookings.length} appointment(s) (${changeParts.join(', ')})`,
    });

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: resolveAutoExecute({
          action: 'update_bookings',
          stepCount: 1,
          providerCount: 1,
          confidence: 0.9,
        }),
      }),
    );
  }

  private buildBulkBookingNoMatchMessage(
    verb: string,
    params: any,
    services: Service[],
    prompt?: string,
  ): string {
    const matchedServices = params.allAppointments
      ? []
      : this.resolveServices(services, params);
    const serviceFilter =
      !params.allAppointments && matchedServices.length
        ? ` for ${matchedServices.map((s) => s.name).join(', ')}`
        : '';
    const empFilter = params.employeeName ? ` for ${params.employeeName}` : '';
    const dateFilter = params.date
      ? ` on ${formatDateDisplay(params.date)}`
      : '';
    const timeFilter = hasExplicitTimeWindow(params, prompt)
      ? ` between ${params.timeFrom}–${params.timeTo}`
      : params.timeSlot
        ? ` at ${this.snapTo10min(params.timeSlot)}`
        : '';
    return `No active bookings found${empFilter}${serviceFilter}${dateFilter}${timeFilter}, so there was nothing to ${verb}.`;
  }

  private async findBookingsForMarkNoShows(
    businessId: string,
    params: any,
    services: Service[],
    employees: Employee[],
    scopedEmployeeId?: string,
    prompt?: string,
  ): Promise<Booking[]> {
    const matchedServices = this.resolveServices(services, params);
    const where: any = {
      businessId,
      status: In([
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
      ]) as any,
    };

    if (
      !this.applyEmployeeScopeToWhere(
        where,
        params,
        employees,
        scopedEmployeeId,
      )
    ) {
      return [];
    }
    this.applyServiceScopeToWhere(where, params, matchedServices);
    this.applyDateScopeToWhere(where, params);
    if (!params.date && !params.dateFrom) {
      where.startTime = Between(new Date(0), new Date()) as any;
    }

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    const now = new Date();
    return filterBookingsByTimeConstraints(
      bookings.filter((b) => b.startTime.getTime() <= now.getTime()),
      params,
      prompt,
    );
  }

  private async findUnpaidBookingsForSweep(
    businessId: string,
    params: any,
    services: Service[],
    employees: Employee[],
    scopedEmployeeId?: string,
  ): Promise<Booking[]> {
    const matchedServices = this.resolveServices(services, params);
    const where: any = {
      businessId,
      paymentStatus: PaymentStatus.PENDING,
      status: In([
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.COMPLETED,
      ]) as any,
    };

    if (
      params.employeeName &&
      !this.resolveEmployee(employees, params.employeeName)
    ) {
      return [];
    }
    if (
      !this.applyEmployeeScopeToWhere(
        where,
        params,
        employees,
        scopedEmployeeId,
      )
    ) {
      return [];
    }
    this.applyServiceScopeToWhere(where, params, matchedServices);
    this.applyDateScopeToWhere(where, params);

    return this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
      take: 100,
    });
  }

  private async findBookingsForCancel(
    businessId: string,
    params: any,
    services: Service[],
    employees: Employee[],
    scopedEmployeeId?: string,
    prompt?: string,
  ): Promise<Booking[]> {
    const matchedServices = this.resolveServices(services, params);
    const where: any = {
      businessId,
      status: Not(
        In([BookingStatus.CANCELLED, BookingStatus.COMPLETED]),
      ) as any,
    };

    if (
      !this.applyEmployeeScopeToWhere(
        where,
        params,
        employees,
        scopedEmployeeId,
      )
    ) {
      return [];
    }
    this.applyServiceScopeToWhere(where, params, matchedServices);
    this.applyDateScopeToWhere(where, params);

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    return filterBookingsByTimeConstraints(bookings, params, prompt);
  }

  private resolveCalendarVisibilityStatusFilters(
    params: any,
    mode: 'hide' | 'unhide',
  ): BookingStatus[] | null {
    const raw: string[] = [];
    if (Array.isArray(params.statusFilters)) raw.push(...params.statusFilters);
    else if (params.statusFilter) raw.push(params.statusFilter);

    const allowed = new Set(Object.values(BookingStatus));
    const resolved = raw.filter((s): s is BookingStatus =>
      allowed.has(s as BookingStatus),
    );
    if (resolved.length > 0) return resolved;

    if (mode === 'hide') {
      return [
        BookingStatus.CANCELLED,
        BookingStatus.NO_SHOW,
        BookingStatus.COMPLETED,
      ];
    }
    return null;
  }

  private async findBookingsForCalendarVisibility(
    businessId: string,
    params: any,
    services: Service[],
    employees: Employee[],
    customers: Customer[],
    scopedEmployeeId: string | undefined,
    mode: 'hide' | 'unhide',
  ): Promise<Booking[]> {
    const matchedServices = this.resolveServices(services, params);
    const statuses = this.resolveCalendarVisibilityStatusFilters(params, mode);
    const where: any = {
      businessId,
      hiddenFromCalendar: mode === 'unhide',
    };
    if (statuses) {
      where.status = In(statuses);
    }

    if (params.allProviders) {
      // no employee filter
    } else if (params.employeeNames?.length) {
      const resolved = resolveEmployees(employees, params);
      if (resolved.length === 0) return [];
      where.employeeId = In(resolved.map((e) => e.id));
    } else if (params.employeeName) {
      const employee = this.resolveEmployee(employees, params.employeeName);
      if (!employee) return [];
      where.employeeId = employee.id;
    } else if (scopedEmployeeId) {
      where.employeeId = scopedEmployeeId;
    }

    if (matchedServices.length > 0) {
      where.serviceId = In(matchedServices.map((s) => s.id));
    }

    if (params.date) {
      const isoDay = toIsoDay(params.date, params._timeZone);
      const dayStart = new Date(`${isoDay}T00:00:00.000Z`);
      const dayEnd = new Date(`${isoDay}T23:59:59.999Z`);
      where.startTime = Between(dayStart, dayEnd);
    } else if (params.dateFrom && params.dateTo) {
      const from = new Date(
        `${toIsoDay(params.dateFrom, params._timeZone)}T00:00:00.000Z`,
      );
      const to = new Date(
        `${toIsoDay(params.dateTo, params._timeZone)}T23:59:59.999Z`,
      );
      where.startTime = Between(from, to);
    }

    let bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    if (params.customerName) {
      const customer = this.resolveCustomer(customers, params.customerName);
      if (!customer) return [];
      bookings = bookings.filter((b) => b.customerId === customer.id);
    }

    bookings = filterBookingsByTimeConstraints(bookings, params);

    if (typeof params.limit === 'number' && params.limit > 0) {
      bookings = bookings.slice(0, params.limit);
    }

    return bookings;
  }

  private async findBookingsForHide(
    businessId: string,
    params: any,
    services: Service[],
    employees: Employee[],
    customers: Customer[],
    scopedEmployeeId?: string,
  ): Promise<Booking[]> {
    return this.findBookingsForCalendarVisibility(
      businessId,
      params,
      services,
      employees,
      customers,
      scopedEmployeeId,
      'hide',
    );
  }

  private formatCalendarVisibilityPeriod(params: any): string {
    if (params.dateFrom && params.dateTo) {
      const from = formatDateDisplay(params.dateFrom);
      const to = formatDateDisplay(params.dateTo);
      return from === to ? from : `${from} → ${to}`;
    }
    if (params.date) return formatDateDisplay(params.date);
    return '';
  }

  private async handleHideAppointmentsFromCalendar(
    businessId: string,
    params: any,
    services: Service[],
    employees: Employee[],
    customers: Customer[],
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const matchedServices = this.resolveServices(services, params);
    const statuses =
      this.resolveCalendarVisibilityStatusFilters(params, 'hide') ?? [];

    if (
      params.employeeName &&
      !this.resolveEmployee(employees, params.employeeName)
    ) {
      return {
        success: false,
        action: 'hide_appointments_from_calendar',
        summary: `No provider found matching "${params.employeeName}".`,
        details: { params },
      };
    }

    const bookings = await this.findBookingsForHide(
      businessId,
      params,
      services,
      employees,
      customers,
      employeeId,
    );

    if (bookings.length === 0) {
      const statusLabel = statuses.join(', ');
      const empFilter = params.allProviders
        ? ' for all providers'
        : params.employeeName
          ? ` for ${params.employeeName}`
          : '';
      const dateFilter = this.formatCalendarVisibilityPeriod(params);
      const dateLabel = dateFilter ? ` on ${dateFilter}` : '';
      return {
        success: true,
        action: 'hide_appointments_from_calendar',
        summary: `No matching ${statusLabel} appointments found${empFilter}${dateLabel}. Nothing to hide from calendar.`,
        details: {
          matchedCount: 0,
          filters: {
            statuses,
            employee:
              params.employeeName ?? (params.allProviders ? 'all' : null),
            services: matchedServices.map((s) => s.name),
            date: params.date ? formatDateDisplay(params.date) : null,
          },
        },
      };
    }

    const plan = this.planBuilder.buildHideAppointmentsPlan(
      businessId,
      bookings.map((b) => b.id),
      userId,
      {
        employeeName: params.employeeName,
        date: params.date ? formatDateDisplay(params.date) : undefined,
        services: matchedServices.map((s) => s.name),
        statuses,
      },
    );

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: bookings.length <= 10,
      }),
    );
  }

  private async handleUnhideAppointmentsFromCalendar(
    businessId: string,
    params: any,
    services: Service[],
    employees: Employee[],
    customers: Customer[],
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const matchedServices = this.resolveServices(services, params);
    const statuses = this.resolveCalendarVisibilityStatusFilters(
      params,
      'unhide',
    );

    if (
      params.employeeName &&
      !this.resolveEmployee(employees, params.employeeName)
    ) {
      return {
        success: false,
        action: 'unhide_appointments_from_calendar',
        summary: `No provider found matching "${params.employeeName}".`,
        details: { params },
      };
    }

    const bookings = await this.findBookingsForCalendarVisibility(
      businessId,
      params,
      services,
      employees,
      customers,
      employeeId,
      'unhide',
    );

    if (bookings.length === 0) {
      const statusLabel = statuses?.length ? statuses.join(', ') : 'hidden';
      const empFilter = params.allProviders
        ? ' for all providers'
        : params.employeeName
          ? ` for ${params.employeeName}`
          : '';
      const dateLabel = this.formatCalendarVisibilityPeriod(params);
      const periodFilter = dateLabel ? ` on ${dateLabel}` : '';
      return {
        success: true,
        action: 'unhide_appointments_from_calendar',
        summary: `No matching ${statusLabel} hidden appointments found${empFilter}${periodFilter}. Nothing to restore on calendar.`,
        details: {
          matchedCount: 0,
          filters: {
            statuses: statuses ?? null,
            employee:
              params.employeeName ?? (params.allProviders ? 'all' : null),
            services: matchedServices.map((s) => s.name),
            date: params.date ? formatDateDisplay(params.date) : null,
            dateFrom: params.dateFrom
              ? formatDateDisplay(params.dateFrom)
              : null,
            dateTo: params.dateTo ? formatDateDisplay(params.dateTo) : null,
          },
        },
      };
    }

    const plan = this.planBuilder.buildUnhideAppointmentsPlan(
      businessId,
      bookings.map((b) => b.id),
      userId,
      {
        employeeName: params.employeeName,
        date: params.date ? formatDateDisplay(params.date) : undefined,
        dateFrom: params.dateFrom
          ? formatDateDisplay(params.dateFrom)
          : undefined,
        dateTo: params.dateTo ? formatDateDisplay(params.dateTo) : undefined,
        services: matchedServices.map((s) => s.name),
        statuses: statuses ?? undefined,
      },
    );

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: bookings.length <= 10,
      }),
    );
  }

  private async handleCreateService(
    businessId: string,
    params: any,
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const parsed = this.parseServiceDraft(params, params.currency || 'USD');
    if (parsed.errors.length > 0 || !parsed.draft) {
      return {
        success: false,
        action: 'create_service',
        summary: `Cannot add service — ${parsed.errors.join(', ') || 'invalid service data'}. Example: "Add a service facemassage, 60 minutes, price 50".`,
        details: { params, errors: parsed.errors },
      };
    }

    const draft = parsed.draft;
    const existing = this.resolveService(services, draft.name);
    if (existing) {
      return {
        success: false,
        action: 'create_service',
        summary: `A service matching "${draft.name}" already exists: "${existing.name}". Choose a different name or update the existing service in Services.`,
        details: {
          params,
          existingServiceId: existing.id,
          existingServiceName: existing.name,
        },
      };
    }

    const plan = this.planBuilder.buildCreateServicePlan({
      businessId,
      ...draft,
      userId,
    });

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: true,
      }),
    );
  }

  private async handleCreateServices(
    businessId: string,
    params: any,
    catalog: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const rawList = Array.isArray(params.services) ? params.services : [];
    const defaultCurrency = (params.currency || 'USD').trim().toUpperCase();

    if (rawList.length === 0) {
      return {
        success: false,
        action: 'create_services',
        summary:
          'Cannot bulk-add services — no services listed. Example: "Add services: facemassage 60min $50, haircut 30min $25, manicure 45min $40".',
        details: { params },
      };
    }

    if (rawList.length > 25) {
      return {
        success: false,
        action: 'create_services',
        summary:
          'Too many services in one request (max 25). Split into smaller batches.',
        details: { params, count: rawList.length },
      };
    }

    const skipped: { name: string; reason: string }[] = [];
    const toCreate: ParsedServiceDraft[] = [];
    const batchNames = new Set<string>();

    for (const raw of rawList) {
      const label = (raw?.serviceName || raw?.name || 'Unnamed').trim();
      const parsed = this.parseServiceDraft(raw ?? {}, defaultCurrency);

      if (parsed.errors.length > 0 || !parsed.draft) {
        skipped.push({
          name: label || 'Unnamed',
          reason: parsed.errors.join(', '),
        });
        continue;
      }

      const draft = parsed.draft;
      const key = draft.name.toLowerCase();
      if (batchNames.has(key)) {
        skipped.push({ name: draft.name, reason: 'Duplicate in this request' });
        continue;
      }

      const existing = this.resolveService(catalog, draft.name);
      if (existing) {
        skipped.push({
          name: draft.name,
          reason: `Already exists as "${existing.name}"`,
        });
        continue;
      }

      batchNames.add(key);
      toCreate.push(draft);
    }

    if (toCreate.length === 0) {
      return {
        success: false,
        action: 'create_services',
        summary: `No services could be created. Skipped ${skipped.length}: ${skipped.map((s) => `${s.name} (${s.reason})`).join('; ')}.`,
        details: { params, skipped },
      };
    }

    const plan = this.planBuilder.buildCreateServicesPlan({
      businessId,
      services: toCreate,
      userId,
    });

    const orchResult = await this.orchestration.executePlan({
      plan,
      businessId,
      userId,
      autoExecute: true,
    });

    const result = this.toCommandResult(orchResult);
    result.action = 'create_services';
    result.details = {
      ...result.details,
      skipped,
      createdCount: toCreate.length,
    };

    if (skipped.length > 0) {
      result.summary = [
        result.summary,
        '',
        `Skipped ${skipped.length}: ${skipped.map((s) => `${s.name} (${s.reason})`).join('; ')}.`,
      ].join('\n');
    }

    return result;
  }

  private parseServiceDraft(
    raw: Record<string, any>,
    defaultCurrency = 'USD',
  ): { draft: ParsedServiceDraft | null; errors: string[] } {
    const name = (raw.serviceName || raw.name || '').trim();
    const durationMinutes = this.parseMinutes(
      raw.durationMinutes ?? raw.duration,
    );
    const price = this.parsePrice(raw.price);
    const bufferMinutes = this.parseMinutes(raw.bufferMinutes) ?? 0;
    const currency = (raw.currency || defaultCurrency).trim().toUpperCase();
    const description = raw.description?.trim() || undefined;

    const errors: string[] = [];
    if (!name) errors.push('name required');
    if (durationMinutes == null) errors.push('duration required');
    else if (durationMinutes < 10) errors.push('duration min 10 minutes');
    if (price == null) errors.push('price required');
    else if (price < 0) errors.push('price cannot be negative');

    if (errors.length > 0) {
      return { draft: null, errors };
    }

    return {
      draft: {
        name,
        description,
        durationMinutes: durationMinutes as number,
        bufferMinutes,
        price: price as number,
        currency,
      },
      errors: [],
    };
  }

  private parseMinutes(value: unknown): number | undefined {
    if (typeof value === 'number' && !Number.isNaN(value))
      return Math.round(value);
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      const hourMatch = trimmed.match(/([\d.]+)\s*h(?:our|rs?)?/);
      if (hourMatch) return Math.round(parseFloat(hourMatch[1]) * 60);
      const minMatch = trimmed.match(/([\d.]+)/);
      if (minMatch) return Math.round(parseFloat(minMatch[1]));
    }
    return undefined;
  }

  private parsePrice(value: unknown): number | undefined {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.]/g, '');
      if (cleaned) {
        const parsed = parseFloat(cleaned);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
    }
    return undefined;
  }

  private async handleCancelBookings(
    businessId: string,
    prompt: string,
    params: any,
    services: Service[],
    employees: Employee[],
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const matchedServices = this.resolveServices(services, params);
    const requestedServiceLabels = [
      ...(params.serviceNames ?? []),
      ...(params.serviceName && !params.serviceNames?.length
        ? [params.serviceName]
        : []),
    ].filter(Boolean);

    if (
      requestedServiceLabels.length > 0 &&
      matchedServices.length === 0 &&
      !params.allAppointments
    ) {
      return {
        success: false,
        action: 'cancel_bookings',
        summary: `No matching service type(s) found for: ${requestedServiceLabels.join(', ')}. Available: ${services.map((s) => s.name).join(', ')}`,
        details: {
          requestedServiceLabels,
          availableServices: services.map((s) => s.name),
        },
      };
    }

    if (
      params.employeeName &&
      !this.resolveEmployee(employees, params.employeeName)
    ) {
      return {
        success: false,
        action: 'cancel_bookings',
        summary: `No provider found matching "${params.employeeName}".`,
        details: { params },
      };
    }

    const bookings = await this.findBookingsForCancel(
      businessId,
      params,
      services,
      employees,
      employeeId,
      prompt,
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'cancel_bookings',
        summary: this.buildBulkBookingNoMatchMessage(
          'cancel',
          params,
          services,
          prompt,
        ),
        details: {
          matchedCount: 0,
          filters: {
            employee: params.employeeName ?? null,
            services: params.allAppointments
              ? []
              : matchedServices.map((s) => s.name),
            date: params.date ? formatDateDisplay(params.date) : null,
            timeFrom: params.timeFrom ?? null,
            timeTo: params.timeTo ?? null,
            timeSlot: params.timeSlot ?? null,
            allAppointments: params.allAppointments ?? false,
          },
        },
      };
    }

    const reason = params.reason || 'Cancelled via AI command';
    const plan = this.planBuilder.buildCancelBookingsPlan(
      businessId,
      bookings.map((b) => b.id),
      reason,
      userId,
      {
        employeeName: params.employeeName,
        date: params.date ? formatDateDisplay(params.date) : undefined,
        services: matchedServices.map((s) => s.name),
        notifyCustomers: Boolean(params.notifyCustomers),
      },
    );

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: bookings.length <= 5,
      }),
    );
  }

  private formatBookingTime(start: Date, end: Date): string {
    return formatTimeRangeDisplay(start, end);
  }

  private formatBookingLines(
    bookings: Booking[],
    options: { includeProvider?: boolean } = {},
  ): string[] {
    return bookings.map((b) => {
      const time = this.formatBookingTime(b.startTime, b.endTime);
      const providerPart = options.includeProvider
        ? ` | ${b.employee?.name || 'Unknown'}`
        : '';
      return `  • ${time} | ${b.service?.name || 'Service'} | ${b.customer?.name || 'Walk-in'}${providerPart} | ${b.status}`;
    });
  }

  private async describeProvidersOnServiceSchedule(
    businessId: string,
    params: Record<string, any>,
    catalogServices: Service[],
    range: { start: string; end: string },
  ): Promise<string | null> {
    if (!params.serviceName && !params.timeSlot) return null;

    const dayStart = new Date(range.start);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(range.end);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const periods = await this.periodRepo.find({
      where: {
        businessId,
        startTime: Between(dayStart, dayEnd),
      },
      relations: { employee: true },
      order: { startTime: 'ASC' },
    });

    const matchedServices = params.serviceName
      ? this.resolveServices(catalogServices, params)
      : [];
    const serviceIds = new Set<string>();
    if (matchedServices.length > 0) {
      matchedServices.forEach((s) => serviceIds.add(s.id));
    } else if (params.serviceName) {
      const needle = String(params.serviceName).toLowerCase();
      catalogServices
        .filter((s) => s.name.toLowerCase().includes(needle))
        .forEach((s) => serviceIds.add(s.id));
    }

    const targetTime = params.timeSlot
      ? this.snapTo10min(params.timeSlot)
      : null;
    const targetMs = targetTime
      ? (() => {
          const [h, m] = targetTime.split(':').map(Number);
          const t = new Date(range.start);
          t.setUTCHours(h, m, 0, 0);
          return t.getTime();
        })()
      : null;

    const providers = new Map<string, string[]>();
    for (const period of periods) {
      if (period.type !== TemplatePeriodType.SERVICE_BLOCK) continue;
      if (serviceIds.size > 0) {
        const ids = period.serviceIds ?? [];
        if (ids.length > 0 && !ids.some((id) => serviceIds.has(id))) continue;
      }
      if (targetMs != null) {
        if (
          period.startTime.getTime() > targetMs ||
          period.endTime.getTime() <= targetMs
        ) {
          continue;
        }
      }
      const name = period.employee?.name ?? 'Unknown provider';
      const block = `${formatTimeDisplay(period.startTime)}–${formatTimeDisplay(period.endTime)}`;
      if (!providers.has(name)) providers.set(name, []);
      providers.get(name)!.push(block);
    }

    if (providers.size === 0) return null;

    const serviceLabel = params.serviceName
      ? String(params.serviceName)
      : 'service';
    const timeLabel = targetTime ? ` at ${targetTime}` : '';
    const dateLabel = formatDateDisplay(range.start);
    const lines = [
      `Providers on ${serviceLabel} schedule${timeLabel} on ${dateLabel} (shift blocks, not bookings):`,
      ...[...providers.entries()].map(
        ([name, blocks]) => `• ${name} — ${[...new Set(blocks)].join(', ')}`,
      ),
    ];
    return lines.join('\n');
  }

  private async handleListBookings(
    businessId: string,
    prompt: string,
    params: any,
    employeeId?: string,
    employeeName?: string,
    catalogServices?: Service[],
  ): Promise<CommandResult> {
    const where: any = { businessId };
    if (employeeId) where.employeeId = employeeId;
    if (params.customerId) where.customerId = params.customerId;

    const upcomingOnly = params.upcomingOnly === true;
    const range =
      resolveDateRange(params, prompt) ??
      (() => {
        const iso = params.date || new Date().toISOString().split('T')[0];
        if (upcomingOnly) {
          const end = new Date(iso);
          end.setUTCDate(end.getUTCDate() + 14);
          return { start: iso, end: end.toISOString().split('T')[0] };
        }
        return { start: iso, end: iso };
      })();

    const clamped = clampReadDateRangeDays(
      range.start,
      range.end,
      MAX_AI_READ_DATE_RANGE_DAYS,
    );

    const start = new Date(clamped.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(clamped.end);
    end.setUTCHours(23, 59, 59, 999);
    where.startTime = Between(start, end);

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    const statusFilter = params.statusFilter as string | undefined;
    let scopedBookings = statusFilter
      ? bookings.filter((b) => b.status === statusFilter)
      : bookings;

    if (upcomingOnly) {
      const now = new Date();
      scopedBookings = scopedBookings.filter(
        (b) =>
          new Date(b.startTime) >= now && b.status !== BookingStatus.CANCELLED,
      );
    }

    if (
      Array.isArray(params.employeeNames) &&
      params.employeeNames.length > 0 &&
      !employeeId
    ) {
      const needles = params.employeeNames.map((n: string) => n.toLowerCase());
      scopedBookings = scopedBookings.filter((b) =>
        needles.some((needle) =>
          b.employee?.name?.toLowerCase().includes(needle),
        ),
      );
    }

    const matchedServices = params.serviceName
      ? this.resolveServices(catalogServices ?? [], params)
      : [];
    if (
      params.serviceName &&
      matchedServices.length === 0 &&
      catalogServices?.length
    ) {
      const needle = String(params.serviceName).toLowerCase();
      const partialIds = new Set(
        catalogServices
          .filter((s) => s.name.toLowerCase().includes(needle))
          .map((s) => s.id),
      );
      if (partialIds.size > 0) {
        scopedBookings = scopedBookings.filter(
          (b) => b.serviceId && partialIds.has(b.serviceId),
        );
      } else {
        scopedBookings = scopedBookings.filter((b) =>
          b.service?.name?.toLowerCase().includes(needle),
        );
      }
    } else if (matchedServices.length > 0) {
      const ids = new Set(matchedServices.map((s) => s.id));
      scopedBookings = scopedBookings.filter(
        (b) => b.serviceId && ids.has(b.serviceId),
      );
    }

    if (params.timeSlot) {
      const target = this.snapTo10min(params.timeSlot);
      scopedBookings = scopedBookings.filter(
        (b) => formatTimeDisplay(b.startTime) === target,
      );
    }

    const rangeLabel =
      clamped.start === clamped.end
        ? formatDateDisplay(clamped.start)
        : `${formatDateDisplay(clamped.start)} → ${formatDateDisplay(clamped.end)}`;
    const scopeLabel = employeeName || 'all service providers';
    const customerLabel = params.customerName
      ? ` for ${params.customerName}`
      : '';
    const statusLabel = statusFilter ? ` (${statusFilter})` : '';

    const activeBookings = scopedBookings.filter(
      (b) => b.status !== BookingStatus.CANCELLED,
    );
    const cancelledBookings = scopedBookings.filter(
      (b) => b.status === BookingStatus.CANCELLED,
    );
    let displayBookings = statusFilter ? scopedBookings : activeBookings;
    const totalMatched = displayBookings.length;
    if (displayBookings.length > MAX_AI_LIST_BOOKINGS) {
      displayBookings = displayBookings.slice(0, MAX_AI_LIST_BOOKINGS);
    }
    const truncatedNote =
      totalMatched > MAX_AI_LIST_BOOKINGS
        ? `\n(Showing first ${MAX_AI_LIST_BOOKINGS} of ${totalMatched} appointments.)`
        : clamped.truncated
          ? `\n(Date range limited to ${MAX_AI_READ_DATE_RANGE_DAYS} days for security.)`
          : '';

    let summaryBody: string;
    if (scopedBookings.length === 0) {
      const scheduleHint = await this.describeProvidersOnServiceSchedule(
        businessId,
        params,
        catalogServices ?? [],
        range,
      );
      const serviceLabel = params.serviceName
        ? ` for ${params.serviceName}`
        : '';
      const timeLabel = params.timeSlot
        ? ` at ${this.snapTo10min(params.timeSlot)}`
        : '';
      summaryBody = scheduleHint
        ? scheduleHint
        : `No appointments found for ${scopeLabel}${customerLabel}${serviceLabel}${timeLabel} on ${rangeLabel}${statusLabel}.`;
    } else if (employeeId || params.customerId) {
      const lines = this.formatBookingLines(displayBookings);
      const cancelledNote =
        !statusFilter && cancelledBookings.length > 0
          ? `\n(${cancelledBookings.length} cancelled — hidden)`
          : '';
      summaryBody = [
        `${displayBookings.length} appointment(s) for ${scopeLabel}${customerLabel} on ${rangeLabel}${statusLabel}:${cancelledNote}${truncatedNote}`,
        ...lines,
      ].join('\n');
    } else {
      const byProvider = new Map<string, Booking[]>();
      for (const booking of displayBookings) {
        const name = booking.employee?.name || 'Unknown provider';
        if (!byProvider.has(name)) byProvider.set(name, []);
        byProvider.get(name)!.push(booking);
      }

      const groupedLines: string[] = [];
      for (const [name, providerBookings] of [...byProvider.entries()].sort(
        (a, b) => a[0].localeCompare(b[0]),
      )) {
        groupedLines.push(`\n${name} (${providerBookings.length}):`);
        groupedLines.push(...this.formatBookingLines(providerBookings));
      }

      const cancelledNote =
        !statusFilter && cancelledBookings.length > 0
          ? `\n(${cancelledBookings.length} cancelled across all providers — hidden)`
          : '';
      summaryBody = [
        `${displayBookings.length} appointment(s) for all service providers${customerLabel} on ${rangeLabel}${statusLabel}:${cancelledNote}${truncatedNote}`,
        ...groupedLines,
      ].join('\n');
    }

    return {
      success: true,
      action: 'show_appointments',
      summary: summaryBody,
      details: {
        count: totalMatched,
        activeCount: activeBookings.length,
        cancelledCount: cancelledBookings.length,
        date:
          clamped.start === clamped.end
            ? formatDateDisplay(clamped.start)
            : null,
        range: { start: clamped.start, end: clamped.end },
        statusFilter: statusFilter ?? null,
        customer: params.customerName ?? null,
        scope: employeeId
          ? 'provider'
          : params.customerId
            ? 'customer'
            : 'all_providers',
        employee: employeeName ?? null,
        truncated: totalMatched > MAX_AI_LIST_BOOKINGS || clamped.truncated,
        bookings: displayBookings.map((b) => ({
          id: b.id,
          service: b.service?.name,
          customer: b.customer?.name,
          employee: b.employee?.name,
          startTime: formatTimeDisplay(b.startTime),
          endTime: formatTimeDisplay(b.endTime),
          status: b.status,
        })),
      },
    };
  }

  private async serviceNameMap(
    businessId: string,
    serviceIds: string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(serviceIds.filter(Boolean))];
    if (unique.length === 0) return new Map();

    const services = await this.serviceRepo.find({
      where: { businessId, id: In(unique) },
    });
    return new Map(services.map((s) => [s.id, s.name]));
  }

  private formatPeriodServices(
    serviceIds: string[] | null | undefined,
    nameMap: Map<string, string>,
  ): string {
    if (!serviceIds?.length) return 'any service';
    return serviceIds.map((id) => nameMap.get(id) || id).join(', ');
  }

  private formatNonServicePeriod(p: SchedulingPeriod): string {
    const from = formatTimeDisplay(p.startTime);
    const to = formatTimeDisplay(p.endTime);
    const note = p.placeholderLabel?.trim();

    if (p.type === TemplatePeriodType.UNAVAILABLE_BLOCK) {
      return `• ${from}–${to} — Unavailable${note ? `: ${note}` : ''}`;
    }
    if (p.type === TemplatePeriodType.BLOCKED_TIME) {
      return `• ${from}–${to} — Blocked${note ? `: ${note}` : ''}`;
    }
    return `• ${from}–${to} — Blocked${note ? `: ${note}` : ''}`;
  }

  private timesOverlap(
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date,
  ): boolean {
    return startA < endB && endA > startB;
  }

  private mergeOpenSlotRanges(
    slots: Array<{ startTime: Date; endTime: Date }>,
  ): Array<{ start: string; end: string }> {
    if (slots.length === 0) return [];

    const sorted = [...slots].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );
    const merged: Array<{ start: Date; end: Date }> = [
      { start: sorted[0].startTime, end: sorted[0].endTime },
    ];

    for (let i = 1; i < sorted.length; i++) {
      const slot = sorted[i];
      const last = merged[merged.length - 1];
      if (slot.startTime.getTime() <= last.end.getTime()) {
        if (slot.endTime > last.end) last.end = slot.endTime;
      } else {
        merged.push({ start: slot.startTime, end: slot.endTime });
      }
    }

    return merged.map((r) => ({
      start: formatTimeDisplay(r.start),
      end: formatTimeDisplay(r.end),
    }));
  }

  private async getProviderAvailabilityForService(
    businessId: string,
    employeeId: string,
    serviceId: string,
    isoDay: string,
  ): Promise<{
    hasSchedule: boolean;
    hasServiceBlock: boolean;
    scheduledBlocks: Array<{ start: string; end: string }>;
    openSlots: Array<{ start: string; end: string }>;
  }> {
    const d = parseDateInput(isoDay) ?? new Date(isoDay);
    const dayStart = new Date(d);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId },
    });
    const minGapMinutes =
      service?.durationMinutes && service.durationMinutes > 0
        ? service.durationMinutes
        : 10;

    const [periods, bookings] = await Promise.all([
      this.periodRepo.find({
        where: {
          businessId,
          employeeId,
          startTime: Between(dayStart, dayEnd) as any,
        },
        order: { startTime: 'ASC' },
      }),
      this.bookingRepo.find({
        where: {
          businessId,
          employeeId,
          startTime: Between(dayStart, dayEnd) as any,
          status: Not(BookingStatus.CANCELLED) as any,
        },
        order: { startTime: 'ASC' },
      }),
    ]);

    const serviceBlocks = periods.filter(
      (p) =>
        p.type === TemplatePeriodType.SERVICE_BLOCK &&
        (!p.serviceIds?.length || p.serviceIds.includes(serviceId)),
    );

    if (serviceBlocks.length === 0) {
      return {
        hasSchedule: periods.length > 0,
        hasServiceBlock: false,
        scheduledBlocks: [],
        openSlots: [],
      };
    }

    const scheduledBlocks = serviceBlocks.map((block) => ({
      start: formatTimeDisplay(block.startTime),
      end: formatTimeDisplay(block.endTime),
    }));

    const openSlotCandidates: Array<{ startTime: Date; endTime: Date }> = [];
    for (const block of serviceBlocks) {
      const occupied = bookings
        .filter((b) =>
          this.timesOverlap(
            block.startTime,
            block.endTime,
            b.startTime,
            b.endTime,
          ),
        )
        .map((b) => ({ startTime: b.startTime, endTime: b.endTime }));

      const gaps = findScheduleGapsInWindow(
        d,
        formatTimeDisplay(block.startTime),
        formatTimeDisplay(block.endTime),
        occupied,
        minGapMinutes,
      );

      for (const gap of gaps) {
        const [sh, sm] = gap.startTime.split(':').map(Number);
        const [eh, em] = gap.endTime.split(':').map(Number);
        const startTime = new Date(d);
        startTime.setUTCHours(sh, sm, 0, 0);
        const endTime = new Date(d);
        endTime.setUTCHours(eh, em, 0, 0);
        openSlotCandidates.push({ startTime, endTime });
      }
    }

    return {
      hasSchedule: true,
      hasServiceBlock: true,
      scheduledBlocks,
      openSlots: this.mergeOpenSlotRanges(openSlotCandidates),
    };
  }

  private async handleCheckAvailability(
    businessId: string,
    params: any,
    employeeId?: string,
    employeeName?: string,
    prompt?: string,
    skipMultiWindow = false,
  ): Promise<CommandResult> {
    const timeZone = params._timeZone ?? 'UTC';
    const enriched = enrichDashboardCheckAvailabilityParams(
      { ...params },
      prompt,
    );

    if (!skipMultiWindow) {
      const windows = resolveDashboardCheckAvailabilityWindows(
        enriched,
        prompt,
        timeZone,
      );
      if (shouldGroupDashboardAvailabilityByWindow(windows, enriched)) {
        const todayKey = dashboardAvailabilityTodayKey(timeZone);
        const sections: string[] = [];
        for (const window of windows) {
          if (window.dateKeys.length === 0) continue;
          const singleParams = buildSingleWindowCheckParams(enriched, window);
          const part = await this.handleCheckAvailability(
            businessId,
            singleParams,
            employeeId,
            employeeName,
            prompt,
            true,
          );
          const label = buildDashboardAvailabilityWindowLabel(
            window,
            timeZone,
            todayKey,
          );
          sections.push(`${label}:\n${part.summary}`);
        }
        if (sections.length > 0) {
          return {
            success: true,
            action: 'check_availability',
            summary: sections.join('\n\n'),
            details: { windows: windows.length, multiWindow: true },
          };
        }
      }
      params = enriched;
    }

    const isoDay = params.date || new Date().toISOString().split('T')[0];
    const displayDay = formatDateDisplay(isoDay);
    const timeOfDay = parseTimeOfDayWindow('', params);

    if (
      employeeId &&
      employeeName &&
      params.serviceName &&
      (params.timeSlot || timeOfDay)
    ) {
      const services = await this.serviceRepo.find({ where: { businessId } });
      const service = this.resolveService(services, params.serviceName);
      if (service) {
        const row = await this.getProviderAvailabilityForService(
          businessId,
          employeeId,
          service.id,
          isoDay,
        );
        const windowSlots = timeOfDay
          ? filterSlotsByTimeOfDay(row.openSlots, timeOfDay)
          : row.openSlots;

        if (params.timeSlot) {
          const targetTime = this.snapTo10min(params.timeSlot);
          const slotOpen = windowSlots.some(
            (s) => targetTime >= s.start && targetTime < s.end,
          );

          let summary: string;
          if (!row.hasSchedule) {
            summary = `${employeeName} has no schedule on ${displayDay}.`;
          } else if (windowSlots.length === 0) {
            summary = `${employeeName} is scheduled for ${service.name} on ${displayDay}, but has no open bookable slots${timeOfDay ? ` in the ${formatTimeOfDayLabel(timeOfDay)}` : ''}.`;
          } else if (slotOpen) {
            summary = `Yes — ${employeeName} has an open slot for ${service.name} on ${displayDay} at ${targetTime}.`;
          } else {
            summary = `No — ${employeeName} is not available for ${service.name} at ${targetTime} on ${displayDay}. Open slots: ${windowSlots.map((s) => `${s.start}–${s.end}`).join(', ') || 'none'}.`;
          }

          return {
            success: true,
            action: 'check_availability',
            summary,
            details: {
              date: displayDay,
              employee: employeeName,
              serviceName: service.name,
              timeSlot: targetTime,
              timeOfDay,
              available: slotOpen,
              openSlots: windowSlots,
              hasSchedule: row.hasSchedule,
            },
          };
        }

        const windowLabel = timeOfDay
          ? formatTimeOfDayLabel(timeOfDay)
          : 'the day';
        const summary = !row.hasSchedule
          ? `${employeeName} has no schedule on ${displayDay}.`
          : windowSlots.length === 0
            ? `No ${service.name} slots for ${employeeName} on ${displayDay} during ${windowLabel}.`
            : `${employeeName} has ${windowSlots.length} open ${service.name} slot(s) on ${displayDay} during ${windowLabel}: ${windowSlots.map((s) => `${s.start}–${s.end}`).join(', ')}.`;

        return {
          success: true,
          action: 'check_availability',
          summary,
          details: {
            date: displayDay,
            employee: employeeName,
            serviceName: service.name,
            timeOfDay,
            available: windowSlots.length > 0,
            openSlots: windowSlots,
            hasSchedule: row.hasSchedule,
          },
        };
      }
    }

    const d = new Date(isoDay);
    const dayStart = new Date(d);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const where: any = {
      businessId,
      startTime: Between(dayStart, dayEnd) as any,
    };
    if (employeeId) where.employeeId = employeeId;

    const [periods, bookings, openSlots] = await Promise.all([
      this.periodRepo.find({ where, order: { startTime: 'ASC' } }),
      this.bookingRepo.find({
        where: {
          businessId,
          ...(employeeId ? { employeeId } : {}),
          startTime: Between(dayStart, dayEnd) as any,
          status: Not(BookingStatus.CANCELLED) as any,
        },
        relations: { service: true, customer: true },
        order: { startTime: 'ASC' },
      }),
      employeeId
        ? this.slotRepo
            .createQueryBuilder('slot')
            .where('slot.business_id = :businessId', { businessId })
            .andWhere('slot.employee_id = :employeeId', { employeeId })
            .andWhere('slot.startTime >= :dayStart', { dayStart })
            .andWhere('slot.startTime <= :dayEnd', { dayEnd })
            .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
            .andWhere('slot.appointmentCount < slot.maxAppointmentCount')
            .orderBy('slot.startTime', 'ASC')
            .getMany()
        : Promise.resolve([]),
    ]);

    const serviceBlocks = periods.filter(
      (p) => p.type === TemplatePeriodType.SERVICE_BLOCK,
    );
    const nonService = periods.filter(
      (p) => p.type !== TemplatePeriodType.SERVICE_BLOCK,
    );

    const nameMap = await this.serviceNameMap(businessId, [
      ...periods.flatMap((p) => p.serviceIds ?? []),
      ...bookings.map((b) => b.serviceId).filter(Boolean),
    ]);

    const scopeLabel = employeeName || 'all service providers';

    if (periods.length === 0) {
      return {
        success: true,
        action: 'check_availability',
        summary: `No schedule applied for ${scopeLabel} on ${displayDay}.`,
        details: {
          date: displayDay,
          employee: employeeName ?? null,
          periods: [],
          bookings: [],
          openSlots: [],
        },
      };
    }

    const scheduleLines = [
      ...serviceBlocks.map((p) => {
        const from = formatTimeDisplay(p.startTime);
        const to = formatTimeDisplay(p.endTime);
        const services = this.formatPeriodServices(p.serviceIds, nameMap);
        return `• ${from}–${to} — ${services}`;
      }),
      ...nonService.map((p) => this.formatNonServicePeriod(p)),
    ];

    const bookingLines =
      bookings.length > 0 ? this.formatBookingLines(bookings) : ['  (none)'];

    let openSlotRanges = this.mergeOpenSlotRanges(openSlots);
    if (timeOfDay) {
      openSlotRanges = filterSlotsByTimeOfDay(openSlotRanges, timeOfDay);
    }
    const timeOfDayLabel = timeOfDay
      ? ` (${formatTimeOfDayLabel(timeOfDay)})`
      : '';
    const openSlotLines =
      openSlotRanges.length > 0
        ? openSlotRanges.map((r) => `• ${r.start}–${r.end}`)
        : [
            `  (none — all bookable time is taken or no open micro-slots${timeOfDayLabel})`,
          ];

    const blockAvailabilityLines = serviceBlocks.map((block) => {
      const from = formatTimeDisplay(block.startTime);
      const to = formatTimeDisplay(block.endTime);
      const services = this.formatPeriodServices(block.serviceIds, nameMap);
      const blockBookings = bookings.filter((b) =>
        this.timesOverlap(
          block.startTime,
          block.endTime,
          b.startTime,
          b.endTime,
        ),
      );
      const blockOpen = openSlots.filter(
        (s) => s.startTime >= block.startTime && s.startTime < block.endTime,
      );
      const blockOpenRanges = this.mergeOpenSlotRanges(blockOpen);
      const openSummary =
        blockOpenRanges.length > 0
          ? blockOpenRanges.map((r) => `${r.start}–${r.end}`).join(', ')
          : 'fully booked or no open micro-slots';

      return `• ${from}–${to} — ${services} | ${blockBookings.length} booked | open: ${openSummary}`;
    });

    const summaryParts = [
      `Available slots for ${scopeLabel} on ${displayDay}${timeOfDayLabel}:`,
      '',
      'Applied schedule:',
      ...scheduleLines,
      '',
      `Already booked (${bookings.length}):`,
      ...bookingLines,
      '',
      'Open bookable slots:',
      ...openSlotLines,
      '',
      'Availability by service block:',
      ...blockAvailabilityLines,
    ];

    return {
      success: true,
      action: 'check_availability',
      summary: summaryParts.join('\n'),
      details: {
        date: displayDay,
        employee: employeeName ?? null,
        serviceBlocks: serviceBlocks.length,
        blockedPeriods: nonService.length,
        periods: periods.map((p) => ({
          type: p.type,
          startTime: formatTimeDisplay(p.startTime),
          endTime: formatTimeDisplay(p.endTime),
          services:
            p.type === TemplatePeriodType.SERVICE_BLOCK
              ? this.formatPeriodServices(p.serviceIds, nameMap)
              : null,
          label:
            p.type !== TemplatePeriodType.SERVICE_BLOCK
              ? p.placeholderLabel ||
                (p.type === TemplatePeriodType.UNAVAILABLE_BLOCK
                  ? 'Unavailable'
                  : 'Blocked')
              : p.placeholderLabel,
          serviceIds: p.serviceIds ?? [],
        })),
        bookings: bookings.map((b) => ({
          service: b.service?.name || 'Service',
          customer: b.customer?.name || 'Walk-in',
          startTime: formatTimeDisplay(b.startTime),
          endTime: formatTimeDisplay(b.endTime),
          status: b.status,
        })),
        openSlots: openSlotRanges,
        blockAvailability: blockAvailabilityLines,
      },
    };
  }

  private async handleSummarizeDay(
    businessId: string,
    params: any,
    employeeId?: string,
    employeeName?: string,
  ): Promise<CommandResult> {
    const isoDay = params.date || new Date().toISOString().split('T')[0];
    const displayDay = formatDateDisplay(isoDay);

    const [bookingsResult, availResult] = await Promise.all([
      this.handleListBookings(
        businessId,
        '',
        { ...params, date: isoDay },
        employeeId,
        employeeName,
      ),
      this.handleCheckAvailability(
        businessId,
        { ...params, date: isoDay },
        employeeId,
        employeeName,
      ),
    ]);

    const bookings = bookingsResult.details.bookings || [];
    const active = bookings.filter((b: any) => b.status !== 'cancelled');
    const cancelled = bookings.filter((b: any) => b.status === 'cancelled');
    const scopeLabel = employeeName || 'all service providers';

    return {
      success: true,
      action: 'summarize_day',
      summary: [
        `Day summary for ${scopeLabel} on ${displayDay}:`,
        `  Schedule: ${availResult.details.serviceBlocks || 0} service blocks, ${availResult.details.blockedPeriods || 0} blocked periods`,
        `  Appointments: ${active.length} active, ${cancelled.length} cancelled`,
        active.length > 0 ? `  Active appointments:` : '',
        ...active.map(
          (b: any) =>
            `    • ${formatTimeRangeDisplay(b.startTime, b.endTime)} | ${b.service || 'Service'} | ${b.customer || 'Walk-in'}${employeeName ? '' : ` | ${b.employee || 'Unknown'}`}`,
        ),
      ]
        .filter(Boolean)
        .join('\n'),
      details: {
        date: displayDay,
        scope: employeeId ? 'provider' : 'all_providers',
        employee: employeeName ?? null,
        schedule: availResult.details,
        bookings: bookingsResult.details,
      },
    };
  }

  private pickBookingForReschedule(
    bookings: Booking[],
    params: any,
  ): Booking | null {
    if (!bookings.length) return null;

    const timeZone = params._timeZone ?? 'UTC';
    const isoDay = params.fromDate ? toIsoDay(params.fromDate, timeZone) : null;
    const slot = params.fromTimeSlot
      ? this.snapTo10min(params.fromTimeSlot)
      : null;

    const active = bookings.filter(
      (b) =>
        b.status !== BookingStatus.CANCELLED &&
        b.status !== BookingStatus.COMPLETED,
    );

    const filtered = active.filter((b) => {
      if (isoDay && !b.startTime.toISOString().startsWith(isoDay)) return false;
      if (slot && formatTimeDisplay(b.startTime) !== slot) return false;
      return true;
    });

    if (filtered.length === 1) return filtered[0];
    if (filtered.length > 1) {
      const now = new Date();
      const upcoming = filtered
        .filter((b) => b.startTime >= now)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      return upcoming[0] ?? filtered[0];
    }

    const now = new Date();
    const todayKey = getTodayDateKey(timeZone);
    const candidates = active
      .filter((b) => {
        const dayKey = b.startTime.toISOString().split('T')[0];
        return b.startTime >= now || dayKey === todayKey;
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    if (candidates.length >= 1) return candidates[0];

    return (
      active.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] ??
      null
    );
  }

  private async handleRescheduleBooking(
    businessId: string,
    params: any,
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const services = await this.serviceRepo.find({
      where: { businessId, isActive: true },
    });
    let booking: Booking | null = null;

    if (params.bookingId) {
      booking = await this.bookingRepo.findOne({
        where: { id: params.bookingId, businessId },
        relations: { employee: true, service: true, customer: true },
      });
    } else if (params.employeeName) {
      const employees = await this.employeeRepo.find({
        where: { businessId, isActive: true },
      });
      const employee = this.resolveEmployee(employees, params.employeeName);
      if (employee) {
        const bookings = await this.bookingRepo.find({
          where: {
            businessId,
            employeeId: employee.id,
            status: Not(BookingStatus.CANCELLED),
          },
          relations: { employee: true, service: true, customer: true },
          order: { startTime: 'ASC' },
        });
        booking = this.pickBookingForReschedule(bookings, params);
      }
    } else if (params.customerName) {
      const customers = await this.customerRepo.find({
        where: { businessId, isActive: true },
      });
      const customer = this.resolveCustomer(customers, params.customerName);
      if (customer) {
        const bookings = await this.bookingRepo.find({
          where: {
            businessId,
            customerId: customer.id,
            ...(employeeId ? { employeeId } : {}),
            status: Not(BookingStatus.CANCELLED),
          },
          relations: { employee: true, service: true, customer: true },
          order: { startTime: 'ASC' },
        });
        booking = this.pickBookingForReschedule(bookings, params);
      }
    }

    if (!booking) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary:
          'Could not find the booking to update. Specify bookingId, customer name, or provider + date/time.',
        details: { params },
      };
    }

    let targetService = booking.service;
    if (params.serviceName) {
      const resolved = this.resolveService(services, params.serviceName);
      if (!resolved) {
        return {
          success: false,
          action: 'reschedule_booking',
          summary: `No service found matching "${params.serviceName}".`,
          details: { params, bookingId: booking.id },
        };
      }
      targetService = resolved;
    }

    const hasNewTime = !!(
      params.date ||
      params.timeSlot ||
      params.bookingFirstAvailable
    );
    const hasServiceChange = targetService.id !== booking.serviceId;

    if (!hasNewTime && !hasServiceChange) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary: 'Specify a new service type and/or a new date/time.',
        details: {
          bookingId: booking.id,
          currentService: booking.service?.name,
        },
      };
    }

    const timeZone = params._timeZone ?? 'UTC';
    let isoDay = params.date
      ? toIsoDay(params.date, timeZone)
      : booking.startTime.toISOString().split('T')[0];
    let timeSlot = params.timeSlot
      ? this.snapTo10min(params.timeSlot)
      : formatTimeDisplay(booking.startTime);

    if (params.bookingFirstAvailable && params.date) {
      const provider =
        booking.employee ??
        (await this.employeeRepo.findOne({
          where: { id: booking.employeeId, businessId, isActive: true },
        }));
      if (!provider) {
        return {
          success: false,
          action: 'reschedule_booking',
          summary: 'Could not resolve the provider for this appointment.',
          details: { bookingId: booking.id },
        };
      }

      const pick = await this.findFirstAvailableBookingSlot(
        businessId,
        targetService,
        toIsoDay(params.date, timeZone),
        [provider],
        timeZone,
        resolveFirstAvailableNotBeforeTime(params),
      );

      if (!pick) {
        return {
          success: false,
          action: 'reschedule_booking',
          summary: buildRescheduleFirstAvailableNoSlotMessage(
            targetService.name,
            provider.name,
            params,
            '',
          ),
          details: {
            bookingId: booking.id,
            serviceName: targetService.name,
            employeeName: provider.name,
            date: formatDateDisplay(toIsoDay(params.date, timeZone)),
            timeOfDay: params.timeOfDay ?? null,
            reason: 'no_slots',
          },
        };
      }

      isoDay = pick.isoDay;
      timeSlot = this.snapTo10min(pick.timeSlot);
    }

    const startTime = buildUtcStartTimeFromDayAndTime(isoDay, timeSlot);

    const customerLabel = booking.customer?.name ?? 'walk-in';
    let label: string;
    if (hasServiceChange && hasNewTime) {
      label = `Change ${customerLabel}'s appointment to ${targetService.name} on ${formatDateDisplay(isoDay)} ${timeSlot}`;
    } else if (hasServiceChange) {
      label = `Change ${customerLabel}'s service to ${targetService.name}`;
    } else {
      label = `Reschedule ${customerLabel} to ${formatDateDisplay(isoDay)} ${timeSlot}`;
    }

    const plan = this.planBuilder.buildRescheduleBookingPlan({
      businessId,
      bookingId: booking.id,
      startTime,
      employeeId: employeeId ?? booking.employeeId,
      serviceId: targetService.id,
      userId,
      label,
    });

    return this.toCommandResult(
      await this.orchestration.executePlan({
        plan,
        businessId,
        userId,
        autoExecute: true,
      }),
    );
  }
}
