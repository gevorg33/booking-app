import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Booking } from '../../booking/entities/booking.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import { UpdateZendeskIntegrationDto } from '../dto/update-zendesk-integration.dto.js';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto.js';
import {
  decryptSecret,
  encryptSecret,
  maskSecret,
} from '../../../common/utils/secret.util.js';
import {
  BusinessZendeskIntegration,
  getBusinessZendeskIntegration,
  ZendeskIntegrationPublicView,
  ZendeskPublicWidgetConfig,
} from './zendesk-integration.types.js';
import {
  ZendeskApiClient,
  type ZendeskRuntimeConfig,
} from './zendesk-api.client.js';
import { normalizeZendeskSubdomain } from './zendesk-subdomain.util.js';
import type { GiftCardModifyPayload } from '../../gift-cards/gift-card-order.types.js';

export interface ReviewTicketPayload {
  reviewId?: string;
  employeeId?: string;
  rating?: number;
  comment?: string;
  customerId?: string;
  bookingId?: string;
  customerName?: string;
}

@Injectable()
export class ZendeskIntegrationService {
  private readonly logger = new Logger(ZendeskIntegrationService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    private readonly config: ConfigService,
    private readonly api: ZendeskApiClient,
  ) {}

  private encryptionKey(): string {
    return (
      this.config.get<string>('INTEGRATIONS_ENCRYPTION_KEY') ||
      this.config.get<string>('JWT_SECRET') ||
      'dev-integrations-key'
    );
  }

  private runtimeConfig(integration: BusinessZendeskIntegration) {
    if (
      !integration.subdomain?.trim() ||
      !integration.apiTokenEnc ||
      !integration.apiUserEmail?.trim()
    ) {
      return null;
    }
    try {
      const apiToken = decryptSecret(
        integration.apiTokenEnc,
        this.encryptionKey(),
      );
      if (!apiToken.trim()) return null;
      return {
        subdomain: normalizeZendeskSubdomain(integration.subdomain),
        apiUserEmail: integration.apiUserEmail.trim().toLowerCase(),
        apiToken: apiToken.trim(),
      };
    } catch {
      this.logger.warn('Failed to decrypt Zendesk API token');
      return null;
    }
  }

  async getPublicSettings(
    businessId: string,
  ): Promise<ZendeskIntegrationPublicView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessZendeskIntegration(business.settings);
    const runtime = this.runtimeConfig(integration);

    let apiTokenHint: string | undefined;
    if (integration.apiTokenEnc) {
      try {
        apiTokenHint = maskSecret(
          decryptSecret(integration.apiTokenEnc, this.encryptionKey()),
        );
      } catch {
        apiTokenHint = undefined;
      }
    }

    return {
      configured: Boolean(runtime),
      enabled: Boolean(integration.enabled),
      subdomain: integration.subdomain,
      apiUserEmail: integration.apiUserEmail,
      hasApiToken: Boolean(integration.apiTokenEnc),
      apiTokenHint,
      widgetKey: integration.widgetKey,
      widgetEnabledOnDashboard: integration.widgetEnabledOnDashboard !== false,
      widgetEnabledOnPublicBooking: Boolean(
        integration.widgetEnabledOnPublicBooking,
      ),
      syncCustomersEnabled: Boolean(integration.syncCustomersEnabled),
      createTicketOnReview: Boolean(integration.createTicketOnReview),
      reviewTicketMaxRating: integration.reviewTicketMaxRating,
      defaultAssigneeEmail: integration.defaultAssigneeEmail,
    };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateZendeskIntegrationDto,
  ): Promise<ZendeskIntegrationPublicView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = {
      ...((settings.integrations as Record<string, unknown>) || {}),
    };
    const current = getBusinessZendeskIntegration(settings);

    if (dto.clearCredentials) {
      delete integrations.zendesk;
      settings.integrations = Object.keys(integrations).length
        ? integrations
        : undefined;
      business.settings = settings;
      await this.businessRepo.save(business);
      return this.getPublicSettings(businessId);
    }

    const next: BusinessZendeskIntegration = { ...current };

    if (dto.enabled !== undefined) next.enabled = dto.enabled;
    if (dto.subdomain !== undefined) {
      next.subdomain = normalizeZendeskSubdomain(dto.subdomain);
    }
    if (dto.apiUserEmail !== undefined) {
      next.apiUserEmail = dto.apiUserEmail.trim().toLowerCase() || undefined;
    }
    if (dto.apiToken?.trim()) {
      if (!next.apiUserEmail?.trim()) {
        throw new BadRequestException(
          'Zendesk account email is required when setting an API token',
        );
      }
      next.apiTokenEnc = encryptSecret(
        dto.apiToken.trim(),
        this.encryptionKey(),
      );
    }
    if (dto.widgetKey !== undefined)
      next.widgetKey = dto.widgetKey.trim() || undefined;
    if (dto.widgetEnabledOnDashboard !== undefined) {
      next.widgetEnabledOnDashboard = dto.widgetEnabledOnDashboard;
    }
    if (dto.widgetEnabledOnPublicBooking !== undefined) {
      next.widgetEnabledOnPublicBooking = dto.widgetEnabledOnPublicBooking;
    }
    if (dto.syncCustomersEnabled !== undefined) {
      next.syncCustomersEnabled = dto.syncCustomersEnabled;
    }
    if (dto.createTicketOnReview !== undefined) {
      next.createTicketOnReview = dto.createTicketOnReview;
    }
    if (dto.reviewTicketMaxRating !== undefined) {
      next.reviewTicketMaxRating = dto.reviewTicketMaxRating ?? undefined;
    }
    if (dto.defaultAssigneeEmail !== undefined) {
      next.defaultAssigneeEmail = dto.defaultAssigneeEmail.trim() || undefined;
    }

    if (next.enabled && next.subdomain && next.apiTokenEnc) {
      const runtime = this.runtimeConfig(next);
      if (!runtime) {
        throw new BadRequestException(
          'Zendesk subdomain, account email, and API token are required',
        );
      }
      const ok = await this.api.verifyCredentials(runtime);
      if (!ok) {
        throw new BadRequestException(
          'Could not verify Zendesk credentials. Check subdomain, account email, and API token.',
        );
      }
    }

    integrations.zendesk = next;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);

    return this.getPublicSettings(businessId);
  }

  getPublicWidgetConfig(
    settings?: Record<string, unknown>,
  ): ZendeskPublicWidgetConfig | null {
    const integration = getBusinessZendeskIntegration(settings);
    if (!integration.enabled || !integration.widgetKey?.trim()) return null;
    if (
      !integration.widgetEnabledOnPublicBooking &&
      !integration.widgetEnabledOnDashboard
    ) {
      return null;
    }
    return { widgetKey: integration.widgetKey.trim() };
  }

  getDashboardWidgetKey(settings?: Record<string, unknown>): string | null {
    const integration = getBusinessZendeskIntegration(settings);
    if (
      !integration.enabled ||
      integration.widgetEnabledOnDashboard === false ||
      !integration.widgetKey?.trim()
    ) {
      return null;
    }
    return integration.widgetKey.trim();
  }

  getPublicWidgetKey(settings?: Record<string, unknown>): string | null {
    const integration = getBusinessZendeskIntegration(settings);
    if (
      !integration.enabled ||
      !integration.widgetEnabledOnPublicBooking ||
      !integration.widgetKey?.trim()
    ) {
      return null;
    }
    return integration.widgetKey.trim();
  }

  async createSupportTicket(
    businessId: string,
    dto: CreateSupportTicketDto,
    actorEmail?: string,
    actorName?: string,
  ) {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessZendeskIntegration(business.settings);
    const runtime = this.runtimeConfig(integration);
    if (!runtime || !integration.enabled) {
      throw new BadRequestException(
        'Zendesk is not configured for this business',
      );
    }

    let customer: Customer | null = null;
    let booking: Booking | null = null;

    if (dto.customerId) {
      customer = await this.customerRepo.findOne({
        where: { id: dto.customerId, businessId },
      });
      if (customer?.email && integration.syncCustomersEnabled) {
        await this.syncCustomerRecord(business, customer, runtime);
      }
    }

    if (dto.bookingId) {
      booking = await this.bookingRepo.findOne({
        where: { id: dto.bookingId, businessId },
        relations: { customer: true, employee: true, service: true },
      });
    }

    const requesterEmail =
      dto.requesterEmail?.trim() ||
      customer?.email?.trim() ||
      booking?.customer?.email?.trim() ||
      actorEmail?.trim();
    if (!requesterEmail) {
      throw new BadRequestException(
        'A requester email is required to create a support ticket',
      );
    }

    const requesterName =
      dto.requesterName?.trim() ||
      customer?.name ||
      booking?.customer?.name ||
      actorName ||
      requesterEmail;

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const customFields: Record<string, string> = {
      Business: business.name,
      'Business ID': business.id,
    };
    if (customer) {
      customFields['Customer ID'] = customer.id;
      customFields['Customer profile'] =
        `${frontendUrl}/dashboard/customers?search=${encodeURIComponent(customer.name)}`;
    }
    if (booking) {
      customFields['Booking ID'] = booking.id;
      customFields['Appointment'] =
        `${booking.service?.name ?? 'Service'} with ${booking.employee?.name ?? 'Provider'} at ${booking.startTime.toISOString()}`;
    }

    const ticket = await this.api.createTicket(runtime, {
      subject: dto.subject,
      body: dto.body,
      requesterEmail,
      requesterName,
      tags: dto.tags?.length ? dto.tags : ['optischedule', 'dashboard-support'],
      customFields,
    });

    return { ...ticket, requesterEmail };
  }

  async createTicketFromReviewIfEnabled(
    businessId: string,
    payload: ReviewTicketPayload,
  ) {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return null;

    const integration = getBusinessZendeskIntegration(business.settings);
    if (!integration.enabled || !integration.createTicketOnReview) return null;

    const rating = Number(payload.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      this.logger.warn(
        `Skipping Zendesk review ticket — invalid rating for review ${payload.reviewId}`,
      );
      return null;
    }

    if (
      integration.reviewTicketMaxRating != null &&
      rating > integration.reviewTicketMaxRating
    ) {
      return null;
    }

    const customerName = payload.customerName?.trim() || 'Customer';
    const comment = payload.comment?.trim();
    const employee = payload.employeeId
      ? await this.employeeRepo.findOne({
          where: { id: payload.employeeId, businessId },
        })
      : null;

    const bodyParts = [
      `Rating: ${rating}/5`,
      comment ? `Comment:\n${comment}` : 'No written comment.',
    ];
    if (employee?.name) bodyParts.push(`Provider: ${employee.name}`);
    if (payload.reviewId) bodyParts.push(`Review ID: ${payload.reviewId}`);

    const tags = ['optischedule', 'review'];
    if (rating <= 3) tags.push('low-rating');

    return this.createSupportTicket(businessId, {
      subject: `New review — ${rating}★ from ${customerName}`,
      body: bodyParts.join('\n\n'),
      customerId: payload.customerId,
      bookingId: payload.bookingId,
      requesterName: customerName,
      requesterEmail: await this.resolveReviewRequesterEmail(
        businessId,
        payload,
      ),
      tags,
    });
  }

  private async resolveReviewRequesterEmail(
    businessId: string,
    payload: ReviewTicketPayload,
  ): Promise<string> {
    if (payload.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: payload.customerId, businessId },
      });
      if (customer?.email?.trim()) return customer.email.trim();
    }

    if (payload.bookingId) {
      const booking = await this.bookingRepo.findOne({
        where: { id: payload.bookingId, businessId },
        relations: { customer: true },
      });
      if (booking?.customer?.email?.trim())
        return booking.customer.email.trim();
    }

    const domain =
      this.config.get<string>('ZENDESK_REVIEW_NOREPLY_DOMAIN') ||
      'noreply.optischedule.app';
    return `reviews+${businessId}@${domain}`;
  }

  async syncCustomerIfEnabled(businessId: string, customerId: string) {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return null;

    const integration = getBusinessZendeskIntegration(business.settings);
    if (!integration.enabled || !integration.syncCustomersEnabled) return null;

    const runtime = this.runtimeConfig(integration);
    if (!runtime) return null;

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId },
    });
    if (!customer?.email?.trim()) return null;

    return this.syncCustomerRecord(business, customer, runtime);
  }

  async createGiftCardChangeTicket(
    businessId: string,
    card: {
      id: string;
      code: string;
      cardType: string;
      deliveryMethod?: string | null;
      fulfillmentStatus?: string | null;
      purchaseAmount?: number | null;
      balance?: number;
      expiresAt?: Date | null;
      recipientName?: string | null;
      recipientEmail?: string | null;
      purchaserEmail?: string | null;
      serviceCredits?: Array<{
        serviceName: string;
        quantityRemaining: number;
      }>;
    },
    request: {
      id: string;
      requestType: string;
      customerNotes?: string | null;
      modifyPayload?: GiftCardModifyPayload | null;
    },
  ) {
    const requesterEmail = card.purchaserEmail?.trim();
    if (!requesterEmail) {
      throw new BadRequestException(
        'Purchaser email is required for Zendesk ticket',
      );
    }

    const creditsSummary = (card.serviceCredits ?? [])
      .map((c) => `${c.serviceName} (${c.quantityRemaining} left)`)
      .join(', ');
    const bodyParts = [
      `Request type: ${request.requestType}`,
      `Gift card order ID: ${card.id}`,
      `Code: ${card.code}`,
      `Type: ${card.cardType}`,
      `Delivery: ${card.deliveryMethod ?? 'n/a'}`,
      `Fulfillment status: ${card.fulfillmentStatus ?? 'n/a'}`,
      `Purchase amount: ${card.purchaseAmount ?? card.balance ?? 'n/a'}`,
      card.expiresAt
        ? `Expiration: ${card.expiresAt.toISOString()}`
        : 'Expiration: none',
      `Recipient: ${card.recipientName ?? 'n/a'} <${card.recipientEmail ?? 'n/a'}>`,
      request.customerNotes
        ? `Customer notes:\n${request.customerNotes}`
        : null,
      request.modifyPayload
        ? `Requested changes:\n${JSON.stringify(request.modifyPayload, null, 2)}`
        : null,
      creditsSummary ? `Service credits: ${creditsSummary}` : null,
      `Change request ID: ${request.id}`,
    ].filter(Boolean);

    const integration = getBusinessZendeskIntegration(
      (await this.businessRepo.findOne({ where: { id: businessId } }))
        ?.settings,
    );
    const tags = [
      'optischedule',
      'gift-card',
      'sales-specialist',
      request.requestType,
    ];

    return this.createSupportTicket(businessId, {
      subject: `Gift card ${request.requestType} request — ${card.code}`,
      body: bodyParts.join('\n\n'),
      requesterEmail,
      requesterName: card.recipientName ?? requesterEmail,
      tags,
    });
  }

  private async syncCustomerRecord(
    business: Business,
    customer: Customer,
    runtime: ZendeskRuntimeConfig,
  ) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const bookingCount = await this.bookingRepo.count({
      where: { businessId: business.id, customerId: customer.id },
    });

    const notes = [
      `OptiSchedule customer (${business.name})`,
      `Profile: ${frontendUrl}/dashboard/customers?search=${encodeURIComponent(customer.name)}`,
      `Appointments: ${bookingCount}`,
      customer.tags?.length ? `Tags: ${customer.tags.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return this.api.upsertUser(runtime, {
      email: customer.email.trim(),
      name: customer.name,
      phone: customer.phone,
      externalId: customer.id,
      notes,
    });
  }
}
