import type { CommandResult } from './command-completion.types.js';
import {
  BUSINESS_DATE_FORMAT_LOGIC_DISPATCH_MAP,
  type BusinessDateFormatDispatchContext,
  type BusinessDateFormatLogicDispatchHandler,
} from './ai-business-date-format-dispatch.build.js';
import type { BusinessDateFormatLogicDeps } from './ai-business-date-format.logic.js';

export function getBusinessDateFormatLogicDispatchHandler(
  action: string,
): BusinessDateFormatLogicDispatchHandler | undefined {
  return BUSINESS_DATE_FORMAT_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchBusinessDateFormatLogicIntent(
  deps: BusinessDateFormatLogicDeps,
  ctx: BusinessDateFormatDispatchContext,
): Promise<CommandResult | null> {
  const handler = BUSINESS_DATE_FORMAT_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function businessDateFormatDispatchMapHas(action: string): boolean {
  return BUSINESS_DATE_FORMAT_LOGIC_DISPATCH_MAP.has(action);
}
