import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Booking, BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
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
import { AiPromptSecurityService } from '../ai/ai-prompt-security.service.js';
import { AiScheduleHandlersService } from '../ai/ai-schedule-handlers.service.js';
import {
  isIntentAllowed,
  normalizeActorRole,
  type AiActorRole,
} from '../ai/ai-capability.matrix.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { CommandOrchestrationService } from '../ai/command-orchestration.service.js';
import { OperationalPlanBuilderService } from '../ai/operational-plan-builder.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';

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
  "action": "cancel_bookings" | "update_bookings" | "mark_no_shows" | "payment_sweep" | "list_bookings" | "summarize_day" | "reschedule_booking" | "fill_unused_slots" | "unknown",
  "params": {
    "customerName": "string or null — client/customer name mentioned (e.g. John)",
    "serviceName": "string or null — service type filter",
    "date": "DD_MM_YYYY or null — resolve relative dates from today",
    "dateFrom": "DD_MM_YYYY or null",
    "dateTo": "DD_MM_YYYY or null",
    "timeSlot": "HH:MM 24h or null — appointment start time (e.g. 13:00)",
    "timeFrom": "HH:MM or null — gap fill window start",
    "timeTo": "HH:MM or null — gap fill window end",
    "status": "completed | in_progress | no_show | confirmed | pending | null",
    "paymentStatus": "paid | pending | refunded | not_applicable | null",
    "reason": "string or null — cancellation reason or note",
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
- list_bookings / summarize_day: view-only; no mutations.
- reschedule_booking: move an appointment to a new time (own bookings only unless team view).
- fill_unused_slots: fill schedule gaps for own calendar (team view: all providers).
- Combine filters: customerName + timeSlot + date for one appointment (e.g. "John at 13:00").
- Default date to today when the user says "today" or gives no date for today's context.
- If unclear, use action "unknown".`;

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
    private bookingService: BookingService,
    private llm: LlmService,
    private providerMobile: ProviderMobileService,
    private completionPipeline: CommandCompletionPipelineService,
    private aiEvents: AiEventsService,
    private scheduleHandlers: AiScheduleHandlersService,
    private orchestration: CommandOrchestrationService,
    private planBuilder: OperationalPlanBuilderService,
    private promptSecurity: AiPromptSecurityService,
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
        summary: 'AI assistant is not configured. Ask your business owner to add an OpenAI API key in Settings.',
        details: {},
      };
    }

    const access = await this.providerMobile.resolveMobileAccess(businessId, userId);
    const actorRole = this.resolveProviderActorRole(access);

    const blocked = this.promptSecurity.preflightBlock(businessId, prompt, 'provider');
    if (blocked) {
      return {
        success: blocked.success,
        action: blocked.action,
        summary: blocked.summary,
        details: blocked.details as Record<string, unknown>,
      };
    }

    const providerName = access.employee?.name ?? 'Admin';
    const parsed = await this.classifyIntent(
      businessId,
      userId,
      prompt,
      providerName,
      access.viewMode,
      history,
      context,
    );
    if (!parsed) {
      return {
        success: false,
        action: 'error',
        summary: 'Could not understand that command. Try rephrasing.',
        details: {},
      };
    }

    parsed.params = this.completionPipeline.mergeProviderSessionContext(
      parsed.params as Record<string, any>,
      context,
    ) as Record<string, unknown>;
    this.completionPipeline.normalizeDateParams(parsed.params as Record<string, any>);

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
          missing: Array.isArray(clarify.details.missing) ? clarify.details.missing : undefined,
        });
        return clarify;
      }
    }

    this.normalizeParams(parsed.params);
    parsed.action = this.rescueProviderIntent(prompt, parsed.action);

    if (!isIntentAllowed('provider', actorRole, parsed.action)) {
      return {
        success: false,
        action: parsed.action,
        summary: `Action "${parsed.action.replace(/_/g, ' ')}" is not allowed for your role (${actorRole}).`,
        details: { role: actorRole, action: parsed.action },
      };
    }

    parsed.params = this.promptSecurity.stripParams(parsed.params) as Record<string, unknown>;

    const securityDenied = this.promptSecurity.enforceAction(
      businessId,
      'provider',
      actorRole,
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

    this.logger.log(`Provider AI action="${parsed.action}" — ${parsed.reasoning}`);

    let result: ProviderCommandResult;

    switch (parsed.action) {
      case 'cancel_bookings':
        result = await this.handleCancelBookings(businessId, access, parsed.params, userId);
        break;
      case 'update_bookings':
        result = await this.handleUpdateBookings(businessId, access, parsed.params, userId);
        break;
      case 'mark_no_shows':
        result = await this.handleMarkNoShows(businessId, access, parsed.params, userId);
        break;
      case 'payment_sweep':
        result = await this.handlePaymentSweep(businessId, access, parsed.params, userId);
        break;
      case 'list_bookings':
        result = await this.handleListBookings(businessId, access, parsed.params);
        break;
      case 'summarize_day':
        result = await this.handleSummarizeDay(businessId, access, parsed.params);
        break;
      case 'reschedule_booking':
        result = await this.handleRescheduleBooking(businessId, access, parsed.params, userId);
        break;
      case 'fill_unused_slots':
        result = await this.handleFillUnusedSlots(businessId, access, prompt, parsed.params, userId);
        break;
      default:
        result = {
          success: false,
          action: 'unknown',
          summary:
            'I can cancel appointments, reschedule, fill schedule gaps, mark no-shows, run payment sweeps, mark them done, update payment status, or show your schedule. Try: "Mark no-shows for today" or "Payment sweep for today".',
          details: {},
        };
    }

    return this.attachProviderSession(result, parsed.params);
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
      initials: customerName
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
        sessionContext: this.completionPipeline.buildProviderSessionContext(params as Record<string, any>),
      },
    };
  }

  async confirmAction(
    businessId: string,
    userId: string,
    dto: ProviderAiConfirmDto,
  ): Promise<ProviderCommandResult> {
    const access = await this.providerMobile.resolveMobileAccess(businessId, userId);
    const bookings = await this.loadOwnedBookings(
      businessId,
      this.providerMobile.getScopedEmployeeId(access),
      dto.bookingIds,
    );
    if (bookings.length !== dto.bookingIds.length) {
      throw new BadRequestException('Some appointments were not found or are not yours');
    }

    if (dto.action === 'cancel_bookings') {
      const result = await this.executeCancel(bookings, String(dto.params?.reason ?? 'Cancelled by provider'), userId);
      this.aiEvents.emitTaskCompleted(businessId, {
        action: 'cancel_bookings',
        success: result.success,
        summary: result.summary,
      });
      return result;
    }
    if (dto.action === 'update_bookings' || dto.action === 'mark_no_shows' || dto.action === 'payment_sweep') {
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
    providerName: string,
    viewMode: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, unknown>,
  ): Promise<ParsedIntent | null> {
    const contextBlock = `Current date: ${todayDisplay()} (DD_MM_YYYY, times 24h HH:mm)
Logged-in user: ${providerName}
View mode: ${viewMode}${viewMode === 'team' ? ' — manager/owner, all team appointments' : ' — own appointments only'}`;

    const sessionBlock =
      sessionContext && Object.values(sessionContext).some((v) => v != null && v !== '')
        ? `\nActive session context:\n${JSON.stringify(sessionContext, null, 2)}`
        : '';

    const historyText = (history ?? [])
      .slice(-8)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const result = await this.llm.completeJson<ParsedIntent>(
      businessId,
      `${PROVIDER_INTENT_SCHEMA}\n\n${contextBlock}${sessionBlock}${historyText ? `\nRecent conversation:\n${historyText}` : ''}`,
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
    const bookings = await this.findMatchingBookings(businessId, employeeId, params, {
      excludeTerminal: true,
    });

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
        summary: 'Tell me what to change — e.g. mark as done, set payment to paid.',
        details: {},
      };
    }

    const bookings = await this.findMatchingBookings(businessId, employeeId, params, {
      excludeCancelled: true,
    });

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

  private resolveProviderActorRole(access: MobileAccess): AiActorRole {
    if (access.viewMode === 'team') {
      if (access.membershipRole === MemberRole.OWNER) return 'owner';
      if (access.membershipRole === MemberRole.MANAGER) return 'manager';
      return 'manager';
    }
    return normalizeActorRole('provider');
  }

  private rescueProviderIntent(prompt: string, action: string): string {
    const lower = prompt.toLowerCase();
    if (/payment\s+sweep|mark\s+unpaid|collect\s+outstanding|outstanding\s+payments?/.test(lower)) {
      return 'payment_sweep';
    }
    if (/mark\s+no[\s-]?shows?|no[\s-]?shows?\s+for/.test(lower) && !/cancel/.test(lower)) {
      return 'mark_no_shows';
    }
    return action;
  }

  private async handleMarkNoShows(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    if (!params.date && !params.dateFrom) params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findNoShowCandidates(businessId, employeeId, params);

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

    const result = await this.executeUpdate(bookings, { status: BookingStatus.NO_SHOW }, userId);
    return { ...result, action: 'mark_no_shows' };
  }

  private async handlePaymentSweep(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ProviderCommandResult> {
    if (!params.date && !params.dateFrom) params.date = toIsoDay(todayDisplay());
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findUnpaidBookings(businessId, employeeId, params);

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

    const result = await this.executeUpdate(bookings, { paymentStatus: PaymentStatus.PAID }, userId);
    return { ...result, action: 'payment_sweep' };
  }

  private async findNoShowCandidates(
    businessId: string,
    employeeId: string | undefined,
    params: Record<string, unknown>,
  ): Promise<Booking[]> {
    const bookings = await this.findMatchingBookings(businessId, employeeId, params, {
      excludeCancelled: true,
    });
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
    const bookings = await this.findMatchingBookings(businessId, employeeId, params, {
      excludeCancelled: true,
    });
    return bookings.filter(
      (b) =>
        b.paymentStatus === PaymentStatus.PENDING &&
        [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED].includes(
          b.status,
        ),
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
      details: { cancelledCount: cancelled, bookingIds: bookings.map((b) => b.id) },
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
      const payload: { status?: BookingStatus; paymentStatus?: PaymentStatus } = {};
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
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(businessId, employeeId, params, {});
    if (bookings.length === 0) {
      return {
        success: true,
        action: 'list_bookings',
        summary: this.noMatchMessage('list', params),
        details: { matchedCount: 0 },
      };
    }

    const lines = bookings.map((b) => `• ${this.bookingLabel(b)} — ${b.status}`);
    const dateLabel = params.date ? formatDateDisplay(String(params.date)) : 'the selected day';
    return {
      success: true,
      action: 'list_bookings',
      summary: `${bookings.length} appointment${bookings.length === 1 ? '' : 's'} on ${dateLabel}:\n${lines.join('\n')}`,
      details: { matchedCount: bookings.length, bookings: bookings.map((b) => this.bookingLabel(b)) },
    };
  }

  private async handleSummarizeDay(
    businessId: string,
    access: MobileAccess,
    params: Record<string, unknown>,
  ): Promise<ProviderCommandResult> {
    const merged = { ...params, allAppointments: true };
    const employeeId = this.providerMobile.getScopedEmployeeId(access);
    const bookings = await this.findMatchingBookings(businessId, employeeId, merged, {});
    const dateLabel = params.date ? formatDateDisplay(String(params.date)) : todayDisplay();

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
    const statusSummary = [...byStatus.entries()].map(([s, n]) => `${n} ${s}`).join(', ');
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
        In([BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW]),
      );
    } else if (options.excludeCancelled) {
      where.status = Not(In([BookingStatus.CANCELLED]));
    }

    const dateRange = this.resolveDateRange(params);
    if (dateRange) {
      where.startTime = Between(dateRange.start, dateRange.end);
    }

    let bookings = await this.bookingRepo.find({
      where: where as any,
      relations: { customer: true, service: true },
      order: { startTime: 'ASC' },
    });

    if (params.customerName) {
      const name = String(params.customerName).toLowerCase();
      bookings = bookings.filter((b) => b.customer?.name.toLowerCase().includes(name));
    }

    if (params.serviceName) {
      const svc = String(params.serviceName).toLowerCase();
      bookings = bookings.filter((b) => b.service?.name.toLowerCase().includes(svc));
    }

    if (params.timeSlot) {
      const slot = this.normalizeTime(String(params.timeSlot));
      bookings = bookings.filter((b) => formatTimeDisplay(b.startTime) === slot);
    }

    if (params.allAppointments !== true && !params.customerName && !params.timeSlot && !params.serviceName) {
      // Single ambiguous match without "all" — if multiple on day, prefer requiring explicit all
      if (bookings.length > 1 && (params.status || params.paymentStatus || params.reason)) {
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
    const bookings = await this.findMatchingBookings(businessId, scopedEmployeeId, params, {
      excludeTerminal: true,
    });

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
        summary: 'Specify the new date and/or time (e.g. "Reschedule to 16:00").',
        details: { bookingId: booking.id },
      };
    }

    const isoDay = toIsoDay(String(params.date ?? booking.startTime.toISOString().split('T')[0]));
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
      where: where as any,
      relations: { customer: true, service: true },
    });
  }

  private bookingLabel(booking: Booking): string {
    const customer = booking.customer?.name ?? 'Walk-in';
    const service = booking.service?.name ?? 'Appointment';
    return `${formatTimeRangeDisplay(booking.startTime, booking.endTime)} ${customer} (${service})`;
  }

  private noMatchMessage(_verb: string, params: Record<string, unknown>): string {
    const parts = [
      params.date ? `on ${formatDateDisplay(String(params.date))}` : null,
      params.customerName ? `for ${params.customerName}` : null,
      params.timeSlot ? `at ${params.timeSlot}` : null,
    ].filter(Boolean);
    return `No matching appointments found${parts.length ? ` ${parts.join(' ')}` : ''}.`;
  }

  private normalizeParams(params: Record<string, unknown>) {
    if (params.date) params.date = toIsoDay(String(params.date));
    if (params.timeSlot) params.timeSlot = this.normalizeTime(String(params.timeSlot));
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
    return map[String(value).toLowerCase()] ?? (Object.values(BookingStatus).includes(value as BookingStatus) ? (value as BookingStatus) : undefined);
  }

  private normalizePaymentStatus(value: unknown): PaymentStatus | undefined {
    if (!value) return undefined;
    const map: Record<string, PaymentStatus> = {
      done: PaymentStatus.PAID,
      paid: PaymentStatus.PAID,
      pending: PaymentStatus.PENDING,
      refunded: PaymentStatus.REFUNDED,
      not_applicable: PaymentStatus.NOT_APPLICABLE,
      na: PaymentStatus.NOT_APPLICABLE,
      n_a: PaymentStatus.NOT_APPLICABLE,
    };
    return map[String(value).toLowerCase()] ?? (Object.values(PaymentStatus).includes(value as PaymentStatus) ? (value as PaymentStatus) : undefined);
  }

  private resolveDateRange(params: Record<string, unknown>): { start: Date; end: Date } | null {
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
