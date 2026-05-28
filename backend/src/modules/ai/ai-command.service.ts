import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import OpenAI from 'openai';
import { Booking, BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { SchedulingSlot, SlotStatus } from '../schedule/entities/scheduling-slot.entity.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import { AgentType } from '../../engine/agent/interfaces/agent.interfaces.js';
import { CommandOrchestrationService, OrchestrationResult } from './command-orchestration.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  todayDisplay,
  toIsoDay,
  parseDateInput,
} from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import {
  resolveEmployees,
  resolveServices,
  resolveDateRange,
  resolveAutoExecute,
} from './ai-orchestration.helpers.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { shouldValidateAction } from './command-completion.validator.js';
import { CommandResult } from './command-completion.types.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiEventsService } from './ai-events.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  CustomerService,
  type CustomerInsightMetric,
} from '../customer/customer.service.js';
import {
  runHeuristicIntentDetection,
  resolveAppointmentMetric,
  resolveBookingMetric,
  resolveCustomerMetric,
  resolveServiceMetric,
  resolveStaffMetric,
  extractLimitFromPrompt,
  type ServiceInsightMetric,
  type StaffInsightMetric,
} from './ai-intent-heuristics.js';

export type { CommandResult };

interface ParsedServiceDraft {
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency: string;
}

const INTENT_SCHEMA = `You are the Orchestrix operational AI — an orchestration layer for service businesses.
Given a user's natural-language command and the available business data, classify the intent
and extract structured parameters. Return a JSON object with:

{
  "action": "create_booking" | "create_service" | "create_services" | "cancel_bookings" | "bulk_smart_cancel" | "fill_slot_from_waitlist" | "list_bookings" | "show_appointments" | "check_availability" | "reschedule_booking" | "summarize_day" | "summarize_bookings" | "analyze_appointments" | "analyze_services" | "summarize_staff" | "lookup_customer" | "list_services" | "list_employees" | "list_templates" | "optimize_schedule" | "fill_unused_slots" | "list_schedule_gaps" | "apply_schedule" | "block_schedule" | "create_direct_schedule" | "assign_employee_services" | "summarize_utilization" | "summarize_customers" | "setup_week_schedule" | "resolve_conflicts" | "reassign_cancelled" | "unknown",
  "params": {
    "employeeName": "string or null — one service provider",
    "employeeNames": ["string"] or null — multiple providers,
    "allProviders": boolean or null — true when user says all providers/everyone/all staff,
    "templateName": "string or null — schedule template name for apply_schedule",
    "customerName": "string or null",
    "serviceName": "string or null — single service (for create_booking or create_service name)",
    "serviceNames": ["string"] or null — one or more service types to filter (for cancel_bookings / list_bookings), e.g. [\"hairdrying\", \"hairstyle\"],
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
    "currency": "string or null — ISO currency code (create_service), default USD",
    "date": "DD_MM_YYYY or null — the date referenced (resolve relative dates like 'tomorrow' from today's date)",
    "dateFrom": "DD_MM_YYYY or null — start of range if a range is mentioned",
    "dateTo": "DD_MM_YYYY or null — end of range",
    "reason": "string or null — reason given for cancellation or note",
    "notes": "string or null — booking notes or description",
    "timeSlot": "HH:MM in 24h format or null — appointment start time (e.g. 09:00, 14:30)",
    "timeFrom": "HH:MM or null — start of daily window for fill/optimize commands (e.g. 09:00)",
    "timeTo": "HH:MM or null — end of daily window for fill/optimize commands (e.g. 19:00)",
    "blockFullDay": boolean or null — true when blocking entire day(s),
    "weeksCount": number or null — repeat weeks for repetitive blocks,
    "applyDays": [0-6] or null — weekdays (0=Sun) for template apply or repetitive blocks,
    "repeatWeeksCount": number or null — template apply repeat weeks,
    "periods": [{"startTime":"HH:MM","endTime":"HH:MM","type":"service_block|unavailable_block","serviceNames":["string"],"label":"string"}] or null — for create_direct_schedule,
    "bookingId": "string or null — if a specific booking ID is mentioned",
    "customerMetric": "most_no_shows | most_bookings | most_cancellations | at_risk | high_no_show | vip | top_spenders | new_customers | overview | null — for summarize_customers",
    "appointmentMetric": "most_expensive | longest | shortest | earliest | latest | null — for analyze_appointments",
    "bookingMetric": "count | revenue | busiest_provider | cancelled | no_shows | unpaid | upcoming | confirmed | pending | completed | overview | null — for summarize_bookings",
    "statusFilter": "cancelled | no_show | confirmed | pending | completed | in_progress | null — filter appointments by status",
    "serviceMetric": "most_booked | top_revenue | least_booked | overview | null — for analyze_services",
    "staffMetric": "busiest | most_revenue | most_bookings | overview | null — for summarize_staff",
    "limit": number or null — max rows to list (default 5)
  },
  "reasoning": "one sentence explaining your interpretation",
  "confidence": number from 0.0 to 1.0 — how certain you are about action and extracted params
}

Rules:
- Always resolve relative dates (today, tomorrow, next Monday, etc.) from the provided current date.
- If the user says "all appointments" or "all bookings", that means every booking matching the filters.
- Extract names exactly as mentioned. The system will fuzzy-match them to real entities.
- For cancel_bookings, filter by service type when mentioned — use serviceNames with each service listed separately (e.g. "hairdrying / hairstyle" → [\"hairdrying\", \"hairstyle\"]).
- cancel_bookings can combine employeeName + serviceNames + date to cancel only matching appointments.
- If the user mentions a reason/note for cancellation (e.g. "he is sick"), put it in "reason".
- For new appointments (book, schedule, create appointment), use action "create_booking".
- create_booking requires employeeName, serviceName, date, and timeSlot at minimum.
- For adding a new service type to the catalog (add service, create service, new offering), use action "create_service" for ONE service, or "create_services" for TWO OR MORE.
- create_service requires serviceName, durationMinutes, and price at minimum. Extract duration from phrases like "60 minutes" or "1 hour" (60). Extract price from "$50", "50 USD", etc.
- create_services requires a "services" array — each entry needs serviceName, durationMinutes, and price. Use when the user lists multiple services, paste a menu, or says "add these services".
- Example bulk: "Add services: facemassage 60min $50, haircut 30min $25, manicure 45min $40" → action create_services with services=[{serviceName:"facemassage",durationMinutes:60,price:50}, ...].
- Do not use create_service when booking an appointment — that is create_booking.
- Use "show_appointments" or "list_bookings" when the user wants to view/display/see existing appointments or bookings for a day — e.g. "show Gevorg's appointments on Friday", "what appointments does Maria have tomorrow".
- Use "check_availability" when the user asks about available slots, open times, schedule blocks, what services can be booked, or availability on a day — e.g. "which slots are available for Gevorg on 30_06_2026", "what is Gevorg's schedule on Friday". Always set employeeName and date when mentioned.
- analyze_appointments: READ-ONLY — find extreme appointments for a day (most expensive, longest, shortest, earliest, latest). Use for "which appointment is the most expensive today", "longest appointment tomorrow". Set date (default today). NOT the same as listing all appointments.
- summarize_bookings: READ-ONLY booking analytics — counts, revenue, busiest provider, cancelled/no-show/unpaid totals. Use for "how many appointments today", "total revenue this week", "who is the busiest provider today", "how many cancelled today". NOT for listing individual appointments (use show_appointments) or utilization gaps (use summarize_utilization).
- show_appointments / list_bookings: set employeeName when a specific provider is mentioned; leave null for all providers. Always set date when mentioned (required for a meaningful day view).
- optimize_schedule / fill_unused_slots: fill_unused_slots creates schedule service periods (not bookings). Supports multiple providers, date ranges, time windows. For two or more providers use employeeNames array, e.g. ["Gevorg Gasparyan", "Mary Torgomyan"], or employeeName "Gevorg and Mary".
- list_schedule_gaps: READ-ONLY — list open/unfilled time windows per day for specific provider(s). Use when user asks "which days have gaps", "exact days with gaps", "show gaps by day", or follow-ups after a utilization summary. Requires employeeName (or allProviders) and a date range. Inherit dateFrom/dateTo from session when omitted.
- summarize_utilization: team-level utilization percentages for a date range — NOT per-day gap detail. Do not use for "which days" or "show gaps" questions.
- summarize_customers: READ-ONLY customer CRM insights — rankings and segments. Use for "which customer has the most no-shows", "at-risk customers", "top VIPs", "who books the most", "top 10 customers who paid the most", "new customers", "most cancellations". Set customerMetric when clear; set limit from "top N" (default 5).
- list_services: READ-ONLY service catalog — list offerings or look up price/duration. Use for "what services do we offer", "how much is facemassage", "show our service menu". NOT for adding services (use create_service).
- analyze_services: READ-ONLY — most booked / top revenue / least popular services for a date range.
- summarize_staff: READ-ONLY — provider rankings (busiest, most revenue, most bookings) for a date range.
- lookup_customer: READ-ONLY — single customer profile, last visit, appointment history snippet. Requires customerName.
- list_employees: READ-ONLY — list active providers/team members.
- list_templates: READ-ONLY — list schedule template names.
- show_appointments respects statusFilter for cancelled/no-show/confirmed views. Inherit todayOnly and page statusFilter from session context.
- block_schedule: block time or full days for provider(s) or all providers. Creates block schedules.
- create_direct_schedule: set/replace one provider's schedule for a specific day with explicit periods.
- assign_employee_services: assign services from catalog to a provider.
- apply_schedule: apply a schedule template to provider(s) for a date range or "this week". Set templateName when mentioned.
- setup_week_schedule: apply templates + fill gaps for the team this week (orchestration combo).
- bulk_smart_cancel: cancel bookings AND notify customers AND propose waitlist recovery (use when user mentions notify/waitlist/rebook).
- fill_slot_from_waitlist: fill a specific cancelled/freed slot from waitlist (employee + date + timeSlot).
- resolve_conflicts: staff/scheduling conflicts, overlapping appointments, double-booked providers.
- reassign_cancelled: recover from cancellations, rebook freed slots, reassign cancelled appointments.
- Mutating actions compile into workflow plans — they do not execute directly.
- If you cannot determine the action, use "unknown".
- Multi-turn conversation: read prior messages and Active session context. Follow-up commands often omit provider, date, or customer — inherit them unless the user clearly switches topic.
- Example follow-up: after utilization summary for this week, "which exact days does Gevorg have gaps" → action list_schedule_gaps, employeeName="Gevorg Gasparyan", inherit dateFrom/dateTo from session.
- Example follow-up: after list_schedule_gaps or summarize_utilization, "fill those gaps" / "fill them with his services" → action fill_unused_slots, inherit employeeName, dateFrom/dateTo, timeFrom/timeTo from session.
- Example follow-up: after "how many appointments today", "who is the busiest" → action summarize_bookings, bookingMetric="busiest_provider", inherit date from session.
- Example follow-up: after "available slots for Gevorg on 30_06_2026", the message "book facemassage at 16:00" → action create_booking, employeeName="Gevorg Gasparyan" (or "Gevorg"), date="30_06_2026", serviceName="facemassage", timeSlot="16:00".
- Dates may appear as DD_MM_YYYY or DD/MM/YYYY — normalize to DD_MM_YYYY in params.`;

export interface CommandSessionOptions {
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: Record<string, any>;
}

@Injectable()
export class AiCommandService {
  private readonly logger = new Logger(AiCommandService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(SchedulingPeriod) private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
    @InjectRepository(ScheduleTemplate) private templateRepo: Repository<ScheduleTemplate>,
    private orchestration: CommandOrchestrationService,
    private planBuilder: OperationalPlanBuilderService,
    private scheduleHandlers: AiScheduleHandlersService,
    private schedulingEngine: SchedulingEngineService,
    private completionPipeline: CommandCompletionPipelineService,
    private openAi: OpenAiGatewayService,
    private aiEvents: AiEventsService,
    private decomposition: IntentDecompositionService,
    private aiSettings: AiSettingsService,
    private customerService: CustomerService,
  ) {}

  async approveTask(taskId: string, userId: string, businessId?: string): Promise<CommandResult> {
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
        summary: 'AI is not configured. Add an OpenAI API key in Settings → API Keys, or contact your platform administrator.',
        details: {},
      };
    }

    const [employees, services, customers, templates] = await Promise.all([
      this.employeeRepo.find({ where: { businessId, isActive: true } }),
      this.serviceRepo.find({ where: { businessId } }),
      this.customerRepo.find({ where: { businessId, isActive: true } }),
      this.templateRepo.find({ where: { businessId, isDeleted: false }, order: { name: 'ASC' } }),
    ]);

    const catalog = { employees, services, customers, templates };
    const aiConfig = await this.aiSettings.getSettings(businessId);

    const playbook = this.aiSettings.matchPlaybook(aiConfig, prompt);
    const effectivePrompt = playbook ? playbook.prompt : prompt;

    if (this.decomposition.isCompoundPrompt(effectivePrompt)) {
      const subIntents = await this.decomposition.decompose(businessId, userId, effectivePrompt);
      if (subIntents.length > 1) {
        return this.executeCompoundIntents(
          businessId,
          effectivePrompt,
          userId,
          session,
          subIntents,
          catalog,
          aiConfig.confidence,
        );
      }
    }

    const contextBlock = `Current date: ${todayDisplay()} (format DD_MM_YYYY, times in 24h HH:mm)
Available employees: ${employees.map((e) => `${e.name} (id: ${e.id})`).join(', ')}
Available services: ${services.map((s) => `${s.name} (id: ${s.id})`).join(', ')}
Available customers: ${customers.map((c) => `${c.name} (id: ${c.id})`).join(', ')}
Schedule templates: ${templates.map((t) => t.name).join(', ') || 'none'}`;

    const parsed =
      runHeuristicIntentDetection({
        prompt: effectivePrompt,
        sessionContext: session?.context,
        employees,
        customers,
        services,
        templates,
      }) ??
      (await this.classifyIntent(
        businessId,
        userId,
        effectivePrompt,
        contextBlock,
        session?.history,
        session?.context,
      ));
    if (!parsed) {
      return { success: false, action: 'error', summary: 'Failed to understand the command. Please try rephrasing.', details: {} };
    }

    parsed.params = this.completionPipeline.mergeSessionContext(parsed.params, session?.context);
    this.enrichMultiEmployeeFromPrompt(effectivePrompt, parsed.params, employees);

    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.75;

    this.logger.log(`AI classified action="${parsed.action}" confidence=${confidence} — ${parsed.reasoning}`);

    this.completionPipeline.normalizeDateParams(parsed.params);

    const resolved = this.completionPipeline.resolve(businessId, effectivePrompt, parsed, catalog);
    const pipelineTrace = [
      this.completionPipeline.trace('classify', parsed.action, parsed.reasoning),
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
        const clarify = this.completionPipeline.toClarifyResult(resolved, validation);
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
      'create_booking', 'create_service', 'create_services', 'cancel_bookings',
      'bulk_smart_cancel', 'fill_slot_from_waitlist', 'reschedule_booking',
      'fill_unused_slots', 'apply_schedule', 'block_schedule', 'setup_week_schedule',
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

    const autoExecuteFlag = resolveAutoExecute({
      action: parsed.action,
      stepCount: 1,
      providerCount: 1,
      confidence,
      thresholds: aiConfig.confidence,
    });

    void autoExecuteFlag;

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
        );
        break;
      case 'create_service':
        if (Array.isArray(params.services) && params.services.length > 1) {
          result = await this.handleCreateServices(businessId, params, services, userId);
        } else {
          result = await this.handleCreateService(businessId, params, services, userId);
        }
        break;
      case 'create_services':
        result = await this.handleCreateServices(businessId, params, services, userId);
        break;
      case 'cancel_bookings':
        if (/notify|waitlist|rebook|customer/i.test(prompt)) {
          result = await this.handleBulkSmartCancel(
            businessId,
            params,
            services,
            employeeId,
            userId,
          );
        } else {
          result = await this.handleCancelBookings(
            businessId,
            params,
            services,
            employeeId,
            userId,
          );
        }
        break;
      case 'bulk_smart_cancel':
        result = await this.handleBulkSmartCancel(
          businessId,
          params,
          services,
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
        result = await this.handleSummarizeDay(businessId, params, employeeId, resolvedEmployee?.name);
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
          prompt,
          params,
          employeeId,
          resolvedEmployee?.name,
        );
        break;
      case 'list_services':
        result = this.handleListServices(services, params, prompt);
        break;
      case 'analyze_services':
        result = await this.handleAnalyzeServices(businessId, prompt, params);
        break;
      case 'summarize_staff':
        result = await this.handleSummarizeStaff(businessId, prompt, params, employees);
        break;
      case 'lookup_customer':
        result = await this.handleLookupCustomer(businessId, params, customers);
        break;
      case 'list_employees':
        result = this.handleListEmployees(employees, params);
        break;
      case 'list_templates':
        result = this.handleListTemplates(templates);
        break;
      case 'fill_unused_slots':
        result = await this.scheduleHandlers.handleFillScheduleGaps(
          businessId,
          prompt,
          params,
          employees,
          services,
          userId,
        );
        break;
      case 'list_schedule_gaps':
        result = await this.scheduleHandlers.handleListScheduleGaps(
          businessId,
          prompt,
          params,
          employees,
        );
        break;
      case 'apply_schedule':
        result = await this.scheduleHandlers.handleApplySchedule(
          businessId,
          prompt,
          params,
          employees,
          userId,
        );
        break;
      case 'block_schedule':
        result = await this.scheduleHandlers.handleBlockSchedule(
          businessId,
          prompt,
          params,
          employees,
          userId,
        );
        break;
      case 'create_direct_schedule':
        result = await this.scheduleHandlers.handleCreateDirectSchedule(
          businessId,
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
        result = await this.handleSummarizeUtilization(businessId, prompt, params, employees);
        break;
      case 'summarize_customers':
        result = await this.handleSummarizeCustomers(businessId, prompt, params);
        break;
      case 'setup_week_schedule':
        result = await this.scheduleHandlers.handleTemplateCascade(
          businessId,
          prompt,
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
            intent: prompt,
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
            intent: prompt,
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
            intent: prompt,
            agentType: AgentType.CANCELLATION_RECOVERY,
            userId,
            date: params.date,
            employeeId,
          }),
        );
        break;
      case 'reschedule_booking':
        result = await this.handleRescheduleBooking(businessId, params, employeeId, userId);
        break;
      default:
        result = {
          success: false,
          action: 'unknown',
          summary: `I understood: "${parsed.reasoning}" but I don't know how to execute that action yet. Supported: book, add service(s), cancel, show appointments, optimize schedule, fill slots, resolve conflicts, reassign cancelled, check availability, summarize day.`,
          details: { parsed },
        };
    }

    result.details = { ...result.details, pipelineTrace, confidence, playbook: playbook?.name ?? null };
    const final = this.completionPipeline.attachSessionToResult(result, resolved);
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

    const lower = prompt.toLowerCase();
    const mentionsMultiple =
      /\bboth\b/i.test(prompt) ||
      /\band\b/i.test(prompt) ||
      /[,/]/.test(prompt);

    if (!mentionsMultiple) return;

    const matched: Employee[] = [];
    const seen = new Set<string>();
    for (const employee of employees) {
      if (lower.includes(employee.name.toLowerCase())) {
        if (!seen.has(employee.id)) {
          seen.add(employee.id);
          matched.push(employee);
        }
        continue;
      }
      const first = employee.name.split(/\s+/)[0];
      if (first.length >= 3 && new RegExp(`\\b${first.toLowerCase()}\\b`).test(lower)) {
        if (!seen.has(employee.id)) {
          seen.add(employee.id);
          matched.push(employee);
        }
      }
    }

    if (matched.length > 1) {
      params.employeeNames = matched.map((e) => e.name);
      params.employeeName = null;
    }
  }

  private async classifyIntent(
    businessId: string,
    userId: string | undefined,
    prompt: string,
    context: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, any>,
  ): Promise<{ action: string; params: any; reasoning: string; confidence?: number } | null> {
    const sessionBlock =
      sessionContext && Object.values(sessionContext).some((v) => v != null && v !== '')
        ? `\nActive session context (inherit in params when not overridden by the latest message):\n${JSON.stringify(sessionContext, null, 2)}`
        : '';

    const routeHintBlock = sessionContext?.routeHint
      ? `\nPage context hint (prefer actions relevant to the current dashboard page):\n${sessionContext.routeHint}`
      : '';

    const historyMessages = (history ?? [])
      .slice(-10)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${INTENT_SCHEMA}\n\n${context}${sessionBlock}${routeHintBlock}`,
      },
      ...historyMessages,
      { role: 'user', content: prompt },
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

  private resolveEmployee(employees: Employee[], name: string): Employee | undefined {
    return this.fuzzyMatchByName(employees, name);
  }

  private resolveService(services: Service[], name: string): Service | undefined {
    return this.fuzzyMatchByName(services, name);
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

  private resolveCustomer(customers: Customer[], name: string): Customer | undefined {
    return this.fuzzyMatchByName(customers, name);
  }

  private fuzzyMatchByName<T extends { name: string }>(items: T[], name: string): T | undefined {
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
  ): Promise<CommandResult> {
    const resolvedEmployee = params.employeeId
      ? employees.find((e) => e.id === params.employeeId)
      : params.employeeName
        ? this.resolveEmployee(employees, params.employeeName)
        : undefined;
    const service = params.serviceId
      ? services.find((s) => s.id === params.serviceId)
      : params.serviceName
        ? this.resolveService(services, params.serviceName)
        : undefined;
    const customer = params.customerId
      ? customers.find((c) => c.id === params.customerId)
      : params.customerName
        ? this.resolveCustomer(customers, params.customerName)
        : undefined;

    if (!resolvedEmployee || !service || !params.date || !params.timeSlot) {
      return {
        success: false,
        action: 'create_booking',
        summary: 'Cannot book appointment — missing required details.',
        details: { params },
      };
    }

    const snappedTime = this.snapTo10min(params.timeSlot);
    const startTime = `${params.date}T${snappedTime}:00.000Z`;

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
      timeSlot: snappedTime,
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

  private async handleAssignEmployeeServices(
    businessId: string,
    params: any,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const targets = resolveEmployees(employees, params);
    if (targets.length !== 1) {
      return {
        success: false,
        action: 'assign_employee_services',
        summary: 'Specify one service provider to assign services to.',
        details: { params },
      };
    }

    const matched = resolveServices(services, params);
    if (matched.length === 0) {
      return {
        success: false,
        action: 'assign_employee_services',
        summary: 'Specify which service(s) to assign.',
        details: { availableServices: services.map((s) => s.name) },
      };
    }

    const plan = this.planBuilder.buildAssignEmployeeServicesPlan({
      businessId,
      employeeId: targets[0].id,
      employeeName: targets[0].name,
      serviceIds: matched.map((s) => s.id),
      serviceNames: matched.map((s) => s.name),
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
    const range = resolveDateRange(params, prompt) ?? (() => {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    })();

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);

    const util = await Promise.all(
      employees.map(async (e) => ({
        employeeName: e.name,
        ...(await this.schedulingEngine.getEmployeeUtilization(e.id, start, end)),
      })),
    );

    const sorted = [...util].sort((a, b) => (a.utilizationPercent ?? 0) - (b.utilizationPercent ?? 0));
    const lines = sorted.map(
      (u) => `• ${u.employeeName}: ${u.utilizationPercent ?? 0}% utilized (${u.bookedMinutes ?? 0}/${u.totalMinutes ?? 0} min)`,
    );

    return {
      success: true,
      action: 'summarize_utilization',
      summary: [`Utilization ${range.start} → ${range.end}:`, ...lines].join('\n'),
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
        ? Math.min(params.limit, 20)
        : extractLimitFromPrompt(prompt);

    const insights = await this.customerService.getCustomerInsights(businessId, metric, limit);
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

    const lines: string[] = [metricTitles[metric] + (metric === 'top_spenders' ? ` (top ${limit})` : '') + ':'];

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
        if (metric === 'most_cancellations') detail = `${cancelled} cancellation(s)`;
        if (metric === 'most_bookings') detail = `${row.stats.total} appointment(s)`;
        if (metric === 'at_risk' && row.stats.lastBookingAt) {
          detail = `last visit ${formatDateDisplay(row.stats.lastBookingAt)}, ${completed} completed`;
        }
        if (metric === 'vip') detail = `${completed} completed, ${row.stats.total} total`;
        if (metric === 'top_spenders') {
          const currency = row.currency ?? 'USD';
          detail = `${currency} ${Number(row.paidTotal ?? 0).toFixed(2)} from ${row.paidCount ?? 0} paid appt(s)`;
        }
        if (metric === 'new_customers') {
          detail = row.stats.total === 0 ? 'no appointments yet' : `${row.stats.total} appointment(s)`;
        }
        lines.push(`• ${row.name}: ${detail}${metric === 'top_spenders' ? '' : ` · segment: ${row.segment}`}`);
      }
    }

    return {
      success: true,
      action: 'summarize_customers',
      summary: lines.join('\n'),
      details: { metric, rows, summary },
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
      where: where as any,
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
    const confirmed = filtered.filter((b) => b.status === BookingStatus.CONFIRMED);
    const pending = filtered.filter((b) => b.status === BookingStatus.PENDING);
    const completed = filtered.filter((b) => b.status === BookingStatus.COMPLETED);

    const active = filtered.filter((b) => b.status !== BookingStatus.CANCELLED);
    const cancelled = filtered.filter((b) => b.status === BookingStatus.CANCELLED);
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
    const currency = revenueBookings.find((b) => b.service?.currency)?.service?.currency ?? 'USD';

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

    const lines: string[] = [`${metricTitles[metric]} for ${scopeLabel} on ${rangeLabel}${statusNote}:`];

    switch (metric) {
      case 'count':
        lines.push(`• ${active.length} active appointment(s)`);
        if (!statusFilter) {
          lines.push(`• ${cancelled.length} cancelled · ${noShows.length} no-show(s)`);
        }
        break;
      case 'revenue':
        lines.push(`• ${currency} ${totalRevenue.toFixed(2)} from ${revenueBookings.length} appointment(s)`);
        break;
      case 'busiest_provider':
        if (busiest.length === 0) {
          lines.push('• No active appointments in this period.');
        } else {
          const [topName, topCount] = busiest[0];
          const tied = busiest.filter(([, c]) => c === topCount);
          lines.push(`• ${topName}: ${topCount} appointment(s)`);
          if (tied.length > 1) {
            lines.push(`• Tied with: ${tied.slice(1).map(([n, c]) => `${n} (${c})`).join(', ')}`);
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
        busiestProvider: busiest.length > 0 ? { name: busiest[0][0], count: busiest[0][1] } : null,
        byProvider: Object.fromEntries(busiest),
      },
    };
  }

  private handleListServices(
    services: Service[],
    params: Record<string, any>,
    prompt: string,
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
        ].filter(Boolean).join('\n'),
        details: {
          services: [{
            id: target.id,
            name: target.name,
            durationMinutes: target.durationMinutes,
            bufferMinutes: target.bufferMinutes,
            price: Number(target.price),
            currency,
            description: target.description,
          }],
        },
      };
    }

    if (services.length === 0) {
      return {
        success: true,
        action: 'list_services',
        summary: 'No services in catalog yet. Add one with "Add service facemassage 60min $50".',
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
        status: Not(BookingStatus.CANCELLED) as any,
      },
      relations: { service: true },
    });

    const byService = new Map<string, { name: string; count: number; revenue: number; currency: string }>();
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

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(start, end),
        status: Not(BookingStatus.CANCELLED) as any,
      },
      relations: { employee: true, service: true },
    });

    const byEmployee = new Map<string, { name: string; count: number; revenue: number; currency: string }>();
    for (const e of employees) {
      byEmployee.set(e.id, { name: e.name, count: 0, revenue: 0, currency: 'USD' });
    }
    for (const b of bookings) {
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

    const detail = await this.customerService.getCustomerDetail(businessId, customer.id);
    const { stats, appointments } = detail;
    const lastAppt = appointments[0];
    const upcoming = appointments.filter(
      (a) => new Date(a.startTime) > new Date() && a.status !== 'cancelled',
    ).length;

    const lines = [
      `Customer: ${detail.customer.name}`,
      `• Segment: ${detail.customer.segment}${detail.customer.isVip ? ' (VIP)' : ''}`,
      `• Total appointments: ${stats.total} · No-shows: ${stats.noShowCount} · Upcoming: ${upcoming}`,
    ];
    if (stats.lastBookingAt) {
      lines.push(`• Last visit: ${formatDateDisplay(stats.lastBookingAt)}`);
    }
    if (lastAppt) {
      lines.push(
        `• Most recent: ${formatDateDisplay(lastAppt.startTime)} ${formatTimeDisplay(lastAppt.startTime)} — ${lastAppt.service?.name ?? 'Service'} (${lastAppt.status})`,
      );
    }
    if (detail.customer.email) lines.push(`• Email: ${detail.customer.email}`);
    if (detail.customer.phone) lines.push(`• Phone: ${detail.customer.phone}`);

    return {
      success: true,
      action: 'lookup_customer',
      summary: lines.join('\n'),
      details: { customer: detail.customer, stats, recentAppointments: appointments.slice(0, 5) },
    };
  }

  private handleListEmployees(employees: Employee[], params: Record<string, any>): CommandResult {
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
        summary: 'No schedule templates yet. Create one in Schedule → Templates.',
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
    return Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / 60_000);
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
        summary: 'Specify what to analyze: most expensive, longest, shortest, earliest, or latest appointment.',
        details: { params },
      };
    }

    const range = resolveDateRange(params, prompt);
    const isoDay = range?.start ?? params.date ?? new Date().toISOString().split('T')[0];
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
      where: where as any,
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
        const priced = active.filter((b) => b.service && Number(b.service.price) >= 0);
        if (priced.length === 0) {
          return {
            success: true,
            action: 'analyze_appointments',
            summary: `No priced appointments found for ${scopeLabel} on ${displayDay}.`,
            details: { metric, date: displayDay, count: 0 },
          };
        }
        const maxPrice = Math.max(...priced.map((b) => Number(b.service!.price)));
        matches = priced.filter((b) => Number(b.service!.price) === maxPrice);
        break;
      }
      case 'longest': {
        const maxDuration = Math.max(...active.map((b) => this.bookingDurationMinutes(b)));
        matches = active.filter((b) => this.bookingDurationMinutes(b) === maxDuration);
        break;
      }
      case 'shortest': {
        const minDuration = Math.min(...active.map((b) => this.bookingDurationMinutes(b)));
        matches = active.filter((b) => this.bookingDurationMinutes(b) === minDuration);
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
    params: any,
    services: Service[],
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const matchedServices = this.resolveServices(services, params);
    const where: any = {
      businessId,
      status: Not(In([BookingStatus.CANCELLED, BookingStatus.COMPLETED])) as any,
    };

    if (employeeId) where.employeeId = employeeId;
    if (matchedServices.length > 0) {
      where.serviceId = In(matchedServices.map((s) => s.id));
    }

    if (params.date) {
      const d = new Date(params.date);
      const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);
      where.startTime = Between(dayStart, dayEnd);
    } else if (params.dateFrom && params.dateTo) {
      const from = new Date(params.dateFrom); from.setUTCHours(0, 0, 0, 0);
      const to = new Date(params.dateTo); to.setUTCHours(23, 59, 59, 999);
      where.startTime = Between(from, to);
    }

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
    });

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

    const plan = this.planBuilder.buildBulkSmartCancelPlan(
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
        autoExecute: bookings.length <= 3,
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
      const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);
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
        summary: 'No cancelled slot found to fill. Specify provider, date, and time (e.g. "Fill cancelled 14:00 slot from waitlist").',
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
        summary: 'No waitlist customers found. Tag customers with "waitlist" in CRM.',
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

  private async executeCompoundIntents(
    businessId: string,
    prompt: string,
    userId: string | undefined,
    session: CommandSessionOptions | undefined,
    subIntents: Array<{ action: string; params: Record<string, any>; reasoning: string }>,
    catalog: {
      employees: Employee[];
      services: Service[];
      customers: Customer[];
      templates: ScheduleTemplate[];
    },
    confidenceThresholds: { low: number; high: number },
  ): Promise<CommandResult> {
    const plans: AgentPlan[] = [];
    const pipelineTrace = [
      this.completionPipeline.trace('classify', 'compound_intent', `${subIntents.length} sub-intent(s)`),
    ];

    for (const sub of subIntents) {
      const parsed = {
        action: sub.action,
        params: this.completionPipeline.mergeSessionContext(sub.params, session?.context),
        reasoning: sub.reasoning,
      };
      this.completionPipeline.normalizeDateParams(parsed.params);
      const resolved = this.completionPipeline.resolve(businessId, prompt, parsed, catalog);

      if (shouldValidateAction(parsed.action)) {
        const validation = this.completionPipeline.validate(resolved);
        if (!validation.ok) {
          const clarify = this.completionPipeline.toClarifyResult(resolved, validation);
          clarify.details.pipelineTrace = pipelineTrace;
          clarify.details.compoundStep = parsed.action;
          return clarify;
        }
      }

      const plan = await this.buildPlanForResolvedIntent(
        businessId,
        prompt,
        parsed.action,
        resolved.enrichedParams,
        resolved.entities.employeeId,
        catalog,
        userId,
      );

      if (plan) plans.push(plan);
    }

    if (plans.length === 0) {
      return {
        success: false,
        action: 'compound_intent',
        summary: 'Could not build a plan from the compound command.',
        details: { subIntents },
      };
    }

    const merged = this.planBuilder.mergePlans(businessId, 'compound_intent', plans);
    const providerCount = catalog.employees.length;

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
  ): Promise<AgentPlan | null> {
    switch (action) {
      case 'setup_week_schedule': {
        const cascadeResult = await this.scheduleHandlers.prepareTemplateCascadePlan(
          businessId,
          prompt,
          params,
          catalog.employees,
          catalog.services,
          userId,
        );
        return cascadeResult;
      }
      case 'apply_schedule':
      case 'fill_unused_slots':
      case 'block_schedule':
      case 'create_direct_schedule':
      case 'assign_employee_services':
      case 'bulk_smart_cancel':
      case 'fill_slot_from_waitlist':
      case 'cancel_bookings':
      case 'reschedule_booking': {
        const handlerResult = await this.dispatchMutatingIntent(
          businessId,
          prompt,
          action === 'cancel_bookings' && /notify|waitlist|rebook/i.test(prompt)
            ? 'bulk_smart_cancel'
            : action,
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
      case 'bulk_smart_cancel': {
        if (options?.planOnly) {
          const bookings = await this.findBookingsForCancel(businessId, params, catalog.services, employeeId);
          if (!bookings.length) return { success: false, action, summary: '', details: {} };
          const plan = this.planBuilder.buildBulkSmartCancelPlan(
            businessId,
            bookings.map((b) => b.id),
            params.reason || 'Cancelled via AI',
            userId,
            { employeeName: params.employeeName, services: params.serviceNames },
          );
          return { success: true, action, summary: '', details: { plan } };
        }
        result = await this.handleBulkSmartCancel(businessId, params, catalog.services, employeeId, userId);
        break;
      }
      case 'fill_slot_from_waitlist':
        if (options?.planOnly) {
          const fillResult = await this.handleFillSlotFromWaitlist(businessId, params, employeeId, userId);
          return { ...fillResult, details: { plan: fillResult.details?.plan } };
        }
        result = await this.handleFillSlotFromWaitlist(businessId, params, employeeId, userId);
        break;
      default:
        result = { success: false, action, summary: 'Unsupported compound step', details: {} };
    }

    return result;
  }

  private async findBookingsForCancel(
    businessId: string,
    params: any,
    services: Service[],
    employeeId?: string,
  ) {
    const matchedServices = this.resolveServices(services, params);
    const where: any = {
      businessId,
      status: Not(In([BookingStatus.CANCELLED, BookingStatus.COMPLETED])) as any,
    };
    if (employeeId) where.employeeId = employeeId;
    if (matchedServices.length > 0) {
      where.serviceId = In(matchedServices.map((s) => s.id));
    }
    if (params.date) {
      const d = new Date(params.date);
      const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);
      where.startTime = Between(dayStart, dayEnd);
    }
    return this.bookingRepo.find({ where });
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
        details: { params, existingServiceId: existing.id, existingServiceName: existing.name },
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
        summary: 'Too many services in one request (max 25). Split into smaller batches.',
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
        skipped.push({ name: label || 'Unnamed', reason: parsed.errors.join(', ') });
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
        skipped.push({ name: draft.name, reason: `Already exists as "${existing.name}"` });
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
    result.details = { ...result.details, skipped, createdCount: toCreate.length };

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
    const durationMinutes = this.parseMinutes(raw.durationMinutes ?? raw.duration);
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
    if (typeof value === 'number' && !Number.isNaN(value)) return Math.round(value);
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
    params: any,
    services: Service[],
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const matchedServices = this.resolveServices(services, params);
    const requestedServiceLabels = [
      ...(params.serviceNames ?? []),
      ...(params.serviceName && !params.serviceNames?.length ? [params.serviceName] : []),
    ].filter(Boolean);

    if (requestedServiceLabels.length > 0 && matchedServices.length === 0) {
      return {
        success: false,
        action: 'cancel_bookings',
        summary: `No matching service type(s) found for: ${requestedServiceLabels.join(', ')}. Available: ${services.map((s) => s.name).join(', ')}`,
        details: { requestedServiceLabels, availableServices: services.map((s) => s.name) },
      };
    }

    const where: any = {
      businessId,
      status: Not(In([BookingStatus.CANCELLED, BookingStatus.COMPLETED])) as any,
    };

    if (employeeId) where.employeeId = employeeId;
    if (matchedServices.length > 0) {
      where.serviceId = In(matchedServices.map((s) => s.id));
    }

    if (params.date) {
      const d = new Date(params.date);
      const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);
      where.startTime = Between(dayStart, dayEnd);
    } else if (params.dateFrom && params.dateTo) {
      const from = new Date(params.dateFrom); from.setUTCHours(0, 0, 0, 0);
      const to = new Date(params.dateTo); to.setUTCHours(23, 59, 59, 999);
      where.startTime = Between(from, to);
    }

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
    });

    if (bookings.length === 0) {
      const serviceFilter = matchedServices.length
        ? ` for service(s): ${matchedServices.map((s) => s.name).join(', ')}`
        : '';
      const empFilter = params.employeeName ? ` for ${params.employeeName}` : '';
      const dateFilter = params.date ? ` on ${formatDateDisplay(params.date)}` : '';
      return {
        success: true,
        action: 'cancel_bookings',
        summary: `No active bookings found${empFilter}${serviceFilter}${dateFilter}. Nothing to cancel.`,
        details: {
          matchedCount: 0,
          filters: {
            employee: params.employeeName ?? null,
            services: matchedServices.map((s) => s.name),
            date: params.date ? formatDateDisplay(params.date) : null,
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
      const providerPart = options.includeProvider ? ` | ${b.employee?.name || 'Unknown'}` : '';
      return `  • ${time} | ${b.service?.name || 'Service'} | ${b.customer?.name || 'Walk-in'}${providerPart} | ${b.status}`;
    });
  }

  private async handleListBookings(
    businessId: string,
    prompt: string,
    params: any,
    employeeId?: string,
    employeeName?: string,
  ): Promise<CommandResult> {
    const where: any = { businessId };
    if (employeeId) where.employeeId = employeeId;
    if (params.customerId) where.customerId = params.customerId;

    const range =
      resolveDateRange(params, prompt) ??
      (() => {
        const iso = params.date || new Date().toISOString().split('T')[0];
        return { start: iso, end: iso };
      })();

    const start = new Date(range.start);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setUTCHours(23, 59, 59, 999);
    where.startTime = Between(start, end);

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    const statusFilter = params.statusFilter as string | undefined;
    const scopedBookings = statusFilter
      ? bookings.filter((b) => b.status === statusFilter)
      : bookings;

    const rangeLabel =
      range.start === range.end
        ? formatDateDisplay(range.start)
        : `${formatDateDisplay(range.start)} → ${formatDateDisplay(range.end)}`;
    const scopeLabel = employeeName || 'all service providers';
    const customerLabel = params.customerName ? ` for ${params.customerName}` : '';
    const statusLabel = statusFilter ? ` (${statusFilter})` : '';

    const activeBookings = scopedBookings.filter((b) => b.status !== BookingStatus.CANCELLED);
    const cancelledBookings = scopedBookings.filter((b) => b.status === BookingStatus.CANCELLED);
    const displayBookings = statusFilter ? scopedBookings : activeBookings;

    let summaryBody: string;
    if (scopedBookings.length === 0) {
      summaryBody = `No appointments found for ${scopeLabel}${customerLabel} on ${rangeLabel}${statusLabel}.`;
    } else if (employeeId || params.customerId) {
      const lines = this.formatBookingLines(displayBookings);
      const cancelledNote =
        !statusFilter && cancelledBookings.length > 0
          ? `\n(${cancelledBookings.length} cancelled — hidden)`
          : '';
      summaryBody = [
        `${displayBookings.length} appointment(s) for ${scopeLabel}${customerLabel} on ${rangeLabel}${statusLabel}:${cancelledNote}`,
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
      for (const [name, providerBookings] of [...byProvider.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      )) {
        groupedLines.push(`\n${name} (${providerBookings.length}):`);
        groupedLines.push(...this.formatBookingLines(providerBookings));
      }

      const cancelledNote =
        !statusFilter && cancelledBookings.length > 0
          ? `\n(${cancelledBookings.length} cancelled across all providers — hidden)`
          : '';
      summaryBody = [
        `${displayBookings.length} appointment(s) for all service providers${customerLabel} on ${rangeLabel}${statusLabel}:${cancelledNote}`,
        ...groupedLines,
      ].join('\n');
    }

    return {
      success: true,
      action: 'show_appointments',
      summary: summaryBody,
      details: {
        count: scopedBookings.length,
        activeCount: activeBookings.length,
        cancelledCount: cancelledBookings.length,
        date: range.start === range.end ? formatDateDisplay(range.start) : null,
        range,
        statusFilter: statusFilter ?? null,
        customer: params.customerName ?? null,
        scope: employeeId ? 'provider' : params.customerId ? 'customer' : 'all_providers',
        employee: employeeName ?? null,
        bookings: scopedBookings.map((b) => ({
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

  private timesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA < endB && endA > startB;
  }

  private mergeOpenSlotRanges(
    slots: Array<{ startTime: Date; endTime: Date }>,
  ): Array<{ start: string; end: string }> {
    if (slots.length === 0) return [];

    const sorted = [...slots].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const merged: Array<{ start: Date; end: Date }> = [{ start: sorted[0].startTime, end: sorted[0].endTime }];

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

  private async handleCheckAvailability(
    businessId: string,
    params: any,
    employeeId?: string,
    employeeName?: string,
  ): Promise<CommandResult> {
    const isoDay = params.date || new Date().toISOString().split('T')[0];
    const displayDay = formatDateDisplay(isoDay);
    const d = new Date(isoDay);
    const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);

    const where: any = { businessId, startTime: Between(dayStart, dayEnd) as any };
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

    const serviceBlocks = periods.filter((p) => p.type === TemplatePeriodType.SERVICE_BLOCK);
    const nonService = periods.filter((p) => p.type !== TemplatePeriodType.SERVICE_BLOCK);

    const nameMap = await this.serviceNameMap(
      businessId,
      [
        ...periods.flatMap((p) => p.serviceIds ?? []),
        ...bookings.map((b) => b.serviceId).filter(Boolean),
      ],
    );

    const scopeLabel = employeeName || 'all service providers';

    if (periods.length === 0) {
      return {
        success: true,
        action: 'check_availability',
        summary: `No schedule applied for ${scopeLabel} on ${displayDay}.`,
        details: { date: displayDay, employee: employeeName ?? null, periods: [], bookings: [], openSlots: [] },
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
      bookings.length > 0
        ? this.formatBookingLines(bookings)
        : ['  (none)'];

    const openSlotRanges = this.mergeOpenSlotRanges(openSlots);
    const openSlotLines =
      openSlotRanges.length > 0
        ? openSlotRanges.map((r) => `• ${r.start}–${r.end}`)
        : ['  (none — all bookable time is taken or no micro-slots generated)'];

    const blockAvailabilityLines = serviceBlocks.map((block) => {
      const from = formatTimeDisplay(block.startTime);
      const to = formatTimeDisplay(block.endTime);
      const services = this.formatPeriodServices(block.serviceIds, nameMap);
      const blockBookings = bookings.filter((b) =>
        this.timesOverlap(block.startTime, block.endTime, b.startTime, b.endTime),
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
      `Available slots for ${scopeLabel} on ${displayDay}:`,
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
                (p.type === TemplatePeriodType.UNAVAILABLE_BLOCK ? 'Unavailable' : 'Blocked')
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
      this.handleListBookings(businessId, '', { ...params, date: isoDay }, employeeId, employeeName),
      this.handleCheckAvailability(businessId, { ...params, date: isoDay }, employeeId, employeeName),
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
        ...active.map((b: any) =>
          `    • ${formatTimeRangeDisplay(b.startTime, b.endTime)} | ${b.service || 'Service'} | ${b.customer || 'Walk-in'}${employeeName ? '' : ` | ${b.employee || 'Unknown'}`}`,
        ),
      ].filter(Boolean).join('\n'),
      details: {
        date: displayDay,
        scope: employeeId ? 'provider' : 'all_providers',
        employee: employeeName ?? null,
        schedule: availResult.details,
        bookings: bookingsResult.details,
      },
    };
  }

  private async handleRescheduleBooking(
    businessId: string,
    params: any,
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    let booking: Booking | null = null;

    if (params.bookingId) {
      booking = await this.bookingRepo.findOne({
        where: { id: params.bookingId, businessId },
        relations: { employee: true, service: true, customer: true },
      });
    } else if (params.customerName && (params.date || params.timeSlot)) {
      const customers = await this.customerRepo.find({ where: { businessId, isActive: true } });
      const customer = this.resolveCustomer(customers, params.customerName);
      if (customer) {
        const isoDay = params.date ? toIsoDay(params.date) : null;
        const bookings = await this.bookingRepo.find({
          where: {
            businessId,
            customerId: customer.id,
            ...(employeeId ? { employeeId } : {}),
            status: Not(BookingStatus.CANCELLED) as any,
          },
          relations: { employee: true, service: true, customer: true },
          order: { startTime: 'ASC' },
        });
        booking =
          bookings.find((b) => {
            if (isoDay && !b.startTime.toISOString().startsWith(isoDay)) return false;
            if (params.timeSlot) {
              const slot = this.snapTo10min(params.timeSlot);
              return formatTimeDisplay(b.startTime) === slot;
            }
            return true;
          }) ?? bookings[0] ?? null;
      }
    }

    if (!booking) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary: 'Could not find the booking to reschedule. Specify bookingId, or customer + date/time.',
        details: { params },
      };
    }

    if (!params.date && !params.timeSlot) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary: 'Specify the new date and/or time for the rescheduled booking.',
        details: { bookingId: booking.id },
      };
    }

    const isoDay = toIsoDay(params.date ?? booking.startTime.toISOString().split('T')[0]);
    const timeSlot = params.timeSlot ? this.snapTo10min(params.timeSlot) : formatTimeDisplay(booking.startTime);
    const startTime = `${isoDay}T${timeSlot}:00.000Z`;

    const plan = this.planBuilder.buildRescheduleBookingPlan({
      businessId,
      bookingId: booking.id,
      startTime,
      employeeId: employeeId ?? booking.employeeId,
      serviceId: booking.serviceId,
      userId,
      label: `Reschedule ${booking.customer?.name ?? 'walk-in'} — ${booking.service?.name} to ${formatDateDisplay(isoDay)} ${timeSlot}`,
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
