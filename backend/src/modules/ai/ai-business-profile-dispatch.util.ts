import type { CommandResult } from './command-completion.types.js';
import {
  BUSINESS_PROFILE_LOGIC_DISPATCH_MAP,
  type BusinessProfileDispatchContext,
  type BusinessProfileLogicDispatchHandler,
} from './ai-business-profile-dispatch.build.js';
import type { BusinessProfileLogicDeps } from './ai-business-profile.logic.js';

export function getBusinessProfileLogicDispatchHandler(
  action: string,
): BusinessProfileLogicDispatchHandler | undefined {
  return BUSINESS_PROFILE_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchBusinessProfileLogicIntent(
  deps: BusinessProfileLogicDeps,
  ctx: BusinessProfileDispatchContext,
): Promise<CommandResult | null> {
  const handler = BUSINESS_PROFILE_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function businessProfileDispatchMapHas(action: string): boolean {
  return BUSINESS_PROFILE_LOGIC_DISPATCH_MAP.has(action);
}
