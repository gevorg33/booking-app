import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type {
  NotificationEmailTemplateKey,
  ResolvedEmailTemplate,
  TenantCustomEmailVariable,
  TenantEmailTemplateOverride,
} from './notification-email-template.types.js';
import {
  assertBuiltinVariableKeyAvailable,
  listAllTemplateVariables,
  listResolvedEmailTemplates,
  normalizeCustomVariables,
  readTenantEmailTemplatesSettings,
  resolveEmailTemplate,
} from './notification-email-template.util.js';
import { getEmailTemplateDefinition } from './notification-email-template.defaults.js';

@Injectable()
export class NotificationEmailTemplateService {
  constructor(@InjectRepository(Business) private businessRepo: Repository<Business>) {}

  async listTemplates(businessId: string): Promise<{
    templates: ResolvedEmailTemplate[];
    customVariables: TenantCustomEmailVariable[];
    variables: ReturnType<typeof listAllTemplateVariables>;
  }> {
    const business = await this.findBusiness(businessId);
    const stored = readTenantEmailTemplatesSettings(business.settings);
    return {
      templates: listResolvedEmailTemplates(business.settings),
      customVariables: stored.customVariables,
      variables: listAllTemplateVariables(business.settings),
    };
  }

  async updateTemplate(
    businessId: string,
    key: NotificationEmailTemplateKey,
    patch: TenantEmailTemplateOverride,
  ): Promise<ResolvedEmailTemplate> {
    getEmailTemplateDefinition(key);
    const business = await this.findBusiness(businessId);
    const stored = readTenantEmailTemplatesSettings(business.settings);
    const current = stored.templates?.[key] ?? {};
    const next: TenantEmailTemplateOverride = {
      ...current,
      ...patch,
    };
    business.settings = {
      ...business.settings,
      emailTemplates: {
        ...stored,
        templates: {
          ...stored.templates,
          [key]: next,
        },
      },
    };
    await this.businessRepo.save(business);
    return resolveEmailTemplate(key, next);
  }

  async resetTemplate(
    businessId: string,
    key: NotificationEmailTemplateKey,
  ): Promise<ResolvedEmailTemplate> {
    getEmailTemplateDefinition(key);
    const business = await this.findBusiness(businessId);
    const stored = readTenantEmailTemplatesSettings(business.settings);
    const templates = { ...stored.templates };
    delete templates[key];
    business.settings = {
      ...business.settings,
      emailTemplates: {
        ...stored,
        templates,
      },
    };
    await this.businessRepo.save(business);
    return resolveEmailTemplate(key);
  }

  async replaceCustomVariables(
    businessId: string,
    variables: TenantCustomEmailVariable[],
  ): Promise<TenantCustomEmailVariable[]> {
    const business = await this.findBusiness(businessId);
    const stored = readTenantEmailTemplatesSettings(business.settings);
    const normalized = normalizeCustomVariables(variables);
    for (const variable of normalized) {
      assertBuiltinVariableKeyAvailable(variable.key, business.settings);
    }
    business.settings = {
      ...business.settings,
      emailTemplates: {
        ...stored,
        customVariables: normalized,
      },
    };
    await this.businessRepo.save(business);
    return normalized;
  }

  private async findBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }
}
