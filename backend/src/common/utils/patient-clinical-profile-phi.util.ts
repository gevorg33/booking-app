import {
  decryptPhiValue,
  encryptPhiValue,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';
import {
  canAccessCustomerClinicalPhi,
  type CustomerClinicalPhiAccessContext,
} from './clinic-chart-access.util.js';

export const PATIENT_CLINICAL_PROFILE_PHI_TEXT_FIELDS = [
  'allergies',
  'chronicProblems',
  'emergencyContactName',
  'emergencyContactPhone',
  'emergencyContactRelationship',
  'bloodType',
] as const;

export type PatientClinicalProfilePhiTextField =
  (typeof PATIENT_CLINICAL_PROFILE_PHI_TEXT_FIELDS)[number];

export interface PatientClinicalProfilePhiCarrier {
  allergies?: string | null;
  chronicProblems?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  bloodType?: string | null;
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

export function encryptPatientClinicalProfilePhi<
  T extends PatientClinicalProfilePhiCarrier,
>(profile: T, businessKey: string): T {
  const next = { ...profile };
  for (const field of PATIENT_CLINICAL_PROFILE_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptPatientClinicalProfilePhi<
  T extends PatientClinicalProfilePhiCarrier,
>(profile: T, businessKey: string): T {
  const next = { ...profile };
  for (const field of PATIENT_CLINICAL_PROFILE_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function maskPatientClinicalProfilePhiFields<
  T extends PatientClinicalProfilePhiCarrier,
>(profile: T): T {
  const next = { ...profile };
  for (const field of PATIENT_CLINICAL_PROFILE_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function listPatientClinicalProfilePhiFieldsRead(
  profile: PatientClinicalProfilePhiCarrier,
): PatientClinicalProfilePhiTextField[] {
  return PATIENT_CLINICAL_PROFILE_PHI_TEXT_FIELDS.filter(
    (field) =>
      typeof profile[field] === 'string' &&
      String(profile[field]).trim().length > 0,
  );
}

export function listPatientClinicalProfilePhiFieldsTouched(
  before: PatientClinicalProfilePhiCarrier | null | undefined,
  after: PatientClinicalProfilePhiCarrier,
): PatientClinicalProfilePhiTextField[] {
  return PATIENT_CLINICAL_PROFILE_PHI_TEXT_FIELDS.filter((field) => {
    const next = after[field];
    return (
      next !== undefined &&
      next !== before?.[field] &&
      typeof next === 'string' &&
      next.trim().length > 0
    );
  });
}

export function canAccessPatientClinicalProfilePhi(
  membershipRole: string,
  access: CustomerClinicalPhiAccessContext,
  userEmployeeId: string | null | undefined,
): boolean {
  return canAccessCustomerClinicalPhi(membershipRole, access, userEmployeeId);
}
