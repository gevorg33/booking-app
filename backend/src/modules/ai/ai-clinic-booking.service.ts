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
import { handleExplainLabPrepLogic } from './ai-explain-lab-prep.logic.js';
import { handleExplainClinicBookingFieldsLogic } from './ai-explain-clinic-booking-fields.logic.js';
import { handleExplainPublicIntakeFormLogic } from './ai-explain-public-intake-form.logic.js';
import { handleCompleteIntakeAndBookLogic } from './ai-complete-intake-and-book.logic.js';

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

  handleExplainLabPrep(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainLabPrepLogic(this.deps, businessId, params, prompt);
  }

  handleExplainClinicBookingFields(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainClinicBookingFieldsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainPublicIntakeForm(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainPublicIntakeFormLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleCompleteIntakeAndBook(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleCompleteIntakeAndBookLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
