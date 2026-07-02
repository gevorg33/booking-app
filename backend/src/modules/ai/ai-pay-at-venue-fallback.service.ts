import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handlePayAtVenueFallbackLogic,
  type PayAtVenueFallbackLogicDeps,
} from './ai-pay-at-venue-fallback.logic.js';

@Injectable()
export class AiPayAtVenueFallbackService {
  private readonly deps: PayAtVenueFallbackLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
  ) {
    this.deps = { businessRepo, serviceRepo };
  }

  handlePayAtVenueFallback(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handlePayAtVenueFallbackLogic(this.deps, businessId, params, prompt);
  }
}
