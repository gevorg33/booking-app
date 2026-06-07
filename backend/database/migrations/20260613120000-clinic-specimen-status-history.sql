-- vert-clinic-2.3.2: Specimen status transition audit trail

CREATE TABLE IF NOT EXISTS clinic_specimen_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specimen_id UUID NOT NULL REFERENCES clinic_specimens(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  previous_status VARCHAR(32),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_specimen_status_history_specimen
  ON clinic_specimen_status_history(specimen_id, created_at);
