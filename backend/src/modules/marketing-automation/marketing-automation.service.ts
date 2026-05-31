import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { EmailService } from '../notifications/email.service.js';
import { SmsService } from '../notifications/sms.service.js';
import { mergeBusinessNotificationSettings } from '../notifications/notification.types.js';
import { getCustomerGdpr } from '../customer/customer-privacy.types.js';
import { MarketingAutomationLog } from './entities/marketing-automation-log.entity.js';
import {
  DEFAULT_MARKETING_AUTOMATION_SETTINGS,
  mergeMarketingAutomationSettings,
  type MarketingAutomationSettings,
} from './marketing-automation.types.js';
import { UpdateMarketingAutomationSettingsDto } from './dto/update-marketing-automation-settings.dto.js';

export interface ReEngagementCandidate {
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  lastCompletedAt: string | null;
}

@Injectable()
export class MarketingAutomationService {
  private readonly logger = new Logger(MarketingAutomationService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(MarketingAutomationLog) private logRepo: Repository<MarketingAutomationLog>,
    private emailService: EmailService,
    private smsService: SmsService,
    private configService: ConfigService,
  ) {}

  async getSettings(businessId: string): Promise<MarketingAutomationSettings> {
    const business = await this.findBusiness(businessId);
    return mergeMarketingAutomationSettings(business.settings?.marketingAutomation);
  }

  async updateSettings(
    businessId: string,
    dto: UpdateMarketingAutomationSettingsDto,
  ): Promise<MarketingAutomationSettings> {
    const business = await this.findBusiness(businessId);
    const current = mergeMarketingAutomationSettings(business.settings?.marketingAutomation);
    const next: MarketingAutomationSettings = mergeMarketingAutomationSettings({
      ...current,
      ...dto,
      reEngagementPromoCode:
        dto.reEngagementPromoCode === null
          ? null
          : dto.reEngagementPromoCode?.trim() || current.reEngagementPromoCode,
    });
    business.settings = {
      ...(business.settings ?? {}),
      marketingAutomation: next,
    };
    await this.businessRepo.save(business);
    return next;
  }

  isPostVisitReviewEnabled(businessSettings?: Record<string, unknown>): boolean {
    const raw = businessSettings?.marketingAutomation;
    return mergeMarketingAutomationSettings(
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : undefined,
    ).postVisitReviewEnabled;
  }

  async getSummary(businessId: string) {
    const settings = await this.getSettings(businessId);
    const candidates = await this.findReEngagementCandidates(businessId, settings);
    const sentLast30Days = await this.logRepo.count({
      where: {
        businessId,
        kind: 're_engagement',
        sentAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      },
    });
    return {
      settings,
      eligibleInactiveCustomers: candidates.length,
      reEngagementSentLast30Days: sentLast30Days,
    };
  }

  async processAllBusinesses(): Promise<number> {
    const businesses = await this.businessRepo.find({ where: { isActive: true } });
    let sent = 0;
    for (const business of businesses) {
      sent += await this.processBusinessReEngagement(business.id);
    }
    return sent;
  }

  async processBusinessReEngagement(businessId: string): Promise<number> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business?.isActive) return 0;

    const settings = mergeMarketingAutomationSettings(business.settings?.marketingAutomation);
    if (!settings.reEngagementEnabled) return 0;

    const notificationSettings = mergeBusinessNotificationSettings(business.settings?.notifications);
    const candidates = await this.findReEngagementCandidates(businessId, settings);
    let sent = 0;

    for (const candidate of candidates) {
      const ok = await this.sendReEngagement(business, candidate, settings, notificationSettings);
      if (ok) sent++;
    }

    return sent;
  }

  async findReEngagementCandidates(
    businessId: string,
    settings: MarketingAutomationSettings = DEFAULT_MARKETING_AUTOMATION_SETTINGS,
  ): Promise<ReEngagementCandidate[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - settings.inactiveDaysThreshold);

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
        .andWhere('booking.customerId = :customerId', { customerId: customer.id })
        .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
        .getRawOne<{ lastEnd: Date | null }>();

      const lastEnd = lastCompleted?.lastEnd ? new Date(lastCompleted.lastEnd) : null;
      if (!lastEnd || lastEnd >= thresholdDate) continue;

      const recentSend = await this.logRepo.findOne({
        where: { businessId, customerId: customer.id, kind: 're_engagement' },
        order: { sentAt: 'DESC' },
      });
      if (recentSend) {
        const minGapMs = settings.minDaysBetweenReEngagement * 24 * 60 * 60 * 1000;
        if (Date.now() - recentSend.sentAt.getTime() < minGapMs) continue;
      }

      eligible.push({
        customerId: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        lastCompletedAt: lastEnd.toISOString(),
      });
    }

    return eligible;
  }

  private async sendReEngagement(
    business: Business,
    candidate: ReEngagementCandidate,
    settings: MarketingAutomationSettings,
    notificationSettings: ReturnType<typeof mergeBusinessNotificationSettings>,
  ): Promise<boolean> {
    const bookingUrl = this.buildBookingUrl(business.slug);
    const promoLine = settings.reEngagementPromoCode
      ? ` Use code ${settings.reEngagementPromoCode} when you book.`
      : '';
    const text = `Hi ${candidate.name}, we miss you at ${business.name}! Book your next visit: ${bookingUrl}.${promoLine}`;
    let sentAny = false;

    if (settings.reEngagementEmailEnabled && notificationSettings.emailEnabled && candidate.email) {
      const ok = await this.dispatchCustomerMessage(
        business.id,
        candidate.customerId,
        're_engagement',
        'email',
        candidate.email,
        () => ({
          subject: `We'd love to see you again — ${business.name}`,
          html: `<p>${text}</p><p><a href="${bookingUrl}">Book online</a></p>`,
          text,
        }),
      );
      if (ok) sentAny = true;
    }

    if (settings.reEngagementSmsEnabled && notificationSettings.smsEnabled && candidate.phone) {
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

    return sentAny;
  }

  private async dispatchCustomerMessage(
    businessId: string,
    customerId: string,
    kind: 're_engagement',
    channel: 'email' | 'sms',
    recipient: string,
    build: () => { subject?: string; html?: string; text: string },
  ): Promise<boolean> {
    const content = build();
    let ok = false;
    let error: string | undefined;

    if (channel === 'email') {
      const result = await this.emailService.send({
        to: recipient,
        subject: content.subject || 'Message from your service provider',
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
        customerId,
        kind,
        channel,
        recipient,
        status: ok ? 'sent' : 'failed',
        error: error ?? null,
      }),
    );

    if (!ok) {
      this.logger.warn(`Failed ${kind} ${channel} for customer ${customerId}: ${error}`);
    }

    return ok;
  }

  private buildBookingUrl(slug: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendUrl.replace(/\/$/, '')}/book/${slug}`;
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
