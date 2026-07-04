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
}
