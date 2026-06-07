import { describe, expect, it } from 'vitest';
import {
  CLINIC_LAB_BADGE_CLASS,
  formatClinicLabFeatureDisabledReason,
  formatClinicResultMeasurementFlagLabel,
  formatClinicSpecimenStatusLabel,
  formatClinicTestOrderStatusLabel,
  formatClinicTestResultStatusLabel,
  getClinicLabStatusBadgeClassName,
  getClinicLabStatusUiMetadata,
  getClinicResultMeasurementBadgeColor,
} from './clinic-lab-state';

describe('clinic-lab-state', () => {
  const t = (key: string) => {
    const labels: Record<string, string> = {
      'clinic.labState.order.AwaitingResults': 'Awaiting results',
      'clinic.labState.result.NotReceived': 'Not received',
      'clinic.labState.specimen.ReceivedInLab': 'Received in lab',
      'clinic.labState.measurement.Abnormal': 'Abnormal',
      'clinic.labState.gate.disabledReason': 'Lab features disabled',
    };
    return labels[key] ?? key;
  };

  it('formats order, result, specimen, and measurement labels', () => {
    expect(formatClinicTestOrderStatusLabel('AwaitingResults', t)).toBe(
      'Awaiting results',
    );
    expect(formatClinicTestResultStatusLabel('NotReceived', t)).toBe(
      'Not received',
    );
    expect(formatClinicSpecimenStatusLabel('ReceivedInLab', t)).toBe(
      'Received in lab',
    );
    expect(formatClinicResultMeasurementFlagLabel('Abnormal', t)).toBe(
      'Abnormal',
    );
    expect(formatClinicLabFeatureDisabledReason(t)).toBe('Lab features disabled');
  });

  it('falls back to raw status when translation missing', () => {
    expect(formatClinicTestOrderStatusLabel('Collecting', (key) => key)).toBe(
      'Collecting',
    );
  });

  it('returns shared badge metadata and classes', () => {
    const metadata = getClinicLabStatusUiMetadata('order', 'Completed', t);
    expect(metadata.badgeTone).toBe('success');
    expect(getClinicLabStatusBadgeClassName('order', 'Completed')).toBe(
      CLINIC_LAB_BADGE_CLASS.success,
    );
    expect(getClinicLabStatusBadgeClassName('result', 'Pending', { theme: 'light' }))
      .toContain('amber');
    expect(getClinicResultMeasurementBadgeColor('Normal')).toEqual({
      text: '#02922A',
      background: '#E2F3E4',
    });
    expect(
      getClinicLabStatusUiMetadata('measurement', 'Normal', t).measurementColors,
    ).toEqual({
      text: '#02922A',
      background: '#E2F3E4',
    });
    expect(getClinicLabStatusUiMetadata('patientVisibility', 'Pending', t).badgeTone).toBe(
      'warning',
    );
    expect(getClinicLabStatusUiMetadata('order', 'UnknownStatus', t).badgeTone).toBe(
      'neutral',
    );
    expect(getClinicLabStatusUiMetadata('measurement', 'UnknownFlag', t).badgeTone).toBe(
      'neutral',
    );
    expect(
      getClinicLabStatusUiMetadata('patientVisibility', 'UnknownVisibility', t).badgeTone,
    ).toBe('neutral');
    expect(
      getClinicLabStatusUiMetadata('measurement', 'Inconclusive', t).measurementColors,
    ).toBeUndefined();
  });
});
