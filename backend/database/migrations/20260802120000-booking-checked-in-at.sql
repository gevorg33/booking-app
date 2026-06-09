-- prov-exp-3.1 — provider check-in timestamp on bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_checked_in_at
  ON bookings (business_id, checked_in_at)
  WHERE checked_in_at IS NOT NULL;
