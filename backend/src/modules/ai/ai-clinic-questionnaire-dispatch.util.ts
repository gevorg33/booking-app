import type { CommandResult } from './command-completion.types.js';
import {
  CLINIC_QUESTIONNAIRE_LOGIC_DISPATCH_MAP,
  type ClinicQuestionnaireDispatchContext,
  type ClinicQuestionnaireLogicDispatchHandler,
} from './ai-clinic-questionnaire-dispatch.build.js';
import type { ClinicQuestionnaireLogicDeps } from './ai-clinic-questionnaire.logic.js';

export function getClinicQuestionnaireLogicDispatchHandler(
  action: string,
): ClinicQuestionnaireLogicDispatchHandler | undefined {
  return CLINIC_QUESTIONNAIRE_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchClinicQuestionnaireLogicIntent(
  deps: ClinicQuestionnaireLogicDeps,
  ctx: ClinicQuestionnaireDispatchContext,
): Promise<CommandResult | null> {
  const handler = CLINIC_QUESTIONNAIRE_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function clinicQuestionnaireDispatchMapHas(action: string): boolean {
  return CLINIC_QUESTIONNAIRE_LOGIC_DISPATCH_MAP.has(action);
}
