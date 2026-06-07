-- vert-clinic-2.5.3: Visit note per completed consultation booking (provider-authored, addenda)

CREATE TABLE IF NOT EXISTS patient_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  visit_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_encounters_business_customer
  ON patient_encounters(business_id, customer_id);

CREATE TABLE IF NOT EXISTS patient_encounter_addenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES patient_encounters(id) ON DELETE CASCADE,
  author_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_encounter_addenda_encounter
  ON patient_encounter_addenda(encounter_id, created_at);
