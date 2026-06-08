-- acc-1.1 — AI command trace telemetry for accuracy measurement
CREATE TABLE IF NOT EXISTS ai_command_trace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id UUID NOT NULL,
  business_id UUID NOT NULL,
  surface VARCHAR(32) NOT NULL,
  user_id UUID,
  role VARCHAR(64),
  raw_prompt TEXT NOT NULL,
  normalized_prompt TEXT,
  locale VARCHAR(16) NOT NULL DEFAULT 'en',
  action VARCHAR(128) NOT NULL,
  confidence DOUBLE PRECISION,
  params JSONB,
  routing_tier VARCHAR(32),
  source VARCHAR(16) NOT NULL DEFAULT 'llm',
  outcome VARCHAR(32) NOT NULL,
  latency_ms INTEGER,
  model VARCHAR(64),
  token_cost DOUBLE PRECISION,
  pipeline_stages JSONB,
  failure_signal VARCHAR(32),
  feedback_rating VARCHAR(8),
  feedback_reason VARCHAR(32),
  corrected_action VARCHAR(128),
  location_id UUID,
  ab_variant_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_command_trace_trace_id
  ON ai_command_trace (trace_id);

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_business_created
  ON ai_command_trace (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_surface_action
  ON ai_command_trace (surface, action);

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_outcome
  ON ai_command_trace (outcome);

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_failure_signal
  ON ai_command_trace (failure_signal)
  WHERE failure_signal IS NOT NULL;
