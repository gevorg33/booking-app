-- vert-clinic-2.5.1: Generic patient clinical profile (single row per customer; no fertility fields)

CREATE TABLE IF NOT EXISTS patient_clinical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  allergies TEXT,
  chronic_problems TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  blood_type VARCHAR(16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_clinical_profiles_business_customer
  ON patient_clinical_profiles(business_id, customer_id);
