import type { CommandResult } from './command-completion.types.js';
import {
  BUSINESS_LANGUAGES_LOGIC_DISPATCH_MAP,
  type BusinessLanguagesDispatchContext,
  type BusinessLanguagesLogicDispatchHandler,
} from './ai-business-languages-dispatch.build.js';
import type { BusinessLanguagesLogicDeps } from './ai-business-languages.logic.js';

export function getBusinessLanguagesLogicDispatchHandler(
  action: string,
): BusinessLanguagesLogicDispatchHandler | undefined {
  return BUSINESS_LANGUAGES_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchBusinessLanguagesLogicIntent(
  deps: BusinessLanguagesLogicDeps,
  ctx: BusinessLanguagesDispatchContext,
): Promise<CommandResult | null> {
  const handler = BUSINESS_LANGUAGES_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function businessLanguagesDispatchMapHas(action: string): boolean {
  return BUSINESS_LANGUAGES_LOGIC_DISPATCH_MAP.has(action);
}
