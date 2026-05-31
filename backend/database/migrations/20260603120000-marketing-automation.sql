-- Sprint 6 gap-8.1: customer-scoped marketing automation send logs
CREATE TABLE IF NOT EXISTS marketing_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  kind VARCHAR(64) NOT NULL,
  channel VARCHAR(16) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'sent',
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_automation_customer_kind
  ON marketing_automation_logs (business_id, customer_id, kind, sent_at DESC);
