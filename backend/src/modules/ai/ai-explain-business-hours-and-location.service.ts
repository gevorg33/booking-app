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

  /** Registry-driven dispatch. Returns null when action is not handled here. */
  async dispatchIntent(ctx: {
    businessId: string;
    action: string;
    params: Record<string, unknown>;
    prompt?: string;
  }): Promise<CommandResult | null> {
    if (ctx.action === 'explain_business_hours_and_location') {
      return this.handleExplainBusinessHoursAndLocation(
        ctx.businessId,
        ctx.params,
        ctx.prompt ?? '',
      );
    }
    if (ctx.action === 'get_directions_to_salon') {
      return this.handleGetDirectionsToSalon(
        ctx.businessId,
        ctx.params,
        ctx.prompt ?? '',
      );
    }
    if (ctx.action === 'explain_salon_profile') {
      return this.handleExplainSalonProfile(
        ctx.businessId,
        ctx.params,
        ctx.prompt ?? '',
      );
    }
    return null;
  }
}
