export const CLINIC_AFTER_VISIT_SUMMARY_MIN_LENGTH = 1;
export const CLINIC_AFTER_VISIT_SUMMARY_MAX_LENGTH = 16000;

export function normalizeClinicAfterVisitSummaryDescription(
  value: string,
): string {
  return value.trim();
}

export function isValidClinicAfterVisitSummaryDescription(
  value: string | null | undefined,
): boolean {
  if (typeof value !== 'string') return false;
  const normalized = normalizeClinicAfterVisitSummaryDescription(value);
  return (
    normalized.length >= CLINIC_AFTER_VISIT_SUMMARY_MIN_LENGTH &&
    normalized.length <= CLINIC_AFTER_VISIT_SUMMARY_MAX_LENGTH
  );
}

export function assertValidClinicAfterVisitSummaryDescription(
  value: string,
): string {
  const normalized = normalizeClinicAfterVisitSummaryDescription(value);
  if (!isValidClinicAfterVisitSummaryDescription(normalized)) {
    throw new Error('After-visit summary description is invalid');
  }
  return normalized;
}

export function clinicAfterVisitSummaryHasPhiContent(
  summary: Pick<{ description?: string | null }, 'description'>,
): boolean {
  return !!summary.description?.trim();
}
