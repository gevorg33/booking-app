import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleConfigurePackageLocalizedNamesLogic,
  handleExplainPackageDisplayNameLogic,
  type PackageLocalizedNamesLogicDeps,
} from './ai-package-localized-names.logic.js';

@Injectable()
export class AiPackageLocalizedNamesService {
  private readonly deps: PackageLocalizedNamesLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    packagesService: ServicePackagesService,
  ) {
    this.deps = { businessRepo, packagesService };
  }

  handleConfigurePackageLocalizedNames(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigurePackageLocalizedNamesLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainPackageDisplayName(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    visitorLocale?: string | null,
  ): Promise<CommandResult> {
    return handleExplainPackageDisplayNameLogic(
      this.deps,
      businessId,
      params,
      prompt,
      visitorLocale,
    );
  }
}
