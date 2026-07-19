import type { CommandResult } from './command-completion.types.js';
import {
  handleApplyOnboardingCatalogLogic,
  handleApplyOnboardingPlaybookLogic,
  handleApplyOnboardingScheduleLogic,
  handleCompleteOnboardingLogic,
  handleExplainOnboardingStatusLogic,
  handleRecommendCatalogLogic,
  handleSetBusinessTypeLogic,
  handleSkipOnboardingScheduleLogic,
  type OnboardingLogicDeps,
} from './ai-onboarding.logic.js';

export type OnboardingDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  userId?: string;
};

export type OnboardingLogicDispatchHandler = (
  deps: OnboardingLogicDeps,
  ctx: OnboardingDispatchContext,
) => Promise<CommandResult>;

export function buildOnboardingLogicDispatchMap(): ReadonlyMap<
  string,
  OnboardingLogicDispatchHandler
> {
  const map = new Map<string, OnboardingLogicDispatchHandler>();

  map.set('explain_onboarding_status', async (deps, ctx) =>
    handleExplainOnboardingStatusLogic(deps, ctx.businessId),
  );
  map.set('set_business_type', async (deps, ctx) =>
    handleSetBusinessTypeLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('recommend_catalog', async (deps, ctx) =>
    handleRecommendCatalogLogic(deps, ctx.businessId),
  );
  map.set('apply_onboarding_catalog', async (deps, ctx) =>
    handleApplyOnboardingCatalogLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('apply_onboarding_schedule', async (deps, ctx) =>
    handleApplyOnboardingScheduleLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
    ),
  );
  map.set('skip_onboarding_schedule', async (deps, ctx) =>
    handleSkipOnboardingScheduleLogic(deps, ctx.businessId),
  );
  map.set('apply_onboarding_playbook', async (deps, ctx) =>
    handleApplyOnboardingPlaybookLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
    ),
  );
  map.set('complete_onboarding', async (deps, ctx) =>
    handleCompleteOnboardingLogic(deps, ctx.businessId),
  );

  return map;
}

/** Registry-driven dispatch table for AiOnboardingService (ai-cmd-ext-0.5). */
export const ONBOARDING_LOGIC_DISPATCH_MAP = buildOnboardingLogicDispatchMap();
