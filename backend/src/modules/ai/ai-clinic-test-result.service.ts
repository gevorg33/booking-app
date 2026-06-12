import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import { ClinicTestResultActionService } from '../clinic-test-results/test-result/clinic-test-result-action.service.js';
import { ClinicTestResultService } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleEnterTestResultLogic,
  handleReleaseTestResultLogic,
  type ClinicTestResultLogicDeps,
} from './ai-clinic-test-result.logic.js';
import {
  handleConfigureTestReferenceRangeLogic,
  handleExplainPatientResultsLogic,
  handleListAbnormalResultsLogic,
  handleUploadPatientResultLogic,
  type ClinicTestResultExtLogicDeps,
} from './ai-clinic-test-result-ext.logic.js';

@Injectable()
export class AiClinicTestResultService {
  private readonly deps: ClinicTestResultLogicDeps;
  private readonly extDeps: ClinicTestResultExtLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(ClinicTestResult)
    resultRepo: Repository<ClinicTestResult>,
    clinicTestResultService: ClinicTestResultService,
    clinicTestResultActionService: ClinicTestResultActionService,
    clinicLabAccessService: ClinicLabAccessService,
  ) {
    this.deps = {
      businessRepo,
      bookingRepo,
      resultRepo,
      clinicTestResultService,
      clinicTestResultActionService,
      clinicLabAccessService,
    };
    this.extDeps = { bookingRepo, resultRepo, clinicTestResultService };
  }

  handleEnterTestResult(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleEnterTestResultLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
      confirmed,
    );
  }

  handleReleaseTestResult(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleReleaseTestResultLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
      confirmed,
    );
  }

  handleUploadPatientResult(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleUploadPatientResultLogic(
      this.extDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainPatientResults(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainPatientResultsLogic(
      this.extDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleConfigureTestReferenceRange(
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleConfigureTestReferenceRangeLogic(params);
  }

  handleListAbnormalResults(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleListAbnormalResultsLogic(this.extDeps, businessId, params);
  }
}
