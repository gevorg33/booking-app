-- AI-ROADMAP Task 1 — steal & failure attribution on ai_command_trace.
--
-- Problem this solves: the row stored only the FINAL action, so a post-classify
-- stage overwriting a correct action ("a wrong command stolen from a right
-- command") was invisible — `source` reads 'llm' for 99.8% of rows even when a
-- rescue regex picked the action. Failures were equally opaque: no reason and
-- no response summary were kept, leaving 1,448 failed rows undiagnosable.

ALTER TABLE ai_command_trace
  ADD COLUMN IF NOT EXISTS classified_action varchar(128),
  ADD COLUMN IF NOT EXISTS action_changed_by varchar(32),
  ADD COLUMN IF NOT EXISTS failure_reason    varchar(64),
  ADD COLUMN IF NOT EXISTS result_summary    text;

COMMENT ON COLUMN ai_command_trace.classified_action IS
  'Action chosen by the LLM classifier before any later stage could replace it.';
COMMENT ON COLUMN ai_command_trace.action_changed_by IS
  'Pipeline stage that produced the action which actually ran; NULL when the classifier''s choice survived.';
COMMENT ON COLUMN ai_command_trace.failure_reason IS
  'Coarse structured failure bucket (see deriveFailureReason).';
COMMENT ON COLUMN ai_command_trace.result_summary IS
  'Redacted response summary, stored only for non-executed outcomes.';

-- Backfill from the pipeline_trace JSONB that has been collected all along.
-- Mirrors extractClassifiedAction(): first `classify` stage entry.
UPDATE ai_command_trace
SET classified_action = (
  SELECT e->>'action'
  FROM jsonb_array_elements(pipeline_trace) e
  WHERE e->>'stage' = 'classify'
  LIMIT 1
)
WHERE pipeline_trace IS NOT NULL
  AND classified_action IS NULL;

-- Mirrors attributeActionChange(): the FIRST action-deciding stage after
-- `classify` whose action equals the action that actually ran. First, not last:
-- production traces show `rescue: add_services_to_cart` followed by
-- `self_verify: add_services_to_cart`, where self_verify only echoes the new
-- action — taking the last match blames the echo and hides the real stealer.
-- Matching on the final action (rather than "differs from classify") also means
-- status markers such as 'skipped' / 'none' / 'skip_semantic' can never be
-- blamed for a change.
UPDATE ai_command_trace t
SET action_changed_by = COALESCE(
  (
    SELECT e->>'stage'
    FROM jsonb_array_elements(t.pipeline_trace) WITH ORDINALITY AS a(e, ord)
    WHERE e->>'stage' IN (
            'confidence_gate','semantic_match','rerank',
            'narrow_reclassify','rescue','self_verify')
      AND e->>'action' = t.action
      AND a.ord > (
        SELECT MIN(b.ord)
        FROM jsonb_array_elements(t.pipeline_trace) WITH ORDINALITY AS b(e2, ord)
        WHERE b.e2->>'stage' = 'classify'
      )
    ORDER BY a.ord ASC
    LIMIT 1
  ),
  'post_pipeline'
)
WHERE t.pipeline_trace IS NOT NULL
  AND t.classified_action IS NOT NULL
  AND t.classified_action <> t.action
  AND t.action_changed_by IS NULL;

-- Steal analysis is always "find the rows where these two differ", so index the
-- comparison rather than either column alone.
CREATE INDEX IF NOT EXISTS idx_ai_command_trace_steal
  ON ai_command_trace (action_changed_by, action)
  WHERE action_changed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_failure_reason
  ON ai_command_trace (failure_reason)
  WHERE failure_reason IS NOT NULL;

-- Convenience view for the burn-down dashboard: one row per steal pair with
-- how often that steal ends in failure. Ordered by measured harm, which is the
-- ordering the roadmap uses to sequence detector retirement.
CREATE OR REPLACE VIEW ai_command_steal_summary AS
SELECT
  classified_action,
  action                                        AS final_action,
  action_changed_by,
  surface,
  count(*)                                      AS occurrences,
  count(*) FILTER (WHERE outcome = 'failed')    AS failed,
  round(100.0 * count(*) FILTER (WHERE outcome = 'failed') / count(*), 1)
                                                AS pct_failed
FROM ai_command_trace
WHERE classified_action IS NOT NULL
  AND classified_action <> action
GROUP BY classified_action, action, action_changed_by, surface;
