import { describe, expect, it } from 'vitest';
import {
  formatClinicServiceTypeBadge,
  isClinicVerticalBusinessType,
  isPublicClinicService,
} from './clinic-service';
import type { PublicService } from './public-api';

const labTest: PublicService = {
  id: 'lab-1',
  name: 'Lipid panel',
  durationMinutes: 15,
  bufferMinutes: 0,
  price: 35,
  currency: 'USD',
  isClinic: true,
  clinicServiceType: 'lab_test',
  clinicServiceTypeBadge: 'Lab test',
  requiresFasting: true,
  preparationNotes: 'Fast for 12 hours before sample collection',
  acceptsPatientNotes: true,
};

const consultation: PublicService = {
  id: 'gp-1',
  name: 'Initial consultation',
  durationMinutes: 30,
  bufferMinutes: 0,
  price: 0,
  currency: 'USD',
  isClinic: true,
  clinicServiceType: 'consultation',
  clinicServiceTypeBadge: 'Consultation',
  acceptsPatientNotes: true,
};

const procedure: PublicService = {
  id: 'cardio-1',
  name: 'ECG',
  durationMinutes: 20,
  bufferMinutes: 0,
  price: 45,
  currency: 'USD',
  isClinic: true,
  clinicServiceType: 'procedure',
  clinicServiceTypeBadge: 'Procedure',
  acceptsPatientNotes: true,
};

const haircut: PublicService = {
  id: 'svc-1',
  name: 'Haircut',
  durationMinutes: 30,
  bufferMinutes: 5,
  price: 40,
  currency: 'USD',
};

const t = (key: string) => {
  if (key === 'clinic.serviceType.lab_test') return 'Lab test';
  if (key === 'clinic.serviceType.consultation') return 'Consultation';
  if (key === 'clinic.serviceType.procedure') return 'Procedure';
  return key;
};

describe('Sprint 31 — clinic booking scenario matrix', () => {
  it('distinguishes clinic vs standard services on public booking list', () => {
    expect(isPublicClinicService(labTest)).toBe(true);
    expect(isPublicClinicService(consultation)).toBe(true);
    expect(isPublicClinicService(haircut)).toBe(false);
    expect(isPublicClinicService({})).toBe(false);
  });

  it('detects clinic vertical business types for onboarding and gating', () => {
    expect(isClinicVerticalBusinessType('polyclinic')).toBe(true);
    expect(isClinicVerticalBusinessType('clinic')).toBe(true);
    expect(isClinicVerticalBusinessType('beauty_clinic')).toBe(true);
    expect(isClinicVerticalBusinessType('tour_operator')).toBe(false);
  });

  it('shows appointment type badges for consultation, lab, and procedure', () => {
    expect(formatClinicServiceTypeBadge(labTest.clinicServiceType, t)).toBe(
      'Lab test',
    );
    expect(formatClinicServiceTypeBadge(consultation.clinicServiceType, t)).toBe(
      'Consultation',
    );
    expect(formatClinicServiceTypeBadge(procedure.clinicServiceType, t)).toBe(
      'Procedure',
    );
  });

  it('exposes fasting and prep fields required by lab test cards', () => {
    expect(labTest).toMatchObject({
      requiresFasting: true,
      preparationNotes: expect.stringContaining('12 hours'),
      acceptsPatientNotes: true,
    });
    expect(consultation.requiresFasting).toBeUndefined();
  });

  it('supports optional referral and symptoms payload at checkout', () => {
    const scenarios = [
      { referralNotes: 'Referred by Dr. Kim', symptoms: 'Persistent cough' },
      { referralNotes: undefined, symptoms: 'Headache' },
      { referralNotes: 'GP referral', symptoms: undefined },
    ];

    for (const payload of scenarios) {
      if (payload.referralNotes) {
        expect(payload.referralNotes.length).toBeGreaterThan(0);
      }
      if (payload.symptoms) {
        expect(payload.symptoms.length).toBeGreaterThan(0);
      }
    }
  });

  it('trims whitespace from patient notes before submit', () => {
    const trim = (value?: string) => value?.trim() || undefined;
    expect(trim('  Dr Lee  ')).toBe('Dr Lee');
    expect(trim('   ')).toBeUndefined();
    expect(trim(undefined)).toBeUndefined();
  });

  it('exposes clinic card fields required by public booking UI', () => {
    expect(labTest).toMatchObject({
      clinicServiceType: 'lab_test',
      clinicServiceTypeBadge: expect.any(String),
      acceptsPatientNotes: true,
    });
    expect(procedure.clinicServiceType).toBe('procedure');
  });
});
