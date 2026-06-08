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
  offersPreVisitIntake?: boolean;
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

/** Gate consumer/public My results by clinic vertical (vert-clinic-1.13). */
export function shouldShowPatientResultsTab(
  businessType: string | undefined | null,
): boolean {
  return isClinicVerticalBusinessType(businessType);
}

export function formatClinicServiceTypeBadge(
  serviceType: ClinicServiceType | undefined,
  copy: {
    clinicServiceTypeConsultation: string;
    clinicServiceTypeLabTest: string;
    clinicServiceTypeProcedure: string;
  },
): string | null {
  if (!serviceType) return null;
  const labels: Record<ClinicServiceType, string> = {
    consultation: copy.clinicServiceTypeConsultation,
    lab_test: copy.clinicServiceTypeLabTest,
    procedure: copy.clinicServiceTypeProcedure,
  };
  return labels[serviceType] ?? serviceType;
}
