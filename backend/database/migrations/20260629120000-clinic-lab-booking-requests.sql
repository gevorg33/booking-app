-- Staff-initiated lab orders: push collection booking request to patient (vert-clinic-2.9)
ALTER TABLE clinic_test_orders
  ADD COLUMN IF NOT EXISTS collection_booking_id uuid NULL REFERENCES bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS collection_service_id uuid NULL,
  ADD COLUMN IF NOT EXISTS booking_request_token varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS booking_request_pushed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS booking_request_pushed_by uuid NULL REFERENCES employees(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_test_orders_booking_request_token
  ON clinic_test_orders (booking_request_token)
  WHERE booking_request_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinic_test_orders_pending_booking_request
  ON clinic_test_orders (business_id, customer_id)
  WHERE booking_request_pushed_at IS NOT NULL AND collection_booking_id IS NULL;
