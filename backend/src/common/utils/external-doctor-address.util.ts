export interface ExternalDoctorAddressParts {
  street: string;
  unit?: string | null;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

export function formatExternalDoctorAddress(
  parts: ExternalDoctorAddressParts,
): string {
  const streetLine = [parts.unit?.trim(), parts.street.trim()]
    .filter(Boolean)
    .join(' ');
  const locality = [
    parts.city.trim(),
    parts.province.trim(),
    parts.postalCode.trim(),
    parts.country.trim(),
  ]
    .filter(Boolean)
    .join(', ');
  return [streetLine, locality].filter(Boolean).join(', ');
}
