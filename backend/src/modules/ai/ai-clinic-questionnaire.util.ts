/** ai-cmd-dashboard-6.8.1 — clinic questionnaire CRUD + publish (dashboard, manager+). */

export const DASHBOARD_CLINIC_QUESTIONNAIRE_MUTATE_INTENTS = [
  'create_questionnaire',
  'update_questionnaire',
  'publish_questionnaire',
] as const;

export type ClinicQuestionnaireIntent =
  (typeof DASHBOARD_CLINIC_QUESTIONNAIRE_MUTATE_INTENTS)[number];

const CLINIC_QUESTIONNAIRE_INTENT_SET = new Set<string>(
  DASHBOARD_CLINIC_QUESTIONNAIRE_MUTATE_INTENTS,
);

export function isClinicQuestionnaireIntent(
  action: string,
): action is ClinicQuestionnaireIntent {
  return CLINIC_QUESTIONNAIRE_INTENT_SET.has(action);
}

export interface ClinicQuestionnaireSummaryLike {
  id: string;
  code: string;
  internalName: string;
  title: string;
}

export function resolveClinicQuestionnaireFromList<
  T extends ClinicQuestionnaireSummaryLike,
>(questionnaires: T[], params: Record<string, unknown>): T | undefined {
  const id =
    typeof params.questionnaireId === 'string' && params.questionnaireId.trim()
      ? params.questionnaireId.trim()
      : undefined;
  if (id) return questionnaires.find((entry) => entry.id === id);

  const name =
    typeof params.questionnaireCode === 'string' &&
    params.questionnaireCode.trim()
      ? params.questionnaireCode.trim()
      : typeof params.questionnaireName === 'string' &&
          params.questionnaireName.trim()
        ? params.questionnaireName.trim()
        : undefined;
  if (!name) return undefined;

  const needle = name.toLowerCase();
  return (
    questionnaires.find((entry) => entry.code.toLowerCase() === needle) ??
    questionnaires.find(
      (entry) => entry.internalName.toLowerCase() === needle,
    ) ??
    questionnaires.find((entry) => entry.title.toLowerCase() === needle) ??
    questionnaires.find((entry) => entry.title.toLowerCase().includes(needle))
  );
}
