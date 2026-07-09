import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { ClinicTestCatalogService } from '../clinic-test-results/catalog/clinic-test-catalog.service.js';
import { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import { ClinicLabChangeHistoryService } from '../clinic-test-results/shared/clinic-lab-change-history.service.js';
import { ClinicTestResultActionService } from '../clinic-test-results/test-result/clinic-test-result-action.service.js';
import { ClinicTestResultService } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import { ClinicSpecimenService } from '../clinic-test-results/specimen/clinic-specimen.service.js';
import { ClinicSpecimenStatusService } from '../clinic-test-results/specimen/clinic-specimen-status.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleEnterTestResultLogic,
  handleReleaseTestResultLogic,
  type ClinicTestResultLogicDeps,
} from './ai-clinic-test-result.logic.js';
import {
  handleConfigureTestReferenceRangeLogic,
  handleExplainLabResultHistoryLogic,
  handleExplainPatientResultsLogic,
  handleListAbnormalResultsLogic,
  handleTransitionSpecimenLogic,
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
    @InjectRepository(ClinicTestOrder)
    orderRepo: Repository<ClinicTestOrder>,
    clinicTestResultService: ClinicTestResultService,
    clinicTestResultActionService: ClinicTestResultActionService,
    clinicLabAccessService: ClinicLabAccessService,
    clinicCatalogService: ClinicTestCatalogService,
    clinicLabChangeHistoryService: ClinicLabChangeHistoryService,
    specimenService: ClinicSpecimenService,
    specimenStatusService: ClinicSpecimenStatusService,
  ) {
    this.deps = {
      businessRepo,
      bookingRepo,
      resultRepo,
      clinicTestResultService,
      clinicTestResultActionService,
      clinicLabAccessService,
    };
    this.extDeps = {
      bookingRepo,
      resultRepo,
      orderRepo,
      clinicTestResultService,
      clinicCatalogService,
      clinicLabAccessService,
      clinicLabChangeHistoryService,
      specimenService,
      specimenStatusService,
    };
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
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleConfigureTestReferenceRangeLogic(
      this.extDeps,
      businessId,
      userId,
      params,
    );
  }

  handleListAbnormalResults(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleListAbnormalResultsLogic(this.extDeps, businessId, params);
  }

  handleTransitionSpecimen(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleTransitionSpecimenLogic(
      this.extDeps,
      businessId,
      userId,
      params,
    );
  }

  handleExplainLabResultHistory(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleExplainLabResultHistoryLogic(
      this.extDeps,
      businessId,
      userId,
      params,
    );
  }
}
