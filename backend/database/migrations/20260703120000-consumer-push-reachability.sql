-- n99-4 — push reachability + deliverability metadata on consumer native tokens.

ALTER TABLE consumer_native_push_tokens
  ADD COLUMN IF NOT EXISTS permission_state VARCHAR(24) NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS analytics_anon_id VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS delivery_success_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_delivered_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_delivery_error VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_consumer_native_push_tokens_business_created
  ON consumer_native_push_tokens (business_id, created_at);
