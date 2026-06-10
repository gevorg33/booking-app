import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
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
import { shouldSendConsumerPush } from './consumer-notification-preferences.util.js';
import { buildProviderVisitStatusCustomerSms } from '../../common/utils/provider-visit-status-notification.util.js';
import { mergeMarketingAutomationSettings } from '../marketing-automation/marketing-automation.types.js';
import {
  resolveLocale,
  t,
  type AppLocale,
} from '../../common/i18n/messages.js';
import {
  formatNotificationDateDisplay,
  formatNotificationTimeRangeDisplay,
} from '../../common/utils/notification-date-format.util.js';
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
import { buildTenantAppInstallEmailBlocks } from '../../common/utils/tenant-app-install-link.util.js';
import { renderBusinessEmailTemplate } from './notification-email-template.util.js';
import {
  reminderNotificationKind,
  resolveBookingReminderHoursBefore,
  resolveReminderChannelFlags,
} from './appointment-reminder-settings.util.js';
import {
  formatCustomerRegistrationSourceLabel,
  type CustomerRegistrationSource,
} from './customer-registration.types.js';
import {
  appendPriceToAppointmentDetail,
  buildBookingPriceLines,
  resolveEmailFooterNote,
} from '../../common/utils/notification-currency.util.js';
import { readBusinessTaxSettings } from '../../common/utils/business-tax.util.js';
import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import { formatResultReadyNotificationWhen } from '../../common/utils/notification-date-format.util.js';
import { buildClinicLabBookingRequestLinks } from '../../common/utils/clinic-lab-booking-request-link.util.js';
import { buildClinicResultReadyLinks } from '../../common/utils/clinic-result-ready-link.util.js';
import {
  buildConsumerBookingManagePushUrl,
  buildConsumerGiftCardPushUrl,
  buildConsumerSalonHomePushUrl,
} from '../../common/utils/consumer-booking-push-link.util.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { ConsumerPushDispatchService } from './consumer-push-dispatch.service.js';
import {
  buildConsumerBookingCancelledPushPayload,
  buildConsumerBookingConfirmedPushPayload,
  buildConsumerBookingReminderPushPayload,
  buildConsumerBookingRescheduledPushPayload,
  buildConsumerProviderVisitStatusPushPayload,
  buildConsumerGiftCardReceivedPushPayload,
  buildConsumerLabBookingRequestPushPayload,
  buildConsumerResultReadyPushPayload,
  type ConsumerSalonBookingPushPayload,
} from './consumer-transactional-push.util.js';
import type { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { resolveGiftCardSenderName } from '../gift-cards/gift-card-delivery-content.util.js';

export type ResultReadyDeliveryChannel = NotificationChannel | 'push';

export interface ResultReadyDeliverySummary {
  delivered: ResultReadyDeliveryChannel[];
  pushSkippedReason?: string;
}

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
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(NotificationLog)
    private logRepo: Repository<NotificationLog>,
    @InjectRepository(ClinicTestResult)
    private resultRepo: Repository<ClinicTestResult>,
    private emailService: EmailService,
    private smsService: SmsService,
    private whatsappService: WhatsAppService,
    private whatsappIntegrationService: WhatsAppIntegrationService,
    private configService: ConfigService,
    private consumerPushDispatch: ConsumerPushDispatchService,
  ) {}

  async getBusinessSettings(
    businessId: string,
  ): Promise<BusinessNotificationSettings> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return mergeBusinessNotificationSettings(business.settings?.notifications);
  }

  async updateBusinessSettings(
    businessId: string,
    patch: Partial<BusinessNotificationSettings>,
  ): Promise<BusinessNotificationSettings> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    business.settings = {
      ...business.settings,
      notifications: mergeBusinessNotificationSettings({
        ...mergeBusinessNotificationSettings(business.settings?.notifications),
        ...patch,
      }),
    };
    await this.businessRepo.save(business);
    return mergeBusinessNotificationSettings(business.settings.notifications);
  }

  getProviderStatus(settings?: Record<string, unknown>) {
    const whatsappConfig =
      this.whatsappIntegrationService.resolveRuntimeConfig(settings);
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
      await this.dispatch(ctx, 'confirmation', 'email', customer.email, async () =>
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
      await this.dispatchWhatsApp(
        immediateCtx,
        'reminder_immediate',
        customer.phone,
        0,
      );
    }
  }

  async sendBookingConfirmation(bookingId: string): Promise<void> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return;

    const { booking, business, businessSettings } = ctx;
    if (booking.status === BookingStatus.CANCELLED) return;

    const customer = booking.customer;
    if (!customer) return;

    const prefs = getCustomerNotificationPreferences(customer.metadata);

    const manageLink = await this.resolveManageLinkForBooking(ctx);

    if (
      businessSettings.sendConfirmationEmail &&
      businessSettings.emailEnabled &&
      prefs.emailReminders &&
      customer.email
    ) {
      await this.dispatch(ctx, 'confirmation', 'email', customer.email, async () =>
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

    if (businessSettings.sendConfirmationPush && prefs.pushReminders) {
      await this.trySendConsumerSalonBookingPush(ctx, (url, locale) =>
        buildConsumerBookingConfirmedPushPayload({
          url,
          businessId: business.id,
          customerId: customer.id,
          bookingId: booking.id,
          businessName: business.name,
          serviceName: booking.service?.name ?? '',
          scheduleLabel: this.buildBookingScheduleLabel(ctx, locale),
          locale,
        }),
      );
    }
  }

  async sendBookingCancellation(
    bookingId: string,
    reason?: string,
  ): Promise<void> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return;

    const { booking, business, businessSettings } = ctx;
    if (booking.status !== BookingStatus.CANCELLED) return;

    const customer = booking.customer;
    if (!customer) return;

    const prefs = getCustomerNotificationPreferences(customer.metadata);
    const cancelReason = reason || 'Your appointment was cancelled';

    if (
      businessSettings.emailEnabled &&
      prefs.emailReminders &&
      customer.email
    ) {
      await this.dispatch(ctx, 'cancellation', 'email', customer.email, () =>
        this.buildCancellationEmail(ctx, cancelReason),
      );
    }

    if (businessSettings.smsEnabled && prefs.smsReminders && customer.phone) {
      await this.dispatch(ctx, 'cancellation', 'sms', customer.phone, () =>
        this.buildCancellationSms(ctx, cancelReason),
      );
    }

    if (
      businessSettings.whatsappEnabled &&
      prefs.whatsappReminders &&
      customer.phone
    ) {
      await this.dispatchWhatsApp(
        ctx,
        'cancellation',
        customer.phone,
        undefined,
        cancelReason,
      );
    }

    if (businessSettings.sendCancellationPush && prefs.pushReminders) {
      await this.trySendConsumerSalonBookingPush(ctx, (url, locale) =>
        buildConsumerBookingCancelledPushPayload({
          url,
          businessId: business.id,
          customerId: customer.id,
          bookingId: booking.id,
          businessName: business.name,
          serviceName: booking.service?.name ?? '',
          scheduleLabel: this.buildBookingScheduleLabel(ctx, locale),
          locale,
        }),
      );
    }
  }

  async sendBookingRescheduleToCustomer(
    bookingId: string,
    details?: { previousStartTime?: string; newStartTime?: string },
  ): Promise<void> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return;

    const { booking, business, businessSettings } = ctx;
    if (booking.status === BookingStatus.CANCELLED) return;

    const customer = booking.customer;
    if (!customer) return;

    const prefs = getCustomerNotificationPreferences(customer.metadata);
    if (!businessSettings.sendReschedulePush || !prefs.pushReminders) return;

    const locale = this.businessLocale(business.settings);
    const scheduleLabel = details?.newStartTime
      ? this.formatBookingScheduleFromStart(
          new Date(details.newStartTime),
          booking.endTime,
          business.settings,
          locale,
        )
      : this.buildBookingScheduleLabel(ctx, locale);

    await this.trySendConsumerSalonBookingPush(ctx, (url, pushLocale) =>
      buildConsumerBookingRescheduledPushPayload({
        url,
        businessId: business.id,
        customerId: customer.id,
        bookingId: booking.id,
        businessName: business.name,
        serviceName: booking.service?.name ?? '',
        scheduleLabel,
        locale: pushLocale,
      }),
    );
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

    const locale = this.businessLocale(business.settings);
    const customerName = booking.customer?.name ?? 'A customer';
    const serviceName =
      booking.service?.name ?? t(locale, 'email.defaultServiceName');
    const when = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const time = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );

    let summary: string;
    if (change === 'cancelled') {
      summary = `${customerName} cancelled ${serviceName} scheduled for ${when} at ${time}.`;
    } else {
      const fromWhen = details?.previousStartTime
        ? `${formatNotificationDateDisplay(
            new Date(details.previousStartTime),
            business.settings,
            locale,
          )} ${formatNotificationTimeRangeDisplay(
            new Date(details.previousStartTime),
            booking.endTime,
            business.settings,
            locale,
          )}`
        : when;
      const toWhen = details?.newStartTime
        ? `${formatNotificationDateDisplay(
            new Date(details.newStartTime),
            business.settings,
            locale,
          )} ${formatNotificationTimeRangeDisplay(
            new Date(details.newStartTime),
            booking.endTime,
            business.settings,
            locale,
          )}`
        : when;
      summary = `${customerName} rescheduled ${serviceName} from ${fromWhen} to ${toWhen}.`;
    }

    await this.dispatch(
      ctx,
      change === 'cancelled'
        ? 'business_booking_cancelled'
        : 'business_booking_rescheduled',
      'email',
      recipient,
      () => ({
        subject: `Customer ${change === 'cancelled' ? 'cancellation' : 'reschedule'} — ${serviceName}`,
        text: `${business.name} booking update\n\n${summary}`,
        html: `<p>${summary.replace(/\n/g, '<br/>')}</p>`,
      }),
    );
  }

  async sendMarketingNewCustomerRegistration(
    businessId: string,
    customerId: string,
    source: CustomerRegistrationSource,
  ): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return;

    const settings = mergeBusinessNotificationSettings(
      business.settings?.notifications,
    );
    if (!settings.emailOnNewCustomerRegistration) return;
    if (!settings.emailEnabled) return;
    if (settings.marketingTeamEmails.length === 0) return;

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId, isActive: true },
    });
    if (!customer) return;

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const profileUrl = `${frontendUrl.replace(/\/$/, '')}/dashboard/customers?search=${encodeURIComponent(customer.name)}`;
    const sourceLabel = formatCustomerRegistrationSourceLabel(source);
    const subject = `New customer — ${customer.name}`;
    const lines = [
      `${customer.name} just registered as a customer.`,
      '',
      `Email: ${customer.email ?? '—'}`,
      `Phone: ${customer.phone ?? '—'}`,
      `Source: ${sourceLabel}`,
      `Business: ${business.name}`,
      '',
      `View profile: ${profileUrl}`,
    ];
    const text = lines.join('\n');
    const html = `<p><strong>${customer.name}</strong> just registered as a customer.</p>
<ul>
<li>Email: ${customer.email ?? '—'}</li>
<li>Phone: ${customer.phone ?? '—'}</li>
<li>Source: ${sourceLabel}</li>
<li>Business: ${business.name}</li>
</ul>
<p><a href="${profileUrl}">Open customer profile</a></p>`;

    for (const recipient of settings.marketingTeamEmails) {
      const result = await this.emailService.send({
        to: recipient,
        subject,
        text,
        html,
      });
      if (!result.ok) {
        this.logger.warn(
          `Failed marketing new-customer email to ${recipient} for ${customerId}: ${result.error}`,
        );
      }
    }
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

  async sendProviderVisitStatusToCustomer(
    bookingId: string,
    input: {
      kind: 'running_late' | 'ready_now';
      minutesLate?: number;
      providerName: string;
    },
  ): Promise<{ smsSent: boolean; pushSent: boolean }> {
    const ctx = await this.loadContext(bookingId);
    if (!ctx) return { smsSent: false, pushSent: false };

    const { booking, business, businessSettings } = ctx;
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.NO_SHOW
    ) {
      return { smsSent: false, pushSent: false };
    }

    const customer = booking.customer;
    if (!customer) return { smsSent: false, pushSent: false };

    const prefs = getCustomerNotificationPreferences(customer.metadata);
    const notificationKind =
      input.kind === 'ready_now' ? 'provider_ready_now' : 'provider_running_late';
    let smsSent = false;
    let pushSent = false;

    if (businessSettings.smsEnabled && prefs.smsReminders && customer.phone) {
      smsSent = await this.dispatch(
        ctx,
        notificationKind,
        'sms',
        customer.phone,
        () => ({
          text: buildProviderVisitStatusCustomerSms({
            kind: input.kind,
            minutesLate: input.minutesLate,
            businessName: business.name,
            providerName: input.providerName,
            serviceName: booking.service?.name ?? '',
          }),
        }),
      );
    }

    if (prefs.pushReminders) {
      const locale = this.businessLocale(business.settings);
      pushSent = await this.trySendConsumerSalonBookingPush(ctx, (url, pushLocale) =>
        buildConsumerProviderVisitStatusPushPayload({
          url,
          businessId: business.id,
          customerId: customer.id,
          bookingId: booking.id,
          businessName: business.name,
          providerName: input.providerName,
          serviceName: booking.service?.name ?? '',
          kind: input.kind,
          minutesLate: input.minutesLate,
          locale: pushLocale,
        }),
      );
    }

    return { smsSent, pushSent };
  }

  /** Clinic vertical — notify patient when a lab result is released (vert-clinic-2.4.2 / 2.4.7). */
  async sendClinicResultReady(
    resultId: string,
  ): Promise<ResultReadyDeliverySummary> {
    const delivered: ResultReadyDeliveryChannel[] = [];
    let pushSkippedReason: string | undefined;

    const result = await this.resultRepo.findOne({
      where: { id: resultId },
      relations: {
        customer: true,
        order: true,
        testType: true,
        business: true,
      },
    });
    if (!result || result.status !== 'Released') {
      return { delivered };
    }
    if (!result.customer || !result.business) {
      return { delivered };
    }

    const businessSettingsRaw = result.business.settings as
      | Record<string, unknown>
      | undefined;
    const businessType =
      typeof businessSettingsRaw?.businessType === 'string'
        ? businessSettingsRaw.businessType
        : undefined;
    if (!isClinicVerticalBusinessType(businessType)) {
      return { delivered };
    }

    const businessSettings = mergeBusinessNotificationSettings(
      businessSettingsRaw?.notifications as Record<string, unknown> | undefined,
    );
    const prefs = getCustomerNotificationPreferences(result.customer.metadata);
    const locale = this.businessLocale(businessSettingsRaw);
    const whenLabel = formatResultReadyNotificationWhen(
      result.releasedAt ?? new Date(),
      businessSettingsRaw,
      locale,
    );
    const testName =
      result.testType?.title ??
      result.order?.displayNames ??
      t(locale, 'email.defaultServiceName');
    const resultLinks = buildClinicResultReadyLinks(
      result.business.slug,
      this.configService.get<string>('FRONTEND_URL'),
    );
    const accountLine = resultLinks
      ? t(locale, 'email.clinicResultReadyAccountLink', {
          url: resultLinks.webResultsUrl,
        })
      : '';

    const logBookingId = result.bookingId ?? result.id;
    const ctx = result.bookingId
      ? await this.loadContext(result.bookingId)
      : null;

    if (
      businessSettings.sendResultReadyEmail &&
      businessSettings.emailEnabled &&
      prefs.emailReminders &&
      result.customer.email
    ) {
      const sent = await this.dispatchResultReady(
        logBookingId,
        result.businessId,
        ctx,
        'result_ready',
        'email',
        result.customer.email,
        () =>
          this.buildClinicResultReadyEmail(
            result.business.name,
            result.customer.name,
            testName,
            whenLabel,
            accountLine,
            locale,
          ),
      );
      if (sent) delivered.push('email');
    }

    if (
      businessSettings.smsEnabled &&
      prefs.smsReminders &&
      result.customer.phone
    ) {
      const sent = await this.dispatchResultReady(
        logBookingId,
        result.businessId,
        ctx,
        'result_ready',
        'sms',
        result.customer.phone,
        () =>
          this.buildClinicResultReadySms(
            result.business.name,
            testName,
            whenLabel,
            accountLine,
            locale,
          ),
      );
      if (sent) delivered.push('sms');
    }

    if (
      businessSettings.whatsappEnabled &&
      businessSettings.sendResultReadyWhatsapp &&
      prefs.whatsappReminders &&
      result.customer.phone &&
      ctx
    ) {
      const sent = await this.dispatchResultReadyWhatsApp(
        ctx,
        'result_ready',
        result.customer.phone,
        whenLabel,
        testName,
        locale,
      );
      if (sent) delivered.push('whatsapp');
    }

    if (
      businessSettings.sendResultReadyPush &&
      prefs.pushReminders &&
      resultLinks
    ) {
      const pushResult = await this.consumerPushDispatch.sendResultReady(
        buildConsumerResultReadyPushPayload({
          url: resultLinks.consumerAppUrl,
          businessId: result.businessId,
          customerId: result.customer.id,
          bookingId: result.bookingId,
          resultId: result.id,
          businessName: result.business.name,
          testName,
          locale,
        }),
      );
      if (pushResult.ok) {
        delivered.push('push');
      } else if (pushResult.skipped) {
        pushSkippedReason = pushResult.reason;
      }
    }

    return { delivered, pushSkippedReason };
  }

  /** Clinic vertical — notify patient to book lab collection after staff pushes an order. */
  async sendClinicLabBookingRequest(input: {
    orderId: string;
    businessId: string;
    customerId: string;
    testNames: string | null | undefined;
    collectionServiceName: string;
    collectionServiceId?: string | null;
    clinicOrderToken?: string | null;
    bookUrl: string;
    accountUrl: string;
  }): Promise<void> {
    const [business, customer] = await Promise.all([
      this.businessRepo.findOne({ where: { id: input.businessId } }),
      this.customerRepo.findOne({ where: { id: input.customerId } }),
    ]);
    if (!business || !customer) return;

    const businessSettings = mergeBusinessNotificationSettings(
      (business.settings as Record<string, unknown> | undefined)
        ?.notifications as Record<string, unknown> | undefined,
    );
    const prefs = getCustomerNotificationPreferences(customer.metadata);
    const locale = this.businessLocale(
      business.settings as Record<string, unknown> | undefined,
    );
    const testNames =
      input.testNames?.trim() || t(locale, 'email.defaultServiceName');
    const customerName =
      customer.name?.trim() || t(locale, 'email.defaultCustomerName');

    if (
      businessSettings.emailEnabled &&
      prefs.emailReminders &&
      customer.email
    ) {
      await this.dispatch(
        {
          booking: {
            id: input.orderId,
            businessId: input.businessId,
          } as Booking,
          business,
          businessSettings,
        },
        'lab_booking_request',
        'email',
        customer.email,
        () => ({
          subject: t(locale, 'email.clinicLabBookingRequestSubject', {
            businessName: business.name,
          }),
          text: t(locale, 'email.clinicLabBookingRequestBody', {
            customerName,
            testNames,
            collectionServiceName: input.collectionServiceName,
            bookUrl: input.bookUrl,
          }),
          html: `<p>${t(locale, 'email.clinicLabBookingRequestBody', {
            customerName,
            testNames,
            collectionServiceName: input.collectionServiceName,
            bookUrl: input.bookUrl,
          })}</p>`,
        }),
      );
    }

    if (businessSettings.smsEnabled && prefs.smsReminders && customer.phone) {
      await this.dispatch(
        {
          booking: {
            id: input.orderId,
            businessId: input.businessId,
          } as Booking,
          business,
          businessSettings,
        },
        'lab_booking_request',
        'sms',
        customer.phone,
        () => ({
          text: t(locale, 'email.clinicLabBookingRequestSms', {
            businessName: business.name,
            collectionServiceName: input.collectionServiceName,
            testNames,
            bookUrl: input.bookUrl,
          }),
        }),
      );
    }

    if (
      businessSettings.whatsappEnabled &&
      prefs.whatsappReminders &&
      customer.phone
    ) {
      await this.dispatchLabBookingRequestWhatsApp({
        orderId: input.orderId,
        businessId: input.businessId,
        business,
        customerName,
        collectionServiceName: input.collectionServiceName,
        testNames,
        phone: customer.phone,
        locale,
      });
    }

    const labRequestLinks = buildClinicLabBookingRequestLinks(
      business.slug,
      this.configService.get<string>('FRONTEND_URL'),
      {
        collectionServiceId: input.collectionServiceId,
        clinicOrderToken: input.clinicOrderToken,
      },
    );
    if (
      businessSettings.sendLabBookingRequestPush &&
      prefs.pushReminders &&
      labRequestLinks
    ) {
      await this.consumerPushDispatch.sendLabBookingRequest(
        buildConsumerLabBookingRequestPushPayload({
          url: labRequestLinks.consumerAppUrl,
          businessId: input.businessId,
          customerId: input.customerId,
          orderId: input.orderId,
          businessName: business.name,
          collectionServiceName: input.collectionServiceName,
          testNames,
          collectionServiceId: input.collectionServiceId,
          clinicOrderToken: input.clinicOrderToken,
          locale,
        }),
      );
    }
  }

  async processDueReminders(): Promise<number> {
    const now = new Date();
    let sent = 0;

    sent += await this.processReminderWindow('reminder_24h', 24 * 60, now);
    sent += await this.processReminderWindow('reminder_1h', 60, now);
    sent += await this.processCustomerChosenReminders(now);

    return sent;
  }

  private isWithinReminderWindow(
    now: Date,
    startTime: Date,
    minutesBefore: number,
  ): boolean {
    const windowMs = 5 * 60 * 1000;
    const target = startTime.getTime() - minutesBefore * 60 * 1000;
    return Math.abs(now.getTime() - target) <= windowMs;
  }

  private async processCustomerChosenReminders(now: Date): Promise<number> {
    const maxLeadHours = 168;
    const horizon = new Date(now.getTime() + maxLeadHours * 60 * 60 * 1000);

    const bookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.employee', 'employee')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.business', 'business')
      .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('booking.startTime >= :now', { now })
      .andWhere('booking.startTime <= :horizon', { horizon })
      .getMany();

    let sent = 0;
    for (const booking of bookings) {
      if (!booking.business) continue;
      const businessSettings = mergeBusinessNotificationSettings(
        booking.business.settings?.notifications,
      );
      if (!businessSettings.allowCustomerReminderChoice) continue;

      const leadHours = resolveBookingReminderHoursBefore(
        booking.metadata,
        businessSettings,
      );
      if (leadHours == null) continue;

      const minutesBefore = leadHours * 60;
      if (!this.isWithinReminderWindow(now, booking.startTime, minutesBefore))
        continue;

      const ctx: BookingNotificationContext = {
        booking,
        business: booking.business,
        businessSettings,
      };
      const customer = booking.customer;
      if (!customer) continue;

      const prefs = getCustomerNotificationPreferences(customer.metadata);
      const channelFlags = resolveReminderChannelFlags(
        businessSettings,
        leadHours,
      );
      const kind = reminderNotificationKind(leadHours) as NotificationKind;

      if (
        businessSettings.emailEnabled &&
        channelFlags.email &&
        prefs.emailReminders &&
        customer.email
      ) {
        const ok = await this.dispatch(ctx, kind, 'email', customer.email, () =>
          this.buildReminderEmail(ctx, minutesBefore),
        );
        if (ok) sent++;
      }

      if (
        businessSettings.smsEnabled &&
        channelFlags.sms &&
        prefs.smsReminders &&
        customer.phone
      ) {
        const ok = await this.dispatch(ctx, kind, 'sms', customer.phone, () =>
          this.buildReminderSms(ctx, minutesBefore),
        );
        if (ok) sent++;
      }

      if (
        businessSettings.whatsappEnabled &&
        channelFlags.whatsapp &&
        prefs.whatsappReminders &&
        customer.phone
      ) {
        const ok = await this.dispatchWhatsApp(
          ctx,
          kind,
          customer.phone,
          minutesBefore,
        );
        if (ok) sent++;
      }

      const pushEnabled =
        leadHours >= 12
          ? businessSettings.sendReminder24hPush
          : businessSettings.sendReminder1hPush;
      if (pushEnabled && prefs.pushReminders) {
        const ok = await this.trySendConsumerSalonBookingPush(
          ctx,
          (url, locale) =>
            buildConsumerBookingReminderPushPayload({
              url,
              businessId: booking.business.id,
              customerId: customer.id,
              bookingId: booking.id,
              businessName: booking.business.name,
              serviceName: booking.service?.name ?? '',
              scheduleLabel: this.buildBookingScheduleLabel(ctx, locale),
              minutesBefore,
              locale,
            }),
        );
        if (ok) sent++;
      }
    }

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
        businessSettings: mergeBusinessNotificationSettings(
          booking.business?.settings?.notifications,
        ),
      };
      if (ctx.businessSettings.allowCustomerReminderChoice) continue;

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

      if (
        businessSettings.emailEnabled &&
        emailEnabled &&
        prefs.emailReminders &&
        customer.email
      ) {
        const ok = await this.dispatch(ctx, kind, 'email', customer.email, () =>
          this.buildReminderEmail(ctx, minutesBefore),
        );
        if (ok) sent++;
      }

      if (
        businessSettings.smsEnabled &&
        smsEnabled &&
        prefs.smsReminders &&
        customer.phone
      ) {
        const ok = await this.dispatch(ctx, kind, 'sms', customer.phone, () =>
          this.buildReminderSms(ctx, minutesBefore),
        );
        if (ok) sent++;
      }

      if (
        businessSettings.whatsappEnabled &&
        whatsappEnabled &&
        prefs.whatsappReminders &&
        customer.phone
      ) {
        const ok = await this.dispatchWhatsApp(
          ctx,
          kind,
          customer.phone,
          minutesBefore,
        );
        if (ok) sent++;
      }

      const pushEnabled =
        kind === 'reminder_24h'
          ? businessSettings.sendReminder24hPush
          : businessSettings.sendReminder1hPush;
      if (pushEnabled && prefs.pushReminders) {
        const ok = await this.trySendConsumerSalonBookingPush(
          ctx,
          (url, locale) =>
            buildConsumerBookingReminderPushPayload({
              url,
              businessId: booking.business!.id,
              customerId: customer.id,
              bookingId: booking.id,
              businessName: booking.business!.name,
              serviceName: booking.service?.name ?? '',
              scheduleLabel: this.buildBookingScheduleLabel(ctx, locale),
              minutesBefore,
              locale,
            }),
        );
        if (ok) sent++;
      }
    }

    return sent;
  }

  private async loadContext(
    bookingId: string,
  ): Promise<BookingNotificationContext | null> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: {
        customer: true,
        employee: true,
        service: true,
        business: true,
      },
    });
    if (!booking?.business) return null;

    return {
      booking,
      business: booking.business,
      businessSettings: mergeBusinessNotificationSettings(
        booking.business.settings?.notifications,
      ),
    };
  }

  private async dispatch(
    ctx: BookingNotificationContext,
    kind: NotificationKind,
    channel: NotificationChannel,
    recipient: string,
    build:
      | (() => { subject?: string; html?: string; text: string } | null)
      | (() => Promise<{ subject?: string; html?: string; text: string } | null>),
  ): Promise<boolean> {
    const existing = await this.logRepo.findOne({
      where: {
        bookingId: ctx.booking.id,
        kind,
        channel,
      },
    });
    if (existing) return false;

    const content = await Promise.resolve(build());
    if (!content) return false;
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
      this.logger.warn(
        `Failed ${kind} ${channel} for booking ${ctx.booking.id}: ${error}`,
      );
    }

    return ok;
  }

  private async shouldSkipImmediateWhatsApp(
    ctx: BookingNotificationContext,
  ): Promise<boolean> {
    const config = this.whatsappIntegrationService.resolveRuntimeConfig(
      ctx.business.settings,
    );
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

    const config = this.whatsappIntegrationService.resolveRuntimeConfig(
      ctx.business.settings,
    );
    if (!config) {
      this.logger.warn(
        `WhatsApp not configured for business ${ctx.business.id}`,
      );
      return false;
    }

    const { booking, business } = ctx;
    const locale = this.businessLocale(business.settings);
    const dateLabel = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const timeLabel = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );
    const priceLines = buildBookingPriceLines(
      booking,
      business.settings as Record<string, unknown>,
      locale,
    );
    const scheduleLabel = appendPriceToAppointmentDetail(
      `${dateLabel} ${timeLabel}`,
      priceLines.priceLabel,
    );
    const reminderLabel =
      kind === 'reminder_immediate'
        ? t(locale, 'email.reminderNow')
        : minutesBefore !== undefined
          ? this.reminderLabel(locale, minutesBefore)
          : undefined;

    const result = await this.whatsappService.sendBookingMessage(
      {
        toPhone: phone,
        kind,
        customerName:
          booking.customer?.name ?? t(locale, 'email.defaultCustomerName'),
        businessName: business.name,
        serviceName:
          booking.service?.name ?? t(locale, 'email.defaultServiceName'),
        providerName:
          booking.employee?.name ?? t(locale, 'email.defaultProviderName'),
        dateLabel,
        timeLabel: scheduleLabel,
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
      this.logger.warn(
        `Failed ${kind} whatsapp for booking ${ctx.booking.id}: ${result.error}`,
      );
    }

    return result.ok;
  }

  private buildCancellationEmail(
    ctx: BookingNotificationContext,
    reason: string,
  ) {
    const { booking, business } = ctx;
    const locale = this.businessLocale(business.settings);
    const when = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const time = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );
    const serviceName =
      booking.service?.name ?? t(locale, 'email.defaultServiceName');

    return renderBusinessEmailTemplate(
      business.settings,
      'booking_cancellation',
      {
        customerName:
          booking.customer?.name ?? t(locale, 'email.defaultCustomerName'),
        businessName: business.name,
        serviceName,
        dateLabel: when,
        timeLabel: time,
        cancelReason: reason,
      },
    );
  }

  private buildCancellationSms(
    ctx: BookingNotificationContext,
    reason: string,
  ) {
    const { booking, business } = ctx;
    const locale = this.businessLocale(business.settings);
    const when = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const time = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );
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
      relations: {
        customer: true,
        employee: true,
        service: true,
        business: true,
      },
      order: { startTime: 'ASC' },
    });
  }

  private resolveGroupedConfirmationLabel(bookings: Booking[]): string {
    const meta = bookings[0]?.metadata ?? {};
    const packageName =
      typeof meta.packageName === 'string' ? meta.packageName.trim() : '';
    if (packageName) return packageName;

    const groupLabel =
      typeof meta.groupLabel === 'string' ? meta.groupLabel.trim() : '';
    if (groupLabel) return groupLabel;

    const names = bookings
      .map((b) => b.service?.name)
      .filter((name): name is string => Boolean(name));
    return names.length ? names.join(' + ') : `${bookings.length} appointments`;
  }

  private async buildGroupedAppointmentLines(bookings: Booking[]): Promise<
    Array<{
      serviceName: string;
      providerName: string;
      when: string;
      time: string;
      schedule: string;
      manageUrl: string | null;
      manageLabel: string | null;
    }>
  > {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const slug = bookings[0]?.business?.slug ?? '';
    const selfService = resolveCustomerSelfServiceSettings(
      bookings[0]?.business?.settings,
    );
    const locale = this.businessLocale(bookings[0]?.business?.settings);

    return Promise.all(
      bookings.map(async (b) => {
        const priceLines = buildBookingPriceLines(
          b,
          b.business?.settings as Record<string, unknown>,
          locale,
        );
        const schedule = appendPriceToAppointmentDetail(
          `${formatNotificationDateDisplay(b.startTime, b.business?.settings, locale)} · ${formatNotificationTimeRangeDisplay(b.startTime, b.endTime, b.business?.settings, locale)}`,
          priceLines.priceLabel,
        );
        const line = {
          serviceName: b.service?.name ?? t(locale, 'email.defaultServiceName'),
          providerName:
            b.employee?.name ?? t(locale, 'email.defaultProviderName'),
          when: formatNotificationDateDisplay(
            b.startTime,
            b.business?.settings,
            locale,
          ),
          time: formatNotificationTimeRangeDisplay(
            b.startTime,
            b.endTime,
            b.business?.settings,
            locale,
          ),
          schedule,
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

  private async buildGroupedConfirmationEmail(
    ctx: BookingNotificationContext,
    lines: Array<{
      serviceName: string;
      providerName: string;
      when: string;
      time: string;
      schedule: string;
      manageUrl: string | null;
      manageLabel: string | null;
    }>,
    groupLabel: string,
  ) {
    const { booking, business } = ctx;
    const locale = this.businessLocale(business.settings);
    const count = lines.length;
    const appointmentWord = t(
      locale,
      count === 1 ? 'email.appointment' : 'email.appointments',
    );
    const detailLines = lines.map((line) => {
      const base = `• ${line.serviceName} with ${line.providerName}\n  ${line.schedule}`;
      return line.manageUrl && line.manageLabel
        ? `${base}\n  ${formatBookingManageLinkText(line.manageLabel, line.manageUrl)}`
        : base;
    });
    const htmlLines = lines
      .map((line) => {
        const base = `<strong>${line.serviceName}</strong> with ${line.providerName}<br/>${line.schedule}`;
        const manage =
          line.manageUrl && line.manageLabel
            ? `<br/>${formatBookingManageLinkHtml(line.manageLabel, line.manageUrl)}`
            : '';
        return `<li>${base}${manage}</li>`;
      })
      .join('');

    const appInstall = await this.resolveAppInstallEmailBlocks(
      business.slug,
      booking.serviceId ?? undefined,
      locale,
      'confirmation_qr',
    );

    return renderBusinessEmailTemplate(
      business.settings,
      'booking_confirmation_grouped',
      {
        customerName:
          booking.customer?.name ?? t(locale, 'email.defaultCustomerName'),
        businessName: business.name,
        appointmentCount: String(count),
        appointmentWord,
        groupLabelSuffix: groupLabel ? ` (${groupLabel})` : '',
        appointmentsListText: detailLines.join('\n\n'),
        appointmentsListHtml: `<ul>${htmlLines}</ul>`,
        ...appInstall,
        footerNote: this.resolveReceiptFooter(
          locale,
          business.settings as Record<string, unknown>,
        ),
      },
    );
  }

  private resolveReceiptFooter(
    locale: AppLocale,
    businessSettings: Record<string, unknown>,
    taxRegistrationFooter?: string,
  ): string {
    const footer =
      taxRegistrationFooter ??
      (() => {
        const taxNumber = readBusinessTaxSettings(businessSettings).taxNumber;
        return taxNumber
          ? t(locale, 'email.taxRegistrationFooter', { number: taxNumber })
          : undefined;
      })();
    return resolveEmailFooterNote(
      locale,
      t(locale, 'email.footerNote'),
      footer,
    );
  }

  private buildGroupedConfirmationSms(
    ctx: BookingNotificationContext,
    lines: Array<{ serviceName: string; schedule: string }>,
    groupLabel: string,
  ) {
    const { business } = ctx;
    const summary = lines
      .map((line) => `${line.serviceName} ${line.schedule}`)
      .join('; ');
    const label = groupLabel ? ` (${groupLabel})` : '';
    return {
      text: `${business.name}: Confirmed ${lines.length} appointment${lines.length === 1 ? '' : 's'}${label}: ${summary}.`,
    };
  }

  private async dispatchGroupedWhatsApp(
    ctx: BookingNotificationContext,
    bookings: Booking[],
    lines: Array<{ serviceName: string; schedule: string }>,
    groupLabel: string,
  ): Promise<void> {
    const first = bookings[0];
    if (!first) return;

    const scheduleLabel =
      lines.length === 1
        ? lines[0].schedule
        : lines.map((l) => `${l.serviceName}: ${l.schedule}`).join('; ');

    const existing = await this.logRepo.findOne({
      where: {
        bookingId: ctx.booking.id,
        kind: 'confirmation',
        channel: 'whatsapp',
      },
    });
    if (existing) return;

    const config = this.whatsappIntegrationService.resolveRuntimeConfig(
      ctx.business.settings,
    );
    if (!config) return;

    const customer = ctx.booking.customer;
    if (!customer?.phone) return;

    const result = await this.whatsappService.sendBookingMessage(
      {
        toPhone: customer.phone,
        kind: 'confirmation',
        customerName:
          customer.name ??
          t(
            this.businessLocale(ctx.business.settings),
            'email.defaultCustomerName',
          ),
        businessName: ctx.business.name,
        serviceName: groupLabel || lines.map((l) => l.serviceName).join(', '),
        providerName:
          first.employee?.name ??
          t(
            this.businessLocale(ctx.business.settings),
            'email.defaultProviderName',
          ),
        dateLabel: scheduleLabel,
        timeLabel: '',
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

  private async buildConfirmationEmail(
    ctx: BookingNotificationContext,
    manageLink: { label: string; url: string } | null,
  ) {
    const { booking, business } = ctx;
    const locale = this.businessLocale(business.settings);
    const when = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const time = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );
    const serviceName =
      booking.service?.name ?? t(locale, 'email.defaultServiceName');
    const providerName =
      booking.employee?.name ?? t(locale, 'email.defaultProviderName');
    const manageLinkText = manageLink
      ? `\n\n${formatBookingManageLinkText(manageLink.label, manageLink.url)}`
      : '';
    const manageLinkHtml = manageLink
      ? `<br/><br/>${formatBookingManageLinkHtml(manageLink.label, manageLink.url)}`
      : '';
    const priceLines = buildBookingPriceLines(
      booking,
      business.settings as Record<string, unknown>,
      locale,
    );

    const hasReceiptAmount =
      Boolean(priceLines.priceLineText?.trim()) ||
      Boolean(priceLines.priceLineHtml?.trim());
    const appInstall = await this.resolveAppInstallEmailBlocks(
      business.slug,
      booking.serviceId ?? undefined,
      locale,
      hasReceiptAmount ? 'receipt_qr' : 'confirmation_qr',
    );

    return renderBusinessEmailTemplate(
      business.settings,
      'booking_confirmation',
      {
        customerName:
          booking.customer?.name ?? t(locale, 'email.defaultCustomerName'),
        businessName: business.name,
        serviceName,
        providerName,
        dateLabel: when,
        timeLabel: time,
        priceLineText: priceLines.priceLineText,
        priceLineHtml: priceLines.priceLineHtml,
        manageLinkText,
        manageLinkHtml,
        ...appInstall,
        footerNote: this.resolveReceiptFooter(
          locale,
          business.settings as Record<string, unknown>,
          priceLines.taxRegistrationFooter,
        ),
      },
    );
  }

  private async resolveAppInstallEmailBlocks(
    slug: string,
    serviceId: string | undefined,
    locale: AppLocale,
    campaign: 'confirmation_qr' | 'receipt_qr',
  ) {
    return buildTenantAppInstallEmailBlocks({
      frontendUrl:
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
      slug,
      serviceId,
      campaign,
      locale,
      includeQr: true,
    });
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
    const locale = this.businessLocale(business.settings);
    const when = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const time = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );
    const priceLines = buildBookingPriceLines(
      booking,
      business.settings as Record<string, unknown>,
      locale,
    );
    const schedule = appendPriceToAppointmentDetail(
      `${when} at ${time}`,
      priceLines.priceLabel,
    );
    return {
      text: `${business.name}: Confirmed ${booking.service?.name ?? 'appointment'} on ${schedule}.`,
    };
  }

  private buildReminderEmail(
    ctx: BookingNotificationContext,
    minutesBefore: number,
  ) {
    const { booking, business } = ctx;
    const locale = this.businessLocale(business.settings);
    const when = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const time = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );

    const priceLines = buildBookingPriceLines(
      booking,
      business.settings as Record<string, unknown>,
      locale,
    );

    return renderBusinessEmailTemplate(business.settings, 'booking_reminder', {
      customerName:
        booking.customer?.name ?? t(locale, 'email.defaultCustomerName'),
      businessName: business.name,
      serviceName:
        booking.service?.name ?? t(locale, 'email.defaultServiceName'),
      providerName:
        booking.employee?.name ?? t(locale, 'email.defaultProviderName'),
      dateLabel: when,
      timeLabel: time,
      priceLineText: priceLines.priceLineText,
      priceLineHtml: priceLines.priceLineHtml,
      reminderLabel: this.reminderLabel(locale, minutesBefore),
    });
  }

  private buildReminderSms(
    ctx: BookingNotificationContext,
    minutesBefore: number,
  ) {
    const { booking, business } = ctx;
    const locale = this.businessLocale(business.settings);
    const when = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const time = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );
    const label = this.reminderLabel(locale, minutesBefore);
    const priceLines = buildBookingPriceLines(
      booking,
      business.settings as Record<string, unknown>,
      locale,
    );
    const schedule = appendPriceToAppointmentDetail(
      `${when} ${time}`,
      priceLines.priceLabel,
    );
    return {
      text: `${business.name}: Reminder — ${booking.service?.name ?? 'appointment'} in ${label} (${schedule}).`,
    };
  }

  private resolveReviewEmailRecipient(
    customerEmail?: string | null,
  ): string | null {
    const override = this.configService
      .get<string>('REVIEW_REQUEST_EMAIL_OVERRIDE')
      ?.trim();
    if (override) return override;
    const email = customerEmail?.trim();
    return email || null;
  }

  private buildReviewUrl(
    businessSlug: string,
    bookingId: string,
    token: string,
  ): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl}/book/${businessSlug}/review?bookingId=${bookingId}&token=${token}`;
  }

  private reviewUrlWithRating(reviewUrl: string, rating: number): string {
    const url = new URL(reviewUrl);
    url.searchParams.set('rating', String(rating));
    return url.toString();
  }

  private businessLocale(settings?: Record<string, unknown>): AppLocale {
    const raw = settings?.locale;
    return resolveLocale(typeof raw === 'string' ? raw : null);
  }

  private reminderLabel(locale: AppLocale, minutesBefore: number): string {
    if (minutesBefore >= 60) {
      return t(locale, 'email.reminderHours', {
        count: Math.round(minutesBefore / 60),
      });
    }
    return t(locale, 'email.reminderMinutes', { count: minutesBefore });
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

  private buildReviewRequestEmail(
    ctx: BookingNotificationContext,
    reviewUrl: string,
  ) {
    const { booking, business } = ctx;
    const locale = this.businessLocale(business.settings);
    const customerName =
      booking.customer?.name ?? t(locale, 'email.defaultCustomerName');
    const providerName =
      booking.employee?.name ?? t(locale, 'email.defaultProviderName');
    const starLinks = this.buildStarRatingLinks(reviewUrl);

    return renderBusinessEmailTemplate(
      ctx.business.settings,
      'review_request',
      {
        customerName,
        businessName: business.name,
        providerName,
        reviewUrl,
        starRatingHtml: `<p style="text-align:center;font-size:15px;color:#374151;margin:8px 0 4px;">Tap a star to rate your visit</p><div style="text-align:center;margin:16px 0 24px;">${starLinks}</div><p style="text-align:center;font-size:14px;"><a href="${reviewUrl}" style="color:#7c3aed;">Leave a written review</a></p>`,
      },
    );
  }

  private buildReviewRequestSms(
    ctx: BookingNotificationContext,
    reviewUrl: string,
  ) {
    const { business } = ctx;
    return {
      text: `${business.name}: Thanks for visiting! Leave a review: ${reviewUrl}`,
    };
  }

  private buildClinicResultReadyEmail(
    businessName: string,
    customerName: string | null | undefined,
    testName: string,
    whenLabel: string,
    accountLine: string,
    locale: AppLocale,
  ) {
    const name = customerName?.trim() || t(locale, 'email.defaultCustomerName');
    const text = t(locale, 'email.clinicResultReadyBody', {
      customerName: name,
      testName,
      whenLabel,
      accountLine,
    });
    return {
      subject: t(locale, 'email.clinicResultReadySubject', { businessName }),
      text,
      html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
    };
  }

  private buildClinicResultReadySms(
    businessName: string,
    testName: string,
    whenLabel: string,
    accountLine: string,
    locale: AppLocale,
  ) {
    return {
      text: t(locale, 'email.clinicResultReadySms', {
        businessName,
        testName,
        whenLabel,
        accountLine,
      }).trim(),
    };
  }

  private async dispatchResultReady(
    logBookingId: string,
    businessId: string,
    _ctx: BookingNotificationContext | null,
    kind: NotificationKind,
    channel: NotificationChannel,
    recipient: string,
    build: () => { subject?: string; html?: string; text: string } | null,
  ): Promise<boolean> {
    const existing = await this.logRepo.findOne({
      where: {
        bookingId: logBookingId,
        kind,
        channel,
      },
    });
    if (existing) return false;

    const content = build();
    if (!content) return false;
    let ok = false;
    let error: string | undefined;

    if (channel === 'email') {
      const result = await this.emailService.send({
        to: recipient,
        subject: content.subject || 'Test results ready',
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
        businessId,
        bookingId: logBookingId,
        channel,
        kind,
        recipient,
        status: ok ? 'sent' : 'failed',
        error: error ?? null,
      }),
    );

    if (!ok) {
      this.logger.warn(
        `Failed ${kind} ${channel} for clinic result booking ${logBookingId}: ${error}`,
      );
    }

    return ok;
  }

  private async dispatchLabBookingRequestWhatsApp(input: {
    orderId: string;
    businessId: string;
    business: Business;
    customerName: string;
    collectionServiceName: string;
    testNames: string;
    phone: string;
    locale: AppLocale;
  }): Promise<boolean> {
    const existing = await this.logRepo.findOne({
      where: {
        bookingId: input.orderId,
        kind: 'lab_booking_request',
        channel: 'whatsapp',
      },
    });
    if (existing) return false;

    const config = this.whatsappIntegrationService.resolveRuntimeConfig(
      input.business.settings,
    );
    if (!config) {
      this.logger.warn(
        `WhatsApp not configured for business ${input.businessId}`,
      );
      return false;
    }

    const reminderLabel = t(
      input.locale,
      'email.clinicLabBookingRequestWhatsapp',
      {
        collectionServiceName: input.collectionServiceName,
        testNames: input.testNames,
      },
    );

    const result = await this.whatsappService.sendBookingMessage(
      {
        kind: 'lab_booking_request',
        toPhone: input.phone,
        customerName: input.customerName,
        businessName: input.business.name,
        serviceName: input.collectionServiceName,
        providerName: t(input.locale, 'email.defaultProviderName'),
        dateLabel: '—',
        timeLabel: '—',
        reminderLabel,
      },
      config,
    );

    await this.logRepo.save(
      this.logRepo.create({
        businessId: input.businessId,
        bookingId: input.orderId,
        channel: 'whatsapp',
        kind: 'lab_booking_request',
        recipient: input.phone,
        status: result.ok ? 'sent' : 'failed',
        error: result.error ?? null,
      }),
    );

    if (!result.ok) {
      this.logger.warn(
        `Failed lab_booking_request whatsapp for order ${input.orderId}: ${result.error}`,
      );
    }

    return result.ok;
  }

  private async dispatchResultReadyWhatsApp(
    ctx: BookingNotificationContext,
    kind: NotificationKind,
    phone: string,
    whenLabel: string,
    testName: string,
    locale: AppLocale,
  ): Promise<boolean> {
    const existing = await this.logRepo.findOne({
      where: {
        bookingId: ctx.booking.id,
        kind,
        channel: 'whatsapp',
      },
    });
    if (existing) return false;

    const config = this.whatsappIntegrationService.resolveRuntimeConfig(
      ctx.business.settings,
    );
    if (!config) {
      this.logger.warn(
        `WhatsApp not configured for business ${ctx.business.id}`,
      );
      return false;
    }

    const { booking, business } = ctx;
    const dateLabel = formatNotificationDateDisplay(
      booking.startTime,
      business.settings,
      locale,
    );
    const timeLabel = formatNotificationTimeRangeDisplay(
      booking.startTime,
      booking.endTime,
      business.settings,
      locale,
    );
    const reminderLabel = t(locale, 'email.clinicResultReadyWhatsappLabel', {
      whenLabel,
    });

    const result = await this.whatsappService.sendBookingMessage(
      {
        kind,
        toPhone: phone,
        customerName:
          booking.customer?.name ?? t(locale, 'email.defaultCustomerName'),
        businessName: business.name,
        serviceName: testName,
        providerName:
          booking.employee?.name ?? t(locale, 'email.defaultProviderName'),
        dateLabel,
        timeLabel,
        reminderLabel,
      },
      config,
    );

    await this.logRepo.save(
      this.logRepo.create({
        businessId: booking.businessId,
        bookingId: booking.id,
        channel: 'whatsapp',
        kind,
        recipient: phone,
        status: result.ok ? 'sent' : 'failed',
        error: result.error ?? null,
      }),
    );

    if (!result.ok) {
      this.logger.warn(
        `Failed ${kind} whatsapp for booking ${booking.id}: ${result.error}`,
      );
    }

    return result.ok;
  }

  async sendGiftCardReceivedPush(
    card: GiftCard,
    customerId: string,
  ): Promise<void> {
    const business = card.business;
    if (!business?.slug?.trim()) return;

    const businessSettings = mergeBusinessNotificationSettings(
      business.settings?.notifications,
    );
    if (!businessSettings.sendGiftCardReceivedPush) return;

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId: business.id },
    });
    if (!customer) return;

    const prefs = getCustomerNotificationPreferences(customer.metadata);
    if (!shouldSendConsumerPush(prefs, 'offers')) return;

    const locale = this.businessLocale(business.settings);
    const payload = buildConsumerGiftCardReceivedPushPayload({
      url: buildConsumerGiftCardPushUrl(business.slug),
      businessId: business.id,
      customerId,
      giftCardId: card.id,
      businessName: business.name,
      senderName: resolveGiftCardSenderName(card),
      locale,
    });
    await this.consumerPushDispatch.sendTransactionalPush(payload);
  }

  private buildBookingScheduleLabel(
    ctx: BookingNotificationContext,
    locale: AppLocale,
  ): string {
    return this.formatBookingScheduleFromStart(
      ctx.booking.startTime,
      ctx.booking.endTime,
      ctx.business.settings,
      locale,
    );
  }

  private formatBookingScheduleFromStart(
    startTime: Date,
    endTime: Date,
    businessSettings: Business['settings'],
    locale: AppLocale,
  ): string {
    const when = formatNotificationDateDisplay(
      startTime,
      businessSettings,
      locale,
    );
    const time = formatNotificationTimeRangeDisplay(
      startTime,
      endTime,
      businessSettings,
      locale,
    );
    return `${when} at ${time}`;
  }

  private async resolveConsumerBookingPushUrl(
    ctx: BookingNotificationContext,
  ): Promise<string> {
    const { booking, business } = ctx;
    const selfService = resolveCustomerSelfServiceSettings(business.settings);
    if (canCustomerManageBookingOnline(booking, selfService)) {
      const token = await ensureBookingManageToken(this.bookingRepo, booking.id);
      return buildConsumerBookingManagePushUrl(
        business.slug,
        booking.id,
        token,
      );
    }
    return buildConsumerSalonHomePushUrl(business.slug);
  }

  private async trySendConsumerSalonBookingPush(
    ctx: BookingNotificationContext,
    buildPayload: (
      url: string,
      locale: AppLocale,
    ) => ConsumerSalonBookingPushPayload,
  ): Promise<boolean> {
    const customer = ctx.booking.customer;
    if (!customer) return false;

    const locale = this.businessLocale(ctx.business.settings);
    const url = await this.resolveConsumerBookingPushUrl(ctx);
    const payload = buildPayload(url, locale);
    const result = await this.consumerPushDispatch.sendTransactionalPush(payload);
    return result.ok;
  }
}
