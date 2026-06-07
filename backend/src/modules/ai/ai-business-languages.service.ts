import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServiceCategory } from '../service/entities/service-category.entity.js';
import { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleConfigureBusinessLanguagesLogic,
  handleExplainBusinessLanguagesLogic,
  handleExplainBookingLanguagesLogic,
  handleBulkStripDisabledLocaleTranslationsLogic,
  type BusinessLanguagesLogicDeps,
} from './ai-business-languages.logic.js';

@Injectable()
export class AiBusinessLanguagesService {
  private readonly deps: BusinessLanguagesLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    @InjectRepository(ServiceCategory)
    categoryRepo: Repository<ServiceCategory>,
    @InjectRepository(ServicePackage) packageRepo: Repository<ServicePackage>,
  ) {
    this.deps = { businessRepo, serviceRepo, categoryRepo, packageRepo };
  }

  handleConfigureBusinessLanguages(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureBusinessLanguagesLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainBusinessLanguages(businessId: string): Promise<CommandResult> {
    return handleExplainBusinessLanguagesLogic(this.deps, businessId);
  }

  handleExplainBookingLanguages(
    businessId: string,
    visitorLocale?: string | null,
  ): Promise<CommandResult> {
    return handleExplainBookingLanguagesLogic(
      this.deps,
      businessId,
      visitorLocale,
    );
  }

  handleBulkStripDisabledLocaleTranslations(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleBulkStripDisabledLocaleTranslationsLogic(
      this.deps,
      businessId,
      params,
      prompt,
      confirmed,
    );
  }
}
