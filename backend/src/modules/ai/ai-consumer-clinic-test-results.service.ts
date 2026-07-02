import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestResultsService } from '../clinic-test-results/clinic-test-results.service.js';
import { PatientDocumentsService } from '../patient-clinical-profiles/patient-documents.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainResultStatusLogic,
  handleListMyTestResultsLogic,
  type ConsumerClinicTestResultsLogicDeps,
} from './ai-consumer-clinic-test-results.logic.js';
import { handleTrackLabOrderStatusLogic } from './ai-track-lab-order-status.logic.js';
import {
  handleListMyDocumentsLogic,
  type ListMyDocumentsLogicDeps,
} from './ai-list-my-documents.logic.js';
import {
  handleExplainAbnormalResultFlagLogic,
  type ExplainAbnormalResultFlagLogicDeps,
} from './ai-explain-abnormal-result-flag.logic.js';
import {
  handleNotifyWhenResultsReadyLogic,
  type NotifyWhenResultsReadyLogicDeps,
} from './ai-notify-when-results-ready.logic.js';

@Injectable()
export class AiConsumerClinicTestResultsService {
  private readonly deps: ConsumerClinicTestResultsLogicDeps;
  private readonly listMyDocumentsDeps: ListMyDocumentsLogicDeps;
  private readonly explainAbnormalResultFlagDeps: ExplainAbnormalResultFlagLogicDeps;
  private readonly notifyWhenResultsReadyDeps: NotifyWhenResultsReadyLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    clinicTestResultsService: ClinicTestResultsService,
    patientDocumentsService: PatientDocumentsService,
  ) {
    this.deps = {
      businessRepo,
      clinicTestResultsService,
    };
    this.listMyDocumentsDeps = {
      businessRepo,
      patientDocumentsService,
    };
    this.explainAbnormalResultFlagDeps = {
      businessRepo,
    };
    this.notifyWhenResultsReadyDeps = {
      businessRepo,
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

  handleTrackLabOrderStatus(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleTrackLabOrderStatusLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleListMyDocuments(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListMyDocumentsLogic(
      this.listMyDocumentsDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainAbnormalResultFlag(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainAbnormalResultFlagLogic(
      this.explainAbnormalResultFlagDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleNotifyWhenResultsReady(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleNotifyWhenResultsReadyLogic(
      this.notifyWhenResultsReadyDeps,
      businessId,
      params,
      prompt,
    );
  }
}
