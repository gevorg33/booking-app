-- adopt-4.4 — per-service rebooking nudge logs + push channel
ALTER TABLE marketing_automation_logs
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_automation_service_kind
  ON marketing_automation_logs (business_id, customer_id, service_id, kind, sent_at DESC);
