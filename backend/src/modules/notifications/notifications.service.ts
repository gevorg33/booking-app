import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { NotificationLog } from './entities/notification-log.entity.js';
import { EmailService } from './email.service.js';
import { SmsService } from './sms.service.js';
import { WhatsAppService } from './whatsapp.service.js';
import { WhatsAppIntegrationService } from './whatsapp-integration.service.js';
import {
  mergeBusinessNotificationSettings,
  getCustomerNotificationPreferences,
  type BusinessNotificationSettings,
  type NotificationChannel,
  type NotificationKind,
} from './notification.types.js';
import { mergeMarketingAutomationSettings } from '../marketing-automation/marketing-automation.types.js';
import { formatDateDisplay, formatTimeRangeDisplay } from '../../common/utils/date-format.util.js';
import {
  buildBookingManageUrl,
  ensureBookingManageToken,
  formatBookingManageLinkHtml,
  formatBookingManageLinkText,
} from '../../common/utils/booking-manage-token.util.js';
import {
  canCustomerManageBookingOnline,
  resolveBookingManageLinkLabel,
  resolveCustomerSelfServiceSettings,
} from '../../common/utils/customer-self-service.util.js';

interface BookingNotificationContext {
  booking: Booking;
  business: Business;
  businessSettings: BusinessNotificationSettings;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(NotificationLog) private logRepo: Repository<NotificationLog>,
    private emailService: EmailService,
    private smsService: SmsService,
    private whatsappService: WhatsAppService,
    private whatsappIntegrationService: WhatsAppIntegrationService,
    private configService: ConfigService,
  ) {}

  async getBusinessSettings(businessId: string): Promise<BusinessNotificationSettings> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return mergeBusinessNotificationSettings(business.settings?.notifications);
  }

  async updateBusinessSettings(
    businessId: string,
    patch: Partial<BusinessNotificationSettings>,
  ): Promise<BusinessNotificationSettings> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    business.settings = {
      ...business.settings,
      notifications: {
        ...mergeBusinessNotificationSettings(business.settings?.notifications),
        ...patch,
      },
    };
    await this.businessRepo.save(business);
    return mergeBusinessNotificationSettings(business.settings.notifications);
  }

  getProviderStatus(settings?: Record<string, unknown>) {
    const whatsappConfig = this.whatsappIntegrationService.resolveRuntimeConfig(settings);
    return {
      emailConfigured: this.emailService.isConfigured,
      smsConfigured: this.smsService.isConfigured,
      whatsappConfigured: Boolean(whatsappConfig),
      whatsappSource: whatsappConfig?.source ?? null,
      whatsappUsingPlatformDefault: whatsappConfig?.source === 'platform',
    };
  }

  /** One confirmation for package or multi-service orders (all appointments in one email/SMS). */
  async sendMultiAppointmentConfirmation(bookingIds: string[]): Promise<void> {
    const ids = [...new Set(bookingIds.filter(Boolean))];
    if (!ids.length) return;

    const ctx = await this.loadContext(ids[0]);
    if (!ctx) return;

    const { booking, businessSettings } = ctx;
    if (booking.status === BookingStatus.CANCELLED) return;

    const customer = booking.customer;
    if (!customer) return;

    const groupBookings = await this.loadGroupedBookings(booking);
    if (!groupBookings.length) return;

    const lines = await this.buildGroupedAppointmentLines(groupBookings);
    const prefs = getCustomerNotificationPreferences(customer.metadata);
    const groupLabel = this.resolveGroupedConfirmationLabel(groupBookings);

    if (
      businessSettings.sendConfirmationEmail &&
      businessSettings.emailEnabled &&
      prefs.emailReminders &&
      customer.email
    ) {
      await this.dispatch(ctx, 'confirmation', 'email', customer.email, () =>
        this.buildGroupedConfirmationEmail(ctx, lines, groupLabel),
      );
    }

    if (businessSettings.smsEnabled && prefs.smsReminders && customer.phone) {
      await this.dispatch(ctx, 'confirmation', 'sms', customer.phone, () =>
        this.buildGroupedConfirmationSms(ctx, lines, groupLabel),
      );
    }

    if (
      businessSettings.whatsappEnabled &&
      businessSettings.sendConfirmationWhatsapp &&
      prefs.whatsappReminders &&
      customer.phone
    ) {
      await this.dispatchGroupedWhatsApp(ctx, groupBookings, lines, groupLabel);
    }

    if (
      businessSettings.whatsappEnabled &&
      businessSettings.reminderImmediateWhatsapp &&
      prefs.whatsappReminders &&
      customer.phone &&
      !(await this.shouldSkipImmediateWhatsApp(ctx))
    ) {
      const first = groupBookings[0];
      const immediateCtx: BookingNotificationContext = {
        booking: first,
        business: ctx.business,
        businessSettings: ctx.businessSettings,
      };
      await this.dispatchWhatsApp(immediateCtx, 'reminder_immediate', customer.phone, 0);
    }
  }

  async sendBookingConfirmation(bookingId: string): Promise<void> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return;

    const { booking, businessSettings } = ctx;
    if (booking.status === BookingStatus.CANCELLED) return;

    const customer = booking.customer;
    if (!customer) return;

    const prefs = getCustomerNotificationPreferences(customer.metadata);

    const manageLink = await this.resolveManageLinkForBooking(ctx);

    if (businessSettings.sendConfirmationEmail && businessSettings.emailEnabled && prefs.emailReminders && customer.email) {
      await this.dispatch(ctx, 'confirmation', 'email', customer.email, () =>
        this.buildConfirmationEmail(ctx, manageLink),
      );
    }

    if (businessSettings.smsEnabled && prefs.smsReminders && customer.phone) {
      await this.dispatch(ctx, 'confirmation', 'sms', customer.phone, () =>
        this.buildConfirmationSms(ctx),
      );
    }

    if (
      businessSettings.whatsappEnabled &&
      businessSettings.sendConfirmationWhatsapp &&
      prefs.whatsappReminders &&
      customer.phone
    ) {
      await this.dispatchWhatsApp(ctx, 'confirmation', customer.phone);
    }

    if (
      businessSettings.whatsappEnabled &&
      businessSettings.reminderImmediateWhatsapp &&
      prefs.whatsappReminders &&
      customer.phone &&
      !(await this.shouldSkipImmediateWhatsApp(ctx))
    ) {
      await this.dispatchWhatsApp(ctx, 'reminder_immediate', customer.phone);
    }
  }

  async sendBookingCancellation(bookingId: string, reason?: string): Promise<void> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return;

    const { booking, businessSettings } = ctx;
    if (booking.status !== BookingStatus.CANCELLED) return;

    const customer = booking.customer;
    if (!customer) return;

    const prefs = getCustomerNotificationPreferences(customer.metadata);
    const cancelReason = reason || 'Your appointment was cancelled';

    if (businessSettings.emailEnabled && prefs.emailReminders && customer.email) {
      await this.dispatch(ctx, 'cancellation', 'email', customer.email, () =>
        this.buildCancellationEmail(ctx, cancelReason),
      );
    }

    if (businessSettings.smsEnabled && prefs.smsReminders && customer.phone) {
      await this.dispatch(ctx, 'cancellation', 'sms', customer.phone, () =>
        this.buildCancellationSms(ctx, cancelReason),
      );
    }

    if (businessSettings.whatsappEnabled && prefs.whatsappReminders && customer.phone) {
      await this.dispatchWhatsApp(ctx, 'cancellation', customer.phone, undefined, cancelReason);
    }
  }

  async sendBusinessCustomerBookingChange(
    bookingId: string,
    change: 'cancelled' | 'rescheduled',
    details?: { previousStartTime?: string; newStartTime?: string },
  ): Promise<void> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return;

    const { booking, business, businessSettings } = ctx;
    if (!businessSettings.notifyBusinessOnCustomerBookingChange) return;
    if (!businessSettings.emailEnabled) return;

    const recipient = business.email?.trim();
    if (!recipient) return;

    const customerName = booking.customer?.name ?? 'A customer';
    const serviceName = booking.service?.name ?? 'Appointment';
    const when = formatDateDisplay(booking.startTime);
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);

    let summary: string;
    if (change === 'cancelled') {
      summary = `${customerName} cancelled ${serviceName} scheduled for ${when} at ${time}.`;
    } else {
      const fromWhen = details?.previousStartTime
        ? `${formatDateDisplay(new Date(details.previousStartTime))} ${formatTimeRangeDisplay(new Date(details.previousStartTime), booking.endTime)}`
        : when;
      const toWhen = details?.newStartTime
        ? `${formatDateDisplay(new Date(details.newStartTime))} ${formatTimeRangeDisplay(new Date(details.newStartTime), booking.endTime)}`
        : when;
      summary = `${customerName} rescheduled ${serviceName} from ${fromWhen} to ${toWhen}.`;
    }

    await this.dispatch(
      ctx,
      change === 'cancelled' ? 'business_booking_cancelled' : 'business_booking_rescheduled',
      'email',
      recipient,
      () => ({
        subject: `Customer ${change === 'cancelled' ? 'cancellation' : 'reschedule'} — ${serviceName}`,
        text: `${business.name} booking update\n\n${summary}`,
        html: `<p>${summary.replace(/\n/g, '<br/>')}</p>`,
      }),
    );
  }

  async sendReviewRequest(bookingId: string): Promise<void> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return;

    const marketingSettings = mergeMarketingAutomationSettings(
      ctx.business.settings?.marketingAutomation,
    );
    if (!marketingSettings.postVisitReviewEnabled) return;

    const { booking, businessSettings } = ctx;
    if (booking.status !== BookingStatus.COMPLETED) return;

    const customer = booking.customer;
    if (!customer) return;

    const token = booking.metadata?.reviewToken;
    if (!token || typeof token !== 'string') return;

    const reviewUrl = this.buildReviewUrl(ctx.business.slug, booking.id, token);
    const emailRecipient = this.resolveReviewEmailRecipient(customer.email);
    const prefs = getCustomerNotificationPreferences(customer.metadata);

    if (businessSettings.emailEnabled && emailRecipient) {
      await this.dispatch(ctx, 'review_request', 'email', emailRecipient, () =>
        this.buildReviewRequestEmail(ctx, reviewUrl),
      );
    }

    if (businessSettings.smsEnabled && prefs.smsReminders && customer.phone) {
      await this.dispatch(ctx, 'review_request', 'sms', customer.phone, () =>
        this.buildReviewRequestSms(ctx, reviewUrl),
      );
    }
  }

  async processDueReminders(): Promise<number> {
    const now = new Date();
    let sent = 0;

    sent += await this.processReminderWindow('reminder_24h', 24 * 60, now);
    sent += await this.processReminderWindow('reminder_1h', 60, now);

    return sent;
  }

  private async processReminderWindow(
    kind: 'reminder_24h' | 'reminder_1h',
    minutesBefore: number,
    now: Date,
  ): Promise<number> {
    const windowMs = 5 * 60 * 1000;
    const target = now.getTime() + minutesBefore * 60 * 1000;
    const from = new Date(target - windowMs);
    const to = new Date(target + windowMs);

    const bookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.employee', 'employee')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.business', 'business')
      .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('booking.startTime >= :from', { from })
      .andWhere('booking.startTime <= :to', { to })
      .getMany();

    let sent = 0;
    for (const booking of bookings) {
      const ctx: BookingNotificationContext = {
        booking,
        business: booking.business,
        businessSettings: mergeBusinessNotificationSettings(booking.business?.settings?.notifications),
      };
      const customer = booking.customer;
      if (!customer || !booking.business) continue;

      const { businessSettings } = ctx;
      const prefs = getCustomerNotificationPreferences(customer.metadata);
      const emailEnabled =
        kind === 'reminder_24h'
          ? businessSettings.reminder24hEmail
          : businessSettings.reminder1hEmail;
      const smsEnabled =
        kind === 'reminder_24h'
          ? businessSettings.reminder24hSms
          : businessSettings.reminder1hSms;
      const whatsappEnabled =
        kind === 'reminder_24h'
          ? businessSettings.reminder24hWhatsapp
          : businessSettings.reminder1hWhatsapp;

      if (businessSettings.emailEnabled && emailEnabled && prefs.emailReminders && customer.email) {
        const ok = await this.dispatch(ctx, kind, 'email', customer.email, () =>
          this.buildReminderEmail(ctx, minutesBefore),
        );
        if (ok) sent++;
      }

      if (businessSettings.smsEnabled && smsEnabled && prefs.smsReminders && customer.phone) {
        const ok = await this.dispatch(ctx, kind, 'sms', customer.phone, () =>
          this.buildReminderSms(ctx, minutesBefore),
        );
        if (ok) sent++;
      }

      if (businessSettings.whatsappEnabled && whatsappEnabled && prefs.whatsappReminders && customer.phone) {
        const ok = await this.dispatchWhatsApp(ctx, kind, customer.phone, minutesBefore);
        if (ok) sent++;
      }
    }

    return sent;
  }

  private async loadContext(bookingId: string): Promise<BookingNotificationContext | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { customer: true, employee: true, service: true, business: true },
    });
    if (!booking?.business) return null;

    return {
      booking,
      business: booking.business,
      businessSettings: mergeBusinessNotificationSettings(booking.business.settings?.notifications),
    };
  }

  private async dispatch(
    ctx: BookingNotificationContext,
    kind: NotificationKind,
    channel: NotificationChannel,
    recipient: string,
    build: () => { subject?: string; html?: string; text: string },
  ): Promise<boolean> {
    const existing = await this.logRepo.findOne({
      where: {
        bookingId: ctx.booking.id,
        kind,
        channel,
      },
    });
    if (existing) return false;

    const content = build();
    let ok = false;
    let error: string | undefined;

    if (channel === 'email') {
      const result = await this.emailService.send({
        to: recipient,
        subject: content.subject || 'Appointment reminder',
        html: content.html || `<p>${content.text}</p>`,
        text: content.text,
      });
      ok = result.ok;
      error = result.error;
    } else {
      const result = await this.smsService.send(recipient, content.text);
      ok = result.ok;
      error = result.error;
    }

    await this.logRepo.save(
      this.logRepo.create({
        businessId: ctx.booking.businessId,
        bookingId: ctx.booking.id,
        channel,
        kind,
        recipient,
        status: ok ? 'sent' : 'failed',
        error: error ?? null,
      }),
    );

    if (!ok) {
      this.logger.warn(`Failed ${kind} ${channel} for booking ${ctx.booking.id}: ${error}`);
    }

    return ok;
  }

  private async shouldSkipImmediateWhatsApp(ctx: BookingNotificationContext): Promise<boolean> {
    const config = this.whatsappIntegrationService.resolveRuntimeConfig(ctx.business.settings);
    if (!config) return true;
    return this.whatsappService.shouldSkipImmediateAfterConfirmation(config);
  }

  private async dispatchWhatsApp(
    ctx: BookingNotificationContext,
    kind: NotificationKind,
    phone: string,
    minutesBefore?: number,
    cancelReason?: string,
  ): Promise<boolean> {
    const existing = await this.logRepo.findOne({
      where: {
        bookingId: ctx.booking.id,
        kind,
        channel: 'whatsapp',
      },
    });
    if (existing) return false;

    const config = this.whatsappIntegrationService.resolveRuntimeConfig(ctx.business.settings);
    if (!config) {
      this.logger.warn(`WhatsApp not configured for business ${ctx.business.id}`);
      return false;
    }

    const { booking, business } = ctx;
    const dateLabel = formatDateDisplay(booking.startTime);
    const timeLabel = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    const reminderLabel =
      kind === 'reminder_immediate'
        ? 'now'
        : minutesBefore !== undefined
          ? minutesBefore >= 60
            ? `${Math.round(minutesBefore / 60)} hours`
            : `${minutesBefore} minutes`
          : undefined;

    const result = await this.whatsappService.sendBookingMessage(
      {
        toPhone: phone,
        kind,
        customerName: booking.customer?.name ?? 'there',
        businessName: business.name,
        serviceName: booking.service?.name ?? 'Appointment',
        providerName: booking.employee?.name ?? 'your provider',
        dateLabel,
        timeLabel,
        reminderLabel,
        cancelReason,
      },
      config,
    );

    await this.logRepo.save(
      this.logRepo.create({
        businessId: ctx.booking.businessId,
        bookingId: ctx.booking.id,
        channel: 'whatsapp',
        kind,
        recipient: phone,
        status: result.ok ? 'sent' : 'failed',
        error: result.error ?? null,
      }),
    );

    if (!result.ok) {
      this.logger.warn(`Failed ${kind} whatsapp for booking ${ctx.booking.id}: ${result.error}`);
    }

    return result.ok;
  }

  private buildCancellationEmail(ctx: BookingNotificationContext, reason: string) {
    const { booking, business } = ctx;
    const when = formatDateDisplay(booking.startTime);
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    const serviceName = booking.service?.name ?? 'Appointment';
    const text = `Hi ${booking.customer?.name ?? 'there'},\n\nYour appointment at ${business.name} has been cancelled.\n\n${serviceName} on ${when} · ${time}\nReason: ${reason}\n\nContact us to rebook.`;

    return {
      subject: `Cancelled: ${serviceName} at ${business.name}`,
      html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
      text,
    };
  }

  private buildCancellationSms(ctx: BookingNotificationContext, reason: string) {
    const { booking, business } = ctx;
    const when = formatDateDisplay(booking.startTime);
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    return {
      text: `${business.name}: Your ${booking.service?.name ?? 'appointment'} on ${when} at ${time} was cancelled. ${reason}`,
    };
  }

  private async loadGroupedBookings(anchor: Booking): Promise<Booking[]> {
    const groupFilter = anchor.packagePurchaseId
      ? { packagePurchaseId: anchor.packagePurchaseId }
      : anchor.multiServiceGroupId
        ? { multiServiceGroupId: anchor.multiServiceGroupId }
        : null;
    if (!groupFilter) return [anchor];

    return this.bookingRepo.find({
      where: { businessId: anchor.businessId, ...groupFilter },
      relations: { customer: true, employee: true, service: true, business: true },
      order: { startTime: 'ASC' },
    });
  }

  private resolveGroupedConfirmationLabel(bookings: Booking[]): string {
    const meta = bookings[0]?.metadata ?? {};
    const packageName =
      typeof meta.packageName === 'string' ? meta.packageName.trim() : '';
    if (packageName) return packageName;

    const groupLabel = typeof meta.groupLabel === 'string' ? meta.groupLabel.trim() : '';
    if (groupLabel) return groupLabel;

    const names = bookings
      .map((b) => b.service?.name)
      .filter((name): name is string => Boolean(name));
    return names.length ? names.join(' + ') : `${bookings.length} appointments`;
  }

  private async buildGroupedAppointmentLines(
    bookings: Booking[],
  ): Promise<
    Array<{
      serviceName: string;
      providerName: string;
      when: string;
      time: string;
      manageUrl: string | null;
      manageLabel: string | null;
    }>
  > {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const slug = bookings[0]?.business?.slug ?? '';
    const selfService = resolveCustomerSelfServiceSettings(bookings[0]?.business?.settings);

    return Promise.all(
      bookings.map(async (b) => {
        const line = {
          serviceName: b.service?.name ?? 'Appointment',
          providerName: b.employee?.name ?? 'your provider',
          when: formatDateDisplay(b.startTime),
          time: formatTimeRangeDisplay(b.startTime, b.endTime),
          manageUrl: null as string | null,
          manageLabel: null as string | null,
        };
        if (!canCustomerManageBookingOnline(b, selfService)) {
          return line;
        }
        const manageLabel = resolveBookingManageLinkLabel(b, selfService);
        if (!manageLabel) {
          return line;
        }
        const token = await ensureBookingManageToken(this.bookingRepo, b.id);
        line.manageUrl = buildBookingManageUrl(frontendUrl, slug, b.id, token);
        line.manageLabel = manageLabel;
        return line;
      }),
    );
  }

  private buildGroupedConfirmationEmail(
    ctx: BookingNotificationContext,
    lines: Array<{
      serviceName: string;
      providerName: string;
      when: string;
      time: string;
      manageUrl: string | null;
      manageLabel: string | null;
    }>,
    groupLabel: string,
  ) {
    const { booking, business } = ctx;
    const count = lines.length;
    const appointmentWord = count === 1 ? 'appointment' : 'appointments';
    const intro = `Hi ${booking.customer?.name ?? 'there'},\n\nYour ${appointmentWord} at ${business.name} are confirmed${groupLabel ? ` (${groupLabel})` : ''}.`;
    const detailLines = lines.map((line) => {
      const base = `• ${line.serviceName} with ${line.providerName}\n  ${line.when} · ${line.time}`;
      return line.manageUrl && line.manageLabel
        ? `${base}\n  ${formatBookingManageLinkText(line.manageLabel, line.manageUrl)}`
        : base;
    });
    const text = `${intro}\n\n${detailLines.join('\n\n')}\n\nSee you soon!`;
    const htmlLines = lines
      .map((line) => {
        const base = `<strong>${line.serviceName}</strong> with ${line.providerName}<br/>${line.when} · ${line.time}`;
        const manage =
          line.manageUrl && line.manageLabel
            ? `<br/>${formatBookingManageLinkHtml(line.manageLabel, line.manageUrl)}`
            : '';
        return `<li>${base}${manage}</li>`;
      })
      .join('');

    return {
      subject: `Confirmed: ${count} ${appointmentWord} at ${business.name}`,
      html: `<p>${intro.replace(/\n/g, '<br/>')}</p><ul>${htmlLines}</ul><p>See you soon!</p>`,
      text,
    };
  }

  private buildGroupedConfirmationSms(
    ctx: BookingNotificationContext,
    lines: Array<{ serviceName: string; when: string; time: string }>,
    groupLabel: string,
  ) {
    const { business } = ctx;
    const summary = lines
      .map((line) => `${line.serviceName} ${line.when} ${line.time}`)
      .join('; ');
    const label = groupLabel ? ` (${groupLabel})` : '';
    return {
      text: `${business.name}: Confirmed ${lines.length} appointment${lines.length === 1 ? '' : 's'}${label}: ${summary}.`,
    };
  }

  private async dispatchGroupedWhatsApp(
    ctx: BookingNotificationContext,
    bookings: Booking[],
    lines: Array<{ serviceName: string; when: string; time: string }>,
    groupLabel: string,
  ): Promise<void> {
    const first = bookings[0];
    if (!first) return;

    const dateLabel =
      lines.length === 1
        ? lines[0].when
        : `${lines[0].when} (${lines.length} visits)`;
    const timeLabel =
      lines.length === 1 ? lines[0].time : lines.map((l) => `${l.serviceName}: ${l.time}`).join('; ');

    const existing = await this.logRepo.findOne({
      where: {
        bookingId: ctx.booking.id,
        kind: 'confirmation',
        channel: 'whatsapp',
      },
    });
    if (existing) return;

    const config = this.whatsappIntegrationService.resolveRuntimeConfig(ctx.business.settings);
    if (!config) return;

    const customer = ctx.booking.customer;
    if (!customer?.phone) return;

    const result = await this.whatsappService.sendBookingMessage(
      {
        toPhone: customer.phone,
        kind: 'confirmation',
        customerName: customer.name ?? 'there',
        businessName: ctx.business.name,
        serviceName: groupLabel || lines.map((l) => l.serviceName).join(', '),
        providerName: first.employee?.name ?? 'your provider',
        dateLabel,
        timeLabel,
      },
      config,
    );

    await this.logRepo.save(
      this.logRepo.create({
        businessId: ctx.booking.businessId,
        bookingId: ctx.booking.id,
        channel: 'whatsapp',
        kind: 'confirmation',
        recipient: customer.phone,
        status: result.ok ? 'sent' : 'failed',
        error: result.error ?? null,
      }),
    );
  }

  private buildConfirmationEmail(
    ctx: BookingNotificationContext,
    manageLink: { label: string; url: string } | null,
  ) {
    const { booking, business } = ctx;
    const when = formatDateDisplay(booking.startTime);
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    const serviceName = booking.service?.name ?? 'Appointment';
    const providerName = booking.employee?.name ?? 'your provider';
    const manageSection = manageLink
      ? `\n\n${formatBookingManageLinkText(manageLink.label, manageLink.url)}`
      : '';
    const text = `Hi ${booking.customer?.name ?? 'there'},\n\nYour appointment at ${business.name} is confirmed.\n\n${serviceName} with ${providerName}\n${when} · ${time}${manageSection}\n\nSee you soon!`;

    const manageHtml = manageLink
      ? `<br/><br/>${formatBookingManageLinkHtml(manageLink.label, manageLink.url)}`
      : '';
    const html = `<p>Hi ${booking.customer?.name ?? 'there'},<br/><br/>Your appointment at ${business.name} is confirmed.<br/><br/>${serviceName} with ${providerName}<br/>${when} · ${time}${manageHtml}<br/><br/>See you soon!</p>`;

    return {
      subject: `Confirmed: ${serviceName} at ${business.name}`,
      html,
      text,
    };
  }

  private async resolveManageLinkForBooking(
    ctx: BookingNotificationContext,
  ): Promise<{ label: string; url: string } | null> {
    const { booking, business } = ctx;
    const selfService = resolveCustomerSelfServiceSettings(business.settings);
    const label = resolveBookingManageLinkLabel(booking, selfService);
    if (!label || !canCustomerManageBookingOnline(booking, selfService)) {
      return null;
    }
    const token = await ensureBookingManageToken(this.bookingRepo, booking.id);
    const url = buildBookingManageUrl(
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
      business.slug,
      booking.id,
      token,
    );
    return { label, url };
  }

  private buildConfirmationSms(ctx: BookingNotificationContext) {
    const { booking, business } = ctx;
    const when = formatDateDisplay(booking.startTime);
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    return {
      text: `${business.name}: Confirmed ${booking.service?.name ?? 'appointment'} on ${when} at ${time}.`,
    };
  }

  private buildReminderEmail(ctx: BookingNotificationContext, minutesBefore: number) {
    const { booking, business } = ctx;
    const when = formatDateDisplay(booking.startTime);
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    const label = minutesBefore >= 60 ? `${Math.round(minutesBefore / 60)} hours` : `${minutesBefore} minutes`;
    const text = `Reminder: your appointment at ${business.name} is in ${label}.\n\n${booking.service?.name ?? 'Appointment'} with ${booking.employee?.name ?? 'your provider'}\n${when} · ${time}`;

    return {
      subject: `Reminder: appointment in ${label} — ${business.name}`,
      html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
      text,
    };
  }

  private buildReminderSms(ctx: BookingNotificationContext, minutesBefore: number) {
    const { booking, business } = ctx;
    const when = formatDateDisplay(booking.startTime);
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    const label = minutesBefore >= 60 ? `${Math.round(minutesBefore / 60)}h` : `${minutesBefore}m`;
    return {
      text: `${business.name}: Reminder — ${booking.service?.name ?? 'appointment'} in ${label} (${when} ${time}).`,
    };
  }

  private resolveReviewEmailRecipient(customerEmail?: string | null): string | null {
    const override = this.configService.get<string>('REVIEW_REQUEST_EMAIL_OVERRIDE')?.trim();
    if (override) return override;
    const email = customerEmail?.trim();
    return email || null;
  }

  private buildReviewUrl(businessSlug: string, bookingId: string, token: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl}/book/${businessSlug}/review?bookingId=${bookingId}&token=${token}`;
  }

  private reviewUrlWithRating(reviewUrl: string, rating: number): string {
    const url = new URL(reviewUrl);
    url.searchParams.set('rating', String(rating));
    return url.toString();
  }

  private buildStarRatingLinks(reviewUrl: string): string {
    return [1, 2, 3, 4, 5]
      .map((rating) => {
        const href = this.reviewUrlWithRating(reviewUrl, rating);
        const label = rating === 1 ? '1 star' : `${rating} stars`;
        return `<a href="${href}" style="text-decoration:none;font-size:36px;color:#fbbf24;margin:0 6px;line-height:1;" title="${label}">&#9733;</a>`;
      })
      .join('');
  }

  private buildReviewRequestEmail(ctx: BookingNotificationContext, reviewUrl: string) {
    const { booking, business } = ctx;
    const customerName = booking.customer?.name ?? 'there';
    const providerName = booking.employee?.name ?? 'your provider';
    const starLinks = this.buildStarRatingLinks(reviewUrl);
    const starTextLinks = [1, 2, 3, 4, 5]
      .map((rating) => `${rating}: ${this.reviewUrlWithRating(reviewUrl, rating)}`)
      .join('\n');
    const text = `Hi ${customerName},\n\nThank you for visiting ${business.name}! How was your appointment with ${providerName}?\n\nTap a star to rate (1–5):\n${starTextLinks}\n\nOr leave a review: ${reviewUrl}`;

    return {
      subject: `How was your visit at ${business.name}?`,
      html: `<div style="font-family:sans-serif;color:#111827;max-width:480px;">
<p>Hi ${customerName},</p>
<p>Thank you for visiting <strong>${business.name}</strong>! How was your appointment with ${providerName}?</p>
<p style="text-align:center;font-size:15px;color:#374151;margin:8px 0 4px;">Tap a star to rate your visit</p>
<div style="text-align:center;margin:16px 0 24px;">${starLinks}</div>
<p style="text-align:center;font-size:14px;"><a href="${reviewUrl}" style="color:#7c3aed;">Leave a written review</a></p>
</div>`,
      text,
    };
  }

  private buildReviewRequestSms(ctx: BookingNotificationContext, reviewUrl: string) {
    const { business } = ctx;
    return {
      text: `${business.name}: Thanks for visiting! Leave a review: ${reviewUrl}`,
    };
  }
}
