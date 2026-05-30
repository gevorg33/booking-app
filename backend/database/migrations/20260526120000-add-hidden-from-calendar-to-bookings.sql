-- Hide appointments from calendar without deleting records
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS hidden_from_calendar boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_bookings_calendar_visible
  ON bookings (business_id, employee_id, "startTime")
  WHERE hidden_from_calendar = false;
