import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainGuestCheckoutFieldsLogic,
  type GuestCheckoutFieldsLogicDeps,
} from './ai-explain-guest-checkout-fields.logic.js';

@Injectable()
export class AiGuestCheckoutFieldsService {
  private readonly deps: GuestCheckoutFieldsLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
  ) {
    this.deps = { businessRepo };
  }

  handleExplainGuestCheckoutFields(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainGuestCheckoutFieldsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
