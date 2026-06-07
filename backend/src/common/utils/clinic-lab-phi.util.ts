import {
  decryptPhiValue,
  encryptPhiValue,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';
import {
  canAccessBookingPhi,
  type BookingPhiAccessTarget,
} from './phi-minimum-access.util.js';

export const CLINIC_RESULT_PHI_TEXT_FIELDS = [
  'comment',
  'reviewComment',
  'releaseComment',
] as const;

export const CLINIC_ORDER_PHI_TEXT_FIELDS = [
  'comment',
  'customCancellationReason',
] as const;

export const CLINIC_MEASUREMENT_PHI_TEXT_FIELDS = [
  'value',
  'labComment',
] as const;

export type ClinicResultPhiTextField =
  (typeof CLINIC_RESULT_PHI_TEXT_FIELDS)[number];
export type ClinicOrderPhiTextField =
  (typeof CLINIC_ORDER_PHI_TEXT_FIELDS)[number];
export type ClinicMeasurementPhiTextField =
  (typeof CLINIC_MEASUREMENT_PHI_TEXT_FIELDS)[number];

export type ClinicLabPhiFieldName =
  | ClinicResultPhiTextField
  | ClinicOrderPhiTextField
  | ClinicMeasurementPhiTextField
  | 'statusHistoryNote';

export interface ClinicTestResultPhiCarrier {
  comment?: string | null;
  reviewComment?: string | null;
  releaseComment?: string | null;
}

export interface ClinicTestOrderPhiCarrier {
  comment?: string | null;
  customCancellationReason?: string | null;
}

export interface ClinicTestResultMeasurementPhiCarrier {
  value?: string | null;
  labComment?: string | null;
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

export function encryptClinicTestResultPhi<
  T extends ClinicTestResultPhiCarrier,
>(result: T, businessKey: string): T {
  const next = { ...result };
  for (const field of CLINIC_RESULT_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptClinicTestResultPhi<
  T extends ClinicTestResultPhiCarrier,
>(result: T, businessKey: string): T {
  const next = { ...result };
  for (const field of CLINIC_RESULT_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function encryptClinicTestOrderPhi<T extends ClinicTestOrderPhiCarrier>(
  order: T,
  businessKey: string,
): T {
  const next = { ...order };
  for (const field of CLINIC_ORDER_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptClinicTestOrderPhi<T extends ClinicTestOrderPhiCarrier>(
  order: T,
  businessKey: string,
): T {
  const next = { ...order };
  for (const field of CLINIC_ORDER_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function encryptClinicTestResultMeasurementPhi<
  T extends ClinicTestResultMeasurementPhiCarrier,
>(measurement: T, businessKey: string): T {
  const next = { ...measurement };
  for (const field of CLINIC_MEASUREMENT_PHI_TEXT_FIELDS) {
    next[field] = encryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function decryptClinicTestResultMeasurementPhi<
  T extends ClinicTestResultMeasurementPhiCarrier,
>(measurement: T, businessKey: string): T {
  const next = { ...measurement };
  for (const field of CLINIC_MEASUREMENT_PHI_TEXT_FIELDS) {
    next[field] = decryptOptionalText(next[field], businessKey);
  }
  return next;
}

export function encryptClinicStatusHistoryNote(
  note: string | null | undefined,
  businessKey: string,
): string | null | undefined {
  return encryptOptionalText(note, businessKey);
}

export function decryptClinicStatusHistoryNote(
  note: string | null | undefined,
  businessKey: string,
): string | null | undefined {
  return decryptOptionalText(note, businessKey);
}

export function maskClinicTestResultPhiFields<
  T extends ClinicTestResultPhiCarrier,
>(result: T): T {
  const next = { ...result };
  for (const field of CLINIC_RESULT_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function maskClinicTestOrderPhiFields<
  T extends ClinicTestOrderPhiCarrier,
>(order: T): T {
  const next = { ...order };
  for (const field of CLINIC_ORDER_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function maskClinicTestResultMeasurementPhiFields<
  T extends ClinicTestResultMeasurementPhiCarrier,
>(measurement: T): T {
  const next = { ...measurement };
  for (const field of CLINIC_MEASUREMENT_PHI_TEXT_FIELDS) {
    if (next[field]) next[field] = null;
  }
  return next;
}

export function listClinicTestResultPhiFieldsRead(
  result: ClinicTestResultPhiCarrier,
): ClinicResultPhiTextField[] {
  return CLINIC_RESULT_PHI_TEXT_FIELDS.filter(
    (field) =>
      typeof result[field] === 'string' &&
      String(result[field]).trim().length > 0,
  );
}

export function listClinicTestResultPhiFieldsTouched(
  before: ClinicTestResultPhiCarrier | null | undefined,
  after: ClinicTestResultPhiCarrier,
): ClinicResultPhiTextField[] {
  return CLINIC_RESULT_PHI_TEXT_FIELDS.filter((field) => {
    const next = after[field];
    return (
      next !== undefined &&
      next !== before?.[field] &&
      typeof next === 'string' &&
      next.trim().length > 0
    );
  });
}

export function listClinicMeasurementPhiFieldsRead(
  measurement: ClinicTestResultMeasurementPhiCarrier,
): ClinicMeasurementPhiTextField[] {
  return CLINIC_MEASUREMENT_PHI_TEXT_FIELDS.filter(
    (field) =>
      typeof measurement[field] === 'string' &&
      String(measurement[field]).trim().length > 0,
  );
}

export function listClinicMeasurementPhiFieldsTouched(
  before: ClinicTestResultMeasurementPhiCarrier | null | undefined,
  after: ClinicTestResultMeasurementPhiCarrier,
): ClinicMeasurementPhiTextField[] {
  return CLINIC_MEASUREMENT_PHI_TEXT_FIELDS.filter((field) => {
    const next = after[field];
    return (
      next !== undefined &&
      next !== before?.[field] &&
      typeof next === 'string' &&
      next.trim().length > 0
    );
  });
}

export function canAccessClinicLabPhi(
  membershipRole: string,
  booking: BookingPhiAccessTarget,
  userEmployeeId: string | null | undefined,
): boolean {
  return canAccessBookingPhi(membershipRole, booking, userEmployeeId);
}
