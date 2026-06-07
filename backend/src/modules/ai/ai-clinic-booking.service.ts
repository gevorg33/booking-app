import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { ServiceService } from '../service/service.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainClinicBookingLogic,
  type ClinicBookingLogicDeps,
} from './ai-clinic-booking.logic.js';

@Injectable()
export class AiClinicBookingService {
  private readonly deps: ClinicBookingLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    serviceService: ServiceService,
  ) {
    this.deps = {
      businessRepo,
      serviceService,
    };
  }

  handleExplainClinicBooking(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainClinicBookingLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
