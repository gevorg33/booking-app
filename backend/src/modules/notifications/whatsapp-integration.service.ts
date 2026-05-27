import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { UpdateWhatsAppIntegrationDto } from './dto/update-whatsapp-integration.dto.js';
import {
  decryptSecret,
  encryptSecret,
  maskSecret,
} from '../../common/utils/secret.util.js';
import {
  BusinessWhatsAppIntegration,
  DEFAULT_WHATSAPP_INTEGRATION,
  getBusinessWhatsAppIntegration,
  WhatsAppIntegrationPublicView,
  WhatsAppRuntimeConfig,
} from './whatsapp-integration.types.js';

@Injectable()
export class WhatsAppIntegrationService {
  private readonly logger = new Logger(WhatsAppIntegrationService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private readonly config: ConfigService,
  ) {}

  private encryptionKey(): string {
    return (
      this.config.get<string>('INTEGRATIONS_ENCRYPTION_KEY') ||
      this.config.get<string>('JWT_SECRET') ||
      'dev-integrations-key'
    );
  }

  platformRuntimeConfig(): WhatsAppRuntimeConfig | null {
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    if (!accessToken || !phoneNumberId) return null;

    return {
      source: 'platform',
      accessToken,
      phoneNumberId,
      wabaId: this.config.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID'),
      apiVersion: this.config.get<string>('WHATSAPP_API_VERSION') || 'v25.0',
      templateConfirmation:
        this.config.get<string>('WHATSAPP_TEMPLATE_CONFIRMATION') ||
        DEFAULT_WHATSAPP_INTEGRATION.templateConfirmation,
      templateReminder:
        this.config.get<string>('WHATSAPP_TEMPLATE_REMINDER') ||
        DEFAULT_WHATSAPP_INTEGRATION.templateReminder,
      templateLanguage:
        this.config.get<string>('WHATSAPP_TEMPLATE_LANGUAGE') ||
        DEFAULT_WHATSAPP_INTEGRATION.templateLanguage,
      templateBodyParamCount: Number(
        this.config.get<string>('WHATSAPP_TEMPLATE_BODY_PARAMS') ??
          DEFAULT_WHATSAPP_INTEGRATION.templateBodyParams,
      ),
      reminderBodyParamCount: Number(
        this.config.get<string>('WHATSAPP_TEMPLATE_REMINDER_BODY_PARAMS') ??
          DEFAULT_WHATSAPP_INTEGRATION.templateReminderBodyParams,
      ),
      defaultCountryCode:
        this.config.get<string>('WHATSAPP_DEFAULT_COUNTRY_CODE') ||
        DEFAULT_WHATSAPP_INTEGRATION.defaultCountryCode,
      fallbackTemplate:
        this.config.get<string>('WHATSAPP_FALLBACK_TEMPLATE') ||
        DEFAULT_WHATSAPP_INTEGRATION.fallbackTemplate,
      fallbackLanguage:
        this.config.get<string>('WHATSAPP_FALLBACK_LANGUAGE') ||
        DEFAULT_WHATSAPP_INTEGRATION.fallbackLanguage,
      fallbackBodyParamCount: Number(
        this.config.get<string>('WHATSAPP_FALLBACK_BODY_PARAMS') ??
          DEFAULT_WHATSAPP_INTEGRATION.fallbackBodyParams,
      ),
    };
  }

  private businessRuntimeConfig(
    integration: BusinessWhatsAppIntegration,
  ): WhatsAppRuntimeConfig | null {
    if (!integration.phoneNumberId || !integration.accessTokenEnc) return null;

    let accessToken: string;
    try {
      accessToken = decryptSecret(integration.accessTokenEnc, this.encryptionKey());
    } catch {
      this.logger.warn('Failed to decrypt business WhatsApp token');
      return null;
    }

    return {
      source: 'business',
      accessToken,
      phoneNumberId: integration.phoneNumberId,
      wabaId: integration.businessAccountId,
      apiVersion: this.config.get<string>('WHATSAPP_API_VERSION') || 'v25.0',
      templateConfirmation:
        integration.templateConfirmation ||
        DEFAULT_WHATSAPP_INTEGRATION.templateConfirmation,
      templateReminder:
        integration.templateReminder || DEFAULT_WHATSAPP_INTEGRATION.templateReminder,
      templateLanguage:
        integration.templateLanguage || DEFAULT_WHATSAPP_INTEGRATION.templateLanguage,
      templateBodyParamCount:
        integration.templateBodyParams ?? DEFAULT_WHATSAPP_INTEGRATION.templateBodyParams,
      reminderBodyParamCount:
        integration.templateReminderBodyParams ??
        DEFAULT_WHATSAPP_INTEGRATION.templateReminderBodyParams,
      defaultCountryCode:
        integration.defaultCountryCode || DEFAULT_WHATSAPP_INTEGRATION.defaultCountryCode,
      fallbackTemplate:
        integration.fallbackTemplate || DEFAULT_WHATSAPP_INTEGRATION.fallbackTemplate,
      fallbackLanguage:
        integration.fallbackLanguage || DEFAULT_WHATSAPP_INTEGRATION.fallbackLanguage,
      fallbackBodyParamCount:
        integration.fallbackBodyParams ?? DEFAULT_WHATSAPP_INTEGRATION.fallbackBodyParams,
    };
  }

  resolveRuntimeConfig(settings?: Record<string, unknown>): WhatsAppRuntimeConfig | null {
    const integration = getBusinessWhatsAppIntegration(settings);
    const businessConfig = this.businessRuntimeConfig(integration);
    if (businessConfig) return businessConfig;
    return this.platformRuntimeConfig();
  }

  async getPublicSettings(businessId: string): Promise<WhatsAppIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const integration = getBusinessWhatsAppIntegration(business.settings);
    const businessConfigured = Boolean(
      integration.phoneNumberId && integration.accessTokenEnc,
    );
    const platform = this.platformRuntimeConfig();
    const active = businessConfigured
      ? this.businessRuntimeConfig(integration)
      : platform;

    let accessTokenHint: string | undefined;
    if (integration.accessTokenEnc) {
      try {
        const token = decryptSecret(integration.accessTokenEnc, this.encryptionKey());
        accessTokenHint = maskSecret(token);
      } catch {
        accessTokenHint = undefined;
      }
    }

    const merged = { ...DEFAULT_WHATSAPP_INTEGRATION, ...integration };

    return {
      configured: Boolean(active),
      source: active?.source ?? null,
      phoneNumberId: merged.phoneNumberId,
      businessAccountId: merged.businessAccountId,
      hasAccessToken: Boolean(integration.accessTokenEnc),
      accessTokenHint,
      defaultCountryCode: merged.defaultCountryCode,
      templateConfirmation: merged.templateConfirmation,
      templateReminder: merged.templateReminder,
      templateLanguage: merged.templateLanguage,
      templateBodyParams: merged.templateBodyParams,
      templateReminderBodyParams: merged.templateReminderBodyParams,
      fallbackTemplate: merged.fallbackTemplate,
      fallbackLanguage: merged.fallbackLanguage,
      fallbackBodyParams: merged.fallbackBodyParams,
      usingPlatformDefault: !businessConfigured && Boolean(platform),
    };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateWhatsAppIntegrationDto,
  ): Promise<WhatsAppIntegrationPublicView> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = { ...(settings.integrations || {}) };
    const current = getBusinessWhatsAppIntegration(settings);

    if (dto.usePlatformDefault) {
      delete integrations.whatsapp;
      settings.integrations = Object.keys(integrations).length ? integrations : undefined;
      business.settings = settings;
      await this.businessRepo.save(business);
      return this.getPublicSettings(businessId);
    }

    const next: BusinessWhatsAppIntegration = {
      ...current,
      phoneNumberId: dto.phoneNumberId?.trim() || current.phoneNumberId,
      businessAccountId: dto.businessAccountId?.trim() || current.businessAccountId,
      defaultCountryCode: dto.defaultCountryCode?.trim() || current.defaultCountryCode,
      templateConfirmation:
        dto.templateConfirmation?.trim() || current.templateConfirmation,
      templateReminder: dto.templateReminder?.trim() || current.templateReminder,
      templateLanguage: dto.templateLanguage?.trim() || current.templateLanguage,
      templateBodyParams: dto.templateBodyParams ?? current.templateBodyParams,
      templateReminderBodyParams:
        dto.templateReminderBodyParams ?? current.templateReminderBodyParams,
      fallbackTemplate: dto.fallbackTemplate?.trim() || current.fallbackTemplate,
      fallbackLanguage: dto.fallbackLanguage?.trim() || current.fallbackLanguage,
      fallbackBodyParams: dto.fallbackBodyParams ?? current.fallbackBodyParams,
    };

    if (dto.accessToken?.trim()) {
      next.accessTokenEnc = encryptSecret(dto.accessToken.trim(), this.encryptionKey());
    }

    integrations.whatsapp = next;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);

    return this.getPublicSettings(businessId);
  }
}
