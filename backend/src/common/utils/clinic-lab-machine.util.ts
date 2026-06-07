export const CLINIC_LAB_MACHINE_NAME_MAX_LENGTH = 255;

export function normalizeClinicLabMachineName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function isValidClinicLabMachineName(
  value: string | null | undefined,
): boolean {
  if (typeof value !== 'string') return false;
  const normalized = normalizeClinicLabMachineName(value);
  return (
    normalized.length >= 1 &&
    normalized.length <= CLINIC_LAB_MACHINE_NAME_MAX_LENGTH
  );
}
