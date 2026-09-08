import { Injectable, Logger } from '@nestjs/common';
import type {
  AmbiguityReport,
  OnAmbiguousName,
} from './ai-name-resolution.types.js';
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
import { AiMetaOpsService } from './ai-meta-ops.service.js';
import { AiBookingCoreService } from './ai-booking-core.service.js';
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
import { AiClinicPatientChartService } from './ai-clinic-patient-chart.service.js';
import { AiPatientClinicalMutationsService } from './ai-patient-clinical-mutations.service.js';
import { AiClinicQuestionnaireService } from './ai-clinic-questionnaire.service.js';
import { AiLocationsService } from './ai-locations.service.js';
import { AiBusinessHoursLocationService } from './ai-explain-business-hours-and-location.service.js';
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
  fuzzyMatchByName as canonicalFuzzyMatchByName,
} from './ai-orchestration.helpers.js';
import { resolveEntity } from './ai-entity-resolution.util.js';
// e2e-bug.487 — the single source of truth for which compound steps must not be
// skipped silently. Imported, not restated: two copies of this rule is the drift
// e2e-bug.409 and e2e-bug.446 were both about.
import {
  MUST_NOT_SILENTLY_SKIP_ACTIONS,
  COMPOUND_MUTATE_ACTION_LABELS,
} from './compound-command-graph.service.js';
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
import {
  attachCompoundResumeToClarifyResult,
  extractClarifyFieldsFromFollowUpPrompt,
  readCompoundResumeFromContext,
  shouldContinueCompoundResume,
} from './ai-compound-resume.util.js';
import { shouldBlockLowConfidencePipelineMutate } from './command-pipeline-mutating-actions.util.js';
import {
  CommandResult,
  type BusinessCatalog,
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
import { shouldConfirmBeforeExecute } from './ai-planner-confirmation.util.js';
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
import { composeSummarizeBookingsResult } from './ai-dashboard-summarize-bookings.logic.js';
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
import { attachCompoundStepAttribution } from './ai-compound-step-outcome.util.js';
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
  categoryId?: string;
  localizedNames?: LocalizedNamesMap;
  prepaymentMode?: import('../service/entities/service.entity.js').PrepaymentMode;
  depositAmount?: number;
}

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
    private metaOps: AiMetaOpsService,
    private bookingCore: AiBookingCoreService,
    private scheduling: AiSchedulingService,
    private operations: AiOperationsService,
    private businessCurrency: AiBusinessCurrencyService,
    private businessLanguages: AiBusinessLanguagesService,
    private referralStaffTemplates: AiReferralStaffTemplatesService,
    private externalDoctors: AiExternalDoctorsService,
    private providerClinicTasksAndResults: AiProviderClinicTasksAndResultsService,
    private businessDateFormat: AiBusinessDateFormatService,
    private businessTax: AiBusinessTaxService,
    private businessCompliance: AiBusinessComplianceService,
    private clinicTestOrder: AiClinicTestOrderService,
    private clinicLabBooking: AiClinicLabBookingService,
    private clinicTestResult: AiClinicTestResultService,
    private clinicTestCatalog: AiClinicTestCatalogService,
    private clinicPatientChart: AiClinicPatientChartService,
    private patientClinicalMutations: AiPatientClinicalMutationsService,
    private clinicQuestionnaire: AiClinicQuestionnaireService,
    private locations: AiLocationsService,
    private businessHoursLocation: AiBusinessHoursLocationService,
    private productGuide: AiProductGuideService,
    private emptyStateGuide: AiProductGuideEmptyStateService,
    private packageLocalizedNames: AiPackageLocalizedNamesService,
    private tourService: AiTourServiceService,
    private clinicService: AiClinicServiceService,
    private recommendationProduct: AiRecommendationProductService,
    private platform: AiPlatformService,
    private bookingDepth: AiBookingDepthService,
    private catalog: AiCatalogService,
    private dashboardCore: AiDashboardCoreService,
    private customerCrm: AiCustomerCrmService,
    private scheduleResources: AiScheduleResourcesService,
    private agentOps: AiAgentOpsService,
    private businessProfile: AiBusinessProfileService,
    private onboarding: AiOnboardingService,
    private clinicPreVisitIntake: AiClinicPreVisitIntakeService,
    private payments: AiPaymentsService,
    private giftFulfillment: AiGiftFulfillmentService,
    private integrations: AiIntegrationsService,
    private retailFinance: AiRetailFinanceService,
    private marketingGrowth: AiMarketingGrowthService,
    private pushNotifications: AiPushNotificationsService,
    private notificationSettings: AiNotificationSettingsService,
    private whatsappIntegration: AiWhatsappIntegrationService,
    private openaiIntegration: AiOpenaiIntegrationService,
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
    private promptSecurity: AiPromptSecurityService,
    private promptNormalization: AiPromptNormalizationService,
    private dashboardUnderstanding: DashboardCommandUnderstandingAdapter,
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
      const fallback = await runAiUnavailableStaticGuideFallback({
        productGuide: this.productGuide,
        businessId,
        prompt,
        surface: 'dashboard',
        reason: 'openai_not_configured',
        session,
        userId,
      });
      if (fallback) return fallback;
      return buildAiUnavailableErrorWithGuideLink({
        surface: 'dashboard',
        reason: 'openai_not_configured',
        route: session?.context?.route as string | undefined,
      });
    }

    const timeZone = await this.resolveCommandTimezone(businessId, session);

    const [employees, services, customers, templates, locations] =
      await Promise.all([
        this.employeeRepo.find({ where: { businessId, isActive: true } }),
        this.serviceRepo.find({ where: { businessId } }),
        this.customerRepo.find({ where: { businessId, isActive: true } }),
        this.templateRepo.find({
          where: { businessId, isDeleted: false },
          order: { name: 'ASC' },
        }),
        // e2e-bug.460 — joins the existing parallel batch rather than adding a
        // round trip: the rescue chain runs synchronously and needs to know
        // whether a name like "Downtown" is a place before it claims the prompt.
        this.locations.listLocations(businessId),
      ]);

    const catalog = {
      employees,
      services,
      customers,
      templates,
      locations: locations.map((location) => ({
        id: location.id,
        name: location.name,
      })),
    };
    const aiConfig = await this.aiSettings.getSettings(businessId);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    const businessType = business?.settings?.businessType as string | undefined;
    const { scope } = this.platform.resolveBranchContext(
      session?.context,
      aiConfig,
    );
    const scopedCatalog = scope.locationId
      ? await this.platform.scopeCatalog(businessId, catalog, scope)
      : catalog;

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
    const presetRoute = session?.context?._complexityRoute as
      | ComplexityRoute
      | undefined;
    const resolveComplexityRoute =
      this.dashboardUnderstanding.createResolveRoute({
        businessId,
        classifierPrompt,
        employees,
        router: this.complexityRouter,
        intelligence: this.intelligence,
        presetRoute,
      });
    const graphComplexityRoute = await resolveComplexityRoute();

    const sessionWithRoute: CommandSessionOptions = {
      ...session,
      context: {
        ...session?.context,
        _complexityRoute: graphComplexityRoute,
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
        (list, name, onAmbiguous) =>
          this.resolveCustomerStrict(list, name, onAmbiguous),
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
        (list, name, onAmbiguous) =>
          this.resolveCustomerStrict(list, name, onAmbiguous),
        userId,
        // e2e-bug.448(b) — "Turn on online payment for everything" is the tail
        // of both e2e-bug.348's and e2e-bug.349's reported prompts. It is a
        // payments action, not a catalog one, so it used to hit the catalog
        // executor's `default` branch and fail the *whole* compound on top of
        // catalog work that had already succeeded. Injected here because this
        // is the frame that has both services; the catalog module gains no
        // payments dependency.
        (bId, stepParams, stepPrompt, svcs, uid) =>
          this.payments.handleConfigureServiceOnlinePayment(
            bId,
            stepParams,
            stepPrompt,
            svcs,
            uid,
          ),
      );
      if (catalogCompound.success || catalogCompound.details?.failedStep) {
        return catalogCompound;
      }
    }

    const confidenceThresholds = resolveConfidenceGateThresholds(
      aiConfig.confidence,
      session?.context?._confidenceHigh as number | undefined,
    );

    // e2e-bug.304 — resume mid-compound when booking graph is off / before classify.
    if (
      !this.bookingCommandGraph.isEnabled() &&
      shouldContinueCompoundResume(
        effectivePrompt,
        sessionWithRoute?.context as Record<string, unknown> | undefined,
      )
    ) {
      const resume = readCompoundResumeFromContext(
        sessionWithRoute?.context as Record<string, unknown> | undefined,
      );
      if (resume) {
        const clarifyFields =
          extractClarifyFieldsFromFollowUpPrompt(effectivePrompt);
        return this.executeCompoundIntents(
          businessId,
          resume.confirmationPrompt || effectivePrompt,
          userId,
          {
            ...sessionWithRoute,
            context: {
              ...(sessionWithRoute?.context ?? {}),
              ...clarifyFields,
            },
          },
          resume.subIntents,
          catalog,
          aiConfig.confidence,
          timeZone,
          {
            resumePlans: resume.plans,
            resumeStepIndex: resume.stepIndex,
          },
        );
      }
    }

    if (this.bookingCommandGraph.isEnabled()) {
      return this.bookingCommandGraph.run({
        businessId,
        prompt,
        effectivePrompt,
        userId,
        session: sessionWithRoute,
        catalog: scopedCatalog,
        timeZone,
        confidenceThresholds,
        complexityRoute: graphComplexityRoute,
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
              resolveComplexityRoute,
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
            const resumeCtx = sessionWithRoute?.context as
              | Record<string, unknown>
              | undefined;
            const resume = readCompoundResumeFromContext(resumeCtx);
            if (
              resume &&
              shouldContinueCompoundResume(effectivePrompt, resumeCtx)
            ) {
              const clarifyFields =
                extractClarifyFieldsFromFollowUpPrompt(effectivePrompt);
              return this.executeCompoundIntents(
                businessId,
                resume.confirmationPrompt || effectivePrompt,
                userId,
                {
                  ...sessionWithRoute,
                  context: {
                    ...(sessionWithRoute?.context ?? {}),
                    ...clarifyFields,
                  },
                },
                resume.subIntents,
                catalog,
                aiConfig.confidence,
                timeZone,
                {
                  resumePlans: resume.plans,
                  resumeStepIndex: resume.stepIndex,
                },
              );
            }
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
        const misroutePayload = recordMisrouteTelemetry(
          this.aiEvents,
          businessId,
          {
            surface: 'dashboard',
            prompt: effectivePrompt,
            classifierAction: 'compound_intent',
            rescuedAction: 'compound_intent',
            rescueReason: 'compound_decomposition',
            compoundStepCount: subIntents.length,
          },
        );
        const compoundResult = await this.executeCompoundIntents(
          businessId,
          effectivePrompt,
          userId,
          sessionWithRoute,
          subIntents,
          scopedCatalog,
          confidenceThresholds,
          timeZone,
        );
        return finalizeCommandTraceResult(compoundResult, {
          traceId: resolveCommandTraceId(sessionWithRoute?.context),
          misrouteTelemetry: misroutePayload,
          pipelineTrace: compoundResult.details?.pipelineTrace as
            | import('./command-completion.types.js').PipelineTrace[]
            | undefined,
        });
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
      resolveComplexityRoute,
    );
  }

  private async executeSingleIntent(
    businessId: string,
    effectivePrompt: string,
    userId: string | undefined,
    session: CommandSessionOptions | undefined,
    // §216 — the shared type, so the `locations` roster this object actually
    // carries (`e2e-bug.460`) is visible to the compiler at every hop rather
    // than surviving only by structural pass-through.
    catalog: BusinessCatalog,
    timeZone: string,
    aiConfig: Awaited<ReturnType<AiSettingsService['getSettings']>>,
    playbook: ReturnType<AiSettingsService['matchPlaybook']>,
    promptNorm?: PromptNormalizationResult,
    resolveRoute?: () => Promise<ComplexityRoute>,
  ): Promise<CommandResult> {
    const { employees, services, customers, templates } = catalog;

    const sessionContext = { ...session?.context, timeZone };

    const confidenceThresholds = resolveConfidenceGateThresholds(
      aiConfig.confidence,
      session?.context?._confidenceHigh as number | undefined,
    );

    const guideHandoff = readGuideHandoffDispatch(session);
    const traceCtx: CommandTraceStampContext = {
      traceId: resolveCommandTraceId(session?.context),
      pipelineTrace: [],
    };
    const guideFallbackInput = buildPostFailureGuideFallbackInput(
      session,
      'dashboard',
      undefined,
      effectivePrompt,
    );
    const traceStamp = (result: CommandResult) =>
      finalizeCommandTraceResult(
        appendPostFailureGuideFallback(result, guideFallbackInput),
        traceCtx,
      );

    if (guideHandoff) {
      const handoffValidation = validateGuideHandoffDispatch(guideHandoff);
      if (!handoffValidation.ok) {
        return traceStamp({
          success: false,
          action: guideHandoff.action,
          summary: handoffValidation.summary,
          details: { guideHandoffRejected: true },
        });
      }
    }

    let parsed: ClassifiedIntent;
    let understandTrace: PipelineTrace[];
    let skipClassifierRescues = false;
    let understood: Awaited<
      ReturnType<DashboardCommandUnderstandingAdapter['understand']>
    > | null = null;

    if (guideHandoff) {
      parsed = {
        action: guideHandoff.action,
        params: { ...(guideHandoff.params ?? {}) },
        confidence: 1,
        reasoning: 'Product guide handoff (ai-guide-1.2.5 direct dispatch)',
      };
      understandTrace = [
        {
          stage: 'guide_handoff',
          action: guideHandoff.action,
          at: new Date().toISOString(),
          detail: 'skipped classify',
        },
      ];
      skipClassifierRescues = true;
      traceCtx.pipelineTrace = understandTrace;
    } else {
      understood = await this.dashboardUnderstanding.understand({
        businessId,
        userId,
        effectivePrompt,
        timeZone,
        catalog,
        confidence: aiConfig.confidence,
        sessionConfidenceHigh: session?.context?._confidenceHigh as
          | number
          | undefined,
        lastAction: session?.context?.lastAction as string | undefined,
        sessionContext: { ...session?.context, timeZone },
        promptNorm,
        resolveRoute,
        classify: (normalizedPrompt, context, narrowShortlist) =>
          this.classifyIntent(
            businessId,
            userId,
            normalizedPrompt,
            context,
            session?.history,
            sessionContext,
            narrowShortlist
              ? { narrowShortlist, surface: 'dashboard' }
              : { surface: 'dashboard' },
          ),
      });
      understandTrace = understood.trace;
      traceCtx.pipelineTrace = understandTrace;
      traceCtx.routingTier = understood.complexityRoute?.tier;

      if (understood.status === 'blocked') {
        return traceStamp({
          success: false,
          action: 'error',
          summary: 'Failed to understand the command. Please try rephrasing.',
          details: {
            pipelineTrace: understandTrace,
            blockReason: understood.blockReason,
          },
        });
      }

      if (understood.status === 'clarify') {
        const clarifyPayload = {
          summary:
            understood.clarifySummary ??
            'I need a bit more detail before I can run this.',
          clarifyFields: understood.clarifyFields ?? ['intentChoice'],
          suggestions: understood.clarifySuggestions ?? [],
          loweredConfidence: understood.confidence,
          ruleId:
            understood.blockReason?.replace('self_verify clarify: ', '') ??
            'unknown',
          reason: understood.blockReason ?? 'self_verify_clarify',
        };
        const clarify = buildPipelineClarifyCommandResult(
          understood,
          clarifyPayload,
        );
        clarify.details.pipelineTrace = understandTrace;
        this.aiEvents.emitClarify(businessId, {
          action: understood.action,
          summary: clarify.summary,
          missing: clarify.details.missing,
        });
        return traceStamp(clarify);
      }

      parsed = pipelineResultToClassifiedIntent(understood);
    }

    const classifierCandidate = understood
      ? findClassifierCandidate(understood)
      : null;
    const classifierAction = classifierCandidate?.action ?? parsed.action;
    const classifierConfidence = classifierCandidate?.confidence;
    const rescueCandidate = understood ? findRescueCandidate(understood) : null;

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

    if (
      !skipClassifierRescues &&
      parsed.action === 'unknown' &&
      isClearSchedulePrompt(effectivePrompt)
    ) {
      parsed.action = 'clear_schedule';
      parsed.reasoning =
        'Clear applied schedule periods and micro-slots for the provider on the specified date(s).';
      parsed.confidence = Math.max(
        typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        0.88,
      );
    }

    if (!skipClassifierRescues && parsed.action === 'unknown') {
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

    if (!skipClassifierRescues) {
      const guideSessionContext = resolveProductGuideSessionContext(
        session,
        'dashboard',
      );
      const guideRescue = rescueProductGuideIntent(
        effectivePrompt,
        parsed.action,
        {
          surface: 'dashboard',
          assistantMode: session?.context?.assistantMode as
            | 'guide'
            | 'act'
            | undefined,
          route: guideSessionContext.route,
          context: session?.context,
        },
      );
      if (guideRescue.action !== parsed.action) {
        parsed.action = guideRescue.action;
        parsed.reasoning = `Product guide rescue → ${guideRescue.action}`;
        parsed.confidence = Math.max(
          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
          0.86,
        );
      }
    }

    if (
      !skipClassifierRescues &&
      shouldBlockUnknownFromHandlerSwitch(parsed.action)
    ) {
      const clarify = buildUnknownIntentClarifyResult({
        surface: 'dashboard',
        prompt: effectivePrompt,
        params: parsed.params,
        reasoning: parsed.reasoning,
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        trace: understandTrace,
        locale:
          typeof session?.context?.locale === 'string'
            ? session.context.locale
            : undefined,
      });
      this.aiEvents.emitClarify(businessId, {
        action: 'unknown',
        summary: clarify.summary,
        missing: clarify.details.missing,
      });
      return traceStamp(clarify);
    }

    if (!skipClassifierRescues && rescueCandidate) {
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

    if (understood) {
      recordMisrouteTelemetry(
        this.aiEvents,
        businessId,
        enrichMisrouteTelemetryFromUnderstand(
          {
            surface: 'dashboard',
            prompt: effectivePrompt,
            classifierAction,
            rescuedAction: parsed.action,
            rescueReason: pipelineRescueReason(understood),
            classifierConfidence,
            compoundStepCount: 1,
          },
          understood,
          understandTrace,
        ),
      );
    }

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
      return traceStamp({
        success: false,
        action: parsed.action,
        summary: `Action "${parsed.action.replace(/_/g, ' ')}" is not allowed for your role (${actorTier}).`,
        details: { tier: actorTier, action: parsed.action },
      });
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
    if (roleDenied) return traceStamp(roleDenied);

    const planTierId =
      (session?.context?._planTierId as PlanTierId | undefined) ?? 'solo';
    if (!isDashboardAiIntentAllowedByPlan(planTierId, parsed.action)) {
      return traceStamp({
        success: false,
        action: parsed.action,
        summary: `Action "${parsed.action.replace(/_/g, ' ')}" requires a paid plan. Upgrade to unlock advanced AI operations.`,
        details: { planTierId, action: parsed.action, upgradeRequired: true },
      });
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
      typeof session?.context?.locale === 'string'
        ? session.context.locale
        : undefined,
    );
    if (securityDenied) {
      return traceStamp(securityDenied);
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
      this.completionPipeline.normalizeDateParams(
        parsed.params,
        effectivePrompt,
        timeZone,
      );
    }

    if (parsed.action === 'mark_paid') {
      const pageCtx = session?.context as Record<string, unknown> | undefined;
      const markPaidSessionDate =
        typeof pageCtx?.date === 'string' ? pageCtx.date : undefined;
      Object.assign(
        parsed.params,
        enrichMarkPaidParamsFromPrompt(
          effectivePrompt,
          parsed.params,
          timeZone,
          {
            employees: employees.map((e) => ({ name: e.name })),
            customers: customers.map((c) => ({ name: c.name })),
            sessionDate: markPaidSessionDate,
            calendarRoute:
              typeof pageCtx?.route === 'string' ? pageCtx.route : undefined,
          },
        ),
      );
      this.completionPipeline.normalizeDateParams(
        parsed.params,
        effectivePrompt,
        timeZone,
      );
    }

    const handoff = runCompletionValidateHandoff(
      {
        businessId,
        prompt: effectivePrompt,
        classified: parsed,
        catalog,
        timeZone,
        priorTrace: understandTrace,
      },
      this.completionPipeline,
    );

    if (handoff.status === 'clarify') {
      this.aiEvents.emitClarify(businessId, {
        action: parsed.action,
        summary: handoff.result.summary,
        missing: handoff.result.details.missing,
      });
      traceCtx.pipelineTrace = handoff.trace;
      return traceStamp(handoff.result);
    }

    const resolved = handoff.resolved;
    const pipelineTrace = handoff.trace;
    traceCtx.pipelineTrace = pipelineTrace;
    traceCtx.confidence = confidence;
    if (understood) {
      traceCtx.candidateSource = resolveWinningCandidateSource(
        understood,
        parsed.action,
      );
    } else if (guideHandoff) {
      traceCtx.candidateSource = 'guide_handoff';
    }

    if (
      !guideHandoff &&
      shouldBlockLowConfidencePipelineMutate(
        parsed.action,
        confidence,
        aiConfig.confidence.low,
      )
    ) {
      return traceStamp({
        success: false,
        action: parsed.action,
        summary: `I'm not fully confident I understood that (${Math.round(confidence * 100)}% confidence). Did you mean to "${parsed.action.replace(/_/g, ' ')}"? Please rephrase or add more detail.`,
        details: {
          needsClarification: true,
          confidence,
          reasoning: parsed.reasoning,
          playbook: playbook?.name,
          pipelineTrace,
        },
      });
    }

    const confirmed = isExecutionConfirmed(session);
    const handoffConfirmPrompt =
      typeof guideHandoff?.params?.prompt === 'string'
        ? String(guideHandoff.params.prompt)
        : buildGuideHandoffExecutionPrompt(
            parsed.action,
            resolved.enrichedParams,
          );

    if (
      guideHandoff &&
      isGuideHandoffMutatingAction(parsed.action) &&
      !confirmed
    ) {
      const confirmResult = buildExecutionConfirmationResult(
        parsed.action,
        parsed.reasoning,
        handoffConfirmPrompt,
        resolved.enrichedParams,
      );
      confirmResult.details = {
        ...confirmResult.details,
        guideHandoff,
        directGuideHandoff: true,
        pipelineTrace,
        confidence,
        playbook: playbook?.name ?? null,
      };
      return traceStamp(confirmResult);
    }

    // e2e-bug.161 / e2e-bug.164 — high-risk mutates always require confirmation
    // when not yet confirmed (registry-driven policy, not ad hoc inline lists).
    //
    // e2e-bug.404 — planner-routed actions answer to the spec model as well.
    // `DASHBOARD_EXECUTION_CONFIRM_ACTIONS` covers 59 of the 210 commands
    // `CommandSpec` says must be confirmed, so the action-name list alone would
    // let the planner execute `appointment.mark_paid` (T2, money) silently. The
    // requirement is re-derived from the registry rather than carried from
    // `decidePlannerRoute`, so it cannot be dropped in transport and fail open.
    //
    // Scoped to `candidateSource === 'planner'` on purpose: applying the spec
    // model to detector traffic is `e2e-bug.405`, a product decision about 13
    // dashboard commands, and settling it here as a side effect would start
    // interrupting users on flows that never asked.
    if (
      shouldConfirmBeforeExecute({
        action: parsed.action,
        candidateSource: traceCtx.candidateSource,
        alreadyConfirmed: confirmed,
      })
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
        ...(guideHandoff ? { guideHandoff, directGuideHandoff: true } : {}),
      };
      return traceStamp(confirmResult);
    }

    const params = resolved.enrichedParams;
    const employeeId = params.employeeId ?? resolved.entities.employeeId;
    const resolvedEmployee = resolved.entities.employee;

    let result: CommandResult;

    const coreResult = await this.dashboardCore.tryDispatch({
      businessId,
      action: parsed.action,
      params,
      effectivePrompt,
      userId,
      services,
      customers,
      session,
      resolveCustomer: (list, name, onAmbiguous) =>
          this.resolveCustomerStrict(list, name, onAmbiguous),
      isExecutionConfirmed,
    });
    if (coreResult != null) {
      result = coreResult;
    } else {
      const paymentsResult = await this.payments.dispatchIntent({
        businessId,
        action: parsed.action,
        params,
        prompt: effectivePrompt,
        userId,
        catalogServices: services,
      });
      if (paymentsResult != null) {
        result = paymentsResult;
      } else {
        const integrationsResult = await this.integrations.dispatchIntent({
          businessId,
          action: parsed.action,
          params,
          prompt: effectivePrompt,
          userId,
          actorEmail: session?.context?.userEmail as string | undefined,
          actorName: session?.context?.userName as string | undefined,
          sessionCustomerId: session?.context?.customerId as string | undefined,
        });
        if (integrationsResult != null) {
          result = integrationsResult;
        } else {
          const giftFulfillmentResult =
            await this.giftFulfillment.dispatchIntent({
              businessId,
              action: parsed.action,
              params,
              prompt: effectivePrompt,
              userId,
              sessionCustomerId: session?.context?.customerId as
                | string
                | undefined,
            });
          if (giftFulfillmentResult != null) {
            result = giftFulfillmentResult;
          } else {
            const pushNotificationsResult =
              await this.pushNotifications.dispatchIntent({
                businessId,
                action: parsed.action,
                params,
                prompt: effectivePrompt,
                userId,
                employeeId,
                sessionLastPush: session?.context?.lastPush,
                sessionOfflineQueueCount: session?.context?.offlineQueueCount,
                sessionOnline: session?.context?.online,
                sessionScopedEmployeeId: session?.context?.scopedEmployeeId as
                  | string
                  | undefined,
                sessionCustomerId: session?.context?.customerId as
                  | string
                  | undefined,
              });
            if (pushNotificationsResult != null) {
              result = pushNotificationsResult;
            } else {
              const bookingCoreResult = await this.bookingCore.dispatchIntent({
                businessId,
                action: parsed.action,
                params,
                prompt: effectivePrompt,
                userId,
                employeeId,
                resolvedEmployeeName: resolvedEmployee?.name,
                employees,
                services,
                customers,
                templates,
                timeZone,
                lookupCustomerAccessContext:
                  (session?.context?._accessTier as string | undefined) ??
                  (session?.context?._actorRole as string | undefined),
              });
              if (bookingCoreResult != null) {
                result = bookingCoreResult;
              } else {
                const bookingDepthResult =
                  await this.bookingDepth.dispatchIntent({
                    businessId,
                    action: parsed.action,
                    params,
                    prompt: effectivePrompt,
                    userId,
                    employees,
                    services,
                    customers,
                    timeZone,
                    sessionDate:
                      typeof (
                        session?.context as Record<string, unknown> | undefined
                      )?.date === 'string'
                        ? ((session?.context as Record<string, unknown>)
                            .date as string)
                        : undefined,
                    calendarRoute:
                      typeof (
                        session?.context as Record<string, unknown> | undefined
                      )?.route === 'string'
                        ? ((session?.context as Record<string, unknown>)
                            .route as string)
                        : undefined,
                    resolveEmployee: (list, name, onAmbiguous) =>
                      this.resolveEmployeeStrict(list, name, onAmbiguous),
                    resolveServices: (list, p) => this.resolveServices(list, p),
                    resolveCustomer: (list, name, onAmbiguous) =>
                      this.resolveCustomerStrict(list, name, onAmbiguous),
                    resolveBusinessRow: () =>
                      this.businessRepo.findOne({ where: { id: businessId } }),
                  });
                if (bookingDepthResult != null) {
                  result = bookingDepthResult;
                } else {
                  const scheduleResourcesResult =
                    await this.scheduleResources.dispatchIntent({
                      businessId,
                      action: parsed.action,
                      params,
                      prompt: effectivePrompt,
                      services,
                      employeeId,
                    });
                  if (scheduleResourcesResult != null) {
                    result = scheduleResourcesResult;
                  } else {
                    const retailFinanceResult =
                      await this.retailFinance.dispatchIntent({
                        businessId,
                        action: parsed.action,
                        params,
                        prompt: effectivePrompt,
                        userId,
                        sessionEmployeeId: session?.context?.employeeId as
                          | string
                          | undefined,
                      });
                    if (retailFinanceResult != null) {
                      result = retailFinanceResult;
                    } else {
                      const customerCrmResult =
                        await this.customerCrm.dispatchIntent({
                          businessId,
                          action: parsed.action,
                          params,
                          prompt: effectivePrompt,
                          customers,
                          resolveCustomer: (list, name, onAmbiguous) =>
                            this.resolveCustomerStrict(list, name, onAmbiguous),
                          sessionCustomerId: session?.context?.customerId,
                        });
                      if (customerCrmResult != null) {
                        result = customerCrmResult;
                      } else {
                        const marketingGrowthResult =
                          await this.marketingGrowth.dispatchIntent({
                            businessId,
                            action: parsed.action,
                            params,
                            prompt: effectivePrompt,
                            userEmail: session?.context?.userEmail as
                              | string
                              | undefined,
                            sessionCustomerId: session?.context?.customerId as
                              | string
                              | undefined,
                          });
                        if (marketingGrowthResult != null) {
                          result = marketingGrowthResult;
                        } else {
                          const selfServiceBookingResult =
                            await this.selfServiceBooking.dispatchIntent({
                              businessId,
                              action: parsed.action,
                              params,
                              prompt: effectivePrompt,
                              sessionCustomerId: session?.context
                                ?.customerId as string | undefined,
                              sessionCartServiceIds:
                                session?.context?.cartServiceIds,
                              sessionBookingId: session?.context?.bookingId,
                            });
                          if (selfServiceBookingResult != null) {
                            result = selfServiceBookingResult;
                          } else {
                            const businessComplianceResult =
                              await this.businessCompliance.dispatchIntent({
                                businessId,
                                action: parsed.action,
                                params,
                                prompt: effectivePrompt,
                                userId,
                              });
                            if (businessComplianceResult != null) {
                              result = businessComplianceResult;
                            } else {
                              const scheduleHandlersResult =
                                await this.scheduleHandlers.dispatchIntent({
                                  businessId,
                                  action: parsed.action,
                                  params,
                                  prompt: effectivePrompt,
                                  employees,
                                  services,
                                  userId,
                                });
                              if (scheduleHandlersResult != null) {
                                result = scheduleHandlersResult;
                              } else {
                                const metaOpsResult =
                                  await this.metaOps.dispatchIntent({
                                    businessId,
                                    action: parsed.action,
                                    params,
                                    membershipRole: session?.context
                                      ?._membershipRole as string | undefined,
                                  });
                                if (metaOpsResult != null) {
                                  result = metaOpsResult;
                                } else {
                                  const operationsResult =
                                    await this.operations.dispatchIntent({
                                      businessId,
                                      action: parsed.action,
                                      params,
                                      prompt: effectivePrompt,
                                      employees,
                                      services,
                                      timeZone,
                                      userId,
                                    });
                                  if (operationsResult != null) {
                                    result = operationsResult;
                                  } else {
                                    const onboardingResult =
                                      await this.onboarding.dispatchIntent({
                                        businessId,
                                        action: parsed.action,
                                        params,
                                        userId,
                                      });
                                    if (onboardingResult != null) {
                                      result = onboardingResult;
                                    } else {
                                      const businessDateFormatResult =
                                        await this.businessDateFormat.dispatchIntent(
                                          {
                                            businessId,
                                            action: parsed.action,
                                            params,
                                            prompt: effectivePrompt,
                                            confirmed:
                                              isExecutionConfirmed(session),
                                          },
                                        );
                                      if (businessDateFormatResult != null) {
                                        result = businessDateFormatResult;
                                      } else {
                                        const clinicTestCatalogResult =
                                          await this.clinicTestCatalog.dispatchIntent(
                                            {
                                              businessId,
                                              action: parsed.action,
                                              params,
                                              userId,
                                            },
                                          );
                                        if (clinicTestCatalogResult != null) {
                                          result = clinicTestCatalogResult;
                                        } else {
                                          const patientClinicalMutationsResult =
                                            await this.patientClinicalMutations.dispatchIntent(
                                              {
                                                businessId,
                                                action: parsed.action,
                                                params,
                                                userId,
                                              },
                                            );
                                          if (
                                            patientClinicalMutationsResult !=
                                            null
                                          ) {
                                            result =
                                              patientClinicalMutationsResult;
                                          } else {
                                            const tourServiceResult =
                                              await this.tourService.dispatchIntent(
                                                {
                                                  businessId,
                                                  action: parsed.action,
                                                  params,
                                                  prompt: effectivePrompt,
                                                  userId,
                                                },
                                              );
                                            if (tourServiceResult != null) {
                                              result = tourServiceResult;
                                            } else {
                                              const businessTaxResult =
                                                await this.businessTax.dispatchIntent(
                                                  {
                                                    businessId,
                                                    action: parsed.action,
                                                    params,
                                                    prompt: effectivePrompt,
                                                  },
                                                );
                                              if (businessTaxResult != null) {
                                                result = businessTaxResult;
                                              } else {
                                                const businessCurrencyResult =
                                                  await this.businessCurrency.dispatchIntent(
                                                    {
                                                      businessId,
                                                      action: parsed.action,
                                                      params,
                                                      prompt: effectivePrompt,
                                                      confirmed:
                                                        isExecutionConfirmed(
                                                          session,
                                                        ),
                                                    },
                                                  );
                                                if (
                                                  businessCurrencyResult != null
                                                ) {
                                                  result =
                                                    businessCurrencyResult;
                                                } else {
                                                  const agentOpsResult =
                                                    await this.agentOps.dispatchIntent(
                                                      {
                                                        businessId,
                                                        action: parsed.action,
                                                        params,
                                                        userId,
                                                      },
                                                    );
                                                  if (agentOpsResult != null) {
                                                    result = agentOpsResult;
                                                  } else {
                                                    const recommendationProductResult =
                                                      await this.recommendationProduct.dispatchIntent(
                                                        {
                                                          businessId,
                                                          action: parsed.action,
                                                          params,
                                                          prompt:
                                                            effectivePrompt,
                                                        },
                                                      );
                                                    if (
                                                      recommendationProductResult !=
                                                      null
                                                    ) {
                                                      result =
                                                        recommendationProductResult;
                                                    } else {
                                                      const smallServicesResult =
                                                        await this.dispatchSmallServices(
                                                          businessId,
                                                          parsed.action,
                                                          params,
                                                          effectivePrompt,
                                                          userId,
                                                          employees,
                                                          services,
                                                          customers,
                                                          session,
                                                        );
                                                      if (
                                                        smallServicesResult !=
                                                        null
                                                      ) {
                                                        result =
                                                          smallServicesResult;
                                                      } else
                                                        switch (parsed.action) {
                                                          case 'explain_app_feature':
                                                          case 'guide_user_flow':
                                                          case 'explain_current_screen':
                                                            result =
                                                              await this.dispatchProductGuideIntent(
                                                                parsed.action,
                                                                businessId,
                                                                params,
                                                                effectivePrompt,
                                                                session,
                                                              );
                                                            break;
                                                          case 'explain_ai_settings':
                                                          case 'explain_ai_suggestions':
                                                          case 'explain_assistant_approval':
                                                            result =
                                                              await this.dispatchMetaProductGuideIntent(
                                                                parsed.action,
                                                                businessId,
                                                                params,
                                                                effectivePrompt,
                                                                session,
                                                                userId,
                                                              );
                                                            break;
                                                          case 'explain_visibility_block':
                                                          case 'explain_empty_catalog':
                                                          case 'explain_stripe_not_connected':
                                                            result =
                                                              await this.dispatchEmptyStateGuideIntent(
                                                                parsed.action,
                                                                businessId,
                                                                params,
                                                                effectivePrompt,
                                                                session,
                                                              );
                                                            break;
                                                          case 'create_service': {
                                                            const createParams =
                                                              { ...params };
                                                            enrichCreateServiceParamsFromPrompt(
                                                              createParams,
                                                              effectivePrompt,
                                                              services,
                                                            );
                                                            if (
                                                              Array.isArray(
                                                                createParams.services,
                                                              ) &&
                                                              createParams
                                                                .services
                                                                .length > 1
                                                            ) {
                                                              result =
                                                                await this.handleCreateServices(
                                                                  businessId,
                                                                  createParams,
                                                                  services,
                                                                  userId,
                                                                  effectivePrompt,
                                                                );
                                                            } else {
                                                              result =
                                                                await this.handleCreateService(
                                                                  businessId,
                                                                  createParams,
                                                                  services,
                                                                  userId,
                                                                  effectivePrompt,
                                                                );
                                                            }
                                                            break;
                                                          }
                                                          case 'create_services': {
                                                            const bulkCreateParams =
                                                              { ...params };
                                                            enrichCreateServicesParamsFromPrompt(
                                                              bulkCreateParams,
                                                              effectivePrompt,
                                                            );
                                                            result =
                                                              await this.handleCreateServices(
                                                                businessId,
                                                                bulkCreateParams,
                                                                services,
                                                                userId,
                                                                effectivePrompt,
                                                              );
                                                            break;
                                                          }
                                                          case 'optimize_schedule':
                                                            result =
                                                              this.toCommandResult(
                                                                await this.orchestration.runOrchestrationIntent(
                                                                  {
                                                                    businessId,
                                                                    intent:
                                                                      effectivePrompt,
                                                                    // e2e-bug.150 — canonical action, not the raw user prompt.
                                                                    action:
                                                                      'optimize_schedule',
                                                                    agentType:
                                                                      AgentType.SCHEDULING_OPTIMIZATION,
                                                                    userId,
                                                                    date: params.date,
                                                                    employeeId,
                                                                  },
                                                                ),
                                                              );
                                                            break;
                                                          case 'resolve_conflicts':
                                                            result =
                                                              this.toCommandResult(
                                                                await this.orchestration.runOrchestrationIntent(
                                                                  {
                                                                    businessId,
                                                                    intent:
                                                                      effectivePrompt,
                                                                    action:
                                                                      'resolve_conflicts',
                                                                    agentType:
                                                                      AgentType.CONFLICT_RESOLUTION,
                                                                    userId,
                                                                    date: params.date,
                                                                    employeeId,
                                                                  },
                                                                ),
                                                              );
                                                            break;
                                                          case 'reassign_cancelled':
                                                            result =
                                                              this.toCommandResult(
                                                                await this.orchestration.runOrchestrationIntent(
                                                                  {
                                                                    businessId,
                                                                    intent:
                                                                      effectivePrompt,
                                                                    action:
                                                                      'reassign_cancelled',
                                                                    agentType:
                                                                      AgentType.CANCELLATION_RECOVERY,
                                                                    userId,
                                                                    date: params.date,
                                                                    employeeId,
                                                                  },
                                                                ),
                                                              );
                                                            break;
                                                          default:
                                                            result =
                                                              buildUnwiredDashboardIntentResult(
                                                                parsed.action,
                                                                {
                                                                  reasoning:
                                                                    parsed.reasoning,
                                                                  parsed:
                                                                    parsed as unknown as Record<
                                                                      string,
                                                                      unknown
                                                                    >,
                                                                },
                                                              );
                                                            break;
                                                        }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    result.details = {
      ...result.details,
      pipelineTrace: traceCtx.pipelineTrace ?? pipelineTrace,
      confidence,
      playbook: playbook?.name ?? null,
    };
    const final = this.completionPipeline.attachSessionToResult(
      result,
      resolved,
    );
    this.emitCommandEvents(businessId, final);
    return traceStamp(final);
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
    } else if (
      promptService &&
      action !== 'create_service' &&
      action !== 'create_services'
    ) {
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
    } else if (action !== 'reschedule_booking' && action !== 'mark_paid') {
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
    } else if (action !== 'mark_paid') {
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
    if (action === 'configure_service_online_payment') {
      Object.assign(
        params,
        enrichServiceOnlinePaymentParamsFromPrompt(params, prompt),
      );
    }
    if (action === 'configure_service_deposit_policy') {
      Object.assign(
        params,
        enrichServiceDepositPolicyParamsFromPrompt(params, prompt),
      );
    }
    if (action === 'configure_notification_settings') {
      Object.assign(
        params,
        enrichNotificationSettingsParamsFromPrompt(params, prompt),
      );
    }
    if (action === 'configure_whatsapp_integration') {
      Object.assign(
        params,
        enrichWhatsappIntegrationParamsFromPrompt(params, prompt),
      );
    }
    if (action === 'configure_openai_integration') {
      Object.assign(
        params,
        enrichOpenaiIntegrationParamsFromPrompt(params, prompt),
      );
    }
    if (action === 'configure_stripe_connect') {
      Object.assign(
        params,
        enrichConfigureStripeConnectParamsFromPrompt(params, prompt),
      );
    }
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
    options?: {
      narrowShortlist?: readonly string[];
      surface?: CommandSurface;
    },
  ): Promise<ClassifiedIntent | null> {
    const narrowShortlist = options?.narrowShortlist;
    const isNarrow = (narrowShortlist?.length ?? 0) > 0;
    const surface = options?.surface ?? 'dashboard';
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

    const schemaHeader = isNarrow
      ? buildNarrowClassifierSchema(surface, narrowShortlist!)
      : DASHBOARD_INTENT_SCHEMA;
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${schemaHeader}\n\n${CLASSIFIER_MULTILINGUAL_RULES}\n\n${this.promptSecurity.getClassifierSecurityRules()}\n\n${context}${intelligenceBlock}${sessionBlock}${routeHintBlock}`,
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
        surface: commandSurfaceToAiUsageSurface(surface),
        operation: isNarrow ? 'narrow_classify_intent' : 'classify_intent',
        actorType: 'manager',
        userId,
      },
      {
        messages,
        responseFormat: 'json_object',
        temperature: 0.1,
        maxTokens: isNarrow ? 400 : 500,
      },
    );

    const raw = response?.choices[0]?.message?.content;
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as ClassifiedIntent;
      if (
        isNarrow &&
        parsed.action &&
        !narrowShortlist!.includes(parsed.action)
      ) {
        this.logger.warn(
          `Narrow classify returned out-of-shortlist action: ${parsed.action}`,
        );
        return null;
      }
      return parsed;
    } catch (err: any) {
      this.logger.error(`Intent classification parse failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Registry-driven dispatch (ai-cmd-ext-0.5) for the final batch of small,
   * single/few-case services. Collapsed into a sequential try-loop rather than
   * more nested if/else levels, per the nesting-depth concern flagged after
   * slice 16.
   */
  private async dispatchSmallServices(
    businessId: string,
    action: string,
    params: Record<string, any>,
    prompt: string,
    userId: string | undefined,
    employees: Employee[],
    services: Service[],
    customers: Customer[],
    session: CommandSessionOptions | undefined,
  ): Promise<CommandResult | null> {
    const confirmed = isExecutionConfirmed(session);
    const uid = userId ?? '';

    const clinicTestResultResult = await this.clinicTestResult.dispatchIntent({
      businessId,
      action,
      params,
      prompt,
      userId,
      confirmed,
    });
    if (clinicTestResultResult != null) return clinicTestResultResult;

    const schedulingResult = await this.scheduling.dispatchIntent({
      businessId,
      action,
      params,
      prompt,
      employees,
      services,
      userId,
    });
    if (schedulingResult != null) return schedulingResult;

    const clinicServiceResult = await this.clinicService.dispatchIntent({
      businessId,
      action,
      params,
      prompt,
      userId,
    });
    if (clinicServiceResult != null) return clinicServiceResult;

    const clinicQuestionnaireResult =
      await this.clinicQuestionnaire.dispatchIntent({
        businessId,
        action,
        params,
        userId: uid,
      });
    if (clinicQuestionnaireResult != null) return clinicQuestionnaireResult;

    const externalDoctorsResult = await this.externalDoctors.dispatchIntent({
      businessId,
      action,
      params,
      userId,
    });
    if (externalDoctorsResult != null) return externalDoctorsResult;

    const businessProfileResult = await this.businessProfile.dispatchIntent({
      businessId,
      action,
      params,
    });
    if (businessProfileResult != null) return businessProfileResult;

    const clinicPreVisitIntakeResult =
      await this.clinicPreVisitIntake.dispatchIntent({
        businessId,
        action,
        params,
        userId: uid,
      });
    if (clinicPreVisitIntakeResult != null) return clinicPreVisitIntakeResult;

    const locationsResult = await this.locations.dispatchIntent({
      businessId,
      action,
      params,
    });
    if (locationsResult != null) return locationsResult;

    const businessHoursLocationResult =
      await this.businessHoursLocation.dispatchIntent({
        businessId,
        action,
        params,
        prompt,
      });
    if (businessHoursLocationResult != null) return businessHoursLocationResult;

    const referralStaffTemplatesResult =
      await this.referralStaffTemplates.dispatchIntent({
        businessId,
        action,
        params,
      });
    if (referralStaffTemplatesResult != null)
      return referralStaffTemplatesResult;

    const clinicTestOrderResult = await this.clinicTestOrder.dispatchIntent({
      businessId,
      action,
      params,
      prompt,
      userId: uid,
      confirmed,
    });
    if (clinicTestOrderResult != null) return clinicTestOrderResult;

    const clinicLabBookingResult = await this.clinicLabBooking.dispatchIntent({
      businessId,
      action,
      params,
      prompt,
      userId: uid,
      confirmed,
    });
    if (clinicLabBookingResult != null) return clinicLabBookingResult;

    const packageLocalizedNamesResult =
      await this.packageLocalizedNames.dispatchIntent({
        businessId,
        action,
        params,
        prompt,
        sessionLocale:
          typeof session?.context?.locale === 'string'
            ? session.context.locale
            : undefined,
      });
    if (packageLocalizedNamesResult != null) return packageLocalizedNamesResult;

    const openaiIntegrationResult = await this.openaiIntegration.dispatchIntent(
      { businessId, action, params, prompt },
    );
    if (openaiIntegrationResult != null) return openaiIntegrationResult;

    const providerClinicTasksAndResultsResult =
      await this.providerClinicTasksAndResults.dispatchIntent({
        businessId,
        action,
        params,
        prompt,
        userId: uid,
      });
    if (providerClinicTasksAndResultsResult != null)
      return providerClinicTasksAndResultsResult;

    const businessLanguagesResult = await this.businessLanguages.dispatchIntent(
      { businessId, action },
    );
    if (businessLanguagesResult != null) return businessLanguagesResult;

    const clinicPatientChartResult =
      await this.clinicPatientChart.dispatchIntent({
        businessId,
        action,
        params,
        prompt,
        userId: uid,
      });
    if (clinicPatientChartResult != null) return clinicPatientChartResult;

    if (userId) {
      const providerTimeOffResult = await this.providerTimeOff.dispatchIntent({
        businessId,
        action,
        params,
        userId,
      });
      if (providerTimeOffResult != null) return providerTimeOffResult;
    }

    switch (action) {
      case 'list_waitlist_entries':
        return handleListWaitlistEntriesLogic(
          { customerRepo: this.customerRepo },
          businessId,
          params,
        );
      case 'offer_waitlist_slot':
        return handleOfferWaitlistSlotLogic(
          { customerRepo: this.customerRepo },
          businessId,
          enrichOfferWaitlistSlotParams(prompt, params),
        );
      case 'create_booking_subscription_credit': {
        const prepared =
          await this.bookingDepth.prepareSubscriptionCreditParams(
            businessId,
            params,
            customers,
            services,
            (list, name, onAmbiguous) =>
          this.resolveCustomerStrict(list, name, onAmbiguous),
            (list, name) => this.resolveService(list, name) ?? undefined,
          );
        if (!prepared.ok) return prepared.result;
        const bookingResult = await this.bookingCore.handleCreateBooking(
          businessId,
          prepared.params,
          employees,
          services,
          customers,
          userId,
          prompt,
        );
        return bookingResult.action === 'create_booking'
          ? { ...bookingResult, action: 'create_booking_subscription_credit' }
          : bookingResult;
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
        if (!prepared.ok) return prepared.result;
        const bookingResult = await this.bookingCore.handleCreateBooking(
          businessId,
          prepared.params,
          employees,
          services,
          customers,
          userId,
          prompt,
        );
        return bookingResult.action === 'create_booking'
          ? { ...bookingResult, action: 'create_booking_cash' }
          : bookingResult;
      }
      default:
        return null;
    }
  }

  private resolveEmployee(
    employees: Employee[],
    name: string,
  ): Employee | undefined {
    return this.fuzzyMatchByName(employees, name);
  }

  /**
   * Name resolution that can say "I don't know which one" (tech-debt D5).
   *
   * Third copy of the pattern, after `AiBookingCoreService` and
   * `PublicBookingAssistantService`, because this service also carries its own
   * private `fuzzyMatchByName` rather than importing the shared one.
   *
   * Same two constraints as the other two: `threshold: 0`, so acceptance is
   * unchanged and only ties are refused, and a `not_found` fallback to the
   * local matcher. That fallback deliberately preserves this file's copy of the
   * e2e-bug.446 substring defect — fixing it here would be a separate change,
   * and e2e-bug.447 shows it cannot be fixed by simply importing the shared
   * export.
   */
  private resolveNamedVerdict<T extends { id: string; name: string }>(
    items: T[],
    name: string,
    entityLabel: 'customer' | 'provider',
  ): { match?: T; ambiguous: T[]; clarification: string } {
    const verdict = resolveEntity(items, name, { entityLabel, threshold: 0 });
    if (verdict.status === 'ambiguous') {
      return {
        ambiguous: verdict.candidates,
        clarification:
          verdict.clarification ??
          `Which ${entityLabel} did you mean by "${name}"?`,
      };
    }
    return {
      match: verdict.match ?? this.fuzzyMatchByName(items, name),
      ambiguous: [],
      clarification: '',
    };
  }

  /**
   * tech-debt D5-b — the injected-callback form of customer resolution.
   *
   * The compound services (CRM, catalog, subscription-credit) resolve names
   * they parse out of the prompt themselves, so the caller cannot guard them
   * the way D5-a's handlers guard theirs: it does not know the names yet. The
   * callback signature is `(list, name) => Customer | undefined`, and the row
   * for this item concluded the callees' signatures had to change before a tie
   * could be refused.
   *
   * They do not. `undefined` is not silence on these paths — every callee
   * already answers it with a clarify (`ai-customer-crm.logic.ts`:
   * `failure(..., 'Specify which customer …', { clarify: true, missing:
   * ['customerName'] })`). That is the same "use the channel that already
   * exists" move that closed D5-a's `buildCreateBookingPlanOnly`.
   *
   * So a tie returns `undefined` and the user is asked which customer, instead
   * of the compound mutating whichever namesake sorted first.
   *
   * **What this deliberately does not do:** name the tied candidates. The
   * callee's message is generic because `undefined` carries no candidates.
   * Naming them is the contract change this item is really about, and it is
   * worth doing — but it is a strictly better message on top of correct
   * behaviour, not a prerequisite for it.
   */
  /**
   * tech-debt D5-b — the provider half, migrated only after its callees were
   * checked one by one. They do not agree, which is why this is separate.
   *
   * `ai-booking-depth.logic.ts` consumes this callback in three places. Two
   * answer `undefined` with a clarify (`'Specify provider, date, and block
   * start time…'`, `'Provider "X" not found.'`). The third — the package
   * line loop — answered it with a bare `continue`, silently dropping that
   * appointment while still reporting "Booked N appointment(s)".
   *
   * Migrating into that third site would have traded "booked with the wrong
   * provider" for "silently not booked, and not told" — a partial success,
   * which is the e2e-bug.448(a) defect. So the `continue` was made to record
   * and report what it skipped **first**; only then is refusing a tie here an
   * improvement on every path rather than two out of three.
   */
  /** e2e-bug.488 — verdict -> the shape an injected callee can render. */
  private toAmbiguityReport(verdict: {
    ambiguous: { id: string; name: string }[];
    clarification: string;
  }): AmbiguityReport {
    return {
      candidates: verdict.ambiguous.map((c) => ({ id: c.id, name: c.name })),
      clarification: verdict.clarification,
    };
  }

  private resolveEmployeeStrict(
    employees: Employee[],
    name: string,
    onAmbiguous?: OnAmbiguousName,
  ): Employee | undefined {
    const verdict = this.resolveNamedVerdict(employees, name, 'provider');
    if (verdict.ambiguous.length > 1) {
      onAmbiguous?.(this.toAmbiguityReport(verdict));
      return undefined;
    }
    return verdict.match;
  }

  private resolveCustomerStrict(
    customers: Customer[],
    name: string,
    onAmbiguous?: OnAmbiguousName,
  ): Customer | undefined {
    const verdict = this.resolveNamedVerdict(customers, name, 'customer');
    if (verdict.ambiguous.length > 1) {
      onAmbiguous?.(this.toAmbiguityReport(verdict));
      return undefined;
    }
    return verdict.match;
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
    // e2e-bug.446 / e2e-bug.362 — this was a third copy of the tiered matcher
    // whose last tier was a raw `lower.includes(item.name)`. That returned an
    // employee called "Al" for "is the salon open" (s-**al**-on) and, worse,
    // for "book Alice for a haircut" — the wrong colleague, confidently.
    // e2e-bug.362 anchored the shared version to word boundaries; the fix never
    // reached the private copies. Delegating rather than re-patching, so the
    // next fix has one place to land.
    return canonicalFuzzyMatchByName(items, name);
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

  /** ai-guide-1.8.7 — meta-AI guide intents → AiProductGuideService playbooks. */
  private async dispatchMetaProductGuideIntent(
    action: MetaProductGuideIntent,
    businessId: string,
    params: Record<string, unknown>,
    effectivePrompt: string,
    session?: CommandSessionOptions,
    userId?: string,
  ): Promise<CommandResult> {
    const context = resolveProductGuideSessionContext(session, 'dashboard');
    const payload = {
      ...mergeProductGuideParams(params, session),
      _prompt: effectivePrompt,
    };
    return runMetaProductGuideIntent({
      productGuide: this.productGuide,
      businessId,
      prompt: effectivePrompt,
      metaIntent: action,
      surface: 'dashboard',
      userId,
      params: payload,
      session: session ? { context: session.context } : undefined,
      sessionContext: context,
    });
  }

  /** ai-guide-1.8.9 — live permission / empty-state guides. */
  private async dispatchEmptyStateGuideIntent(
    action: EmptyStateGuideIntent,
    businessId: string,
    params: Record<string, unknown>,
    effectivePrompt: string,
    session?: CommandSessionOptions,
  ): Promise<CommandResult> {
    if (!isEmptyStateGuideIntent(action)) {
      return {
        success: false,
        action,
        summary: 'Unsupported empty-state guide intent on dashboard.',
        details: {},
      };
    }
    const context = resolveProductGuideSessionContext(session, 'dashboard');
    return this.emptyStateGuide.runIntent({
      businessId,
      intent: action,
      surface: 'dashboard',
      prompt: effectivePrompt,
      params: {
        ...mergeProductGuideParams(params, session),
        _prompt: effectivePrompt,
      },
      session: session ? { context: session.context } : undefined,
      sessionContext: context,
      locale: context.locale,
    });
  }

  /** ai-guide-1.2.6 — dashboard product guide intents → AiProductGuideService. */
  private async dispatchProductGuideIntent(
    action: AppGuideIntent,
    businessId: string,
    params: Record<string, unknown>,
    effectivePrompt: string,
    session?: CommandSessionOptions,
  ): Promise<CommandResult> {
    const context = resolveProductGuideSessionContext(session, 'dashboard');
    const topicId = enrichGuideTopicFromPrompt(effectivePrompt, {
      surface: 'dashboard',
      route: context.route,
      topicId: params.topicId,
    });
    const payload = {
      ...mergeProductGuideParams(params, session),
      ...(topicId ? { topicId } : {}),
      _prompt: effectivePrompt,
    };
    switch (action) {
      case 'explain_app_feature':
        return this.productGuide.handleExplainAppFeatureAsync(
          businessId,
          payload,
          effectivePrompt,
          { ...context, session },
        );
      case 'guide_user_flow':
        return this.productGuide.handleGuideUserFlowAsync(
          businessId,
          payload,
          effectivePrompt,
          { ...context, session },
        );
      case 'explain_current_screen':
        return this.productGuide.handleExplainCurrentScreenAsync(
          businessId,
          payload,
          effectivePrompt,
          { ...context, session },
        );
      default:
        return {
          success: false,
          action,
          summary: 'Unsupported product guide intent.',
          details: {},
        };
    }
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
    // §216 — the shared type, so the `locations` roster this object actually
    // carries (`e2e-bug.460`) is visible to the compiler at every hop rather
    // than surviving only by structural pass-through.
    catalog: BusinessCatalog,
    confidenceThresholds: { low: number; high: number },
    timeZone: string,
    resume?: { resumePlans?: AgentPlan[]; resumeStepIndex?: number },
  ): Promise<CommandResult> {
    const plans: AgentPlan[] = [...(resume?.resumePlans ?? [])];
    const startIndex =
      typeof resume?.resumeStepIndex === 'number' &&
      Number.isInteger(resume.resumeStepIndex) &&
      resume.resumeStepIndex >= 0
        ? resume.resumeStepIndex
        : 0;
    const pipelineTrace = [
      this.completionPipeline.trace(
        'classify',
        'compound_intent',
        plans.length
          ? `${subIntents.length} sub-intent(s) (resume @${startIndex})`
          : `${subIntents.length} sub-intent(s)`,
      ),
    ];

    let pendingCancelBookingIds: string[] | undefined;
    const compoundActions = subIntents.map((s) => s.action);
    // AI-ROADMAP Phase 1 — per-step telemetry. `mergePlans` copies sub-plan
    // steps with their ids intact, so recording the ids each sub-intent
    // contributed makes attribution exact rather than matched by action name
    // (one message often repeats an action: "cancel Mary's, cancel John's").
    const planStepIdsByIndex: string[][] = subIntents.map(() => []);

    for (
      let stepIndex = startIndex;
      stepIndex < subIntents.length;
      stepIndex++
    ) {
      const sub = subIntents[stepIndex];
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
      const structurallyEnriched = applyStructuralIntentEnrichment(parsed, {
        prompt,
        timeZone,
        employees: catalog.employees.map((e) => ({ id: e.id, name: e.name })),
        sessionContext: { ...session?.context, timeZone },
      });
      Object.assign(parsedParams, structurallyEnriched.params);
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
        this.completionPipeline.normalizeDateParams(
          parsedParams,
          prompt,
          timeZone,
        );
      }
      if (
        parsed.action === 'hide_appointments_from_calendar' &&
        pendingCancelBookingIds?.length
      ) {
        parsedParams.statusFilter = parsedParams.statusFilter ?? 'cancelled';
      }
      // e2e-bug.284 — keep full compound action list on mid-step clarify so
      // reschedule→create is not mistaken for a lone create_booking collapse.
      const handoff = runCompletionValidateHandoff(
        {
          businessId,
          prompt,
          classified: parsed,
          catalog,
          timeZone,
          priorTrace: pipelineTrace,
          clarifyExtras: {
            compoundStep: parsed.action,
            compoundActions,
            compoundStepIndex: stepIndex,
            decomposed: true,
          },
        },
        this.completionPipeline,
      );

      if (handoff.status === 'clarify') {
        attachCompoundStepAttribution(handoff.result, {
          actions: compoundActions,
          planStepIdsByIndex,
          clarifiedAtIndex: stepIndex,
        });
        // e2e-bug.304 / 305 — attach resume whenever a later step clarifies.
        if (stepIndex > 0) {
          return attachCompoundResumeToClarifyResult(handoff.result, {
            plans,
            subIntents,
            stepIndex,
            compoundActions,
            confirmationPrompt: prompt,
            compoundStep: parsed.action,
          });
        }
        return handoff.result;
      }

      const resolved = handoff.resolved;

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
        planStepIdsByIndex[stepIndex] = plan.steps.map((s) => s.id);
        if (parsed.action === 'cancel_bookings') {
          const cancelStep = plan.steps.find(
            (s) => s.action === 'cancel_bookings',
          );
          pendingCancelBookingIds = cancelStep?.params?.bookingIds as
            | string[]
            | undefined;
        }
      } else if (MUST_NOT_SILENTLY_SKIP_ACTIONS.has(parsed.action)) {
        // e2e-bug.487 — this `else` did not exist, so a mutating step whose
        // plan could not be built was dropped **silently** and the compound
        // reported on the steps that did build. Only `plans.length === 0`
        // produced a message, so "cancel my 2pm and rebook it Friday" could
        // cancel and then quietly not rebook.
        //
        // e2e-bug.329 fixed exactly this in `compound-command-graph.service.ts`
        // and never here; the two paths have disagreed since. The rule set and
        // labels are now imported from there rather than restated, because two
        // copies of "which actions must not be skipped" is the drift this
        // codebase keeps paying for (e2e-bug.409, e2e-bug.446).
        const actionLabel =
          COMPOUND_MUTATE_ACTION_LABELS[parsed.action] ??
          parsed.action.replace(/_/g, ' ');
        return {
          success: false,
          action: parsed.action,
          summary: `I couldn't ${actionLabel} — ${parsed.reasoning || "the details didn't match an existing booking"}. Please confirm the customer, date, time, or service and try again.`,
          details: {
            needsClarification: true,
            compoundStep: parsed.action,
            compoundActions,
            compoundStepIndex: stepIndex,
            decomposed: true,
          },
        };
      }
    }

    if (plans.length === 0) {
      const noPlanResult: CommandResult = {
        success: false,
        action: 'compound_intent',
        summary: 'Could not build a plan from the compound command.',
        details: { subIntents },
      };
      attachCompoundStepAttribution(noPlanResult, {
        actions: compoundActions,
        planStepIdsByIndex,
      });
      return noPlanResult;
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
    attachCompoundStepAttribution(result, {
      actions: compoundActions,
      planStepIdsByIndex,
    });
    return result;
  }

  private async buildPlanForResolvedIntent(
    businessId: string,
    prompt: string,
    action: string,
    params: Record<string, any>,
    employeeId: string | undefined,
    // §216 — the shared type, so the `locations` roster this object actually
    // carries (`e2e-bug.460`) is visible to the compiler at every hop rather
    // than surviving only by structural pass-through.
    catalog: BusinessCatalog,
    userId?: string,
    _pendingCancelBookingIds?: string[],
  ): Promise<AgentPlan | null> {
    switch (action) {
      case 'create_booking': {
        // §235 — `buildCreateBookingPlanOnly` is the twin slice 8 recorded as
        // return-shape blocked. The helper is; this caller is not. Same `null`
        // as the other two plan sites.
        if (
          this.bookingCore.providerNameGuard(action, params, catalog.employees)
        ) {
          return null;
        }
        const plan = await this.bookingCore.buildCreateBookingPlanOnly(
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
        const existing = findServiceByExactName(
          catalog.services,
          parsed.draft.name,
        );
        if (existing) return null;
        return this.planBuilder.buildCreateServicePlan({
          businessId,
          ...parsed.draft,
          ...buildCreateServicePrepaymentFields(
            params,
            prompt,
            parsed.draft.price,
          ),
          userId,
        });
      }
      case 'create_services': {
        const bulkParams = enrichCreateServicesPrepaymentParamsFromPrompt(
          { ...params },
          prompt,
        );
        const rawList = Array.isArray(bulkParams.services)
          ? bulkParams.services
          : [];
        if (rawList.length === 0) return null;
        const defaultCurrency = (params.currency || 'USD').trim().toUpperCase();
        const toCreate: ParsedServiceDraft[] = [];
        const batchNames = new Set<string>();
        for (const raw of rawList.slice(0, 25)) {
          const parsed = this.parseServiceDraft(raw ?? {}, defaultCurrency);
          if (parsed.errors.length > 0 || !parsed.draft) continue;
          const key = parsed.draft.name.toLowerCase();
          if (batchNames.has(key)) continue;
          if (findServiceByExactName(catalog.services, parsed.draft.name))
            continue;
          batchNames.add(key);
          toCreate.push({
            ...parsed.draft,
            ...buildCreateServicePrepaymentFields(
              raw ?? {},
              prompt,
              parsed.draft.price,
            ),
          });
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
      case 'unassign_employee_services': {
        const resolved = resolveUnassignEmployeeServicesInput(
          catalog.employees,
          catalog.services,
          params,
        );
        if (!resolved.ok) return null;
        return this.planBuilder.buildUnassignEmployeeServicesPlan({
          businessId,
          employeeId: resolved.employeeId,
          employeeName: resolved.employeeName,
          serviceIds: resolved.serviceIds,
          serviceNames: resolved.serviceNames,
          removedServiceNames: resolved.serviceNames,
          userId,
        });
      }
      case 'transfer_employee_services': {
        const resolved = resolveTransferEmployeeServicesInput(
          catalog.employees,
          catalog.services,
          params,
        );
        if (!resolved.ok) return null;
        return this.planBuilder.buildTransferEmployeeServicesPlan({
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
        const bookings = await this.bookingCore.findBookingsForMarkNoShows(
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
        const bookings = await this.bookingCore.findBookingsForMarkNoShows(
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
        const bookings = await this.bookingCore.findBookingsForBulkUpdate(
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
        // e2e-bug.512 / §230 — third plan-building site, found by the wiring
        // assertion rather than by reading. This method returns
        // `AgentPlan | null`, so it cannot carry the guard's refusal message
        // the way the two `planOnly` branches can — the return-shape block D5
        // keeps running into. Returning `null` is still the right answer: no
        // plan beats a plan built over the wrong namesake's bookings, and the
        // executing path refuses with the message a moment later.
        if (
          this.bookingCore.providerNameGuard(
            'payment_sweep',
            params,
            catalog.employees,
          )
        ) {
          return null;
        }
        const rawBookings = await this.bookingCore.findUnpaidBookingsForSweep(
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
        // §235 — `AgentPlan | null` here, so no message is possible; `null` is
        // still the right answer, as §230 established for `payment_sweep`. No
        // plan beats a plan built over the wrong namesake, and the executing
        // path (§233) refuses with the reason immediately after.
        if (
          this.bookingCore.providerNameGuard(action, params, catalog.employees)
        ) {
          return null;
        }
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
    // §216 — the shared type, so the `locations` roster this object actually
    // carries (`e2e-bug.460`) is visible to the compiler at every hop rather
    // than surviving only by structural pass-through.
    catalog: BusinessCatalog,
    timeZone: string,
    _userId?: string,
  ): Promise<CommandResult | null> {
    params._timeZone = timeZone;
    const employeeId = params.employeeId as string | undefined;
    // tech-debt D5 — this dispatches the provider-scoped reads below, so a tie
    // lists the wrong namesake's bookings under a heading bearing their name.
    // An explicit id still wins outright, as on the other dashboard callers.
    const employeeVerdict =
      !employeeId && params.employeeName
        ? this.resolveNamedVerdict(
            catalog.employees,
            params.employeeName as string,
            'provider',
          )
        : null;
    if (employeeVerdict && employeeVerdict.ambiguous.length > 1) {
      return {
        success: false,
        action,
        summary: employeeVerdict.clarification,
        details: {
          params,
          candidates: employeeVerdict.ambiguous.map((e) => ({
            id: e.id,
            name: e.name,
          })),
        },
      };
    }
    const resolvedEmployee = employeeId
      ? catalog.employees.find((e) => e.id === employeeId)
      : (employeeVerdict?.match ?? undefined);

    switch (action) {
      case 'list_bookings':
      case 'show_appointments':
        return this.bookingCore.handleListBookings(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
          catalog.services,
        );
      case 'check_availability':
        return this.bookingCore.handleCheckAvailability(
          businessId,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
      case 'summarize_day':
        return this.bookingCore.handleSummarizeDay(
          businessId,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
      case 'summarize_bookings':
        return this.bookingCore.handleSummarizeBookings(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
      case 'analyze_appointments':
        return this.bookingCore.handleAnalyzeAppointments(
          businessId,
          effectivePrompt,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
      case 'analyze_services':
        return this.bookingCore.handleAnalyzeServices(
          businessId,
          effectivePrompt,
          params,
        );
      case 'summarize_staff':
        return this.bookingCore.handleSummarizeStaff(
          businessId,
          effectivePrompt,
          params,
          catalog.employees,
        );
      case 'lookup_customer':
        return this.bookingCore.handleLookupCustomer(
          businessId,
          params,
          catalog.customers,
        );
      case 'summarize_waitlist':
        return this.bookingCore.handleSummarizeWaitlist(businessId, params);
      case 'lookup_service_assignment':
        return this.bookingCore.handleLookupServiceAssignment(
          businessId,
          catalog.employees,
          catalog.services,
          params,
          effectivePrompt,
        );
      case 'list_services':
        return this.bookingCore.handleListServices(
          businessId,
          catalog.services,
          params,
          effectivePrompt,
        );
      case 'list_employees':
        return this.bookingCore.handleListEmployees(catalog.employees, params);
      case 'list_templates':
        return this.bookingCore.handleListTemplates(catalog.templates);
      case 'list_schedule_gaps':
        return this.scheduleHandlers.handleListScheduleGaps(
          businessId,
          effectivePrompt,
          params,
          catalog.employees,
        );
      case 'summarize_utilization':
        return this.bookingCore.handleSummarizeUtilization(
          businessId,
          effectivePrompt,
          params,
          catalog.employees,
        );
      case 'summarize_customers':
        return this.bookingCore.handleSummarizeCustomers(
          businessId,
          effectivePrompt,
          params,
        );
      default:
        return null;
    }
  }

  private async dispatchMutatingIntent(
    businessId: string,
    prompt: string,
    action: string,
    params: any,
    // §216 — the shared type, so the `locations` roster this object actually
    // carries (`e2e-bug.460`) is visible to the compiler at every hop rather
    // than surviving only by structural pass-through.
    catalog: BusinessCatalog,
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
          // e2e-bug.512 / §235 — the executing handler guards (§233); this
          // preview reached the plan builder directly. `dispatchMutatingIntent`
          // returns a `CommandResult`, so unlike the two sites below this one
          // can say *why*.
          const providerIssue = this.bookingCore.providerNameGuard(
            action,
            params,
            catalog.employees,
          );
          if (providerIssue) return providerIssue;
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
          // e2e-bug.512 / §234 — same shape as the sweep and visibility
          // previews: the executing handler guards, the preview reached the
          // plan builder directly and so previewed the wrong namesake's
          // schedule.
          const providerIssue = this.bookingCore.providerNameGuard(
            action,
            params,
            catalog.employees,
          );
          if (providerIssue) return providerIssue;
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
          const bookings = await this.bookingCore.findBookingsForCancel(
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
        result = await this.bookingCore.handleCancelBookings(
          businessId,
          prompt,
          params,
          catalog.services,
          catalog.employees,
          catalog.customers,
          employeeId,
          userId,
        );
        break;
      }
      case 'bulk_smart_cancel': {
        if (options?.planOnly) {
          const bookings = await this.bookingCore.findBookingsForCancel(
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
        result = await this.bookingCore.handleBulkSmartCancel(
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
          const fillResult = await this.bookingCore.handleFillSlotFromWaitlist(
            businessId,
            params,
            employeeId,
            userId,
          );
          return { ...fillResult, details: { plan: fillResult.details?.plan } };
        }
        result = await this.bookingCore.handleFillSlotFromWaitlist(
          businessId,
          params,
          employeeId,
          userId,
        );
        break;
      case 'hide_appointments_from_calendar': {
        if (options?.planOnly) {
          const bookings = await this.bookingCore.findBookingsForHide(
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
            this.bookingCore.resolveCalendarVisibilityStatusFilters(
              params,
              'hide',
            ) ?? [];
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
        result = await this.bookingCore.handleHideAppointmentsFromCalendar(
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
          // e2e-bug.512 / §230 — the executing handler guards this; the
          // plan-only preview reached the finder directly, so an ambiguous
          // provider name built a plan over the wrong namesake's bookings.
          const providerIssue = this.bookingCore.providerNameGuard(
            action,
            params,
            catalog.employees,
          );
          if (providerIssue) return providerIssue;
          const bookings =
            await this.bookingCore.findBookingsForCalendarVisibility(
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
          const statuses =
            this.bookingCore.resolveCalendarVisibilityStatusFilters(
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
        result = await this.bookingCore.handleUnhideAppointmentsFromCalendar(
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
          const bookings = await this.bookingCore.findBookingsForMarkNoShows(
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
        result = await this.bookingCore.handleMarkNoShows(
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
          // e2e-bug.512 / §230 — the executing handler guards this; the
          // plan-only preview reached the finder directly, so an ambiguous
          // provider name built a plan over the wrong namesake's bookings.
          const providerIssue = this.bookingCore.providerNameGuard(
            action,
            params,
            catalog.employees,
          );
          if (providerIssue) return providerIssue;
          const bookings = await this.bookingCore.findUnpaidBookingsForSweep(
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
        result = await this.bookingCore.handlePaymentSweep(
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
          const bookings = await this.bookingCore.findBookingsForBulkUpdate(
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
        result = await this.bookingCore.handleUpdateBookings(
          businessId,
          prompt,
          params,
          catalog.services,
          catalog.employees,
          catalog.customers,
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
        result = await this.bookingCore.handleDayReplan(
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

  private async resolveCreateServiceCategoryId(
    businessId: string,
    categoryName?: string,
  ): Promise<{ categoryId?: string; error?: CommandResult }> {
    const trimmed = categoryName?.trim();
    if (!trimmed) return {};
    const category = await this.catalog.resolveCategoryByName(
      businessId,
      trimmed,
    );
    if (!category) {
      return {
        error: {
          success: false,
          action: 'create_service',
          summary: `Service category "${trimmed}" not found. Create the category first or check the name.`,
          details: {
            clarify: true,
            missing: ['categoryName'],
            categoryName: trimmed,
          },
        },
      };
    }
    return { categoryId: category.id };
  }

  private async resolveCreateServiceLocalizedNamesForDraft(
    businessId: string,
    userId: string | undefined,
    draft: ParsedServiceDraft,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<LocalizedNamesMap | undefined> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
      select: { id: true, settings: true },
    });
    const enabledLocales = getBusinessEnabledLocales(business?.settings);
    return resolveCreateServiceLocalizedNames(this.openAi, {
      businessId,
      userId,
      serviceName: draft.name,
      enabledLocales,
      prompt,
      params,
    });
  }

  private async handleCreateService(
    businessId: string,
    params: any,
    services: Service[],
    userId?: string,
    prompt?: string,
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

    const categoryResolved = await this.resolveCreateServiceCategoryId(
      businessId,
      params.categoryName,
    );
    if (categoryResolved.error) return categoryResolved.error;

    const draft = parsed.draft;
    const existing = findServiceByExactName(services, draft.name);
    if (existing) {
      return {
        success: false,
        action: 'create_service',
        summary: `A service named "${draft.name}" already exists. Choose a different name or update the existing service in Services.`,
        details: {
          params,
          existingServiceId: existing.id,
          existingServiceName: existing.name,
        },
      };
    }

    const localizedNames =
      await this.resolveCreateServiceLocalizedNamesForDraft(
        businessId,
        userId,
        draft,
        params,
        prompt,
      );

    const plan = this.planBuilder.buildCreateServicePlan({
      businessId,
      ...draft,
      ...buildCreateServicePrepaymentFields(params, prompt, draft.price),
      localizedNames,
      categoryId: categoryResolved.categoryId,
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
    prompt?: string,
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

      const existing = findServiceByExactName(catalog, draft.name);
      if (existing) {
        skipped.push({
          name: draft.name,
          reason: `Already exists as "${existing.name}"`,
        });
        continue;
      }

      batchNames.add(key);
      toCreate.push({
        ...draft,
        ...buildCreateServicePrepaymentFields(raw ?? {}, prompt, draft.price),
      });
    }

    const categoryResolved = await this.resolveCreateServiceCategoryId(
      businessId,
      params.categoryName,
    );
    if (categoryResolved.error) {
      return {
        ...categoryResolved.error,
        action: 'create_services',
      };
    }

    if (toCreate.length === 0) {
      return {
        success: false,
        action: 'create_services',
        summary: `No services could be created. Skipped ${skipped.length}: ${skipped.map((s) => `${s.name} (${s.reason})`).join('; ')}.`,
        details: { params, skipped },
      };
    }

    const servicesWithTranslations = await Promise.all(
      toCreate.map(async (service) => ({
        ...service,
        categoryId: categoryResolved.categoryId,
        localizedNames: await this.resolveCreateServiceLocalizedNamesForDraft(
          businessId,
          userId,
          service,
          params,
          prompt,
        ),
      })),
    );

    const plan = this.planBuilder.buildCreateServicesPlan({
      businessId,
      services: servicesWithTranslations,
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
}
