-- Speed up payment sweep and mark-no-show queries scoped by business + status/payment.
CREATE INDEX IF NOT EXISTS idx_bookings_business_status_payment
  ON bookings (business_id, status, payment_status);

CREATE INDEX IF NOT EXISTS idx_bookings_business_payment_start
  ON bookings (business_id, payment_status, start_time);
