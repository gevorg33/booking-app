-- vert-clinic-2.10.1: Tenant diagnostic/procedure code catalog (region-agnostic; no OHIP/MDBilling)

CREATE TABLE IF NOT EXISTS clinic_diagnostic_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code_kind VARCHAR(16) NOT NULL,
  code_system VARCHAR(32) NOT NULL,
  code VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  search_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  updated_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clinic_diagnostic_codes_kind_check CHECK (
    code_kind IN ('diagnostic', 'procedure')
  ),
  CONSTRAINT clinic_diagnostic_codes_system_check CHECK (
    code_system IN ('ICD-10-CM', 'ICD-10', 'CPT', 'HCPCS', 'SNOMED-CT', 'LOCAL', 'OTHER')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinic_diagnostic_codes_business_kind_system_code
  ON clinic_diagnostic_codes(business_id, code_kind, code_system, code);

CREATE INDEX IF NOT EXISTS idx_clinic_diagnostic_codes_business_active
  ON clinic_diagnostic_codes(business_id, is_active);

CREATE INDEX IF NOT EXISTS idx_clinic_diagnostic_codes_business_kind
  ON clinic_diagnostic_codes(business_id, code_kind, is_active);
