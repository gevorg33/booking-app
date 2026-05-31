-- gap-8.7: Customer multi-service booking (ad-hoc)

CREATE TABLE IF NOT EXISTS multi_service_booking_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  scheduling_mode VARCHAR(32) NOT NULL DEFAULT 'same_visit',
  total_duration_minutes INT NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  block_start_time TIMESTAMPTZ,
  primary_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_multi_service_groups_business ON multi_service_booking_groups(business_id);
CREATE INDEX IF NOT EXISTS idx_multi_service_groups_customer ON multi_service_booking_groups(customer_id);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS multi_service_group_id UUID REFERENCES multi_service_booking_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_multi_service_group ON bookings(multi_service_group_id);
