-- prov-exp-10.1 — provider in-app notification center (30d push history + read/unread)

CREATE TABLE IF NOT EXISTS provider_push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  booking_id UUID,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  url VARCHAR(512),
  kind VARCHAR(64) NOT NULL,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_push_notifications_user_business_sent
  ON provider_push_notifications (user_id, business_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_push_notifications_unread
  ON provider_push_notifications (user_id, business_id, read_at)
  WHERE read_at IS NULL;
