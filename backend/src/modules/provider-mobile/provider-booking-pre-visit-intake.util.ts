/** prov-exp-1.5 — read-only pre-visit intake summary on provider booking detail. */

import { clinicLabTestOffersPreVisitIntake } from '../../common/utils/clinic-public-pre-visit-intake.util.js';
import {
  getQuestionOptions,
  sortTopLevelQuestions,
  type ClinicQuestionnaireFlowContext,
} from '../../common/utils/clinic-questionnaire-flow.util.js';
import type { ClinicQuestionnaireAnswerMap } from '../../common/utils/clinic-questionnaire.types.js';
import { isChoiceQuestionType } from '../../common/utils/clinic-questionnaire.types.js';
import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import type { ClinicPreVisitIntakeStatus } from '../clinic-pre-visit-intakes/entities/clinic-pre-visit-intake.entity.js';

export const PROVIDER_PRE_VISIT_INTAKE_SUMMARY_ANSWER_LIMIT = 6;

export const SALON_VERTICAL_BUSINESS_TYPES = [
  'hair_salon',
  'spa',
  'beauty_salon',
  'barbershop',
  'nail_salon',
] as const;

export interface ProviderPreVisitIntakeAnswerRow {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface ProviderPreVisitIntakeSummaryView {
  visible: boolean;
  intakeId: string | null;
  questionnaireTitle: string | null;
  status: ClinicPreVisitIntakeStatus | 'none';
  completedAt: string | null;
  answers: ProviderPreVisitIntakeAnswerRow[];
  totalAnswerCount: number;
  hasMoreAnswers: boolean;
  dashboardFullAnswers: {
    path: string;
    bookingId: string;
    intakeId: string | null;
    canOpen: boolean;
  } | null;
}

export function isSalonVerticalBusinessType(
  businessType: string | undefined | null,
): boolean {
  if (!businessType) return false;
  return (SALON_VERTICAL_BUSINESS_TYPES as readonly string[]).includes(
    businessType,
  );
}

export function serviceOffersProviderPreVisitIntake(input: {
  businessType: string | undefined | null;
  serviceMetadata: Record<string, unknown> | null | undefined;
  hasPublishedQuestionnaire: boolean;
}): boolean {
  if (!input.hasPublishedQuestionnaire) return false;
  if (isClinicVerticalBusinessType(input.businessType)) {
    return clinicLabTestOffersPreVisitIntake(input.serviceMetadata, true);
  }
  return isSalonVerticalBusinessType(input.businessType);
}

export function shouldShowProviderPreVisitIntakeSection(input: {
  serviceOffersIntake: boolean;
  hasIntakeRecord: boolean;
}): boolean {
  return input.serviceOffersIntake || input.hasIntakeRecord;
}

export function formatProviderQuestionnaireAnswerText(
  question: Pick<
    ClinicQuestionnaireFlowContext['questions'][number],
    'type'
  >,
  values: string[],
  options: ClinicQuestionnaireFlowContext['options'],
): string {
  if (!values.length) return '—';

  if (isChoiceQuestionType(question.type)) {
    const questionOptions = options.filter((option) =>
      values.some(
        (value) => value === option.value || value === option.id,
      ),
    );
    if (questionOptions.length) {
      return questionOptions.map((option) => option.display).join(', ');
    }
  }

  return values.join(', ');
}

export function buildProviderPreVisitIntakeAnswerRows(
  ctx: ClinicQuestionnaireFlowContext,
  answers: ClinicQuestionnaireAnswerMap,
  limit = PROVIDER_PRE_VISIT_INTAKE_SUMMARY_ANSWER_LIMIT,
): { rows: ProviderPreVisitIntakeAnswerRow[]; totalAnswerCount: number } {
  const rows: ProviderPreVisitIntakeAnswerRow[] = [];
  let totalAnswerCount = 0;

  for (const question of sortTopLevelQuestions(ctx.questions)) {
    const values = answers[question.id];
    if (!values?.length) continue;

    totalAnswerCount += 1;
    if (rows.length >= limit) continue;

    rows.push({
      questionId: question.id,
      questionText: question.text?.trim() || 'Question',
      answerText: formatProviderQuestionnaireAnswerText(
        question,
        values,
        getQuestionOptions(ctx.options, question.id),
      ),
    });
  }

  return { rows, totalAnswerCount };
}

export function buildProviderDashboardBookingIntakePath(
  bookingId: string,
): string {
  return `/dashboard/bookings?bookingId=${encodeURIComponent(bookingId)}`;
}

export function buildProviderPreVisitIntakeSummaryView(input: {
  visible: boolean;
  intakeId?: string | null;
  questionnaireTitle?: string | null;
  status?: ClinicPreVisitIntakeStatus | 'none';
  completedAt?: string | null;
  answers?: ProviderPreVisitIntakeAnswerRow[];
  totalAnswerCount?: number;
  bookingId: string;
  canOpenDashboard: boolean;
}): ProviderPreVisitIntakeSummaryView {
  const answers = input.answers ?? [];
  const totalAnswerCount = input.totalAnswerCount ?? answers.length;

  return {
    visible: input.visible,
    intakeId: input.intakeId ?? null,
    questionnaireTitle: input.questionnaireTitle ?? null,
    status: input.status ?? 'none',
    completedAt: input.completedAt ?? null,
    answers,
    totalAnswerCount,
    hasMoreAnswers: totalAnswerCount > answers.length,
    dashboardFullAnswers: input.visible
      ? {
          path: buildProviderDashboardBookingIntakePath(input.bookingId),
          bookingId: input.bookingId,
          intakeId: input.intakeId ?? null,
          canOpen: input.canOpenDashboard,
        }
      : null,
  };
}
