-- vert-clinic-2.1.6: reference range bounds on clinic test types (catalog CRUD + AI configure_test_reference_range)

ALTER TABLE clinic_test_types
  ADD COLUMN IF NOT EXISTS normal_low DECIMAL(12, 4),
  ADD COLUMN IF NOT EXISTS normal_high DECIMAL(12, 4);
