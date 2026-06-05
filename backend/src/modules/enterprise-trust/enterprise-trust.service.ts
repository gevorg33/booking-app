import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Business } from '../business/entities/business.entity.js';
import {
  DPA_TEMPLATE,
  EU_PRIVACY_POLICY_TEMPLATE,
  PROCESSOR_NAME,
  TRUST_PLACEHOLDERS,
} from './enterprise-trust.constants.js';
import { SECURITY_ONE_PAGER } from './security-one-pager.constants.js';
import {
  mergeEnterpriseTrustSettings,
  type EnterpriseTrustSettings,
  type RenderedTrustDocument,
  type SecurityOnePager,
} from './enterprise-trust.types.js';
import { UpdateEnterpriseTrustSettingsDto } from './dto/update-enterprise-trust-settings.dto.js';

@Injectable()
export class EnterpriseTrustService {
  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private configService: ConfigService,
  ) {}

  async getSettings(businessId: string): Promise<EnterpriseTrustSettings> {
    const business = await this.findBusiness(businessId);
    return mergeEnterpriseTrustSettings(business.settings?.enterpriseTrust);
  }

  async updateSettings(
    businessId: string,
    dto: UpdateEnterpriseTrustSettingsDto,
  ): Promise<EnterpriseTrustSettings> {
    const business = await this.findBusiness(businessId);
    const current = mergeEnterpriseTrustSettings(
      business.settings?.enterpriseTrust,
    );
    const next = mergeEnterpriseTrustSettings({ ...current, ...dto });
    business.settings = {
      ...(business.settings ?? {}),
      enterpriseTrust: next,
    };
    await this.businessRepo.save(business);
    return next;
  }

  async renderDocuments(businessId: string): Promise<RenderedTrustDocument[]> {
    const business = await this.findBusiness(businessId);
    const settings = mergeEnterpriseTrustSettings(
      business.settings?.enterpriseTrust,
    );
    const values = this.buildPlaceholderValues(business, settings);

    return [
      {
        id: 'dpa',
        title: 'Data Processing Agreement (DPA)',
        markdown: this.fillTemplate(DPA_TEMPLATE, values),
        placeholdersFilled: this.filledKeys(values),
      },
      {
        id: 'privacy_policy',
        title: 'Privacy Policy (EU template)',
        markdown: this.fillTemplate(EU_PRIVACY_POLICY_TEMPLATE, values),
        placeholdersFilled: this.filledKeys(values),
      },
    ];
  }

  getSecurityOnePager(): SecurityOnePager {
    const contactEmail =
      this.configService.get<string>('SECURITY_CONTACT_EMAIL') ||
      SECURITY_ONE_PAGER.contactEmail;
    return { ...SECURITY_ONE_PAGER, contactEmail };
  }

  private buildPlaceholderValues(
    business: Business,
    settings: EnterpriseTrustSettings,
  ): Record<string, string> {
    const today = new Date().toISOString().slice(0, 10);
    return {
      businessName: settings.legalBusinessName || business.name,
      processorName: PROCESSOR_NAME,
      dpaEffectiveDate: settings.dpaEffectiveDate || today,
      privacyPolicyEffectiveDate: settings.privacyPolicyEffectiveDate || today,
      registeredAddress:
        settings.registeredAddress || '[Registered business address]',
      country: settings.country || '[Country]',
      dpoEmail: settings.dpoEmail || '[dpo@yourbusiness.com]',
      euRepresentative:
        settings.euRepresentative || '[EU representative, if required]',
      customDataProcessingNotes:
        settings.customDataProcessingNotes ||
        'No additional processing terms specified.',
    };
  }

  private fillTemplate(
    template: string,
    values: Record<string, string>,
  ): string {
    return template.replace(
      /\{\{(\w+)\}\}/g,
      (_, key: string) => values[key] ?? `[${key}]`,
    );
  }

  private filledKeys(values: Record<string, string>): string[] {
    return TRUST_PLACEHOLDERS.filter((key) => {
      const value = values[key];
      return value && !value.startsWith('[');
    });
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
