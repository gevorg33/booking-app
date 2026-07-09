import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleConfigureReferralProgramLogic,
  handleConfigureStaffMessageTemplatesLogic,
  type ReferralStaffTemplatesLogicDeps,
} from './ai-referral-staff-templates.logic.js';

@Injectable()
export class AiReferralStaffTemplatesService {
  private readonly deps: ReferralStaffTemplatesLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
  ) {
    this.deps = { businessRepo };
  }

  handleConfigureReferralProgram(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleConfigureReferralProgramLogic(this.deps, businessId, params);
  }

  handleConfigureStaffMessageTemplates(
    businessId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleConfigureStaffMessageTemplatesLogic(
      this.deps,
      businessId,
      params,
    );
  }
}
