import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
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
} from '../../common/utils/date-format.util.js';

export interface CommandResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, any>;
}

const INTENT_SCHEMA = `You are the Orchestrix operational AI — an orchestration layer for service businesses.
Given a user's natural-language command and the available business data, classify the intent
and extract structured parameters. Return a JSON object with:

{
  "action": "create_booking" | "cancel_bookings" | "list_bookings" | "show_appointments" | "check_availability" | "reschedule_booking" | "summarize_day" | "optimize_schedule" | "fill_unused_slots" | "resolve_conflicts" | "reassign_cancelled" | "unknown",
  "params": {
    "employeeName": "string or null — the service provider's name mentioned",
    "customerName": "string or null",
    "serviceName": "string or null — single service (mainly for create_booking)",
    "serviceNames": ["string"] or null — one or more service types to filter (for cancel_bookings / list_bookings), e.g. [\"hairdrying\", \"hairstyle\"],
    "date": "DD_MM_YYYY or null — the date referenced (resolve relative dates like 'tomorrow' from today's date)",
    "dateFrom": "DD_MM_YYYY or null — start of range if a range is mentioned",
    "dateTo": "DD_MM_YYYY or null — end of range",
    "reason": "string or null — reason given for cancellation or note",
    "notes": "string or null — booking notes or description",
    "timeSlot": "HH:MM in 24h format or null — appointment start time (e.g. 09:00, 14:30)",
    "bookingId": "string or null — if a specific booking ID is mentioned"
  },
  "reasoning": "one sentence explaining your interpretation"
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
- Use "show_appointments" or "list_bookings" when the user wants to view/display/see existing appointments or bookings for a day — e.g. "show Gevorg's appointments on Friday", "what appointments does Maria have tomorrow".
- Use "check_availability" when the user asks about available slots, open times, schedule blocks, what services can be booked, or availability on a day — e.g. "which slots are available for Gevorg on 30_06_2026", "what is Gevorg's schedule on Friday". Always set employeeName and date when mentioned.
- show_appointments / list_bookings: set employeeName when a specific provider is mentioned; leave null for all providers. Always set date when mentioned (required for a meaningful day view).
- optimize_schedule / fill_unused_slots: use optimize_schedule or fill_unused_slots when user wants to optimize, fill gaps, reduce idle time, or improve utilization.
- resolve_conflicts: staff/scheduling conflicts, overlapping appointments, double-booked providers.
- reassign_cancelled: recover from cancellations, rebook freed slots, reassign cancelled appointments.
- Mutating actions compile into workflow plans — they do not execute directly.
- If you cannot determine the action, use "unknown".
- Multi-turn conversation: read prior messages and Active session context. Follow-up commands often omit provider, date, or customer — inherit them unless the user clearly switches topic.
- Example follow-up: after "available slots for Gevorg on 30_06_2026", the message "book facemassage at 16:00" → action create_booking, employeeName="Gevorg Gasparyan" (or "Gevorg"), date="30_06_2026", serviceName="facemassage", timeSlot="16:00".
- Dates may appear as DD_MM_YYYY or DD/MM/YYYY — normalize to DD_MM_YYYY in params.`;

export interface CommandSessionOptions {
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: Record<string, any>;
}

@Injectable()
export class AiCommandService {
  private readonly logger = new Logger(AiCommandService.name);
  private client: OpenAI | null = null;

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(SchedulingPeriod) private periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(SchedulingSlot) private slotRepo: Repository<SchedulingSlot>,
    private orchestration: CommandOrchestrationService,
    private planBuilder: OperationalPlanBuilderService,
    private config: ConfigService,
  ) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — AI commands unavailable');
    }
  }

  async approveTask(taskId: string, userId: string): Promise<CommandResult> {
    return this.toCommandResult(await this.orchestration.approveTask(taskId, userId));
  }

  async executeCommand(
    businessId: string,
    prompt: string,
    userId?: string,
    session?: CommandSessionOptions,
  ): Promise<CommandResult> {
    if (!this.client) {
      return { success: false, action: 'error', summary: 'OpenAI API key not configured', details: {} };
    }

    const [employees, services, customers] = await Promise.all([
      this.employeeRepo.find({ where: { businessId, isActive: true } }),
      this.serviceRepo.find({ where: { businessId } }),
      this.customerRepo.find({ where: { businessId, isActive: true } }),
    ]);

    const contextBlock = `Current date: ${todayDisplay()} (format DD_MM_YYYY, times in 24h HH:mm)
Available employees: ${employees.map((e) => `${e.name} (id: ${e.id})`).join(', ')}
Available services: ${services.map((s) => `${s.name} (id: ${s.id})`).join(', ')}
Available customers: ${customers.map((c) => `${c.name} (id: ${c.id})`).join(', ')}`;

    const parsed = await this.classifyIntent(prompt, contextBlock, session?.history, session?.context);
    if (!parsed) {
      return { success: false, action: 'error', summary: 'Failed to understand the command. Please try rephrasing.', details: {} };
    }

    parsed.params = this.mergeSessionContext(parsed.params, session?.context);

    this.logger.log(`AI classified action="${parsed.action}" — ${parsed.reasoning}`);

    this.normalizeDateParams(parsed.params);

    const resolvedEmployee = parsed.params.employeeName
      ? this.resolveEmployee(employees, parsed.params.employeeName)
      : undefined;
    const employeeId = resolvedEmployee?.id;

    if (
      parsed.params.employeeName &&
      !resolvedEmployee &&
      ['list_bookings', 'show_appointments', 'summarize_day', 'check_availability', 'cancel_bookings'].includes(
        parsed.action,
      )
    ) {
      return this.attachSessionContext(
        {
          success: false,
          action: parsed.action,
          summary: `Service provider "${parsed.params.employeeName}" not found. Available: ${employees.map((e) => e.name).join(', ')}`,
          details: { requestedEmployee: parsed.params.employeeName, availableEmployees: employees.map((e) => e.name) },
        },
        parsed.params,
        undefined,
      );
    }

    let result: CommandResult;

    switch (parsed.action) {
      case 'create_booking':
        result = await this.handleCreateBooking(
          businessId,
          parsed.params,
          employees,
          services,
          customers,
          userId,
        );
        break;
      case 'cancel_bookings':
        result = await this.handleCancelBookings(
          businessId,
          parsed.params,
          services,
          employeeId,
          userId,
        );
        break;
      case 'list_bookings':
      case 'show_appointments':
        result = await this.handleListBookings(businessId, parsed.params, employeeId, resolvedEmployee?.name);
        break;
      case 'check_availability':
        result = await this.handleCheckAvailability(
          businessId,
          parsed.params,
          employeeId,
          resolvedEmployee?.name,
        );
        break;
      case 'summarize_day':
        result = await this.handleSummarizeDay(businessId, parsed.params, employeeId, resolvedEmployee?.name);
        break;
      case 'optimize_schedule':
      case 'fill_unused_slots':
        result = this.toCommandResult(
          await this.orchestration.runOrchestrationIntent({
            businessId,
            intent: prompt,
            agentType: AgentType.SCHEDULING_OPTIMIZATION,
            userId,
            date: parsed.params.date,
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
            date: parsed.params.date,
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
            date: parsed.params.date,
            employeeId,
          }),
        );
        break;
      case 'reschedule_booking':
        result = await this.handleRescheduleBooking(businessId, parsed.params, employeeId, userId);
        break;
      default:
        result = {
          success: false,
          action: 'unknown',
          summary: `I understood: "${parsed.reasoning}" but I don't know how to execute that action yet. Supported: book, cancel, show appointments, optimize schedule, fill slots, resolve conflicts, reassign cancelled, check availability, summarize day.`,
          details: { parsed },
        };
    }

    return this.attachSessionContext(result, parsed.params, resolvedEmployee?.name);
  }

  private mergeSessionContext(
    params: Record<string, any>,
    session?: Record<string, any>,
  ): Record<string, any> {
    if (!session) return params;

    const merged = { ...params };
    const inheritKeys = [
      'employeeName',
      'date',
      'dateFrom',
      'dateTo',
      'serviceName',
      'timeSlot',
      'customerName',
    ] as const;

    for (const key of inheritKeys) {
      const value = merged[key];
      if ((value == null || value === '') && session[key]) {
        merged[key] = session[key];
      }
    }

    return merged;
  }

  private attachSessionContext(
    result: CommandResult,
    params: Record<string, any>,
    employeeName?: string,
  ): CommandResult {
    const sessionContext = {
      employeeName: employeeName ?? params.employeeName ?? null,
      date: params.date ? formatDateDisplay(params.date) : null,
      serviceName: params.serviceName ?? null,
      timeSlot: params.timeSlot ?? null,
      customerName: params.customerName ?? null,
    };

    return {
      ...result,
      details: {
        ...result.details,
        sessionContext,
      },
    };
  }

  private async classifyIntent(
    prompt: string,
    context: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, any>,
  ): Promise<{ action: string; params: any; reasoning: string } | null> {
    try {
      const sessionBlock =
        sessionContext && Object.values(sessionContext).some((v) => v != null && v !== '')
          ? `\nActive session context (inherit in params when not overridden by the latest message):\n${JSON.stringify(sessionContext, null, 2)}`
          : '';

      const historyMessages = (history ?? [])
        .slice(-10)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${INTENT_SCHEMA}\n\n${context}${sessionBlock}`,
          },
          ...historyMessages,
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 500,
      });
      const raw = response.choices[0]?.message?.content;
      return raw ? JSON.parse(raw) : null;
    } catch (err: any) {
      this.logger.error(`Intent classification failed: ${err.message}`);
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
    const missing: string[] = [];
    if (!params.employeeName) missing.push('service provider name');
    if (!params.serviceName) missing.push('service name');
    if (!params.date) missing.push('date');
    if (!params.timeSlot) missing.push('start time');

    if (missing.length > 0) {
      return {
        success: false,
        action: 'create_booking',
        summary: `Cannot book appointment — missing: ${missing.join(', ')}. Example: "Book facemassage with Gevorg Gasparyan on 30_06_2026 at 16:00" (follow-ups can omit provider/date if already discussed).`,
        details: { params, missing },
      };
    }

    const resolvedEmployee = this.resolveEmployee(employees, params.employeeName);
    const service = this.resolveService(services, params.serviceName);
    const customer = params.customerName
      ? this.resolveCustomer(customers, params.customerName)
      : undefined;

    if (!resolvedEmployee) {
      return {
        success: false,
        action: 'create_booking',
        summary: `Service provider "${params.employeeName}" not found. Available: ${employees.map((e) => e.name).join(', ')}`,
        details: { params },
      };
    }

    if (!service) {
      return {
        success: false,
        action: 'create_booking',
        summary: `Service "${params.serviceName}" not found. Available: ${services.map((s) => s.name).join(', ')}`,
        details: { params },
      };
    }

    if (params.customerName && !customer) {
      return {
        success: false,
        action: 'create_booking',
        summary: `Customer "${params.customerName}" not found. Available: ${customers.map((c) => c.name).join(', ') || 'none — omit customer for walk-in'}`,
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

  private normalizeDateParams(params: Record<string, any>) {
    for (const key of ['date', 'dateFrom', 'dateTo'] as const) {
      if (params[key]) params[key] = toIsoDay(params[key]);
    }
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
    params: any,
    employeeId?: string,
    employeeName?: string,
  ): Promise<CommandResult> {
    const where: any = { businessId };
    if (employeeId) where.employeeId = employeeId;

    const isoDay = params.date || new Date().toISOString().split('T')[0];
    const displayDay = formatDateDisplay(isoDay);
    const d = new Date(isoDay);
    const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);
    where.startTime = Between(dayStart, dayEnd);

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    const scopeLabel = employeeName || 'all service providers';
    const activeBookings = bookings.filter((b) => b.status !== BookingStatus.CANCELLED);
    const cancelledBookings = bookings.filter((b) => b.status === BookingStatus.CANCELLED);

    let summaryBody: string;
    if (bookings.length === 0) {
      summaryBody = `No appointments found for ${scopeLabel} on ${displayDay}.`;
    } else if (employeeId) {
      const lines = this.formatBookingLines(activeBookings);
      const cancelledNote =
        cancelledBookings.length > 0 ? `\n(${cancelledBookings.length} cancelled — hidden)` : '';
      summaryBody = [
        `${activeBookings.length} appointment(s) for ${scopeLabel} on ${displayDay}:${cancelledNote}`,
        ...lines,
      ].join('\n');
    } else {
      const byProvider = new Map<string, Booking[]>();
      for (const booking of activeBookings) {
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
        cancelledBookings.length > 0 ? `\n(${cancelledBookings.length} cancelled across all providers — hidden)` : '';
      summaryBody = [
        `${activeBookings.length} appointment(s) for all service providers on ${displayDay}:${cancelledNote}`,
        ...groupedLines,
      ].join('\n');
    }

    return {
      success: true,
      action: 'show_appointments',
      summary: summaryBody,
      details: {
        count: bookings.length,
        activeCount: activeBookings.length,
        cancelledCount: cancelledBookings.length,
        date: displayDay,
        scope: employeeId ? 'provider' : 'all_providers',
        employee: employeeName ?? null,
        bookings: bookings.map((b) => ({
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
      this.handleListBookings(businessId, { ...params, date: isoDay }, employeeId, employeeName),
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
    if (!params.bookingId) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary: 'Please specify which booking to reschedule (by ID or more details about the booking).',
        details: {},
      };
    }

    if (!params.timeSlot && !params.date) {
      return {
        success: false,
        action: 'reschedule_booking',
        summary: 'Please specify the new date/time for the rescheduled booking.',
        details: {},
      };
    }

    return {
      success: false,
      action: 'reschedule_booking',
      summary: 'Rescheduling via AI command is not yet implemented. Please use the booking form to reschedule.',
      details: { params },
    };
  }
}
