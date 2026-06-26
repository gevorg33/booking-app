import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildTenantPublicUrl } from '../../../common/utils/tenant-public-url.util.js';
import { Business } from '../../business/entities/business.entity.js';
import { Service } from '../../service/entities/service.entity.js';
import { UpdateDistributionIntegrationDto } from '../dto/update-distribution-integration.dto.js';
import {
  BusinessDistributionIntegrations,
  buildMessagingLinksForBusiness,
  getDistributionIntegrations,
  GoogleReserveFeed,
  MessagingDeepLinks,
} from './distribution-integration.types.js';

export interface DistributionIntegrationPublicView {
  googleReserve: {
    enabled: boolean;
    merchantId?: string;
    partnerNotes?: string;
  };
  metaBooking: {
    enabled: boolean;
    facebookPageId?: string;
    facebookPageUrl?: string;
    instagramUsername?: string;
    bookingButtonLabel?: string;
    bookingUrl: string;
  };
  messaging: MessagingDeepLinks & {
    telegramEnabled: boolean;
    whatsappBookingEnabled: boolean;
    telegramBotUsername?: string;
    whatsappBusinessPhone?: string;
  };
}

@Injectable()
export class DistributionIntegrationService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    private readonly config: ConfigService,
  ) {}

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  private rootDomain(): string | undefined {
    return this.config.get<string>('ROOT_DOMAIN');
  }

  private publicBookingUrl(slug: string): string {
    return buildTenantPublicUrl({
      slug,
      frontendUrl: this.frontendUrl(),
      rootDomain: this.rootDomain(),
    });
  }

  buildMessagingLinks(business: Business): MessagingDeepLinks {
    return buildMessagingLinksForBusiness(business, this.frontendUrl(), this.rootDomain());
  }

  async getPublicSettings(
    businessId: string,
  ): Promise<DistributionIntegrationPublicView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const dist = getDistributionIntegrations(business.settings);
    const links = this.buildMessagingLinks(business);
    const bookingUrl = this.publicBookingUrl(business.slug);

    return {
      googleReserve: {
        enabled: Boolean(dist.googleReserve?.enabled),
        merchantId: dist.googleReserve?.merchantId,
        partnerNotes: dist.googleReserve?.partnerNotes,
      },
      metaBooking: {
        enabled: Boolean(dist.metaBooking?.enabled),
        facebookPageId: dist.metaBooking?.facebookPageId,
        facebookPageUrl: dist.metaBooking?.facebookPageUrl,
        instagramUsername: dist.metaBooking?.instagramUsername,
        bookingButtonLabel:
          dist.metaBooking?.bookingButtonLabel || 'Book online',
        bookingUrl,
      },
      messaging: {
        ...links,
        telegramEnabled: Boolean(dist.messaging?.telegramEnabled),
        whatsappBookingEnabled: Boolean(dist.messaging?.whatsappBookingEnabled),
        telegramBotUsername: dist.messaging?.telegramBotUsername,
        whatsappBusinessPhone: dist.messaging?.whatsappBusinessPhone,
      },
    };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateDistributionIntegrationDto,
  ): Promise<DistributionIntegrationPublicView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = {
      ...((settings.integrations as Record<string, unknown>) || {}),
    };
    const dist: BusinessDistributionIntegrations = {
      ...getDistributionIntegrations(settings),
    };

    dist.googleReserve = {
      ...(dist.googleReserve || {}),
      ...(dto.googleReserveEnabled !== undefined
        ? { enabled: dto.googleReserveEnabled }
        : {}),
      ...(dto.googleMerchantId !== undefined
        ? { merchantId: dto.googleMerchantId.trim() || undefined }
        : {}),
      ...(dto.googlePartnerNotes !== undefined
        ? { partnerNotes: dto.googlePartnerNotes.trim() || undefined }
        : {}),
    };

    dist.metaBooking = {
      ...(dist.metaBooking || {}),
      ...(dto.metaBookingEnabled !== undefined
        ? { enabled: dto.metaBookingEnabled }
        : {}),
      ...(dto.facebookPageId !== undefined
        ? { facebookPageId: dto.facebookPageId.trim() || undefined }
        : {}),
      ...(dto.facebookPageUrl !== undefined
        ? { facebookPageUrl: dto.facebookPageUrl.trim() || undefined }
        : {}),
      ...(dto.instagramUsername !== undefined
        ? {
            instagramUsername:
              dto.instagramUsername.trim().replace(/^@/, '') || undefined,
          }
        : {}),
      ...(dto.metaBookingButtonLabel !== undefined
        ? { bookingButtonLabel: dto.metaBookingButtonLabel.trim() || undefined }
        : {}),
    };

    dist.messaging = {
      ...(dist.messaging || {}),
      ...(dto.telegramEnabled !== undefined
        ? { telegramEnabled: dto.telegramEnabled }
        : {}),
      ...(dto.telegramBotUsername !== undefined
        ? {
            telegramBotUsername:
              dto.telegramBotUsername.trim().replace(/^@/, '') || undefined,
          }
        : {}),
      ...(dto.whatsappBookingEnabled !== undefined
        ? { whatsappBookingEnabled: dto.whatsappBookingEnabled }
        : {}),
      ...(dto.whatsappBusinessPhone !== undefined
        ? {
            whatsappBusinessPhone:
              dto.whatsappBusinessPhone.replace(/\D/g, '') || undefined,
          }
        : {}),
      ...(dto.whatsappBookingMessage !== undefined
        ? {
            whatsappBookingMessage:
              dto.whatsappBookingMessage.trim() || undefined,
          }
        : {}),
    };

    integrations.distribution = dist;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);

    return this.getPublicSettings(businessId);
  }

  async getGoogleReserveFeed(businessId: string): Promise<GoogleReserveFeed> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const dist = getDistributionIntegrations(business.settings);
    const services = await this.serviceRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });

    const bookingUrl = this.publicBookingUrl(business.slug);

    return {
      businessName: business.name,
      businessSlug: business.slug,
      merchantId: dist.googleReserve?.merchantId ?? null,
      generatedAt: new Date().toISOString(),
      bookingUrl,
      services: services.map((s) => ({
        serviceId: s.id,
        name: s.name,
        description: s.description,
        durationMinutes: s.durationMinutes,
        price: Number(s.price),
        currency: s.currency,
        bookingUrl: `${bookingUrl}/services?serviceId=${s.id}`,
      })),
      instructions:
        'Export this feed for Google Reserve with Google / Actions Center onboarding. ' +
        'Full automated sync requires Google partner approval. ' +
        'Until then, use bookingUrl as your conversion URL in Merchant Center.',
    };
  }

  getPublicMetaBooking(
    settings: Record<string, unknown> | undefined,
    slug: string,
  ) {
    const dist = getDistributionIntegrations(settings);
    if (!dist.metaBooking?.enabled) return null;
    return {
      bookingUrl: this.publicBookingUrl(slug),
      buttonLabel: dist.metaBooking.bookingButtonLabel || 'Book online',
      facebookPageUrl: dist.metaBooking.facebookPageUrl,
      instagramUsername: dist.metaBooking.instagramUsername,
    };
  }

  getPublicMessagingLinks(business: Business): MessagingDeepLinks | null {
    const dist = getDistributionIntegrations(business.settings);
    const hasTelegram =
      dist.messaging?.telegramEnabled && dist.messaging.telegramBotUsername;
    const hasWhatsapp =
      dist.messaging?.whatsappBookingEnabled &&
      dist.messaging.whatsappBusinessPhone;
    const hasMeta = dist.metaBooking?.enabled;
    if (!hasTelegram && !hasWhatsapp && !hasMeta) return null;
    return this.buildMessagingLinks(business);
  }
}
