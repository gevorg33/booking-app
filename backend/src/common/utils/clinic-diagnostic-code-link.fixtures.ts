import type { ClinicServiceType } from './clinic-service.util.js';
import {
  applyClinicDiagnosticCodeLinkToServiceMetadata,
  expectedClinicDiagnosticCodeKindForServiceType,
  readClinicDiagnosticCodeIdFromServiceMetadata,
  validateClinicDiagnosticCodeKindMatch,
  validateClinicTestTypeDiagnosticCodeKind,
} from './clinic-diagnostic-code-link.util.js';

export const CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES = {
  consultationDiagnostic: {
    id: 'code-diag-1',
    codeKind: 'diagnostic',
    codeSystem: 'ICD-10-CM',
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
  },
  labProcedure: {
    id: 'code-proc-1',
    codeKind: 'procedure',
    codeSystem: 'CPT',
    code: '80053',
    description: 'Comprehensive metabolic panel',
  },
} as const;

export const CLINIC_DIAGNOSTIC_CODE_KIND_MATCH_SCENARIOS = [
  {
    id: 'consultation-diagnostic',
    serviceType: 'consultation' as ClinicServiceType,
    codeKind: 'diagnostic' as const,
    allowed: true,
  },
  {
    id: 'consultation-procedure-rejected',
    serviceType: 'consultation' as ClinicServiceType,
    codeKind: 'procedure' as const,
    allowed: false,
  },
  {
    id: 'lab-test-procedure',
    serviceType: 'lab_test' as ClinicServiceType,
    codeKind: 'procedure' as const,
    allowed: true,
  },
  {
    id: 'procedure-procedure',
    serviceType: 'procedure' as ClinicServiceType,
    codeKind: 'procedure' as const,
    allowed: true,
  },
] as const;

export const CLINIC_DIAGNOSTIC_CODE_METADATA_SCENARIOS = [
  {
    id: 'apply-link',
    codeId: 'code-proc-1',
    expected: 'code-proc-1',
  },
  {
    id: 'clear-link',
    codeId: null,
    expected: null,
  },
] as const;
