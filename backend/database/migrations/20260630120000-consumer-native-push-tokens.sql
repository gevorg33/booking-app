-- adopt-4.1 / adopt-4.1.clinic — per-customer native push tokens (FCM/APNs) scoped by tenant.

CREATE TABLE IF NOT EXISTS consumer_native_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  token VARCHAR(512) NOT NULL,
  platform VARCHAR(16) NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumer_native_push_tokens_customer_business
  ON consumer_native_push_tokens (customer_id, business_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_consumer_native_push_tokens_customer_business_platform
  ON consumer_native_push_tokens (customer_id, business_id, platform);
