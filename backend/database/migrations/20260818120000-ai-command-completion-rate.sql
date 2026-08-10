-- AI-ROADMAP Phase 2 — completion rate by action and surface.
--
-- §7 makes command completion the north-star metric: 64.0% today, ≥92% target.
-- Nothing computed it. `AiPlatformService.getCommandAnalytics` declares a
-- `targets.completionRate` of 0.75 and then never produces a completionRate to
-- compare against it — and it reads the event store, not `ai_command_trace`,
-- so it cannot reproduce the 64%/27% the roadmap is built on.
--
-- Definition, stated once so every consumer agrees:
--
--   completion_rate = executed / all outcomes
--
-- That is the roadmap's definition and it is deliberately harsh: a clarify
-- counts against it. But clarify and security_blocked are NOT failures — one is
-- the assistant asking a good question, the other is it correctly refusing — so
-- `failure_rate` is reported separately. Reading 36% as "36% broken" is the
-- mistake these columns exist to prevent.

DROP VIEW IF EXISTS ai_command_completion_summary;
CREATE VIEW ai_command_completion_summary AS
SELECT
  count(*)                                                    AS calls,
  count(*) FILTER (WHERE outcome = 'executed')                AS executed,
  count(*) FILTER (WHERE outcome = 'failed')                  AS failed,
  count(*) FILTER (WHERE outcome = 'clarified')               AS clarified,
  count(*) FILTER (WHERE outcome = 'approval')                AS approval,
  count(*) FILTER (WHERE outcome = 'security_blocked')        AS security_blocked,
  round(100.0 * count(*) FILTER (WHERE outcome = 'executed')
        / nullif(count(*), 0), 1)                             AS completion_rate,
  round(100.0 * count(*) FILTER (WHERE outcome = 'failed')
        / nullif(count(*), 0), 1)                             AS failure_rate
FROM ai_command_trace;

COMMENT ON VIEW ai_command_completion_summary IS
  'AI-ROADMAP §7 north star. completion_rate = executed/all (target >= 92). failure_rate excludes clarify and security_blocked, which are correct behaviour rather than failure.';

-- Which commands actually lose the completion rate. Ranked by absolute failures,
-- not by percentage: a 100%-failing command called twice matters less than a
-- 58%-failing command called 113 times, and ranking by rate buries that.
DROP VIEW IF EXISTS ai_command_completion_by_action;
CREATE VIEW ai_command_completion_by_action AS
SELECT
  action,
  surface,
  count(*)                                                    AS calls,
  count(*) FILTER (WHERE outcome = 'executed')                AS executed,
  count(*) FILTER (WHERE outcome = 'failed')                  AS failed,
  count(*) FILTER (WHERE outcome = 'clarified')               AS clarified,
  round(100.0 * count(*) FILTER (WHERE outcome = 'executed')
        / nullif(count(*), 0), 1)                             AS completion_rate,
  round(100.0 * count(*) FILTER (WHERE outcome = 'failed')
        / nullif(count(*), 0), 1)                             AS failure_rate,
  -- The commonest structured cause, so the row suggests its own next step.
  -- NULL on every historical row: `failure_reason` derives from `result.details`,
  -- which the trace never persisted, so it cannot be backfilled — §11's note that
  -- the steal-attribution migration backfilled history covers `classified_action`
  -- and `action_changed_by`, not this. Populated for traffic after 2026-08-03.
  mode() WITHIN GROUP (ORDER BY failure_reason)
    FILTER (WHERE outcome = 'failed')                         AS top_failure_reason
FROM ai_command_trace
GROUP BY action, surface
ORDER BY count(*) FILTER (WHERE outcome = 'failed') DESC;

COMMENT ON VIEW ai_command_completion_by_action IS
  'Completion rate per command per surface, ranked by absolute failures. Ranking by rate would put a twice-called command above create_booking.';

DROP VIEW IF EXISTS ai_command_completion_by_surface;
CREATE VIEW ai_command_completion_by_surface AS
SELECT
  surface,
  count(*)                                                    AS calls,
  count(*) FILTER (WHERE outcome = 'executed')                AS executed,
  count(*) FILTER (WHERE outcome = 'failed')                  AS failed,
  count(DISTINCT action)                                      AS distinct_actions,
  round(100.0 * count(*) FILTER (WHERE outcome = 'executed')
        / nullif(count(*), 0), 1)                             AS completion_rate,
  round(100.0 * count(*) FILTER (WHERE outcome = 'failed')
        / nullif(count(*), 0), 1)                             AS failure_rate
FROM ai_command_trace
GROUP BY surface
ORDER BY count(*) FILTER (WHERE outcome = 'failed') DESC;

COMMENT ON VIEW ai_command_completion_by_surface IS
  'Completion rate per surface. A surface far below the overall rate is a routing or capability gap rather than a per-command one.';

-- Is it getting better? A north star with no trend cannot be owned — you can
-- only tell whether a change helped by comparing days.
DROP VIEW IF EXISTS ai_command_completion_daily;
CREATE VIEW ai_command_completion_daily AS
SELECT
  date_trunc('day', created_at)::date                         AS day,
  surface,
  count(*)                                                    AS calls,
  count(*) FILTER (WHERE outcome = 'executed')                AS executed,
  count(*) FILTER (WHERE outcome = 'failed')                  AS failed,
  round(100.0 * count(*) FILTER (WHERE outcome = 'executed')
        / nullif(count(*), 0), 1)                             AS completion_rate
FROM ai_command_trace
GROUP BY date_trunc('day', created_at)::date, surface
ORDER BY day DESC, surface;

COMMENT ON VIEW ai_command_completion_daily IS
  'Daily completion rate by surface — the trend the >=92% target is tracked against.';

-- Supports the daily rollup and every date-ranged query the endpoint runs.
CREATE INDEX IF NOT EXISTS idx_ai_command_trace_outcome_created
  ON ai_command_trace (outcome, created_at DESC);
