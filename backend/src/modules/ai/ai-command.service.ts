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
import { BookingService } from '../booking/booking.service.js';

export interface CommandResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, any>;
}

const INTENT_SCHEMA = `You are an AI assistant for a booking/scheduling platform.
Given a user's natural-language command and the available business data, classify the intent
and extract structured parameters. Return a JSON object with:

{
  "action": "create_booking" | "cancel_bookings" | "list_bookings" | "check_availability" | "reschedule_booking" | "summarize_day" | "unknown",
  "params": {
    "employeeName": "string or null — the service provider's name mentioned",
    "customerName": "string or null",
    "serviceName": "string or null — single service (mainly for create_booking)",
    "serviceNames": ["string"] or null — one or more service types to filter (for cancel_bookings / list_bookings), e.g. [\"hairdrying\", \"hairstyle\"],
    "date": "YYYY-MM-DD or null — the date referenced (resolve relative dates like 'tomorrow' from today's date)",
    "dateFrom": "YYYY-MM-DD or null — start of range if a range is mentioned",
    "dateTo": "YYYY-MM-DD or null — end of range",
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
- If you cannot determine the action, use "unknown".`;

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
    private bookingService: BookingService,
    private config: ConfigService,
  ) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — AI commands unavailable');
    }
  }

  async executeCommand(
    businessId: string,
    prompt: string,
    userId?: string,
  ): Promise<CommandResult> {
    if (!this.client) {
      return { success: false, action: 'error', summary: 'OpenAI API key not configured', details: {} };
    }

    const [employees, services, customers] = await Promise.all([
      this.employeeRepo.find({ where: { businessId, isActive: true } }),
      this.serviceRepo.find({ where: { businessId } }),
      this.customerRepo.find({ where: { businessId, isActive: true } }),
    ]);

    const contextBlock = `Current date: ${new Date().toISOString().split('T')[0]}
Available employees: ${employees.map((e) => `${e.name} (id: ${e.id})`).join(', ')}
Available services: ${services.map((s) => `${s.name} (id: ${s.id})`).join(', ')}
Available customers: ${customers.map((c) => `${c.name} (id: ${c.id})`).join(', ')}`;

    const parsed = await this.classifyIntent(prompt, contextBlock);
    if (!parsed) {
      return { success: false, action: 'error', summary: 'Failed to understand the command. Please try rephrasing.', details: {} };
    }

    this.logger.log(`AI classified action="${parsed.action}" — ${parsed.reasoning}`);

    const employeeId = parsed.params.employeeName
      ? this.resolveEmployee(employees, parsed.params.employeeName)?.id
      : undefined;

    switch (parsed.action) {
      case 'create_booking':
        return this.handleCreateBooking(
          businessId,
          parsed.params,
          employees,
          services,
          customers,
          userId,
        );
      case 'cancel_bookings':
        return this.handleCancelBookings(
          businessId,
          parsed.params,
          services,
          employeeId,
          userId,
        );
      case 'list_bookings':
        return this.handleListBookings(businessId, parsed.params, employeeId);
      case 'check_availability':
        return this.handleCheckAvailability(businessId, parsed.params, employeeId);
      case 'summarize_day':
        return this.handleSummarizeDay(businessId, parsed.params, employeeId);
      case 'reschedule_booking':
        return this.handleRescheduleBooking(businessId, parsed.params, employeeId, userId);
      default:
        return {
          success: false,
          action: 'unknown',
          summary: `I understood: "${parsed.reasoning}" but I don't know how to execute that action yet. Supported actions: book appointment, cancel bookings, list bookings, check availability, summarize a day, reschedule a booking.`,
          details: { parsed },
        };
    }
  }

  private async classifyIntent(
    prompt: string,
    context: string,
  ): Promise<{ action: string; params: any; reasoning: string } | null> {
    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `${INTENT_SCHEMA}\n\n${context}` },
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
        summary: `Cannot book appointment — missing: ${missing.join(', ')}. Example: "Book facemassage with Gevorg Gasparyan for customer John on 2026-06-02 at 09:00"`,
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

    try {
      const booking = await this.bookingService.create(
        businessId,
        {
          employeeId: resolvedEmployee.id,
          serviceId: service.id,
          customerId: customer?.id,
          startTime,
          notes: params.notes || params.reason || undefined,
          description: params.notes || undefined,
        },
        userId,
      );

      const timeLabel = `${snappedTime} UTC`;
      const customerLabel = customer?.name || 'Walk-in';

      return {
        success: true,
        action: 'create_booking',
        summary: [
          `Booking created successfully.`,
          `• Service: ${service.name}`,
          `• Provider: ${resolvedEmployee.name}`,
          `• Customer: ${customerLabel}`,
          `• Date/time: ${params.date} ${timeLabel}`,
          `• Booking ID: ${booking.id}`,
        ].join('\n'),
        details: {
          bookingId: booking.id,
          employee: resolvedEmployee.name,
          service: service.name,
          customer: customerLabel,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
        },
      };
    } catch (err: any) {
      const message =
        err?.response?.message ||
        err?.message ||
        'Failed to create booking';
      const text = Array.isArray(message) ? message.join('; ') : String(message);

      return {
        success: false,
        action: 'create_booking',
        summary: `Could not create booking: ${text}`,
        details: {
          params: {
            employee: resolvedEmployee.name,
            service: service.name,
            customer: customer?.name,
            startTime,
          },
          error: text,
        },
      };
    }
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
      const dateFilter = params.date ? ` on ${params.date}` : '';
      return {
        success: true,
        action: 'cancel_bookings',
        summary: `No active bookings found${empFilter}${serviceFilter}${dateFilter}. Nothing to cancel.`,
        details: {
          matchedCount: 0,
          filters: {
            employee: params.employeeName ?? null,
            services: matchedServices.map((s) => s.name),
            date: params.date ?? null,
          },
        },
      };
    }

    const reason = params.reason || 'Cancelled via AI command';
    const cancelled: string[] = [];

    for (const booking of bookings) {
      await this.bookingService.cancel(booking.id, reason, userId);
      cancelled.push(booking.id);
    }

    const empName = params.employeeName || bookings[0]?.employee?.name || 'all providers';
    const dateStr = params.date || `${params.dateFrom} to ${params.dateTo}` || 'all dates';
    const serviceStr = matchedServices.length
      ? matchedServices.map((s) => s.name).join(', ')
      : 'all services';

    return {
      success: true,
      action: 'cancel_bookings',
      summary: `Cancelled ${cancelled.length} booking(s) for ${empName} (${serviceStr}) on ${dateStr}. Reason: "${reason}"`,
      details: {
        cancelledCount: cancelled.length,
        cancelledIds: cancelled,
        reason,
        filters: {
          employee: empName,
          services: matchedServices.map((s) => s.name),
          date: params.date ?? null,
        },
        bookings: bookings.map((b) => ({
          id: b.id,
          service: b.service?.name,
          customer: b.customer?.name || 'Walk-in',
          time: `${b.startTime.toISOString()} – ${b.endTime.toISOString()}`,
        })),
      },
    };
  }

  private async handleListBookings(
    businessId: string,
    params: any,
    employeeId?: string,
  ): Promise<CommandResult> {
    const where: any = { businessId };
    if (employeeId) where.employeeId = employeeId;

    const targetDate = params.date || new Date().toISOString().split('T')[0];
    const d = new Date(targetDate);
    const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);
    where.startTime = Between(dayStart, dayEnd);

    const bookings = await this.bookingRepo.find({
      where,
      relations: { employee: true, service: true, customer: true },
      order: { startTime: 'ASC' },
    });

    const lines = bookings.map((b) => {
      const time = `${b.startTime.toISOString().substring(11, 16)}–${b.endTime.toISOString().substring(11, 16)}`;
      return `• ${time} | ${b.service?.name || 'Service'} | ${b.customer?.name || 'Walk-in'} | ${b.status}`;
    });

    const empName = employeeId
      ? bookings[0]?.employee?.name || 'the provider'
      : 'all providers';

    return {
      success: true,
      action: 'list_bookings',
      summary: bookings.length > 0
        ? `${bookings.length} booking(s) for ${empName} on ${targetDate}:\n${lines.join('\n')}`
        : `No bookings found for ${empName} on ${targetDate}.`,
      details: {
        count: bookings.length,
        date: targetDate,
        bookings: bookings.map((b) => ({
          id: b.id,
          service: b.service?.name,
          customer: b.customer?.name,
          employee: b.employee?.name,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
        })),
      },
    };
  }

  private async handleCheckAvailability(
    businessId: string,
    params: any,
    employeeId?: string,
  ): Promise<CommandResult> {
    const targetDate = params.date || new Date().toISOString().split('T')[0];
    const d = new Date(targetDate);
    const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);

    const where: any = { businessId, startTime: Between(dayStart, dayEnd) as any };
    if (employeeId) where.employeeId = employeeId;

    const periods = await this.periodRepo.find({ where, order: { startTime: 'ASC' } });

    const serviceBlocks = periods.filter((p) => p.type === 'service_block');
    const blocked = periods.filter((p) => p.type !== 'service_block');

    const empName = employeeId ? (periods[0]?.employeeId ? 'the provider' : 'all providers') : 'all providers';

    if (periods.length === 0) {
      return {
        success: true,
        action: 'check_availability',
        summary: `No schedule applied for ${empName} on ${targetDate}.`,
        details: { date: targetDate, periods: [] },
      };
    }

    const lines = serviceBlocks.map((p) => {
      const from = p.startTime.toISOString().substring(11, 16);
      const to = p.endTime.toISOString().substring(11, 16);
      return `• ${from}–${to} (service block${p.serviceIds?.length ? ': ' + p.serviceIds.join(', ') : ''})`;
    });

    return {
      success: true,
      action: 'check_availability',
      summary: `Schedule for ${targetDate}: ${serviceBlocks.length} service block(s), ${blocked.length} blocked period(s).\n${lines.join('\n')}`,
      details: {
        date: targetDate,
        serviceBlocks: serviceBlocks.length,
        blockedPeriods: blocked.length,
        periods: periods.map((p) => ({
          type: p.type,
          startTime: p.startTime,
          endTime: p.endTime,
          serviceIds: p.serviceIds,
        })),
      },
    };
  }

  private async handleSummarizeDay(
    businessId: string,
    params: any,
    employeeId?: string,
  ): Promise<CommandResult> {
    const targetDate = params.date || new Date().toISOString().split('T')[0];

    const [bookingsResult, availResult] = await Promise.all([
      this.handleListBookings(businessId, { ...params, date: targetDate }, employeeId),
      this.handleCheckAvailability(businessId, { ...params, date: targetDate }, employeeId),
    ]);

    const bookings = bookingsResult.details.bookings || [];
    const active = bookings.filter((b: any) => b.status !== 'cancelled');
    const cancelled = bookings.filter((b: any) => b.status === 'cancelled');

    return {
      success: true,
      action: 'summarize_day',
      summary: [
        `Day summary for ${targetDate}:`,
        `  Schedule: ${availResult.details.serviceBlocks || 0} service blocks, ${availResult.details.blockedPeriods || 0} blocked periods`,
        `  Bookings: ${active.length} active, ${cancelled.length} cancelled`,
        active.length > 0 ? `  Active bookings:` : '',
        ...active.map((b: any) =>
          `    • ${b.startTime?.toString().substring(11, 16)}–${b.endTime?.toString().substring(11, 16)} | ${b.service || 'Service'} | ${b.customer || 'Walk-in'}`
        ),
      ].filter(Boolean).join('\n'),
      details: {
        date: targetDate,
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
