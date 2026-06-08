import {
  isPublicClinicService,
  type PublicClinicServiceFields,
} from './clinic-service.js';

export function trimClinicPatientNote(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildClinicPatientNotesPayload(
  service: PublicClinicServiceFields,
  notes: { symptoms: string; referralNotes: string },
): { symptoms?: string; referralNotes?: string } {
  if (!isPublicClinicService(service) || !service.acceptsPatientNotes) {
    return {};
  }
  return {
    symptoms: trimClinicPatientNote(notes.symptoms),
    referralNotes: trimClinicPatientNote(notes.referralNotes),
  };
}

export function shouldShowClinicPatientNotesSection(
  service: PublicClinicServiceFields | undefined,
): boolean {
  return Boolean(service && isPublicClinicService(service) && service.acceptsPatientNotes);
}
