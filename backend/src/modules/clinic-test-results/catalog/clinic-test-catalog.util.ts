export const CLINIC_PLAYBOOK_DEPARTMENTS = [
  'General Practice',
  'Laboratory',
  'Cardiology',
  'Imaging',
  'Dental',
  'Dermatology',
] as const;

export type ClinicPlaybookDepartment =
  (typeof CLINIC_PLAYBOOK_DEPARTMENTS)[number];

export interface ClinicTestCatalogServiceLink {
  id: string;
  name: string;
  categoryId?: string | null;
  categoryName?: string | null;
  serviceType?: string | null;
  requiresFasting?: boolean;
  preparationNotes?: string | null;
  price?: number;
}

export function resolveClinicalDepartmentLabel(
  categoryName: string | null | undefined,
): string | null {
  if (!categoryName?.trim()) return null;
  return categoryName.trim();
}

export function isKnownClinicalDepartment(
  categoryName: string | null | undefined,
): boolean {
  const label = resolveClinicalDepartmentLabel(categoryName);
  if (!label) return false;
  return (CLINIC_PLAYBOOK_DEPARTMENTS as readonly string[]).some(
    (department) => department.toLowerCase() === label.toLowerCase(),
  );
}

export function slugifyClinicTestCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

export function buildClinicTestTypeCode(input: {
  code?: string | null;
  title: string;
}): string {
  const explicit = input.code?.trim();
  if (explicit) return explicit.slice(0, 64);
  const slug = slugifyClinicTestCode(input.title);
  return slug || 'lab_test';
}

export function inheritCatalogFieldsFromService(
  service: ClinicTestCatalogServiceLink,
  overrides: {
    requiresFasting?: boolean;
    preparationNotes?: string | null;
    price?: number;
  },
): {
  requiresFasting: boolean;
  preparationNotes?: string | null;
  price: number;
  department: string | null;
} {
  return {
    requiresFasting:
      overrides.requiresFasting ?? service.requiresFasting ?? false,
    preparationNotes:
      overrides.preparationNotes !== undefined
        ? overrides.preparationNotes
        : (service.preparationNotes ?? null),
    price: overrides.price ?? service.price ?? 0,
    department: resolveClinicalDepartmentLabel(service.categoryName),
  };
}

export function applyClinicTestTypeLinkToServiceMetadata(
  metadata: Record<string, unknown> | null | undefined,
  testTypeId: string | null,
): Record<string, unknown> {
  const next = { ...(metadata ?? {}) };
  if (testTypeId) {
    next.clinicTestTypeId = testTypeId;
  } else {
    delete next.clinicTestTypeId;
  }
  return next;
}

export function readClinicTestTypeIdFromServiceMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const value = metadata?.clinicTestTypeId;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
