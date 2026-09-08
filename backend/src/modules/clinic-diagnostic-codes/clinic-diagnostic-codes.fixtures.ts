import type { ClinicDiagnosticCode } from './entities/clinic-diagnostic-code.entity.js';

export const CLINIC_DIAGNOSTIC_CODE_FIXTURES = [
  {
    id: 'code-diag-1',
    businessId: 'biz-1',
    codeKind: 'diagnostic',
    codeSystem: 'ICD-10-CM',
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    searchDescription: 'E11.9 Type 2 diabetes mellitus without complications',
    isActive: true,
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
    updatedAt: new Date('2026-06-02T10:00:00.000Z'),
  },
  {
    id: 'code-proc-1',
    businessId: 'biz-1',
    codeKind: 'procedure',
    codeSystem: 'CPT',
    code: '80053',
    description: 'Comprehensive metabolic panel',
    searchDescription: '80053 Comprehensive metabolic panel',
    isActive: true,
    createdAt: new Date('2026-06-01T11:00:00.000Z'),
    updatedAt: new Date('2026-06-01T11:00:00.000Z'),
  },
  {
    id: 'code-diag-inactive',
    businessId: 'biz-1',
    codeKind: 'diagnostic',
    codeSystem: 'LOCAL',
    code: 'LEGACY-1',
    description: 'Retired local code',
    searchDescription: 'LEGACY-1 Retired local code',
    isActive: false,
    createdAt: new Date('2026-05-01T10:00:00.000Z'),
    updatedAt: new Date('2026-06-01T10:00:00.000Z'),
  },
] as const satisfies ReadonlyArray<Partial<ClinicDiagnosticCode>>;

export const CLINIC_DIAGNOSTIC_CODE_CREATE_PAYLOADS = [
  {
    id: 'create-diagnostic-icd',
    dto: {
      codeKind: 'diagnostic',
      codeSystem: 'ICD-10-CM',
      code: 'J06.9',
      description: 'Acute upper respiratory infection, unspecified',
    },
  },
  {
    id: 'create-procedure-cpt',
    dto: {
      codeKind: 'procedure',
      codeSystem: 'CPT',
      code: '36415',
      description: 'Collection of venous blood by venipuncture',
      searchDescription: '36415 venipuncture blood draw',
    },
  },
  {
    id: 'create-local-other',
    dto: {
      codeKind: 'procedure',
      codeSystem: 'LOCAL',
      code: 'LAB-PANEL-A',
      description: 'Tenant custom lab panel A',
    },
  },
] as const;

export const FORBIDDEN_BILLING_CODE_SYSTEM_SCENARIOS = [
  { id: 'reject-ohip', codeSystem: 'OHIP' },
  { id: 'reject-mdbilling', codeSystem: 'MDBILLING' },
  { id: 'reject-md-billing', codeSystem: 'MD-BILLING' },
] as const;

/**
 * Declared so the array is one type, not a union of two literal shapes. The two
 * members assert different outputs — one normalisation, one search string — so
 * each expectation is optional.
 */
export type ClinicDiagnosticCodeNormalizationScenario = {
  id: string;
  input: { code: string; description: string };
  expectedCode?: string;
  expectedDescription?: string;
  expectedSearch?: string;
};

export const CLINIC_DIAGNOSTIC_CODE_NORMALIZATION_SCENARIOS: readonly ClinicDiagnosticCodeNormalizationScenario[] = [
  {
    id: 'trim-and-uppercase-code',
    input: { code: ' e11.9 ', description: '  Type 2 diabetes  ' },
    expectedCode: 'E11.9',
    expectedDescription: 'Type 2 diabetes',
  },
  {
    id: 'build-search-description',
    input: { code: '80053', description: 'Comprehensive metabolic panel' },
    expectedSearch: '80053 Comprehensive metabolic panel',
  },
] as const;
