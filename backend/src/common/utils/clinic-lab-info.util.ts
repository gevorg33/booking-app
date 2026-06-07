import type {
  ClinicLabInfoType,
  ClinicLabLocation,
} from './clinic-lis.types.js';
import {
  CLINIC_LAB_INFO_TYPES,
  CLINIC_LAB_LOCATIONS,
  FORBIDDEN_CLINIC_LIS_INTEGRATION_VENDOR_CODES,
} from './clinic-lis.types.js';

export const CLINIC_LAB_INFO_NAME_MAX_LENGTH = 255;
export const CLINIC_LAB_INFO_LOCATION_MAX_LENGTH = 512;
export const CLINIC_LAB_INFO_PHONE_MAX_LENGTH = 64;
export const CLINIC_LAB_INTEGRATION_VENDOR_CODE_MAX_LENGTH = 64;

export function isClinicLabLocation(
  value: unknown,
): value is ClinicLabLocation {
  return (
    typeof value === 'string' &&
    (CLINIC_LAB_LOCATIONS as readonly string[]).includes(value)
  );
}

export function isClinicLabInfoType(
  value: unknown,
): value is ClinicLabInfoType {
  return (
    typeof value === 'string' &&
    (CLINIC_LAB_INFO_TYPES as readonly string[]).includes(value)
  );
}

export function isForbiddenClinicLisIntegrationVendorCode(
  value: unknown,
): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toUpperCase();
  return (
    FORBIDDEN_CLINIC_LIS_INTEGRATION_VENDOR_CODES as readonly string[]
  ).some((forbidden) => forbidden.toUpperCase() === normalized);
}

export function assertAllowedClinicLabLocation(
  value: unknown,
): ClinicLabLocation {
  if (!isClinicLabLocation(value)) {
    throw new Error('Unsupported clinic lab location');
  }
  return value;
}

export function assertAllowedClinicLabInfoType(
  value: unknown,
): ClinicLabInfoType | null {
  if (value == null || value === '') return null;
  if (!isClinicLabInfoType(value)) {
    throw new Error('Unsupported clinic lab type');
  }
  return value;
}

export function normalizeClinicLabInfoName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeClinicLabIntegrationVendorCode(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toUpperCase();
}

export function assertAllowedClinicLabIntegrationVendorCode(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeClinicLabIntegrationVendorCode(value);
  if (normalized && isForbiddenClinicLisIntegrationVendorCode(normalized)) {
    throw new Error('Region-specific LIS vendor codes are not supported');
  }
  return normalized;
}

export function listExternalClinicLabInfo<
  T extends { labLocation: ClinicLabLocation; isActive?: boolean },
>(labs: T[]): T[] {
  return labs.filter(
    (lab) => lab.labLocation === 'External' && lab.isActive !== false,
  );
}
