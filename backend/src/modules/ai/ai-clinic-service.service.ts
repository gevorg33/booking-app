import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { OnboardingService } from '../onboarding/onboarding.service.js';
import { ServiceService } from '../service/service.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleApplyClinicPlaybookLogic,
  handleConfigureClinicServiceLogic,
  handleExplainClinicServicesLogic,
  type ClinicPlaybookLogicDeps,
  type ClinicServiceLogicDeps,
} from './ai-clinic-service.logic.js';
import { dispatchClinicServiceIntent } from './ai-clinic-service-dispatch.util.js';
import type { ClinicServiceDispatchContext } from './ai-clinic-service-dispatch.build.js';

@Injectable()
export class AiClinicServiceService {
  private readonly deps: ClinicServiceLogicDeps;
  private readonly playbookDeps: ClinicPlaybookLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    serviceService: ServiceService,
    onboardingService: OnboardingService,
  ) {
    this.deps = { serviceService };
    this.playbookDeps = { businessRepo, onboardingService };
  }

  handleConfigureClinicService(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureClinicServiceLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainClinicServices(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainClinicServicesLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleApplyClinicPlaybook(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleApplyClinicPlaybookLogic(
      this.playbookDeps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a clinic-service intent. */
  dispatchIntent(
    ctx: ClinicServiceDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchClinicServiceIntent(this, ctx);
  }
}
