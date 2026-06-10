import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, MoreThanOrEqual, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { EmailService } from '../notifications/email.service.js';
import { SmsService } from '../notifications/sms.service.js';
import {
  getCustomerNotificationPreferences,
  mergeBusinessNotificationSettings,
} from '../notifications/notification.types.js';
import { shouldSendConsumerPush } from '../notifications/consumer-notification-preferences.util.js';
import { getCustomerGdpr } from '../customer/customer-privacy.types.js';
import { ConsumerPushDispatchService } from '../notifications/consumer-push-dispatch.service.js';
import {
  buildConsumerActivationConciergePushPayload,
  buildConsumerRebookingNudgePushPayload,
  buildConsumerWinBackPushPayload,
  type ConsumerTransactionalPushPayload,
} from '../notifications/consumer-transactional-push.util.js';
import {
  buildConsumerBookServicePushUrl,
  buildConsumerSalonHomePushUrl,
} from '../../common/utils/consumer-booking-push-link.util.js';
import { buildConsumerRebookPushUrl } from '../../common/utils/consumer-rebook.util.js';
import {
  buildWinBackIncentiveLines,
  resolveWinBackLoyaltyBonusPoints,
} from './marketing-win-back.util.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import {
  formatRebookingCadenceLabel,
  isRebookingNudgeDue,
  resolveServiceRebookingCadenceDays,
} from '../../common/utils/service-rebooking-cadence.util.js';
import {
  readCustomerServiceLearnedCadenceDays,
  resolveCustomerRebookingCadenceDays,
} from '../../common/utils/customer-rebooking-cadence.util.js';
import { CustomerRebookingCadenceService } from '../customer/customer-rebooking-cadence.service.js';
import { resolveLocale, t, type AppLocale } from '../../common/i18n/messages.js';
import { MarketingAutomationLog } from './entities/marketing-automation-log.entity.js';
import {
  DEFAULT_MARKETING_AUTOMATION_SETTINGS,
  mergeMarketingAutomationSettings,
  type MarketingAutomationKind,
  type MarketingAutomationChannel,
  type MarketingAutomationSettings,
} from './marketing-automation.types.js';
import { UpdateMarketingAutomationSettingsDto } from './dto/update-marketing-automation-settings.dto.js';
import { AppEvent } from '../analytics/entities/app-event.entity.js';
import {
  type AppEventAnalyticsRow,
} from '../../common/utils/app-adoption-analytics.util.js';
import {
  readCustomerAnalyticsAnonId,
} from '../../common/utils/customer-analytics-anon.util.js';
import {
  buildActivationConciergeResumePushUrl,
  buildActivationConciergeResumeWebUrl,
  listActivationConciergeCandidateInputs,
  type ActivationConciergeMilestone,
  type ActivationConciergeResumeTarget,
} from '../../common/utils/n99-activation-concierge.util.js';
import { Service } from '../service/entities/service.entity.js';

export interface ReEngagementCandidate {
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  customerMetadata?: Record<string, unknown> | null;
  lastCompletedAt: string | null;
}

export interface ActivationConciergeCandidate {
  anonId: string;
  customerId: string;
  name: string;
  email: string | null;
  customerMetadata?: Record<string, unknown> | null;
  milestone: ActivationConciergeMilestone;
  resume: ActivationConciergeResumeTarget | null;
}

export interface RebookingNudgeCandidate {
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  customerMetadata?: Record<string, unknown> | null;
  serviceId: string;
  serviceName: string;
  cadenceDays: number;
  lastCompletedAt: string;
  lastBookingId?: string;
  lastStartTime?: string;
  employeeId?: string | null;
}

@Injectable()
export class MarketingAutomationService {
  private readonly logger = new Logger(MarketingAutomationService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(MarketingAutomationLog)
    private logRepo: Repository<MarketingAutomationLog>,
    @InjectRepository(AppEvent)
    private appEventRepo: Repository<AppEvent>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    private emailService: EmailService,
    private smsService: SmsService,
    private configService: ConfigService,
    private consumerPushDispatch: ConsumerPushDispatchService,
    private loyaltyService: LoyaltyService,
    private customerRebookingCadenceService: CustomerRebookingCadenceService,
  ) {}

  async getSettings(businessId: string): Promise<MarketingAutomationSettings> {
    const business = await this.findBusiness(businessId);
    return mergeMarketingAutomationSettings(
      business.settings?.marketingAutomation,
    );
  }

  async updateSettings(
    businessId: string,
    dto: UpdateMarketingAutomationSettingsDto,
  ): Promise<MarketingAutomationSettings> {
    const business = await this.findBusiness(businessId);
    const current = mergeMarketingAutomationSettings(
      business.settings?.marketingAutomation,
    );
    const next: MarketingAutomationSettings = mergeMarketingAutomationSettings({
      ...current,
      ...dto,
      reEngagementPromoCode:
        dto.reEngagementPromoCode === null
          ? null
          : dto.reEngagementPromoCode?.trim() || current.reEngagementPromoCode,
      rebookingNudgePromoCode:
        dto.rebookingNudgePromoCode === null
          ? null
          : dto.rebookingNudgePromoCode?.trim() ||
            current.rebookingNudgePromoCode,
      reEngagementLoyaltyBonusPoints:
        dto.reEngagementLoyaltyBonusPoints === null
          ? null
          : dto.reEngagementLoyaltyBonusPoints ??
            current.reEngagementLoyaltyBonusPoints,
    });
    business.settings = {
      ...(business.settings ?? {}),
      marketingAutomation: next,
    };
    await this.businessRepo.save(business);
    return next;
  }

  isPostVisitReviewEnabled(
    businessSettings?: Record<string, unknown>,
  ): boolean {
    const raw = businessSettings?.marketingAutomation;
    return mergeMarketingAutomationSettings(
      raw && typeof raw === 'object'
        ? (raw as Record<string, unknown>)
        : undefined,
    ).postVisitReviewEnabled;
  }

  async getSummary(businessId: string) {
    const settings = await this.getSettings(businessId);
    const candidates = await this.findReEngagementCandidates(
      businessId,
      settings,
    );
    const sentLast30Days = await this.logRepo.count({
      where: {
        businessId,
        kind: 're_engagement',
        sentAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      },
    });
    const rebookingCandidates = await this.findRebookingNudgeCandidates(
      businessId,
      settings,
    );
    const rebookingSentLast30Days = await this.logRepo.count({
      where: {
        businessId,
        kind: 'rebooking_nudge',
        sentAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      },
    });
    return {
      settings,
      eligibleInactiveCustomers: candidates.length,
      reEngagementSentLast30Days: sentLast30Days,
      eligibleRebookingNudges: rebookingCandidates.length,
      rebookingNudgeSentLast30Days: rebookingSentLast30Days,
    };
  }

  async processAllBusinesses(): Promise<number> {
    const businesses = await this.businessRepo.find({
      where: { isActive: true },
    });
    let sent = 0;
    for (const business of businesses) {
      sent += await this.processBusinessReEngagement(business.id);
    }
    return sent;
  }

  async processBusinessReEngagement(businessId: string): Promise<number> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business?.isActive) return 0;

    const settings = mergeMarketingAutomationSettings(
      business.settings?.marketingAutomation,
    );
    if (!settings.reEngagementEnabled) return 0;

    const notificationSettings = mergeBusinessNotificationSettings(
      business.settings?.notifications,
    );
    const candidates = await this.findReEngagementCandidates(
      businessId,
      settings,
    );
    let sent = 0;

    for (const candidate of candidates) {
      const ok = await this.sendReEngagement(
        business,
        candidate,
        settings,
        notificationSettings,
      );
      if (ok) sent++;
    }

    return sent;
  }

  async processAllActivationConciergeNudges(): Promise<number> {
    const businesses = await this.businessRepo.find({
      where: { isActive: true },
    });
    let sent = 0;
    for (const business of businesses) {
      sent += await this.processBusinessActivationConcierge(business.id);
    }
    return sent;
  }

  async processBusinessActivationConcierge(businessId: string): Promise<number> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business?.isActive) return 0;

    const settings = mergeMarketingAutomationSettings(
      business.settings?.marketingAutomation,
    );
    if (!settings.activationConciergeEnabled) return 0;

    const notificationSettings = mergeBusinessNotificationSettings(
      business.settings?.notifications,
    );
    const candidates = await this.findActivationConciergeCandidates(
      businessId,
      settings,
    );
    let sent = 0;

    for (const candidate of candidates) {
      const ok = await this.sendActivationConciergeNudge(
        business,
        candidate,
        settings,
        notificationSettings,
      );
      if (ok) sent++;
    }

    return sent;
  }

  async findActivationConciergeCandidates(
    businessId: string,
    settings: MarketingAutomationSettings = DEFAULT_MARKETING_AUTOMATION_SETTINGS,
  ): Promise<ActivationConciergeCandidate[]> {
    if (!settings.activationConciergeEnabled) return [];

    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const entities = await this.appEventRepo.find({
      where: { businessId, createdAt: MoreThanOrEqual(cutoff) },
      order: { createdAt: 'ASC' },
    });
    const rows: AppEventAnalyticsRow[] = entities.map((entity) => ({
      anonId: entity.anonId,
      event: entity.event,
      platform: entity.platform,
      appSurface: entity.appSurface,
      locale: entity.locale,
      tenantSlug: entity.tenantSlug,
      createdAt: entity.createdAt,
      props: entity.props,
    }));

    const sentByAnon = await this.buildActivationConciergeSentByAnon(businessId);
    const inputs = listActivationConciergeCandidateInputs(
      rows,
      new Date(),
      sentByAnon,
    );
    const eligible: ActivationConciergeCandidate[] = [];

    for (const input of inputs) {
      const customer = await this.findCustomerByAnalyticsAnonId(
        businessId,
        input.anonId,
      );
      if (!customer) continue;

      eligible.push({
        anonId: input.anonId,
        customerId: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        customerMetadata: customer.metadata,
        milestone: input.milestone,
        resume: input.resume,
      });
    }

    return eligible;
  }

  async processAllRebookingNudges(): Promise<number> {
    const businesses = await this.businessRepo.find({
      where: { isActive: true },
    });
    let sent = 0;
    for (const business of businesses) {
      sent += await this.processBusinessRebookingNudges(business.id);
    }
    return sent;
  }

  async processBusinessRebookingNudges(businessId: string): Promise<number> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business?.isActive) return 0;

    const settings = mergeMarketingAutomationSettings(
      business.settings?.marketingAutomation,
    );
    if (!settings.rebookingNudgeEnabled) return 0;

    const notificationSettings = mergeBusinessNotificationSettings(
      business.settings?.notifications,
    );
    const candidates = await this.findRebookingNudgeCandidates(
      businessId,
      settings,
    );
    let sent = 0;

    for (const candidate of candidates) {
      const ok = await this.sendRebookingNudge(
        business,
        candidate,
        settings,
        notificationSettings,
      );
      if (ok) sent++;
    }

    return sent;
  }

  async findRebookingNudgeCandidates(
    businessId: string,
    settings: MarketingAutomationSettings = DEFAULT_MARKETING_AUTOMATION_SETTINGS,
  ): Promise<RebookingNudgeCandidate[]> {
    const now = new Date();
    const rows = await this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.customer', 'customer')
      .innerJoin('booking.service', 'service')
      .select('booking.customerId', 'customerId')
      .addSelect('customer.name', 'customerName')
      .addSelect('customer.email', 'customerEmail')
      .addSelect('customer.phone', 'customerPhone')
      .addSelect('customer.metadata', 'customerMetadata')
      .addSelect('booking.serviceId', 'serviceId')
      .addSelect('service.name', 'serviceName')
      .addSelect('service.metadata', 'serviceMetadata')
      .addSelect('MAX(booking.endTime)', 'lastEnd')
      .where('booking.businessId = :businessId', { businessId })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('customer.isActive = true')
      .andWhere('service.isActive = true')
      .groupBy('booking.customerId')
      .addGroupBy('customer.name')
      .addGroupBy('customer.email')
      .addGroupBy('customer.phone')
      .addGroupBy('customer.metadata')
      .addGroupBy('booking.serviceId')
      .addGroupBy('service.name')
      .addGroupBy('service.metadata')
      .getRawMany<{
        customerId: string;
        customerName: string;
        customerEmail: string | null;
        customerPhone: string | null;
        customerMetadata: Record<string, unknown> | null;
        serviceId: string;
        serviceName: string;
        serviceMetadata: Record<string, unknown> | null;
        lastEnd: Date | string;
      }>();

    const eligible: RebookingNudgeCandidate[] = [];

    for (const row of rows) {
      const persistedCadence = readCustomerServiceLearnedCadenceDays(
        row.customerMetadata,
        row.serviceId,
      );
      const learnedCadence =
        persistedCadence ??
        (await this.customerRebookingCadenceService.computeLearnedCadenceDays(
          businessId,
          row.customerId,
          row.serviceId,
        ));
      const cadenceDays = resolveCustomerRebookingCadenceDays({
        service: { metadata: row.serviceMetadata },
        settings,
        customerMetadata: row.customerMetadata,
        serviceId: row.serviceId,
        learnedFromHistory: learnedCadence,
      });
      if (cadenceDays == null) continue;

      const lastEnd = new Date(row.lastEnd);
      if (!isRebookingNudgeDue(lastEnd, cadenceDays, now)) continue;

      const gdpr = getCustomerGdpr(row.customerMetadata ?? undefined);
      if (!gdpr.marketingOptIn) continue;

      const upcoming = await this.bookingRepo.exists({
        where: {
          businessId,
          customerId: row.customerId,
          serviceId: row.serviceId,
          status: In([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
          startTime: MoreThan(now),
        },
      });
      if (upcoming) continue;

      const recentSend = await this.logRepo.findOne({
        where: {
          businessId,
          customerId: row.customerId,
          serviceId: row.serviceId,
          kind: 'rebooking_nudge',
        },
        order: { sentAt: 'DESC' },
      });
      if (recentSend) {
        const minGapMs =
          settings.minDaysBetweenRebookingNudges * 24 * 60 * 60 * 1000;
        if (Date.now() - recentSend.sentAt.getTime() < minGapMs) continue;
      }

      const lastBooking = await this.bookingRepo.findOne({
        where: {
          businessId,
          customerId: row.customerId,
          serviceId: row.serviceId,
          status: BookingStatus.COMPLETED,
        },
        order: { endTime: 'DESC' },
        select: { id: true, startTime: true, employeeId: true },
      });

      eligible.push({
        customerId: row.customerId,
        name: row.customerName,
        email: row.customerEmail ?? null,
        phone: row.customerPhone ?? null,
        customerMetadata: row.customerMetadata,
        serviceId: row.serviceId,
        serviceName: row.serviceName,
        cadenceDays,
        lastCompletedAt: lastEnd.toISOString(),
        lastBookingId: lastBooking?.id,
        lastStartTime: lastBooking?.startTime?.toISOString(),
        employeeId: lastBooking?.employeeId ?? null,
      });
    }

    return eligible;
  }

  async findReEngagementCandidates(
    businessId: string,
    settings: MarketingAutomationSettings = DEFAULT_MARKETING_AUTOMATION_SETTINGS,
  ): Promise<ReEngagementCandidate[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(
      thresholdDate.getDate() - settings.inactiveDaysThreshold,
    );
    const now = new Date();

    const customers = await this.customerRepo.find({
      where: { businessId, isActive: true },
    });

    const eligible: ReEngagementCandidate[] = [];
    for (const customer of customers) {
      const gdpr = getCustomerGdpr(customer.metadata);
      if (!gdpr.marketingOptIn) continue;

      const lastCompleted = await this.bookingRepo
        .createQueryBuilder('booking')
        .select('MAX(booking.endTime)', 'lastEnd')
        .where('booking.businessId = :businessId', { businessId })
        .andWhere('booking.customerId = :customerId', {
          customerId: customer.id,
        })
        .andWhere('booking.status = :status', {
          status: BookingStatus.COMPLETED,
        })
        .getRawOne<{ lastEnd: Date | null }>();

      const lastEnd = lastCompleted?.lastEnd
        ? new Date(lastCompleted.lastEnd)
        : null;
      if (!lastEnd || lastEnd >= thresholdDate) continue;

      const upcoming = await this.bookingRepo.exists({
        where: {
          businessId,
          customerId: customer.id,
          status: In([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
          startTime: MoreThan(now),
        },
      });
      if (upcoming) continue;

      const recentSend = await this.logRepo.findOne({
        where: { businessId, customerId: customer.id, kind: 're_engagement' },
        order: { sentAt: 'DESC' },
      });
      if (recentSend) {
        const minGapMs =
          settings.minDaysBetweenReEngagement * 24 * 60 * 60 * 1000;
        if (Date.now() - recentSend.sentAt.getTime() < minGapMs) continue;
      }

      eligible.push({
        customerId: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        customerMetadata: customer.metadata,
        lastCompletedAt: lastEnd.toISOString(),
      });
    }

    return eligible;
  }

  private async sendActivationConciergeNudge(
    business: Business,
    candidate: ActivationConciergeCandidate,
    settings: MarketingAutomationSettings,
    notificationSettings: ReturnType<typeof mergeBusinessNotificationSettings>,
  ): Promise<boolean> {
    const locale = this.businessLocale(business.settings);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resume = candidate.resume;
    const serviceName = resume?.serviceId
      ? (
          await this.serviceRepo.findOne({
            where: { id: resume.serviceId, businessId: business.id },
            select: { name: true },
          })
        )?.name?.trim() || t(locale, 'email.defaultServiceName')
      : t(locale, 'email.defaultServiceName');

    const bookUrl = resume?.serviceId
      ? buildActivationConciergeResumeWebUrl({
          frontendBaseUrl: frontendUrl,
          slug: business.slug,
          serviceId: resume.serviceId,
          date: resume.date,
          slot: resume.slot,
          employeeId: resume.employeeId,
        })
      : this.buildBookingUrl(business.slug);
    const pushUrl = resume?.serviceId
      ? buildActivationConciergeResumePushUrl({
          slug: business.slug,
          serviceId: resume.serviceId,
          date: resume.date,
          slot: resume.slot,
          employeeId: resume.employeeId,
        })
      : buildConsumerSalonHomePushUrl(business.slug);

    const text =
      candidate.milestone === '24h'
        ? t(locale, 'email.activationConcierge24hMessage', {
            customerName: candidate.name,
            businessName: business.name,
            serviceName,
            bookUrl,
          })
        : t(locale, 'email.activationConcierge72hMessage', {
            customerName: candidate.name,
            businessName: business.name,
            serviceName,
            bookUrl,
          });
    const subject =
      candidate.milestone === '24h'
        ? t(locale, 'email.activationConcierge24hEmailSubject', {
            businessName: business.name,
            serviceName,
          })
        : t(locale, 'email.activationConcierge72hEmailSubject', {
            businessName: business.name,
            serviceName,
          });
    let sentAny = false;

    if (
      settings.activationConciergeEmailEnabled &&
      notificationSettings.emailEnabled &&
      candidate.email
    ) {
      const ok = await this.dispatchCustomerMessage(
        business.id,
        candidate.customerId,
        'activation_concierge',
        'email',
        candidate.milestone,
        () => ({
          subject,
          html: `<p>${text}</p><p><a href="${bookUrl}">Continue booking</a></p>`,
          text,
        }),
        resume?.serviceId ?? null,
        candidate.email,
      );
      if (ok) sentAny = true;
    }

    if (settings.activationConciergePushEnabled) {
      const customerPrefs = getCustomerNotificationPreferences(
        candidate.customerMetadata ?? undefined,
      );
      if (shouldSendConsumerPush(customerPrefs, 'reminders')) {
        const ok = await this.dispatchCustomerMessage(
          business.id,
          candidate.customerId,
          'activation_concierge',
          'push',
          candidate.milestone,
          () =>
            buildConsumerActivationConciergePushPayload({
              url: pushUrl,
              businessId: business.id,
              customerId: candidate.customerId,
              businessName: business.name,
              serviceName,
              milestone: candidate.milestone,
              serviceId: resume?.serviceId,
              locale,
            }),
          resume?.serviceId ?? null,
        );
        if (ok) sentAny = true;
      }
    }

    return sentAny;
  }

  private async buildActivationConciergeSentByAnon(
    businessId: string,
  ): Promise<Record<string, ReadonlySet<ActivationConciergeMilestone>>> {
    const logs = await this.logRepo.find({
      where: { businessId, kind: 'activation_concierge', status: 'sent' },
    });
    if (logs.length === 0) return {};

    const customerIds = [...new Set(logs.map((log) => log.customerId))];
    const customers = await this.customerRepo.find({
      where: { businessId, id: In(customerIds) },
    });
    const anonByCustomerId = new Map(
      customers.map((customer) => [
        customer.id,
        readCustomerAnalyticsAnonId(customer.metadata),
      ]),
    );

    const sentByAnon: Record<string, Set<ActivationConciergeMilestone>> = {};
    for (const log of logs) {
      const milestone = log.recipient;
      if (milestone !== '24h' && milestone !== '72h') continue;
      const anonId = anonByCustomerId.get(log.customerId);
      if (!anonId) continue;
      if (!sentByAnon[anonId]) sentByAnon[anonId] = new Set();
      sentByAnon[anonId].add(milestone);
    }
    return sentByAnon;
  }

  private async findCustomerByAnalyticsAnonId(
    businessId: string,
    anonId: string,
  ): Promise<Customer | null> {
    return this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.business_id = :businessId', { businessId })
      .andWhere('customer.isActive = :isActive', { isActive: true })
      .andWhere("customer.metadata->>'appAnalyticsAnonId' = :anonId", { anonId })
      .getOne();
  }

  private async sendReEngagement(
    business: Business,
    candidate: ReEngagementCandidate,
    settings: MarketingAutomationSettings,
    notificationSettings: ReturnType<typeof mergeBusinessNotificationSettings>,
  ): Promise<boolean> {
    const locale = this.businessLocale(business.settings);
    const bookingUrl = this.buildBookingUrl(business.slug);
    const { promoLine, loyaltyLine } = buildWinBackIncentiveLines(settings, locale);
    const text = t(locale, 'email.winBackMessage', {
      customerName: candidate.name,
      businessName: business.name,
      bookUrl: bookingUrl,
      promoLine,
      loyaltyLine,
    });
    const subject = t(locale, 'email.winBackEmailSubject', {
      businessName: business.name,
    });
    let sentAny = false;

    if (
      settings.reEngagementEmailEnabled &&
      notificationSettings.emailEnabled &&
      candidate.email
    ) {
      const ok = await this.dispatchCustomerMessage(
        business.id,
        candidate.customerId,
        're_engagement',
        'email',
        candidate.email,
        () => ({
          subject,
          html: `<p>${text}</p><p><a href="${bookingUrl}">Book online</a></p>`,
          text,
        }),
      );
      if (ok) sentAny = true;
    }

    if (
      settings.reEngagementSmsEnabled &&
      notificationSettings.smsEnabled &&
      candidate.phone
    ) {
      const ok = await this.dispatchCustomerMessage(
        business.id,
        candidate.customerId,
        're_engagement',
        'sms',
        candidate.phone,
        () => ({ text }),
      );
      if (ok) sentAny = true;
    }

    if (settings.reEngagementPushEnabled) {
      const customerPrefs = getCustomerNotificationPreferences(
        candidate.customerMetadata ?? undefined,
      );
      if (shouldSendConsumerPush(customerPrefs, 'offers')) {
        const ok = await this.dispatchCustomerMessage(
          business.id,
          candidate.customerId,
          're_engagement',
          'push',
          candidate.customerId,
          () =>
            buildConsumerWinBackPushPayload({
              url: buildConsumerSalonHomePushUrl(business.slug),
              businessId: business.id,
              customerId: candidate.customerId,
              businessName: business.name,
              promoCode: settings.reEngagementPromoCode?.trim() || undefined,
              locale,
            }),
        );
        if (ok) sentAny = true;
      }
    }

    if (sentAny) {
      const bonusPoints = resolveWinBackLoyaltyBonusPoints(settings);
      if (bonusPoints > 0) {
        await this.loyaltyService.adjust(
          business.id,
          candidate.customerId,
          bonusPoints,
          'Win-back campaign bonus',
        );
      }
    }

    return sentAny;
  }

  private async sendRebookingNudge(
    business: Business,
    candidate: RebookingNudgeCandidate,
    settings: MarketingAutomationSettings,
    notificationSettings: ReturnType<typeof mergeBusinessNotificationSettings>,
  ): Promise<boolean> {
    const locale = this.businessLocale(business.settings);
    const bookUrl = this.buildServiceBookingUrl(business.slug, candidate.serviceId);
    const promoLine = settings.rebookingNudgePromoCode
      ? ` Use code ${settings.rebookingNudgePromoCode} when you book.`
      : '';
    const text = t(locale, 'email.rebookingNudgeMessage', {
      customerName: candidate.name,
      businessName: business.name,
      serviceName: candidate.serviceName,
      bookUrl,
      promoLine,
    });
    const subject = t(locale, 'email.rebookingNudgeEmailSubject', {
      businessName: business.name,
      serviceName: candidate.serviceName,
    });
    let sentAny = false;

    if (
      settings.rebookingNudgeEmailEnabled &&
      notificationSettings.emailEnabled &&
      candidate.email
    ) {
      const ok = await this.dispatchCustomerMessage(
        business.id,
        candidate.customerId,
        'rebooking_nudge',
        'email',
        candidate.email,
        () => ({
          subject,
          html: `<p>${text}</p><p><a href="${bookUrl}">Book online</a></p>`,
          text,
        }),
        candidate.serviceId,
      );
      if (ok) sentAny = true;
    }

    if (
      settings.rebookingNudgeSmsEnabled &&
      notificationSettings.smsEnabled &&
      candidate.phone
    ) {
      const ok = await this.dispatchCustomerMessage(
        business.id,
        candidate.customerId,
        'rebooking_nudge',
        'sms',
        candidate.phone,
        () => ({ text }),
        candidate.serviceId,
      );
      if (ok) sentAny = true;
    }

    if (settings.rebookingNudgePushEnabled) {
      const customerPrefs = getCustomerNotificationPreferences(
        candidate.customerMetadata ?? undefined,
      );
      if (!shouldSendConsumerPush(customerPrefs, 'offers')) {
        // skip push when customer disabled offers
      } else {
      const rebookUrl =
        candidate.lastBookingId && candidate.lastStartTime
          ? buildConsumerRebookPushUrl({
              slug: business.slug,
              serviceId: candidate.serviceId,
              bookingId: candidate.lastBookingId,
              startTime: candidate.lastStartTime,
              employeeId: candidate.employeeId,
            })
          : buildConsumerBookServicePushUrl(business.slug, candidate.serviceId);
      const ok = await this.dispatchCustomerMessage(
        business.id,
        candidate.customerId,
        'rebooking_nudge',
        'push',
        candidate.customerId,
        () =>
          buildConsumerRebookingNudgePushPayload({
            url: rebookUrl,
            businessId: business.id,
            customerId: candidate.customerId,
            serviceId: candidate.serviceId,
            businessName: business.name,
            serviceName: candidate.serviceName,
            cadenceLabel: formatRebookingCadenceLabel(candidate.cadenceDays),
            locale,
          }),
        candidate.serviceId,
      );
      if (ok) sentAny = true;
      }
    }

    return sentAny;
  }

  private async dispatchCustomerMessage(
    businessId: string,
    customerId: string,
    kind: MarketingAutomationKind,
    channel: MarketingAutomationChannel,
    recipient: string,
    build: () =>
      | { subject?: string; html?: string; text: string }
      | ConsumerTransactionalPushPayload,
    serviceId?: string | null,
    deliveryTarget?: string,
  ): Promise<boolean> {
    if (channel === 'push') {
      const payload = build() as ConsumerTransactionalPushPayload;
      const result =
        await this.consumerPushDispatch.sendTransactionalPush(payload);
      const ok = result.ok;
      await this.logRepo.save(
        this.logRepo.create({
          businessId,
          customerId,
          serviceId: serviceId ?? null,
          kind,
          channel,
          recipient,
          status: ok ? 'sent' : result.skipped ? 'skipped' : 'failed',
          error: result.reason ?? null,
        }),
      );
      if (!ok && !result.skipped) {
        this.logger.warn(
          `Failed ${kind} push for customer ${customerId}: ${result.reason}`,
        );
      }
      return ok;
    }

    const content = build() as { subject?: string; html?: string; text: string };
    let ok = false;
    let error: string | undefined;

    if (channel === 'email') {
      const result = await this.emailService.send({
        to: deliveryTarget ?? recipient,
        subject: content.subject || 'Message from your service provider',
        html: content.html || `<p>${content.text}</p>`,
        text: content.text,
      });
      ok = result.ok;
      error = result.error;
    } else {
      const result = await this.smsService.send(
        deliveryTarget ?? recipient,
        content.text,
      );
      ok = result.ok;
      error = result.error;
    }

    await this.logRepo.save(
      this.logRepo.create({
        businessId,
        customerId,
        serviceId: serviceId ?? null,
        kind,
        channel,
        recipient,
        status: ok ? 'sent' : 'failed',
        error: error ?? null,
      }),
    );

    if (!ok) {
      this.logger.warn(
        `Failed ${kind} ${channel} for customer ${customerId}: ${error}`,
      );
    }

    return ok;
  }

  private businessLocale(settings?: Business['settings']): AppLocale {
    return resolveLocale(settings?.locale as string | undefined);
  }

  private buildServiceBookingUrl(slug: string, serviceId: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl.replace(/\/$/, '')}/book/${slug}?serviceId=${encodeURIComponent(serviceId)}`;
  }

  private buildBookingUrl(slug: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl.replace(/\/$/, '')}/book/${slug}`;
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
