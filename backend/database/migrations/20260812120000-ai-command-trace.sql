-- acc-1.1 / pipe-1.10.1 — AI command understanding + execution trace
CREATE TABLE IF NOT EXISTS ai_command_trace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id UUID NOT NULL,
  business_id UUID NOT NULL,
  surface VARCHAR(16) NOT NULL,
  user_id UUID,
  role VARCHAR(32),
  prompt_raw TEXT NOT NULL,
  prompt_normalized TEXT NOT NULL,
  locale VARCHAR(16),
  action VARCHAR(128) NOT NULL,
  confidence DECIMAL(5, 4),
  params JSONB,
  routing_tier VARCHAR(32),
  source VARCHAR(16) NOT NULL,
  outcome VARCHAR(24) NOT NULL,
  latency_ms INT,
  model VARCHAR(64),
  prompt_tokens INT,
  completion_tokens INT,
  token_cost_usd DECIMAL(10, 6),
  pipeline_trace JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_business_created
  ON ai_command_trace (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_surface_action
  ON ai_command_trace (surface, action);

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_outcome
  ON ai_command_trace (outcome);

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_trace_id
  ON ai_command_trace (trace_id);
