import {
  PATIENT_RELEASED_MEASUREMENT_FLAG_SCENARIOS,
  PATIENT_RELEASED_RESULT_ROLLUP_SCENARIOS,
} from './clinic-patient-released-result.fixtures.js';
import {
  buildPatientReleasedMeasurementView,
  buildPatientReleasedResultView,
  normalizePatientReleasedMeasurementFlag,
  resolvePatientReleasedMeasurementFlag,
  rollupPatientReleasedResultMeasurementFlag,
} from './clinic-patient-released-result.util.js';

describe('clinic-patient-released-result.util', () => {
  describe('normalizePatientReleasedMeasurementFlag', () => {
    it('returns null for empty values', () => {
      expect(normalizePatientReleasedMeasurementFlag(null)).toBeNull();
      expect(normalizePatientReleasedMeasurementFlag('   ')).toBeNull();
    });

    it('accepts known flags including High and Low', () => {
      expect(normalizePatientReleasedMeasurementFlag('High')).toBe('High');
      expect(normalizePatientReleasedMeasurementFlag(' Low ')).toBe('Low');
    });
  });

  describe('resolvePatientReleasedMeasurementFlag', () => {
    it.each(PATIENT_RELEASED_MEASUREMENT_FLAG_SCENARIOS)(
      '$id',
      ({ measurementFlag, abnormalFlags, expected }) => {
        expect(
          resolvePatientReleasedMeasurementFlag({
            measurementFlag,
            abnormalFlags,
          }),
        ).toBe(expected);
      },
    );
  });

  describe('rollupPatientReleasedResultMeasurementFlag', () => {
    it.each(PATIENT_RELEASED_RESULT_ROLLUP_SCENARIOS)(
      '$id',
      ({ resultFlag, measurementFlags, expected }) => {
        expect(
          rollupPatientReleasedResultMeasurementFlag({
            resultFlag,
            measurementFlags,
          }),
        ).toBe(expected);
      },
    );
  });

  describe('buildPatientReleasedMeasurementView', () => {
    it('maps measurement and LIS observation fields', () => {
      expect(
        buildPatientReleasedMeasurementView({
          measurement: {
            id: 'm-1',
            value: '12.5',
            measurementFlag: 'High',
            testType: { title: 'Glucose', code: 'GLU' },
          },
          observation: {
            clinicTestResultMeasurementId: 'm-1',
            referenceRange: '70-100',
            unit: 'mg/dL',
            abnormalFlags: 'H',
            testName: 'Glucose fasting',
          },
        }),
      ).toEqual({
        id: 'm-1',
        name: 'Glucose',
        value: '12.5',
        unit: 'mg/dL',
        referenceRange: '70-100',
        measurementFlag: 'High',
      });
    });

    it('falls back to observation test name and abnormal flag', () => {
      expect(
        buildPatientReleasedMeasurementView({
          measurement: {
            id: 'm-2',
            value: '4.1',
            testType: { code: 'TSH' },
          },
          observation: {
            referenceRange: '0.4-4.0',
            unit: 'mIU/L',
            abnormalFlags: 'H',
            testName: 'TSH',
          },
        }),
      ).toMatchObject({
        name: 'TSH',
        measurementFlag: 'High',
      });
    });
  });

  describe('buildPatientReleasedResultView', () => {
    it('builds released result with rolled-up flag and measurements', () => {
      const observationByMeasurementId = new Map([
        [
          'm-1',
          {
            clinicTestResultMeasurementId: 'm-1',
            referenceRange: '70-100',
            unit: 'mg/dL',
            abnormalFlags: 'H',
          },
        ],
      ]);

      expect(
        buildPatientReleasedResultView({
          result: {
            id: 'result-1',
            orderId: 'order-1',
            bookingId: 'booking-1',
            status: 'Released',
            measurementFlag: 'Normal',
            releasedAt: new Date('2026-06-01T12:00:00.000Z'),
            testType: { title: 'Metabolic panel' },
            measurements: [
              {
                id: 'm-1',
                value: '120',
                measurementFlag: 'High',
                testType: { title: 'Glucose' },
              },
            ],
          },
          observationByMeasurementId,
        }),
      ).toEqual({
        id: 'result-1',
        orderId: 'order-1',
        bookingId: 'booking-1',
        status: 'Released',
        testName: 'Metabolic panel',
        measurementFlag: 'High',
        releasedAt: '2026-06-01T12:00:00.000Z',
        measurements: [
          {
            id: 'm-1',
            name: 'Glucose',
            value: '120',
            unit: 'mg/dL',
            referenceRange: '70-100',
            measurementFlag: 'High',
          },
        ],
      });
    });
  });
});
