import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import OpenAI from 'openai';
import { Booking, BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Business } from '../business/entities/business.entity.js';
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
  getTodayDateKey,
  parseDateInput,
  buildUtcStartTimeFromDayAndTime,
} from '../../common/utils/date-format.util.js';
import { normalizeTime24, timeToMinutes } from '../../common/utils/time-format.util.js';
import { pickTimezone, addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import { SchedulingEngineService } from '../../engine/scheduling/scheduling-engine.service.js';
import {
  resolveEmployees,
  resolveServices,
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
  parseEarliestBookingTimeFromPrompt,
  sanitizeProviderScopeFromPrompt,
  inferDirectSchedulePeriods,
} from './ai-orchestration.helpers.js';
import { isWallClockSlotBookable } from '../../common/utils/timezone.util.js';
import { findScheduleGapsInWindow } from '../schedule/helpers/schedule-gap.helpers.js';
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
  isAnyProviderBookingPrompt,
  isFirstAvailableBookingPrompt,
  extractProviderFallbackFromPrompt,
  extractCustomerFromReschedulePrompt,
  extractProviderPossessiveFromReschedulePrompt,
  isBulkAllAppointmentsPrompt,
  normalizeBookingStatusValue,
  normalizePaymentStatusValue,
  extractBookingStatusFromPrompt,
  extractPaymentStatusFromPrompt,
  type ServiceInsightMetric,
  type StaffInsightMetric,
} from './ai-intent-heuristics.js';
import { normalizeMultilingualPrompt, multilingualHint } from './ai-prompt-i18n.js';
import { BookingCommandGraphService } from './booking-command-graph.service.js';
import { BookingSlotResolverService } from '../booking/booking-slot-resolver.service.js';
import { CommandComplexityRouterService } from './command-complexity-router.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { AiPromptSecurityService } from './ai-prompt-security.service.js';
import {
  clampReadDateRangeDays,
  MAX_AI_CUSTOMER_ROWS,
  MAX_AI_LIST_BOOKINGS,
  MAX_AI_READ_DATE_RANGE_DAYS,
} from './ai-prompt-security.util.js';
import { isIntentAllowed, normalizeActorRole } from './ai-capability.matrix.js';
import {
  buildExecutionConfirmationResult,
  isExecutionConfirmed,
} from './ai-execution-confirm.util.js';

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
  "action": "create_booking" | "create_service" | "create_services" | "cancel_bookings" | "update_bookings" | "bulk_smart_cancel" | "hide_appointments_from_calendar" | "unhide_appointments_from_calendar" | "fill_slot_from_waitlist" | "list_bookings" | "show_appointments" | "check_availability" | "reschedule_booking" | "summarize_day" | "summarize_bookings" | "analyze_appointments" | "analyze_services" | "summarize_staff" | "lookup_customer" | "summarize_waitlist" | "lookup_service_assignment" | "list_services" | "list_employees" | "list_templates" | "create_schedule_template" | "mark_no_shows" | "payment_sweep" | "day_replan" | "optimize_schedule" | "fill_unused_slots" | "list_schedule_gaps" | "apply_schedule" | "block_schedule" | "create_direct_schedule" | "clear_schedule" | "assign_employee_services" | "summarize_utilization" | "summarize_customers" | "setup_week_schedule" | "resolve_conflicts" | "reassign_cancelled" | "unknown",
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
    "date": "DD/MM/YYYY or null — for reschedule_booking: the NEW destination date (tomorrow, Friday, 31/05/2026). For other actions: the date referenced.",
    "dateFrom": "DD/MM/YYYY or null — start of range if a range is mentioned",
    "dateTo": "DD/MM/YYYY or null — end of range",
    "fromDate": "DD/MM/YYYY or null — for reschedule_booking only: current appointment date when identifying which booking to move",
    "fromTimeSlot": "HH:MM or null — for reschedule_booking only: current appointment start time when identifying which booking to move",
    "reason": "string or null — reason given for cancellation or note",
    "notes": "string or null — booking notes or description",
    "timeSlot": "HH:MM in 24h format or null — appointment start time (e.g. 09:00, 14:30)",
    "timeFrom": "HH:MM or null — start of a daily time window (fill/optimize, or cancel/list/hide when a range is given, e.g. 16:30)",
    "timeTo": "HH:MM or null — end of that window (e.g. 17:30 for 'between 16:30-17:30')",
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
- "Book the nearest time slot for {service} on any specialist" / "nearest available" / "ASAP" → same as first available (bookingFirstAvailable=true). Leave timeSlot null. For a named specialist only, set employeeName and bookingFirstAvailable=true without allProviders. Optional lower bound: "after 16:00" → set timeFrom="16:00" (earliest slot must be after current time and after that hour).
- bookingFirstAvailable without allProviders: pick earliest open slot for the named provider only. allProviders without bookingFirstAvailable still requires timeSlot unless the user gives one.
- For adding a new service type to the catalog (add service, create service, new offering), use action "create_service" for ONE service, or "create_services" for TWO OR MORE.
- create_service requires serviceName, durationMinutes, and price at minimum. Extract duration from phrases like "60 minutes" or "1 hour" (60). Extract price from "$50", "50 USD", etc.
- create_services requires a "services" array — each entry needs serviceName, durationMinutes, and price. Use when the user lists multiple services, paste a menu, or says "add these services".
- Example bulk: "Add services: facemassage 60min $50, haircut 30min $25, manicure 45min $40" → action create_services with services=[{serviceName:"facemassage",durationMinutes:60,price:50}, ...].
- Do not use create_service when booking an appointment — that is create_booking.
- "Who has a X schedule today at 9" / "which provider is working at 09:00" are READ-ONLY show_appointments — NOT create_booking. Never interpret the noun "schedule" in a question as a booking verb.
- Use "show_appointments" or "list_bookings" when the user wants to view/display/see existing appointments or bookings for a day — e.g. "show Gevorg's appointments on Friday", "what appointments does Maria have tomorrow".
- Use "check_availability" when the user asks about available slots, open times, schedule blocks, what services can be booked, or availability on a day — e.g. "which slots are available for Gevorg on 30/06/2026", "what is Gevorg's schedule on Friday", "does Gevorg do face massage today at 9", "is Gevorg available to give facemassage at 09:00". Always set employeeName, serviceName, date, and timeSlot when mentioned. NEVER use create_booking for these questions.
- lookup_service_assignment: READ-ONLY — which providers can perform a service, or which services a provider can perform. Set assignmentLookup and employeeName or serviceName. When a date is mentioned (today/tomorrow/specific day), return only providers with an applied SERVICE_BLOCK for that service on that day AND at least one unbooked open window inside those blocks — NOT the general catalog assignment list. Use for "who is doing facemassage today", "who has a free slot for facemassage today", "who can do face massage tomorrow".
- analyze_appointments: READ-ONLY — find extreme appointments for a day (most expensive, longest, shortest, earliest, latest). Use for "which appointment is the most expensive today", "longest appointment tomorrow". Set date (default today). NOT the same as listing all appointments.
- summarize_bookings: READ-ONLY booking analytics — counts, revenue, busiest provider, cancelled/no-show/unpaid totals. Use for "how many appointments today", "total revenue this week", "who is the busiest provider today", "how many cancelled today". NOT for listing individual appointments (use show_appointments) or utilization gaps (use summarize_utilization).
- show_appointments / list_bookings: set employeeName when a specific provider is mentioned; leave null for all providers. Always set date when mentioned (required for a meaningful day view).
- optimize_schedule / fill_unused_slots: fill_unused_slots creates schedule service periods (not bookings). Supports multiple providers, date ranges, time windows. For two or more providers use employeeNames array, e.g. ["Gevorg Gasparyan", "Mary Torgomyan"], or employeeName "Gevorg and Mary".
- list_schedule_gaps: READ-ONLY — list open/unfilled time windows per day for specific provider(s). Use when user asks "which days have gaps", "exact days with gaps", "show gaps by day", or follow-ups after a utilization summary. Requires employeeName (or allProviders) and a date range. Inherit dateFrom/dateTo from session when omitted.
- summarize_utilization: team-level utilization percentages for a date range — NOT per-day gap detail. Do not use for "which days" or "show gaps" questions.
- summarize_customers: READ-ONLY customer CRM insights — rankings and segments. Use for "which customer has the most no-shows", "at-risk customers", "top VIPs", "who books the most", "which customer pays the most" / "who paid the most", "top 10 customers who paid the most", "new customers", "most cancellations". Set customerMetric when clear (e.g. top_spenders for payment/spend questions); set limit from "top N" (default 5). NEVER use overview when the user asks for a specific ranking like who pays the most.
- list_services: READ-ONLY service catalog — list offerings or look up price/duration. Use for "what services do we offer", "how much is facemassage", "show our service menu". NOT for adding services (use create_service).
- analyze_services: READ-ONLY — most booked / top revenue / least popular services for a date range.
- summarize_staff: READ-ONLY — provider rankings (busiest, most revenue, most bookings) for a date range.
- lookup_customer: READ-ONLY — single customer profile, last visit, appointment history snippet. Requires customerName.
- summarize_waitlist: READ-ONLY — count and list CRM customers tagged "waitlist". Use for "how many on waitlist", "show waitlist customers". NOT for filling a slot (use fill_slot_from_waitlist).
- Example follow-up: after "who can do facemassage tomorrow", "book Gevorg at 10:00" or "at 10:00" → create_booking with inherited serviceName, date, employeeName, timeSlot.
- list_employees: READ-ONLY — list active providers/team members.
- list_templates: READ-ONLY — list schedule template names.
- create_schedule_template: create a reusable schedule template (name + hours + weekday flags + optional services). Example: "Create template Weekday 9-17 with facemassage Mon-Fri" → templateName, periods or timeFrom/timeTo, applyDays.
- mark_no_shows: mark past missed appointments as no-show. Requires date or date range; optional employeeName, customerName, timeSlot filters. Only appointments that already started and are not cancelled.
- payment_sweep: mark unpaid completed/in-progress appointments as paid. Use for "payment sweep", "collect outstanding payments", "mark unpaid as paid". Optional date range and employeeName filters.
- update_bookings: change appointment status and/or payment without cancelling. Use for "mark as done", "set payment to paid/N/A", "mark appointments 16:00-17:15 as done and paid". Supports employeeName/employeeNames/allProviders, date, timeFrom/timeTo, allAppointments. Use cancel_bookings when user wants cancelled status.
- day_replan: analyze and replan a day — detect conflicts, find gaps, recommend fixes. Use for "replan my day", "fix tomorrow's schedule", "redo the calendar for Friday". Sets date or dateFrom/dateTo.
- show_appointments respects statusFilter for cancelled/no-show/confirmed views. Inherit todayOnly and page statusFilter from session context.
- block_schedule: block time or full days for provider(s) or all providers. Creates block schedules.
- create_direct_schedule: set/replace applied schedule for one or more providers (allProviders=true for "all employees") for a day or date range. Hours like "9-19, 12-13 unavailable" can omit explicit periods — the system splits service blocks around lunch. When the user says "his/her/their services" or does not name specific services, leave serviceNames null — uses only services assigned to each provider. For ranges like "this week", set dateFrom and dateTo.
- clear_schedule: remove/cleanup/wipe/reset a provider's applied schedule for a day or date range — deletes schedule periods and micro-slots so the day is free to re-apply a template. Does NOT cancel appointments. Requires employeeName (or allProviders for whole team) and date (or dateFrom/dateTo). "Clear all schedules for Karo" means Karo only — set employeeName=Karo, allProviders=false. NOT hide_appointments_from_calendar.
- fill_unused_slots / create_direct_schedule with "for his services" / "their services": do not list every catalog service in serviceNames — leave serviceNames null so only the provider's assigned services are used.
- assign_employee_services: assign services from catalog to a provider.
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
- Use DD/MM/YYYY for all date params (legacy DD_MM_YYYY is still accepted when parsing).`;

export interface CommandSessionOptions {
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: Record<string, any>;
  confirmed?: boolean;
}

@Injectable()
export class AiCommandService {
  private readonly logger = new Logger(AiCommandService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
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
    private bookingCommandGraph: BookingCommandGraphService,
    private slotResolver: BookingSlotResolverService,
    private complexityRouter: CommandComplexityRouterService,
    private intentRescue: AiIntentRescueService,
    private promptSecurity: AiPromptSecurityService,
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

  async retryWorkflowStep(
    businessId: string,
    taskId: string,
    stepId: string,
    userId?: string,
  ): Promise<CommandResult> {
    const orch = await this.orchestration.retryFailedStep(businessId, taskId, stepId, userId);
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
        summary: 'AI is not configured. Add an OpenAI API key in Settings → API Keys, or contact your platform administrator.',
        details: {},
      };
    }

    const timeZone = await this.resolveCommandTimezone(businessId, session);

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

    const deterministicRoute = this.complexityRouter.routeDeterministic(
      effectivePrompt,
      employees.map((e) => ({ id: e.id, name: e.name })),
    );
    const sessionWithRoute: CommandSessionOptions = {
      ...session,
      context: {
        ...session?.context,
        _complexityRoute:
          session?.context?._complexityRoute ?? deterministicRoute,
      },
    };

    if (this.bookingCommandGraph.isEnabled()) {
      const complexityRoute = sessionWithRoute.context?._complexityRoute as
        | { tier: 'read_only' | 'simple_mutate' | 'orchestration' | 'compound'; useDecomposition?: boolean }
        | undefined;

      return this.bookingCommandGraph.run({
        businessId,
        prompt,
        effectivePrompt,
        userId,
        session: sessionWithRoute,
        catalog,
        timeZone,
        confidenceThresholds: aiConfig.confidence,
        complexityRoute,
        delegates: {
          executeSingleIntent: () =>
            this.executeSingleIntent(
              businessId,
              effectivePrompt,
              userId,
              sessionWithRoute,
              catalog,
              timeZone,
              aiConfig,
              playbook,
            ),
          buildCompoundPlan: (action, params, employeeId, pendingCancelBookingIds) =>
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
              effectivePrompt,
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
              catalog,
              timeZone,
              userId,
            ),
        },
      });
    }

    if (this.decomposition.isCompoundPrompt(effectivePrompt)) {
      const subIntents = await this.decomposition.decompose(businessId, userId, effectivePrompt, timeZone);
      if (subIntents.length > 1) {
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
      }
    }

    return this.executeSingleIntent(
      businessId,
      effectivePrompt,
      userId,
      session,
      catalog,
      timeZone,
      aiConfig,
      playbook,
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
  ): Promise<CommandResult> {
    const { employees, services, customers, templates } = catalog;

    const contextBlock = `Current date: ${todayDisplay(timeZone)} (format DD/MM/YYYY, timezone: ${timeZone}, times in 24h HH:mm)
Available employees: ${employees.map((e) => `${e.name} (id: ${e.id})`).join(', ')}
Available services: ${services.map((s) => `${s.name} (id: ${s.id})`).join(', ')}
Available customers: ${customers.map((c) => `${c.name} (id: ${c.id})`).join(', ')}
Schedule templates: ${templates.map((t) => t.name).join(', ') || 'none'}`;

    const sessionContext = { ...session?.context, timeZone };

    const normalizedPrompt = normalizeMultilingualPrompt(effectivePrompt);
    const i18nHint = multilingualHint(effectivePrompt, normalizedPrompt);
    const contextWithI18n = i18nHint ? `${contextBlock}\n${i18nHint}` : contextBlock;

    const parsed = await this.classifyIntent(
      businessId,
      userId,
      normalizedPrompt,
      contextWithI18n,
      session?.history,
      sessionContext,
    );
    if (!parsed) {
      return { success: false, action: 'error', summary: 'Failed to understand the command. Please try rephrasing.', details: {} };
    }

    parsed.params = this.completionPipeline.mergeSessionContext(
      parsed.params,
      sessionContext,
      parsed.action,
    );
    if (parsed.action === 'create_booking') {
      parsed.params.customerName = null;
      delete parsed.params.customerId;
      const fallback = extractProviderFallbackFromPrompt(effectivePrompt, employees);
      if (fallback.providerFallbackNames.length) {
        parsed.params.providerFallbackNames = fallback.providerFallbackNames;
      }
      if (fallback.fallbackAnyProvider) {
        parsed.params.fallbackAnyProvider = true;
      }
    }
    this.applyPromptEntityOverrides(
      effectivePrompt,
      parsed.params,
      parsed.action,
      employees,
      services,
      customers,
    );
    parsed.params._timeZone = timeZone;
    this.enrichMultiEmployeeFromPrompt(effectivePrompt, parsed.params, employees);
    this.applyScheduleScopeFromPrompt(effectivePrompt, parsed.params, parsed.action, employees);

    if (parsed.action === 'unknown' && isClearSchedulePrompt(effectivePrompt)) {
      parsed.action = 'clear_schedule';
      parsed.reasoning =
        'Clear applied schedule periods and micro-slots for the provider on the specified date(s).';
      parsed.confidence = Math.max(typeof parsed.confidence === 'number' ? parsed.confidence : 0, 0.88);
    }

    const rescued = this.intentRescue.rescue({
      prompt: effectivePrompt,
      action: parsed.action,
      params: parsed.params,
      reasoning: parsed.reasoning,
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
    });
    if (rescued?.rescued) {
      parsed.action = rescued.action;
      parsed.params = { ...parsed.params, ...rescued.params };
      parsed.reasoning = rescued.reasoning ?? parsed.reasoning;
      parsed.confidence = Math.max(typeof parsed.confidence === 'number' ? parsed.confidence : 0, 0.85);
    }
    this.applyBulkAppointmentScope(effectivePrompt, parsed.params, parsed.action, services);

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

    parsed.params = this.promptSecurity.stripParams(parsed.params) as Record<string, any>;
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

    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.75;

    this.logger.log(`AI (LLM) classified action="${parsed.action}" confidence=${confidence} — ${parsed.reasoning}`);

    this.completionPipeline.normalizeDateParams(parsed.params, effectivePrompt, timeZone);
    if (parsed.action === 'reschedule_booking') {
      this.completionPipeline.finalizeRescheduleParams(parsed.params, effectivePrompt, timeZone);
    } else if (
      parsed.action === 'create_direct_schedule' ||
      parsed.action === 'clear_schedule' ||
      parsed.action === 'apply_schedule' ||
      parsed.action === 'block_schedule' ||
      parsed.action === 'fill_unused_slots' ||
      parsed.action === 'cancel_bookings' ||
      parsed.action === 'hide_appointments_from_calendar'
    ) {
      this.completionPipeline.enrichDateRangeParams(parsed.params, effectivePrompt, timeZone);
      this.completionPipeline.normalizeDateParams(parsed.params, effectivePrompt, timeZone);
    }
    if (parsed.action === 'create_direct_schedule') {
      parsed.params.periods = inferDirectSchedulePeriods(parsed.params, effectivePrompt);
    }

    const resolved = this.completionPipeline.resolve(businessId, effectivePrompt, parsed, catalog, timeZone);
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
      'create_booking', 'create_service', 'create_services', 'cancel_bookings', 'update_bookings',
      'bulk_smart_cancel', 'hide_appointments_from_calendar', 'unhide_appointments_from_calendar', 'fill_slot_from_waitlist', 'reschedule_booking',
      'fill_unused_slots', 'apply_schedule', 'clear_schedule', 'block_schedule', 'setup_week_schedule',
      'create_schedule_template', 'mark_no_shows', 'payment_sweep', 'day_replan',
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
      providerCount: resolveEmployees(employees, resolved.enrichedParams).length || 1,
      confidence,
      thresholds: aiConfig.confidence,
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
      'payment_sweep',
      'day_replan',
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
        if (
          /notify|waitlist|rebook|whatsapp|message|customer|text/i.test(effectivePrompt) ||
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
        result = await this.handleAnalyzeServices(businessId, effectivePrompt, params);
        break;
      case 'summarize_staff':
        result = await this.handleSummarizeStaff(businessId, effectivePrompt, params, employees);
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
        result = await this.handleSummarizeUtilization(businessId, effectivePrompt, params, employees);
        break;
      case 'summarize_customers':
        result = await this.handleSummarizeCustomers(businessId, effectivePrompt, params);
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
    if ((isBulkAllAppointmentsPrompt(prompt) || params.allAppointments === true) && !promptService) {
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

    if (action === 'create_booking') {
      if (isAnyProviderBookingPrompt(prompt)) {
        params.allProviders = true;
        params.employeeName = null;
        delete params.employeeId;
      }
      if (isFirstAvailableBookingPrompt(prompt)) {
        params.bookingFirstAvailable = true;
        delete params.timeSlot;
      }
      const earliestTime = parseEarliestBookingTimeFromPrompt(prompt);
      if (earliestTime) {
        params.timeFrom = earliestTime;
      }
    }

    if (action === 'reschedule_booking') {
      if (isFirstAvailableBookingPrompt(prompt)) {
        params.bookingFirstAvailable = true;
        delete params.timeSlot;
      }
      const providerPossessive = extractProviderPossessiveFromReschedulePrompt(
        prompt,
        employees.map((e) => ({ id: e.id, name: e.name })),
      );
      if (providerPossessive) {
        params.employeeName = providerPossessive.name;
        params.employeeId = providerPossessive.id;
        params.customerName = null;
        delete params.customerId;
      } else {
        const rescheduleCustomer = extractCustomerFromReschedulePrompt(
          prompt,
          customers.map((c) => ({ id: c.id, name: c.name })),
          employees.map((e) => ({ id: e.id, name: e.name })),
        );
        if (rescheduleCustomer) {
          params.customerName = rescheduleCustomer.name;
          params.customerId = rescheduleCustomer.id;
        } else {
          params.customerName = null;
          delete params.customerId;
        }
      }
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
        content: `${INTENT_SCHEMA}\n\n${this.promptSecurity.getClassifierSecurityRules()}\n\n${context}${sessionBlock}${routeHintBlock}`,
      },
      ...historyMessages,
      { role: 'user', content: this.promptSecurity.prepareUserPromptForClassifier(prompt) },
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
    const service =
      (params.serviceName ? this.resolveService(services, params.serviceName) : undefined) ??
      (params.serviceId ? services.find((s) => s.id === params.serviceId) : undefined);
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

      const pick = await this.findFirstAvailableBookingSlot(
        businessId,
        service,
        startIsoDay,
        searchTargets,
        timeZone,
        params.timeFrom ?? null,
      );

      if (!pick) {
        const afterLabel = params.timeFrom ? ` after ${params.timeFrom}` : '';
        return {
          success: false,
          action: 'create_booking',
          summary: `No upcoming open ${service.name} slots found${afterLabel}${
            params.allProviders ? ' for any provider' : ` for ${resolvedEmployee?.name ?? 'that provider'}`
          } in the next two weeks.`,
          details: { serviceName: service.name, allProviders: !!params.allProviders, timeFrom: params.timeFrom ?? null },
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
        (Array.isArray(params.providerFallbackNames) && params.providerFallbackNames.length > 0) ||
        (Array.isArray(params.employeeNames) && params.employeeNames.length >= 2));

    if (wantsProviderFallback && timeSlot) {
      const fixedTimeSlot = timeSlot;
      const timeZone = params._timeZone ?? 'UTC';
      const isoDay = toIsoDay(params.date, timeZone);
      const priorityNames: string[] = Array.isArray(params.providerFallbackNames)
        ? params.providerFallbackNames
        : Array.isArray(params.employeeNames) && params.employeeNames.length >= 2
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
        const tried = providerPriority.map((p) => p.name).join(', ') || 'requested providers';
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

    for (let offset = 0; offset < AiCommandService.FIRST_AVAILABLE_SCAN_DAYS; offset++) {
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
          if (!isWallClockSlotBookable(isoDay, slot.start, timeZone, notBeforeTime)) continue;

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
      ? { employee: best.employee, timeSlot: best.timeSlot, isoDay: best.isoDay }
      : null;
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
        ? Math.min(params.limit, MAX_AI_CUSTOMER_ROWS)
        : Math.min(extractLimitFromPrompt(prompt), MAX_AI_CUSTOMER_ROWS);

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

    const detail = await this.customerService.getCustomerDetail(businessId, customer.id);
    const { stats, appointments } = detail;
    const lastAppt = appointments[0];
    const upcoming = appointments.filter(
      (a) => new Date(a.startTime) > new Date() && a.status !== 'cancelled',
    ).length;

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

    return {
      success: true,
      action: 'lookup_customer',
      summary: lines.join('\n'),
      details: limitedView
        ? { customerId: detail.customer.id, name: detail.customer.name, upcoming }
        : { customer: detail.customer, stats, recentAppointments: appointments.slice(0, 5) },
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

    const recoverableSlots = await this.bookingRepo.count({ where: cancelledWhere as any });

    if (waitlist.length === 0) {
      const lines = ['No customers on the waitlist. Tag customers with "waitlist" in CRM.'];
      if (recoverableSlots > 0) {
        lines.push(`Cancelled slots available for recovery: ${recoverableSlots}`);
      }
      return {
        success: true,
        action: 'summarize_waitlist',
        summary: lines.join('\n'),
        details: { count: 0, customers: [], recoverableCancelledSlots: recoverableSlots },
      };
    }

    const shown = waitlist.slice(0, limit);
    const lines = [`Waitlist: ${waitlist.length} customer(s)`, ...shown.map((c) => `• ${c.name}`)];
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
        customers: shown.map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email })),
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
          services: assigned.map((s) => ({ id: s.id, name: s.name, durationMinutes: s.durationMinutes })),
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
      const isoDay = parseDateInput(params.date)?.toISOString().split('T')[0] ?? params.date;
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
          const blocks = r.scheduledBlocks.map((b) => `${b.start}–${b.end}`).join(', ');
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
    prompt: string,
    params: any,
    services: Service[],
    employees: Employee[],
    employeeId?: string,
    userId?: string,
    options?: { notifyOnly?: boolean },
  ): Promise<CommandResult> {
    const matchedServices = this.resolveServices(services, params);

    if (params.employeeName && !this.resolveEmployee(employees, params.employeeName)) {
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
    subIntents: Array<{ action: string; params: Record<string, any>; reasoning: string }>,
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
      this.completionPipeline.trace('classify', 'compound_intent', `${subIntents.length} sub-intent(s)`),
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
      this.applyScheduleScopeFromPrompt(prompt, parsedParams, parsed.action, catalog.employees);
      this.completionPipeline.normalizeDateParams(parsedParams, prompt, timeZone);
      if (parsed.action === 'reschedule_booking') {
        this.completionPipeline.finalizeRescheduleParams(parsedParams, prompt, timeZone);
      } else if (
        parsed.action === 'create_direct_schedule' ||
        parsed.action === 'clear_schedule' ||
        parsed.action === 'apply_schedule' ||
        parsed.action === 'block_schedule' ||
        parsed.action === 'fill_unused_slots' ||
        parsed.action === 'cancel_bookings' ||
        parsed.action === 'hide_appointments_from_calendar'
      ) {
        this.completionPipeline.enrichDateRangeParams(parsedParams, prompt, timeZone);
        this.completionPipeline.normalizeDateParams(parsedParams, prompt, timeZone);
      }
      if (parsed.action === 'create_direct_schedule') {
        parsedParams.periods = inferDirectSchedulePeriods(parsedParams, prompt);
      }
      if (parsed.action === 'hide_appointments_from_calendar' && pendingCancelBookingIds?.length) {
        parsedParams.statusFilter = parsedParams.statusFilter ?? 'cancelled';
      }
      const resolved = this.completionPipeline.resolve(businessId, prompt, parsed, catalog, timeZone);

      if (shouldValidateAction(parsed.action)) {
        const validation = this.completionPipeline.validate(resolved);
        if (!validation.ok) {
          const clarify = this.completionPipeline.toClarifyResult(resolved, validation);
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
          const cancelStep = plan.steps.find((s) => s.action === 'cancel_bookings');
          pendingCancelBookingIds = cancelStep?.params?.bookingIds as string[] | undefined;
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

    const merged = this.planBuilder.mergePlans(businessId, 'compound_intent', plans);
    const providerCount = new Set(
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
    pendingCancelBookingIds?: string[],
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
        const existing = this.resolveService(catalog.services, parsed.draft.name);
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
          if (this.resolveService(catalog.services, parsed.draft.name)) continue;
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
        const targets = resolveEmployees(catalog.employees, params);
        if (targets.length !== 1) return null;
        const matched = resolveServices(catalog.services, params);
        if (matched.length === 0) return null;
        return this.planBuilder.buildAssignEmployeeServicesPlan({
          businessId,
          employeeId: targets[0].id,
          employeeName: targets[0].name,
          serviceIds: matched.map((s) => s.id),
          serviceNames: matched.map((s) => s.name),
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
        return this.planBuilder.buildUpdateBookingsPlan({
          businessId,
          bookingIds: bookings.map((b) => b.id),
          status: BookingStatus.NO_SHOW,
          userId,
          label: `Mark ${bookings.length} appointment(s) as no-show`,
        });
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
        const bookings = await this.findUnpaidBookingsForSweep(
          businessId,
          params,
          catalog.services,
          catalog.employees,
          employeeId,
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
        const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC');
        if (!range) return null;
        const targets = resolveEmployees(catalog.employees, params);
        return this.planBuilder.buildDayReplanPlan({
          businessId,
          date: params.date ?? (range.start === range.end ? range.start : undefined),
          dateFrom: range.start !== range.end ? range.start : undefined,
          dateTo: range.start !== range.end ? range.end : undefined,
          employeeIds: targets.length ? targets.map((e) => e.id) : undefined,
          userId,
        });
      }
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
    userId?: string,
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
        return this.handleListServices(catalog.services, params, effectivePrompt);
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
        return this.handleSummarizeCustomers(businessId, effectivePrompt, params);
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
      (params.serviceName ? this.resolveService(services, params.serviceName) : undefined) ??
      (params.serviceId ? services.find((s) => s.id === params.serviceId) : undefined);
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
        params.timeFrom ?? null,
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
        (Array.isArray(params.providerFallbackNames) && params.providerFallbackNames.length > 0) ||
        (Array.isArray(params.employeeNames) && params.employeeNames.length >= 2));

    if (wantsProviderFallback && timeSlot) {
      const fixedTimeSlot = timeSlot;
      const timeZone = params._timeZone ?? 'UTC';
      const isoDay = toIsoDay(params.date, timeZone);
      const priorityNames: string[] = Array.isArray(params.providerFallbackNames)
        ? params.providerFallbackNames
        : Array.isArray(params.employeeNames) && params.employeeNames.length >= 2
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
          if (!bookings.length) return { success: false, action, summary: '', details: {} };
          const plan = this.planBuilder.buildCancelBookingsPlan(
            businessId,
            bookings.map((b) => b.id),
            params.reason || 'Cancelled via AI',
            userId,
            {
              employeeName: params.employeeName,
              date: params.date ? formatDateDisplay(params.date) : undefined,
              services: this.resolveServices(catalog.services, params).map((s) => s.name),
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
          const fillResult = await this.handleFillSlotFromWaitlist(businessId, params, employeeId, userId);
          return { ...fillResult, details: { plan: fillResult.details?.plan } };
        }
        result = await this.handleFillSlotFromWaitlist(businessId, params, employeeId, userId);
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
          if (!bookings.length) return { success: false, action, summary: '', details: {} };
          const statuses = this.resolveCalendarVisibilityStatusFilters(params, 'hide') ?? [];
          const plan = this.planBuilder.buildHideAppointmentsPlan(
            businessId,
            bookings.map((b) => b.id),
            userId,
            {
              employeeName: params.employeeName,
              date: params.date ? formatDateDisplay(params.date) : undefined,
              services: this.resolveServices(catalog.services, params).map((s) => s.name),
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
          if (!bookings.length) return { success: false, action, summary: '', details: {} };
          const statuses = this.resolveCalendarVisibilityStatusFilters(params, 'unhide');
          const plan = this.planBuilder.buildUnhideAppointmentsPlan(
            businessId,
            bookings.map((b) => b.id),
            userId,
            {
              employeeName: params.employeeName,
              date: params.date ? formatDateDisplay(params.date) : undefined,
              dateFrom: params.dateFrom ? formatDateDisplay(params.dateFrom) : undefined,
              dateTo: params.dateTo ? formatDateDisplay(params.dateTo) : undefined,
              services: this.resolveServices(catalog.services, params).map((s) => s.name),
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
          const plan = await this.scheduleHandlers.prepareCreateScheduleTemplatePlan(
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
          if (!bookings.length) return { success: false, action, summary: '', details: {} };
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
          if (!bookings.length) return { success: false, action, summary: '', details: {} };
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
          if (!bookings.length) return { success: false, action, summary: '', details: {} };
          const status = normalizeBookingStatusValue(params.status);
          const paymentStatus = normalizePaymentStatusValue(params.paymentStatus);
          if (!status && !paymentStatus) return { success: false, action, summary: '', details: {} };
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
          const range = resolveDateRange(params, prompt, params._timeZone ?? 'UTC');
          if (!range) return { success: false, action, summary: '', details: {} };
          const targets = resolveEmployees(catalog.employees, params);
          const plan = this.planBuilder.buildDayReplanPlan({
            businessId,
            date: params.date ?? (range.start === range.end ? range.start : undefined),
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
        result = { success: false, action, summary: 'Unsupported compound step', details: {} };
    }

    return result;
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
    const bookings = await this.findUnpaidBookingsForSweep(
      businessId,
      params,
      services,
      employees,
      scopedEmployeeId,
    );

    if (!bookings.length) {
      return {
        success: false,
        action: 'payment_sweep',
        summary: 'No unpaid appointments found for the given filters.',
        details: { params },
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
        date: params.date ?? (range.start === range.end ? range.start : undefined),
        dateFrom: range.start !== range.end ? range.start : undefined,
        dateTo: range.start !== range.end ? range.end : undefined,
        employeeIds: targets.length ? targets.map((e) => e.id) : undefined,
        userId,
      }),
    );

    const fillPlan = await this.scheduleHandlers.prepareFillGapsPlan(
      businessId,
      prompt,
      { ...params, date: params.date ?? range.start, dateFrom: range.start, dateTo: range.end },
      employees,
      services,
      userId,
    );
    if (fillPlan) plans.push(fillPlan);

    const merged =
      plans.length === 1 ? plans[0] : this.planBuilder.mergePlans(businessId, 'day_replan', plans);

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

  private applyDateScopeToWhere(where: Record<string, unknown>, params: Record<string, any>): void {
    if (params.date) {
      const isoDay = toIsoDay(params.date, params._timeZone);
      const dayStart = new Date(`${isoDay}T00:00:00.000Z`);
      const dayEnd = new Date(`${isoDay}T23:59:59.999Z`);
      where.startTime = Between(dayStart, dayEnd);
    } else if (params.dateFrom && params.dateTo) {
      const from = new Date(`${toIsoDay(params.dateFrom, params._timeZone)}T00:00:00.000Z`);
      const to = new Date(`${toIsoDay(params.dateTo, params._timeZone)}T23:59:59.999Z`);
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
      status: Not(BookingStatus.CANCELLED) as any,
    };

    if (!this.applyEmployeeScopeToWhere(where, params, employees, scopedEmployeeId)) {
      return [];
    }
    this.applyServiceScopeToWhere(where, params, matchedServices);
    this.applyDateScopeToWhere(where, params);

    const bookings = await this.bookingRepo.find({
      where: where as any,
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
        summary: 'Tell me what to change — e.g. mark as done, set payment to paid or N/A.',
        details: { params },
      };
    }

    if (params.employeeName && !this.resolveEmployee(employees, params.employeeName)) {
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
        summary: this.buildBulkBookingNoMatchMessage('update', params, services, prompt),
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
    const dateFilter = params.date ? ` on ${formatDateDisplay(params.date)}` : '';
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

    if (!this.applyEmployeeScopeToWhere(where, params, employees, scopedEmployeeId)) {
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

    if (params.employeeName && !this.resolveEmployee(employees, params.employeeName)) {
      return [];
    }
    if (!this.applyEmployeeScopeToWhere(where, params, employees, scopedEmployeeId)) {
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
      status: Not(In([BookingStatus.CANCELLED, BookingStatus.COMPLETED])) as any,
    };

    if (!this.applyEmployeeScopeToWhere(where, params, employees, scopedEmployeeId)) {
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
    const resolved = raw.filter((s): s is BookingStatus => allowed.has(s as BookingStatus));
    if (resolved.length > 0) return resolved;

    if (mode === 'hide') {
      return [BookingStatus.CANCELLED, BookingStatus.NO_SHOW, BookingStatus.COMPLETED];
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
      const from = new Date(`${toIsoDay(params.dateFrom, params._timeZone)}T00:00:00.000Z`);
      const to = new Date(`${toIsoDay(params.dateTo, params._timeZone)}T23:59:59.999Z`);
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
    const statuses = this.resolveCalendarVisibilityStatusFilters(params, 'hide') ?? [];

    if (params.employeeName && !this.resolveEmployee(employees, params.employeeName)) {
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
            employee: params.employeeName ?? (params.allProviders ? 'all' : null),
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
    const statuses = this.resolveCalendarVisibilityStatusFilters(params, 'unhide');

    if (params.employeeName && !this.resolveEmployee(employees, params.employeeName)) {
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
            employee: params.employeeName ?? (params.allProviders ? 'all' : null),
            services: matchedServices.map((s) => s.name),
            date: params.date ? formatDateDisplay(params.date) : null,
            dateFrom: params.dateFrom ? formatDateDisplay(params.dateFrom) : null,
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
        dateFrom: params.dateFrom ? formatDateDisplay(params.dateFrom) : undefined,
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
      ...(params.serviceName && !params.serviceNames?.length ? [params.serviceName] : []),
    ].filter(Boolean);

    if (requestedServiceLabels.length > 0 && matchedServices.length === 0 && !params.allAppointments) {
      return {
        success: false,
        action: 'cancel_bookings',
        summary: `No matching service type(s) found for: ${requestedServiceLabels.join(', ')}. Available: ${services.map((s) => s.name).join(', ')}`,
        details: { requestedServiceLabels, availableServices: services.map((s) => s.name) },
      };
    }

    if (params.employeeName && !this.resolveEmployee(employees, params.employeeName)) {
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
        summary: this.buildBulkBookingNoMatchMessage('cancel', params, services, prompt),
        details: {
          matchedCount: 0,
          filters: {
            employee: params.employeeName ?? null,
            services: params.allAppointments ? [] : matchedServices.map((s) => s.name),
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
      const providerPart = options.includeProvider ? ` | ${b.employee?.name || 'Unknown'}` : '';
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
        startTime: Between(dayStart, dayEnd) as any,
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

    const targetTime = params.timeSlot ? this.snapTo10min(params.timeSlot) : null;
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
        if (period.startTime.getTime() > targetMs || period.endTime.getTime() <= targetMs) {
          continue;
        }
      }
      const name = period.employee?.name ?? 'Unknown provider';
      const block = `${formatTimeDisplay(period.startTime)}–${formatTimeDisplay(period.endTime)}`;
      if (!providers.has(name)) providers.set(name, []);
      providers.get(name)!.push(block);
    }

    if (providers.size === 0) return null;

    const serviceLabel = params.serviceName ? String(params.serviceName) : 'service';
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

    const range =
      resolveDateRange(params, prompt) ??
      (() => {
        const iso = params.date || new Date().toISOString().split('T')[0];
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

    const matchedServices = params.serviceName
      ? this.resolveServices(catalogServices ?? [], params)
      : [];
    if (params.serviceName && matchedServices.length === 0 && catalogServices?.length) {
      const needle = String(params.serviceName).toLowerCase();
      const partialIds = new Set(
        catalogServices
          .filter((s) => s.name.toLowerCase().includes(needle))
          .map((s) => s.id),
      );
      if (partialIds.size > 0) {
        scopedBookings = scopedBookings.filter((b) => b.serviceId && partialIds.has(b.serviceId));
      } else {
        scopedBookings = scopedBookings.filter((b) =>
          b.service?.name?.toLowerCase().includes(needle),
        );
      }
    } else if (matchedServices.length > 0) {
      const ids = new Set(matchedServices.map((s) => s.id));
      scopedBookings = scopedBookings.filter((b) => b.serviceId && ids.has(b.serviceId));
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
    const customerLabel = params.customerName ? ` for ${params.customerName}` : '';
    const statusLabel = statusFilter ? ` (${statusFilter})` : '';

    const activeBookings = scopedBookings.filter((b) => b.status !== BookingStatus.CANCELLED);
    const cancelledBookings = scopedBookings.filter((b) => b.status === BookingStatus.CANCELLED);
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
      const serviceLabel = params.serviceName ? ` for ${params.serviceName}` : '';
      const timeLabel = params.timeSlot ? ` at ${this.snapTo10min(params.timeSlot)}` : '';
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
        date: clamped.start === clamped.end ? formatDateDisplay(clamped.start) : null,
        range: { start: clamped.start, end: clamped.end },
        statusFilter: statusFilter ?? null,
        customer: params.customerName ?? null,
        scope: employeeId ? 'provider' : params.customerId ? 'customer' : 'all_providers',
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

    const service = await this.serviceRepo.findOne({ where: { id: serviceId, businessId } });
    const minGapMinutes = service?.durationMinutes && service.durationMinutes > 0
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
          this.timesOverlap(block.startTime, block.endTime, b.startTime, b.endTime),
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

    if (employeeId && employeeName && params.serviceName && params.timeSlot) {
      const services = await this.serviceRepo.find({ where: { businessId } });
      const service = this.resolveService(services, params.serviceName);
      if (service) {
        const targetTime = this.snapTo10min(params.timeSlot);
        const row = await this.getProviderAvailabilityForService(
          businessId,
          employeeId,
          service.id,
          isoDay,
        );
        const slotOpen = row.openSlots.some(
          (s) => targetTime >= s.start && targetTime < s.end,
        );

        let summary: string;
        if (!row.hasSchedule) {
          summary = `${employeeName} has no schedule on ${displayDay}.`;
        } else if (row.openSlots.length === 0) {
          summary = `${employeeName} is scheduled for ${service.name} on ${displayDay}, but has no open bookable slots.`;
        } else if (slotOpen) {
          summary = `Yes — ${employeeName} has an open slot for ${service.name} on ${displayDay} at ${targetTime}.`;
        } else {
          summary = `No — ${employeeName} is not available for ${service.name} at ${targetTime} on ${displayDay}. Open slots: ${row.openSlots.map((s) => `${s.start}–${s.end}`).join(', ') || 'none'}.`;
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
            available: slotOpen,
            openSlots: row.openSlots,
            hasSchedule: row.hasSchedule,
          },
        };
      }
    }

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

  private pickBookingForReschedule(bookings: Booking[], params: any): Booking | null {
    if (!bookings.length) return null;

    const timeZone = params._timeZone ?? 'UTC';
    const isoDay = params.fromDate ? toIsoDay(params.fromDate, timeZone) : null;
    const slot = params.fromTimeSlot ? this.snapTo10min(params.fromTimeSlot) : null;

    const active = bookings.filter(
      (b) => b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.COMPLETED,
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

    return active.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] ?? null;
  }

  private async handleRescheduleBooking(
    businessId: string,
    params: any,
    employeeId?: string,
    userId?: string,
  ): Promise<CommandResult> {
    const services = await this.serviceRepo.find({ where: { businessId, isActive: true } });
    let booking: Booking | null = null;

    if (params.bookingId) {
      booking = await this.bookingRepo.findOne({
        where: { id: params.bookingId, businessId },
        relations: { employee: true, service: true, customer: true },
      });
    } else if (params.employeeName) {
      const employees = await this.employeeRepo.find({ where: { businessId, isActive: true } });
      const employee = this.resolveEmployee(employees, params.employeeName);
      if (employee) {
        const bookings = await this.bookingRepo.find({
          where: {
            businessId,
            employeeId: employee.id,
            status: Not(BookingStatus.CANCELLED) as any,
          },
          relations: { employee: true, service: true, customer: true },
          order: { startTime: 'ASC' },
        });
        booking = this.pickBookingForReschedule(bookings, params);
      }
    } else if (params.customerName) {
      const customers = await this.customerRepo.find({ where: { businessId, isActive: true } });
      const customer = this.resolveCustomer(customers, params.customerName);
      if (customer) {
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

    const hasNewTime = !!(params.date || params.timeSlot || params.bookingFirstAvailable);
    const hasServiceChange = targetService.id !== booking.serviceId;

    if (!hasNewTime && !hasServiceChange) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary: 'Specify a new service type and/or a new date/time.',
        details: { bookingId: booking.id, currentService: booking.service?.name },
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
        params.timeFrom ?? null,
      );

      if (!pick) {
        return {
          success: false,
          action: 'reschedule_booking',
          summary: `No open ${targetService.name} slots found for ${provider.name} on ${formatDateDisplay(toIsoDay(params.date, timeZone))}.`,
          details: {
            bookingId: booking.id,
            serviceName: targetService.name,
            employeeName: provider.name,
            date: formatDateDisplay(toIsoDay(params.date, timeZone)),
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
