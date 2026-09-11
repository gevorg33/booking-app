-- AI-ROADMAP Phase 3 — plan telemetry on ai_command_trace.
--
-- The trace records a single `action`, which cannot describe a multi-command
-- plan at all. `compound_intent` is called 380 times and fails 61.8% of the
-- time, and nothing records how many steps were involved or which one broke.
--
-- These columns are NULL for every row produced by the legacy single-action
-- pipeline. That is deliberate and is itself the rollout signal:
-- `plan_outcome IS NOT NULL` selects exactly the planner-handled messages.

ALTER TABLE ai_command_trace
  ADD COLUMN IF NOT EXISTS plan_outcome         varchar(16),
  ADD COLUMN IF NOT EXISTS plan_step_count      integer,
  ADD COLUMN IF NOT EXISTS plan_commands        jsonb,
  ADD COLUMN IF NOT EXISTS plan_commands_legacy jsonb,
  ADD COLUMN IF NOT EXISTS plan_highest_risk    varchar(4),
  ADD COLUMN IF NOT EXISTS plan_problems        jsonb,
  ADD COLUMN IF NOT EXISTS plan_repairs         jsonb;

COMMENT ON COLUMN ai_command_trace.plan_outcome IS
  'executable | clarify | unavailable. NULL means the legacy single-action pipeline handled this message.';
COMMENT ON COLUMN ai_command_trace.plan_commands IS
  'Command ids the planner extracted — the shadow-comparison input against `action`.';
COMMENT ON COLUMN ai_command_trace.plan_problems IS
  'Why the plan could not execute (problem code + details), so clarifies are measurable rather than indistinguishable from failures.';
COMMENT ON COLUMN ai_command_trace.plan_repairs IS
  'Syntax repairs the decoder applied — a proxy for raw model output quality.';

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_plan_outcome
  ON ai_command_trace (plan_outcome, surface)
  WHERE plan_outcome IS NOT NULL;

-- Multi-command reach: how often does one message carry more than one command,
-- and does it complete? This is the metric `compound_intent` never had.
-- Dropped first: CREATE OR REPLACE cannot change a view's column list.
DROP VIEW IF EXISTS ai_command_plan_summary;
CREATE VIEW ai_command_plan_summary AS
SELECT
  surface,
  plan_outcome,
  plan_highest_risk,
  CASE
    WHEN plan_step_count IS NULL THEN 'legacy'
    WHEN plan_step_count = 0     THEN 'empty'
    WHEN plan_step_count = 1     THEN 'single'
    ELSE 'multi'
  END                                                           AS plan_shape,
  count(*)                                                      AS occurrences,
  count(*) FILTER (WHERE outcome = 'executed')                  AS executed,
  count(*) FILTER (WHERE outcome = 'failed')                    AS failed,
  round(avg(plan_step_count), 2)                                AS avg_steps,
  count(*) FILTER (WHERE plan_repairs IS NOT NULL)              AS needed_repair
FROM ai_command_trace
WHERE plan_outcome IS NOT NULL
GROUP BY surface, plan_outcome, plan_highest_risk, 4;

-- Shadow comparison: for planner-handled messages, did the plan's first command
-- agree with what the legacy classifier chose? Disagreements are the review
-- queue that must be worked before the planner can take over a surface.
--
-- Compares the LEGACY form of the planner's command, not the canonical id.
-- The planner emits `appointment.reschedule`; the classifier writes
-- `reschedule_booking`. Those are the same command, and comparing the raw
-- strings would report a disagreement for every ported command — drowning the
-- real signal. `plan_commands_legacy` is written by `buildPlanTraceFields`,
-- which resolves aliases from the specs, so the mapping lives in one place.
DROP VIEW IF EXISTS ai_command_plan_shadow_disagreement;
CREATE VIEW ai_command_plan_shadow_disagreement AS
SELECT
  surface,
  classified_action                                AS classifier_action,
  plan_commands_legacy ->> 0                       AS planner_first_command_legacy,
  plan_commands ->> 0                              AS planner_first_command,
  plan_outcome,
  count(*)                                         AS occurrences,
  count(*) FILTER (WHERE outcome = 'failed')       AS failed
FROM ai_command_trace
WHERE plan_outcome IS NOT NULL
  AND classified_action IS NOT NULL
  AND plan_commands_legacy IS NOT NULL
  AND jsonb_array_length(plan_commands_legacy) > 0
  AND plan_commands_legacy ->> 0 IS DISTINCT FROM classified_action
GROUP BY surface, classified_action, plan_commands_legacy ->> 0,
         plan_commands ->> 0, plan_outcome;
