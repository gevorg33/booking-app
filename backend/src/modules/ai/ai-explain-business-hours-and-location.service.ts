import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainBusinessHoursAndLocationLogic,
  type BusinessHoursLocationLogicDeps,
} from './ai-explain-business-hours-and-location.logic.js';
import { handleGetDirectionsToSalonLogic } from './ai-get-directions-to-salon.logic.js';
import { handleExplainSalonProfileLogic } from './ai-explain-salon-profile.logic.js';

@Injectable()
export class AiBusinessHoursLocationService {
  private readonly deps: BusinessHoursLocationLogicDeps;

  constructor(@InjectRepository(Business) businessRepo: Repository<Business>) {
    this.deps = { businessRepo };
  }

  handleExplainBusinessHoursAndLocation(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handleExplainBusinessHoursAndLocationLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleGetDirectionsToSalon(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handleGetDirectionsToSalonLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainSalonProfile(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handleExplainSalonProfileLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
