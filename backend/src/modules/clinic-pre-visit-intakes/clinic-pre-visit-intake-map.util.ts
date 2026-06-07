import type { ClinicQuestionnaireFlowQuestionView } from '../../common/utils/clinic-questionnaire.types.js';
import type { ClinicPreVisitIntake } from './entities/clinic-pre-visit-intake.entity.js';
import type { ClinicQuestionnaire } from '../clinic-questionnaires/entities/clinic-questionnaire.entity.js';

export function mapPreVisitIntakeSummary(
  intake: ClinicPreVisitIntake,
  questionnaire: Pick<
    ClinicQuestionnaire,
    'id' | 'title' | 'code' | 'revision'
  >,
) {
  return {
    id: intake.id,
    businessId: intake.businessId,
    customerId: intake.customerId,
    bookingId: intake.bookingId ?? null,
    questionnaireId: intake.questionnaireId,
    responseId: intake.responseId ?? null,
    status: intake.status,
    assignedByEmployeeId: intake.assignedByEmployeeId ?? null,
    completedAt: intake.completedAt?.toISOString() ?? null,
    createdAt: intake.createdAt.toISOString(),
    updatedAt: intake.updatedAt.toISOString(),
    questionnaire: {
      id: questionnaire.id,
      title: questionnaire.title,
      code: questionnaire.code,
      revision: questionnaire.revision,
    },
  };
}

export function mapPreVisitIntakeFlowView(input: {
  intake: ClinicPreVisitIntake;
  questionnaire: Pick<
    ClinicQuestionnaire,
    'id' | 'title' | 'code' | 'revision' | 'introTitle' | 'introBody'
  >;
  nextQuestion: ClinicQuestionnaireFlowQuestionView | null;
  answers: Record<string, string[]>;
  isCompleted: boolean;
}) {
  return {
    ...mapPreVisitIntakeSummary(input.intake, input.questionnaire),
    introTitle: input.questionnaire.introTitle ?? null,
    introBody: input.questionnaire.introBody ?? null,
    answers: input.answers,
    nextQuestion: input.nextQuestion,
    isCompleted: input.isCompleted,
  };
}
