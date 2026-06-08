import { describe, expect, it } from 'vitest';
import {
  buildClinicPatientNotesPayload,
  shouldShowClinicPatientNotesSection,
  trimClinicPatientNote,
} from './clinic-booking.util.js';
import type { PublicService } from './types.js';

const labTest: PublicService = {
  id: 'lab-1',
  name: 'Lipid panel',
  durationMinutes: 15,
  price: 35,
  isClinic: true,
  clinicServiceType: 'lab_test',
  acceptsPatientNotes: true,
};

const haircut: PublicService = {
  id: 'svc-1',
  name: 'Haircut',
  durationMinutes: 30,
  price: 40,
};

describe('clinic-booking.util', () => {
  it('trims whitespace from patient notes', () => {
    expect(trimClinicPatientNote('  Dr Lee  ')).toBe('Dr Lee');
    expect(trimClinicPatientNote('   ')).toBeUndefined();
    expect(trimClinicPatientNote(undefined)).toBeUndefined();
  });

  it('builds optional referral and symptoms payload for clinic services', () => {
    expect(
      buildClinicPatientNotesPayload(labTest, {
        referralNotes: 'Referred by Dr. Kim',
        symptoms: 'Persistent cough',
      }),
    ).toEqual({
      referralNotes: 'Referred by Dr. Kim',
      symptoms: 'Persistent cough',
    });
    expect(
      buildClinicPatientNotesPayload(labTest, {
        referralNotes: '   ',
        symptoms: 'Headache',
      }),
    ).toEqual({ symptoms: 'Headache' });
  });

  it('omits patient notes for non-clinic services', () => {
    expect(
      buildClinicPatientNotesPayload(haircut, {
        referralNotes: 'GP referral',
        symptoms: 'Headache',
      }),
    ).toEqual({});
  });

  it('gates patient notes section by clinic metadata', () => {
    expect(shouldShowClinicPatientNotesSection(labTest)).toBe(true);
    expect(shouldShowClinicPatientNotesSection(haircut)).toBe(false);
    expect(
      shouldShowClinicPatientNotesSection({
        ...labTest,
        acceptsPatientNotes: false,
      }),
    ).toBe(false);
  });
});
