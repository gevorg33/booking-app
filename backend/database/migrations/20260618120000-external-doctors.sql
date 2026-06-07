-- vert-clinic-2.5.8: External / referring doctors registry (business-scoped)

CREATE TABLE IF NOT EXISTS external_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  clinic_name VARCHAR(255),
  specialty VARCHAR(128),
  street VARCHAR(255) NOT NULL,
  unit VARCHAR(64),
  city VARCHAR(128) NOT NULL,
  province VARCHAR(128) NOT NULL,
  country VARCHAR(128) NOT NULL,
  postal_code VARCHAR(32) NOT NULL,
  fax_number VARCHAR(64),
  phone VARCHAR(64),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  updated_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_doctors_business_active
  ON external_doctors(business_id, is_active);

CREATE INDEX IF NOT EXISTS idx_external_doctors_business_name
  ON external_doctors(business_id, LOWER(name));
