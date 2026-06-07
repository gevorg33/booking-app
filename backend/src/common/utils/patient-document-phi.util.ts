import {
  decryptPhiValue,
  encryptPhiValue,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';
import {
  canAccessCustomerClinicalPhi,
  type CustomerClinicalPhiAccessContext,
} from './clinic-chart-access.util.js';

export const PATIENT_DOCUMENT_PHI_TEXT_FIELDS = [
  'title',
  'originalFileName',
] as const;

export type PatientDocumentPhiTextField =
  (typeof PATIENT_DOCUMENT_PHI_TEXT_FIELDS)[number];

export interface PatientDocumentPhiCarrier {
  title?: string | null;
  originalFileName?: string | null;
}

function encryptOptionalText(
  value: string | null | undefined,
  businessKey: string,
): string | null | undefined {
  if (value == null || !value.trim()) return value;
  return encryptPhiValue(value, businessKey);
}

function decryptOptionalText(
  value: string | null | undefined,
  businessKey: string,
): string | null | undefined {
  if (value == null || !isPhiEncryptedValue(value)) return value;
  return decryptPhiValue(value, businessKey);
}

export function encryptPatientDocumentPhi<T extends PatientDocumentPhiCarrier>(
  document: T,
  businessKey: string,
): T {
  const next = { ...document };
  for (const field of PATIENT_DOCUMENT_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptPatientDocumentPhi<T extends PatientDocumentPhiCarrier>(
  document: T,
  businessKey: string,
): T {
  const next = { ...document };
  for (const field of PATIENT_DOCUMENT_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function maskPatientDocumentPhiFields<
  T extends PatientDocumentPhiCarrier,
>(document: T): T {
  const next = { ...document };
  for (const field of PATIENT_DOCUMENT_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function listPatientDocumentPhiFieldsRead(
  document: PatientDocumentPhiCarrier,
): PatientDocumentPhiTextField[] {
  return PATIENT_DOCUMENT_PHI_TEXT_FIELDS.filter(
    (field) =>
      typeof document[field] === 'string' &&
      String(document[field]).trim().length > 0,
  );
}

export function canAccessPatientDocumentPhi(
  membershipRole: string,
  access: CustomerClinicalPhiAccessContext,
  userEmployeeId: string | null | undefined,
): boolean {
  return canAccessCustomerClinicalPhi(
    membershipRole,
    access,
    userEmployeeId ?? null,
  );
}
