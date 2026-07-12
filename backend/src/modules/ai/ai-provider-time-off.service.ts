import { Injectable } from '@nestjs/common';
import { BusinessService } from '../business/business.service.js';
import { ProviderTimeOffService } from '../provider-mobile/provider-time-off.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleApproveTimeOffRequestLogic,
  handleCancelTimeOffRequestLogic,
  handleDenyTimeOffRequestLogic,
  handleListMyTimeOffRequestsLogic,
  handleListTimeOffRequestsLogic,
  handleRequestTimeOffLogic,
  type ProviderTimeOffLogicDeps,
} from './ai-provider-time-off.logic.js';
import {
  DASHBOARD_TIME_OFF_INTENTS,
  PROVIDER_TIME_OFF_INTENTS,
  rescueDashboardTimeOffIntent,
  rescueProviderTimeOffIntent,
} from './ai-provider-time-off.util.js';
import { dispatchProviderTimeOffIntent } from './ai-provider-time-off-dispatch.util.js';
import type { ProviderTimeOffDispatchContext } from './ai-provider-time-off-dispatch.build.js';

@Injectable()
export class AiProviderTimeOffService {
  private readonly deps: ProviderTimeOffLogicDeps;

  constructor(
    private timeOffService: ProviderTimeOffService,
    private businessService: BusinessService,
  ) {
    this.deps = {
      timeOffService: this.timeOffService,
      businessService: this.businessService,
    };
  }

  rescueDashboardTimeOffIntent(prompt: string, action: string) {
    return rescueDashboardTimeOffIntent(prompt, action);
  }

  rescueProviderTimeOffIntent(prompt: string, action: string) {
    return rescueProviderTimeOffIntent(prompt, action);
  }

  async handleIntent(
    businessId: string,
    userId: string,
    action: string,
    params: Record<string, unknown>,
    surface: 'dashboard' | 'provider',
    employeeId?: string,
  ): Promise<CommandResult | null> {
    if (surface === 'dashboard') {
      if (!DASHBOARD_TIME_OFF_INTENTS.includes(action as any)) return null;
      switch (action) {
        case 'list_time_off_requests':
          return handleListTimeOffRequestsLogic(
            this.deps,
            businessId,
            userId,
            params,
          );
        case 'approve_time_off_request':
          return handleApproveTimeOffRequestLogic(
            this.deps,
            businessId,
            userId,
            params,
          );
        case 'deny_time_off_request':
          return handleDenyTimeOffRequestLogic(
            this.deps,
            businessId,
            userId,
            params,
          );
        default:
          return null;
      }
    }

    if (!PROVIDER_TIME_OFF_INTENTS.includes(action as any) || !employeeId) {
      return null;
    }

    switch (action) {
      case 'request_time_off':
        return handleRequestTimeOffLogic(
          this.deps,
          businessId,
          userId,
          employeeId,
          params,
        );
      case 'list_my_time_off_requests':
        return handleListMyTimeOffRequestsLogic(
          this.deps,
          businessId,
          employeeId,
        );
      case 'cancel_time_off_request':
        return handleCancelTimeOffRequestLogic(
          this.deps,
          businessId,
          employeeId,
          params,
        );
      default:
        return null;
    }
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a dashboard-surface time-off intent. */
  dispatchIntent(
    ctx: ProviderTimeOffDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchProviderTimeOffIntent(this, ctx);
  }
}
