import { describe, expect, it } from 'vitest';
import {
  isReleasedClinicResultStatus,
  normalizePublicClinicResultsPayload,
} from './public-clinic-results';

describe('public-clinic-results', () => {
  it('normalizes list payloads from public API', () => {
    expect(normalizePublicClinicResultsPayload([{ id: 'r1' }])).toEqual([
      {
        id: 'r1',
        orderId: null,
        bookingId: null,
        status: '',
        testName: null,
        measurementFlag: null,
        releasedAt: null,
        measurements: [],
      },
    ]);
    expect(normalizePublicClinicResultsPayload({ data: [{ id: 'r2' }] })).toEqual([
      {
        id: 'r2',
        orderId: null,
        bookingId: null,
        status: '',
        testName: null,
        measurementFlag: null,
        releasedAt: null,
        measurements: [],
      },
    ]);
    expect(
      normalizePublicClinicResultsPayload({ data: { data: [{ id: 'r3' }] } }),
    ).toEqual([
      {
        id: 'r3',
        orderId: null,
        bookingId: null,
        status: '',
        testName: null,
        measurementFlag: null,
        releasedAt: null,
        measurements: [],
      },
    ]);
    expect(normalizePublicClinicResultsPayload({})).toEqual([]);
  });

  it('detects released result status', () => {
    expect(isReleasedClinicResultStatus('Released')).toBe(true);
    expect(isReleasedClinicResultStatus('Reviewed')).toBe(false);
  });
});
