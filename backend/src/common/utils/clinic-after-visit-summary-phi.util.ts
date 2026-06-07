import {
  decryptPhiValue,
  encryptPhiValue,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';
import {
  canAccessCustomerClinicalPhi,
  type CustomerClinicalPhiAccessContext,
} from './clinic-chart-access.util.js';

export const CLINIC_AFTER_VISIT_SUMMARY_PHI_TEXT_FIELDS = [
  'description',
] as const;

export type ClinicAfterVisitSummaryPhiTextField =
  (typeof CLINIC_AFTER_VISIT_SUMMARY_PHI_TEXT_FIELDS)[number];

export interface ClinicAfterVisitSummaryPhiCarrier {
  description?: string | null;
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

export function encryptClinicAfterVisitSummaryPhi<
  T extends ClinicAfterVisitSummaryPhiCarrier,
>(summary: T, businessKey: string): T {
  const next = { ...summary };
  for (const field of CLINIC_AFTER_VISIT_SUMMARY_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptClinicAfterVisitSummaryPhi<
  T extends ClinicAfterVisitSummaryPhiCarrier,
>(summary: T, businessKey: string): T {
  const next = { ...summary };
  for (const field of CLINIC_AFTER_VISIT_SUMMARY_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function maskClinicAfterVisitSummaryPhiFields<
  T extends ClinicAfterVisitSummaryPhiCarrier,
>(summary: T): T {
  const next = { ...summary };
  for (const field of CLINIC_AFTER_VISIT_SUMMARY_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function listClinicAfterVisitSummaryPhiFieldsRead(
  summary: ClinicAfterVisitSummaryPhiCarrier,
): ClinicAfterVisitSummaryPhiTextField[] {
  return CLINIC_AFTER_VISIT_SUMMARY_PHI_TEXT_FIELDS.filter(
    (field) =>
      typeof summary[field] === 'string' &&
      String(summary[field]).trim().length > 0,
  );
}

export function listClinicAfterVisitSummaryPhiFieldsTouched(
  before: ClinicAfterVisitSummaryPhiCarrier | null | undefined,
  after: ClinicAfterVisitSummaryPhiCarrier,
): ClinicAfterVisitSummaryPhiTextField[] {
  return CLINIC_AFTER_VISIT_SUMMARY_PHI_TEXT_FIELDS.filter((field) => {
    const next = after[field];
    return (
      next !== undefined &&
      next !== before?.[field] &&
      typeof next === 'string' &&
      next.trim().length > 0
    );
  });
}

export function canAccessClinicAfterVisitSummaryPhi(
  membershipRole: string,
  access: CustomerClinicalPhiAccessContext,
  userEmployeeId: string | null | undefined,
): boolean {
  return canAccessCustomerClinicalPhi(membershipRole, access, userEmployeeId);
}
