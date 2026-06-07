import type { ClinicServiceType } from './clinic-service.util.js';
import type {
  ClinicDiagnosticCodeKind,
  ClinicDiagnosticCodeSystem,
} from './clinic-diagnostic-code.types.js';

export const CLINIC_DIAGNOSTIC_CODE_METADATA_KEY = 'clinicDiagnosticCodeId';

export function readClinicDiagnosticCodeIdFromServiceMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const value = metadata?.[CLINIC_DIAGNOSTIC_CODE_METADATA_KEY];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function applyClinicDiagnosticCodeLinkToServiceMetadata(
  metadata: Record<string, unknown> | null | undefined,
  clinicDiagnosticCodeId: string | null,
): Record<string, unknown> {
  const next = { ...(metadata ?? {}) };
  if (clinicDiagnosticCodeId) {
    next[CLINIC_DIAGNOSTIC_CODE_METADATA_KEY] = clinicDiagnosticCodeId;
  } else {
    delete next[CLINIC_DIAGNOSTIC_CODE_METADATA_KEY];
  }
  return next;
}

export function expectedClinicDiagnosticCodeKindForServiceType(
  serviceType: ClinicServiceType | null | undefined,
): ClinicDiagnosticCodeKind | null {
  if (!serviceType) return null;
  if (serviceType === 'consultation') return 'diagnostic';
  if (serviceType === 'lab_test' || serviceType === 'procedure')
    return 'procedure';
  return null;
}

export function validateClinicDiagnosticCodeKindMatch(
  serviceType: ClinicServiceType | null | undefined,
  codeKind: ClinicDiagnosticCodeKind,
): string | null {
  const expected = expectedClinicDiagnosticCodeKindForServiceType(serviceType);
  if (!expected) {
    return 'Clinic billing codes can only be linked to clinic service types';
  }
  if (expected !== codeKind) {
    return `Expected a ${expected} billing code for ${serviceType} services`;
  }
  return null;
}

export function validateClinicTestTypeDiagnosticCodeKind(
  codeKind: ClinicDiagnosticCodeKind,
): string | null {
  if (codeKind !== 'procedure') {
    return 'Clinic test types must link to procedure billing codes';
  }
  return null;
}

export interface ClinicDiagnosticCodeLinkView {
  id: string;
  codeKind: ClinicDiagnosticCodeKind;
  codeSystem: ClinicDiagnosticCodeSystem;
  code: string;
  description: string;
}

export function mapClinicDiagnosticCodeLinkView(input: {
  id: string;
  codeKind: ClinicDiagnosticCodeKind;
  codeSystem: ClinicDiagnosticCodeSystem;
  code: string;
  description: string;
}): ClinicDiagnosticCodeLinkView {
  return {
    id: input.id,
    codeKind: input.codeKind,
    codeSystem: input.codeSystem,
    code: input.code,
    description: input.description,
  };
}
