import type { CommandResult } from './command-completion.types.js';
import {
  BUSINESS_TAX_LOGIC_DISPATCH_MAP,
  type BusinessTaxDispatchContext,
  type BusinessTaxLogicDispatchHandler,
} from './ai-business-tax-dispatch.build.js';
import type { BusinessTaxLogicDeps } from './ai-business-tax.logic.js';

export function getBusinessTaxLogicDispatchHandler(
  action: string,
): BusinessTaxLogicDispatchHandler | undefined {
  return BUSINESS_TAX_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchBusinessTaxLogicIntent(
  deps: BusinessTaxLogicDeps,
  ctx: BusinessTaxDispatchContext,
): Promise<CommandResult | null> {
  const handler = BUSINESS_TAX_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function businessTaxDispatchMapHas(action: string): boolean {
  return BUSINESS_TAX_LOGIC_DISPATCH_MAP.has(action);
}
