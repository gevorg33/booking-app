import type { CommandResult } from './command-completion.types.js';
import {
  BUSINESS_CURRENCY_LOGIC_DISPATCH_MAP,
  type BusinessCurrencyDispatchContext,
  type BusinessCurrencyLogicDispatchHandler,
} from './ai-business-currency-dispatch.build.js';
import type { BusinessCurrencyLogicDeps } from './ai-business-currency.logic.js';

export function getBusinessCurrencyLogicDispatchHandler(
  action: string,
): BusinessCurrencyLogicDispatchHandler | undefined {
  return BUSINESS_CURRENCY_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchBusinessCurrencyLogicIntent(
  deps: BusinessCurrencyLogicDeps,
  ctx: BusinessCurrencyDispatchContext,
): Promise<CommandResult | null> {
  const handler = BUSINESS_CURRENCY_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function businessCurrencyDispatchMapHas(action: string): boolean {
  return BUSINESS_CURRENCY_LOGIC_DISPATCH_MAP.has(action);
}
