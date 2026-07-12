import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainBusinessLanguagesLogic,
  type BusinessLanguagesLogicDeps,
} from './ai-business-languages.logic.js';

export type BusinessLanguagesDispatchContext = {
  businessId: string;
  action: string;
};

export type BusinessLanguagesLogicDispatchHandler = (
  deps: BusinessLanguagesLogicDeps,
  ctx: BusinessLanguagesDispatchContext,
) => Promise<CommandResult>;

export function buildBusinessLanguagesLogicDispatchMap(): ReadonlyMap<
  string,
  BusinessLanguagesLogicDispatchHandler
> {
  const map = new Map<string, BusinessLanguagesLogicDispatchHandler>();

  map.set('explain_business_languages', async (deps, ctx) =>
    handleExplainBusinessLanguagesLogic(deps, ctx.businessId),
  );

  return map;
}

/** Registry-driven dispatch table for AiBusinessLanguagesService (ai-cmd-ext-0.5). */
export const BUSINESS_LANGUAGES_LOGIC_DISPATCH_MAP =
  buildBusinessLanguagesLogicDispatchMap();
