-- adopt-1.3 — Adoption telemetry event sink
CREATE TABLE IF NOT EXISTS app_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  anon_id VARCHAR(64) NOT NULL,
  event VARCHAR(64) NOT NULL,
  platform VARCHAR(16) NOT NULL,
  app_surface VARCHAR(32) NOT NULL,
  app_version VARCHAR(32),
  locale VARCHAR(16) NOT NULL DEFAULT 'en',
  tenant_slug VARCHAR(128),
  session_id VARCHAR(64),
  start_type VARCHAR(16),
  user_type VARCHAR(16),
  props JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_event_business_event_created
  ON app_event (business_id, event, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_event_platform
  ON app_event (platform);

CREATE INDEX IF NOT EXISTS idx_app_event_anon_id
  ON app_event (anon_id);

CREATE INDEX IF NOT EXISTS idx_app_event_business_created
  ON app_event (business_id, created_at DESC);
