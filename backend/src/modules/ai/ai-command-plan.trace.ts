/**
 * AI-ROADMAP Phase 3 — plan telemetry.
 *
 * Turns a `PlanOutcome` into flat, queryable trace fields. Pure, so it can be
 * unit-tested and reused by whichever layer records the trace — the planner
 * service stays free of persistence concerns.
 *
 * Why these fields specifically:
 *
 *   - `planCommands` makes "which commands does the planner actually pick, and
 *     how often" answerable. That is the shadow-comparison input: planner
 *     commands vs. the classifier's `action` on the same message.
 *   - `planProblems` makes the clarify path measurable. Today a clarify is
 *     indistinguishable from a failure in the trace; with problem codes we can
 *     tell "asked a good question" from "could not understand at all".
 *   - `planStepCount` finally exposes multi-command shape. `compound_intent`
 *     fails 61.8% of the time in production and nothing records how many steps
 *     were involved or which ones broke.
 *   - `planRepairs` measures raw model-output quality independently of whether
 *     the plan was any good — a rising repair rate is an early warning that a
 *     model or prompt change has degraded formatting.
 */
import type { PlanOutcome } from './ai-command-planner.service.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { resolveSpecByAction } from './ai-command-spec.derive.js';

export type PlanTraceFields = {
  planOutcome: string | null;
  planStepCount: number | null;
  planCommands: string[] | null;
  /**
   * The same commands expressed as their LEGACY flat action names.
   *
   * The planner emits canonical `domain.verb` ids; the old classifier writes
   * legacy names into `classified_action`. Comparing those two directly makes
   * every ported command look like a disagreement — `appointment.reschedule`
   * vs `reschedule_booking` are the same command. Recording both forms lets the
   * shadow view compare like with like, and keeps the alias mapping in
   * TypeScript next to the specs rather than duplicated into SQL.
   */
  planCommandsLegacy: string[] | null;
  planHighestRisk: string | null;
  planProblems: { code: string; command?: string; details: string[] }[] | null;
  planRepairs: string[] | null;
};

/** Canonical id → the legacy action name it replaced (itself when unmapped). */
function toLegacyAction(command: string): string {
  const spec = resolveSpecByAction(COMMAND_SPECS, command);
  return spec?.aliases[0] ?? command;
}

export const EMPTY_PLAN_TRACE_FIELDS: PlanTraceFields = {
  planOutcome: null,
  planStepCount: null,
  planCommands: null,
  planCommandsLegacy: null,
  planHighestRisk: null,
  planProblems: null,
  planRepairs: null,
};

export function buildPlanTraceFields(
  outcome: PlanOutcome | undefined | null,
): PlanTraceFields {
  if (!outcome) return { ...EMPTY_PLAN_TRACE_FIELDS };

  if (outcome.status === 'unavailable') {
    return {
      ...EMPTY_PLAN_TRACE_FIELDS,
      planOutcome: 'unavailable',
      // The decode failure is the actionable detail here, so it is recorded as
      // a problem rather than lost in a log line.
      planProblems: [{ code: outcome.reason, details: [] }],
    };
  }

  const { plan, validation, repairs } = outcome;

  return {
    planOutcome: outcome.status,
    planStepCount: plan.steps.length,
    planCommands: plan.steps.map((s) => s.command),
    planCommandsLegacy: plan.steps.map((s) => toLegacyAction(s.command)),
    planHighestRisk: validation.highestRisk,
    planProblems: validation.problems.length
      ? validation.problems.map((p) => ({
          code: p.code,
          ...(p.command ? { command: p.command } : {}),
          details: p.details,
        }))
      : null,
    planRepairs: repairs.length ? repairs : null,
  };
}
