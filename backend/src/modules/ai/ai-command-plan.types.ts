/**
 * AI-ROADMAP §3.2 — the CommandPlan.
 *
 * The unit of understanding becomes a PLAN (N commands + dependencies), not a
 * single `action` string. This is what the headline use case requires:
 *
 *   "Move John's appointment to tomorrow at 3 PM, cancel Mary's appointment,
 *    and create a new patient named David for Friday."
 *
 * Production data says this matters: `compound_intent` is called 380 times and
 * fails 61.8% of the time, and 33 traces show a multi-command request being
 * collapsed into a single command by a post-classify stage.
 */

/** A reference to an earlier step's output, e.g. `$s3.id`. */
export const STEP_REFERENCE_PATTERN = /^\$([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)$/;

export type PlanStep = {
  /** Plan-local id (`s1`, `s2`, …) used by `dependsOn` and `$sN.field` refs. */
  id: string;
  /** Canonical spec id, or a legacy alias — both resolve. */
  command: string;
  variables: Record<string, unknown>;
  /** Planner confidence for this step, 0–1. */
  confidence: number;
  /** Step ids that must succeed first. */
  dependsOn: string[];
};

export type CommandPlan = {
  steps: PlanStep[];
  /**
   * Things the planner could not pin down (e.g. "which John?"). Non-empty means
   * the plan must clarify rather than execute.
   */
  unresolved: string[];
  /**
   * True when this message changed subject. Invalidates stale entity bindings
   * so a later "cancel it" cannot silently target the previous topic.
   */
  topicChanged: boolean;
};

export type PlanProblemCode =
  /** Planner named a command that does not exist. Never guess a near-match. */
  | 'unknown_command'
  /** Command exists but is not legal on this surface — the steal guard. */
  | 'surface_violation'
  /** Command is legal here but this actor's access tier may not run it. */
  | 'permission_violation'
  | 'missing_variables'
  | 'unknown_variables'
  | 'invalid_variables'
  /** `dependsOn` or `$ref` points at a step that isn't in the plan. */
  | 'dangling_dependency'
  /** Steps depend on each other in a loop. */
  | 'dependency_cycle'
  | 'duplicate_step_id'
  | 'low_confidence'
  /**
   * The planner returned a plan with no steps.
   *
   * Its own outcome, not a flavour of the others: the model produced
   * well-formed output and declined to act. e2e-bug.384 — before this existed a
   * zero-step plan validated as *executable* whenever the model added no
   * `unresolved` note, which contradicted §33's executor ("Plan has no steps")
   * and made every silent empty plan look like a wrong command.
   */
  | 'empty_plan'
  /**
   * The plan carries `unresolved` notes — part of the message the planner could
   * not map to any command.
   *
   * Blocking only when the plan mutates or needs confirmation. e2e-bug.389 —
   * this used to be an unnamed, unconditional refusal: `executable` was false
   * whenever `unresolved` was non-empty, with nothing recorded in `problems`, so
   * "list departures **with pax**" produced a correct route, an empty problem
   * list and a rejected plan. A read that answers most of the question and says
   * what it could not cover is more useful than no answer; a *mutation* built on
   * a partial reading is exactly what Phase 6's clarify exists to stop.
   */
  | 'unresolved_notes';

export type PlanProblem = {
  code: PlanProblemCode;
  stepId?: string;
  command?: string;
  /** Variable paths or step ids the problem concerns. */
  details: string[];
};

export type PlanValidationResult = {
  /** True only when every step is executable as-is. */
  executable: boolean;
  /**
   * Steps in dependency order.
   *
   * Populated whenever the graph is acyclic, INCLUDING when the plan is not
   * executable — a previewable order is useful for showing the user what was
   * understood. It is therefore *not* an execution permit: the Phase 5
   * executor must gate on `executable`, never on this being non-empty.
   */
  orderedStepIds: string[];
  problems: PlanProblem[];
  /** True when any step's spec demands confirmation before writing. */
  requiresConfirmation: boolean;
  /** Highest risk tier present, for gate selection. */
  highestRisk: 'T0' | 'T1' | 'T2' | 'T3';
};
