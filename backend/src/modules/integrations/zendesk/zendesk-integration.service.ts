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
import { ZendeskApiClient } from './zendesk-api.client.js';

@Injectable()
export class ZendeskIntegrationService {
  private readonly logger = new Logger(ZendeskIntegrationService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
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
    if (!integration.subdomain?.trim() || !integration.apiTokenEnc) return null;
    try {
      const apiToken = decryptSecret(integration.apiTokenEnc, this.encryptionKey());
      if (!apiToken.trim()) return null;
      return { subdomain: integration.subdomain.trim().toLowerCase(), apiToken: apiToken.trim() };
    } catch {
      this.logger.warn('Failed to decrypt Zendesk API token');
      return null;
    }
  }

  async getPublicSettings(businessId: string): Promise<ZendeskIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessZendeskIntegration(business.settings);
    const runtime = this.runtimeConfig(integration);

    let apiTokenHint: string | undefined;
    if (integration.apiTokenEnc) {
      try {
        apiTokenHint = maskSecret(decryptSecret(integration.apiTokenEnc, this.encryptionKey()));
      } catch {
        apiTokenHint = undefined;
      }
    }

    return {
      configured: Boolean(runtime),
      enabled: Boolean(integration.enabled),
      subdomain: integration.subdomain,
      hasApiToken: Boolean(integration.apiTokenEnc),
      apiTokenHint,
      widgetKey: integration.widgetKey,
      widgetEnabledOnDashboard: integration.widgetEnabledOnDashboard !== false,
      widgetEnabledOnPublicBooking: Boolean(integration.widgetEnabledOnPublicBooking),
      syncCustomersEnabled: Boolean(integration.syncCustomersEnabled),
      defaultAssigneeEmail: integration.defaultAssigneeEmail,
    };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateZendeskIntegrationDto,
  ): Promise<ZendeskIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = { ...(settings.integrations as Record<string, unknown> || {}) };
    const current = getBusinessZendeskIntegration(settings);

    if (dto.clearCredentials) {
      delete integrations.zendesk;
      settings.integrations = Object.keys(integrations).length ? integrations : undefined;
      business.settings = settings;
      await this.businessRepo.save(business);
      return this.getPublicSettings(businessId);
    }

    const next: BusinessZendeskIntegration = { ...current };

    if (dto.enabled !== undefined) next.enabled = dto.enabled;
    if (dto.subdomain !== undefined) next.subdomain = dto.subdomain.trim().toLowerCase();
    if (dto.apiToken?.trim()) {
      next.apiTokenEnc = encryptSecret(dto.apiToken.trim(), this.encryptionKey());
    }
    if (dto.widgetKey !== undefined) next.widgetKey = dto.widgetKey.trim() || undefined;
    if (dto.widgetEnabledOnDashboard !== undefined) {
      next.widgetEnabledOnDashboard = dto.widgetEnabledOnDashboard;
    }
    if (dto.widgetEnabledOnPublicBooking !== undefined) {
      next.widgetEnabledOnPublicBooking = dto.widgetEnabledOnPublicBooking;
    }
    if (dto.syncCustomersEnabled !== undefined) {
      next.syncCustomersEnabled = dto.syncCustomersEnabled;
    }
    if (dto.defaultAssigneeEmail !== undefined) {
      next.defaultAssigneeEmail = dto.defaultAssigneeEmail.trim() || undefined;
    }

    if (next.enabled && next.subdomain && next.apiTokenEnc) {
      const runtime = this.runtimeConfig(next);
      if (!runtime) {
        throw new BadRequestException('Invalid Zendesk credentials');
      }
      const ok = await this.api.verifyCredentials(runtime);
      if (!ok) {
        throw new BadRequestException('Could not verify Zendesk subdomain or API token');
      }
    }

    integrations.zendesk = next;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);

    return this.getPublicSettings(businessId);
  }

  getPublicWidgetConfig(settings?: Record<string, unknown>): ZendeskPublicWidgetConfig | null {
    const integration = getBusinessZendeskIntegration(settings);
    if (!integration.enabled || !integration.widgetKey?.trim()) return null;
    if (!integration.widgetEnabledOnPublicBooking && !integration.widgetEnabledOnDashboard) {
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
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessZendeskIntegration(business.settings);
    const runtime = this.runtimeConfig(integration);
    if (!runtime || !integration.enabled) {
      throw new BadRequestException('Zendesk is not configured for this business');
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
      throw new BadRequestException('A requester email is required to create a support ticket');
    }

    const requesterName =
      dto.requesterName?.trim() ||
      customer?.name ||
      booking?.customer?.name ||
      actorName ||
      requesterEmail;

    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const customFields: Record<string, string> = {
      Business: business.name,
      'Business ID': business.id,
    };
    if (customer) {
      customFields['Customer ID'] = customer.id;
      customFields['Customer profile'] = `${frontendUrl}/dashboard/customers?search=${encodeURIComponent(customer.name)}`;
    }
    if (booking) {
      customFields['Booking ID'] = booking.id;
      customFields['Appointment'] = `${booking.service?.name ?? 'Service'} with ${booking.employee?.name ?? 'Provider'} at ${booking.startTime.toISOString()}`;
    }

    const ticket = await this.api.createTicket(runtime, {
      subject: dto.subject,
      body: dto.body,
      requesterEmail,
      requesterName,
      tags: ['optischedule', 'dashboard-support'],
      customFields,
    });

    return { ...ticket, requesterEmail };
  }

  async syncCustomerIfEnabled(businessId: string, customerId: string) {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) return null;

    const integration = getBusinessZendeskIntegration(business.settings);
    if (!integration.enabled || !integration.syncCustomersEnabled) return null;

    const runtime = this.runtimeConfig(integration);
    if (!runtime) return null;

    const customer = await this.customerRepo.findOne({ where: { id: customerId, businessId } });
    if (!customer?.email?.trim()) return null;

    return this.syncCustomerRecord(business, customer, runtime);
  }

  private async syncCustomerRecord(
    business: Business,
    customer: Customer,
    runtime: { subdomain: string; apiToken: string },
  ) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
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
      email: customer.email!.trim(),
      name: customer.name,
      phone: customer.phone,
      externalId: customer.id,
      notes,
    });
  }
}
