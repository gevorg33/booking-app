-- vert-clinic-2.3.1: Specimen storage locations, transport folders, specimen tracking refs

CREATE TABLE IF NOT EXISTS clinic_specimen_storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  site_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, code)
);

CREATE INDEX IF NOT EXISTS idx_clinic_specimen_storage_locations_business_active
  ON clinic_specimen_storage_locations(business_id, is_active);

CREATE TABLE IF NOT EXISTS clinic_transport_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  folder_code VARCHAR(64) NOT NULL,
  label VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'Open',
  origin_storage_location_id UUID REFERENCES clinic_specimen_storage_locations(id) ON DELETE SET NULL,
  destination_storage_location_id UUID REFERENCES clinic_specimen_storage_locations(id) ON DELETE SET NULL,
  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, folder_code)
);

CREATE INDEX IF NOT EXISTS idx_clinic_transport_folders_business_status
  ON clinic_transport_folders(business_id, status);

ALTER TABLE clinic_specimens
  ADD COLUMN IF NOT EXISTS storage_location_id UUID
    REFERENCES clinic_specimen_storage_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transport_folder_id UUID
    REFERENCES clinic_transport_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stored_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_clinic_specimens_storage_location
  ON clinic_specimens(storage_location_id);

CREATE INDEX IF NOT EXISTS idx_clinic_specimens_transport_folder
  ON clinic_specimens(transport_folder_id);
