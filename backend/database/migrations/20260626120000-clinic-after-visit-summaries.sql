-- vert-clinic-2.10.3: Post-consultation after-visit summary (adapt Pollin after_visit_summary)

CREATE TABLE IF NOT EXISTS clinic_after_visit_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  released_to_patient BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_after_visit_summaries_business_customer
  ON clinic_after_visit_summaries(business_id, customer_id, created_at DESC);
