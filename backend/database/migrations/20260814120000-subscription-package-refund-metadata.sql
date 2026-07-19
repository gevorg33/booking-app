-- Stripe refund bookkeeping for subscriptions and package purchases

ALTER TABLE customer_subscriptions
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE package_purchases
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
