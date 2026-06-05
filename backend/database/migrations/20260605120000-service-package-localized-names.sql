-- lang-1.3b: package localized display names (metadata JSONB, same pattern as services)

ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
