import type { LegacyBookingPatientTestResultRow } from './legacy-booking-patient-test-results-phi.util.js';

export const LEGACY_PATIENT_TEST_RESULT_VIEW_ID_PREFIX =
  'legacy-booking-metadata:';

export function buildLegacyPatientTestResultViewId(
  bookingId: string,
  index: number,
): string {
  return `${LEGACY_PATIENT_TEST_RESULT_VIEW_ID_PREFIX}${bookingId}:${index}`;
}

export function parseLegacyPatientTestResultViewId(
  resultId: string,
): { bookingId: string; index: number } | null {
  if (!resultId.startsWith(LEGACY_PATIENT_TEST_RESULT_VIEW_ID_PREFIX)) {
    return null;
  }
  const rest = resultId.slice(LEGACY_PATIENT_TEST_RESULT_VIEW_ID_PREFIX.length);
  const separator = rest.lastIndexOf(':');
  if (separator <= 0) return null;
  const bookingId = rest.slice(0, separator);
  const index = Number.parseInt(rest.slice(separator + 1), 10);
  if (!bookingId || !Number.isFinite(index) || index < 0) return null;
  return { bookingId, index };
}

export function isLegacyPatientTestResultViewId(resultId: string): boolean {
  return parseLegacyPatientTestResultViewId(resultId) != null;
}

export interface LegacyClinicTestResultView {
  id: string;
  businessId: string;
  bookingId: string;
  orderId: null;
  customerId: string;
  status: string;
  testName: string | null;
  testTypeId: null;
  measurementFlag: string | null;
  completedAt: string | null;
  reviewedAt: null;
  releasedAt: string | null;
  createdAt: Date;
  comment: string | null;
  reviewComment: null;
  releaseComment: null;
  legacySource: 'booking_metadata';
  legacyMetadataIndex: number;
  phiMasked?: boolean;
}

export function resolveLegacyPatientTestResultTestName(
  row: LegacyBookingPatientTestResultRow,
): string | null {
  const testName =
    (typeof row.testName === 'string' && row.testName.trim()) ||
    (typeof row.name === 'string' && row.name.trim()) ||
    null;
  return testName;
}

export function mapLegacyPatientTestResultRowToView(input: {
  businessId: string;
  bookingId: string;
  customerId: string;
  index: number;
  row: LegacyBookingPatientTestResultRow;
  phiMasked: boolean;
  createdAt?: Date;
}): LegacyClinicTestResultView {
  const notes =
    typeof input.row.notes === 'string' && input.row.notes.trim()
      ? input.row.notes
      : null;
  const hadNotes = notes != null;
  return {
    id: buildLegacyPatientTestResultViewId(input.bookingId, input.index),
    businessId: input.businessId,
    bookingId: input.bookingId,
    orderId: null,
    customerId: input.customerId,
    status:
      typeof input.row.status === 'string' && input.row.status.trim()
        ? input.row.status.trim()
        : 'Released',
    testName: resolveLegacyPatientTestResultTestName(input.row),
    testTypeId: null,
    measurementFlag:
      typeof input.row.measurementFlag === 'string'
        ? input.row.measurementFlag
        : null,
    completedAt: null,
    reviewedAt: null,
    releasedAt:
      typeof input.row.releasedAt === 'string' ? input.row.releasedAt : null,
    createdAt: input.createdAt ?? new Date(0),
    comment: input.phiMasked && hadNotes ? null : notes,
    reviewComment: null,
    releaseComment: null,
    legacySource: 'booking_metadata',
    legacyMetadataIndex: input.index,
    ...(input.phiMasked && hadNotes ? { phiMasked: true } : {}),
  };
}

export function mapLegacyPatientTestResultRowsToViews(input: {
  businessId: string;
  bookingId: string;
  customerId: string;
  rows: LegacyBookingPatientTestResultRow[];
  phiMasked: boolean;
}): LegacyClinicTestResultView[] {
  return input.rows.map((row, index) =>
    mapLegacyPatientTestResultRowToView({
      ...input,
      index,
      row,
    }),
  );
}
