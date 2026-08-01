import { Injectable, Logger } from '@nestjs/common';
import { dispatchBookingCoreIntent } from './ai-booking-core-dispatch.util.js';
import type { BookingCoreDispatchContext } from './ai-booking-core-dispatch.build.js';
import { DASHBOARD_INTENT_SCHEMA } from './ai-command-intent-schema.build.js';
import { commandSurfaceToAiUsageSurface } from './ai-usage-surface.util.js';
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
import {
  WAITLIST_CUSTOMER_TAG,
  andWhereSimpleArrayTag,
} from '../customer/customer-tag-query.util.js';
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
import { formatDateForAiLabel } from './ai-date-label.util.js';
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
import { AiReferralStaffTemplatesService } from './ai-referral-staff-templates.service.js';
import { AiExternalDoctorsService } from './ai-external-doctors.service.js';
import { AiProviderClinicTasksAndResultsService } from './ai-provider-clinic-tasks-and-results.service.js';
import { AiBusinessDateFormatService } from './ai-business-date-format.service.js';
import { AiBusinessTaxService } from './ai-business-tax.service.js';
import { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import { AiClinicTestOrderService } from './ai-clinic-test-order.service.js';
import { AiClinicLabBookingService } from './ai-clinic-lab-booking.service.js';
import { AiClinicTestResultService } from './ai-clinic-test-result.service.js';
import { AiClinicTestCatalogService } from './ai-clinic-test-catalog.service.js';
import {
  coerceClinicTestResultExtIntent,
  dispatchClinicTestResultExtIntent,
} from './ai-clinic-test-result-ext-dispatch.util.js';
import { AiClinicPatientChartService } from './ai-clinic-patient-chart.service.js';
import { AiPatientClinicalMutationsService } from './ai-patient-clinical-mutations.service.js';
import { AiClinicQuestionnaireService } from './ai-clinic-questionnaire.service.js';
import { AiLocationsService } from './ai-locations.service.js';
import { AiProductGuideService } from './ai-product-guide.service.js';
import {
  parseAdminDeleteCustomerDataFromPrompt,
  parseConfigureGranularConsentFromPrompt,
  parseConfigurePrivacyRetentionFromPrompt,
  parseAcceptHipaaBaaFromPrompt,
  parseConfigureHipaaSessionTimeoutFromPrompt,
  parseEnableHipaaModeFromPrompt,
  parseExplainComplianceStatusFromPrompt,
  parseExplainEnterpriseTrustFromPrompt,
  parseExplainGdprChecklistFromPrompt,
  parseExplainHipaaSessionTimeoutFromPrompt,
  parseExplainStrategyEvalFromPrompt,
  parseListSubProcessorsFromPrompt,
  parseOpenComplianceDashboardFromPrompt,
  parseExplainMinimumNecessaryPhiAccessFromPrompt,
  parseExplainPhiEncryptionStatusFromPrompt,
  parseListBreachIncidentsFromPrompt,
  parseReportDataBreachFromPrompt,
  parseSendBreachNotificationFromPrompt,
  parseViewPhiAccessAuditFromPrompt,
} from './ai-business-compliance.util.js';
import { applyCatalogNotifyPromptHints } from './ai-catalog-notify.util.js';
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
import { parseLookupBookingTaxMetadataFromPrompt } from './ai-lookup-booking-tax-metadata.util.js';
import { parseQuoteStaffBookingTaxFromPrompt } from './ai-quote-staff-booking-tax.util.js';
import { parseSummarizeCustomerTaxPaidFromPrompt } from './ai-summarize-customer-tax-paid.util.js';
import { parsePackageLocalizedNamesFromPrompt } from './ai-package-localized-names.util.js';
import { AiPackageLocalizedNamesService } from './ai-package-localized-names.service.js';
import { parseListUpcomingTourDeparturesFromPrompt } from './ai-upcoming-tour-departures.util.js';
import { parseExplainTourBookingRecordFromPrompt } from './ai-tour-booking-record.util.js';
import { parseExplainTourCalendarSpanFromPrompt } from './ai-tour-calendar-span.util.js';
import { parseListTourCalendarWeekFromPrompt } from './ai-tour-calendar-week.util.js';
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
import { AiCatalogService } from './ai-catalog.service.js';
import { AiDashboardCoreService } from './ai-dashboard-core.service.js';
import {
  buildCreateServicePrepaymentFields,
  enrichCreateServicesPrepaymentParamsFromPrompt,
} from './ai-create-service-prepayment.util.js';
import { enrichDeactivateServiceCategoryScopeParamsFromPrompt } from './ai-deactivate-service-category-scope.util.js';
import {
  enrichCreateServiceParamsFromPrompt,
  enrichCreateServicesParamsFromPrompt,
} from './ai-catalog.util.js';
import { resolveCreateServiceLocalizedNames } from './ai-catalog-service-localized-names.logic.js';
import { getBusinessEnabledLocales } from '../../common/utils/business-locale.util.js';
import type { LocalizedNamesMap } from '../../common/i18n/service-localized-names.util.js';
import { AiBookingDepthService } from './ai-booking-depth.service.js';
import { AiCustomerCrmService } from './ai-customer-crm.service.js';
import { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import { AiAgentOpsService } from './ai-agent-ops.service.js';
import { AiBusinessProfileService } from './ai-business-profile.service.js';
import { AiOnboardingService } from './ai-onboarding.service.js';
import { AiClinicPreVisitIntakeService } from './ai-clinic-pre-visit-intake.service.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiRetailFinanceService } from './ai-retail-finance.service.js';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiNotificationSettingsService } from './ai-notification-settings.service.js';
import { AiWhatsappIntegrationService } from './ai-whatsapp-integration.service.js';
import { AiOpenaiIntegrationService } from './ai-openai-integration.service.js';
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
  findServiceByExactName,
  getEmployeeServices,
  hasExplicitTimeWindow,
  isProviderOwnServicesPrompt,
  parseTimeWindow,
  filterOpenSlotsByTimeRange,
  filterBookingsByTimeConstraints,
  isClearSchedulePrompt,
  resolveServicesFromCatalogParams,
  enrichListServicesParamsFromPrompt,
} from './ai-orchestration.helpers.js';
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
  clampFirstAvailableStartIsoDay,
  isFutureOrTodayIsoDay,
} from './ai-nearest-slot-resolver.util.js';
import {
  enrichDashboardLookupAssignmentParams,
  formatLookupAssignmentDiscoveryNote,
  resolveLookupAssignmentService,
} from './ai-dashboard-lookup-assignment.logic.js';
import { extractServiceRankMetadata } from '../../common/utils/service-rank-metadata.util.js';
import { loadServiceBookingCounts90d } from '../../common/utils/service-booking-popularity.util.js';
import { composeDashboardListServicesBudgetResponse } from './ai-budget-list-services.logic.js';
import {
  buildListServicesPaymentFilterHeader,
  filterServicesByListServicesPaymentPolicy,
  hasListServicesPaymentFilter,
  parseListServicesPaymentFilterFromPrompt,
} from './ai-list-services-payment-filters.util.js';
import {
  buildRankEmptyCategorySummary,
  composeDashboardListServicesRankResponse,
  resolveListServicesRankLimitFromPrompt,
} from './ai-rank-list-services.logic.js';
import { resolveServiceRankParam } from './ai-service-rank-discovery.util.js';
import { isWallClockSlotBookable } from '../../common/utils/timezone.util.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import {
  resolveAssignEmployeeServicesInput,
  resolveTransferEmployeeServicesInput,
  resolveUnassignEmployeeServicesInput,
} from './ai-category-assignment.util.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { runCompletionValidateHandoff } from './command-completion-handoff.util.js';
import { shouldBlockLowConfidencePipelineMutate } from './command-pipeline-mutating-actions.util.js';
import {
  CommandResult,
  type PipelineTrace,
} from './command-completion.types.js';
import { buildUnwiredDashboardIntentResult } from './ai-command-unwired-intent.util.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiEventsService } from './ai-events.service.js';
import {
  enrichMisrouteTelemetryFromUnderstand,
  recordMisrouteTelemetry,
} from './ai-misroute-telemetry.util.js';
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
import { DashboardCommandUnderstandingAdapter } from './dashboard-command-understanding.adapter.js';
import {
  buildPipelineClarifyCommandResult,
  buildUnknownIntentClarifyResult,
  shouldBlockUnknownFromHandlerSwitch,
} from './ai-unknown-intent.util.js';
import { applyStructuralIntentEnrichment } from './ai-intent-structural-enrich.util.js';
import { enrichMarkPaidParamsFromPrompt } from './ai-booking-depth.util.js';
import { resolveConfidenceGateThresholds } from './confidence-gate.util.js';
import {
  findClassifierCandidate,
  findRescueCandidate,
  pipelineResultToClassifiedIntent,
  pipelineRescueReason,
  resolveWinningCandidateSource,
} from './command-understanding-result.util.js';
import {
  type CommandTraceStampContext,
  finalizeCommandTraceResult,
  resolveCommandTraceId,
} from './ai-command-trace-recorder.util.js';
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
import { type ClassifiedIntent } from './ai-command-routing.util.js';
import { buildNarrowClassifierSchema } from './narrow-reclassify-schema.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
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
import {
  isMetaProductGuideIntent,
  runMetaProductGuideIntent,
  type MetaProductGuideIntent,
} from './ai-meta-product-guide.util.js';
import { AiProductGuideEmptyStateService } from './ai-product-guide-empty-state.service.js';
import {
  isEmptyStateGuideIntent,
  type EmptyStateGuideIntent,
} from './ai-product-guide-empty-state.util.js';
import {
  mergeProductGuideParams,
  resolveProductGuideSessionContext,
  type AppGuideIntent,
} from './ai-product-guide.util.js';
import {
  enrichGuideTopicFromPrompt,
  rescueProductGuideIntent,
} from './ai-product-guide-rescue.util.js';
import {
  buildGuideHandoffExecutionPrompt,
  isGuideHandoffMutatingAction,
  readGuideHandoffDispatch,
  validateGuideHandoffDispatch,
} from './ai-product-guide-handoff.util.js';
import {
  appendPostFailureGuideFallback,
  buildPostFailureGuideFallbackInput,
} from './ai-product-guide-failure-fallback.util.js';
import {
  buildAiUnavailableErrorWithGuideLink,
  runAiUnavailableStaticGuideFallback,
} from './ai-product-guide-ai-unavailable.util.js';
import { parseExplainServiceOnlinePaymentSetupFromPrompt } from './ai-service-online-payment-setup.util.js';
import { enrichServiceOnlinePaymentParamsFromPrompt } from './ai-service-online-payment.util.js';
import { enrichServiceDepositPolicyParamsFromPrompt } from './ai-service-deposit-policy.util.js';
import { enrichNotificationSettingsParamsFromPrompt } from './ai-notification-settings.util.js';
import { enrichWhatsappIntegrationParamsFromPrompt } from './ai-whatsapp-integration.util.js';
import { enrichOpenaiIntegrationParamsFromPrompt } from './ai-openai-integration.util.js';
import {
  composeSummarizeBookingsResult,
  isUnscopedBookingCountPrompt,
} from './ai-dashboard-summarize-bookings.logic.js';
import { enrichOfferWaitlistSlotParams } from './ai-waitlist-dashboard.util.js';
import { parseUpdateServiceDurationBufferFromPrompt } from './ai-service-duration-buffer.util.js';
import { enrichConfigureStripeConnectParamsFromPrompt } from './ai-stripe-connect.util.js';
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


@Injectable()
export class AiBookingCoreService {
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
    private operations: AiOperationsService,
    private schedulingEngine: SchedulingEngineService,
    private slotResolver: BookingSlotResolverService,
    private customerService: CustomerService,
  ) {}


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

  async handleCreateBooking(
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
        employees.find((entry) => entry.id === pick.employeeId) ??
        resolvedEmployee;
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
          summary: `No one is available for ${service.name} at ${timeSlot} on ${formatDateForAiLabel(isoDay)}. Tried: ${tried}${
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
      // e2e-bug.285 — unambiguous plan date (never DD/MM slash for LLM/reasoning).
      date: formatDateForAiLabel(params.date),
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


  async resolveCreateBookingServiceForParams(
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
        return found
          ? catalog.find((entry) => entry.id === found.id)
          : undefined;
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


  async pickCreateBookingFirstAvailable(
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
      // e2e-bug.268 — never start first-available scan on a past calendar day.
      const startIsoDay = clampFirstAvailableStartIsoDay(
        params.date ?? todayDisplay(timeZone),
        timeZone,
      );
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

    // e2e-bug.268 — refuse any past-day pick that slipped through windows.
    if (!isFutureOrTodayIsoDay(pick.isoDay, timeZone)) {
      return {
        ok: false,
        summary: `No upcoming open ${service.name} slots found in the next two weeks.`,
        details: {
          serviceName: service.name,
          allProviders: !!params.allProviders,
          reason: 'past_day_rejected',
        },
      };
    }

    return { ok: true, pick };
  }


  private static readonly FIRST_AVAILABLE_SCAN_DAYS = 14;


  async findFirstAvailableBookingSlot(
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

    // e2e-bug.268 — clamp scan start to today (business TZ) before walking days.
    const clampedStart = clampFirstAvailableStartIsoDay(startIsoDay, timeZone);

    for (
      let offset = 0;
      offset < AiBookingCoreService.FIRST_AVAILABLE_SCAN_DAYS;
      offset++
    ) {
      const isoDay = addDaysToDateKey(clampedStart, offset, timeZone);
      if (!isFutureOrTodayIsoDay(isoDay, timeZone)) continue;

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


  async findFirstAvailableBookingSlotOnDay(
    businessId: string,
    service: Service,
    providers: Employee[],
    isoDay: string,
    timeZone: string,
    timeOfDay: TimeOfDayWindow | null,
    notBeforeTime: string | null,
  ) {
    // e2e-bug.268 — OR-window day scans must ignore past / non-ISO calendar keys.
    const scanDay = /^\d{4}-\d{2}-\d{2}$/.test(isoDay)
      ? isoDay
      : clampFirstAvailableStartIsoDay(isoDay, timeZone);
    if (!isFutureOrTodayIsoDay(scanDay, timeZone)) {
      return null;
    }

    const rows = await Promise.all(
      providers.map(async (provider) => {
        const row = await this.getProviderAvailabilityForService(
          businessId,
          provider.id,
          service.id,
          scanDay,
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
      isoDay: scanDay,
      timeZone,
      timeOfDay,
      notBeforeTime,
      providers: rows,
      isSlotBookable: isWallClockSlotBookable,
    });
  }


  async handleAssignEmployeeServices(
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


  async handleUnassignEmployeeServices(
    businessId: string,
    params: any,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const resolved = resolveUnassignEmployeeServicesInput(
      employees,
      services,
      params,
    );
    if (!resolved.ok) {
      return {
        success: false,
        action: 'unassign_employee_services',
        summary: resolved.summary,
        details: resolved.details ?? { params },
      };
    }

    const plan = this.planBuilder.buildUnassignEmployeeServicesPlan({
      businessId,
      employeeId: resolved.employeeId,
      employeeName: resolved.employeeName,
      serviceIds: resolved.serviceIds,
      serviceNames: resolved.serviceNames,
      removedServiceNames: resolved.serviceNames,
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


  async handleTransferEmployeeServices(
    businessId: string,
    params: any,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const resolved = resolveTransferEmployeeServicesInput(
      employees,
      services,
      params,
    );
    if (!resolved.ok) {
      return {
        success: false,
        action: 'transfer_employee_services',
        summary: resolved.summary,
        details: resolved.details ?? { params },
      };
    }

    const plan = this.planBuilder.buildTransferEmployeeServicesPlan({
      businessId,
      fromEmployeeId: resolved.fromEmployeeId,
      fromEmployeeName: resolved.fromEmployeeName,
      fromServiceIds: resolved.fromServiceIds,
      toEmployeeId: resolved.toEmployeeId,
      toEmployeeName: resolved.toEmployeeName,
      toServiceIds: resolved.toServiceIds,
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


  async handleSummarizeUtilization(
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


  async handleSummarizeCustomers(
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
      retention: 'Customer retention rate',
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
        // e2e-bug.155 — never imply "no cancellations" when the aggregate exists.
        `• ${summary.totalCancellations} total cancellations across all customers`,
        `• ${summary.atRiskCount} at-risk · ${summary.highNoShowCount} high no-show · ${summary.vipCount} VIP`,
      );
      if (rows.length > 0) {
        lines.push('', 'Top no-shows:');
      }
    } else if (metric === 'retention') {
      // e2e-bug.137 — visit-based repeat-customer rate, no react_agent tool
      // could ever answer this; computed from real per-customer visit counts.
      if (summary.customersWithCompletedVisitCount === 0) {
        lines.push(
          '• No completed visits yet — retention rate cannot be calculated.',
        );
      } else {
        lines.push(
          `• ${summary.retentionRatePercent}% retention rate`,
          `• ${summary.returningCustomerCount} of ${summary.customersWithCompletedVisitCount} customers with a completed visit have returned for at least one more`,
        );
      }
    } else {
      // e2e-bug.153 — ranked/segment lists must never be read as the roster total.
      lines.push(
        `• ${summary.totalCustomers} active customers in total (ranking below is filtered, not the full count)`,
      );
      if (metric === 'most_cancellations') {
        lines.push(
          `• ${summary.totalCancellations} total cancellations across all customers`,
        );
      }
    }

    if (rows.length === 0) {
      // e2e-bug.137 — 'retention' is a pure aggregate metric with no per-row
      // ranking; its own branch above already reported the calculated rate.
      if (metric !== 'retention') {
        lines.push('• No matching customers found.');
      }
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


  async handleSummarizeBookings(
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
    // e2e-bug.154 — unscoped "in total" must not silently default to today.
    const allTime =
      params.allTime === true || isUnscopedBookingCountPrompt(prompt);
    const range = resolveDateRange(params, prompt);
    const effectiveRange =
      range ??
      (allTime
        ? null
        : (() => {
            const iso = params.date ?? new Date().toISOString().split('T')[0];
            return { start: iso, end: iso };
          })());

    const where: Record<string, unknown> = { businessId };
    if (employeeId) where.employeeId = employeeId;

    if (effectiveRange) {
      const start = new Date(effectiveRange.start);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(effectiveRange.end);
      end.setUTCHours(23, 59, 59, 999);
      where.startTime = Between(start, end);
    }

    const bookings = await this.bookingRepo.find({
      where: where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    const resolvedRange = effectiveRange ?? {
      start: 'all-time',
      end: 'all-time',
    };

    return composeSummarizeBookingsResult({
      bookings,
      businessSettings,
      metric,
      range: resolvedRange,
      allTime: allTime || !effectiveRange,
      employeeId,
      employeeName,
      statusFilter: params.statusFilter as string | undefined,
    });
  }


  async handleListServices(
    businessId: string,
    services: Service[],
    params: Record<string, any>,
    prompt: string,
  ): Promise<CommandResult> {
    const withBudgetAndRank = enrichServiceDiscoveryFromPrompt(params, prompt);
    const enriched = enrichListServicesParamsFromPrompt(
      prompt,
      withBudgetAndRank,
    );

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
        prepaymentMode: service.prepaymentMode,
        ...(rank.isFeatured ? { isFeatured: true } : {}),
        ...(rank.serviceTier ? { serviceTier: rank.serviceTier } : {}),
      };
    };

    if (enriched.serviceName) {
      const target = this.resolveService(
        services,
        String(enriched.serviceName),
      );
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
          const service = composed.services[0];
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
    let matched = hasFilter
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

    const paymentFilter = parseListServicesPaymentFilterFromPrompt(
      prompt,
      enriched,
    );
    if (hasListServicesPaymentFilter(paymentFilter)) {
      matched = filterServicesByListServicesPaymentPolicy(
        matched,
        paymentFilter,
      );
      if (matched.length === 0) {
        return {
          success: false,
          action: 'list_services',
          summary: `No ${buildListServicesPaymentFilterHeader(paymentFilter).toLowerCase()} in the catalog right now.`,
          details: { services: [] },
        };
      }
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

    const paymentFilterHeader = hasListServicesPaymentFilter(paymentFilter)
      ? `${buildListServicesPaymentFilterHeader(paymentFilter)}:`
      : undefined;

    const composed = composeDashboardListServicesBudgetResponse({
      matchedServices: matched,
      maxPrice: withBudgetAndRank.maxPrice,
      minPrice: withBudgetAndRank.minPrice,
      preferShortDuration: withBudgetAndRank.preferShortDuration,
      minDurationMinutes: withBudgetAndRank.minDurationMinutes,
      maxTotalPrice: withBudgetAndRank.maxTotalPrice,
      serviceCount: withBudgetAndRank.serviceCount,
      header:
        paymentFilterHeader ??
        (withBudgetAndRank.maxTotalPrice != null
          ? 'Service combos within budget:'
          : withBudgetAndRank.maxPrice != null
            ? 'Services within budget:'
            : `Service catalog (${matched.length}):`),
    });

    return {
      success: composed.success,
      action: 'list_services',
      summary: composed.summary,
      details: { services: composed.detailsServices },
    };
  }


  async handleAnalyzeServices(
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


  async handleSummarizeStaff(
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


  async handleLookupCustomer(
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


  async handleSummarizeWaitlist(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    const limit = typeof params.limit === 'number' ? params.limit : 10;

    const waitlistQb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.business_id = :businessId', { businessId })
      .orderBy('c.name', 'ASC');
    andWhereSimpleArrayTag(
      waitlistQb,
      'c',
      WAITLIST_CUSTOMER_TAG,
      'waitlistTag',
    );
    const waitlist = await waitlistQb.getMany();

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


  async handleLookupServiceAssignment(
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

    const discoveryNote = formatLookupAssignmentDiscoveryNote(
      params,
      service.name,
    );
    const active = employees.filter((e) => e.isActive);

    if (params.date) {
      const isoDay =
        parseDateInput(params.date)?.toISOString().split('T')[0] ?? params.date;
      // e2e-bug.306 — AI availability empty/success day labels: no DD/MM slash.
      const displayDay = formatDateForAiLabel(isoDay);

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


  handleListEmployees(
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


  handleListTemplates(templates: ScheduleTemplate[]): CommandResult {
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


  bookingDurationMinutes(booking: Booking): number {
    return Math.round(
      (booking.endTime.getTime() - booking.startTime.getTime()) / 60_000,
    );
  }


  formatServicePrice(service: Service | null | undefined): string {
    if (!service) return '—';
    const currency = service.currency || 'USD';
    return `${currency} ${Number(service.price).toFixed(2)}`;
  }


  formatAppointmentLine(booking: Booking): string {
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    const duration = this.bookingDurationMinutes(booking);
    const price = this.formatServicePrice(booking.service);
    return `• ${time} | ${booking.service?.name || 'Service'} | ${booking.customer?.name || 'Walk-in'} | ${booking.employee?.name || 'Unknown'} | ${duration} min | ${price} | ${booking.status}`;
  }


  async handleAnalyzeAppointments(
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


  async handleBulkSmartCancel(
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


  async handleFillSlotFromWaitlist(
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

    const waitlistQb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.business_id = :businessId', { businessId });
    andWhereSimpleArrayTag(
      waitlistQb,
      'c',
      WAITLIST_CUSTOMER_TAG,
      'waitlistTag',
    );
    const waitlist = await waitlistQb.getMany();

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


  async buildCreateBookingPlanOnly(
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
        employees.find((entry) => entry.id === pick.employeeId) ??
        resolvedEmployee;
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
      // e2e-bug.285 — unambiguous plan date (never DD/MM slash for LLM/reasoning).
      date: formatDateForAiLabel(params.date),
      timeSlot,
    });
  }


  async handleNoShowRecovery(
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


  async handleMarkNoShows(
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


  async handlePaymentSweep(
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


  async handleDayReplan(
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


  applyEmployeeScopeToWhere(
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


  applyServiceScopeToWhere(
    where: Record<string, unknown>,
    params: Record<string, any>,
    matchedServices: Service[],
  ): void {
    if (params.allAppointments === true) return;
    if (matchedServices.length > 0) {
      where.serviceId = In(matchedServices.map((s) => s.id));
    }
  }


  applyDateScopeToWhere(
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


  async findBookingsForBulkUpdate(
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


  async handleUpdateBookings(
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


  buildBulkBookingNoMatchMessage(
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


  async findBookingsForMarkNoShows(
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


  async findUnpaidBookingsForSweep(
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


  async findBookingsForCancel(
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


  resolveCalendarVisibilityStatusFilters(
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


  async findBookingsForCalendarVisibility(
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


  async findBookingsForHide(
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


  formatCalendarVisibilityPeriod(params: any): string {
    if (params.dateFrom && params.dateTo) {
      const from = formatDateDisplay(params.dateFrom);
      const to = formatDateDisplay(params.dateTo);
      return from === to ? from : `${from} → ${to}`;
    }
    if (params.date) return formatDateDisplay(params.date);
    return '';
  }


  async handleHideAppointmentsFromCalendar(
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


  async handleUnhideAppointmentsFromCalendar(
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


  async handleCancelBookings(
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


  formatBookingTime(start: Date, end: Date): string {
    return formatTimeRangeDisplay(start, end);
  }


  formatBookingLines(
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


  async describeProvidersOnServiceSchedule(
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


  async handleListBookings(
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


  async serviceNameMap(
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


  formatPeriodServices(
    serviceIds: string[] | null | undefined,
    nameMap: Map<string, string>,
  ): string {
    if (!serviceIds?.length) return 'any service';
    return serviceIds.map((id) => nameMap.get(id) || id).join(', ');
  }


  formatNonServicePeriod(p: SchedulingPeriod): string {
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


  timesOverlap(
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date,
  ): boolean {
    return startA < endB && endA > startB;
  }


  mergeOpenSlotRanges(
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


  async getProviderAvailabilityForService(
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


  async handleCheckAvailability(
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
    // e2e-bug.306 — check_availability day labels must not use DD/MM slash.
    const displayDay = formatDateForAiLabel(isoDay);
    const explicitTimeWindow = hasExplicitTimeWindow(params, prompt)
      ? parseTimeWindow(params, prompt)
      : null;
    if (explicitTimeWindow) {
      params.timeFrom = explicitTimeWindow.timeFrom;
      params.timeTo = explicitTimeWindow.timeTo;
      delete params.timeSlot;
      delete params.timeOfDay;
    }
    const timeOfDay = parseTimeOfDayWindow('', params);

    if (
      employeeId &&
      employeeName &&
      params.serviceName &&
      (params.timeSlot || timeOfDay || explicitTimeWindow)
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

        if (explicitTimeWindow) {
          const rangeSlots = filterOpenSlotsByTimeRange(
            windowSlots,
            explicitTimeWindow.timeFrom,
            explicitTimeWindow.timeTo,
          );
          const rangeLabel = `${explicitTimeWindow.timeFrom}–${explicitTimeWindow.timeTo}`;
          let summary: string;
          if (!row.hasSchedule) {
            summary = `${employeeName} has no schedule on ${displayDay}.`;
          } else if (rangeSlots.length === 0) {
            summary = `No — ${employeeName} has no open ${service.name} slots on ${displayDay} between ${rangeLabel}.`;
          } else {
            summary = `Yes — ${employeeName} is available for ${service.name} on ${displayDay} between ${rangeLabel}: ${rangeSlots.map((s) => `${s.start}–${s.end}`).join(', ')}.`;
          }

          return {
            success: true,
            action: 'check_availability',
            summary,
            details: {
              date: displayDay,
              employee: employeeName,
              serviceName: service.name,
              timeFrom: explicitTimeWindow.timeFrom,
              timeTo: explicitTimeWindow.timeTo,
              available: rangeSlots.length > 0,
              openSlots: rangeSlots,
              hasSchedule: row.hasSchedule,
            },
          };
        }

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


  async handleSummarizeDay(
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


  pickBookingForReschedule(
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


  async handleRescheduleBooking(
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

    // e2e-bug.268 — first-available reschedule must scan from today (or a
    // future params.date), never reuse a past booking calendar day when the
    // user asked for nearest/soonest free time.
    if (params.bookingFirstAvailable) {
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

      const startIsoDay = clampFirstAvailableStartIsoDay(
        params.date,
        timeZone,
      );
      const pick = await this.findFirstAvailableBookingSlot(
        businessId,
        targetService,
        startIsoDay,
        [provider],
        timeZone,
        resolveFirstAvailableNotBeforeTime(params),
      );

      if (!pick || !isFutureOrTodayIsoDay(pick.isoDay, timeZone)) {
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
            date: formatDateForAiLabel(startIsoDay),
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
    // e2e-bug.285 — unambiguous reschedule label (never DD/MM slash).
    const dayLabel = formatDateForAiLabel(isoDay);
    let label: string;
    if (hasServiceChange && hasNewTime) {
      label = `Change ${customerLabel}'s appointment to ${targetService.name} on ${dayLabel} ${timeSlot}`;
    } else if (hasServiceChange) {
      label = `Change ${customerLabel}'s service to ${targetService.name}`;
    } else {
      label = `Reschedule ${customerLabel} to ${dayLabel} ${timeSlot}`;
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

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a booking-core intent. */
  dispatchIntent(
    ctx: BookingCoreDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchBookingCoreIntent(this, ctx);
  }
}
