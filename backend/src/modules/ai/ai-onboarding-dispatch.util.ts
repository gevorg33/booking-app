import type { CommandResult } from './command-completion.types.js';
import {
  ONBOARDING_LOGIC_DISPATCH_MAP,
  type OnboardingDispatchContext,
  type OnboardingLogicDispatchHandler,
} from './ai-onboarding-dispatch.build.js';
import type { OnboardingLogicDeps } from './ai-onboarding.logic.js';

export function getOnboardingLogicDispatchHandler(
  action: string,
): OnboardingLogicDispatchHandler | undefined {
  return ONBOARDING_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchOnboardingLogicIntent(
  deps: OnboardingLogicDeps,
  ctx: OnboardingDispatchContext,
): Promise<CommandResult | null> {
  const handler = ONBOARDING_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function onboardingDispatchMapHas(action: string): boolean {
  return ONBOARDING_LOGIC_DISPATCH_MAP.has(action);
}
