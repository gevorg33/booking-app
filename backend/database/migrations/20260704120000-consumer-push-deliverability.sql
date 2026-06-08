-- n99-4.8 — deliverability hardening metadata on consumer native tokens.

ALTER TABLE consumer_native_push_tokens
  ADD COLUMN IF NOT EXISTS last_fcm_accepted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_delivery_ack_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_fcm_message_id VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS silent_failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS token_refreshed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_silent_failure_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_consumer_native_push_tokens_silent_failure_scan
  ON consumer_native_push_tokens (last_fcm_accepted_at)
  WHERE last_fcm_accepted_at IS NOT NULL;
