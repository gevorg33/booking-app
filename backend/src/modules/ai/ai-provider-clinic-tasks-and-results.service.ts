import { Injectable } from '@nestjs/common';
import { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import { ClinicTestResultsService } from '../clinic-test-results/clinic-test-results.service.js';
import { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleClaimClinicTaskLogic,
  handleCompleteClinicTaskLogic,
  handleExplainClinicTaskLogic,
  handleListBookingLabSummariesLogic,
  handleListClinicTasksLogic,
  handleListLabResultsQueueLogic,
  type ProviderClinicTasksAndResultsLogicDeps,
} from './ai-provider-clinic-tasks-and-results.logic.js';
import { rescueProviderClinicTasksAndResultsIntent } from './ai-provider-clinic-tasks-and-results.util.js';
import { dispatchProviderClinicTasksAndResultsLogicIntent } from './ai-provider-clinic-tasks-and-results-dispatch.util.js';
import type { ProviderClinicTasksAndResultsDispatchContext } from './ai-provider-clinic-tasks-and-results-dispatch.build.js';

@Injectable()
export class AiProviderClinicTasksAndResultsService {
  private readonly deps: ProviderClinicTasksAndResultsLogicDeps;

  constructor(
    providerMobile: ProviderMobileService,
    clinicTestResultsService: ClinicTestResultsService,
    clinicLabAccessService: ClinicLabAccessService,
  ) {
    this.deps = {
      providerMobile,
      clinicTestResultsService,
      clinicLabAccessService,
    };
  }

  rescueProviderClinicTasksAndResultsIntent(prompt: string, action: string) {
    return rescueProviderClinicTasksAndResultsIntent(prompt, action);
  }

  handleListLabResultsQueue(
    businessId: string,
    userId: string,
  ): Promise<CommandResult> {
    return handleListLabResultsQueueLogic(this.deps, businessId, userId);
  }

  handleListClinicTasks(
    businessId: string,
    userId: string,
  ): Promise<CommandResult> {
    return handleListClinicTasksLogic(this.deps, businessId, userId);
  }

  handleClaimClinicTask(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleClaimClinicTaskLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleCompleteClinicTask(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleCompleteClinicTaskLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleExplainClinicTask(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainClinicTaskLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleListBookingLabSummaries(
    businessId: string,
    userId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListBookingLabSummariesLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a provider-clinic-tasks-and-results intent. */
  dispatchIntent(
    ctx: ProviderClinicTasksAndResultsDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchProviderClinicTasksAndResultsLogicIntent(this.deps, ctx);
  }
}
