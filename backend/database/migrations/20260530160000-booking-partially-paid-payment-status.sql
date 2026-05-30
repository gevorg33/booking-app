-- Add partially_paid to booking payment status enum (PostgreSQL / TypeORM).
DO $$
BEGIN
  ALTER TYPE bookings_paymentstatus_enum ADD VALUE IF NOT EXISTS 'partially_paid';
EXCEPTION
  WHEN undefined_object THEN
    BEGIN
      ALTER TYPE "bookings_paymentStatus_enum" ADD VALUE IF NOT EXISTS 'partially_paid';
    EXCEPTION
      WHEN undefined_object THEN
        RAISE NOTICE 'Could not alter payment status enum — add partially_paid manually if needed';
    END;
END $$;
