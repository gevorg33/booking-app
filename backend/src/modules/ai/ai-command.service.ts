import { Injectable, Logger } from '@nestjs/common';
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
import { AiBookingDepthService } from './ai-booking-depth.service.js';
import { AiCatalogService } from './ai-catalog.service.js';
import { AiCustomerCrmService } from './ai-customer-crm.service.js';
import { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiRetailFinanceService } from './ai-retail-finance.service.js';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiReviewsService } from './ai-reviews.service.js';
import { AiTeamMembersService } from './ai-team-members.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import {
  filterSlotsByTimeOfDay,
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
} from './ai-orchestration.helpers.js';
import { isWallClockSlotBookable } from '../../common/utils/timezone.util.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { resolveAssignEmployeeServicesInput } from './ai-category-assignment.util.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { shouldValidateAction } from './command-completion.validator.js';
import { CommandResult } from './command-completion.types.js';
import { extractPipelineTraceId } from './ai-pipeline-trace.util.js';
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
import { AiEscalationHandoffService } from './ai-escalation-handoff.service.js';
import { AiPromptSecurityService } from './ai-prompt-security.service.js';
import {
  clampReadDateRangeDays,
  MAX_AI_CUSTOMER_ROWS,
  MAX_AI_LIST_BOOKINGS,
  MAX_AI_READ_DATE_RANGE_DAYS,
} from './ai-prompt-security.util.js';
import { isIntentAllowed, normalizeActorRole } from './ai-capability.matrix.js';
import type { CapabilityPlannerBounds } from './ai-capability-bounded-planner.util.js';
import {
  buildGoalCapabilityDeniedSummary,
  buildGoalExecutionPreviewDetails,
  decomposeGoalPrompt,
  isGoalExecutionPrompt,
  validateGoalStepsAgainstCapabilities,
} from './ai-goal-execution.util.js';
import {
  buildRoleCapabilityListingResult,
  tryRoleCapabilityListingEarlyReturn,
} from './ai-role-capability-listing.util.js';
import {
  attachMidPlanResumeSession,
  clearMidPlanClarifySession,
  isMidPlanClarifyResumeTurn,
  mergeMidPlanClarifyResume,
  readMidPlanClarifyState,
  wrapCompoundStepClarifyForMidPlan,
} from './ai-mid-plan-clarify.util.js';
import {
  buildPerStepPermissionDeniedCommandResult,
  findFirstDeniedStepAtExecute,
  resolvePlannerBoundsFromSession,
  validateStepPermissionAtExecute,
} from './ai-per-step-permission-recheck.util.js';
import {
  buildMultiStepExecutionPreviewGate,
  enrichMultiStepExecutionRollbackDetails,
} from './ai-plan-preview-rollback.util.js';
import {
  buildMultiStepBlastRadiusGate,
  enrichMultiStepSafetyDetails,
  resolveMultiStepGraduatedAutoExecute,
} from './ai-multi-step-safety.util.js';
import { applyEntityMemoryToParams } from './ai-entity-memory.util.js';
import {
  applyNoClarifyEnrichmentToParsed,
  enrichParamsForNoClarifyCompletion,
  resolveEntityMemoryForNoClarify,
  resolveRequestScreenContext,
} from './ai-n99-no-clarify-completion.util.js';
import {
  buildIntelligenceClassifierAppendix,
  extractIntelligenceBlocks,
  stripIntelligenceKeysFromSessionContext,
} from './ai-intelligence-context.util.js';
import { isDashboardAiIntentAllowedByPlan } from '../billing/plan-dashboard-ai-intents.util.js';
import type { PlanTierId } from '../billing/plan-limits.js';
import {
  isExecutionConfirmed,
} from './ai-execution-confirm.util.js';
import {
  buildExecutionVerificationGate,
  buildIntentTrafficFromCommandMetrics,
  buildIntentTrafficFromTraceAnalytics,
  buildProposeOnlyResult,
  readIntentTrafficFromContext,
  requiresProposeOnlyExecution,
  resolveGraduatedAutoExecute,
  resolveGraduationThresholdsFromContext,
} from './ai-execution-verification.util.js';
import { finalizeAutofillWatchdogResult } from './ai-n99-wrong-execution-watchdog.util.js';
import {
  buildAutoRollbackUserSummary,
  mergeAutoRollbackIntoResult,
  shouldAttemptAutoRollback,
} from './ai-post-exec-auto-rollback.util.js';
import { AgentTaskUndoService } from '../../engine/agent/agent-task-undo.service.js';
import { CHECK_AND_BOOK_CLASSIFIER_RULES } from './ai-check-and-book.fixtures.js';
import { CLINIC_TEST_ORDER_CLASSIFIER_RULES } from './ai-clinic-test-order.fixtures.js';
import { CLINIC_TEST_RESULT_CLASSIFIER_RULES } from './ai-clinic-test-result.fixtures.js';
import { CLINIC_PATIENT_CHART_CLASSIFIER_RULES } from './ai-clinic-patient-chart.fixtures.js';
import { DASHBOARD_PACKAGE_MULTI_CLASSIFIER_RULES } from './ai-package-multi-service.fixtures.js';
import { GIFT_CARD_PAYMENTS_CLASSIFIER_RULES } from './ai-gift-card-payments.fixtures.js';
import { DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES } from './ai-intent-disambiguation.fixtures.js';
import { buildDashboardClassifierSystemContent } from './ai-command-dashboard-classifier.util.js';
import { AiClassificationEngineService } from './ai-classification-engine.service.js';
import { readClassificationShortlistFromContext } from './ai-classification-shortlist.util.js';
import {
  buildHonestFailureClarify,
  buildSmartClarifySessionContext,
  mergeClarifyFollowUpPrompt,
  resolveSmartClarify,
} from './ai-smart-clarify.util.js';
import { applySelectedIntentFromSession } from './ai-intent-disambiguation-clarify.util.js';
import {
  readClarifyMemory,
  syncSessionContextFromClarifyMemory,
} from './ai-clarify-answer-reuse.util.js';
import {
  applyLosslessMergeToResolved,
  enrichSessionWithLosslessClarifyPartials,
  isClarifyFollowUpTurn,
  mergeLosslessClarifyFollowUp,
} from './ai-lossless-clarify-merge.util.js';
import { rejectInvalidClarifyFollowUpIfNeeded } from './ai-inline-clarify-validation.util.js';
import { resolveSomethingElseClarifyFollowUpIfNeeded } from './ai-something-else-clarify.util.js';
import {
  mergeCrossTurnClarifyParams,
  restoreOriginalIntentFromClarifySession,
} from './ai-clarify-cross-turn-merge.util.js';
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
    private reviews: AiReviewsService,
    private teamMembers: AiTeamMembersService,
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
    private classificationEngine: AiClassificationEngineService,
    private agentTaskUndo: AgentTaskUndoService,
    private escalationHandoff: AiEscalationHandoffService,
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
    const sessionContext = enrichSessionWithLosslessClarifyPartials(
      syncSessionContextFromClarifyMemory({
        ...session?.context,
        timeZone,
        _branchScope: scope,
        _businessType: businessType,
      }),
    );

    const inlineRejected = rejectInvalidClarifyFollowUpIfNeeded({
      prompt,
      sessionContext: sessionContext as Record<string, unknown>,
      timeZone,
      surface: 'dashboard',
    });
    if (inlineRejected) return inlineRejected;

    const somethingElseRouted = resolveSomethingElseClarifyFollowUpIfNeeded({
      prompt,
      sessionContext: sessionContext as Record<string, unknown>,
      surface: 'dashboard',
      shortlist: readClassificationShortlistFromContext(sessionContext),
    });
    if (somethingElseRouted) return somethingElseRouted;

    if (
      this.escalationHandoff.shouldExecute(prompt, sessionContext as Record<string, unknown>)
    ) {
      return this.escalationHandoff.execute({
        businessId,
        surface: 'dashboard',
        sessionContext: sessionContext as Record<string, unknown>,
        userId,
        prompt,
      });
    }

    const dashboardActorTier = normalizeActorRole(
      (sessionContext._accessTier as string | undefined) ??
        (sessionContext._actorRole as string | undefined) ??
        (sessionContext._membershipRole as string | undefined) ??
        'owner',
    );
    const capabilityEarly = tryRoleCapabilityListingEarlyReturn({
      prompt,
      surface: 'dashboard',
      accessTier: dashboardActorTier,
      planTierId:
        (sessionContext._planTierId as PlanTierId | undefined) ?? 'solo',
      isClarifyFollowUp: isClarifyFollowUpTurn(sessionContext),
    });
    if (capabilityEarly) return capabilityEarly;

    const effectivePrompt = mergeClarifyFollowUpPrompt(
      playbook ? playbook.prompt : prompt,
      sessionContext,
    );
    const promptNorm = await this.promptNormalization.normalizeForClassifier(
      businessId,
      userId,
      effectivePrompt,
    );
    const classifierPrompt = promptNorm.normalized;
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

    const engineBlock = session?.context?._classificationEngineBlock as
      | string
      | undefined;
    const contextWithEngine = engineBlock
      ? `${contextWithI18n}\n\n${engineBlock}`
      : contextWithI18n;

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
            contextWithEngine,
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

    const midPlanResult = await this.tryResumeMidPlanClarify(
      businessId,
      prompt,
      effectivePrompt,
      userId,
      sessionWithRoute,
      scopedCatalog,
      {
        low: aiConfig.confidence.low,
        high:
          (session?.context?._confidenceHigh as number | undefined) ??
          aiConfig.confidence.high,
      },
      timeZone,
    );
    if (midPlanResult) return midPlanResult;

    const goalResult = await this.tryExecuteGoalIntents(
      businessId,
      effectivePrompt,
      userId,
      sessionWithRoute,
      scopedCatalog,
      {
        low: aiConfig.confidence.low,
        high:
          (session?.context?._confidenceHigh as number | undefined) ??
          aiConfig.confidence.high,
      },
      timeZone,
    );
    if (goalResult) return goalResult;

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

    const sessionContext = {
      ...session?.context,
      timeZone,
      ...(session?.confirmed === true ? { confirmed: true } : {}),
    };
    await this.hydrateIntentTrafficContext(
      businessId,
      sessionContext as Record<string, unknown>,
    );
    await this.platform.hydrateAutofillWatchdogSession(
      businessId,
      sessionContext as Record<string, unknown>,
    );
    const traceId = extractPipelineTraceId(session?.context);

    const parsed = await resolveParsedIntent({
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
        const engineBlock = session?.context?._classificationEngineBlock as
          | string
          | undefined;
        const contextWithEngine = engineBlock
          ? `${contextWithI18n}\n\n${engineBlock}`
          : contextWithI18n;
        return this.classifyIntent(
          businessId,
          userId,
          norm.normalized,
          contextWithEngine,
          session?.history,
          sessionContext,
        );
      },
    });
    if (!parsed) {
      return {
        success: false,
        action: 'error',
        summary: 'Failed to understand the command. Please try rephrasing.',
        details: {},
      };
    }

    const enrichedClassification = await this.classificationEngine.enrichClassification({
      businessId,
      prompt: effectivePrompt,
      surface: 'dashboard',
      intent: parsed,
      deterministicRoute: session?.context?._complexityRoute as
        | ComplexityRoute
        | undefined,
      entityMemory: aiConfig.entityMemory,
      shortlist: readClassificationShortlistFromContext(session?.context),
      learnedRescueRules: aiConfig.accuracyProgram?.learnedRescueRules ?? [],
    });
    Object.assign(parsed, enrichedClassification.intent);
    parsed.params = enrichedClassification.intent.params;
    applySelectedIntentFromSession(parsed, sessionContext);
    const intentShortlist = readClassificationShortlistFromContext(sessionContext);
    restoreOriginalIntentFromClarifySession(parsed, sessionContext);
    parsed.params = mergeCrossTurnClarifyParams(parsed.params, sessionContext, {
      surface: 'dashboard',
    });

    if (isClarifyFollowUpTurn(sessionContext)) {
      const lossless = mergeLosslessClarifyFollowUp({
        followUpPrompt: effectivePrompt,
        followUpAnswers: readClarifyMemory(sessionContext),
        sessionContext,
        surface: 'dashboard',
        classifierAction: parsed.action,
        classifierParams: parsed.params,
      });
      parsed.action = lossless.restoredAction;
      parsed.params = lossless.mergedParams;
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

    const entityMemory = resolveEntityMemoryForNoClarify(
      aiConfig.entityMemory,
      sessionContext,
    );
    const noClarifyEnriched = enrichParamsForNoClarifyCompletion({
      prompt: effectivePrompt,
      action: parsed.action,
      params: parsed.params,
      surface: 'dashboard',
      sessionContext,
      screenContext: resolveRequestScreenContext(
        parsed.params.context as Record<string, unknown> | undefined,
        sessionContext,
      ),
      entityMemory,
      actionConfidence: parsed.confidence,
      fieldConfidence: parsed.params._fieldConfidence as
        | import('./ai-classification-engine.types.js').FieldLevelConfidence
        | undefined,
      fieldThreshold:
        typeof (sessionContext as Record<string, unknown>)._autoFillFieldThreshold ===
        'number'
          ? ((sessionContext as Record<string, unknown>)
              ._autoFillFieldThreshold as number)
          : undefined,
    });
    applyNoClarifyEnrichmentToParsed(parsed, noClarifyEnriched);

    const earlyClarify = resolveSmartClarify({
      prompt: effectivePrompt,
      surface: 'dashboard',
      action: parsed.action,
      params: parsed.params,
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
      fieldConfidence: parsed.params._fieldConfidence as
        | import('./ai-classification-engine.types.js').FieldLevelConfidence
        | undefined,
      sessionContext,
      entityMemory,
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
      services: services.map((s) => ({ id: s.id, name: s.name })),
      customers: customers.map((c) => ({ id: c.id, name: c.name })),
      phase: 'early',
      shortlist: intentShortlist,
      fieldThreshold: noClarifyEnriched.fieldThreshold,
    });
    if (earlyClarify) {
      earlyClarify.details = {
        ...earlyClarify.details,
        sessionContext: buildSmartClarifySessionContext(sessionContext, earlyClarify),
        pipelineTrace: [
          this.completionPipeline.trace(
            'classify',
            parsed.action,
            parsed.reasoning,
            traceId,
          ),
          this.completionPipeline.trace(
            'clarify',
            parsed.action,
            earlyClarify.details.clarifyKind ?? 'smart_clarify',
            traceId,
          ),
        ],
        traceId,
      };
      this.aiEvents.emitClarify(businessId, {
        action: parsed.action,
        summary: earlyClarify.summary,
        missing: earlyClarify.details.missing,
      });
      return earlyClarify;
    }

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
      surface: 'dashboard',
      learnedRescueRules: aiConfig.accuracyProgram?.learnedRescueRules ?? [],
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

    let resolved = this.completionPipeline.resolve(
      businessId,
      effectivePrompt,
      parsed,
      catalog,
      timeZone,
    );
    if (isClarifyFollowUpTurn(sessionContext)) {
      resolved = applyLosslessMergeToResolved(resolved, sessionContext, 'dashboard');
    }
    const pipelineTrace = [
      this.completionPipeline.trace(
        'classify',
        parsed.action,
        parsed.reasoning,
        traceId,
      ),
      this.completionPipeline.trace('resolve', parsed.action, undefined, traceId),
    ];

    const lateClarify = resolveSmartClarify({
      prompt: effectivePrompt,
      surface: 'dashboard',
      action: parsed.action,
      params: parsed.params,
      reasoning: parsed.reasoning,
      confidence,
      fieldConfidence: parsed.params._fieldConfidence as
        | import('./ai-classification-engine.types.js').FieldLevelConfidence
        | undefined,
      sessionContext,
      resolved: resolved,
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
      services: services.map((s) => ({ id: s.id, name: s.name })),
      customers: customers.map((c) => ({ id: c.id, name: c.name })),
      actionThreshold: aiConfig.confidence.low,
      phase: 'late',
      shortlist: intentShortlist,
    });
    if (lateClarify) {
      lateClarify.details = {
        ...lateClarify.details,
        sessionContext: buildSmartClarifySessionContext(sessionContext, lateClarify),
        pipelineTrace: [
          ...pipelineTrace,
          this.completionPipeline.trace(
            'clarify',
            parsed.action,
            lateClarify.details.clarifyKind ?? 'smart_clarify',
            traceId,
          ),
        ],
        traceId,
      };
      this.aiEvents.emitClarify(businessId, {
        action: parsed.action,
        summary: lateClarify.summary,
        missing: lateClarify.details.missing,
      });
      return lateClarify;
    }

    if (shouldValidateAction(parsed.action)) {
      const validation = this.completionPipeline.validate(resolved);
      pipelineTrace.push(
        this.completionPipeline.trace(
          'validate',
          parsed.action,
          validation.ok ? 'passed' : `${validation.issues.length} issue(s)`,
          traceId,
        ),
      );

      if (!validation.ok) {
        const clarify = this.completionPipeline.toClarifyResult(
          resolved,
          validation,
          sessionContext,
        );
        if (clarify) {
          clarify.details.pipelineTrace = pipelineTrace;
          this.aiEvents.emitClarify(businessId, {
            action: parsed.action,
            summary: clarify.summary,
            missing: clarify.details.missing,
          });
          return clarify;
        }
      }
    }

    const execVerification = buildExecutionVerificationGate({
      prompt: effectivePrompt,
      action: parsed.action,
      params: parsed.params,
      enrichedParams: resolved.enrichedParams,
      resolved,
      confidence,
      sessionContext,
      confirmed: isExecutionConfirmed(session),
      intentTraffic: (sessionContext as Record<string, unknown>)._intentTraffic as
        | Record<string, { samples: number; accurateRate: number }>
        | undefined,
    });
    if (execVerification) {
      const gateStage =
        execVerification.details.proposeOnly ||
        execVerification.details.planMismatch ||
        execVerification.details.planVsPromptFailed
          ? 'plan'
          : 'clarify';
      execVerification.details = {
        ...execVerification.details,
        ...(execVerification.details.needsClarification
          ? {
              sessionContext: buildSmartClarifySessionContext(
                sessionContext,
                execVerification,
              ),
            }
          : {}),
        pipelineTrace: [
          ...pipelineTrace,
          this.completionPipeline.trace(
            gateStage,
            parsed.action,
            String(
              execVerification.details.clarifySource ??
                execVerification.details.proposeOnly ??
                'execution_verification',
            ),
            traceId,
          ),
        ],
        traceId,
      };
      if (execVerification.details.needsClarification) {
        this.aiEvents.emitClarify(businessId, {
          action: parsed.action,
          summary: execVerification.summary,
          missing: execVerification.details.missing,
        });
      }
      return execVerification;
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
      const honestFailure = buildHonestFailureClarify({
        prompt: effectivePrompt,
        surface: 'dashboard',
        action: parsed.action,
        params: parsed.params,
        reasoning: parsed.reasoning,
        confidence,
        fieldConfidence: parsed.params._fieldConfidence as
          | import('./ai-classification-engine.types.js').FieldLevelConfidence
          | undefined,
        sessionContext,
        actionThreshold: aiConfig.confidence.low,
      });
      if (honestFailure) {
        honestFailure.details = {
          ...honestFailure.details,
          sessionContext: buildSmartClarifySessionContext(
            sessionContext,
            honestFailure,
          ),
          pipelineTrace,
          confidence,
          playbook: playbook?.name ?? null,
        };
        this.aiEvents.emitClarify(businessId, {
          action: parsed.action,
          summary: honestFailure.summary,
          missing: honestFailure.details.missing,
        });
        return honestFailure;
      }

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

    const params = resolved.enrichedParams;
    if (isExecutionConfirmed(session)) {
      params._executionConfirmed = true;
    }
    if ((sessionContext as Record<string, unknown>)._intentTraffic) {
      params._intentTraffic = (sessionContext as Record<string, unknown>)._intentTraffic;
    }
    if ((sessionContext as Record<string, unknown>)._confidenceHigh != null) {
      params._confidenceHigh = (sessionContext as Record<string, unknown>)._confidenceHigh;
    }

    if (
      parsed.action === 'bulk_create_catalog' &&
      !isExecutionConfirmed(session) &&
      requiresProposeOnlyExecution(
        parsed.action,
        readIntentTrafficFromContext(
          sessionContext as Record<string, unknown>,
          parsed.action,
        ),
        resolveGraduationThresholdsFromContext(
          sessionContext as Record<string, unknown>,
        ),
      )
    ) {
      const proposeOnly = buildProposeOnlyResult({
        prompt: effectivePrompt,
        action: parsed.action,
        params,
        reasoning: parsed.reasoning,
        traffic: readIntentTrafficFromContext(
          sessionContext as Record<string, unknown>,
          parsed.action,
        ),
        thresholds: resolveGraduationThresholdsFromContext(
          sessionContext as Record<string, unknown>,
        ),
      });
      proposeOnly.details = {
        ...proposeOnly.details,
        requiresExecutionConfirmation: true,
        pipelineTrace,
        traceId,
      };
      return proposeOnly;
    }

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
      case 'list_capabilities':
        result = buildRoleCapabilityListingResult({
          surface: 'dashboard',
          accessTier: actorTier,
          planTierId,
        });
        break;
      case 'list_reviews':
        result = await this.reviews.handleListReviews(businessId, params);
        break;
      case 'update_team_member_role':
        result = await this.teamMembers.handleUpdateTeamMemberRole(
          businessId,
          userId,
          params,
        );
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
        result = this.handleListServices(services, params, effectivePrompt);
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
        result = {
          success: false,
          action: 'unknown',
          summary: `I understood: "${parsed.reasoning}" but I don't know how to execute that action yet. Supported: book, add service(s), cancel, show appointments, optimize schedule, fill slots, resolve conflicts, reassign cancelled, check availability, summarize day.`,
          details: { parsed },
        };
    }

    result.details = {
      ...result.details,
      pipelineTrace: [
        ...pipelineTrace,
        this.completionPipeline.trace(
          'execute',
          parsed.action,
          result.success ? 'ok' : result.summary,
          traceId,
        ),
      ],
      confidence,
      playbook: playbook?.name ?? null,
    };
    result = finalizeAutofillWatchdogResult(parsed.action, params, result);
    if (
      !result.success &&
      result.details?.postExecAssertionFailed === true &&
      shouldAttemptAutoRollback(
        typeof result.details?.undoTaskId === 'string'
          ? result.details.undoTaskId
          : undefined,
      ) &&
      userId &&
      result.details?.autoRollbackAttempted !== true
    ) {
      const undoTaskId = String(result.details.undoTaskId);
      const rollback = await this.agentTaskUndo.attemptAutoRollbackByTaskId(
        undoTaskId,
        userId,
      );
      const mergedDetails = mergeAutoRollbackIntoResult(
        (result.details ?? {}) as Record<string, unknown>,
        rollback,
      );
      result = {
        ...result,
        summary: buildAutoRollbackUserSummary(
          {
            message:
              typeof result.details?.assertionMessage === 'string'
                ? result.details.assertionMessage
                : result.summary,
          },
          rollback,
        ),
        details: mergedDetails,
      };
    }
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
    const classificationEngineBlock =
      typeof sessionContext?._classificationEngineBlock === 'string'
        ? `\n${sessionContext._classificationEngineBlock}`
        : '';

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
        content: buildDashboardClassifierSystemContent({
          catalogContext: context,
          securityRules: this.promptSecurity.getClassifierSecurityRules(),
          intelligenceBlock: `${intelligenceBlock}${classificationEngineBlock}`,
          sessionBlock,
          routeHintBlock,
        }),
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

  private executeOrchestrationPlan(
    commandParams: Record<string, unknown>,
    planArgs: {
      plan: AgentPlan;
      businessId: string;
      userId?: string;
      autoExecute?: boolean;
    },
    plannerBounds?: CapabilityPlannerBounds,
  ): Promise<OrchestrationResult> {
    const graduationContext = {
      _intentTraffic: commandParams._intentTraffic,
      _confidenceHigh: commandParams._confidenceHigh,
    };
    const autoExecute = resolveGraduatedAutoExecute({
      action: planArgs.plan.intent,
      autoExecute: planArgs.autoExecute ?? false,
      context: graduationContext,
    });

    return this.orchestration.executePlan({
      ...planArgs,
      autoExecute,
      executionConfirmed: commandParams._executionConfirmed === true,
      intentTraffic: commandParams._intentTraffic as
        | Record<string, { samples: number; accurateRate: number }>
        | undefined,
      confidenceHigh:
        typeof commandParams._confidenceHigh === 'number'
          ? commandParams._confidenceHigh
          : undefined,
      plannerBounds,
    });
  }

  private async hydrateIntentTrafficContext(
    businessId: string,
    sessionContext: Record<string, unknown>,
  ): Promise<void> {
    if (sessionContext._intentTraffic) return;

    try {
      const analytics = await this.platform.getCommandAnalytics(businessId, 30);
      const traceByIntent = analytics.accuracy?.byIntent;
      sessionContext._intentTraffic = traceByIntent
        ? buildIntentTrafficFromTraceAnalytics(traceByIntent)
        : buildIntentTrafficFromCommandMetrics(analytics.byIntent);
    } catch {
      // Trace/metrics unavailable — propose-only intents stay conservative.
    }
  }

  // ─── Action handlers ────────────────────────────────────────────────────────

  private async handleCreateBooking(
    businessId: string,
    params: any,
    employees: Employee[],
    services: Service[],
    customers: Customer[],
    userId?: string,
  ): Promise<CommandResult> {
    const service =
      (params.serviceName
        ? this.resolveService(services, params.serviceName)
        : undefined) ??
      (params.serviceId
        ? services.find((s) => s.id === params.serviceId)
        : undefined);
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
      const timeZone = params._timeZone ?? 'UTC';
      const startIsoDay = params.date
        ? toIsoDay(params.date, timeZone)
        : toIsoDay(todayDisplay(timeZone), timeZone);
      const searchTargets = params.allProviders
        ? employees.filter((e) => e.isActive)
        : resolvedEmployee
          ? [resolvedEmployee]
          : [];

      if (searchTargets.length === 0) {
        return {
          success: false,
          action: 'create_booking',
          summary: params.allProviders
            ? 'No active providers found to search for availability.'
            : 'Specify a provider or say "any provider" for first-available booking.',
          details: { params },
        };
      }

      const notBeforeTime = resolveFirstAvailableNotBeforeTime(params);
      const pick = await this.findFirstAvailableBookingSlot(
        businessId,
        service,
        startIsoDay,
        searchTargets,
        timeZone,
        notBeforeTime,
      );

      if (!pick) {
        const afterLabel = notBeforeTime ? ` after ${notBeforeTime}` : '';
        return {
          success: false,
          action: 'create_booking',
          summary: `No upcoming open ${service.name} slots found${afterLabel}${
            params.allProviders
              ? ' for any provider'
              : ` for ${resolvedEmployee?.name ?? 'that provider'}`
          } in the next two weeks.`,
          details: {
            serviceName: service.name,
            allProviders: !!params.allProviders,
            timeFrom: params.timeFrom ?? null,
          },
        };
      }

      resolvedEmployee = pick.employee;
      timeSlot = this.snapTo10min(pick.timeSlot);
      params.date = pick.isoDay;
      params.employeeName = pick.employee.name;
      params.employeeId = pick.employee.id;
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
      await this.executeOrchestrationPlan(params, {
        plan,
        businessId,
        userId,
        autoExecute: true,
      }),
    );
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
      await this.executeOrchestrationPlan(params, {
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

    const statusFilter = params.statusFilter as string | undefined;
    const filtered = statusFilter
      ? bookings.filter((b) => b.status === statusFilter)
      : bookings;

    const now = new Date();
    const upcoming = filtered.filter(
      (b) =>
        b.startTime > now &&
        b.status !== BookingStatus.CANCELLED &&
        b.status !== BookingStatus.COMPLETED &&
        b.status !== BookingStatus.NO_SHOW,
    );
    const confirmed = filtered.filter(
      (b) => b.status === BookingStatus.CONFIRMED,
    );
    const pending = filtered.filter((b) => b.status === BookingStatus.PENDING);
    const completed = filtered.filter(
      (b) => b.status === BookingStatus.COMPLETED,
    );

    const active = filtered.filter((b) => b.status !== BookingStatus.CANCELLED);
    const cancelled = filtered.filter(
      (b) => b.status === BookingStatus.CANCELLED,
    );
    const noShows = filtered.filter((b) => b.status === BookingStatus.NO_SHOW);
    const unpaid = filtered.filter(
      (b) =>
        b.status !== BookingStatus.CANCELLED &&
        b.paymentStatus === PaymentStatus.PENDING,
    );

    const revenueBookings = active.filter(
      (b) =>
        b.status === BookingStatus.COMPLETED ||
        b.status === BookingStatus.CONFIRMED ||
        b.status === BookingStatus.IN_PROGRESS ||
        b.status === BookingStatus.PENDING,
    );
    const totalRevenue = revenueBookings.reduce(
      (sum, b) => sum + Number(b.service?.price ?? 0),
      0,
    );
    const currency =
      revenueBookings.find((b) => b.service?.currency)?.service?.currency ??
      'USD';

    const byProvider = new Map<string, number>();
    for (const booking of active) {
      const name = booking.employee?.name || 'Unknown';
      byProvider.set(name, (byProvider.get(name) ?? 0) + 1);
    }
    const busiest = [...byProvider.entries()].sort((a, b) => b[1] - a[1]);

    const rangeLabel =
      range.start === range.end
        ? formatDateDisplay(range.start)
        : `${formatDateDisplay(range.start)} → ${formatDateDisplay(range.end)}`;
    const scopeLabel = employeeName || 'all providers';
    const statusNote = statusFilter ? ` (${statusFilter} only)` : '';

    const metricTitles: Record<string, string> = {
      count: 'Appointment count',
      revenue: 'Revenue',
      busiest_provider: 'Busiest provider',
      cancelled: 'Cancelled appointments',
      no_shows: 'No-shows',
      unpaid: 'Unpaid appointments',
      upcoming: 'Upcoming appointments',
      confirmed: 'Confirmed appointments',
      pending: 'Pending appointments',
      completed: 'Completed appointments',
      overview: 'Booking overview',
    };

    const lines: string[] = [
      `${metricTitles[metric]} for ${scopeLabel} on ${rangeLabel}${statusNote}:`,
    ];

    switch (metric) {
      case 'count':
        lines.push(`• ${active.length} active appointment(s)`);
        if (!statusFilter) {
          lines.push(
            `• ${cancelled.length} cancelled · ${noShows.length} no-show(s)`,
          );
        }
        break;
      case 'revenue':
        lines.push(
          `• ${currency} ${totalRevenue.toFixed(2)} from ${revenueBookings.length} appointment(s)`,
        );
        break;
      case 'busiest_provider':
        if (busiest.length === 0) {
          lines.push('• No active appointments in this period.');
        } else {
          const [topName, topCount] = busiest[0];
          const tied = busiest.filter(([, c]) => c === topCount);
          lines.push(`• ${topName}: ${topCount} appointment(s)`);
          if (tied.length > 1) {
            lines.push(
              `• Tied with: ${tied
                .slice(1)
                .map(([n, c]) => `${n} (${c})`)
                .join(', ')}`,
            );
          }
          if (busiest.length > 1 && tied.length === 1) {
            lines.push('', 'All providers:');
            for (const [name, count] of busiest) {
              lines.push(`• ${name}: ${count}`);
            }
          }
        }
        break;
      case 'cancelled':
        lines.push(`• ${cancelled.length} cancelled appointment(s)`);
        break;
      case 'no_shows':
        lines.push(`• ${noShows.length} no-show(s)`);
        break;
      case 'unpaid':
        lines.push(`• ${unpaid.length} unpaid appointment(s)`);
        break;
      case 'upcoming':
        lines.push(`• ${upcoming.length} upcoming appointment(s)`);
        break;
      case 'confirmed':
        lines.push(`• ${confirmed.length} confirmed appointment(s)`);
        break;
      case 'pending':
        lines.push(`• ${pending.length} pending appointment(s)`);
        break;
      case 'completed':
        lines.push(`• ${completed.length} completed appointment(s)`);
        break;
      case 'overview':
        lines.push(
          `• ${active.length} active · ${cancelled.length} cancelled · ${noShows.length} no-show(s)`,
          `• Revenue: ${currency} ${totalRevenue.toFixed(2)} · ${unpaid.length} unpaid`,
        );
        if (busiest.length > 0) {
          lines.push(`• Busiest: ${busiest[0][0]} (${busiest[0][1]} appt(s))`);
        }
        break;
    }

    return {
      success: true,
      action: 'summarize_bookings',
      summary: lines.join('\n'),
      details: {
        bookingMetric: metric,
        date: range.start === range.end ? formatDateDisplay(range.start) : null,
        range,
        scope: employeeId ? 'provider' : 'all_providers',
        employee: employeeName ?? null,
        counts: {
          total: filtered.length,
          active: active.length,
          cancelled: cancelled.length,
          noShows: noShows.length,
          unpaid: unpaid.length,
          upcoming: upcoming.length,
          confirmed: confirmed.length,
          pending: pending.length,
          completed: completed.length,
        },
        revenue: { total: totalRevenue, currency },
        busiestProvider:
          busiest.length > 0
            ? { name: busiest[0][0], count: busiest[0][1] }
            : null,
        byProvider: Object.fromEntries(busiest),
      },
    };
  }

  private handleListServices(
    services: Service[],
    params: Record<string, any>,
    _prompt: string,
  ): CommandResult {
    const target = params.serviceName
      ? this.resolveService(services, String(params.serviceName))
      : undefined;

    if (target) {
      const currency = target.currency || 'USD';
      return {
        success: true,
        action: 'list_services',
        summary: [
          `${target.name}:`,
          `• Duration: ${target.durationMinutes} min${target.bufferMinutes ? ` (+${target.bufferMinutes} min buffer)` : ''}`,
          `• Price: ${currency} ${Number(target.price).toFixed(2)}`,
          target.description ? `• ${target.description}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        details: {
          services: [
            {
              id: target.id,
              name: target.name,
              durationMinutes: target.durationMinutes,
              bufferMinutes: target.bufferMinutes,
              price: Number(target.price),
              currency,
              description: target.description,
            },
          ],
        },
      };
    }

    if (services.length === 0) {
      return {
        success: true,
        action: 'list_services',
        summary:
          'No services in catalog yet. Add one with "Add service facemassage 60min $50".',
        details: { services: [] },
      };
    }

    const lines = services.map(
      (s) =>
        `• ${s.name} — ${s.durationMinutes} min · ${s.currency || 'USD'} ${Number(s.price).toFixed(2)}`,
    );

    return {
      success: true,
      action: 'list_services',
      summary: [`Service catalog (${services.length}):`, ...lines].join('\n'),
      details: {
        services: services.map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: Number(s.price),
          currency: s.currency || 'USD',
        })),
      },
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
  ): Promise<CommandResult> {
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

    const serviceName = params.serviceName as string | undefined;
    if (!serviceName) {
      return {
        success: false,
        action: 'lookup_service_assignment',
        summary: 'Which service should I look up? Mention the service name.',
        details: {},
      };
    }

    const service = this.resolveService(services, serviceName);
    if (!service) {
      return {
        success: false,
        action: 'lookup_service_assignment',
        summary: `No service found matching "${serviceName}".`,
        details: {},
      };
    }

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
        `Providers scheduled for ${service.name} on ${displayDay} with open time (${availableProviders.length}):`,
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
      `Providers who can perform ${service.name} (${providers.length}):`,
      ...providers.map((p) => `• ${p.name}`),
    ];
    return {
      success: true,
      action: 'lookup_service_assignment',
      summary: lines.join('\n'),
      details: {
        serviceName: service.name,
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
      await this.executeOrchestrationPlan(params, {
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
      await this.executeOrchestrationPlan(params, {
        plan,
        businessId,
        userId,
        autoExecute: true,
      }),
    );
  }

  private resolvePlannerBounds(
    session?: CommandSessionOptions,
  ): CapabilityPlannerBounds {
    return resolvePlannerBoundsFromSession(session?.context, 'dashboard');
  }

  /** parity-3.3 — resume goal/compound plan after mid-plan acc-4 clarify. */
  private async tryResumeMidPlanClarify(
    businessId: string,
    prompt: string,
    effectivePrompt: string,
    userId: string | undefined,
    session: CommandSessionOptions | undefined,
    catalog: {
      employees: Employee[];
      services: Service[];
      customers: Customer[];
      templates: ScheduleTemplate[];
    },
    confidenceThresholds: { low: number; high: number },
    timeZone: string,
  ): Promise<CommandResult | null> {
    const midPlan = readMidPlanClarifyState(session?.context);
    if (!midPlan || !isMidPlanClarifyResumeTurn(session?.context)) {
      return null;
    }

    const resumeSession: CommandSessionOptions = {
      ...session,
      context: attachMidPlanResumeSession(session?.context, prompt),
    };
    const merged = mergeMidPlanClarifyResume({
      state: midPlan,
      followUpPrompt: prompt,
      sessionContext: resumeSession.context,
    });
    if (!merged.readyToResume) return null;

    const bounds = this.resolvePlannerBounds(resumeSession);
    const denied = findFirstDeniedStepAtExecute(merged.steps, bounds);
    if (denied) {
      return buildPerStepPermissionDeniedCommandResult({
        parentAction: merged.parentAction,
        deniedAction: denied.action,
        stepIndex: denied.stepIndex,
        totalSteps: merged.steps.length,
        bounds,
      });
    }

    const result = await this.executeCompoundIntents(
      businessId,
      merged.originalPrompt || effectivePrompt,
      userId,
      resumeSession,
      merged.steps,
      catalog,
      confidenceThresholds,
      timeZone,
      merged.goalDetails,
    );
    result.action = merged.parentAction;
    if (result.success) {
      result.details = {
        ...result.details,
        midPlanClarifyResumed: true,
        sessionContext: clearMidPlanClarifySession(
          result.details.sessionContext as Record<string, unknown> | undefined,
        ),
      };
    }
    return result;
  }

  /** parity-3.2 — multi-step goal execution under one preview/confirm. */
  private async tryExecuteGoalIntents(
    businessId: string,
    prompt: string,
    userId: string | undefined,
    session: CommandSessionOptions | undefined,
    catalog: {
      employees: Employee[];
      services: Service[];
      customers: Customer[];
      templates: ScheduleTemplate[];
    },
    confidenceThresholds: { low: number; high: number },
    timeZone: string,
  ): Promise<CommandResult | null> {
    if (!isGoalExecutionPrompt(prompt, 'dashboard')) return null;

    const bounds = this.resolvePlannerBounds(session);
    const goal = decomposeGoalPrompt(prompt, 'dashboard');
    if (!goal || goal.steps.length < 2) return null;

    const validation = validateGoalStepsAgainstCapabilities(goal.steps, bounds);
    if (!validation.ok) {
      return {
        success: false,
        action: 'goal_execution',
        summary: buildGoalCapabilityDeniedSummary(validation.outOfScope),
        details: {
          goalExecution: true,
          goalRecipeId: goal.recipeId,
          capabilityBoundedPlannerFailed: validation.outOfScope.length > 0,
          outOfScopeActions: validation.outOfScope,
          plannerBounds: bounds,
          requiresExecutionConfirmation: false,
          pipelineStage: 'plan',
        },
      };
    }

    recordMisrouteTelemetry(this.aiEvents, businessId, {
      surface: 'dashboard',
      prompt,
      classifierAction: 'goal_execution',
      rescuedAction: 'goal_execution',
      rescueReason: 'goal_decomposition',
      compoundStepCount: validation.steps.length,
    });

    const result = await this.executeCompoundIntents(
      businessId,
      prompt,
      userId,
      session,
      validation.steps,
      catalog,
      confidenceThresholds,
      timeZone,
      buildGoalExecutionPreviewDetails({ ...goal, steps: validation.steps }),
    );
    result.action = 'goal_execution';
    return result;
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
    goalDetails?: Record<string, unknown>,
  ): Promise<CommandResult> {
    const traceId = extractPipelineTraceId(session?.context);
    const plans: AgentPlan[] = [];
    const pipelineTrace = [
      this.completionPipeline.trace(
        'classify',
        'compound_intent',
        `${subIntents.length} sub-intent(s)`,
        traceId,
      ),
    ];

    let pendingCancelBookingIds: string[] | undefined;
    const parentAction: 'goal_execution' | 'compound_intent' =
      goalDetails?.goalExecution === true ? 'goal_execution' : 'compound_intent';
    const plannerBounds = this.resolvePlannerBounds(session);

    for (let stepIndex = 0; stepIndex < subIntents.length; stepIndex++) {
      const sub = subIntents[stepIndex];
      const stepPermission = validateStepPermissionAtExecute(
        sub.action,
        plannerBounds,
      );
      if (!stepPermission.ok) {
        return buildPerStepPermissionDeniedCommandResult({
          parentAction,
          deniedAction: stepPermission.deniedAction,
          stepIndex,
          totalSteps: subIntents.length,
          bounds: plannerBounds,
          pipelineTrace,
        });
      }
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
      pipelineTrace.push(
        this.completionPipeline.trace(
          'resolve',
          parsed.action,
          sub.reasoning,
          traceId,
        ),
      );

      if (shouldValidateAction(parsed.action)) {
        const validation = this.completionPipeline.validate(resolved);
        pipelineTrace.push(
          this.completionPipeline.trace(
            'validate',
            parsed.action,
            validation.ok ? 'passed' : `${validation.issues.length} issue(s)`,
            traceId,
          ),
        );
        if (!validation.ok) {
          const clarify = this.completionPipeline.toClarifyResult(
            resolved,
            validation,
            { ...session?.context, timeZone },
          );
          if (clarify) {
            clarify.details.pipelineTrace = pipelineTrace;
            return wrapCompoundStepClarifyForMidPlan(clarify, {
              parentAction,
              originalPrompt: prompt,
              steps: subIntents,
              currentStepIndex: stepIndex,
              pausedParams: resolved.enrichedParams,
              sessionContext: { ...session?.context, timeZone },
              goalDetails,
            });
          }
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

    const blastRadiusGate = buildMultiStepBlastRadiusGate({
      parentAction,
      prompt,
      subIntents,
      mergedPlan: merged,
      session,
      pipelineTrace,
    });
    if (blastRadiusGate) {
      return blastRadiusGate;
    }

    const previewGate = buildMultiStepExecutionPreviewGate({
      parentAction,
      prompt,
      subIntents,
      mergedAgentSteps: merged.steps,
      confirmed: isExecutionConfirmed(session),
      pipelineTrace,
      goalDetails,
    });
    if (previewGate) {
      return {
        ...previewGate,
        details: enrichMultiStepSafetyDetails(previewGate.details, {
          subIntents,
          mergedPlan: merged,
          parentAction,
          sessionContext: session?.context,
          autoExecuteRequested: resolveAutoExecute({
            action: 'compound_intent',
            stepCount: merged.steps.length,
            providerCount,
            confidence: 0.9,
            thresholds: confidenceThresholds,
          }),
        }),
      };
    }

    const baseAutoExecute = resolveAutoExecute({
      action: 'compound_intent',
      stepCount: merged.steps.length,
      providerCount,
      confidence: 0.9,
      thresholds: confidenceThresholds,
    });
    const autoExecute = resolveMultiStepGraduatedAutoExecute({
      parentAction,
      subIntents,
      autoExecute: baseAutoExecute,
      context: session?.context,
    });

    const result = this.toCommandResult(
      await this.executeOrchestrationPlan(
        { _executionConfirmed: isExecutionConfirmed(session) },
        {
        plan: merged,
        businessId,
        userId,
        autoExecute,
        },
        plannerBounds,
      ),
    );

    result.details = enrichMultiStepSafetyDetails(
      enrichMultiStepExecutionRollbackDetails(
        {
          ...result.details,
          pipelineTrace: [
            ...pipelineTrace,
            this.completionPipeline.trace(
              'execute',
              parentAction,
              result.success ? 'ok' : result.summary,
              traceId,
            ),
          ],
          subIntents: subIntents.map((s) => s.action),
          decomposed: true,
          ...(goalDetails ?? {}),
          sessionContext: clearMidPlanClarifySession(
            result.details.sessionContext as Record<string, unknown> | undefined ??
              session?.context,
          ),
        },
        {
          taskId:
            typeof result.details?.taskId === 'string'
              ? result.details.taskId
              : undefined,
          mergedAgentSteps: merged.steps,
        },
      ),
      {
        subIntents,
        mergedPlan: merged,
        parentAction,
        sessionContext: session?.context,
        autoExecuteRequested: baseAutoExecute,
        planApproved: isExecutionConfirmed(session),
      },
    );
    if (goalDetails?.goalExecution) {
      result.action = 'goal_execution';
    }
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
        );
      case 'list_services':
        return this.handleListServices(
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
  ): Promise<AgentPlan | null> {
    const service =
      (params.serviceName
        ? this.resolveService(services, params.serviceName)
        : undefined) ??
      (params.serviceId
        ? services.find((s) => s.id === params.serviceId)
        : undefined);
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
      const timeZone = params._timeZone ?? 'UTC';
      const startIsoDay = params.date
        ? toIsoDay(params.date, timeZone)
        : toIsoDay(todayDisplay(timeZone), timeZone);
      const searchTargets = params.allProviders
        ? employees.filter((e) => e.isActive)
        : resolvedEmployee
          ? [resolvedEmployee]
          : [];
      if (searchTargets.length === 0) return null;

      const pick = await this.findFirstAvailableBookingSlot(
        businessId,
        service,
        startIsoDay,
        searchTargets,
        timeZone,
        resolveFirstAvailableNotBeforeTime(params),
      );
      if (!pick) return null;
      resolvedEmployee = pick.employee;
      timeSlot = this.snapTo10min(pick.timeSlot);
      params.date = pick.isoDay;
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
      await this.executeOrchestrationPlan(params, {
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

    const orch = await this.executeOrchestrationPlan(params, {
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
      await this.executeOrchestrationPlan(params, {
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
      await this.executeOrchestrationPlan(params, {
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
      await this.executeOrchestrationPlan(params, {
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
      await this.executeOrchestrationPlan(params, {
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
      await this.executeOrchestrationPlan(params, {
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

    const orchResult = await this.executeOrchestrationPlan(params, {
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
      await this.executeOrchestrationPlan(params, {
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
  ): Promise<CommandResult> {
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
      await this.executeOrchestrationPlan(params, {
        plan,
        businessId,
        userId,
        autoExecute: true,
      }),
    );
  }
}
