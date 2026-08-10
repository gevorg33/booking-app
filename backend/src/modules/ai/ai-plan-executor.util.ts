/**
 * AI-ROADMAP Phase 5 — the DAG executor.
 *
 * Turns a *validated* `CommandPlan` into ordered execution, wiring each step's
 * `$sN.field` references to the outputs of the steps it depends on.
 *
 * Pure orchestration: the thing that actually performs a command is injected,
 * so every rule below is testable without a database. That matters because the
 * rules are the safety-critical part, and §26 established that the AI suite is
 * too slow to iterate on when a database is in the loop.
 *
 * The rules, from §3.3 and the bugs that motivated them:
 *
 * - **A non-executable plan does not run.** §21 found `orderedStepIds` is
 *   populated whenever the graph is acyclic — *including* for refused plans,
 *   because a previewable order is useful. An executor that treated a non-empty
 *   list as permission would have executed two steps of a three-step plan whose
 *   third command does not exist.
 * - **Downstream steps are skipped, not failed.** One booking failing should
 *   not be reported as three failures; the two that never ran did not fail.
 * - **Partial success is reported as partial.** Three separate false-success
 *   bugs on this programme (e2e-bug.136, .348, .256) reported success for work
 *   that did not happen. The verdict here is derived from results only — never
 *   from the fact that execution was attempted.
 */
import { STEP_REFERENCE_PATTERN } from './ai-command-plan.types.js';
import type {
  CommandPlan,
  PlanStep,
  PlanValidationResult,
} from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import { compensate, type SagaResult } from './ai-saga.util.js';

export type StepStatus =
  | 'executed'
  /** The step ran and the handler reported failure. */
  | 'failed'
  /** Never attempted, because something it depended on did not succeed. */
  | 'skipped';

export interface StepResult {
  stepId: string;
  command: string;
  status: StepStatus;
  /** Handler output, the source of `$sN.field` values for later steps. */
  output: Record<string, unknown> | null;
  error: string | null;
  /** For skipped steps: the upstream step id that stopped this one. */
  blockedBy: string | null;
}

export type PlanExecutionStatus =
  /** Every step executed. */
  | 'completed'
  /** Some steps executed, some did not. Never reported as success. */
  | 'partial'
  /** Nothing executed. */
  | 'failed'
  /** Refused before any write — the plan was not eligible to run. */
  | 'refused';

export interface PlanExecutionResult {
  status: PlanExecutionStatus;
  steps: StepResult[];
  /** Set when `status === 'refused'`. */
  refusedBecause: string | null;
  /**
   * AI-ROADMAP Phase 5/7 — what the saga did about a partial failure.
   *
   * Null when the plan completed, and also when no `specs` were supplied: a
   * caller that did not opt in gets the pre-§55 behaviour rather than a
   * silently different one.
   */
  saga: SagaResult | null;
}

/** What the caller supplies to actually perform one command. */
export type StepRunner = (input: {
  step: PlanStep;
  /** `variables` with every `$sN.field` replaced by the referenced value. */
  variables: Record<string, unknown>;
}) => Promise<{
  ok: boolean;
  output?: Record<string, unknown>;
  error?: string;
}>;

export interface ExecutePlanOptions {
  /**
   * Whether the user has confirmed. A plan whose validation demands
   * confirmation refuses without it — the gate exists so a T2/T3 command
   * cannot execute on the strength of the planner alone (§3.3).
   */
  confirmed?: boolean;
  /**
   * AI-ROADMAP Phase 5/7 — specs, needed to read each step's declared
   * `compensation`. Without them the executor cannot know what is reversible,
   * so omitting them disables the saga rather than guessing.
   */
  specs?: readonly CommandSpec[];
  /**
   * Reads the pre-write state a compensation needs, BEFORE the step runs.
   *
   * Injected for the same reason `StepRunner` is: reading "the appointment's
   * current start time" is handler knowledge, and the executor stays pure.
   * Returning nothing is safe — §47 reports `missing_capture` and strands the
   * step rather than compensating with undefined values.
   */
  captureState?: CaptureReader;
  /**
   * Runs a compensating command. Separate from `runStep` so a caller can route
   * compensations differently — they must not be traced as user intent, and
   * they bypass confirmation.
   */
  runCompensation?: StepRunner;
}

/** Reads pre-write state for one step. See `ExecutePlanOptions.captureState`. */
export type CaptureReader = (input: {
  step: PlanStep;
  variables: Record<string, unknown>;
  /** Field names the spec's `compensation.captures` asks for. */
  captures: readonly string[];
}) => Promise<Record<string, unknown>> | Record<string, unknown>;

interface RefResolution {
  variables: Record<string, unknown>;
  /** Step id whose output was needed but unavailable. */
  missingFrom: string | null;
}

/**
 * Replace `$sN.field` strings with values from completed steps.
 *
 * Walks nested objects and arrays because plan variables are not flat —
 * `catalog.create_with_services` takes a draft containing service lines, and a
 * reference can sit inside one (§14).
 */
export function resolveStepReferences(
  variables: Record<string, unknown>,
  outputs: ReadonlyMap<string, Record<string, unknown>>,
): RefResolution {
  let missingFrom: string | null = null;

  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') {
      const match = STEP_REFERENCE_PATTERN.exec(value);
      if (!match) return value;
      const [, refStepId, field] = match;
      const output = outputs.get(refStepId);
      if (!output || !(field in output)) {
        // Record the first gap and leave the placeholder in place; the caller
        // skips the step rather than running it with a literal "$s1.id".
        missingFrom ??= refStepId;
        return value;
      }
      return output[field];
    }
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          walk(v),
        ]),
      );
    }
    return value;
  };

  return {
    variables: walk(variables) as Record<string, unknown>,
    missingFrom,
  };
}

/** Step ids this step needs, from both `dependsOn` and its `$sN.field` refs. */
export function dependenciesOf(step: PlanStep): string[] {
  const ids = new Set<string>(step.dependsOn);
  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      const match = STEP_REFERENCE_PATTERN.exec(value);
      if (match) ids.add(match[1]);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') {
      Object.values(value as Record<string, unknown>).forEach(walk);
    }
  };
  Object.values(step.variables).forEach(walk);
  return [...ids];
}

function refuse(reason: string): PlanExecutionResult {
  return { status: 'refused', steps: [], refusedBecause: reason, saga: null };
}

/**
 * Derive the verdict from what actually happened.
 *
 * Deliberately has no access to whether execution was *attempted* — that is the
 * input that produces false success. A plan of three steps where one failed is
 * `partial`, and the response built from it must say so.
 */
export function summarizeExecution(
  steps: readonly StepResult[],
): PlanExecutionStatus {
  if (steps.length === 0) return 'failed';
  const executed = steps.filter((s) => s.status === 'executed').length;
  if (executed === steps.length) return 'completed';
  if (executed === 0) return 'failed';
  return 'partial';
}

export async function executePlan(
  plan: CommandPlan,
  validation: PlanValidationResult,
  runStep: StepRunner,
  options: ExecutePlanOptions = {},
): Promise<PlanExecutionResult> {
  // Gate on `executable`, never on orderedStepIds being non-empty (§21).
  if (!validation.executable) {
    return refuse('Plan did not pass validation.');
  }
  if (validation.requiresConfirmation && options.confirmed !== true) {
    return refuse('Plan requires confirmation before it can run.');
  }
  if (plan.steps.length === 0) {
    return refuse('Plan has no steps.');
  }

  const byId = new Map(plan.steps.map((s) => [s.id, s]));
  const order = validation.orderedStepIds.length
    ? validation.orderedStepIds
    : plan.steps.map((s) => s.id);

  const outputs = new Map<string, Record<string, unknown>>();
  const captures = new Map<string, Record<string, unknown>>();
  const results: StepResult[] = [];
  const statusById = new Map<string, StepStatus>();

  for (const stepId of order) {
    const step = byId.get(stepId);
    if (!step) continue;

    // Skip if anything this step needs did not execute. Checked before the
    // runner is called, so a broken dependency never reaches a handler.
    const blockedBy = dependenciesOf(step).find(
      (dep) => statusById.get(dep) !== 'executed',
    );
    if (blockedBy) {
      const result: StepResult = {
        stepId,
        command: step.command,
        status: 'skipped',
        output: null,
        error: null,
        blockedBy,
      };
      statusById.set(stepId, 'skipped');
      results.push(result);
      continue;
    }

    const { variables, missingFrom } = resolveStepReferences(
      step.variables,
      outputs,
    );
    if (missingFrom) {
      // The upstream step executed but did not return the referenced field —
      // running with the literal "$s1.id" would write a placeholder to the
      // database.
      const result: StepResult = {
        stepId,
        command: step.command,
        status: 'skipped',
        output: null,
        error: null,
        blockedBy: missingFrom,
      };
      statusById.set(stepId, 'skipped');
      results.push(result);
      continue;
    }

    // Capture pre-write state BEFORE the handler runs. `originalStart` does not
    // exist after a reschedule, so a capture taken afterwards is the most
    // plausible way to build a rollback that quietly does nothing (§47).
    const wanted = capturesFor(options.specs, step.command);
    if (wanted.length > 0 && options.captureState) {
      try {
        captures.set(
          stepId,
          await options.captureState({ step, variables, captures: wanted }),
        );
      } catch {
        // A failed capture is not a failed step. Leaving it unset makes §47
        // report `missing_capture` and strand the step, which is the honest
        // outcome — better than compensating with undefined values.
      }
    }

    try {
      const outcome = await runStep({ step, variables });
      const status: StepStatus = outcome.ok ? 'executed' : 'failed';
      if (outcome.ok && outcome.output) outputs.set(stepId, outcome.output);
      statusById.set(stepId, status);
      results.push({
        stepId,
        command: step.command,
        status,
        output: outcome.output ?? null,
        error: outcome.error ?? null,
        blockedBy: null,
      });
    } catch (err: unknown) {
      // A handler that throws is a failed step, not a failed plan: the steps
      // that already succeeded really did happen and must still be reported.
      statusById.set(stepId, 'failed');
      results.push({
        stepId,
        command: step.command,
        status: 'failed',
        output: null,
        error: err instanceof Error ? err.message : String(err),
        blockedBy: null,
      });
    }
  }

  const status = summarizeExecution(results);

  // Compensate only a PARTIAL failure. 'completed' has nothing to undo, and
  // 'failed' means no step executed, so there is no write standing.
  const saga =
    status === 'partial' && options.specs && options.runCompensation
      ? await compensate(
          results,
          options.specs,
          options.runCompensation,
          captures,
        )
      : null;

  return { status, steps: results, refusedBecause: null, saga };
}

/** Fields the spec for `command` wants captured, or none. */
function capturesFor(
  specs: readonly CommandSpec[] | undefined,
  command: string,
): readonly string[] {
  if (!specs) return [];
  const spec = specs.find(
    (c) => c.id === command || c.aliases.includes(command),
  );
  return spec?.compensation?.kind === 'inverse'
    ? spec.compensation.captures
    : [];
}
