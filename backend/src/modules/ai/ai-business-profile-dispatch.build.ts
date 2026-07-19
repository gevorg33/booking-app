import type { CommandResult } from './command-completion.types.js';
import {
  handleGetDashboardOverviewLogic,
  handleUpdateBusinessProfileLogic,
  type BusinessProfileLogicDeps,
} from './ai-business-profile.logic.js';

export type BusinessProfileDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
};

export type BusinessProfileLogicDispatchHandler = (
  deps: BusinessProfileLogicDeps,
  ctx: BusinessProfileDispatchContext,
) => Promise<CommandResult>;

export function buildBusinessProfileLogicDispatchMap(): ReadonlyMap<
  string,
  BusinessProfileLogicDispatchHandler
> {
  const map = new Map<string, BusinessProfileLogicDispatchHandler>();

  map.set('get_dashboard_overview', async (deps, ctx) =>
    handleGetDashboardOverviewLogic(deps, ctx.businessId),
  );
  map.set('update_business_profile', async (deps, ctx) =>
    handleUpdateBusinessProfileLogic(deps, ctx.businessId, ctx.params),
  );

  return map;
}

/** Registry-driven dispatch table for AiBusinessProfileService (ai-cmd-ext-0.5). */
export const BUSINESS_PROFILE_LOGIC_DISPATCH_MAP =
  buildBusinessProfileLogicDispatchMap();
