import {
  decryptPhiValue,
  encryptPhiValue,
  isPhiEncryptedValue,
} from './phi-encryption.util.js';

/** Legacy booking.metadata key — superseded by `clinic_test_results` entity PHI fields. */
export const LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY =
  'patient_test_results' as const;

export interface LegacyBookingPatientTestResultRow {
  notes?: string | null;
  testName?: string | null;
  name?: string | null;
  status?: string | null;
  measurementFlag?: string | null;
  releasedAt?: string | null;
  [key: string]: unknown;
}

export function parseLegacyPatientTestResultRows(
  metadata: Record<string, unknown> | null | undefined,
): LegacyBookingPatientTestResultRow[] {
  const raw = metadata?.[LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is LegacyBookingPatientTestResultRow =>
      entry != null && typeof entry === 'object',
  );
}

export function hasLegacyPatientTestResultNotes(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return parseLegacyPatientTestResultRows(metadata).some(
    (row) => typeof row.notes === 'string' && row.notes.trim().length > 0,
  );
}

export function encryptLegacyPatientTestResultRows(
  value: unknown,
  businessKey: string,
): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const row = { ...(entry as LegacyBookingPatientTestResultRow) };
    if (typeof row.notes === 'string' && row.notes.trim()) {
      row.notes = encryptPhiValue(row.notes, businessKey);
    }
    return row;
  });
}

export function decryptLegacyPatientTestResultRows(
  value: unknown,
  businessKey: string,
): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const row = { ...(entry as LegacyBookingPatientTestResultRow) };
    if (typeof row.notes === 'string' && isPhiEncryptedValue(row.notes)) {
      row.notes = decryptPhiValue(row.notes, businessKey);
    }
    return row;
  });
}

export function maskLegacyPatientTestResultRows(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const row = { ...(entry as LegacyBookingPatientTestResultRow) };
    delete row.notes;
    return row;
  });
}

export function legacyPatientTestResultsMetadataChanged(
  before: unknown,
  after: unknown,
): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

export function legacyPatientTestResultsMetadataHasContent(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  const rows = parseLegacyPatientTestResultRows(metadata);
  return rows.length > 0;
}

export function redactLegacyPatientTestResultRows(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const row = { ...(entry as LegacyBookingPatientTestResultRow) };
    if ('notes' in row) row.notes = '[REDACTED_PHI]';
    return row;
  });
}
