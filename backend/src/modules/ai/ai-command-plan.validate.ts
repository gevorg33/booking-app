/**
 * AI-ROADMAP Phase 3 — deterministic plan validation.
 *
 * This is the safety spine between "the model produced a plan" and "we write to
 * the database". It is deliberately pure and LLM-free so every rule is testable
 * without a model in the loop.
 *
 * The rules that matter most:
 *
 *   - A command not legal on this surface is REJECTED, not remapped. That is the
 *     structural answer to "no wrong command stolen from a right command":
 *     there is no stage after this that can substitute a different action.
 *   - An unknown command clarifies. It never fuzzy-matches to a near neighbour —
 *     near-matching is precisely how `assign_employee_services` became
 *     `add_services_to_cart` in production.
 *   - Dependency cycles and dangling refs are caught before anything executes,
 *     so a partially-executed plan cannot be left half-applied.
 */
import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  isSpecAllowedForTier,
  isSpecAllowedOnSurface,
  requiresConfirmation,
  resolveSpecByAction,
  validateCommandVariables,
} from './ai-command-spec.derive.js';
import type { CommandRiskTier, CommandSpec } from './ai-command-spec.types.js';
import {
  STEP_REFERENCE_PATTERN,
  type CommandPlan,
  type PlanProblem,
  type PlanStep,
  type PlanValidationResult,
} from './ai-command-plan.types.js';

const RISK_ORDER: Record<CommandRiskTier, number> = {
  T0: 0,
  T1: 1,
  T2: 2,
  T3: 3,
};

/**
 * Variables holding a `$sN.field` reference cannot be type-checked yet — the
 * value only exists once the referenced step has run. They are replaced with a
 * placeholder of the declared type so the rest of validation still applies.
 */
function collectStepReferences(
  step: PlanStep,
): { path: string; refStepId: string }[] {
  const refs: { path: string; refStepId: string }[] = [];
  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      const m = STEP_REFERENCE_PATTERN.exec(value);
      if (m) refs.push({ path, refStepId: m[1] });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value))
        walk(v, path ? `${path}.${k}` : k);
    }
  };
  for (const [name, value] of Object.entries(step.variables)) walk(value, name);
  return refs;
}

/** Swap `$sN.field` strings for a sentinel so type checks don't reject them. */
function substituteReferences(
  variables: Record<string, unknown>,
  spec: CommandSpec,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(variables)) {
    if (typeof value === 'string' && STEP_REFERENCE_PATTERN.test(value)) {
      const declared = spec.variables[name];
      out[name] =
        declared?.type === 'number'
          ? 0
          : declared?.type === 'boolean'
            ? false
            : declared?.type === 'string[]'
              ? []
              : '__pending_reference__';
      continue;
    }
    out[name] = value;
  }
  return out;
}

/** Kahn's algorithm — returns null when the graph contains a cycle. */
function topologicalOrder(steps: PlanStep[]): string[] | null {
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const s of steps) {
    indegree.set(s.id, 0);
    dependents.set(s.id, []);
  }
  for (const s of steps) {
    for (const dep of s.dependsOn) {
      if (!indegree.has(dep)) continue; // dangling — reported separately
      indegree.set(s.id, (indegree.get(s.id) ?? 0) + 1);
      dependents.get(dep)!.push(s.id);
    }
  }

  // Preserve the planner's ordering among steps that are equally ready, so a
  // plan without dependencies executes in the order the user said it.
  const ready = steps
    .filter((s) => (indegree.get(s.id) ?? 0) === 0)
    .map((s) => s.id);
  const ordered: string[] = [];
  while (ready.length) {
    const id = ready.shift()!;
    ordered.push(id);
    for (const next of dependents.get(id) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) ready.push(next);
    }
  }
  return ordered.length === steps.length ? ordered : null;
}

export type ValidatePlanOptions = {
  /** Steps below this confidence clarify instead of executing. */
  minConfidence?: number;
};

/**
 * `tier` is positional and required rather than an optional field on
 * `ValidatePlanOptions`. An optional permission argument defaults to *something*,
 * and every default here is either "deny everything" (breaks callers into
 * silence) or "allow everything" (a permission check that is off unless you
 * remember it). Making it required means a new call site cannot forget.
 */
export function validatePlan(
  specs: readonly CommandSpec[],
  plan: CommandPlan,
  surface: CommandSurface,
  tier: AccessTier,
  options: ValidatePlanOptions = {},
): PlanValidationResult {
  const minConfidence = options.minConfidence ?? 0.6;
  const problems: PlanProblem[] = [];
  const stepIds = new Set<string>();
  let requiresConfirm = false;
  let highestRisk: CommandRiskTier = 'T0';
  let ambiguous = plan.unresolved.length > 0;

  for (const step of plan.steps) {
    if (stepIds.has(step.id)) {
      problems.push({
        code: 'duplicate_step_id',
        stepId: step.id,
        details: [step.id],
      });
    }
    stepIds.add(step.id);
  }

  for (const step of plan.steps) {
    const spec = resolveSpecByAction(specs, step.command);

    // Unknown command → clarify. Never fuzzy-match to a neighbour.
    if (!spec) {
      problems.push({
        code: 'unknown_command',
        stepId: step.id,
        command: step.command,
        details: [step.command],
      });
      continue;
    }

    // The steal guard: reject, never remap to something this surface allows.
    if (!isSpecAllowedOnSurface(spec, surface)) {
      problems.push({
        code: 'surface_violation',
        stepId: step.id,
        command: spec.id,
        details: [surface, ...spec.surfaces],
      });
      continue;
    }

    // Permission is checked here as well as filtered out of the shortlist. The
    // shortlist filter is what stops the model preferring a command the actor
    // cannot run; this is what stops a model that ignored the shortlist — or a
    // plan replayed against a different actor — from executing one anyway.
    if (!isSpecAllowedForTier(spec, surface, tier)) {
      problems.push({
        code: 'permission_violation',
        stepId: step.id,
        command: spec.id,
        details: [tier, ...(spec.tiers[surface] ?? [])],
      });
      continue;
    }

    if (RISK_ORDER[spec.risk] > RISK_ORDER[highestRisk])
      highestRisk = spec.risk;

    if (step.confidence < minConfidence) {
      problems.push({
        code: 'low_confidence',
        stepId: step.id,
        command: spec.id,
        details: [String(step.confidence)],
      });
      ambiguous = true;
    }

    for (const { path, refStepId } of collectStepReferences(step)) {
      if (!stepIds.has(refStepId)) {
        problems.push({
          code: 'dangling_dependency',
          stepId: step.id,
          command: spec.id,
          details: [`${path} -> ${refStepId}`],
        });
      }
    }

    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) {
        problems.push({
          code: 'dangling_dependency',
          stepId: step.id,
          command: spec.id,
          details: [dep],
        });
      }
    }

    const varResult = validateCommandVariables(
      spec,
      substituteReferences(step.variables, spec),
    );
    if (varResult.missing.length) {
      problems.push({
        code: 'missing_variables',
        stepId: step.id,
        command: spec.id,
        details: varResult.missing,
      });
    }
    if (varResult.invalid.length) {
      problems.push({
        code: 'invalid_variables',
        stepId: step.id,
        command: spec.id,
        details: varResult.invalid,
      });
    }
    if (varResult.unknown.length) {
      problems.push({
        code: 'unknown_variables',
        stepId: step.id,
        command: spec.id,
        details: varResult.unknown,
      });
    }

    if (requiresConfirmation(spec, { ambiguous })) requiresConfirm = true;
  }

  // e2e-bug.384: a plan with no steps is not executable — there is nothing to
  // execute, and §33's `executePlan` already refuses it. Without this the
  // verdict depended on whether the model happened to add an `unresolved` note:
  // noted empties failed validation, silent ones passed and were then compared
  // as though they had chosen a command.
  if (plan.steps.length === 0) {
    problems.push({ code: 'empty_plan', details: [] });
  }

  const order = topologicalOrder(plan.steps);
  if (order === null) {
    problems.push({
      code: 'dependency_cycle',
      details: plan.steps.map((s) => s.id),
    });
  }

  // e2e-bug.389 — `unresolved` is a note about what the planner could not map,
  // and whether that should stop the plan depends entirely on what the plan
  // does.
  //
  // It used to stop everything, unconditionally and without recording anything:
  // `executable` was false whenever `unresolved` was non-empty while `problems`
  // stayed empty. "List upcoming tour departures with pax and remaining
  // capacity" routes correctly to `tour.list_upcoming_departures`, notes the
  // part it could not express, and was refused whole — 8 of 45 prompts in the
  // tour/guide slice, with no reason given anywhere in the trace.
  //
  // The rule now follows the risk the plan actually carries:
  //
  // - **a pure read** (T0 throughout, no confirmation) proceeds. Answering most
  //   of the question and saying what was not covered beats answering none of
  //   it, and §35 already built exactly this contract for execution results;
  // - **anything that mutates or needs confirmation** still blocks, and blocks
  //   for the reason Phase 6 gives: acting on a partial reading of a message
  //   that changes something is what clarify exists to prevent. `planClarify`
  //   below already turns a non-executable plan into a targeted question.
  //
  // Either way the note is now *named* in `problems`, so a refusal explains
  // itself and a caveat is visible to the caller instead of being inferred.
  if (plan.unresolved.length > 0) {
    problems.push({ code: 'unresolved_notes', details: [...plan.unresolved] });
  }
  const unresolvedBlocks =
    plan.unresolved.length > 0 && (requiresConfirm || highestRisk !== 'T0');

  // `unknown_variables` is a warning, not a blocker: the hallucinated param is
  // reported and dropped rather than failing an otherwise-valid plan.
  // `unresolved_notes` is a blocker only under the rule above.
  const blocking = problems.filter(
    (p) =>
      p.code !== 'unknown_variables' &&
      (p.code !== 'unresolved_notes' || unresolvedBlocks),
  );

  return {
    executable: blocking.length === 0,
    orderedStepIds: order ?? [],
    problems,
    requiresConfirmation: requiresConfirm,
    highestRisk,
  };
}

/**
 * Build the clarifying question for a plan that cannot execute.
 *
 * Returns null when the plan is fine. Naming the exact missing variables is the
 * difference between a useful question and the generic "I didn't understand"
 * that production traces are full of.
 */
export function describePlanClarification(
  result: PlanValidationResult,
  plan: CommandPlan,
): string | null {
  if (result.executable) return null;

  const parts: string[] = [];
  for (const problem of result.problems) {
    switch (problem.code) {
      case 'missing_variables':
        parts.push(
          `I still need ${problem.details.join(', ')} for ${problem.command}.`,
        );
        break;
      case 'unknown_command':
        parts.push(`I don't have a command for "${problem.command}".`);
        break;
      case 'surface_violation':
        parts.push(`${problem.command} isn't available here.`);
        break;
      // Deliberately does not name the tiers that would be allowed — a clarify
      // message is not a place to enumerate the permission model to someone who
      // just failed it.
      case 'permission_violation':
        parts.push(`You don't have access to ${problem.command}.`);
        break;
      case 'invalid_variables':
        parts.push(
          `${problem.details.join(', ')} doesn't look right for ${problem.command}.`,
        );
        break;
      case 'low_confidence':
        parts.push(
          `I'm not confident enough about ${problem.command} to run it.`,
        );
        break;
      case 'dependency_cycle':
        parts.push('Those steps depend on each other in a loop.');
        break;
      case 'dangling_dependency':
        parts.push(
          `A step refers to ${problem.details.join(', ')}, which isn't in the plan.`,
        );
        break;
      default:
        break;
    }
  }
  for (const item of plan.unresolved) parts.push(`Which ${item} did you mean?`);

  return parts.length
    ? parts.join(' ')
    : 'I need a bit more detail before I can do that.';
}
