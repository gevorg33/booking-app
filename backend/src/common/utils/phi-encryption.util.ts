import { createHash, randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret } from './secret.util.js';
import type { PhiFieldName } from './business-compliance.util.js';
import {
  decryptLegacyPatientTestResultRows,
  encryptLegacyPatientTestResultRows,
  LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY,
  legacyPatientTestResultsMetadataChanged,
  legacyPatientTestResultsMetadataHasContent,
} from './legacy-booking-patient-test-results-phi.util.js';

export const PHI_ENCRYPTED_PREFIX = 'phi:v1:';

export const PHI_METADATA_FIELDS: readonly PhiFieldName[] = [
  'referralNotes',
  'symptoms',
  'notes',
] as const;

export interface PhiEncryptionKeyMaterial {
  keyId: string;
  keyEnc: string;
}

export function isPhiEncryptedValue(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PHI_ENCRYPTED_PREFIX);
}

export function deriveBusinessPhiEncryptionKey(
  businessId: string,
  keyMaterial: PhiEncryptionKeyMaterial,
  masterKey: string,
): string {
  const rawKey = decryptSecret(keyMaterial.keyEnc, masterKey);
  return createHash('sha256').update(`${businessId}:${rawKey}`).digest('hex');
}

export function generateBusinessPhiEncryptionKeyMaterial(
  masterKey: string,
): PhiEncryptionKeyMaterial {
  const rawKey = randomBytes(32).toString('base64');
  const keyId = randomBytes(16).toString('hex');
  return {
    keyId,
    keyEnc: encryptSecret(rawKey, masterKey),
  };
}

export function encryptPhiValue(
  plaintext: string,
  businessKey: string,
): string {
  if (!plaintext.trim()) return plaintext;
  if (isPhiEncryptedValue(plaintext)) return plaintext;
  return `${PHI_ENCRYPTED_PREFIX}${encryptSecret(plaintext, businessKey)}`;
}

export function decryptPhiValue(
  ciphertext: string,
  businessKey: string,
): string {
  if (!isPhiEncryptedValue(ciphertext)) return ciphertext;
  const payload = ciphertext.slice(PHI_ENCRYPTED_PREFIX.length);
  return decryptSecret(payload, businessKey);
}

function encryptPatientTestResultNotes(
  value: unknown,
  businessKey: string,
): unknown {
  return encryptLegacyPatientTestResultRows(value, businessKey);
}

function decryptPatientTestResultNotes(
  value: unknown,
  businessKey: string,
): unknown {
  return decryptLegacyPatientTestResultRows(value, businessKey);
}

export function encryptPhiMetadata(
  metadata: Record<string, unknown> | null | undefined,
  businessKey: string,
): Record<string, unknown> | null | undefined {
  if (!metadata) return metadata;
  const next = { ...metadata };
  for (const field of PHI_METADATA_FIELDS) {
    if (field === 'notes') continue;
    const value = next[field];
    if (typeof value === 'string' && value.trim()) {
      next[field] = encryptPhiValue(value, businessKey);
    }
  }
  if (next[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY] !== undefined) {
    next[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY] =
      encryptPatientTestResultNotes(
        next[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY],
        businessKey,
      );
  }
  return next;
}

export function decryptPhiMetadata(
  metadata: Record<string, unknown> | null | undefined,
  businessKey: string,
): Record<string, unknown> | null | undefined {
  if (!metadata) return metadata;
  const next = { ...metadata };
  for (const field of PHI_METADATA_FIELDS) {
    if (field === 'notes') continue;
    const value = next[field];
    if (typeof value === 'string' && isPhiEncryptedValue(value)) {
      next[field] = decryptPhiValue(value, businessKey);
    }
  }
  if (next[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY] !== undefined) {
    next[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY] =
      decryptPatientTestResultNotes(
        next[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY],
        businessKey,
      );
  }
  return next;
}

export interface BookingPhiCarrier {
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function encryptBookingPhi<T extends BookingPhiCarrier>(
  booking: T,
  businessKey: string,
): T {
  const next = { ...booking };
  if (typeof next.notes === 'string' && next.notes.trim()) {
    next.notes = encryptPhiValue(next.notes, businessKey);
  }
  if (next.metadata) {
    next.metadata = encryptPhiMetadata(next.metadata, businessKey)!;
  }
  return next;
}

export function decryptBookingPhi<T extends BookingPhiCarrier>(
  booking: T,
  businessKey: string,
): T {
  const next = { ...booking };
  if (typeof next.notes === 'string' && isPhiEncryptedValue(next.notes)) {
    next.notes = decryptPhiValue(next.notes, businessKey);
  }
  if (next.metadata) {
    next.metadata = decryptPhiMetadata(next.metadata, businessKey)!;
  }
  return next;
}

export function listPhiFieldsTouched(
  before: BookingPhiCarrier | null | undefined,
  after: BookingPhiCarrier,
): PhiFieldName[] {
  const touched = new Set<PhiFieldName>();
  if (
    after.notes !== undefined &&
    after.notes !== before?.notes &&
    typeof after.notes === 'string' &&
    after.notes.trim()
  ) {
    touched.add('notes');
  }
  for (const field of ['referralNotes', 'symptoms'] as const) {
    const prev = before?.metadata?.[field];
    const next = after.metadata?.[field];
    if (
      next !== undefined &&
      next !== prev &&
      typeof next === 'string' &&
      next.trim()
    ) {
      touched.add(field);
    }
  }
  const prevResults =
    before?.metadata?.[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY];
  const nextResults =
    after.metadata?.[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY];
  if (
    nextResults !== undefined &&
    legacyPatientTestResultsMetadataChanged(prevResults, nextResults)
  ) {
    touched.add('patient_test_results');
  }
  return [...touched];
}

export function listPhiFieldsRead(booking: BookingPhiCarrier): PhiFieldName[] {
  const read: PhiFieldName[] = [];
  if (typeof booking.notes === 'string' && booking.notes.trim()) {
    read.push('notes');
  }
  const metadata = booking.metadata ?? {};
  if (
    typeof metadata.referralNotes === 'string' &&
    String(metadata.referralNotes).trim()
  ) {
    read.push('referralNotes');
  }
  if (
    typeof metadata.symptoms === 'string' &&
    String(metadata.symptoms).trim()
  ) {
    read.push('symptoms');
  }
  if (legacyPatientTestResultsMetadataHasContent(metadata)) {
    read.push('patient_test_results');
  }
  return read;
}
