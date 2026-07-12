import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { ClinicSpecimenService } from '../clinic-test-results/specimen/clinic-specimen.service.js';
import { ClinicSpecimenStatusService } from '../clinic-test-results/specimen/clinic-specimen-status.service.js';
import { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainSpecimenRecollectLogic,
  handleListMyCollectionQueueLogic,
  handleMarkSpecimenCollectedLogic,
  type ProviderClinicCollectionLogicDeps,
} from './ai-provider-clinic-collection.logic.js';

@Injectable()
export class AiProviderClinicCollectionService {
  private readonly deps: ProviderClinicCollectionLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    clinicSpecimenService: ClinicSpecimenService,
    clinicSpecimenStatusService: ClinicSpecimenStatusService,
    clinicLabAccessService: ClinicLabAccessService,
  ) {
    this.deps = {
      businessRepo,
      clinicSpecimenService,
      clinicSpecimenStatusService,
      clinicLabAccessService,
    };
  }

  handleListMyCollectionQueue(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListMyCollectionQueueLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainSpecimenRecollect(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainSpecimenRecollectLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleMarkSpecimenCollected(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleMarkSpecimenCollectedLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }
}
