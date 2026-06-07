import { describe, expect, it } from 'vitest';
import {
  formatReleasedClinicMeasurementValue,
  hasReleasedClinicResultMeasurements,
  isReleasedClinicResultStatus,
  normalizePublicClinicResultsPayload,
} from './public-clinic-results.js';

describe('public-clinic-results', () => {
  const normalized = {
    id: 'r1',
    orderId: null,
    bookingId: null,
    status: '',
    testName: null,
    measurementFlag: null,
    releasedAt: null,
    measurements: [],
  };

  it('normalizes released results payloads', () => {
    expect(normalizePublicClinicResultsPayload([{ id: 'r1' }])).toEqual([normalized]);
    expect(normalizePublicClinicResultsPayload({ data: [{ id: 'r2' }] })).toEqual([
      { ...normalized, id: 'r2' },
    ]);
    expect(
      normalizePublicClinicResultsPayload({ data: { data: [{ id: 'r3' }] } }),
    ).toEqual([{ ...normalized, id: 'r3' }]);
    expect(normalizePublicClinicResultsPayload({})).toEqual([]);
  });

  it('detects released status', () => {
    expect(isReleasedClinicResultStatus('Released')).toBe(true);
    expect(isReleasedClinicResultStatus('Reviewed')).toBe(false);
  });

  it('normalizes measurement rows and formats values', () => {
    const [result] = normalizePublicClinicResultsPayload([
      {
        id: 'r1',
        measurements: [{ id: 'm1', value: '5.2', unit: 'g/dL', measurementFlag: 'Normal' }],
      },
    ]);
    expect(result?.measurements[0]?.name).toBe('Measurement');
    expect(formatReleasedClinicMeasurementValue({ value: '5.2', unit: 'g/dL' })).toBe('5.2 g/dL');
    expect(formatReleasedClinicMeasurementValue({ value: '5.2', unit: null })).toBe('5.2');
    expect(formatReleasedClinicMeasurementValue({ value: '  ', unit: 'g/dL' })).toBeNull();
    expect(hasReleasedClinicResultMeasurements(result!)).toBe(true);
    expect(hasReleasedClinicResultMeasurements({ measurements: [] })).toBe(false);
  });

  it('fills defaults for sparse result and measurement rows', () => {
    const [result] = normalizePublicClinicResultsPayload([{}]);
    expect(result).toEqual({
      id: '',
      orderId: null,
      bookingId: null,
      status: '',
      testName: null,
      measurementFlag: null,
      releasedAt: null,
      measurements: [],
    });
    const [withMeasurement] = normalizePublicClinicResultsPayload([
      { id: 'r9', measurements: [{}] },
    ]);
    expect(withMeasurement?.measurements[0]?.name).toBe('Measurement');
    expect(withMeasurement?.measurements[0]?.id).toBe('');
  });
});
