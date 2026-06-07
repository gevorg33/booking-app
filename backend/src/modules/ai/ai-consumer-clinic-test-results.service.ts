import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestResultsService } from '../clinic-test-results/clinic-test-results.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainResultStatusLogic,
  handleListMyTestResultsLogic,
  type ConsumerClinicTestResultsLogicDeps,
} from './ai-consumer-clinic-test-results.logic.js';

@Injectable()
export class AiConsumerClinicTestResultsService {
  private readonly deps: ConsumerClinicTestResultsLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    clinicTestResultsService: ClinicTestResultsService,
  ) {
    this.deps = {
      businessRepo,
      clinicTestResultsService,
    };
  }

  handleListMyTestResults(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListMyTestResultsLogic(this.deps, businessId, params, prompt);
  }

  handleExplainResultStatus(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainResultStatusLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
