import type {
  ClinicQuestionnaireAnswerMap,
  ClinicQuestionValidationMaxDate,
} from './clinic-questionnaire.types.js';
import type { ClinicQuestionnaireFlowContext } from './clinic-questionnaire-flow.util.js';
import {
  collectQuestionsForValidation,
  normalizeSubmittedAnswers,
} from './clinic-questionnaire-flow.util.js';
import {
  isAnsweredQuestionType,
  isChoiceQuestionType,
} from './clinic-questionnaire.types.js';

function resolveMaxDate(
  validationMaxDate: ClinicQuestionValidationMaxDate,
  now = new Date(),
): Date | null {
  if (validationMaxDate === 'none') {
    return null;
  }
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  if (validationMaxDate === 'today') {
    const end = new Date(today);
    end.setUTCHours(23, 59, 59, 999);
    return end;
  }
  const yesterdayEnd = new Date(today);
  yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() - 1);
  yesterdayEnd.setUTCHours(23, 59, 59, 999);
  return yesterdayEnd;
}

export function validateQuestionAnswers(
  ctx: ClinicQuestionnaireFlowContext,
  questionId: string,
  answers: ClinicQuestionnaireAnswerMap,
): string[] {
  const errors: string[] = [];
  const questions = collectQuestionsForValidation(ctx, questionId);

  for (const question of questions) {
    if (!isAnsweredQuestionType(question.type)) {
      continue;
    }

    const values = normalizeSubmittedAnswers(
      question.type,
      answers[question.id],
    );
    const errorPrefix =
      question.validationErrorMessage?.trim() ||
      `Question ${question.id} failed validation`;

    if (question.required && question.type !== 'group' && !values.length) {
      errors.push(errorPrefix);
      continue;
    }

    if (!values.length) {
      continue;
    }

    if (question.regexPattern) {
      const regex = new RegExp(question.regexPattern);
      if (!values.every((value) => regex.test(value))) {
        errors.push(errorPrefix);
      }
    }

    if (
      question.maxLength != null &&
      values.some((value) => value.length > question.maxLength!)
    ) {
      errors.push(errorPrefix);
    }

    if (
      question.maxCount != null &&
      question.type === 'multiple_choice' &&
      values.length > question.maxCount
    ) {
      errors.push(errorPrefix);
    }

    if (question.type === 'date') {
      const maxDate = resolveMaxDate(question.validationMaxDate);
      if (maxDate) {
        const parsed = new Date(values[0]);
        if (
          Number.isNaN(parsed.getTime()) ||
          parsed.getTime() > maxDate.getTime()
        ) {
          errors.push(errorPrefix);
        }
      }
    }

    if (isChoiceQuestionType(question.type)) {
      const allowed = new Set(
        ctx.options
          .filter((option) => option.questionId === question.id)
          .flatMap((option) => [option.id, option.value]),
      );
      if (values.some((value) => !allowed.has(value))) {
        errors.push(errorPrefix);
      }
    }
  }

  return errors;
}

export function validateAnswerBatch(
  ctx: ClinicQuestionnaireFlowContext,
  updates: ClinicQuestionnaireAnswerMap,
): string[] {
  return Object.keys(updates).flatMap((questionId) =>
    validateQuestionAnswers(ctx, questionId, updates),
  );
}
