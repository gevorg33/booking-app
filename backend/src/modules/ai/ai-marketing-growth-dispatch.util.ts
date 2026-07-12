import type { CommandResult } from './command-completion.types.js';
import {
  MARKETING_GROWTH_LOGIC_DISPATCH_MAP,
  type MarketingGrowthDispatchContext,
  type MarketingGrowthLogicDispatchHandler,
} from './ai-marketing-growth-dispatch.build.js';
import type { MarketingGrowthLogicDeps } from './ai-marketing-growth.logic.js';

export function getMarketingGrowthLogicDispatchHandler(
  action: string,
): MarketingGrowthLogicDispatchHandler | undefined {
  return MARKETING_GROWTH_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchMarketingGrowthLogicIntent(
  deps: MarketingGrowthLogicDeps,
  ctx: MarketingGrowthDispatchContext,
): Promise<CommandResult | null> {
  const handler = MARKETING_GROWTH_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function marketingGrowthDispatchMapHas(action: string): boolean {
  return MARKETING_GROWTH_LOGIC_DISPATCH_MAP.has(action);
}
