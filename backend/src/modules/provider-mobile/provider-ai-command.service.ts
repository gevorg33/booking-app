import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { BookingService } from '../booking/booking.service.js';
import { LlmService } from '../../engine/agent/llm.service.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import type { MobileAccess } from './provider-mobile-access.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  todayDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import { ProviderAiConfirmDto } from './dto/provider-ai-command.dto.js';
import { CommandCompletionPipelineService } from '../ai/command-completion.pipeline.service.js';
import {
  shouldValidateProviderAction,
  validateProviderCommand,
} from '../ai/provider-command-completion.validator.js';
import { AiEventsService } from '../ai/ai-events.service.js';
import { recordMisrouteTelemetry } from '../ai/ai-misroute-telemetry.util.js';
import { AiPromptSecurityService } from '../ai/ai-prompt-security.service.js';
import { AiSettingsService } from '../ai/ai-settings.service.js';
import { AiPromptNormalizationService } from '../ai/ai-prompt-normalization.service.js';
import { ProviderCommandUnderstandingAdapter } from '../ai/provider-command-understanding.adapter.js';
import { buildNarrowClassifierSchema } from '../ai/narrow-reclassify-schema.util.js';
import {
  buildPipelineClarifyCommandResult,
  buildUnknownIntentClarifyResult,
  shouldBlockUnknownFromHandlerSwitch,
} from '../ai/ai-unknown-intent.util.js';
import {
  findClassifierCandidate,
  pipelineRescueReason,
  pipelineResultToClassifiedIntent,
} from '../ai/command-understanding-result.util.js';
import { AiScheduleHandlersService } from '../ai/ai-schedule-handlers.service.js';
import { isIntentAllowed } from '../ai/ai-capability.matrix.js';
import {
  resolveAccessTier,
  type AccessTier,
} from '../ai/access-control.matrix.js';
import { CommandOrchestrationService } from '../ai/command-orchestration.service.js';
import { OperationalPlanBuilderService } from '../ai/operational-plan-builder.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
import { resolveDateRange } from '../ai/ai-orchestration.helpers.js';
import { rescueProviderAiIntent } from './provider-ai-intent.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import {
  buildAfternoonAvailabilityResult,
  buildGapsAvailabilityResult,
  buildNoLinkedEmployeeAvailabilityResult,
  buildProviderBookingsListResult,
  buildSlotAvailabilityResult,
  buildUtilizationSummaryResult,
  defaultUtilizationWeekRange,
  filterBookingsForProviderList,
  mapScheduleGapLabels,
  mergeShowAppointmentsParams,
  prepareBlockScheduleParams,
  resolveAvailabilityDayBounds,
  resolveAvailabilityTimeWindow,
  resolveStatusFilter,
  shouldUseAfternoonAvailability,
} from './provider-ai-sprint19.util.js';
import {
  buildTeamWhosNextSummary,
} from './provider-team-whos-next.util.js';
import {
  applyProviderEntityMemory,
  buildCoordinateWaitlistConfirmation,
  formatProviderHistoryBlock,
  matchEmployeeByName,
  matchWaitlistCustomerByName,
  rescueCoordinationIntent,
} from './provider-ai-sprint22.util.js';
import {
  buildCoordinationDeniedSummary,
  canRunCoordinationOnProvider,
} from '../ai/ai-coordination.util.js';
import { AiPushNotificationsService } from '../ai/ai-push-notifications.service.js';
import { AiProviderBookingService } from '../ai/ai-provider-booking.service.js';
import { AiBusinessCurrencyService } from '../ai/ai-business-currency.service.js';
import { AiBusinessDateFormatService } from '../ai/ai-business-date-format.service.js';
import { AiBusinessTaxService } from '../ai/ai-business-tax.service.js';
import { AiBusinessComplianceService } from '../ai/ai-business-compliance.service.js';
import {
  parseExplainAppointmentTaxFromPrompt,
} from '../ai/ai-appointment-tax.util.js';
import { AiProviderClinicCollectionService } from '../ai/ai-provider-clinic-collection.service.js';
import { AiClinicLabBookingService } from '../ai/ai-clinic-lab-booking.service.js';
import { PROVIDER_MOBILE_CLASSIFIER_RULES } from '../ai/ai-provider-mobile.fixtures.js';
import {
  applyProviderMobilePromptHints,
  decomposeProviderMobileCompoundPrompt,
  disambiguateProviderMobileAction,
  isProviderMobileCompoundPrompt,
  mergeProviderMobileHintsIntoSessionContext,
} from '../ai/ai-provider-mobile-hints.util.js';
import { ProviderPushActionService } from './provider-push-action.service.js';
import { AiProviderPushSetupService } from '../ai/ai-provider-push-setup.service.js';
import { AiProviderEarningsService } from '../ai/ai-provider-earnings.service.js';
import { AiProviderClientContextService } from '../ai/ai-provider-client-context.service.js';
import { AiProviderExp2Service } from '../ai/ai-provider-exp-2.service.js';
import { AiProviderTimeOffService } from '../ai/ai-provider-time-off.service.js';
import { AiProviderOpenShiftsService } from '../ai/ai-provider-open-shifts.service.js';
import { AiProviderExp3Service } from '../ai/ai-provider-exp-3.service.js';

export interface ProviderPreviewItem {
  id: string;
  customerName: string;
  serviceName: string;
  time: string;
  initials: string;
}

export interface ProviderCommandResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, unknown>;
}

const BULK_CONFIRM_THRESHOLD = 2;

const PROVIDER_INTENT_SCHEMA = `You are an AI assistant for a service provider mobile app.
Classify the user's command and extract parameters. Return JSON:

{
  "action": "cancel_bookings" | "update_bookings" | "mark_no_shows" | "payment_sweep" | "list_bookings" | "show_appointments" | "team_whos_next" | "my_stats" | "team_floor_status" | "check_in_client" | "mark_running_late" | "summarize_day" | "summarize_my_appointments" | "summarize_my_revenue" | "summarize_client" | "show_client_history" | "add_client_note" | "reschedule_booking" | "add_retail_to_booking" | "send_client_message" | "block_my_time" | "fill_unused_slots" | "suggest_waitlist_for_gap" | "check_availability" | "block_schedule" | "request_time_off" | "list_my_time_off_requests" | "summarize_utilization" | "coordinate_waitlist_offer" | "list_package_appointments_today" | "list_my_package_visits" | "list_my_multi_service_groups" | "mark_paid" | "list_my_collection_queue" | "mark_specimen_collected" | "list_patient_pending_lab_requests" | "confirm_booking_from_push" | "suggest_reschedule_from_push" | "explain_last_push" | "open_booking_from_push" | "offline_queue_status" | "retry_offline_action" | "dismiss_push" | "end_of_day_summary" | "new_booking_push_actions" | "explain_push_setup" | "enable_push_notifications" | "explain_appointment_tax" | "explain_provider_payment_currency" | "explain_provider_date_display" | "configure_provider_push_date_format" | "explain_provider_session_timeout" | "unknown",
  "params": {
    "bookingId": "string or null — specific booking reference",
    "customerName": "string or null — client/customer name mentioned (e.g. John)",
    "waitlistCustomerName": "string or null — waitlist customer to offer freed slot (e.g. John)",
    "employeeName": "string or null — provider name for team coordination (e.g. Maria)",
    "serviceName": "string or null — service type filter",
    "date": "DD/MM/YYYY or null — resolve relative dates from today",
    "dateFrom": "DD/MM/YYYY or null",
    "dateTo": "DD/MM/YYYY or null",
    "timeSlot": "HH:MM 24h or null — appointment start time (e.g. 13:00)",
    "timeFrom": "HH:MM or null — gap fill window start",
    "timeTo": "HH:MM or null — gap fill window end",
    "status": "completed | in_progress | no_show | confirmed | pending | null — filter for show_appointments / list_bookings",
    "statusFilter": "upcoming | completed | cancelled | no_show | null — for show_appointments",
    "paymentStatus": "paid | pending | refunded | not_applicable | null",
    "reason": "string or null — cancellation reason or note",
    "clientNote": "string or null — internal staff note body for add_client_note",
    "period": "week | month | null — for my_stats",
    "scope": "mine | team | null — for my_stats (team requires manager)",
    "minutesLate": "number or null — minutes late for mark_running_late (default 10)",
    "allAppointments": true or false — true when user says all/every appointment for the day
  },
  "reasoning": "one sentence"
}

Rules:
- If the user is a business owner, admin, or manager (see context), they may manage any provider's appointments.
- If the user is a provider only, scope commands to their own appointments.
- "my appointments", "all my today", "cancel my schedule" → allAppointments=true, date=today.
- "mark as done" / "done" → status=completed. "no show" → no_show. "in progress" → in_progress.
- "payment done" / "paid" / "mark payment as paid" → paymentStatus=paid. "N/A" → not_applicable.
- cancel_bookings: user wants to cancel one or more appointments. Put sickness/reason in reason.
- update_bookings: change status and/or payment status without cancelling (single appointment or explicit customer/time).
- mark_no_shows: bulk mark past missed appointments as no-show for a day or range. Use for "mark no-shows", "no shows today".
- payment_sweep: mark unpaid appointments as paid for a day or range. Use for "payment sweep", "mark unpaid as paid".
- list_bookings / show_appointments / summarize_day: view-only; no mutations. show_appointments supports serviceName and status/statusFilter.
- team_whos_next: READ — manager/owner team view only: ordered queue per provider for the next 2 hours. Triggers: who's next across the team, all providers next 2 hours. NOT show_appointments (own or single-day list).
- summarize_my_appointments: READ — count own appointments for today/tomorrow/a day/date range. Triggers: how many appointments do I have. NOT show_appointments (full list).
- summarize_my_revenue: READ — net provider earnings after tax and salon commission for a period. Triggers: how much did I make, my revenue last week. NOT explain_appointment_tax.
- summarize_client: READ — client snapshot for open booking: loyalty balance with last earn/redeem (read-only), visits, last visit, no-shows, referral, badges, recent highlights. Requires bookingId (session) and/or customerName. NOT show_client_history (visit list only), NOT adjust_loyalty.
- show_client_history: READ — recent completed visits for the booking's client. Requires bookingId and/or customerName. NOT summarize_client (narrative snapshot).
- add_client_note: MUTATE — save internal staff note on booking customer (clientNote body, max 500 chars). Requires bookingId and/or customerName. NOT update_bookings.
- check_availability: READ-ONLY — open slots and schedule blocks for own calendar (managers may query team when scoped).
- add_retail_to_booking: MUTATE — add retail product line to own active booking (productName, bookingId, and/or customerName). NOT suggest_retail_upsell (read-only suggestions).
- send_client_message: READ — open SMS/WhatsApp with canned template for booking client (templateId, channel=sms|whatsapp). NOT add_client_note (internal note).
- block_my_time: MUTATE — instant lunch/break block on own calendar (date, timeFrom/timeTo). NOT request_time_off (needs approval).
- block_schedule: block lunch/break on own calendar only for providers; managers may block team when allowed.
- request_time_off: submit unavailable date range for manager approval (own calendar). NOT block_schedule (instant block).
- list_my_time_off_requests: READ — status of own pending/approved/denied time-off requests.
- summarize_utilization: READ-ONLY utilization % for date range — own stats for providers; team summary for managers.
- reschedule_booking: move an appointment to a new time (own bookings only unless team view).
- fill_unused_slots: fill schedule gaps for own calendar (team view: all providers).
- suggest_waitlist_for_gap: READ — suggest waitlist customers for a specific open gap on own calendar (date + timeFrom/timeTo). Triggers: fill this gap, waitlist for this slot. NOT fill_unused_slots (creates blocks) and NOT coordinate_waitlist_offer (manager cancel flow).
- coordinate_waitlist_offer: manager team view — cancel provider appointment and offer slot to waitlist customer (e.g. "If Maria cancels, offer slot to waitlist customer John").
- list_package_appointments_today: READ-ONLY — provider-scoped package appointments on own calendar today. NOT list_package_bookings (dashboard admin).
- list_my_package_visits: READ-ONLY — provider-scoped package visits on own calendar for a date range.
- list_my_multi_service_groups: READ-ONLY — provider-scoped multi-service groups/blocks on own calendar.
- mark_paid: mark a single booking paid (own calendar unless manager team view). NOT payment_sweep (bulk). Set bookingId when known.
- explain_appointment_tax: READ — tax lines on appointment payment breakdown: inclusive vs exclusive model, per-rule amounts, and amount collected when marked paid. Optional bookingId. NOT explain_provider_payment_currency (ISO currency symbol) and NOT lookup_booking_tax_metadata (support metadata dump).
- explain_provider_payment_currency: READ — why appointment payment breakdown or POS grand total shows € / ֏ / ₽ / $ (business default vs legacy service code vs retail add-on). NOT explain_payment_status (paid/pending status) and NOT explain_appointment_tax (tax lines).
- explain_provider_date_display: READ — how provider schedule/booking cards format dates and times from auth business dateFormat/timeFormat (fmt-1.8). NOT explain_provider_payment_currency (currency) and NOT explain_last_push (push actions).
- configure_provider_push_date_format: MUTATE — wire FCM push booking times to business timeFormat when fmt-1.8 push bodies ship (confirmation required). NOT explain_provider_date_display (read-only).
- explain_provider_session_timeout: READ — clinic only: when provider mobile app auto-logs out after HIPAA inactivity timeout (compliance-1.13 provider deferred). NOT explain_provider_date_display (date formatting) and NOT dashboard explain_hipaa_session_timeout.
- list_my_collection_queue: READ — clinic only: own specimen collection worklist (draws/recollects) for today or a date. NOT list_bookings (appointments) and NOT dashboard list_test_orders.
- mark_specimen_collected: MUTATE — clinic only: mark a specimen Collected for an assigned visit. Requires customerName or specimenId or orderId. NOT mark_paid (payment) and NOT enter_test_result (dashboard).
- confirm_booking_from_push: confirm one booking — same as Confirm on a new-booking push. Requires bookingId (inherit from lastPush).
- suggest_reschedule_from_push: open AI to reschedule — same as Reschedule on a new-booking push (guidance only, no slot move).
- Combine filters: customerName + timeSlot + date for one appointment (e.g. "John at 13:00").
- Default date to today when the user says "today" or gives no date for today's context.
- If unclear, use action "unknown".

${PROVIDER_MOBILE_CLASSIFIER_RULES}`;

interface ParsedIntent {
  action: string;
  params: Record<string, unknown>;
  reasoning: string;
}

@Injectable()
export class ProviderAiCommandService {
  private readonly logger = new Logger(ProviderAiCommandService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(SchedulingPeriod)
    private periodRepo: Repository<SchedulingPeriod>,
    private bookingService: BookingService,
    private schedulingEngine: SchedulingEngineService,
    private llm: LlmService,
    private providerMobile: ProviderMobileService,
    private completionPipeline: CommandCompletionPipelineService,
    private aiEvents: AiEventsService,
    private scheduleHandlers: AiScheduleHandlersService,
    private orchestration: CommandOrchestrationService,
    private planBuilder: OperationalPlanBuilderService,
    private promptSecurity: AiPromptSecurityService,
    private aiSettings: AiSettingsService,
    private promptNormalization: AiPromptNormalizationService,
    private providerUnderstanding: ProviderCommandUnderstandingAdapter,
    @Inject(forwardRef(() => AiPushNotificationsService))
    private pushNotifications: AiPushNotificationsService,
    @Inject(forwardRef(() => AiProviderBookingService))
    private providerBooking: AiProviderBookingService,
    @Inject(forwardRef(() => AiProviderClinicCollectionService))
    private providerClinicCollection: AiProviderClinicCollectionService,
    @Inject(forwardRef(() => AiClinicLabBookingService))
    private clinicLabBooking: AiClinicLabBookingService,
    private businessCurrency: AiBusinessCurrencyService,
    private businessDateFormat: AiBusinessDateFormatService,
    private businessTax: AiBusinessTaxService,
    private businessCompliance: AiBusinessComplianceService,
    @Inject(forwardRef(() => AiProviderPushSetupService))
    private providerPushSetup: AiProviderPushSetupService,
    @Inject(forwardRef(() => AiProviderEarningsService))
    private providerEarnings: AiProviderEarningsService,
    @Inject(forwardRef(() => AiProviderClientContextService))
    private providerClientContext: AiProviderClientContextService,
    @Inject(forwardRef(() => AiProviderExp2Service))
    private providerExp2: AiProviderExp2Service,
    @Inject(forwardRef(() => AiProviderTimeOffService))
    private providerTimeOff: AiProviderTimeOffService,
    @Inject(forwardRef(() => AiProviderOpenShiftsService))
    private providerOpenShifts: AiProviderOpenShiftsService,
    @Inject(forwardRef(() => AiProviderExp3Service))
    private providerExp3: AiProviderExp3Service,
    private pushActions: ProviderPushActionService,
  ) {}

  async executeCommand(
    businessId: string,
    userId: string,
    prompt: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    if (!(await this.llm.isAvailableForBusiness(businessId))) {
      return {
        success: false,
        action: 'error',
        summary:
          'AI assistant is not configured. Ask your business owner to add an OpenAI API key in Settings.',
        details: {},
      };
    }

    const access = await this.providerMobile.resolveMobileAccess(
      businessId,
      userId,
    );
    const actorTier = this.resolveProviderAccessTier(access);

    const blocked = this.promptSecurity.preflightBlock(
      businessId,
      prompt,
      'provider',
    );
    if (blocked) {
      return {
        success: blocked.success,
        action: blocked.action,
        summary: blocked.summary,
        details: blocked.details as Record<string, unknown>,
      };
    }

    const providerName = access.employee?.name ?? 'Admin';
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);

    if (this.providerBooking.isProviderBookingCompound(prompt)) {
      const providerBookingCompound =
        await this.providerBooking.handleProviderBookingCompound(
          businessId,
          prompt,
          {
            sessionEmployeeId: scopedEmployeeId ?? undefined,
            userId,
            ...context,
          },
        );
      if (
        providerBookingCompound.success ||
        providerBookingCompound.details?.failedStep
      ) {
        return providerBookingCompound;
      }
    }

    if (this.pushNotifications.isPushNotificationsCompound(prompt)) {
      const compound =
        await this.pushNotifications.handlePushNotificationsCompound(
          businessId,
          prompt,
          {
            sessionEmployeeId: scopedEmployeeId ?? undefined,
            userId,
            lastPush: context?.lastPush,
            offlineQueueCount: context?.offlineQueueCount,
            online: context?.online,
          },
        );
      if (compound.success || compound.details?.failedStep) {
        return compound;
      }
    }

    if (isProviderMobileCompoundPrompt(prompt)) {
      const mobileCompound = await this.handleProviderMobileCompound(
        businessId,
        userId,
        prompt,
        access,
        context,
        scopedEmployeeId ?? undefined,
      );
      if (mobileCompound.success || mobileCompound.details?.failedStep) {
        return mobileCompound;
      }
    }

    const aiConfig = await this.aiSettings.getSettings(businessId);
    const promptNorm = await this.promptNormalization.normalizeForClassifier(
      businessId,
      userId,
      prompt,
    );

    const understood = await this.providerUnderstanding.understand({
      businessId,
      userId,
      effectivePrompt: prompt,
      providerName,
      viewMode: access.viewMode,
      confidence: aiConfig.confidence,
      sessionConfidenceHigh: context?._confidenceHigh as number | undefined,
      lastAction: context?.lastAction as string | undefined,
      sessionContext: context,
      employees: access.employee
        ? [{ id: access.employee.id, name: access.employee.name }]
        : [],
      promptNorm,
      classify: (normalizedPrompt, contextBlock, narrowShortlist) =>
        this.classifyIntent(
          businessId,
          userId,
          normalizedPrompt,
          contextBlock,
          providerName,
          access.viewMode,
          history,
          context,
          narrowShortlist,
        ),
    });

    if (understood.status === 'blocked') {
      return {
        success: false,
        action: 'error',
        summary: 'Could not understand that command. Try rephrasing.',
        details: {
          pipelineTrace: understood.trace,
          blockReason: understood.blockReason,
        },
      };
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
      this.aiEvents.emitClarify(businessId, {
        action: understood.action,
        summary: clarify.summary,
        missing: clarify.details.missing,
      });
      return {
        success: clarify.success,
        action: clarify.action,
        summary: clarify.summary,
        details: clarify.details as Record<string, unknown>,
      };
    }

    let parsed = pipelineResultToClassifiedIntent(understood);
    const classifierCandidate = findClassifierCandidate(understood);
    const classifierAction = classifierCandidate?.action ?? parsed.action;
    let rescueReason: string | undefined = pipelineRescueReason(understood);

    parsed.params = this.completionPipeline.mergeProviderSessionContext(
      parsed.params as Record<string, any>,
      context,
    ) as Record<string, unknown>;
    parsed.params = applyProviderEntityMemory(parsed.params, prompt, context);
    applyProviderMobilePromptHints(
      parsed.action,
      parsed.params as Record<string, any>,
      prompt,
      {
        session: context,
      },
    );
    this.completionPipeline.normalizeDateParams(
      parsed.params as Record<string, any>,
    );

    const providerHeuristic = rescueProviderAiIntent(prompt, parsed.action);
    if (providerHeuristic !== parsed.action) {
      parsed.action = providerHeuristic;
      rescueReason = 'provider_heuristic';
    }

    const coordination = rescueCoordinationIntent(prompt, parsed.action);
    if (coordination !== parsed.action) {
      parsed.action = coordination;
      rescueReason = 'coordination_intent';
    }

    const mobileFix = disambiguateProviderMobileAction(
      prompt,
      parsed.action,
      context,
    );
    if (mobileFix) {
      parsed.action = mobileFix.action;
      rescueReason = mobileFix.rescueReason;
    }

    recordMisrouteTelemetry(this.aiEvents, businessId, {
      surface: 'provider',
      prompt,
      classifierAction,
      rescuedAction: parsed.action,
      rescueReason,
      compoundStepCount: 1,
    });
    applyProviderMobilePromptHints(
      parsed.action,
      parsed.params as Record<string, any>,
      prompt,
      {
        session: context,
      },
    );

    if (shouldBlockUnknownFromHandlerSwitch(parsed.action)) {
      const clarify = buildUnknownIntentClarifyResult({
        surface: 'provider',
        prompt,
        params: parsed.params,
        reasoning: parsed.reasoning,
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        trace: understood.trace,
      });
      this.aiEvents.emitClarify(businessId, {
        action: 'unknown',
        summary: clarify.summary,
        missing: clarify.details.missing,
      });
      return {
        success: clarify.success,
        action: clarify.action,
        summary: clarify.summary,
        details: clarify.details as Record<string, unknown>,
      };
    }

    if (shouldValidateProviderAction(parsed.action)) {
      const validation = validateProviderCommand(parsed.action, parsed.params);
      if (!validation.ok) {
        const clarify = this.completionPipeline.toProviderClarifyResult(
          parsed.action,
          parsed.params,
          parsed.reasoning,
          validation,
        );
        this.aiEvents.emitClarify(businessId, {
          action: parsed.action,
          summary: clarify.summary,
          missing: Array.isArray(clarify.details.missing)
            ? clarify.details.missing
            : undefined,
        });
        return clarify;
      }
    }

    this.normalizeParams(parsed.params);

    if (!isIntentAllowed('provider', actorTier, parsed.action)) {
      return {
        success: false,
        action: parsed.action,
        summary: `Action "${parsed.action.replace(/_/g, ' ')}" is not allowed for your role (${actorTier}).`,
        details: { tier: actorTier, action: parsed.action },
      };
    }

    parsed.params = this.promptSecurity.stripParams(parsed.params);
    parsed.params = this.promptSecurity.applyStaffScope(
      actorTier,
      parsed.action,
      parsed.params,
      this.providerMobile.getScopedEmployeeId(access),
    );

    const securityDenied = this.promptSecurity.enforceAction(
      businessId,
      'provider',
      actorTier,
      parsed.action,
      prompt,
      parsed.params,
    );
    if (securityDenied) {
      return {
        success: securityDenied.success,
        action: securityDenied.action,
        summary: securityDenied.summary,
        details: securityDenied.details as Record<string, unknown>,
      };
    }

    this.logger.log(
      `Provider AI action="${parsed.action}" — ${parsed.reasoning}`,
    );

    let result: ProviderCommandResult;

    switch (parsed.action) {
      case 'cancel_bookings':
        result = await this.handleCancelBookings(
          businessId,
          access,
          parsed.params,
          userId,
        );
        break;
      case 'update_bookings':
        result = await this.handleUpdateBookings(
          businessId,
          access,
          parsed.params,
          userId,
        );
        break;
      case 'mark_no_shows':
        result = await this.handleMarkNoShows(
          businessId,
          access,
          parsed.params,
          userId,
        );
        break;
      case 'payment_sweep':
        result = await this.handlePaymentSweep(
          businessId,
          access,
          parsed.params,
          userId,
        );
        break;
      case 'list_bookings':
        result = await this.handleListBookings(
          businessId,
          access,
          parsed.params,
        );
        break;
      case 'summarize_day':
        result = await this.handleSummarizeDay(
          businessId,
          access,
          parsed.params,
        );
        break;
      case 'reschedule_booking':
        result = await this.handleRescheduleBooking(
          businessId,
          access,
          parsed.params,
          userId,
        );
        break;
      case 'fill_unused_slots':
        result = await this.handleFillUnusedSlots(
          businessId,
          access,
          prompt,
          parsed.params,
          userId,
        );
        break;
      case 'show_appointments':
        result = await this.handleShowAppointments(
          businessId,
          access,
          prompt,
          parsed.params,
        );
        break;
      case 'team_whos_next':
        result = await this.handleTeamWhosNext(businessId, userId, access);
        break;
      case 'check_availability':
        result = await this.handleCheckAvailability(
          businessId,
          access,
          prompt,
          parsed.params,
        );
        break;
      case 'block_schedule':
        result = await this.handleBlockSchedule(
          businessId,
          access,
          prompt,
          parsed.params,
          userId,
        );
        break;
      case 'add_retail_to_booking':
      case 'send_client_message':
      case 'block_my_time':
      case 'request_time_off':
        result =
          (await this.providerExp3.handleIntent(
            businessId,
            userId,
            parsed.action,
            parsed.params,
            prompt,
            context,
            access.employee?.id,
          )) ?? {
            success: false,
            action: parsed.action,
            summary: `Could not complete "${parsed.action}". Try rephrasing or use the booking detail screen.`,
            details: { clarify: true },
          };
        break;
      case 'list_my_time_off_requests':
        result =
          (await this.providerTimeOff.handleIntent(
            businessId,
            userId,
            parsed.action,
            parsed.params,
            'provider',
            access.employee?.id,
          )) ?? {
            success: false,
            action: parsed.action,
            summary: 'Could not load your time-off requests.',
            details: { clarify: true },
          };
        break;
      case 'suggest_waitlist_for_gap':
        result =
          (await this.providerOpenShifts.handleIntent(
            businessId,
            parsed.action,
            prompt,
            parsed.params,
            access.employee?.id,
          )) ?? {
            success: false,
            action: 'suggest_waitlist_for_gap',
            summary:
              'Could not suggest waitlist customers for this gap. Open your provider calendar and tap Fill this gap.',
            details: { clarify: true },
          };
        break;
      case 'summarize_utilization':
        result = await this.handleSummarizeUtilization(
          businessId,
          access,
          prompt,
          parsed.params,
        );
        break;
      case 'coordinate_waitlist_offer':
        result = await this.handleCoordinateWaitlistOffer(
          businessId,
          access,
          parsed.params,
          userId,
          context?.confirmed === true,
        );
        break;
      case 'explain_last_push':
        result = await this.pushNotifications.handleExplainLastPush({
          ...parsed.params,
          lastPush: parsed.params.lastPush ?? context?.lastPush,
        });
        break;
      case 'open_booking_from_push':
        result = await this.pushNotifications.handleOpenBookingFromPush(
          businessId,
          {
            ...parsed.params,
            lastPush: parsed.params.lastPush ?? context?.lastPush,
          },
          prompt,
        );
        break;
      case 'offline_queue_status':
        result = await this.pushNotifications.handleOfflineQueueStatus({
          ...parsed.params,
          offlineQueueCount:
            parsed.params.offlineQueueCount ?? context?.offlineQueueCount,
          online: parsed.params.online ?? context?.online,
        });
        break;
      case 'retry_offline_action':
        result = await this.pushNotifications.handleRetryOfflineAction({
          ...parsed.params,
          offlineQueueCount:
            parsed.params.offlineQueueCount ?? context?.offlineQueueCount,
          online: parsed.params.online ?? context?.online,
        });
        break;
      case 'dismiss_push':
        result = await this.pushNotifications.handleDismissPush({
          ...parsed.params,
          lastPush: parsed.params.lastPush ?? context?.lastPush,
        });
        break;
      case 'end_of_day_summary':
        result = await this.pushNotifications.handleEndOfDaySummary(
          businessId,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
        );
        break;
      case 'new_booking_push_actions':
        result = await this.pushNotifications.handleNewBookingPushActions();
        break;
      case 'explain_push_setup':
      case 'enable_push_notifications':
        result =
          (await this.providerPushSetup.handleIntent(
            businessId,
            userId,
            parsed.action,
            {
              ...parsed.params,
              nativePlatform: context?.nativePlatform ?? parsed.params.nativePlatform,
            },
          )) ?? {
            success: false,
            action: parsed.action,
            summary: `Provider assistant does not support "${parsed.action}" yet. Try rephrasing.`,
            details: { clarify: true },
          };
        break;
      case 'summarize_my_appointments':
      case 'summarize_my_revenue':
        result =
          (await this.providerEarnings.handleIntent(
            businessId,
            userId,
            parsed.action,
            parsed.params,
            prompt,
          )) ?? {
            success: false,
            action: parsed.action,
            summary: `Provider assistant does not support "${parsed.action}" yet. Try rephrasing.`,
            details: { clarify: true },
          };
        break;
      case 'summarize_client':
      case 'show_client_history':
      case 'add_client_note':
        result =
          (await this.providerClientContext.handleIntent(
            businessId,
            userId,
            parsed.action,
            parsed.params,
            prompt,
            context,
          )) ?? {
            success: false,
            action: parsed.action,
            summary: `Provider assistant does not support "${parsed.action}" yet. Try rephrasing.`,
            details: { clarify: true },
          };
        break;
      case 'my_stats':
      case 'team_floor_status':
      case 'check_in_client':
      case 'mark_running_late':
        result =
          (await this.providerExp2.handleIntent(
            businessId,
            userId,
            parsed.action,
            parsed.params,
            prompt,
            context,
          )) ?? {
            success: false,
            action: parsed.action,
            summary: `Provider assistant does not support "${parsed.action}" yet. Try rephrasing.`,
            details: { clarify: true },
          };
        break;
      case 'confirm_booking_from_push':
        result = await this.handleConfirmBookingFromPush(
          businessId,
          userId,
          parsed.params,
        );
        break;
      case 'suggest_reschedule_from_push':
        result = await this.handleSuggestRescheduleFromPush(
          businessId,
          userId,
          parsed.params,
        );
        break;
      case 'list_package_appointments_today':
        result = await this.providerBooking.handleListPackageAppointmentsToday(
          businessId,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
        );
        break;
      case 'list_my_package_visits':
        result = await this.providerBooking.handleListMyPackageVisits(
          businessId,
          prompt,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
        );
        break;
      case 'list_my_multi_service_groups':
        result = await this.providerBooking.handleListMyMultiServiceGroups(
          businessId,
          prompt,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
          },
        );
        break;
      case 'mark_paid':
        result = await this.providerBooking.handleMarkPaid(
          businessId,
          {
            ...parsed.params,
            sessionEmployeeId: scopedEmployeeId ?? undefined,
            _prompt: prompt,
          },
          userId,
        );
        break;
      case 'explain_appointment_tax': {
        const parsedAppointmentTax = parseExplainAppointmentTaxFromPrompt(
          prompt,
          parsed.params,
        );
        result = await this.businessTax.handleExplainAppointmentTax(
          businessId,
          parsedAppointmentTax
            ? { ...parsed.params, ...parsedAppointmentTax, _prompt: prompt }
            : { ...parsed.params, _prompt: prompt },
          prompt,
          scopedEmployeeId ?? undefined,
        );
        break;
      }
      case 'explain_provider_payment_currency':
        result =
          await this.businessCurrency.handleExplainProviderPaymentCurrency(
            businessId,
          );
        break;
      case 'explain_provider_date_display':
        result =
          await this.businessDateFormat.handleExplainProviderDateDisplay(
            businessId,
          );
        break;
      case 'configure_provider_push_date_format':
        result =
          await this.businessDateFormat.handleConfigureProviderPushDateFormat(
            businessId,
            { ...parsed.params, _prompt: prompt },
            prompt,
            context?.confirmed === true,
          );
        break;
      case 'explain_provider_session_timeout':
        result =
          await this.businessCompliance.handleExplainProviderSessionTimeout(
            businessId,
          );
        break;
      case 'list_my_collection_queue':
        result =
          await this.providerClinicCollection.handleListMyCollectionQueue(
            businessId,
            {
              ...parsed.params,
              sessionEmployeeId: scopedEmployeeId ?? undefined,
              _prompt: prompt,
            },
            prompt,
          );
        break;
      case 'mark_specimen_collected':
        result =
          await this.providerClinicCollection.handleMarkSpecimenCollected(
            businessId,
            userId,
            {
              ...parsed.params,
              sessionEmployeeId: scopedEmployeeId ?? undefined,
              _prompt: prompt,
            },
            prompt,
          );
        break;
      case 'list_patient_pending_lab_requests':
        result =
          await this.clinicLabBooking.handleListPatientPendingLabRequests(
            businessId,
            userId,
            {
              ...parsed.params,
              sessionEmployeeId: scopedEmployeeId ?? undefined,
            },
          );
        break;
      default:
        result = {
          success: false,
          action: 'unknown',
          summary:
            'I can show your schedule, check availability, block breaks, summarize utilization, cancel or reschedule, fill gaps, mark no-shows, run payment sweeps, or update appointments. Try: "Who\'s next?" or "Mark all today paid".',
          details: {},
        };
    }

    return this.attachProviderSession(
      result,
      mergeProviderMobileHintsIntoSessionContext(
        context ?? {},
        parsed.params,
        parsed.action,
      ),
    );
  }

  private async handleProviderMobileCompound(
    businessId: string,
    userId: string,
    prompt: string,
    access: MobileAccess,
    context: Record<string, unknown> | undefined,
    scopedEmployeeId: string | undefined,
  ): Promise<ProviderCommandResult> {
    const steps = decomposeProviderMobileCompoundPrompt(prompt);
    if (steps.length < 2) {
      return {
        success: false,
        action: 'compound_intent',
        summary:
          'Could not split this into multiple provider commands. Try separating with "and".',
        details: { clarify: true },
      };
    }

    const results: ProviderCommandResult[] = [];
    let compoundContext: Record<string, unknown> = {
      ...context,
      sessionEmployeeId: scopedEmployeeId,
    };

    for (const step of steps.slice(0, 4)) {
      const stepParams = {
        ...compoundContext,
        ...step.params,
        _prompt: step.segment,
      };
      applyProviderMobilePromptHints(
        step.action,
        stepParams as Record<string, any>,
        step.segment,
        {
          session: compoundContext,
        },
      );

      let stepResult: ProviderCommandResult;
      switch (step.action) {
        case 'confirm_booking_from_push':
          stepResult = await this.handleConfirmBookingFromPush(
            businessId,
            userId,
            stepParams,
          );
          break;
        case 'suggest_reschedule_from_push':
          stepResult = await this.handleSuggestRescheduleFromPush(
            businessId,
            userId,
            stepParams,
          );
          break;
        case 'mark_paid': {
          const markPaid = await this.providerBooking.handleMarkPaid(
            businessId,
            stepParams as Record<string, any>,
            userId,
          );
          stepResult = {
            success: markPaid.success,
            action: markPaid.action,
            summary: markPaid.summary,
            details: markPaid.details as Record<string, unknown>,
          };
          break;
        }
        case 'explain_last_push':
        case 'open_booking_from_push':
        case 'offline_queue_status':
        case 'retry_offline_action':
        case 'dismiss_push':
        case 'end_of_day_summary':
        case 'new_booking_push_actions':
          stepResult = await this.executeProviderPushStep(
            businessId,
            step.action,
            stepParams,
            step.segment,
            scopedEmployeeId,
          );
          break;
        case 'list_package_appointments_today':
        case 'list_my_package_visits':
        case 'list_my_multi_service_groups':
          stepResult = await this.executeProviderBookingReadStep(
            businessId,
            step.action,
            prompt,
            stepParams,
            scopedEmployeeId,
          );
          break;
        default:
          return {
            success: false,
            action: step.action,
            summary: `Unsupported provider mobile compound step: ${step.action}.`,
            details: {
              failedStep: step.action,
              completedSteps: results.length,
            },
          };
      }

      results.push(stepResult);
      compoundContext = mergeProviderMobileHintsIntoSessionContext(
        compoundContext,
        stepParams,
        step.action,
      );
      if (stepResult.details?.bookingId) {
        compoundContext.bookingId = stepResult.details.bookingId;
      }

      if (!stepResult.success && stepResult.details?.needsClarification) {
        return {
          ...stepResult,
          details: {
            ...stepResult.details,
            compoundSteps: results,
            failedStep: step.action,
          },
        };
      }
    }

    const last = results[results.length - 1];
    return {
      success: results.every((r) => r.success),
      action: 'compound_intent',
      summary: results.map((r) => r.summary).join(' → '),
      details: {
        compound: true,
        steps: results.map((r) => ({ action: r.action, summary: r.summary })),
        sessionContext: this.completionPipeline.buildProviderSessionContext(
          compoundContext as Record<string, any>,
        ),
        ...last.details,
      },
    };
  }

  private async executeProviderPushStep(
    businessId: string,
    action: string,
    params: Record<string, unknown>,
    segment: string,
    scopedEmployeeId: string | undefined,
  ): Promise<ProviderCommandResult> {
    switch (action) {
      case 'explain_last_push': {
        const r = await this.pushNotifications.handleExplainLastPush({
          ...params,
          lastPush: params.lastPush,
        });
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'open_booking_from_push': {
        const r = await this.pushNotifications.handleOpenBookingFromPush(
          businessId,
          { ...params, lastPush: params.lastPush },
          segment,
        );
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'offline_queue_status': {
        const r = await this.pushNotifications.handleOfflineQueueStatus(params);
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'retry_offline_action': {
        const r = await this.pushNotifications.handleRetryOfflineAction(params);
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'dismiss_push': {
        const r = await this.pushNotifications.handleDismissPush(params);
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'end_of_day_summary': {
        const r = await this.pushNotifications.handleEndOfDaySummary(
          businessId,
          { ...params, sessionEmployeeId: scopedEmployeeId },
        );
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      case 'new_booking_push_actions': {
        const r = await this.pushNotifications.handleNewBookingPushActions();
        return {
          success: r.success,
          action: r.action,
          summary: r.summary,
          details: r.details as Record<string, unknown>,
        };
      }
      default:
        return {
          success: false,
          action,
          summary: `Unsupported push step: ${action}`,
          details: {},
        };
    }
  }

  private async executeProviderBookingReadStep(
    businessId: string,
    action: string,
    prompt: string,
    params: Record<string, unknown>,
    scopedEmployeeId: string | undefined,
  ): Promise<ProviderCommandResult> {
    const stepParams = {
      ...params,
      sessionEmployeeId: scopedEmployeeId,
    };
    let r;
    switch (action) {
      case 'list_package_appointments_today':
        r = await this.providerBooking.handleListPackageAppointmentsToday(
          businessId,
          stepParams as Record<string, any>,
        );
        break;
      case 'list_my_package_visits':
        r = await this.providerBooking.handleListMyPackageVisits(
          businessId,
          prompt,
          stepParams as Record<string, any>,
        );
        break;
      case 'list_my_multi_service_groups':
        r = await this.providerBooking.handleListMyMultiServiceGroups(
          businessId,
          prompt,
          stepParams as Record<string, any>,
        );
        break;
      default:
        return {
          success: false,
          action,
          summary: `Unsupported booking read step: ${action}`,
          details: {},
        };
    }
    return {
      success: r.success,
      action: r.action,
      summary: r.summary,
      details: r.details as Record<string, unknown>,
    };
  }

  private async handleConfirmBookingFromPush(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const bookingId = params.bookingId as string | undefined;
    if (!bookingId) {
      return {
        success: false,
        action: 'confirm_booking_from_push',
        summary:
          'No booking linked — open the push notification or say which appointment to confirm.',
        details: {
          needsClarification: true,
          missing: ['bookingId'],
          pushParity: 'confirm',
        },
      };
    }

    const pushResult = await this.pushActions.handleAction(businessId, userId, {
      actionId: 'confirm',
      bookingId,
      businessId,
    });
    return {
      success: pushResult.success,
      action: 'confirm_booking_from_push',
      summary: pushResult.summary,
      details: {
        bookingId,
        pushParity: 'confirm',
        pushActionId: 'confirm',
      },
    };
  }

  private async handleSuggestRescheduleFromPush(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const bookingId = params.bookingId as string | undefined;
    if (!bookingId) {
      return {
        success: false,
        action: 'suggest_reschedule_from_push',
        summary:
          'No booking linked — open the push notification or specify which appointment to reschedule.',
        details: {
          needsClarification: true,
          missing: ['bookingId'],
          pushParity: 'suggest_reschedule',
        },
      };
    }

    const pushResult = await this.pushActions.handleAction(businessId, userId, {
      actionId: 'suggest_reschedule',
      bookingId,
      businessId,
    });
    return {
      success: pushResult.success,
      action: 'suggest_reschedule_from_push',
      summary: pushResult.summary,
      details: {
        bookingId,
        pushParity: 'suggest_reschedule',
        pushActionId: 'suggest_reschedule',
        openAi: true,
      },
    };
  }

  private buildConfirmationDetails(
    bookings: Booking[],
    pendingAction: { action: string; params: Record<string, unknown> },
  ) {
    const preview = bookings.map((b) => this.bookingLabel(b));
    const previewItems = bookings.map((b) => this.toPreviewItem(b));
    return {
      requiresConfirmation: true,
      bookingIds: bookings.map((b) => b.id),
      preview,
      previewItems,
      pendingAction,
    };
  }

  private toPreviewItem(booking: Booking): ProviderPreviewItem {
    const customerName = booking.customer?.name ?? 'Walk-in';
    return {
      id: booking.id,
      customerName,
      serviceName: booking.service?.name ?? 'Appointment',
      time: formatTimeRangeDisplay(booking.startTime, booking.endTime),
      initials:
        customerName
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join('') || '?',
    };
  }

  private attachProviderSession(
    result: ProviderCommandResult,
    params: Record<string, unknown>,
  ): ProviderCommandResult {
    if (result.details?.needsClarification) return result;
    return {
      ...result,
      details: {
        ...result.details,
        sessionContext: this.completionPipeline.buildProviderSessionContext(
          params as Record<string, any>,
        ),
      },
    };
  }

  async confirmAction(
    businessId: string,
    userId: string,
    dto: ProviderAiConfirmDto,
  ): Promise<ProviderCommandResult> {
    const access = await this.providerMobile.resolveMobileAccess(
      businessId,
      userId,
    );
    const bookings = await this.loadOwnedBookings(
      businessId,
      this.providerMobile.getScopedEmployeeId(access),
      dto.bookingIds,
    );
    if (bookings.length !== dto.bookingIds.length) {
      throw new BadRequestException(
        'Some appointments were not found or are not yours',
      );
    }

    if (dto.action === 'cancel_bookings') {
      const result = await this.executeCancel(
        bookings,
        String(dto.params?.reason ?? 'Cancelled by provider'),
        userId,
      );
      this.aiEvents.emitTaskCompleted(businessId, {
        action: 'cancel_bookings',
        success: result.success,
        summary: result.summary,
      });
      return result;
    }
    if (
      dto.action === 'update_bookings' ||
      dto.action === 'mark_no_shows' ||
      dto.action === 'payment_sweep'
    ) {
      const result = await this.executeUpdate(
        bookings,
        dto.action === 'mark_no_shows'
          ? { status: BookingStatus.NO_SHOW }
          : dto.action === 'payment_sweep'
            ? { paymentStatus: PaymentStatus.PAID }
            : (dto.params ?? {}),
        userId,
      );
      this.aiEvents.emitTaskCompleted(businessId, {
        action: dto.action,
        success: result.success,
        summary: result.summary,
      });
      return { ...result, action: dto.action };
    }
    throw new BadRequestException('Unsupported action');
  }

  private async classifyIntent(
    businessId: string,
    userId: string,
    prompt: string,
    contextBlock: string,
    providerName: string,
    viewMode: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, unknown>,
    narrowShortlist?: readonly string[],
  ): Promise<ParsedIntent | null> {
    const historyBlock = formatProviderHistoryBlock(history);
    const schemaHeader = narrowShortlist?.length
      ? buildNarrowClassifierSchema('provider', narrowShortlist)
      : PROVIDER_INTENT_SCHEMA;

    const result = await this.llm.completeJson<ParsedIntent>(
      businessId,
      `${schemaHeader}\n\n${contextBlock}${historyBlock}`,
      prompt,
      {
        surface: 'provider_mobile',
        operation: 'classify_intent',
        actorType: viewMode === 'team' ? 'manager' : 'provider',
        userId,
      },
      0.1,
    );
    return result?.action ? result : null;
  }

  private async handleCancelBookings(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    if (!params.date) params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      params,
      {
        excludeTerminal: true,
      },
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'cancel_bookings',
        summary: this.noMatchMessage('cancel', params),
        details: { matchedCount: 0 },
      };
    }

    const reason = String(params.reason ?? 'Cancelled by provider');

    if (bookings.length >= BULK_CONFIRM_THRESHOLD) {
      return {
        success: true,
        action: 'cancel_bookings',
        summary: `Cancel ${bookings.length} appointments${reason ? ` with note: "${reason}"` : ''}?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'cancel_bookings',
          params: { reason },
        }),
      };
    }

    return this.executeCancel(bookings, reason, userId);
  }

  private async handleUpdateBookings(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    if (!params.date) params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const status = this.normalizeStatus(params.status);
    const paymentStatus = this.normalizePaymentStatus(params.paymentStatus);

    if (!status && !paymentStatus) {
      return {
        success: false,
        action: 'update_bookings',
        summary:
          'Tell me what to change — e.g. mark as done, set payment to paid.',
        details: {},
      };
    }

    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      params,
      {
        excludeCancelled: true,
      },
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'update_bookings',
        summary: this.noMatchMessage('update', params),
        details: { matchedCount: 0 },
      };
    }

    const changeParts = [
      status ? `status → ${status}` : null,
      paymentStatus ? `payment → ${paymentStatus}` : null,
    ].filter(Boolean);

    if (bookings.length >= BULK_CONFIRM_THRESHOLD) {
      return {
        success: true,
        action: 'update_bookings',
        summary: `Update ${bookings.length} appointments (${changeParts.join(', ')})?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'update_bookings',
          params: { status, paymentStatus },
        }),
      };
    }

    return this.executeUpdate(bookings, { status, paymentStatus }, userId);
  }

  private resolveProviderAccessTier(access: MobileAccess): AccessTier {
    if (access.viewMode === 'team') {
      return resolveAccessTier(access.membershipRole);
    }
    return 'staff';
  }

  private async handleMarkNoShows(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    if (!params.date && !params.dateFrom)
      params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findNoShowCandidates(
      businessId,
      employeeId,
      params,
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'mark_no_shows',
        summary: 'No eligible past appointments found to mark as no-show.',
        details: { matchedCount: 0 },
      };
    }

    if (bookings.length >= BULK_CONFIRM_THRESHOLD) {
      return {
        success: true,
        action: 'mark_no_shows',
        summary: `Mark ${bookings.length} appointment(s) as no-show?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'mark_no_shows',
          params: { status: BookingStatus.NO_SHOW },
        }),
      };
    }

    const result = await this.executeUpdate(
      bookings,
      { status: BookingStatus.NO_SHOW },
      userId,
    );
    return { ...result, action: 'mark_no_shows' };
  }

  private async handlePaymentSweep(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    if (!params.date && !params.dateFrom)
      params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findUnpaidBookings(
      businessId,
      employeeId,
      params,
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'payment_sweep',
        summary: 'No unpaid appointments found for the given filters.',
        details: { matchedCount: 0 },
      };
    }

    if (bookings.length >= BULK_CONFIRM_THRESHOLD) {
      return {
        success: true,
        action: 'payment_sweep',
        summary: `Mark ${bookings.length} unpaid appointment(s) as paid?`,
        details: this.buildConfirmationDetails(bookings, {
          action: 'payment_sweep',
          params: { paymentStatus: PaymentStatus.PAID },
        }),
      };
    }

    const result = await this.executeUpdate(
      bookings,
      { paymentStatus: PaymentStatus.PAID },
      userId,
    );
    return { ...result, action: 'payment_sweep' };
  }

  private async findNoShowCandidates(
    businessId: string,
    employeeId: string | undefined,
    params: Record<string, unknown>,
  ): Promise<Booking[]> {
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      params,
      {
        excludeCancelled: true,
      },
    );
    const now = Date.now();
    return bookings.filter(
      (b) =>
        b.startTime.getTime() <= now &&
        b.status !== BookingStatus.NO_SHOW &&
        b.status !== BookingStatus.COMPLETED,
    );
  }

  private async findUnpaidBookings(
    businessId: string,
    employeeId: string | undefined,
    params: Record<string, unknown>,
  ): Promise<Booking[]> {
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      params,
      {
        excludeCancelled: true,
      },
    );
    return bookings.filter(
      (b) =>
        b.paymentStatus === PaymentStatus.PENDING &&
        [
          BookingStatus.CONFIRMED,
          BookingStatus.IN_PROGRESS,
          BookingStatus.COMPLETED,
        ].includes(b.status),
    );
  }

  private async executeCancel(
    bookings: Booking[],
    reason: string,
    userId: string,
  ): Promise<ProviderCommandResult> {
    let cancelled = 0;
    for (const booking of bookings) {
      if (booking.status === BookingStatus.CANCELLED) continue;
      await this.bookingService.cancel(booking.id, reason, userId);
      cancelled += 1;
    }
    return {
      success: true,
      action: 'cancel_bookings',
      summary:
        cancelled === 0
          ? 'No appointments needed cancelling.'
          : `Cancelled ${cancelled} appointment${cancelled === 1 ? '' : 's'}.`,
      details: {
        cancelledCount: cancelled,
        bookingIds: bookings.map((b) => b.id),
      },
    };
  }

  private async executeUpdate(
    bookings: Booking[],
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const status = this.normalizeStatus(params.status);
    const paymentStatus = this.normalizePaymentStatus(params.paymentStatus);
    let updated = 0;

    for (const booking of bookings) {
      if (booking.status === BookingStatus.CANCELLED) continue;
      const payload: { status?: BookingStatus; paymentStatus?: PaymentStatus } =
        {};
      if (status) payload.status = status;
      if (paymentStatus) payload.paymentStatus = paymentStatus;
      if (!Object.keys(payload).length) continue;
      await this.bookingService.update(booking.id, payload, userId);
      updated += 1;
    }

    const changeParts = [
      status ? `status set to ${status}` : null,
      paymentStatus ? `payment set to ${paymentStatus}` : null,
    ].filter(Boolean);

    return {
      success: true,
      action: 'update_bookings',
      summary:
        updated === 0
          ? 'No appointments were updated.'
          : `Updated ${updated} appointment${updated === 1 ? '' : 's'} (${changeParts.join(', ')}).`,
      details: { updatedCount: updated, bookingIds: bookings.map((b) => b.id) },
    };
  }

  private async handleListBookings(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    return this.formatBookingsList(
      businessId,
      access,
      params,
      'list_bookings',
      this.noMatchMessage('list', params),
    );
  }

  private async handleShowAppointments(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    return this.formatBookingsList(
      businessId,
      access,
      mergeShowAppointmentsParams(prompt, params),
      'show_appointments',
      this.noMatchMessage('show', params),
    );
  }

  private async handleTeamWhosNext(
    businessId: string,
    userId: string,
    access: MobileAccess,
  ): Promise<ProviderCommandResult> {
    if (access.viewMode !== 'team') {
      return {
        success: false,
        action: 'team_whos_next',
        summary:
          'Team queue is available to managers only. Ask about your own schedule instead.',
        details: { viewMode: access.viewMode },
      };
    }

    const queue = await this.providerMobile.getTeamWhosNext(businessId, userId);
    const summary = buildTeamWhosNextSummary(queue.columns, (iso) =>
      formatTimeDisplay(iso),
    );

    return {
      success: true,
      action: 'team_whos_next',
      summary,
      details: {
        windowHours: queue.windowHours,
        windowStart: queue.windowStart,
        windowEnd: queue.windowEnd,
        totalQueued: queue.totalQueued,
        columns: queue.columns.map((column) => ({
          employeeId: column.employeeId,
          employeeName: column.employeeName,
          nextBookingId: column.nextBookingId,
          queueLength: column.queue.length,
        })),
      },
    };
  }

  private async formatBookingsList(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    action: 'list_bookings' | 'show_appointments',
    emptySummary: string,
  ): Promise<ProviderCommandResult> {
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = filterBookingsForProviderList(
      await this.findMatchingBookings(businessId, employeeId, params, {}),
      resolveStatusFilter(params),
      Date.now(),
      (value) => this.normalizeStatus(value),
    );

    return buildProviderBookingsListResult({
      bookings,
      params,
      statusFilter: resolveStatusFilter(params),
      action,
      emptySummary,
      formatLabel: (b) => this.bookingLabel(b),
    });
  }

  private async handleCheckAvailability(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    if (!employeeId) {
      return buildNoLinkedEmployeeAvailabilityResult();
    }

    const isoDay = params.date
      ? toIsoDay(String(params.date))
      : toIsoDay(todayDisplay());
    const { day, dayEnd } = resolveAvailabilityDayBounds(isoDay);

    const periods = await this.periodRepo.find({
      where: {
        businessId,
        employeeId,
        startTime: Between(day, dayEnd),
      },
      order: { startTime: 'ASC' },
    });

    const { timeFrom, timeTo } = resolveAvailabilityTimeWindow(params);
    const gaps = mapScheduleGapLabels(
      findScheduleGapsInWindow(day, timeFrom, timeTo, periods),
    );
    const displayDay = formatDateDisplay(isoDay);

    if (params.timeSlot) {
      return buildSlotAvailabilityResult({
        displayDay,
        slot: normalizeTime24(String(params.timeSlot)),
        gaps,
      });
    }

    if (shouldUseAfternoonAvailability(prompt, params)) {
      return buildAfternoonAvailabilityResult({
        displayDay,
        gaps,
        timeFrom,
        timeTo,
      });
    }

    return buildGapsAvailabilityResult({ displayDay, gaps, timeFrom, timeTo });
  }

  private async handleBlockSchedule(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const targets = scopedEmployeeId
      ? employees.filter((e) => e.id === scopedEmployeeId)
      : employees;

    const blockParams = prepareBlockScheduleParams(prompt, params, {
      scopedEmployeeId,
      employeeName: targets[0]?.name ?? null,
    });

    const result = await this.scheduleHandlers.handleBlockSchedule(
      businessId,
      prompt,
      blockParams as Record<string, any>,
      targets,
      userId,
    );

    return {
      success: result.success,
      action: 'block_schedule',
      summary: result.summary,
      details: (result.details ?? {}) as Record<string, unknown>,
    };
  }

  private async handleSummarizeUtilization(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const targets = scopedEmployeeId
      ? employees.filter((e) => e.id === scopedEmployeeId)
      : employees;

    const range =
      resolveDateRange(params, prompt) ?? defaultUtilizationWeekRange();

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const rows = await Promise.all(
      targets.map(async (e) => ({
        employeeName: e.name,
        ...(await this.schedulingEngine.getEmployeeUtilization(
          e.id,
          start,
          end,
        )),
      })),
    );

    return buildUtilizationSummaryResult({
      scopedEmployeeId,
      range,
      rows,
    });
  }

  private async handleCoordinateWaitlistOffer(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
    confirmed: boolean,
  ): Promise<ProviderCommandResult> {
    if (!canRunCoordinationOnProvider(access.viewMode)) {
      return {
        success: false,
        action: 'coordinate_waitlist_offer',
        summary: buildCoordinationDeniedSummary(access.viewMode),
        details: { viewMode: access.viewMode },
      };
    }

    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const employee = matchEmployeeByName(
      employees,
      String(params.employeeName ?? ''),
    );
    if (!employee) {
      return {
        success: false,
        action: 'coordinate_waitlist_offer',
        summary: `No provider found matching "${params.employeeName ?? 'unknown'}".`,
        details: { params },
      };
    }

    const waitlist = await this.customerRepo
      .createQueryBuilder('c')
      .where('c.business_id = :businessId', { businessId })
      .andWhere(`'waitlist' = ANY(c.tags)`)
      .orderBy('c.name', 'ASC')
      .getMany();

    const waitlistCustomer = matchWaitlistCustomerByName(
      waitlist,
      String(params.waitlistCustomerName ?? params.customerName ?? ''),
    );
    if (!waitlistCustomer) {
      return {
        success: false,
        action: 'coordinate_waitlist_offer',
        summary: waitlist.length
          ? `No waitlist customer found matching "${params.waitlistCustomerName ?? params.customerName}". Tag customers with "waitlist" in CRM.`
          : 'No waitlist customers found. Tag customers with "waitlist" in CRM.',
        details: { waitlistCount: waitlist.length },
      };
    }

    const bookings = await this.findMatchingBookings(
      businessId,
      employee.id,
      params,
      {
        excludeTerminal: true,
      },
    );

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'coordinate_waitlist_offer',
        summary: `No upcoming appointments found for ${employee.name} to coordinate.`,
        details: { matchedCount: 0, employeeName: employee.name },
      };
    }

    if (!confirmed || bookings.length >= BULK_CONFIRM_THRESHOLD) {
      return buildCoordinateWaitlistConfirmation({
        employeeName: employee.name,
        waitlistCustomerName: waitlistCustomer.name,
        bookings: bookings.map((booking) => ({
          id: booking.id,
          label: this.bookingLabel(booking),
        })),
        params,
      });
    }

    const target = bookings[0];
    const slot = {
      bookingId: target.id,
      employeeId: target.employeeId,
      serviceId: target.serviceId,
      startTime: target.startTime.toISOString(),
      customerName: target.customer?.name,
    };

    const cancelResult = await this.executeCancel(
      [target],
      String(params.reason ?? 'Cancelled for waitlist coordination'),
      userId,
    );
    if (!cancelResult.success) return cancelResult;

    const plan = this.planBuilder.buildFillSlotFromWaitlistPlan({
      businessId,
      slot,
      candidate: {
        customerId: waitlistCustomer.id,
        customerName: waitlistCustomer.name,
      },
      userId,
    });

    const orch = await this.orchestration.executePlan({
      plan,
      businessId,
      userId,
      autoExecute: true,
    });

    return {
      success: orch.success,
      action: 'coordinate_waitlist_offer',
      summary: orch.success
        ? `Cancelled ${employee.name}'s appointment and offered the slot to waitlist customer ${waitlistCustomer.name}.`
        : (orch.summary ?? 'Waitlist offer could not be completed.'),
      details: {
        cancelledBookingId: target.id,
        waitlistCustomerId: waitlistCustomer.id,
        employeeName: employee.name,
        orchestration: orch.details,
      },
    };
  }

  private async handleSummarizeDay(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const merged = { ...params, allAppointments: true };
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(
      businessId,
      employeeId,
      merged,
      {},
    );
    const dateLabel = params.date
      ? formatDateDisplay(String(params.date))
      : todayDisplay();

    if (bookings.length === 0) {
      return {
        success: true,
        action: 'summarize_day',
        summary: `No appointments on ${dateLabel}.`,
        details: { matchedCount: 0 },
      };
    }

    const byStatus = new Map<string, number>();
    for (const b of bookings) {
      byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1);
    }
    const statusSummary = [...byStatus.entries()]
      .map(([s, n]) => `${n} ${s}`)
      .join(', ');
    return {
      success: true,
      action: 'summarize_day',
      summary: `${bookings.length} appointment${bookings.length === 1 ? '' : 's'} on ${dateLabel}: ${statusSummary}.`,
      details: {
        matchedCount: bookings.length,
        appointments: bookings.map((b) => this.bookingLabel(b)),
      },
    };
  }

  private async findMatchingBookings(
    businessId: string,
    employeeId: string | undefined,
    params: Record<string, unknown>,
    options: { excludeTerminal?: boolean; excludeCancelled?: boolean },
  ): Promise<Booking[]> {
    const where: Record<string, unknown> = { businessId };
    if (employeeId) where.employeeId = employeeId;

    if (options.excludeTerminal) {
      where.status = Not(
        In([
          BookingStatus.CANCELLED,
          BookingStatus.COMPLETED,
          BookingStatus.NO_SHOW,
        ]),
      );
    } else if (options.excludeCancelled) {
      where.status = Not(In([BookingStatus.CANCELLED]));
    }

    const dateRange = this.resolveDateRange(params);
    if (dateRange) {
      where.startTime = Between(dateRange.start, dateRange.end);
    }

    let bookings = await this.bookingRepo.find({
      where: where,
      relations: { customer: true, service: true },
      order: { startTime: 'ASC' },
    });

    if (params.customerName) {
      const name = String(params.customerName).toLowerCase();
      bookings = bookings.filter((b) =>
        b.customer?.name.toLowerCase().includes(name),
      );
    }

    if (params.serviceName) {
      const svc = String(params.serviceName).toLowerCase();
      bookings = bookings.filter((b) =>
        b.service?.name.toLowerCase().includes(svc),
      );
    }

    if (params.timeSlot) {
      const slot = this.normalizeTime(String(params.timeSlot));
      bookings = bookings.filter(
        (b) => formatTimeDisplay(b.startTime) === slot,
      );
    }

    if (
      params.allAppointments !== true &&
      !params.customerName &&
      !params.timeSlot &&
      !params.serviceName
    ) {
      // Single ambiguous match without "all" — if multiple on day, prefer requiring explicit all
      if (
        bookings.length > 1 &&
        (params.status || params.paymentStatus || params.reason)
      ) {
        // bulk intent implied by mutation params
        return bookings;
      }
    }

    return bookings;
  }

  private async handleRescheduleBooking(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(
      businessId,
      scopedEmployeeId,
      params,
      {
        excludeTerminal: true,
      },
    );

    const booking = bookings[0];
    if (!booking) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary: this.noMatchMessage('reschedule', params),
        details: { matchedCount: 0 },
      };
    }

    if (!params.date && !params.timeSlot) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary:
          'Specify the new date and/or time (e.g. "Reschedule to 16:00").',
        details: { bookingId: booking.id },
      };
    }

    const isoDay = toIsoDay(
      String(params.date ?? booking.startTime.toISOString().split('T')[0]),
    );
    const timeSlot = params.timeSlot
      ? this.normalizeTime(String(params.timeSlot))
      : formatTimeDisplay(booking.startTime);
    const startTime = `${isoDay}T${timeSlot}:00.000Z`;

    const plan = this.planBuilder.buildRescheduleBookingPlan({
      businessId,
      bookingId: booking.id,
      startTime,
      employeeId: scopedEmployeeId ?? booking.employeeId,
      serviceId: booking.serviceId,
      userId,
      label: `Reschedule ${booking.customer?.name ?? 'walk-in'} to ${formatDateDisplay(isoDay)} ${timeSlot}`,
    });

    const orch = await this.orchestration.executePlan({
      plan,
      businessId,
      userId,
      autoExecute: true,
    });

    return {
      success: orch.success,
      action: 'reschedule_booking',
      summary: orch.summary,
      details: {
        taskId: orch.taskId,
        bookingId: booking.id,
        requiresApproval: orch.requiresApproval,
      },
    };
  }

  private async handleFillUnusedSlots(
    businessId: string,
    access: MobileAccess,
    prompt: string,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    const [employees, services] = await Promise.all([
      this.employeeRepo.find({ where: { businessId, isActive: true } }),
      this.serviceRepo.find({ where: { businessId } }),
    ]);

    const scopedEmployeeId = this.providerMobile.getScopedEmployeeId(access);
    const scopedEmployees = scopedEmployeeId
      ? employees.filter((e) => e.id === scopedEmployeeId)
      : employees;

    const fillParams = {
      ...params,
      employeeName: scopedEmployeeId
        ? employees.find((e) => e.id === scopedEmployeeId)?.name
        : params.employeeName,
      allProviders: !scopedEmployeeId && access.viewMode === 'team',
    };

    const result = await this.scheduleHandlers.handleFillScheduleGaps(
      businessId,
      prompt,
      fillParams as Record<string, any>,
      scopedEmployees,
      services,
      userId,
    );

    return {
      success: result.success,
      action: 'fill_unused_slots',
      summary: result.summary,
      details: result.details as Record<string, unknown>,
    };
  }

  private async loadOwnedBookings(
    businessId: string,
    employeeId: string | undefined,
    bookingIds: string[],
  ): Promise<Booking[]> {
    const where: Record<string, unknown> = { businessId, id: In(bookingIds) };
    if (employeeId) where.employeeId = employeeId;
    return this.bookingRepo.find({
      where: where,
      relations: { customer: true, service: true },
    });
  }

  private bookingLabel(booking: Booking): string {
    const customer = booking.customer?.name ?? 'Walk-in';
    const service = booking.service?.name ?? 'Appointment';
    return `${formatTimeRangeDisplay(booking.startTime, booking.endTime)} ${customer} (${service})`;
  }

  private noMatchMessage(
    _verb: string,
    params: Record<string, unknown>,
  ): string {
    const parts = [
      params.date ? `on ${formatDateDisplay(String(params.date))}` : null,
      params.customerName ? `for ${params.customerName}` : null,
      params.timeSlot ? `at ${params.timeSlot}` : null,
    ].filter(Boolean);
    return `No matching appointments found${parts.length ? ` ${parts.join(' ')}` : ''}.`;
  }

  private normalizeParams(params: Record<string, unknown>) {
    if (params.date) params.date = toIsoDay(String(params.date));
    if (params.timeSlot)
      params.timeSlot = this.normalizeTime(String(params.timeSlot));
    if (!params.date && params.allAppointments) {
      params.date = toIsoDay(todayDisplay());
    }
  }

  private normalizeTime(value: string): string {
    const m = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return value;
    return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
  }

  private normalizeStatus(value: unknown): BookingStatus | undefined {
    if (!value) return undefined;
    const map: Record<string, BookingStatus> = {
      done: BookingStatus.COMPLETED,
      completed: BookingStatus.COMPLETED,
      complete: BookingStatus.COMPLETED,
      in_progress: BookingStatus.IN_PROGRESS,
      'in progress': BookingStatus.IN_PROGRESS,
      no_show: BookingStatus.NO_SHOW,
      'no show': BookingStatus.NO_SHOW,
      confirmed: BookingStatus.CONFIRMED,
      pending: BookingStatus.PENDING,
      booked: BookingStatus.PENDING,
    };
    return (
      map[String(value).toLowerCase()] ??
      (Object.values(BookingStatus).includes(value as BookingStatus)
        ? (value as BookingStatus)
        : undefined)
    );
  }

  private normalizePaymentStatus(value: unknown): PaymentStatus | undefined {
    if (!value) return undefined;
    const map: Record<string, PaymentStatus> = {
      done: PaymentStatus.PAID,
      paid: PaymentStatus.PAID,
      pending: PaymentStatus.PENDING,
      partially_paid: PaymentStatus.PARTIALLY_PAID,
      partial: PaymentStatus.PARTIALLY_PAID,
      refunded: PaymentStatus.REFUNDED,
      not_applicable: PaymentStatus.NOT_APPLICABLE,
      na: PaymentStatus.NOT_APPLICABLE,
      n_a: PaymentStatus.NOT_APPLICABLE,
    };
    return (
      map[String(value).toLowerCase()] ??
      (Object.values(PaymentStatus).includes(value as PaymentStatus)
        ? (value as PaymentStatus)
        : undefined)
    );
  }

  private resolveDateRange(
    params: Record<string, unknown>,
  ): { start: Date; end: Date } | null {
    if (!params.date) return null;
    const d = new Date(String(params.date));
    if (Number.isNaN(d.getTime())) return null;
    const start = new Date(d);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }
}
