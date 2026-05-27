import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { formatDateDisplay, formatTimeRangeDisplay } from '../../common/utils/date-format.util.js';

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

  async sendBookingConfirmation(bookingId: string): Promise<void> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return;

    const { booking, businessSettings } = ctx;
    if (booking.status === BookingStatus.CANCELLED) return;

    const customer = booking.customer;
    if (!customer) return;

    const prefs = getCustomerNotificationPreferences(customer.metadata);

    if (businessSettings.sendConfirmationEmail && businessSettings.emailEnabled && prefs.emailReminders && customer.email) {
      await this.dispatch(ctx, 'confirmation', 'email', customer.email, () =>
        this.buildConfirmationEmail(ctx),
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

  private buildConfirmationEmail(ctx: BookingNotificationContext) {
    const { booking, business } = ctx;
    const when = formatDateDisplay(booking.startTime);
    const time = formatTimeRangeDisplay(booking.startTime, booking.endTime);
    const serviceName = booking.service?.name ?? 'Appointment';
    const providerName = booking.employee?.name ?? 'your provider';
    const text = `Hi ${booking.customer?.name ?? 'there'},\n\nYour appointment at ${business.name} is confirmed.\n\n${serviceName} with ${providerName}\n${when} · ${time}\n\nSee you soon!`;

    return {
      subject: `Confirmed: ${serviceName} at ${business.name}`,
      html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
      text,
    };
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
}
