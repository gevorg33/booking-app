-- vert-clinic-2.5.4: Internal staff chart notes (not patient-visible; minimum-necessary roles)

CREATE TABLE IF NOT EXISTS patient_staff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  author_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_staff_notes_business_customer
  ON patient_staff_notes(business_id, customer_id, created_at DESC);
