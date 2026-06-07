import {
  decryptPhiValue,
  encryptPhiValue,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';
import {
  canAccessCustomerClinicalPhi,
  type CustomerClinicalPhiAccessContext,
} from './clinic-chart-access.util.js';

export const PATIENT_ENCOUNTER_PHI_TEXT_FIELDS = ['visitNote'] as const;
export const PATIENT_ENCOUNTER_ADDENDUM_PHI_TEXT_FIELDS = ['body'] as const;

export type PatientEncounterPhiTextField =
  (typeof PATIENT_ENCOUNTER_PHI_TEXT_FIELDS)[number];
export type PatientEncounterAddendumPhiTextField =
  (typeof PATIENT_ENCOUNTER_ADDENDUM_PHI_TEXT_FIELDS)[number];

export interface PatientEncounterPhiCarrier {
  visitNote?: string | null;
}

export interface PatientEncounterAddendumPhiCarrier {
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

export function encryptPatientEncounterPhi<
  T extends PatientEncounterPhiCarrier,
>(encounter: T, businessKey: string): T {
  const next = { ...encounter };
  for (const field of PATIENT_ENCOUNTER_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptPatientEncounterPhi<
  T extends PatientEncounterPhiCarrier,
>(encounter: T, businessKey: string): T {
  const next = { ...encounter };
  for (const field of PATIENT_ENCOUNTER_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function maskPatientEncounterPhiFields<
  T extends PatientEncounterPhiCarrier,
>(encounter: T): T {
  const next = { ...encounter };
  for (const field of PATIENT_ENCOUNTER_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function encryptPatientEncounterAddendumPhi<
  T extends PatientEncounterAddendumPhiCarrier,
>(addendum: T, businessKey: string): T {
  const next = { ...addendum };
  for (const field of PATIENT_ENCOUNTER_ADDENDUM_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptPatientEncounterAddendumPhi<
  T extends PatientEncounterAddendumPhiCarrier,
>(addendum: T, businessKey: string): T {
  const next = { ...addendum };
  for (const field of PATIENT_ENCOUNTER_ADDENDUM_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function maskPatientEncounterAddendumPhiFields<
  T extends PatientEncounterAddendumPhiCarrier,
>(addendum: T): T {
  const next = { ...addendum };
  for (const field of PATIENT_ENCOUNTER_ADDENDUM_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function listPatientEncounterPhiFieldsRead(
  encounter: PatientEncounterPhiCarrier,
): PatientEncounterPhiTextField[] {
  return PATIENT_ENCOUNTER_PHI_TEXT_FIELDS.filter(
    (field) =>
      typeof encounter[field] === 'string' &&
      String(encounter[field]).trim().length > 0,
  );
}

export function listPatientEncounterPhiFieldsTouched(
  before: PatientEncounterPhiCarrier | null | undefined,
  after: PatientEncounterPhiCarrier,
): PatientEncounterPhiTextField[] {
  return PATIENT_ENCOUNTER_PHI_TEXT_FIELDS.filter((field) => {
    const next = after[field];
    return (
      next !== undefined &&
      next !== before?.[field] &&
      typeof next === 'string' &&
      next.trim().length > 0
    );
  });
}

export function listPatientEncounterAddendumPhiFieldsRead(
  addendum: PatientEncounterAddendumPhiCarrier,
): PatientEncounterAddendumPhiTextField[] {
  return PATIENT_ENCOUNTER_ADDENDUM_PHI_TEXT_FIELDS.filter(
    (field) =>
      typeof addendum[field] === 'string' &&
      String(addendum[field]).trim().length > 0,
  );
}

export function canAccessPatientEncounterPhi(
  membershipRole: string,
  access: CustomerClinicalPhiAccessContext,
  userEmployeeId: string | null | undefined,
): boolean {
  return canAccessCustomerClinicalPhi(membershipRole, access, userEmployeeId);
}
