-- vert-clinic-2.8.3: Staff patient chart alerts (TestResultReleased, IntakeIncomplete)

CREATE TABLE IF NOT EXISTS clinic_patient_alert_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  alert_type VARCHAR(32) NOT NULL,
  source_id UUID NOT NULL,
  dismissed_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_patient_alert_dismissals_unique
  ON clinic_patient_alert_dismissals(business_id, customer_id, alert_type, source_id);

CREATE INDEX IF NOT EXISTS idx_clinic_patient_alert_dismissals_customer
  ON clinic_patient_alert_dismissals(business_id, customer_id);
