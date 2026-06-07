import type {
  ClinicDiagnosticCodeKind,
  ClinicDiagnosticCodeSystem,
} from './clinic-diagnostic-code.types.js';
import {
  CLINIC_DIAGNOSTIC_CODE_KINDS,
  CLINIC_DIAGNOSTIC_CODE_SYSTEMS,
  FORBIDDEN_CLINIC_BILLING_CODE_SYSTEMS,
} from './clinic-diagnostic-code.types.js';

export const CLINIC_DIAGNOSTIC_CODE_LIST_DEFAULT_PAGE_SIZE = 25;
export const CLINIC_DIAGNOSTIC_CODE_MAX_LENGTH = 64;
export const CLINIC_DIAGNOSTIC_CODE_DESCRIPTION_MAX_LENGTH = 2000;
export const CLINIC_DIAGNOSTIC_CODE_SEARCH_MIN_LENGTH = 1;

export function isClinicDiagnosticCodeKind(
  value: unknown,
): value is ClinicDiagnosticCodeKind {
  return (
    typeof value === 'string' &&
    (CLINIC_DIAGNOSTIC_CODE_KINDS as readonly string[]).includes(value)
  );
}

export function isClinicDiagnosticCodeSystem(
  value: unknown,
): value is ClinicDiagnosticCodeSystem {
  return (
    typeof value === 'string' &&
    (CLINIC_DIAGNOSTIC_CODE_SYSTEMS as readonly string[]).includes(value)
  );
}

export function isForbiddenClinicBillingCodeSystem(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toUpperCase();
  return (FORBIDDEN_CLINIC_BILLING_CODE_SYSTEMS as readonly string[]).some(
    (forbidden) => forbidden.toUpperCase() === normalized,
  );
}

export function assertAllowedClinicDiagnosticCodeKind(
  value: unknown,
): ClinicDiagnosticCodeKind {
  if (!isClinicDiagnosticCodeKind(value)) {
    throw new Error('Unsupported clinic diagnostic code kind');
  }
  return value;
}

export function assertAllowedClinicDiagnosticCodeSystem(
  value: unknown,
): ClinicDiagnosticCodeSystem {
  if (isForbiddenClinicBillingCodeSystem(value)) {
    throw new Error('Canada OHIP/MDBilling code systems are not supported');
  }
  if (!isClinicDiagnosticCodeSystem(value)) {
    throw new Error('Unsupported clinic diagnostic code system');
  }
  return value;
}

export function normalizeClinicDiagnosticCode(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeClinicDiagnosticCodeDescription(
  value: string,
): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function buildClinicDiagnosticCodeSearchDescription(input: {
  code: string;
  description: string;
  searchDescription?: string | null;
}): string {
  const explicit = input.searchDescription?.trim();
  if (explicit) return explicit.replace(/\s+/g, ' ');
  return `${input.code} ${input.description}`.trim().replace(/\s+/g, ' ');
}

export function formatClinicDiagnosticCodeLabel(input: {
  codeSystem: ClinicDiagnosticCodeSystem;
  code: string;
  description: string;
}): string {
  return `${input.codeSystem} ${input.code} — ${input.description}`;
}
