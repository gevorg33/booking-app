-- Prevent duplicate loyalty earn transactions for the same booking.
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_transactions_earn_booking_unique
ON loyalty_transactions ("bookingId")
WHERE type = 'earn' AND "bookingId" IS NOT NULL;
