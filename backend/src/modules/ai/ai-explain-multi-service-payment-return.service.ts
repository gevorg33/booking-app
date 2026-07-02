import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainMultiServicePaymentReturnLogic,
  type ExplainMultiServicePaymentReturnLogicDeps,
} from './ai-explain-multi-service-payment-return.logic.js';

@Injectable()
export class AiExplainMultiServicePaymentReturnService {
  private readonly deps: ExplainMultiServicePaymentReturnLogicDeps;

  constructor(@InjectRepository(Business) businessRepo: Repository<Business>) {
    this.deps = { businessRepo };
  }

  handleExplainMultiServicePaymentReturn(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainMultiServicePaymentReturnLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
