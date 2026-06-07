import type { ClinicQuestionnaire } from './entities/clinic-questionnaire.entity.js';
import type { ClinicQuestionnaireQuestion } from './entities/clinic-questionnaire-question.entity.js';
import type { ClinicQuestionnaireAnswerOption } from './entities/clinic-questionnaire-answer-option.entity.js';
import type { ClinicQuestionnaireConstraint } from './entities/clinic-questionnaire-constraint.entity.js';
import type { ClinicQuestionnaireResponse } from './entities/clinic-questionnaire-response.entity.js';
import type {
  ClinicQuestionnaireAnswerMap,
  ClinicQuestionType,
  ClinicQuestionValidationMaxDate,
} from '../../common/utils/clinic-questionnaire.types.js';
import type { ClinicQuestionnaireFlowContext } from '../../common/utils/clinic-questionnaire-flow.util.js';
import {
  mapQuestionToFlowView,
  sortTopLevelQuestions,
} from '../../common/utils/clinic-questionnaire-flow.util.js';

export function mapQuestionEntity(
  question: ClinicQuestionnaireQuestion,
): ClinicQuestionnaireFlowContext['questions'][number] {
  return {
    id: question.id,
    parentQuestionId: question.parentQuestionId ?? null,
    sequence: question.sequence,
    type: question.type as ClinicQuestionType,
    text: question.text ?? null,
    subText: question.subText ?? null,
    placeholder: question.placeholder ?? null,
    required: question.required,
    repeatEnabled: question.repeatEnabled,
    maxLength: question.maxLength ?? null,
    maxCount: question.maxCount ?? null,
    regexPattern: question.regexPattern ?? null,
    validationErrorMessage: question.validationErrorMessage ?? null,
    validationMaxDate:
      question.validationMaxDate as ClinicQuestionValidationMaxDate,
  };
}

export function buildFlowContextFromEntities(input: {
  questions: ClinicQuestionnaireQuestion[];
  options: ClinicQuestionnaireAnswerOption[];
  constraints: ClinicQuestionnaireConstraint[];
}): ClinicQuestionnaireFlowContext {
  return {
    questions: input.questions.map(mapQuestionEntity),
    options: input.options.map((option) => ({
      id: option.id,
      questionId: option.questionId,
      display: option.display,
      value: option.value,
      sequence: option.sequence,
    })),
    constraints: input.constraints.map((constraint) => ({
      id: constraint.id,
      questionnaireId: constraint.questionnaireId,
      questionId: constraint.questionId,
      constraintQuestionId: constraint.constraintQuestionId,
      answerOptionId: constraint.answerOptionId ?? null,
      staticAnswer: constraint.staticAnswer ?? null,
    })),
  };
}

export function mapQuestionnaireSummary(questionnaire: ClinicQuestionnaire) {
  return {
    id: questionnaire.id,
    businessId: questionnaire.businessId,
    code: questionnaire.code,
    internalName: questionnaire.internalName,
    title: questionnaire.title,
    introTitle: questionnaire.introTitle ?? null,
    introBody: questionnaire.introBody ?? null,
    revision: questionnaire.revision,
    status: questionnaire.status,
    isActive: questionnaire.isActive,
    publishedAt: questionnaire.publishedAt?.toISOString() ?? null,
    createdAt: questionnaire.createdAt.toISOString(),
    updatedAt: questionnaire.updatedAt.toISOString(),
  };
}

export function mapQuestionnaireDefinition(
  questionnaire: ClinicQuestionnaire,
  ctx: ClinicQuestionnaireFlowContext,
) {
  return {
    ...mapQuestionnaireSummary(questionnaire),
    questions: sortTopLevelQuestions(ctx.questions).map((question) =>
      mapQuestionToFlowView(ctx, question),
    ),
    constraints: ctx.constraints,
  };
}

export function mapQuestionnaireResponseView(
  response: ClinicQuestionnaireResponse,
  questionnaire: ClinicQuestionnaire,
  ctx: ClinicQuestionnaireFlowContext,
  nextQuestionId: string | null,
) {
  const nextQuestion = nextQuestionId
    ? ctx.questions.find((question) => question.id === nextQuestionId)
    : null;

  return {
    id: response.id,
    questionnaireId: response.questionnaireId,
    businessId: response.businessId,
    customerId: response.customerId ?? null,
    bookingId: response.bookingId ?? null,
    status: response.status,
    currentQuestionId: response.currentQuestionId ?? null,
    answers: response.answers,
    completedAt: response.completedAt?.toISOString() ?? null,
    questionnaire: {
      id: questionnaire.id,
      code: questionnaire.code,
      title: questionnaire.title,
      revision: questionnaire.revision,
      introTitle: questionnaire.introTitle ?? null,
      introBody: questionnaire.introBody ?? null,
    },
    nextQuestion: nextQuestion
      ? mapQuestionToFlowView(ctx, nextQuestion)
      : null,
    isCompleted: response.status === 'completed',
  };
}
