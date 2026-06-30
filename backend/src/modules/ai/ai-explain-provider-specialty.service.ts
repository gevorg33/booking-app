import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainProviderSpecialtyLogic,
  type ProviderSpecialtyLogicDeps,
} from './ai-explain-provider-specialty.logic.js';

@Injectable()
export class AiProviderSpecialtyService {
  private readonly deps: ProviderSpecialtyLogicDeps;

  constructor(
    @InjectRepository(Employee) employeeRepo: Repository<Employee>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    private readonly reviewsService: ReviewsService,
  ) {
    this.deps = {
      employeeRepo,
      serviceRepo,
      reviewsService: this.reviewsService,
    };
  }

  handleExplainProviderSpecialty(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handleExplainProviderSpecialtyLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
