-- vert-clinic-2.9.1: Generic clinic staff tasks (no IVF AutomatedTaskType values)

CREATE TABLE IF NOT EXISTS clinic_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  task_type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  title VARCHAR(255) NOT NULL,
  notes TEXT,
  priority VARCHAR(16) NOT NULL DEFAULT 'normal',
  due_at TIMESTAMPTZ,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  test_order_id UUID REFERENCES clinic_test_orders(id) ON DELETE SET NULL,
  test_result_id UUID REFERENCES clinic_test_results(id) ON DELETE SET NULL,
  specimen_id UUID REFERENCES clinic_specimens(id) ON DELETE SET NULL,
  encounter_id UUID REFERENCES patient_encounters(id) ON DELETE SET NULL,
  assignee_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  completed_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clinic_tasks_type_check CHECK (
    task_type IN ('ResultReview', 'SpecimenCollection', 'PatientCallback')
  ),
  CONSTRAINT clinic_tasks_status_check CHECK (
    status IN ('open', 'in_progress', 'completed', 'cancelled')
  ),
  CONSTRAINT clinic_tasks_priority_check CHECK (
    priority IN ('normal', 'high')
  )
);

CREATE INDEX IF NOT EXISTS idx_clinic_tasks_business_status_due
  ON clinic_tasks(business_id, status, due_at);

CREATE INDEX IF NOT EXISTS idx_clinic_tasks_business_assignee_status
  ON clinic_tasks(business_id, assignee_employee_id, status);

CREATE INDEX IF NOT EXISTS idx_clinic_tasks_business_type_status
  ON clinic_tasks(business_id, task_type, status);

CREATE INDEX IF NOT EXISTS idx_clinic_tasks_business_customer
  ON clinic_tasks(business_id, customer_id, status);
