import {
  adaptInboundClinicLabSyncObservationResult,
  adaptInboundClinicLabSyncObservationRequest,
  isClinicLabSyncLinkMethod,
  isClinicLabSyncObservationStatus,
  mapAbnormalFlagToMeasurementFlag,
  matchObservationToMeasurementByCode,
} from './clinic-lab-sync-observation.adapter.util.js';
import { CLINIC_LAB_SYNC_ADAPTER_FIXTURE } from '../../modules/clinic-lis/clinic-lis.fixtures.js';

describe('clinic-lab-sync-observation.adapter.util', () => {
  it('adapts inbound observation request payloads', () => {
    const adapted = adaptInboundClinicLabSyncObservationRequest(
      CLINIC_LAB_SYNC_ADAPTER_FIXTURE.request,
    );

    expect(adapted.status).toBe('Unlinked');
    expect(adapted.universalCode).toBe('LIPID');
    expect(adapted.observations).toHaveLength(1);
    expect(adapted.observations[0]?.resultValue).toBe('130');
  });

  it('maps abnormal flags to measurement flags', () => {
    expect(mapAbnormalFlagToMeasurementFlag('H')).toBe('High');
    expect(mapAbnormalFlagToMeasurementFlag('LOW')).toBe('Low');
    expect(mapAbnormalFlagToMeasurementFlag('ABN')).toBe('Abnormal');
    expect(mapAbnormalFlagToMeasurementFlag(null)).toBeNull();
  });

  it('exposes sync status and link method guards', () => {
    expect(isClinicLabSyncObservationStatus('Linked')).toBe(true);
    expect(isClinicLabSyncObservationStatus('Pending')).toBe(false);
    expect(isClinicLabSyncLinkMethod('Manual')).toBe(true);
    expect(isClinicLabSyncLinkMethod('Auto')).toBe(false);
  });

  it('parses optional observation dates and rejects non-matching codes', () => {
    const adapted = adaptInboundClinicLabSyncObservationRequest({
      ...CLINIC_LAB_SYNC_ADAPTER_FIXTURE.request,
      observationDate: '2026-06-07T12:00:00.000Z',
      specimenReceivedOn: 'not-a-date',
    });
    expect(adapted.observationDate).toBeInstanceOf(Date);
    expect(adapted.specimenReceivedOn).toBeNull();

    expect(
      matchObservationToMeasurementByCode({
        observationUniversalCode: 'LDL',
        measurementTestTypeCode: 'HDL',
      }),
    ).toBe(false);

    expect(
      matchObservationToMeasurementByCode({
        observationUniversalCode: 'wbc',
        measurementTestTypeCode: 'WBC',
      }),
    ).toBe(true);
  });

  it('rejects observation requests without observations', () => {
    expect(() =>
      adaptInboundClinicLabSyncObservationRequest({
        ...CLINIC_LAB_SYNC_ADAPTER_FIXTURE.request,
        observations: [],
      }),
    ).toThrow('Observation request requires at least one observation result');
  });

  it('rejects invalid timestamps and missing patient identity fields', () => {
    expect(() =>
      adaptInboundClinicLabSyncObservationRequest({
        ...CLINIC_LAB_SYNC_ADAPTER_FIXTURE.request,
        systemReceivedOn: 'not-a-date',
      }),
    ).toThrow('Invalid systemReceivedOn timestamp');

    expect(() =>
      adaptInboundClinicLabSyncObservationRequest({
        ...CLINIC_LAB_SYNC_ADAPTER_FIXTURE.request,
        patientLastName: ' ',
      }),
    ).toThrow(
      'Observation request requires testName, universalCode, patientFirstName, and patientLastName',
    );
  });

  it('rejects observation results missing required fields', () => {
    expect(() =>
      adaptInboundClinicLabSyncObservationResult({
        testName: 'WBC',
        universalCode: 'WBC',
        resultValue: ' ',
      }),
    ).toThrow(
      'Observation result requires testName, universalCode, and resultValue',
    );
  });
});
