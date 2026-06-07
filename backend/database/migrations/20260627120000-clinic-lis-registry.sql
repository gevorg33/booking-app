-- vert-clinic-2.6.1: Lab registry, machines, LIS observation sync adapters

CREATE TABLE IF NOT EXISTS clinic_lab_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(512) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  lab_location VARCHAR(16) NOT NULL DEFAULT 'External',
  lab_type VARCHAR(16),
  integration_vendor_code VARCHAR(64),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_lab_info_business_active
  ON clinic_lab_info(business_id, is_active, name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_lab_info_business_internal_type
  ON clinic_lab_info(business_id, lab_type)
  WHERE lab_type IS NOT NULL;

CREATE TABLE IF NOT EXISTS clinic_lab_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lab_info_id UUID REFERENCES clinic_lab_info(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_lab_machines_business_active
  ON clinic_lab_machines(business_id, is_active, name);

ALTER TABLE clinic_specimens
  ADD COLUMN IF NOT EXISTS lab_machine_id UUID REFERENCES clinic_lab_machines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clinic_specimens_lab_machine
  ON clinic_specimens(lab_machine_id)
  WHERE lab_machine_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS clinic_lab_sync_observation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lab_info_id UUID REFERENCES clinic_lab_info(id) ON DELETE SET NULL,
  test_name VARCHAR(255) NOT NULL,
  universal_code VARCHAR(128) NOT NULL,
  patient_first_name VARCHAR(128) NOT NULL,
  patient_middle_name VARCHAR(128),
  patient_last_name VARCHAR(128) NOT NULL,
  patient_date_of_birth DATE,
  patient_external_id VARCHAR(128),
  patient_address VARCHAR(512),
  patient_postal_code VARCHAR(32),
  patient_phone VARCHAR(64),
  patient_sex_at_birth VARCHAR(32),
  system_received_on TIMESTAMPTZ NOT NULL,
  specimen_received_on TIMESTAMPTZ,
  observation_date TIMESTAMPTZ,
  placer_order_number VARCHAR(128),
  ordering_provider VARCHAR(255),
  filler_order_number VARCHAR(128),
  diagnostic_service_section_id VARCHAR(64),
  vendor_result_status VARCHAR(64),
  department VARCHAR(128),
  revision_id VARCHAR(128),
  integration_vendor_code VARCHAR(64),
  status VARCHAR(16) NOT NULL DEFAULT 'Unlinked',
  void_reason TEXT,
  clinic_test_result_id UUID REFERENCES clinic_test_results(id) ON DELETE SET NULL,
  link_method VARCHAR(16),
  linked_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_lab_sync_obs_req_business_status
  ON clinic_lab_sync_observation_requests(business_id, status, system_received_on DESC);

CREATE TABLE IF NOT EXISTS clinic_lab_sync_observation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_request_id UUID NOT NULL REFERENCES clinic_lab_sync_observation_requests(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  universal_code VARCHAR(128) NOT NULL,
  result_value TEXT NOT NULL,
  lab_comment TEXT,
  vendor_result_status VARCHAR(64),
  observation_date TIMESTAMPTZ,
  producer_id VARCHAR(128),
  producer_text VARCHAR(255),
  unit VARCHAR(64),
  reference_range VARCHAR(128),
  abnormal_flags VARCHAR(64),
  revision_id VARCHAR(128),
  clinic_test_result_measurement_id UUID REFERENCES clinic_test_result_measurements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_lab_sync_obs_res_request
  ON clinic_lab_sync_observation_results(observation_request_id);
