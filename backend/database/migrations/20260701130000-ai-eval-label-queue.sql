-- acc-2.1 — production prompt harvester labeling queue
CREATE TABLE IF NOT EXISTS ai_eval_label_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  prompt_hash VARCHAR(64) NOT NULL,
  prompt_snippet TEXT NOT NULL,
  locale VARCHAR(16) NOT NULL DEFAULT 'en',
  surface VARCHAR(32) NOT NULL DEFAULT 'dashboard',
  classified_action VARCHAR(128) NOT NULL,
  corrected_action VARCHAR(128),
  confidence DOUBLE PRECISION,
  failure_count INTEGER NOT NULL DEFAULT 1,
  failure_signals JSONB,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  expected_action VARCHAR(128),
  expected_rescued_action VARCHAR(128),
  expected_params JSONB,
  label_outcome VARCHAR(16) NOT NULL DEFAULT 'execution',
  rescue_from_action VARCHAR(128),
  expected_clarify_fields JSONB,
  eval_case_id VARCHAR(128),
  labeled_by UUID,
  labeled_at TIMESTAMPTZ,
  source VARCHAR(32) NOT NULL DEFAULT 'harvest',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_eval_label_queue_business_status
  ON ai_eval_label_queue (business_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_eval_label_queue_business_hash
  ON ai_eval_label_queue (business_id, prompt_hash);
