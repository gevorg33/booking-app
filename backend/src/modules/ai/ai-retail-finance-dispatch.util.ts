import type { CommandResult } from './command-completion.types.js';
import {
  RETAIL_FINANCE_LOGIC_DISPATCH_MAP,
  type RetailFinanceDispatchContext,
  type RetailFinanceLogicDispatchHandler,
} from './ai-retail-finance-dispatch.build.js';
import type { RetailFinanceLogicDeps } from './ai-retail-finance.logic.js';

export function getRetailFinanceLogicDispatchHandler(
  action: string,
): RetailFinanceLogicDispatchHandler | undefined {
  return RETAIL_FINANCE_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchRetailFinanceLogicIntent(
  deps: RetailFinanceLogicDeps,
  ctx: RetailFinanceDispatchContext,
): Promise<CommandResult | null> {
  const handler = RETAIL_FINANCE_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function retailFinanceDispatchMapHas(action: string): boolean {
  return RETAIL_FINANCE_LOGIC_DISPATCH_MAP.has(action);
}
