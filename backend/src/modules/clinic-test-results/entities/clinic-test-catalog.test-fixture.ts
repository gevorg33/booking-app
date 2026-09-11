import type { ClinicTestResultMeasurement } from './clinic-test-result-measurement.entity.js';
import type { ClinicTestType } from './clinic-test-type.entity.js';

/**
 * Build a complete `ClinicTestType` for tests.
 *
 * The entity's human-readable field is `title`, not `name` — specs that wrote
 * `{ code: 'WBC', name: 'WBC' }` were inventing a property. It was inert (the
 * logic reads only `testType?.code`), but a fixture that describes a shape the
 * entity does not have is a fiction the next reader has to disprove.
 */
export function makeClinicTestType(
  partial: Partial<ClinicTestType> = {},
): ClinicTestType {
  return {
    id: 'test-type-test',
    business: undefined as unknown as ClinicTestType['business'],
    businessId: 'biz-test',
    code: 'CODE',
    title: 'Test type',
    abbreviation: null,
    description: null,
    unit: null,
    normalLow: null,
    normalHigh: null,
    price: 0,
    requiresFasting: false,
    preparationNotes: null,
    service: null,
    serviceId: null,
    clinicDiagnosticCode: null,
    clinicDiagnosticCodeId: null,
    isActive: true,
    panelItems: [],
    orderItems: [],
    results: [],
    measurements: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}

/** Build a complete `ClinicTestResultMeasurement` for tests. */
export function makeClinicTestResultMeasurement(
  partial: Partial<ClinicTestResultMeasurement> = {},
): ClinicTestResultMeasurement {
  return {
    id: 'measurement-test',
    result: undefined as unknown as ClinicTestResultMeasurement['result'],
    resultId: 'result-test',
    testType: makeClinicTestType(),
    testTypeId: 'test-type-test',
    value: null,
    measurementFlag: null,
    labComment: null,
    receivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
