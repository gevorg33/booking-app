import { Injectable } from '@nestjs/common';
import { ClinicQuestionnairesService } from '../clinic-questionnaires/clinic-questionnaires.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateQuestionnaireLogic,
  handlePublishQuestionnaireLogic,
  handleUpdateQuestionnaireLogic,
  type ClinicQuestionnaireLogicDeps,
} from './ai-clinic-questionnaire.logic.js';
import { dispatchClinicQuestionnaireLogicIntent } from './ai-clinic-questionnaire-dispatch.util.js';
import type { ClinicQuestionnaireDispatchContext } from './ai-clinic-questionnaire-dispatch.build.js';

@Injectable()
export class AiClinicQuestionnaireService {
  private readonly deps: ClinicQuestionnaireLogicDeps;

  constructor(questionnairesService: ClinicQuestionnairesService) {
    this.deps = { questionnairesService };
  }

  handleCreateQuestionnaire(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleCreateQuestionnaireLogic(this.deps, businessId, userId, params);
  }

  handleUpdateQuestionnaire(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleUpdateQuestionnaireLogic(this.deps, businessId, userId, params);
  }

  handlePublishQuestionnaire(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handlePublishQuestionnaireLogic(this.deps, businessId, userId, params);
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a clinic-questionnaire intent. */
  dispatchIntent(
    ctx: ClinicQuestionnaireDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchClinicQuestionnaireLogicIntent(this.deps, ctx);
  }
}
