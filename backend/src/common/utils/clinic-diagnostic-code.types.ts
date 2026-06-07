export const CLINIC_DIAGNOSTIC_CODE_KINDS = [
  'diagnostic',
  'procedure',
] as const;

export type ClinicDiagnosticCodeKind =
  (typeof CLINIC_DIAGNOSTIC_CODE_KINDS)[number];

/** Region-agnostic coding schemes. OHIP / MDBilling Canada systems are intentionally excluded. */
export const CLINIC_DIAGNOSTIC_CODE_SYSTEMS = [
  'ICD-10-CM',
  'ICD-10',
  'CPT',
  'HCPCS',
  'SNOMED-CT',
  'LOCAL',
  'OTHER',
] as const;

export type ClinicDiagnosticCodeSystem =
  (typeof CLINIC_DIAGNOSTIC_CODE_SYSTEMS)[number];

/** Pollin / Canada-only billing integrations — must never ship in Booking clinic catalog. */
export const FORBIDDEN_CLINIC_BILLING_CODE_SYSTEMS = [
  'OHIP',
  'MDBILLING',
  'MD-BILLING',
] as const;

export interface ClinicDiagnosticCodeView {
  id: string;
  businessId: string;
  codeKind: ClinicDiagnosticCodeKind;
  codeSystem: ClinicDiagnosticCodeSystem;
  code: string;
  description: string;
  searchDescription: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicDiagnosticCodeListResponse {
  items: ClinicDiagnosticCodeView[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface ClinicDiagnosticCodeSummary {
  id: string;
  codeKind: ClinicDiagnosticCodeKind;
  codeSystem: ClinicDiagnosticCodeSystem;
  code: string;
  description: string;
}
