import { Injectable } from '@nestjs/common';
import { BusinessService } from '../business/business.service.js';
import { DashboardService } from '../business/dashboard.service.js';
import {
  rescueBusinessProfileIntent,
  isGetDashboardOverviewPrompt,
  isUpdateBusinessProfilePrompt,
} from './ai-business-profile.util.js';
import {
  handleGetDashboardOverviewLogic,
  handleUpdateBusinessProfileLogic,
  type BusinessProfileLogicDeps,
} from './ai-business-profile.logic.js';
import type { CommandResult } from './command-completion.types.js';
import { dispatchBusinessProfileLogicIntent } from './ai-business-profile-dispatch.util.js';
import type { BusinessProfileDispatchContext } from './ai-business-profile-dispatch.build.js';

@Injectable()
export class AiBusinessProfileService {
  private readonly deps: BusinessProfileLogicDeps;

  constructor(businessService: BusinessService, dashboardService: DashboardService) {
    this.deps = { businessService, dashboardService };
  }

  rescueBusinessProfileIntent(prompt: string, action: string) {
    return rescueBusinessProfileIntent(prompt, action);
  }

  isGetDashboardOverviewPrompt(prompt: string) {
    return isGetDashboardOverviewPrompt(prompt);
  }

  isUpdateBusinessProfilePrompt(prompt: string) {
    return isUpdateBusinessProfilePrompt(prompt);
  }

  handleGetDashboardOverview(businessId: string) {
    return handleGetDashboardOverviewLogic(this.deps, businessId);
  }

  handleUpdateBusinessProfile(businessId: string, params: Record<string, any>) {
    return handleUpdateBusinessProfileLogic(this.deps, businessId, params);
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a business-profile intent. */
  dispatchIntent(
    ctx: BusinessProfileDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchBusinessProfileLogicIntent(this.deps, ctx);
  }
}
