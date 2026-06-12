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
import { UpdateOpenAiIntegrationDto } from '../dto/update-openai-integration.dto.js';
import {
  decryptSecret,
  encryptSecret,
  maskSecret,
} from '../../../common/utils/secret.util.js';
import {
  BusinessOpenAiIntegration,
  getBusinessOpenAiIntegration,
  OpenAiIntegrationPublicView,
} from './openai-integration.types.js';
import { OpenAiRuntimeConfig, AiUsageSummary } from './openai.types.js';
import { AiUsageService } from './ai-usage.service.js';
import { isUuid } from '../../../engine/langgraph/tools/booking-tool-context.helpers.js';

@Injectable()
export class OpenAiIntegrationService {
  private readonly logger = new Logger(OpenAiIntegrationService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private readonly config: ConfigService,
    private readonly usageService: AiUsageService,
  ) {}

  private encryptionKey(): string {
    return (
      this.config.get<string>('INTEGRATIONS_ENCRYPTION_KEY') ||
      this.config.get<string>('JWT_SECRET') ||
      'dev-integrations-key'
    );
  }

  platformRuntimeConfig(): OpenAiRuntimeConfig | null {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey?.trim()) return null;
    return { source: 'platform', apiKey: apiKey.trim() };
  }

  businessRuntimeConfig(
    integration: BusinessOpenAiIntegration,
  ): OpenAiRuntimeConfig | null {
    if (!integration.apiKeyEnc) return null;

    try {
      const apiKey = decryptSecret(integration.apiKeyEnc, this.encryptionKey());
      if (!apiKey.trim()) return null;
      return { source: 'business', apiKey: apiKey.trim() };
    } catch {
      this.logger.warn('Failed to decrypt business OpenAI API key');
      return null;
    }
  }

  resolveRuntimeConfig(
    settings?: Record<string, unknown>,
  ): OpenAiRuntimeConfig | null {
    const integration = getBusinessOpenAiIntegration(settings);
    const businessConfig = this.businessRuntimeConfig(integration);
    if (businessConfig) return businessConfig;
    return this.platformRuntimeConfig();
  }

  async isAvailableForBusiness(businessId: string): Promise<boolean> {
    if (!isUuid(businessId)) {
      return Boolean(this.platformRuntimeConfig());
    }
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return false;
    return Boolean(this.resolveRuntimeConfig(business.settings));
  }

  async getPublicSettings(
    businessId: string,
  ): Promise<OpenAiIntegrationPublicView & { usage: AiUsageSummary }> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessOpenAiIntegration(business.settings);
    const businessConfigured = Boolean(integration.apiKeyEnc);
    const platform = this.platformRuntimeConfig();
    const active = businessConfigured
      ? this.businessRuntimeConfig(integration)
      : platform;

    let apiKeyHint: string | undefined;
    if (integration.apiKeyEnc) {
      try {
        const key = decryptSecret(integration.apiKeyEnc, this.encryptionKey());
        apiKeyHint = maskSecret(key);
      } catch {
        apiKeyHint = undefined;
      }
    }

    const usage = await this.usageService.getMonthlySummary(businessId);

    return {
      configured: Boolean(active),
      source: active?.source ?? null,
      hasApiKey: Boolean(integration.apiKeyEnc),
      apiKeyHint,
      usingPlatformDefault: !businessConfigured && Boolean(platform),
      usage,
    };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateOpenAiIntegrationDto,
  ): Promise<OpenAiIntegrationPublicView & { usage: AiUsageSummary }> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = { ...(settings.integrations || {}) };
    const current = getBusinessOpenAiIntegration(settings);

    if (dto.usePlatformDefault) {
      delete integrations.openai;
      settings.integrations = Object.keys(integrations).length
        ? integrations
        : undefined;
      business.settings = settings;
      await this.businessRepo.save(business);
      return this.getPublicSettings(businessId);
    }

    const next: BusinessOpenAiIntegration = { ...current };

    if (dto.apiKey?.trim()) {
      next.apiKeyEnc = encryptSecret(dto.apiKey.trim(), this.encryptionKey());
    }

    if (!next.apiKeyEnc) {
      throw new BadRequestException('OpenAI API key is required');
    }

    integrations.openai = next;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);

    return this.getPublicSettings(businessId);
  }
}
