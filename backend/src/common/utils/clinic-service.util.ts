export const CLINIC_SERVICE_TYPES = [
  'consultation',
  'lab_test',
  'procedure',
] as const;

export type ClinicServiceType = (typeof CLINIC_SERVICE_TYPES)[number];

export const CLINIC_VERTICAL_BUSINESS_TYPES = [
  'clinic',
  'polyclinic',
  'beauty_clinic',
  'dental',
] as const;

export type ClinicVerticalBusinessType =
  (typeof CLINIC_VERTICAL_BUSINESS_TYPES)[number];

export interface ClinicServiceMetadata {
  serviceType: ClinicServiceType;
  requiresFasting?: boolean;
  preparationNotes?: string;
}

export interface ClinicBookingMetadata {
  referralNotes?: string;
  symptoms?: string;
}

export function isClinicServiceType(
  value: unknown,
): value is ClinicServiceType {
  return (
    typeof value === 'string' &&
    (CLINIC_SERVICE_TYPES as readonly string[]).includes(value)
  );
}

export function isClinicVerticalBusinessType(
  businessType: string | undefined | null,
): boolean {
  if (!businessType) return false;
  return (CLINIC_VERTICAL_BUSINESS_TYPES as readonly string[]).includes(
    businessType,
  );
}

/** Gate dashboard/public Results tabs by clinic vertical (vert-clinic-1.13; UI ships in 1.7). */
export function shouldShowPatientResultsTab(
  businessType: string | undefined | null,
): boolean {
  return isClinicVerticalBusinessType(businessType);
}

export function extractClinicMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ClinicServiceMetadata | null {
  if (!metadata || !isClinicServiceType(metadata.serviceType)) return null;
  const clinic: ClinicServiceMetadata = { serviceType: metadata.serviceType };
  if (metadata.requiresFasting === true) {
    clinic.requiresFasting = true;
  }
  if (
    typeof metadata.preparationNotes === 'string' &&
    metadata.preparationNotes.trim()
  ) {
    clinic.preparationNotes = metadata.preparationNotes.trim();
  }
  return clinic;
}

export function isClinicService(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return extractClinicMetadata(metadata) !== null;
}

export function applyClinicMetadataToServiceMetadata(
  existing: Record<string, unknown> | null | undefined,
  clinic: Partial<Omit<ClinicServiceMetadata, 'serviceType'>> & {
    serviceType?: ClinicServiceType | null;
  },
): Record<string, unknown> {
  const base = { ...(existing ?? {}) };
  if (clinic.serviceType === null) {
    delete base.serviceType;
    delete base.requiresFasting;
    delete base.preparationNotes;
    return base;
  }
  if (clinic.serviceType && isClinicServiceType(clinic.serviceType)) {
    base.serviceType = clinic.serviceType;
  }
  if (clinic.requiresFasting !== undefined) {
    if (clinic.requiresFasting) base.requiresFasting = true;
    else delete base.requiresFasting;
  }
  if (clinic.preparationNotes !== undefined) {
    if (clinic.preparationNotes) {
      base.preparationNotes = clinic.preparationNotes;
    } else {
      delete base.preparationNotes;
    }
  }
  return base;
}

export function buildClinicServiceMetadataFromDraft(draft: {
  serviceType?: string;
  requiresFasting?: boolean;
  preparationNotes?: string;
}): Record<string, unknown> | undefined {
  if (!isClinicServiceType(draft.serviceType)) return undefined;
  return applyClinicMetadataToServiceMetadata(
    {},
    {
      serviceType: draft.serviceType,
      requiresFasting: draft.requiresFasting,
      preparationNotes: draft.preparationNotes,
    },
  );
}

export function formatClinicServiceTypeBadge(
  serviceType: ClinicServiceType,
): string {
  switch (serviceType) {
    case 'consultation':
      return 'Consultation';
    case 'lab_test':
      return 'Lab test';
    case 'procedure':
      return 'Procedure';
    default:
      return serviceType;
  }
}

export function buildClinicBookingMetadata(input: {
  referralNotes?: string;
  symptoms?: string;
}): ClinicBookingMetadata {
  const meta: ClinicBookingMetadata = {};
  if (input.referralNotes?.trim()) {
    meta.referralNotes = input.referralNotes.trim();
  }
  if (input.symptoms?.trim()) {
    meta.symptoms = input.symptoms.trim();
  }
  return meta;
}

export function extractClinicBookingMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ClinicBookingMetadata {
  const result: ClinicBookingMetadata = {};
  if (
    typeof metadata?.referralNotes === 'string' &&
    metadata.referralNotes.trim()
  ) {
    result.referralNotes = metadata.referralNotes.trim();
  }
  if (typeof metadata?.symptoms === 'string' && metadata.symptoms.trim()) {
    result.symptoms = metadata.symptoms.trim();
  }
  return result;
}

export function clinicServiceAcceptsPatientNotes(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return isClinicService(metadata);
}

export {
  isClinicLabTestService,
  clinicLabTestOffersPreVisitIntake,
} from './clinic-public-pre-visit-intake.util.js';
