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

export interface ProviderCommandResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, unknown>;
}

const AUTO_EXECUTE_LIMIT = 5;

const PROVIDER_INTENT_SCHEMA = `You are an AI assistant for a service provider mobile app.
Classify the user's command and extract parameters. Return JSON:

{
  "action": "cancel_bookings" | "update_bookings" | "list_bookings" | "summarize_day" | "unknown",
  "params": {
    "customerName": "string or null — client/customer name mentioned (e.g. John)",
    "serviceName": "string or null — service type filter",
    "date": "DD_MM_YYYY or null — resolve relative dates from today",
    "timeSlot": "HH:MM 24h or null — appointment start time (e.g. 13:00)",
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
- update_bookings: change status and/or payment status without cancelling.
- list_bookings / summarize_day: view-only; no mutations.
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
    private bookingService: BookingService,
    private llm: LlmService,
    private providerMobile: ProviderMobileService,
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

    this.normalizeParams(parsed.params);
    this.logger.log(`Provider AI action="${parsed.action}" — ${parsed.reasoning}`);

    switch (parsed.action) {
      case 'cancel_bookings':
        return this.handleCancelBookings(businessId, access, parsed.params, userId);
      case 'update_bookings':
        return this.handleUpdateBookings(businessId, access, parsed.params, userId);
      case 'list_bookings':
        return this.handleListBookings(businessId, access, parsed.params);
      case 'summarize_day':
        return this.handleSummarizeDay(businessId, access, parsed.params);
      default:
        return {
          success: false,
          action: 'unknown',
          summary:
            'I can cancel appointments, mark them done, update payment status, or show your schedule. Try: "Cancel all my appointments today — I\'m sick" or "Mark John\'s 13:00 as done and paid".',
          details: {},
        };
    }
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
      return this.executeCancel(bookings, String(dto.params?.reason ?? 'Cancelled by provider'), userId);
    }
    if (dto.action === 'update_bookings') {
      return this.executeUpdate(bookings, dto.params ?? {}, userId);
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
    const preview = bookings.map((b) => this.bookingLabel(b));

    if (bookings.length > AUTO_EXECUTE_LIMIT) {
      return {
        success: true,
        action: 'cancel_bookings',
        summary: `Cancel ${bookings.length} appointments${reason ? ` with note: "${reason}"` : ''}?`,
        details: {
          requiresConfirmation: true,
          bookingIds: bookings.map((b) => b.id),
          preview,
          pendingAction: { action: 'cancel_bookings', params: { reason } },
        },
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

    const preview = bookings.map((b) => this.bookingLabel(b));
    const changeParts = [
      status ? `status → ${status}` : null,
      paymentStatus ? `payment → ${paymentStatus}` : null,
    ].filter(Boolean);

    if (bookings.length > AUTO_EXECUTE_LIMIT) {
      return {
        success: true,
        action: 'update_bookings',
        summary: `Update ${bookings.length} appointments (${changeParts.join(', ')})?`,
        details: {
          requiresConfirmation: true,
          bookingIds: bookings.map((b) => b.id),
          preview,
          pendingAction: { action: 'update_bookings', params: { status, paymentStatus } },
        },
      };
    }

    return this.executeUpdate(bookings, { status, paymentStatus }, userId);
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
