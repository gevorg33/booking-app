-- vert-clinic-2.10.2: Optional billing code link on clinic test types

ALTER TABLE clinic_test_types
  ADD COLUMN IF NOT EXISTS clinic_diagnostic_code_id UUID
    REFERENCES clinic_diagnostic_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clinic_test_types_diagnostic_code
  ON clinic_test_types(clinic_diagnostic_code_id)
  WHERE clinic_diagnostic_code_id IS NOT NULL;
