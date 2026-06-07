-- vert-clinic-2.8.2: Pre-visit intake assignments linked to customer chart or booking

CREATE TABLE IF NOT EXISTS clinic_pre_visit_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  questionnaire_id UUID NOT NULL REFERENCES clinic_questionnaires(id) ON DELETE RESTRICT,
  response_id UUID REFERENCES clinic_questionnaire_responses(id) ON DELETE SET NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'assigned',
  assigned_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_pre_visit_intakes_customer
  ON clinic_pre_visit_intakes(business_id, customer_id, status);

CREATE INDEX IF NOT EXISTS idx_clinic_pre_visit_intakes_booking
  ON clinic_pre_visit_intakes(business_id, booking_id, status);
