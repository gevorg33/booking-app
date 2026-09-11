import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateQuestionnaireLogic,
  handlePublishQuestionnaireLogic,
  handleUpdateQuestionnaireLogic,
  type ClinicQuestionnaireLogicDeps,
} from './ai-clinic-questionnaire.logic.js';

export type ClinicQuestionnaireDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  userId: string;
};

export type ClinicQuestionnaireLogicDispatchHandler = (
  deps: ClinicQuestionnaireLogicDeps,
  ctx: ClinicQuestionnaireDispatchContext,
) => Promise<CommandResult>;

export function buildClinicQuestionnaireLogicDispatchMap(): ReadonlyMap<
  string,
  ClinicQuestionnaireLogicDispatchHandler
> {
  const map = new Map<string, ClinicQuestionnaireLogicDispatchHandler>();

  map.set('create_questionnaire', async (deps, ctx) =>
    handleCreateQuestionnaireLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
    ),
  );
  map.set('update_questionnaire', async (deps, ctx) =>
    handleUpdateQuestionnaireLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
    ),
  );
  map.set('publish_questionnaire', async (deps, ctx) =>
    handlePublishQuestionnaireLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiClinicQuestionnaireService (ai-cmd-ext-0.5). */
export const CLINIC_QUESTIONNAIRE_LOGIC_DISPATCH_MAP =
  buildClinicQuestionnaireLogicDispatchMap();
