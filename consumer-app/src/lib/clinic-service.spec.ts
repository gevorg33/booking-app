import { describe, expect, it } from 'vitest';
import {
  formatClinicServiceTypeBadge,
  isClinicVerticalBusinessType,
  isPublicClinicService,
  shouldShowPatientResultsTab,
} from './clinic-service.js';
import type { PublicService } from './types.js';

const labTest: PublicService = {
  id: 'lab-1',
  name: 'Lipid panel',
  durationMinutes: 15,
  price: 35,
  isClinic: true,
  clinicServiceType: 'lab_test',
  clinicServiceTypeBadge: 'Lab test',
  requiresFasting: true,
  preparationNotes: 'Fast for 12 hours before sample collection',
  acceptsPatientNotes: true,
  offersPreVisitIntake: true,
};

const consultation: PublicService = {
  id: 'gp-1',
  name: 'Initial consultation',
  durationMinutes: 30,
  price: 0,
  isClinic: true,
  clinicServiceType: 'consultation',
  acceptsPatientNotes: true,
};

const haircut: PublicService = {
  id: 'svc-1',
  name: 'Haircut',
  durationMinutes: 30,
  price: 40,
};

const copy = {
  clinicServiceTypeConsultation: 'Consultation',
  clinicServiceTypeLabTest: 'Lab test',
  clinicServiceTypeProcedure: 'Procedure',
};

describe('clinic-service', () => {
  it('detects clinic vertical business types', () => {
    expect(isClinicVerticalBusinessType('clinic')).toBe(true);
    expect(isClinicVerticalBusinessType('polyclinic')).toBe(true);
    expect(isClinicVerticalBusinessType('beauty_clinic')).toBe(true);
    expect(isClinicVerticalBusinessType('hair_salon')).toBe(false);
    expect(isClinicVerticalBusinessType(undefined)).toBe(false);
  });

  it('gates patient results tab by clinic vertical', () => {
    expect(shouldShowPatientResultsTab('dental')).toBe(true);
    expect(shouldShowPatientResultsTab('tour_operator')).toBe(false);
  });

  it('distinguishes clinic vs standard services', () => {
    expect(isPublicClinicService(labTest)).toBe(true);
    expect(isPublicClinicService(consultation)).toBe(true);
    expect(isPublicClinicService(haircut)).toBe(false);
  });

  it('formats clinic service type badges', () => {
    expect(formatClinicServiceTypeBadge(labTest.clinicServiceType, copy)).toBe('Lab test');
    expect(formatClinicServiceTypeBadge(consultation.clinicServiceType, copy)).toBe(
      'Consultation',
    );
    expect(formatClinicServiceTypeBadge(undefined, copy)).toBeNull();
  });

  it('exposes fasting and prep fields for lab services', () => {
    expect(labTest).toMatchObject({
      requiresFasting: true,
      preparationNotes: expect.stringContaining('12 hours'),
      acceptsPatientNotes: true,
    });
    expect(consultation.requiresFasting).toBeUndefined();
  });
});
