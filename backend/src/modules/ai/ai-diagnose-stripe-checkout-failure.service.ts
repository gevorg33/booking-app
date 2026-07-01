import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleConsumerDiagnoseStripeCheckoutFailureLogic,
  type DiagnoseStripeCheckoutFailureLogicDeps,
} from './ai-diagnose-stripe-checkout-failure.logic.js';

@Injectable()
export class AiDiagnoseStripeCheckoutFailureService {
  private readonly deps: DiagnoseStripeCheckoutFailureLogicDeps;

  constructor(@InjectRepository(Business) businessRepo: Repository<Business>) {
    this.deps = { businessRepo };
  }

  handleDiagnoseStripeCheckoutFailure(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConsumerDiagnoseStripeCheckoutFailureLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
