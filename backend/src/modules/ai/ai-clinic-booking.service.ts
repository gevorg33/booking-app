import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { ServiceService } from '../service/service.service.js';
import { PublicPreVisitIntakeService } from '../public-booking/public-pre-visit-intake.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainClinicBookingLogic,
  type ClinicBookingLogicDeps,
} from './ai-clinic-booking.logic.js';
import { handleExplainLabPrepLogic } from './ai-explain-lab-prep.logic.js';
import { handleExplainClinicBookingFieldsLogic } from './ai-explain-clinic-booking-fields.logic.js';
import { handleExplainPublicIntakeFormLogic } from './ai-explain-public-intake-form.logic.js';
import { handleCompleteIntakeAndBookLogic } from './ai-complete-intake-and-book.logic.js';
import { handleCreateIntakeDraftLogic } from './ai-create-intake-draft.logic.js';
import { handleGetIntakeFlowStatusLogic } from './ai-get-intake-flow-status.logic.js';
import { handleStartPreVisitIntakeLogic } from './ai-start-pre-visit-intake.logic.js';
import { handleSubmitIntakeAnswersLogic } from './ai-submit-intake-answers.logic.js';

@Injectable()
export class AiClinicBookingService {
  private readonly deps: ClinicBookingLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    serviceService: ServiceService,
    publicPreVisitIntakeService: PublicPreVisitIntakeService,
  ) {
    this.deps = {
      businessRepo,
      serviceService,
      publicPreVisitIntakeService,
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

  handleCreateIntakeDraft(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleCreateIntakeDraftLogic(this.deps, businessId, params);
  }

  handleGetIntakeFlowStatus(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleGetIntakeFlowStatusLogic(this.deps, businessId, params);
  }

  handleStartPreVisitIntake(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleStartPreVisitIntakeLogic(this.deps, businessId, params);
  }

  handleSubmitIntakeAnswers(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleSubmitIntakeAnswersLogic(this.deps, businessId, params);
  }
}
