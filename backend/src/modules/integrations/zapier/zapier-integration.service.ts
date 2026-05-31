import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import { WebhooksService } from '../webhooks.service.js';
import { UpdateZapierIntegrationDto } from '../dto/update-zapier-integration.dto.js';
import {
  ZAPIER_TRIGGER_EVENTS,
  ZapierSamplePayload,
  getBusinessZapierIntegration,
  BusinessZapierIntegration,
} from './zapier-integration.types.js';

export interface ZapierIntegrationPublicView {
  enabled: boolean;
  hookDescription?: string;
  apiBaseUrl: string;
  webhookEvents: readonly string[];
  samplePayloads: ZapierSamplePayload[];
  setupSteps: string[];
  makeCompatible: boolean;
}

@Injectable()
export class ZapierIntegrationService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private webhooksService: WebhooksService,
    private config: ConfigService,
  ) {}

  private apiBaseUrl(): string {
    return this.config.get<string>('API_PUBLIC_URL') || 'http://localhost:3001';
  }

  async getPublicSettings(businessId: string): Promise<ZapierIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const zapier = getBusinessZapierIntegration(business.settings);
    const baseUrl = this.apiBaseUrl();

    return {
      enabled: Boolean(zapier.enabled),
      hookDescription: zapier.hookDescription,
      apiBaseUrl: baseUrl,
      webhookEvents: ZAPIER_TRIGGER_EVENTS,
      samplePayloads: this.samplePayloads(businessId),
      setupSteps: [
        'Create an API key under Integrations → API keys with read:bookings and read:customers scopes.',
        'In Zapier, choose Webhooks by Zapier → Catch Hook and paste your OptiSchedule webhook URL.',
        'Subscribe to events: booking.created, booking.cancelled, payment.received, review.received (see webhooks tab).',
        'Use REST API polling: GET /v1/bookings with Authorization: Bearer osk_live_…',
        'Make.com: use the same webhook URL and HTTP module with X-OptiSchedule-Signature verification.',
      ],
      makeCompatible: true,
    };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateZapierIntegrationDto,
  ): Promise<ZapierIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = { ...(settings.integrations as Record<string, unknown> || {}) };
    const current = getBusinessZapierIntegration(settings);

    const next: BusinessZapierIntegration = { ...current };
    if (dto.enabled !== undefined) next.enabled = dto.enabled;
    if (dto.hookDescription !== undefined) {
      next.hookDescription = dto.hookDescription.trim() || undefined;
    }

    integrations.zapier = next;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);

    return this.getPublicSettings(businessId);
  }

  async createZapierWebhook(
    businessId: string,
    url: string,
    events: string[],
    description?: string,
  ) {
    return this.webhooksService.createSubscription(businessId, {
      url,
      events,
      description: description || 'Zapier / Make automation',
    });
  }

  samplePayloads(businessId: string): ZapierSamplePayload[] {
    const now = new Date().toISOString();
    return [
      {
        event: 'booking.created',
        businessId,
        aggregateId: '00000000-0000-0000-0000-000000000001',
        timestamp: now,
        payload: {
          customerName: 'Jane Doe',
          serviceName: 'Haircut',
          employeeName: 'Alex',
          startTime: now,
        },
      },
      {
        event: 'payment.received',
        businessId,
        aggregateId: '00000000-0000-0000-0000-000000000002',
        timestamp: now,
        payload: { amount: 50, currency: 'USD', bookingId: '00000000-0000-0000-0000-000000000001' },
      },
      {
        event: 'review.received',
        businessId,
        aggregateId: '00000000-0000-0000-0000-000000000003',
        timestamp: now,
        payload: { rating: 5, comment: 'Great service', employeeId: 'emp-1', customerName: 'Jane Doe' },
      },
    ];
  }
}
