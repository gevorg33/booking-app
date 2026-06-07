import {
  CLINIC_RESULT_MEASUREMENT_FLAGS,
  type ClinicResultMeasurementFlag,
} from './clinic-lab-state.util.js';
import { mapAbnormalFlagToMeasurementFlag } from './clinic-lab-sync-observation.adapter.util.js';

export interface ClinicPatientReleasedMeasurementView {
  id: string;
  name: string;
  value: string | null;
  unit: string | null;
  referenceRange: string | null;
  measurementFlag: string | null;
}

export interface ClinicPatientReleasedResultView {
  id: string;
  orderId: string | null;
  bookingId: string | null;
  status: string;
  testName: string | null;
  measurementFlag: string | null;
  releasedAt: string | null;
  measurements: ClinicPatientReleasedMeasurementView[];
}

export interface PatientReleasedMeasurementSource {
  id: string;
  value?: string | null;
  measurementFlag?: string | null;
  testType?: { title?: string | null; code?: string | null } | null;
}

export interface PatientReleasedObservationSource {
  clinicTestResultMeasurementId?: string | null;
  referenceRange?: string | null;
  unit?: string | null;
  abnormalFlags?: string | null;
  testName?: string | null;
}

export interface PatientReleasedResultSource {
  id: string;
  orderId?: string | null;
  bookingId?: string | null;
  status: string;
  measurementFlag?: string | null;
  releasedAt?: Date | null;
  order?: { displayNames?: string | null } | null;
  testType?: { title?: string | null } | null;
  measurements?: PatientReleasedMeasurementSource[] | null;
}

const KNOWN_MEASUREMENT_FLAGS = new Set<string>(CLINIC_RESULT_MEASUREMENT_FLAGS);

/** Worst-case flag wins when rolling up analyte rows to the result header. */
const PATIENT_MEASUREMENT_FLAG_PRIORITY: readonly ClinicResultMeasurementFlag[] =
  [
    'Abnormal',
    'High',
    'Low',
    'Inconclusive',
    'Indeterminate',
    'SeeDetails',
    'TestNotComplete',
    'NotApplicable',
    'Normal',
  ];

export function normalizePatientReleasedMeasurementFlag(
  flag: string | null | undefined,
): string | null {
  const trimmed = flag?.trim();
  if (!trimmed) return null;
  return KNOWN_MEASUREMENT_FLAGS.has(trimmed) ? trimmed : null;
}

export function resolvePatientReleasedMeasurementFlag(input: {
  measurementFlag?: string | null;
  abnormalFlags?: string | null;
}): string | null {
  const stored = normalizePatientReleasedMeasurementFlag(input.measurementFlag);
  if (stored) return stored;
  return normalizePatientReleasedMeasurementFlag(
    mapAbnormalFlagToMeasurementFlag(input.abnormalFlags),
  );
}

export function rollupPatientReleasedResultMeasurementFlag(input: {
  resultFlag?: string | null;
  measurementFlags: Array<string | null | undefined>;
}): string | null {
  const normalizedResultFlag = normalizePatientReleasedMeasurementFlag(
    input.resultFlag,
  );
  const normalizedMeasurementFlags = input.measurementFlags
    .map((flag) => normalizePatientReleasedMeasurementFlag(flag))
    .filter((flag): flag is string => flag != null);

  const candidates = normalizedResultFlag
    ? [normalizedResultFlag, ...normalizedMeasurementFlags]
    : normalizedMeasurementFlags;

  if (candidates.length === 0) return null;

  for (const priority of PATIENT_MEASUREMENT_FLAG_PRIORITY) {
    if (candidates.includes(priority)) return priority;
  }

  return candidates[0] ?? null;
}

export function buildPatientReleasedMeasurementView(input: {
  measurement: PatientReleasedMeasurementSource;
  observation?: PatientReleasedObservationSource | null;
}): ClinicPatientReleasedMeasurementView {
  const { measurement, observation } = input;
  const name =
    measurement.testType?.title?.trim() ||
    observation?.testName?.trim() ||
    measurement.testType?.code?.trim() ||
    'Measurement';

  return {
    id: measurement.id,
    name,
    value: measurement.value?.trim() || null,
    unit: observation?.unit?.trim() || null,
    referenceRange: observation?.referenceRange?.trim() || null,
    measurementFlag: resolvePatientReleasedMeasurementFlag({
      measurementFlag: measurement.measurementFlag,
      abnormalFlags: observation?.abnormalFlags,
    }),
  };
}

export function buildPatientReleasedResultView(input: {
  result: PatientReleasedResultSource;
  observationByMeasurementId?: ReadonlyMap<
    string,
    PatientReleasedObservationSource
  >;
}): ClinicPatientReleasedResultView {
  const { result, observationByMeasurementId } = input;
  const measurements = (result.measurements ?? []).map((measurement) =>
    buildPatientReleasedMeasurementView({
      measurement,
      observation: observationByMeasurementId?.get(measurement.id) ?? null,
    }),
  );

  return {
    id: result.id,
    orderId: result.orderId ?? null,
    bookingId: result.bookingId ?? null,
    status: result.status,
    testName:
      result.testType?.title?.trim() ??
      result.order?.displayNames?.trim() ??
      'Lab result',
    measurementFlag: rollupPatientReleasedResultMeasurementFlag({
      resultFlag: result.measurementFlag,
      measurementFlags: measurements.map((row) => row.measurementFlag),
    }),
    releasedAt: result.releasedAt?.toISOString() ?? null,
    measurements,
  };
}
