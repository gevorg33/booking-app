export const CLINIC_VERTICAL_BUSINESS_TYPES = [
  'clinic',
  'polyclinic',
  'beauty_clinic',
  'dental',
] as const;

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
