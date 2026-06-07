import type {
  ClinicQuestionnaireAnswerMap,
  ClinicQuestionnaireAnswerOptionDefinition,
  ClinicQuestionnaireConstraintDefinition,
  ClinicQuestionnaireFlowQuestionView,
  ClinicQuestionnaireQuestionDefinition,
  ClinicQuestionType,
} from './clinic-questionnaire.types.js';
import { isChoiceQuestionType } from './clinic-questionnaire.types.js';

export interface ClinicQuestionnaireFlowContext {
  questions: ClinicQuestionnaireQuestionDefinition[];
  options: ClinicQuestionnaireAnswerOptionDefinition[];
  constraints: ClinicQuestionnaireConstraintDefinition[];
}

export function sortTopLevelQuestions(
  questions: ClinicQuestionnaireQuestionDefinition[],
): ClinicQuestionnaireQuestionDefinition[] {
  return questions
    .filter((question) => !question.parentQuestionId)
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
}

export function getChildQuestions(
  questions: ClinicQuestionnaireQuestionDefinition[],
  parentQuestionId: string,
): ClinicQuestionnaireQuestionDefinition[] {
  return questions
    .filter((question) => question.parentQuestionId === parentQuestionId)
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
}

export function getQuestionOptions(
  options: ClinicQuestionnaireAnswerOptionDefinition[],
  questionId: string,
): ClinicQuestionnaireAnswerOptionDefinition[] {
  return options
    .filter((option) => option.questionId === questionId)
    .slice()
    .sort((a, b) => a.sequence - b.sequence);
}

export function getConstraintsForQuestion(
  constraints: ClinicQuestionnaireConstraintDefinition[],
  questionId: string,
): ClinicQuestionnaireConstraintDefinition[] {
  return constraints.filter(
    (constraint) => constraint.questionId === questionId,
  );
}

export function questionIndexInFlow(
  questions: ClinicQuestionnaireQuestionDefinition[],
  questionId: string,
): number {
  return sortTopLevelQuestions(questions).findIndex(
    (question) => question.id === questionId,
  );
}

export function constraintQuestionIsEarlierInFlow(
  questions: ClinicQuestionnaireQuestionDefinition[],
  constraintQuestionId: string,
  currentSequence: number,
): boolean {
  const ordered = sortTopLevelQuestions(questions);
  const constraintIndex = ordered.findIndex(
    (question) => question.id === constraintQuestionId,
  );
  if (constraintIndex < 0) {
    return false;
  }
  return ordered[constraintIndex].sequence <= currentSequence;
}

export function answersMatchConstraint(
  answers: string[] | undefined,
  constraint: ClinicQuestionnaireConstraintDefinition,
  options: ClinicQuestionnaireAnswerOptionDefinition[],
): boolean {
  if (!answers?.length) {
    return false;
  }

  if (constraint.answerOptionId) {
    const option = options.find(
      (entry) => entry.id === constraint.answerOptionId,
    );
    if (!option) {
      return false;
    }
    return answers.includes(option.id) || answers.includes(option.value);
  }

  if (constraint.staticAnswer != null) {
    return answers.includes(constraint.staticAnswer);
  }

  return false;
}

export function questionConstraintsAreSatisfied(
  ctx: ClinicQuestionnaireFlowContext,
  question: ClinicQuestionnaireQuestionDefinition,
  answers: ClinicQuestionnaireAnswerMap,
): boolean {
  const constraints = getConstraintsForQuestion(ctx.constraints, question.id);
  if (!constraints.length) {
    return true;
  }

  return constraints.every((constraint) => {
    const constraintAnswers = answers[constraint.constraintQuestionId];
    if (
      !constraintQuestionIsEarlierInFlow(
        ctx.questions,
        constraint.constraintQuestionId,
        question.sequence,
      )
    ) {
      return false;
    }
    return answersMatchConstraint(constraintAnswers, constraint, ctx.options);
  });
}

export function resolveInitialQuestionId(
  ctx: ClinicQuestionnaireFlowContext,
  answers: ClinicQuestionnaireAnswerMap = {},
): string | null {
  for (const question of sortTopLevelQuestions(ctx.questions)) {
    if (question.type === 'display') {
      continue;
    }
    if (questionConstraintsAreSatisfied(ctx, question, answers)) {
      return question.id;
    }
  }
  return null;
}

export function resolveNextQuestionId(
  ctx: ClinicQuestionnaireFlowContext,
  currentQuestionId: string | null,
  answers: ClinicQuestionnaireAnswerMap,
): string | null {
  const ordered = sortTopLevelQuestions(ctx.questions);
  if (!currentQuestionId) {
    return resolveInitialQuestionId(ctx, answers);
  }

  const currentIndex = ordered.findIndex(
    (question) => question.id === currentQuestionId,
  );
  if (currentIndex < 0) {
    return resolveInitialQuestionId(ctx, answers);
  }

  for (let index = currentIndex + 1; index < ordered.length; index += 1) {
    const candidate = ordered[index];
    if (
      candidate.type === 'display' &&
      !questionConstraintsAreSatisfied(ctx, candidate, answers)
    ) {
      continue;
    }
    if (questionConstraintsAreSatisfied(ctx, candidate, answers)) {
      return candidate.id;
    }
  }

  return null;
}

export function mapQuestionToFlowView(
  ctx: ClinicQuestionnaireFlowContext,
  question: ClinicQuestionnaireQuestionDefinition,
): ClinicQuestionnaireFlowQuestionView {
  const childQuestions = getChildQuestions(ctx.questions, question.id).map(
    (child) => mapQuestionToFlowView(ctx, child),
  );

  return {
    id: question.id,
    type: question.type,
    text: question.text,
    subText: question.subText,
    placeholder: question.placeholder,
    required: question.required,
    repeatEnabled: question.repeatEnabled,
    validation: {
      maxLength: question.maxLength,
      maxCount: question.maxCount,
      regex: question.regexPattern,
      errorMessage: question.validationErrorMessage,
      maxDate: question.validationMaxDate,
    },
    answerOptions: getQuestionOptions(ctx.options, question.id).map(
      (option) => ({
        id: option.id,
        display: option.display,
        value: option.value,
        sequence: option.sequence,
      }),
    ),
    ...(childQuestions.length ? { childQuestions } : {}),
  };
}

export function collectQuestionsForValidation(
  ctx: ClinicQuestionnaireFlowContext,
  questionId: string,
): ClinicQuestionnaireQuestionDefinition[] {
  const question = ctx.questions.find((entry) => entry.id === questionId);
  if (!question) {
    return [];
  }
  return [question, ...getChildQuestions(ctx.questions, question.id)];
}

export function normalizeSubmittedAnswers(
  type: ClinicQuestionType,
  values: string[] | undefined,
): string[] {
  if (!values?.length) {
    return [];
  }
  if (isChoiceQuestionType(type)) {
    return values.map((value) => value.trim()).filter(Boolean);
  }
  return values
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
}

export function mergeAnswerMap(
  existing: ClinicQuestionnaireAnswerMap,
  updates: ClinicQuestionnaireAnswerMap,
): ClinicQuestionnaireAnswerMap {
  return { ...existing, ...updates };
}
