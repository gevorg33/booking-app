export const PATIENT_DOCUMENT_CATEGORIES = [
  'lab_report',
  'referral_letter',
  'imaging_report',
  'other',
] as const;

export type PatientDocumentCategory =
  (typeof PATIENT_DOCUMENT_CATEGORIES)[number];

export function isPatientDocumentCategory(
  value: string | null | undefined,
): value is PatientDocumentCategory {
  return (
    typeof value === 'string' &&
    (PATIENT_DOCUMENT_CATEGORIES as readonly string[]).includes(value)
  );
}

export function assertPatientDocumentCategory(
  value: string,
): PatientDocumentCategory {
  if (!isPatientDocumentCategory(value)) {
    throw new Error(`Invalid patient document category: ${value}`);
  }
  return value;
}

export function normalizePatientDocumentCategoryFilter(
  value: string | null | undefined,
): PatientDocumentCategory | null {
  if (value == null || value === '' || value === 'all') return null;
  return isPatientDocumentCategory(value) ? value : null;
}
