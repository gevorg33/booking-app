import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { PublicBookingService } from './public-booking.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { BusinessService } from '../business/business.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import {
  getDateKeyInTimezone,
  isWallClockSlotBookable,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import { CreatePublicBookingDto } from './dto/public-booking.dto.js';
import { resolveLocale, t, localeLanguageInstruction, type AppLocale } from '../../common/i18n/messages.js';
import {
  isAnyProviderBookingPrompt,
  isFirstAvailableBookingPrompt,
} from '../ai/ai-intent-heuristics.js';
import { parseEarliestBookingTimeFromPrompt } from '../ai/ai-orchestration.helpers.js';

export interface PublicAssistantNavigate {
  path: 'professionals' | 'services' | 'checkout';
  query: Record<string, string>;
}

export interface PublicAssistantResult {
  success: boolean;
  action: string;
  summary: string;
  sessionContext?: Record<string, string | null>;
  navigate?: PublicAssistantNavigate;
  bookingId?: string;
}

const PUBLIC_INTENT_SCHEMA = `You are a friendly booking assistant for a customer-facing online appointment page.
Classify the user's message and extract parameters. Return JSON:

{
  "action": "list_providers" | "list_services" | "check_availability" | "business_info" | "book_appointment" | "booking_help" | "unknown",
  "params": {
    "employeeName": "string or null",
    "serviceName": "string or null",
    "date": "DD_MM_YYYY or null — resolve relative dates from today's date",
    "timeSlot": "HH:MM 24h or null",
    "timeFrom": "HH:MM or null — earliest time when user says after 16:00",
    "bookingFirstAvailable": boolean or null — true for nearest/first/next available/ASAP booking,
    "allProviders": boolean or null — true when user wants any specialist/provider,
    "customerName": "string or null",
    "customerEmail": "string or null",
    "customerPhone": "string or null"
  },
  "reasoning": "one short sentence"
}

Rules:
- Customers want to book appointments, see who is available, prices, and business contact info.
- Use check_availability when asking about open times, slots, or when someone is free.
- Use list_providers for "who works here", "which specialist", etc.
- Use list_services for prices, durations, what you offer.
- Use business_info for address, phone, hours, location, contact.
- Use book_appointment when they want to book/reserve/schedule and mention provider, service, time, or contact details.
- "Book nearest/first/next available {service} on any specialist" → book_appointment with serviceName, bookingFirstAvailable=true, allProviders=true, employeeName=null, timeSlot=null.
- "Nearest slot for {service} with {name}" / "after 16:00" → bookingFirstAvailable=true, employeeName if named, timeFrom when after HH:MM is given.
- Use booking_help to explain how online booking works.
- Never invent staff or services — only use names from the provided lists.
- Multi-turn: inherit employeeName, date, serviceName, timeSlot from session context when omitted (not for bookingFirstAvailable — always resolve fresh nearest slot).
- book_appointment with bookingFirstAvailable needs serviceName only (+ customer contact to complete). Otherwise needs employeeName, serviceName, date, timeSlot, customerName, and (customerEmail OR customerPhone).
- Normalize dates to DD_MM_YYYY in params.`;

@Injectable()
export class PublicBookingAssistantService {
  private readonly logger = new Logger(PublicBookingAssistantService.name);

  constructor(
    private publicBookingService: PublicBookingService,
    private businessService: BusinessService,
    private openAi: OpenAiGatewayService,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
  ) {}

  async chat(
    slug: string,
    prompt: string,
    session?: {
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      context?: Record<string, any>;
      locale?: string;
    },
  ): Promise<PublicAssistantResult> {
    const business = await this.businessService.findBySlug(slug);
    const locale = resolveLocale(session?.locale, resolveLocale(business.settings?.locale, 'en'));

    if (!(await this.openAi.isAvailableForBusiness(business.id))) {
      return {
        success: false,
        action: 'error',
        summary: t(locale, 'assistant.unavailable'),
      };
    }
    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const todayDisplay = formatDateDisplay(todayKey);

    const [employees, services] = await Promise.all([
      this.employeeRepo.find({ where: { businessId: business.id, isActive: true }, order: { name: 'ASC' } }),
      this.serviceRepo.find({ where: { businessId: business.id, isActive: true }, order: { name: 'ASC' } }),
    ]);

    const contextBlock = `Business: ${business.name}
Today's date: ${todayDisplay} (DD_MM_YYYY; schedule times are shown in 24h HH:mm)
Providers: ${employees.map((e) => {
      const title = e.metadata?.title || e.metadata?.role;
      return title ? `${e.name} (${title})` : e.name;
    }).join(', ') || 'none'}
Services: ${services.map((s) => `${s.name} — ${s.durationMinutes} min, ${s.price} ${s.currency}`).join(', ') || 'none'}`;

    const parsed = await this.classifyIntent(business.id, prompt, contextBlock, session?.history, session?.context, locale);
    if (!parsed) {
      return {
        success: false,
        action: 'unknown',
        summary: t(locale, 'assistant.unknown'),
      };
    }

    this.applyBookingHeuristics(prompt, parsed.params, parsed.action);
    parsed.params = this.mergeSessionContext(parsed.params, session?.context, parsed.action);
    this.normalizeDateParams(parsed.params, todayKey);

    this.logger.log(`Public assistant action="${parsed.action}" — ${parsed.reasoning}`);

    let result: PublicAssistantResult;

    switch (parsed.action) {
      case 'list_providers':
        result = await this.handleListProviders(slug, parsed.params, locale);
        break;
      case 'list_services':
        result = await this.handleListServices(slug, parsed.params, employees);
        break;
      case 'check_availability':
        result = await this.handleCheckAvailability(slug, parsed.params, employees);
        break;
      case 'business_info':
        result = this.handleBusinessInfo(business);
        break;
      case 'book_appointment':
        result = await this.handleBookAppointment(slug, parsed.params, employees, services, locale);
        break;
      case 'booking_help':
        result = this.handleBookingHelp(locale);
        break;
      default:
        result = {
          success: false,
          action: 'unknown',
          summary: t(locale, 'assistant.helpPrompt'),
        };
    }

    return this.attachSession(result, parsed.params, employees);
  }

  private async handleListProviders(slug: string, params: any, locale: AppLocale): Promise<PublicAssistantResult> {
    const { providers } = await this.publicBookingService.getProviders(slug, params.date);
    if (providers.length === 0) {
      return {
        success: true,
        action: 'list_providers',
        summary: t(locale, 'assistant.noSpecialists'),
      };
    }

    const lines = providers.map((p) => {
      const title = p.role ? ` — ${p.role}` : '';
      const slots = p.slots.slice(0, 4).map((s) => formatTimeDisplay(s.startTime)).join(', ');
      const slotText = slots
        ? p.nearestDateLabel
          ? `${t(locale, 'assistant.nextOn')} ${p.nearestDateLabel}: ${slots}${p.slots.length > 4 ? '…' : ''}`
          : `${t(locale, 'assistant.open')}: ${slots}`
        : t(locale, 'assistant.noUpcomingSlots');
      return `• ${p.name}${title} — ${slotText}`;
    });

    return {
      success: true,
      action: 'list_providers',
      summary: [t(locale, 'assistant.specialistsHeader'), '', ...lines].join('\n'),
      navigate: { path: 'professionals', query: {} },
    };
  }

  private async handleListServices(
    slug: string,
    params: any,
    employees: Employee[],
  ): Promise<PublicAssistantResult> {
    const employee = params.employeeName
      ? this.fuzzyMatchByName(employees, params.employeeName)
      : undefined;

    const { services } = await this.publicBookingService.getServices(slug, employee?.id);
    if (services.length === 0) {
      return {
        success: true,
        action: 'list_services',
        summary: employee
          ? `No services listed for ${employee.name} right now.`
          : 'No services are available for online booking at the moment.',
      };
    }

    const lines = services.map(
      (s) => `• ${s.name} — ${s.durationMinutes} min · ${s.price} ${s.currency}`,
    );

    const header = employee
      ? `Services with ${employee.name}:`
      : 'Our services:';

    return {
      success: true,
      action: 'list_services',
      summary: [header, '', ...lines].join('\n'),
    };
  }

  private async handleCheckAvailability(
    slug: string,
    params: any,
    employees: Employee[],
  ): Promise<PublicAssistantResult> {
    if (!params.employeeName) {
      return {
        success: true,
        action: 'check_availability',
        summary: 'Which specialist would you like to check? ' + employees.map((e) => e.name).join(', '),
      };
    }

    const employee = this.fuzzyMatchByName(employees, params.employeeName);
    if (!employee) {
      return {
        success: false,
        action: 'check_availability',
        summary: `I couldn't find "${params.employeeName}". Available: ${employees.map((e) => e.name).join(', ')}`,
      };
    }

    const dateKey = params.date || getDateKeyInTimezone(new Date(), resolveTimezone('UTC'));
    const business = await this.businessService.findBySlug(slug);
    const tz = resolveTimezone(business.timezone);
    const { slots, employeeName } = await this.publicBookingService.getProviderSlots(
      slug,
      employee.id,
      dateKey,
    );

    const upcomingSlots = slots.filter((s) =>
      isWallClockSlotBookable(dateKey, formatTimeDisplay(s.startTime), tz, null),
    );

    const displayDay = formatDateDisplay(dateKey);
    if (upcomingSlots.length === 0) {
      return {
        success: true,
        action: 'check_availability',
        summary: `${employeeName} has no open slots on ${displayDay}. Try another day or pick a time from the booking page.`,
        navigate: { path: 'professionals', query: { employeeId: employee.id } },
      };
    }

    const times = upcomingSlots.map((s) => formatTimeDisplay(s.startTime)).join(', ');
    const firstSlot = upcomingSlots[0].startTime;

    return {
      success: true,
      action: 'check_availability',
      summary: `Open times for ${employeeName} on ${displayDay}:\n${times}`,
      navigate: {
        path: 'professionals',
        query: { employeeId: employee.id, startTime: firstSlot },
      },
    };
  }

  private handleBusinessInfo(business: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): PublicAssistantResult {
    const parts = [`${business.name}`];
    if (business.description) parts.push(business.description);
    if (business.address) parts.push(`Address: ${business.address}`);
    if (business.phone) parts.push(`Phone: ${business.phone}`);
    if (business.email) parts.push(`Email: ${business.email}`);

    return {
      success: true,
      action: 'business_info',
      summary: parts.join('\n'),
    };
  }

  private handleBookingHelp(locale: AppLocale): PublicAssistantResult {
    const steps =
      locale === 'hy'
        ? [
            'Առցանց ամրագրումը հեշտ է՝',
            '1. Ընտրեք մասնագետ և ժամ',
            '2. Ընտրեք ծառայություն',
            '3. Մուտքագրեք անուն և կոնտակտ',
            '',
            'Կամ ասեք, թե ինչ է պետք — օրինակ «Ամրագրիր facemassage Gevorg-ի հետ վաղը 10:00» — և ես կօգնեմ։',
          ]
        : locale === 'ru'
          ? [
              'Онлайн-запись проста:',
              '1. Выберите специалиста и время',
              '2. Выберите услугу',
              '3. Укажите имя и контакт',
              '',
              'Или скажите, что нужно — например «Запиши facemassage с Gevorg на завтра в 10:00» — и я помогу.',
            ]
          : [
              'Booking online is easy:',
              '1. Choose a specialist and time',
              '2. Pick a service',
              '3. Enter your name and contact details',
              '',
              'Or tell me what you need — e.g. "Book facemassage with Gevorg tomorrow at 10:00" or "Book the nearest hairstyle slot on any specialist after 16:00" — and I\'ll guide you.',
            ];

    return {
      success: true,
      action: 'booking_help',
      summary: steps.join('\n'),
      navigate: { path: 'professionals', query: {} },
    };
  }

  private async handleBookAppointment(
    slug: string,
    params: any,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
  ): Promise<PublicAssistantResult> {
    const employee = params.employeeName
      ? this.fuzzyMatchByName(employees, params.employeeName)
      : undefined;
    const service = params.serviceName
      ? this.fuzzyMatchByName(services, params.serviceName)
      : undefined;

    if (params.employeeName && !employee) {
      return {
        success: false,
        action: 'book_appointment',
        summary: `Specialist "${params.employeeName}" not found. Available: ${employees.map((e) => e.name).join(', ')}`,
      };
    }

    if (params.serviceName && !service) {
      return {
        success: false,
        action: 'book_appointment',
        summary: `Service "${params.serviceName}" not found. Available: ${services.map((s) => s.name).join(', ')}`,
      };
    }

    if (params.bookingFirstAvailable) {
      if (!service) {
        return {
          success: false,
          action: 'book_appointment',
          summary: t(locale, 'assistant.nearestNeedsService'),
        };
      }

      const nearest = await this.publicBookingService.findNearestBookableSlot(slug, {
        serviceId: service.id,
        employeeId: params.allProviders ? null : employee?.id ?? null,
        notBeforeTime: params.timeFrom ?? null,
        startDateKey: params.date ?? null,
      });

      if (!nearest) {
        const afterLabel = params.timeFrom ? ` after ${params.timeFrom}` : '';
        return {
          success: false,
          action: 'book_appointment',
          summary: t(locale, 'assistant.noNearestSlot', {
            service: service.name,
            after: afterLabel,
          }),
        };
      }

      params.employeeName = nearest.employeeName;
      params.date = nearest.dateKey;
      params.timeSlot = formatTimeDisplay(nearest.startTime);
      params.startTime = nearest.startTime;
      params.employeeId = nearest.employeeId;
    }

    const missing: string[] = [];
    if (!params.employeeName && !params.employeeId) missing.push('specialist');
    if (!params.serviceName && !service) missing.push('service');
    if (!params.bookingFirstAvailable && !params.date) missing.push('date');
    if (!params.bookingFirstAvailable && !params.timeSlot) missing.push('time');

    const resolvedEmployee =
      employee ??
      (params.employeeId
        ? employees.find((e) => e.id === params.employeeId)
        : params.employeeName
          ? this.fuzzyMatchByName(employees, params.employeeName)
          : undefined);
    const resolvedService = service;

    if (
      missing.length > 0 ||
      !resolvedEmployee ||
      !resolvedService ||
      !params.date ||
      !params.timeSlot
    ) {
      const navigateQuery: Record<string, string> = {};
      if (resolvedEmployee) navigateQuery.employeeId = resolvedEmployee.id;
      if (params.date && params.timeSlot) {
        navigateQuery.startTime = `${params.date}T${this.snapTo10min(params.timeSlot)}:00.000Z`;
      } else if (resolvedEmployee && params.date) {
        const { slots } = await this.publicBookingService.getProviderSlots(
          slug,
          resolvedEmployee.id,
          params.date,
        );
        if (slots[0]) navigateQuery.startTime = slots[0].startTime;
      }

      return {
        success: false,
        action: 'book_appointment',
        summary: `To finish booking I still need: ${missing.join(', ') || 'a valid time slot'}. You can also continue in the booking flow — I've pre-filled what I could.`,
        navigate: {
          path: resolvedEmployee && navigateQuery.startTime ? 'services' : 'professionals',
          query: navigateQuery,
        },
      };
    }

    const snappedTime = this.snapTo10min(params.timeSlot);
    const startTime = params.startTime ?? `${params.date}T${snappedTime}:00.000Z`;

    const { services: slotServices } = await this.publicBookingService.getServicesForSlot(
      slug,
      resolvedEmployee.id,
      startTime,
    );
    const fits = slotServices.some((s) => s.id === resolvedService.id);
    if (!fits) {
      const fit = await this.publicBookingService.explainServiceSlotFit(
        slug,
        resolvedEmployee.id,
        startTime,
        resolvedService.id,
      );
      const summary = this.buildServiceUnfitSummary(
        resolvedService,
        resolvedEmployee,
        params.date,
        snappedTime,
        slotServices,
        fit,
      );
      return {
        success: false,
        action: 'book_appointment',
        summary,
        navigate: {
          path: 'services',
          query: { employeeId: resolvedEmployee.id, startTime },
        },
      };
    }

    const hasContact = params.customerEmail || params.customerPhone;
    if (!params.customerName || !hasContact) {
      return {
        success: false,
        action: 'book_appointment',
        summary: `Great — ${resolvedService.name} with ${resolvedEmployee.name} on ${formatDateDisplay(params.date)} at ${snappedTime}. Please add your name and email or phone on the checkout screen to confirm.`,
        navigate: {
          path: 'checkout',
          query: {
            employeeId: resolvedEmployee.id,
            startTime,
            serviceId: resolvedService.id,
          },
        },
      };
    }

    const dto: CreatePublicBookingDto = {
      employeeId: resolvedEmployee.id,
      serviceId: resolvedService.id,
      startTime,
      customer: {
        name: params.customerName,
        email: params.customerEmail || undefined,
        phone: params.customerPhone || undefined,
      },
      notes: params.notes || undefined,
    };

    try {
      const { booking } = await this.publicBookingService.createBooking(slug, dto);
      const bookingId = (booking as any)?.id;
      const range = formatTimeRangeDisplay(
        startTime,
        new Date(
          new Date(startTime).getTime() +
            (resolvedService.durationMinutes + resolvedService.bufferMinutes) * 60000,
        ),
      );

      return {
        success: true,
        action: 'book_appointment',
        summary: `You're booked! ${resolvedService.name} with ${resolvedEmployee.name} on ${formatDateDisplay(params.date)} (${range}).`,
        bookingId,
      };
    } catch (err: any) {
      return {
        success: false,
        action: 'book_appointment',
        summary: err?.message || 'That slot is no longer available. Please pick another time.',
        navigate: {
          path: 'professionals',
          query: { employeeId: resolvedEmployee.id, startTime },
        },
      };
    }
  }

  private async classifyIntent(
    businessId: string,
    prompt: string,
    context: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, any>,
    locale: AppLocale = 'en',
  ) {
    const sessionBlock =
      sessionContext && Object.values(sessionContext).some((v) => v != null && v !== '')
        ? `\nActive session:\n${JSON.stringify(sessionContext, null, 2)}`
        : '';

    const historyMessages = (history ?? [])
      .slice(-8)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${PUBLIC_INTENT_SCHEMA}\n\n${localeLanguageInstruction(locale)}\n\n${context}${sessionBlock}`,
      },
      ...historyMessages,
      { role: 'user', content: prompt },
    ];

    const response = await this.openAi.chatCompletion(
      {
        businessId,
        surface: 'public_booking',
        operation: 'classify_intent',
        actorType: 'customer',
      },
      {
        messages,
        responseFormat: 'json_object',
        temperature: 0.2,
        maxTokens: 450,
      },
    );

    const raw = response?.choices[0]?.message?.content;
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (err: any) {
      this.logger.error(`Public assistant classification parse failed: ${err.message}`);
      return null;
    }
  }

  private mergeSessionContext(
    params: Record<string, any>,
    session?: Record<string, any>,
    action?: string,
  ) {
    if (!session) return params;
    const merged = { ...params };
    const skipForNearest = action === 'book_appointment' && params.bookingFirstAvailable === true;
    for (const key of [
      'employeeName',
      'date',
      'serviceName',
      'timeSlot',
      'customerName',
      'customerEmail',
      'customerPhone',
    ]) {
      if (skipForNearest && (key === 'date' || key === 'timeSlot' || key === 'employeeName')) {
        continue;
      }
      if ((merged[key] == null || merged[key] === '') && session[key]) {
        merged[key] = session[key];
      }
    }
    return merged;
  }

  private applyBookingHeuristics(prompt: string, params: Record<string, any>, action: string) {
    if (action !== 'book_appointment') return;

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

  private buildServiceUnfitSummary(
    service: Service,
    employee: Employee,
    date: string,
    time: string,
    slotServices: Array<{ name: string; durationMinutes: number; bufferMinutes: number }>,
    fit: {
      requiredMinutes?: number;
      remainingMinutes?: number;
      availableUntil?: Date;
      failureReason?: string;
      message?: string;
    },
  ): string {
    const dateStr = formatDateDisplay(date);
    const lines: string[] = [`${service.name} isn't available at ${time} on ${dateStr}.`];

    const required = fit.requiredMinutes ?? service.durationMinutes + service.bufferMinutes;
    const remaining = fit.remainingMinutes;
    const until = fit.availableUntil ? formatTimeDisplay(fit.availableUntil) : null;

    if (
      (fit.failureReason === 'duration' || fit.failureReason === 'service_period') &&
      until &&
      remaining !== undefined &&
      remaining < required
    ) {
      lines.push(
        `${employee.name} is only available until ${until} — that leaves ${remaining} minutes from ${time}, but ${service.name} needs ${required} minutes.`,
      );
    } else if (fit.failureReason === 'service_restriction') {
      lines.push(
        `${employee.name} does not offer ${service.name} during the entire time window starting at ${time}.`,
      );
    } else if (fit.message) {
      lines.push(fit.message);
    }

    if (slotServices.length > 0) {
      const list = slotServices
        .map((s) => `${s.name} (${s.durationMinutes + s.bufferMinutes} min)`)
        .join(', ');
      lines.push(`Services you can book at that time: ${list}.`);
      if (remaining !== undefined && remaining < required) {
        lines.push(
          `Try an earlier start time so the full ${required}-minute appointment fits, or choose one of the shorter services above.`,
        );
      }
    } else {
      lines.push('No services fit that time slot. Please choose a different time.');
    }

    return lines.join('\n');
  }

  private normalizeDateParams(params: Record<string, any>, fallbackDateKey: string) {
    if (params.date) {
      params.date = toIsoDay(params.date) ?? fallbackDateKey;
    }
  }

  private attachSession(
    result: PublicAssistantResult,
    params: Record<string, any>,
    employees: Employee[],
  ): PublicAssistantResult {
    const employee = params.employeeName
      ? this.fuzzyMatchByName(employees, params.employeeName)
      : undefined;

    return {
      ...result,
      sessionContext: {
        employeeName: employee?.name ?? params.employeeName ?? null,
        date: params.date ? formatDateDisplay(params.date) : null,
        serviceName: params.serviceName ?? null,
        timeSlot: params.timeSlot ?? null,
        customerName: params.customerName ?? null,
        customerEmail: params.customerEmail ?? null,
        customerPhone: params.customerPhone ?? null,
      },
    };
  }

  private fuzzyMatchByName<T extends { name: string }>(items: T[], name: string): T | undefined {
    const lower = name.toLowerCase().trim();
    return (
      items.find((item) => item.name.toLowerCase() === lower) ||
      items.find((item) => item.name.toLowerCase().includes(lower)) ||
      items.find((item) => lower.includes(item.name.toLowerCase()))
    );
  }

  private snapTo10min(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    return `${String(h).padStart(2, '0')}:${String(Math.floor(m / 10) * 10).padStart(2, '0')}`;
  }
}
