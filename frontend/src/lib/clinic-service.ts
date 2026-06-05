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

export interface PublicClinicServiceFields {
  isClinic?: boolean;
  clinicServiceType?: ClinicServiceType;
  clinicServiceTypeBadge?: string;
  requiresFasting?: boolean;
  preparationNotes?: string;
  acceptsPatientNotes?: boolean;
}

export function isPublicClinicService(
  service: PublicClinicServiceFields,
): boolean {
  return service.isClinic === true;
}

export function isClinicVerticalBusinessType(
  businessType: string | undefined | null,
): boolean {
  if (!businessType) return false;
  return (CLINIC_VERTICAL_BUSINESS_TYPES as readonly string[]).includes(
    businessType,
  );
}

export function formatClinicServiceTypeBadge(
  serviceType: ClinicServiceType | undefined,
  t: (key: string) => string,
): string | null {
  if (!serviceType) return null;
  const key = `clinic.serviceType.${serviceType}`;
  const label = t(key);
  return label === key ? serviceType : label;
}
