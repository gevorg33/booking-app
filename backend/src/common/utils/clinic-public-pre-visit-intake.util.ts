import {
  extractClinicMetadata,
  isClinicService,
  type ClinicServiceMetadata,
} from './clinic-service.util.js';

export function isClinicLabTestService(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return extractClinicMetadata(metadata)?.serviceType === 'lab_test';
}

export function clinicLabTestOffersPreVisitIntake(
  metadata: Record<string, unknown> | null | undefined,
  hasPublishedIntakeQuestionnaire: boolean,
): boolean {
  return isClinicLabTestService(metadata) && hasPublishedIntakeQuestionnaire;
}

export function assertClinicLabTestService(
  metadata: Record<string, unknown> | null | undefined,
): ClinicServiceMetadata {
  const clinic = extractClinicMetadata(metadata);
  if (!clinic || clinic.serviceType !== 'lab_test') {
    throw new Error('Service is not a lab test');
  }
  return clinic;
}

export function canLinkPreVisitIntakeToBooking(input: {
  intakeCustomerId: string;
  bookingCustomerId: string;
  intakeBookingId: string | null | undefined;
}): boolean {
  return (
    input.intakeCustomerId === input.bookingCustomerId &&
    (input.intakeBookingId == null || input.intakeBookingId === '')
  );
}

export function isPublicClinicCheckoutService(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return isClinicService(metadata);
}
