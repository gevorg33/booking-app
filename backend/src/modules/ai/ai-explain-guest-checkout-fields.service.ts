import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainGuestCheckoutFieldsLogic,
  type GuestCheckoutFieldsLogicDeps,
} from './ai-explain-guest-checkout-fields.logic.js';
import { handleExplainWhySignInLogic } from './ai-explain-why-sign-in.logic.js';
import {
  handleFixCheckoutValidationErrorLogic,
  type FixCheckoutValidationErrorLogicDeps,
} from './ai-fix-checkout-validation-error.logic.js';

@Injectable()
export class AiGuestCheckoutFieldsService {
  private readonly deps: GuestCheckoutFieldsLogicDeps &
    FixCheckoutValidationErrorLogicDeps;

  constructor(@InjectRepository(Business) businessRepo: Repository<Business>) {
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

  handleFixCheckoutValidationError(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleFixCheckoutValidationErrorLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainWhySignIn(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainWhySignInLogic(businessId, params, prompt);
  }
}
