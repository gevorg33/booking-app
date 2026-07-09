import type { ClinicQuestionnairesService } from '../clinic-questionnaires/clinic-questionnaires.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  resolveClinicQuestionnaireFromList,
  type ClinicQuestionnaireSummaryLike,
} from './ai-clinic-questionnaire.util.js';

export interface ClinicQuestionnaireLogicDeps {
  questionnairesService: Pick<
    ClinicQuestionnairesService,
    | 'listQuestionnaires'
    | 'createQuestionnaire'
    | 'updateQuestionnaire'
    | 'publishQuestionnaire'
  >;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

async function resolveQuestionnaireOrFail(
  deps: ClinicQuestionnaireLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
  action: string,
): Promise<
  | { ok: true; questionnaire: ClinicQuestionnaireSummaryLike }
  | { ok: false; result: CommandResult }
> {
  const questionnaires = await deps.questionnairesService.listQuestionnaires(
    businessId,
    userId,
  );
  const questionnaire = resolveClinicQuestionnaireFromList(
    questionnaires,
    params,
  );
  if (!questionnaire) {
    return {
      ok: false,
      result: failure(
        action,
        'Which questionnaire is this? Provide questionnaireId, questionnaireCode, or questionnaireName.',
        { clarify: true, missing: ['questionnaireId', 'questionnaireCode'] },
      ),
    };
  }
  return { ok: true, questionnaire };
}

export async function handleCreateQuestionnaireLogic(
  deps: ClinicQuestionnaireLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'create_questionnaire';
  const code = typeof params.code === 'string' ? params.code.trim() : '';
  const internalName =
    typeof params.internalName === 'string' ? params.internalName.trim() : '';
  const title = typeof params.title === 'string' ? params.title.trim() : '';

  if (!code || !internalName || !title) {
    return failure(
      action,
      'What should this questionnaire be called? Provide code, internalName, and title.',
      { clarify: true, missing: ['code', 'internalName', 'title'] },
    );
  }

  const introTitle =
    typeof params.introTitle === 'string' ? params.introTitle : undefined;
  const introBody =
    typeof params.introBody === 'string' ? params.introBody : undefined;

  try {
    const questionnaire = await deps.questionnairesService.createQuestionnaire(
      businessId,
      userId,
      {
        code,
        internalName,
        title,
        ...(introTitle !== undefined ? { introTitle } : {}),
        ...(introBody !== undefined ? { introBody } : {}),
      },
    );
    return success(action, `Created the "${title}" questionnaire as a draft.`, {
      questionnaire,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not create the questionnaire.');
  }
}

export async function handleUpdateQuestionnaireLogic(
  deps: ClinicQuestionnaireLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'update_questionnaire';
  const resolved = await resolveQuestionnaireOrFail(
    deps,
    businessId,
    userId,
    params,
    action,
  );
  if (!resolved.ok) return resolved.result;

  const internalName =
    typeof params.internalName === 'string' ? params.internalName.trim() : undefined;
  const title = typeof params.title === 'string' ? params.title.trim() : undefined;
  const introTitle =
    typeof params.introTitle === 'string' ? params.introTitle : undefined;
  const introBody =
    typeof params.introBody === 'string' ? params.introBody : undefined;
  const isActive =
    typeof params.isActive === 'boolean' ? params.isActive : undefined;

  if (
    internalName === undefined &&
    title === undefined &&
    introTitle === undefined &&
    introBody === undefined &&
    isActive === undefined
  ) {
    return failure(
      action,
      `What should I change on "${resolved.questionnaire.title}"? Provide a new title, internalName, intro text, or active status.`,
    );
  }

  try {
    const questionnaire = await deps.questionnairesService.updateQuestionnaire(
      businessId,
      userId,
      resolved.questionnaire.id,
      {
        ...(internalName !== undefined ? { internalName } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(introTitle !== undefined ? { introTitle } : {}),
        ...(introBody !== undefined ? { introBody } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    );
    return success(action, `Updated the "${questionnaire.title}" questionnaire.`, {
      questionnaire,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not update the questionnaire.');
  }
}

export async function handlePublishQuestionnaireLogic(
  deps: ClinicQuestionnaireLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'publish_questionnaire';
  const resolved = await resolveQuestionnaireOrFail(
    deps,
    businessId,
    userId,
    params,
    action,
  );
  if (!resolved.ok) return resolved.result;

  try {
    const questionnaire = await deps.questionnairesService.publishQuestionnaire(
      businessId,
      userId,
      resolved.questionnaire.id,
    );
    return success(action, `Published the "${questionnaire.title}" questionnaire.`, {
      questionnaire,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not publish the questionnaire.');
  }
}
