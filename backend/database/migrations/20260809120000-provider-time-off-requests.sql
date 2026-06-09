-- prov-exp-7.2: provider time-off requests with manager approval

CREATE TABLE IF NOT EXISTS provider_time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  daily_start_time varchar(5) NOT NULL DEFAULT '00:00',
  daily_end_time varchar(5) NOT NULL DEFAULT '23:59',
  reason text,
  status varchar(16) NOT NULL DEFAULT 'pending',
  reviewed_by_user_id uuid,
  reviewed_at timestamptz,
  review_notes text,
  block_schedule_id uuid REFERENCES block_schedules(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_time_off_business_status
  ON provider_time_off_requests (business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_time_off_employee
  ON provider_time_off_requests (business_id, employee_id, start_date DESC);
