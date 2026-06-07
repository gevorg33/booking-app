import type { ClinicPreVisitIntakeStatus } from './entities/clinic-pre-visit-intake.entity.js';

export const CLINIC_DEFAULT_INTAKE_QUESTIONNAIRE_CODES = [
  'pre-visit-intake',
  'referral-intake',
] as const;

export function mapResponseStatusToIntakeStatus(
  responseStatus: string | null | undefined,
  currentIntakeStatus: ClinicPreVisitIntakeStatus,
): ClinicPreVisitIntakeStatus {
  if (responseStatus === 'completed') return 'completed';
  if (responseStatus === 'in_progress') return 'in_progress';
  return currentIntakeStatus;
}

export function canStartPreVisitIntake(
  status: ClinicPreVisitIntakeStatus,
): boolean {
  return status === 'assigned';
}

export function canSubmitPreVisitIntakeAnswers(
  status: ClinicPreVisitIntakeStatus,
): boolean {
  return status === 'assigned' || status === 'in_progress';
}

export function isPreVisitIntakeComplete(
  status: ClinicPreVisitIntakeStatus,
): boolean {
  return status === 'completed';
}

export function pickDefaultIntakeQuestionnaireId(input: {
  preferredQuestionnaireId?: string | null;
  questionnaires: Array<{
    id: string;
    code: string;
    status: string;
    isActive: boolean;
  }>;
}): string | null {
  if (input.preferredQuestionnaireId) {
    return input.preferredQuestionnaireId;
  }

  const published = input.questionnaires.filter(
    (entry) => entry.status === 'published' && entry.isActive,
  );
  if (!published.length) return null;

  for (const code of CLINIC_DEFAULT_INTAKE_QUESTIONNAIRE_CODES) {
    const match = published.find((entry) => entry.code === code);
    if (match) return match.id;
  }

  return published[0]?.id ?? null;
}
