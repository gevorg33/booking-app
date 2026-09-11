-- AI-ROADMAP Phase 1 — per-step outcome rows for compound commands.
--
-- `compound_intent` is called 380 times and fails 61.8% of the time — the worst
-- number on the platform. Until now the only recorded fact was that the whole
-- compound failed, which cannot distinguish causes that need opposite fixes:
--
--   * step 3 of 3 failed *after* steps 1 and 2 wrote     → needs compensation
--   * the decomposer named a sub-intent it never planned → needs the planner
--   * step 2 asked a question                            → not a failure at all
--
-- One row per sub-intent, keyed by the same `trace_id` the parent row carries.
-- No foreign key: the parent trace is written fire-and-forget on the hot path,
-- and a constraint that can reject a diagnostic write is a constraint that can
-- turn telemetry into a user-visible error.

CREATE TABLE IF NOT EXISTS ai_command_trace_step (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id       uuid        NOT NULL,
  business_id    uuid        NOT NULL,
  surface        varchar(16) NOT NULL,
  step_index     integer     NOT NULL,
  action         varchar(128) NOT NULL,
  outcome        varchar(16) NOT NULL,
  plan_step_ids  jsonb,
  error          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE ai_command_trace_step IS
  'One row per sub-intent of a compound AI command. Joined to ai_command_trace on trace_id.';
COMMENT ON COLUMN ai_command_trace_step.outcome IS
  'executed | failed | skipped | clarified | not_planned. `not_planned` means the decomposer named this sub-intent but no plan was built for it — the silent-drop case behind e2e-bug.347.';
COMMENT ON COLUMN ai_command_trace_step.plan_step_ids IS
  'Merged-plan step ids this sub-intent contributed. Attribution is by id, never by action name — one message often repeats an action ("cancel Mary''s, cancel John''s").';

CREATE INDEX IF NOT EXISTS idx_ai_command_trace_step_trace
  ON ai_command_trace_step (trace_id);
CREATE INDEX IF NOT EXISTS idx_ai_command_trace_step_action_outcome
  ON ai_command_trace_step (action, outcome);
CREATE INDEX IF NOT EXISTS idx_ai_command_trace_step_business_created
  ON ai_command_trace_step (business_id, created_at DESC);

-- Which sub-intent actually breaks compounds. The answer `compound_intent`
-- itself could never give.
DROP VIEW IF EXISTS ai_command_compound_step_failure;
CREATE VIEW ai_command_compound_step_failure AS
SELECT
  surface,
  action,
  count(*)                                                   AS calls,
  count(*) FILTER (WHERE outcome = 'failed')                 AS failed,
  count(*) FILTER (WHERE outcome = 'not_planned')            AS never_planned,
  count(*) FILTER (WHERE outcome = 'clarified')              AS clarified,
  count(*) FILTER (WHERE outcome = 'skipped')                AS skipped,
  round(
    100.0 * count(*) FILTER (WHERE outcome = 'failed') / nullif(count(*), 0),
    1
  )                                                          AS pct_failed,
  round(
    100.0 * count(*) FILTER (WHERE outcome = 'not_planned') / nullif(count(*), 0),
    1
  )                                                          AS pct_never_planned
FROM ai_command_trace_step
GROUP BY surface, action
-- Aggregates repeated rather than referenced by output name: Postgres accepts a
-- bare output name in ORDER BY but not one inside an expression.
ORDER BY
  count(*) FILTER (WHERE outcome = 'failed')
  + count(*) FILTER (WHERE outcome = 'not_planned') DESC;

COMMENT ON VIEW ai_command_compound_step_failure IS
  'Per sub-intent failure rates inside compound commands. `never_planned` is ranked alongside `failed` because a dropped step is at least as damaging — the user is told it happened.';

-- Compounds that reported success while quietly dropping a sub-intent. This is
-- the honest-partial-success rule (AI-ROADMAP §3.3) as a query: three separate
-- false-success bugs on this programme (e2e-bug.136, .348, .256) all look like
-- this row.
DROP VIEW IF EXISTS ai_command_compound_silent_drop;
CREATE VIEW ai_command_compound_silent_drop AS
SELECT
  t.trace_id,
  t.business_id,
  t.surface,
  t.created_at,
  t.prompt_raw,
  count(*) FILTER (WHERE s.outcome = 'not_planned') AS dropped_steps,
  array_agg(s.action ORDER BY s.step_index)
    FILTER (WHERE s.outcome = 'not_planned')        AS dropped_actions
FROM ai_command_trace t
JOIN ai_command_trace_step s ON s.trace_id = t.trace_id
WHERE t.outcome = 'executed'
GROUP BY t.trace_id, t.business_id, t.surface, t.created_at, t.prompt_raw
HAVING count(*) FILTER (WHERE s.outcome = 'not_planned') > 0
ORDER BY t.created_at DESC;

COMMENT ON VIEW ai_command_compound_silent_drop IS
  'Compounds recorded as executed that contain a never-planned sub-intent: the user was told something happened that did not.';
