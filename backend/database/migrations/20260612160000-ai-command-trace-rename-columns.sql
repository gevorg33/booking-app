-- Migrate legacy ai_command_trace columns to acc-1.1 entity names.
-- Safe to re-run: uses IF EXISTS / column checks where practical.
--
-- If TypeORM synchronize still fails (varchar length changes use DROP+ADD),
-- drop and recreate from 20260812120000-ai-command-trace.sql instead:
--   DROP TABLE IF EXISTS ai_command_trace;
--   \i backend/database/migrations/20260812120000-ai-command-trace.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_command_trace' AND column_name = 'raw_prompt'
  ) THEN
    ALTER TABLE ai_command_trace RENAME COLUMN raw_prompt TO prompt_raw;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_command_trace' AND column_name = 'normalized_prompt'
  ) THEN
    ALTER TABLE ai_command_trace RENAME COLUMN normalized_prompt TO prompt_normalized;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_command_trace' AND column_name = 'token_cost'
  ) THEN
    ALTER TABLE ai_command_trace RENAME COLUMN token_cost TO token_cost_usd;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_command_trace' AND column_name = 'pipeline_stages'
  ) THEN
    ALTER TABLE ai_command_trace RENAME COLUMN pipeline_stages TO pipeline_trace;
  END IF;
END $$;

UPDATE ai_command_trace
SET prompt_normalized = COALESCE(prompt_normalized, prompt_raw, '')
WHERE prompt_normalized IS NULL;

ALTER TABLE ai_command_trace
  ALTER COLUMN prompt_normalized SET NOT NULL;

ALTER TABLE ai_command_trace
  ALTER COLUMN locale DROP NOT NULL;

ALTER TABLE ai_command_trace
  ALTER COLUMN locale DROP DEFAULT;

ALTER TABLE ai_command_trace
  ADD COLUMN IF NOT EXISTS prompt_tokens INT;

ALTER TABLE ai_command_trace
  ADD COLUMN IF NOT EXISTS completion_tokens INT;

ALTER TABLE ai_command_trace
  DROP COLUMN IF EXISTS failure_signal,
  DROP COLUMN IF EXISTS feedback_rating,
  DROP COLUMN IF EXISTS feedback_reason,
  DROP COLUMN IF EXISTS corrected_action,
  DROP COLUMN IF EXISTS location_id,
  DROP COLUMN IF EXISTS ab_variant_id;

-- Entity uses a non-unique index on trace_id (legacy schema had UNIQUE).
DROP INDEX IF EXISTS idx_ai_command_trace_trace_id;

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_trace_id
  ON ai_command_trace (trace_id);
