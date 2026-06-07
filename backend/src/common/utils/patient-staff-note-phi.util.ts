import {
  decryptPhiValue,
  encryptPhiValue,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';
import { canReadPatientStaffNotes } from './patient-staff-note-access.util.js';
import type { CustomerClinicalPhiAccessContext } from './clinic-chart-access.util.js';

export const PATIENT_STAFF_NOTE_PHI_TEXT_FIELDS = ['body'] as const;

export type PatientStaffNotePhiTextField =
  (typeof PATIENT_STAFF_NOTE_PHI_TEXT_FIELDS)[number];

export interface PatientStaffNotePhiCarrier {
  body?: string | null;
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

export function encryptPatientStaffNotePhi<
  T extends PatientStaffNotePhiCarrier,
>(note: T, businessKey: string): T {
  const next = { ...note };
  for (const field of PATIENT_STAFF_NOTE_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptPatientStaffNotePhi<
  T extends PatientStaffNotePhiCarrier,
>(note: T, businessKey: string): T {
  const next = { ...note };
  for (const field of PATIENT_STAFF_NOTE_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function maskPatientStaffNotePhiFields<
  T extends PatientStaffNotePhiCarrier,
>(note: T): T {
  const next = { ...note };
  for (const field of PATIENT_STAFF_NOTE_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function listPatientStaffNotePhiFieldsRead(
  note: PatientStaffNotePhiCarrier,
): PatientStaffNotePhiTextField[] {
  return PATIENT_STAFF_NOTE_PHI_TEXT_FIELDS.filter(
    (field) =>
      typeof note[field] === 'string' && String(note[field]).trim().length > 0,
  );
}

export function canAccessPatientStaffNotePhi(
  membershipRole: string,
  access: CustomerClinicalPhiAccessContext,
  userEmployeeId: string | null | undefined,
): boolean {
  return canReadPatientStaffNotes(
    { membershipRole, employeeId: userEmployeeId ?? null },
    access,
  );
}
