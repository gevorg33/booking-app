import { describe, expect, it } from 'vitest';
import {
  formatClinicServiceTypeBadge,
  isClinicVerticalBusinessType,
  isPublicClinicService,
  shouldShowPatientResultsTab,
} from './clinic-service';

describe('clinic-service', () => {
  it('detects clinic services and business types', () => {
    expect(isPublicClinicService({ isClinic: true })).toBe(true);
    expect(isPublicClinicService({ isClinic: false })).toBe(false);
    expect(isPublicClinicService({})).toBe(false);
    expect(isClinicVerticalBusinessType('clinic')).toBe(true);
    expect(isClinicVerticalBusinessType('polyclinic')).toBe(true);
    expect(isClinicVerticalBusinessType('beauty_clinic')).toBe(true);
    expect(isClinicVerticalBusinessType('dental')).toBe(true);
    expect(isClinicVerticalBusinessType('hair_salon')).toBe(false);
    expect(isClinicVerticalBusinessType(null)).toBe(false);
    expect(isClinicVerticalBusinessType(undefined)).toBe(false);
  });

  it('gates patient Results tab by clinic vertical business type', () => {
    expect(shouldShowPatientResultsTab('clinic')).toBe(true);
    expect(shouldShowPatientResultsTab('polyclinic')).toBe(true);
    expect(shouldShowPatientResultsTab('dental')).toBe(true);
    expect(shouldShowPatientResultsTab('hair_salon')).toBe(false);
    expect(shouldShowPatientResultsTab(null)).toBe(false);
  });

  it('formats clinic service type badges with translations', () => {
    const t = (key: string) => {
      if (key === 'clinic.serviceType.lab_test') return 'Lab test';
      if (key === 'clinic.serviceType.consultation') return 'Consultation';
      if (key === 'clinic.serviceType.procedure') return 'Procedure';
      return key;
    };
    expect(formatClinicServiceTypeBadge('lab_test', t)).toBe('Lab test');
    expect(formatClinicServiceTypeBadge('consultation', t)).toBe('Consultation');
    expect(formatClinicServiceTypeBadge('procedure', t)).toBe('Procedure');
    expect(formatClinicServiceTypeBadge(undefined, t)).toBeNull();
  });

  it('falls back to raw service type when translation missing', () => {
    expect(formatClinicServiceTypeBadge('procedure', (key) => key)).toBe(
      'procedure',
    );
  });
});
