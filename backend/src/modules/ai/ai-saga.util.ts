/**
 * AI-ROADMAP Phase 5 — transactional grouping per aggregate, saga across them.
 *
 * §33 built the DAG executor: it runs steps in dependency order and skips
 * downstream work when something fails. What it does *not* do is undo the steps
 * that already succeeded. A three-step plan that creates an appointment, marks
 * it paid, and then fails leaves the first two writes standing.
 *
 * Two mechanisms, and the roadmap is right to name them separately:
 *
 * **Transactional grouping** is the cheap one. Steps against the same aggregate
 * can share a database transaction, so a failure inside the group rolls back
 * with no compensation at all. This is always preferable — a real rollback
 * leaves no trace, whereas a compensation leaves a cancelled row and an email.
 *
 * **Saga compensation** is the expensive one, for when a plan spans aggregates
 * and no single transaction can cover it. Completed groups are undone in
 * reverse order by running each command's declared `compensation`.
 *
 * The design point this module exists to enforce: **compensation is frequently
 * impossible, and saying so is the feature.** Of the 14 mutating specs in the
 * registry, 6 declare `kind: 'none'` or `'manual'` — `appointment.mark_paid`
 * because a refund is a new financial event rather than an undo, the bulk
 * commands because per-row pre-state was never captured. A saga that reports
 * "rolled back" while money has moved is worse than one that reports what it
 * could not reach.
 */
import type { CommandPlan, PlanStep } from './ai-command-plan.types.js';
import type {
  CommandCompensation,
  CommandSpec,
} from './ai-command-spec.types.js';
import type { StepResult, StepRunner } from './ai-plan-executor.util.js';

/**
 * A run of consecutive same-aggregate steps that can share one transaction.
 *
 * "Consecutive" in topological order, not merely "same domain": if an
 * appointment step depends on a catalog step which depends on another
 * appointment step, the two appointment steps cannot be one transaction without
 * holding it open across the catalog write.
 */
export interface TransactionGroup {
  /** The aggregate every step in this group touches. */
  aggregate: string;
  stepIds: string[];
}

function specFor(
  specs: readonly CommandSpec[],
  command: string,
): CommandSpec | undefined {
  return specs.find((s) => s.id === command || s.aliases.includes(command));
}

/** The aggregate a step touches. `domain` is the aggregate root here. */
export function aggregateOf(
  specs: readonly CommandSpec[],
  step: PlanStep,
): string {
  return specFor(specs, step.command)?.domain ?? 'unknown';
}

/**
 * Split an ordered plan into maximal same-aggregate runs.
 *
 * Takes the steps in the order the executor will run them and starts a new
 * group whenever the aggregate changes. Deliberately simple: a smarter grouping
 * could reorder independent steps to make longer runs, but reordering a plan to
 * widen a transaction changes the order writes become visible in, which is not
 * a trade to make silently.
 */
export function groupByAggregate(
  plan: CommandPlan,
  specs: readonly CommandSpec[],
): TransactionGroup[] {
  const groups: TransactionGroup[] = [];
  for (const step of plan.steps) {
    const aggregate = aggregateOf(specs, step);
    const last = groups[groups.length - 1];
    if (last && last.aggregate === aggregate) {
      last.stepIds.push(step.id);
      continue;
    }
    groups.push({ aggregate, stepIds: [step.id] });
  }
  return groups;
}

export type CompensationStatus =
  /** A compensating command is available and can be run. */
  | 'compensable'
  /** Declared irreversible. The write stands. */
  | 'irreversible'
  /** Reversible only by a person. */
  | 'needs_human'
  /** Compensable in principle, but a required capture is missing. */
  | 'missing_capture';

export interface CompensationAction {
  /** The step being undone. */
  stepId: string;
  command: string;
  status: CompensationStatus;
  /** The command to run, when `status === 'compensable'`. */
  compensatingCommand: string | null;
  /** Variables for it, drawn from the captured pre-state. */
  variables: Record<string, unknown>;
  /** Why it cannot be undone, when it cannot. */
  reason: string | null;
}

export interface CompensationPlan {
  /** Reverse execution order — the last write is undone first. */
  actions: CompensationAction[];
  /** Steps whose writes will survive the rollback, with the reason. */
  stranded: CompensationAction[];
  /** True only when every executed step can actually be undone. */
  fullyReversible: boolean;
}

/**
 * Pre-write state captured for a step, keyed by step id.
 *
 * The executor must read these *before* running the step — `originalStart` does
 * not exist after the reschedule. A capture map gathered afterwards is the most
 * plausible way to build a rollback that quietly does nothing.
 */
export type CaptureMap = ReadonlyMap<string, Record<string, unknown>>;

function actionFor(
  result: StepResult,
  compensation: CommandCompensation | undefined,
  captures: CaptureMap,
): CompensationAction {
  const base = {
    stepId: result.stepId,
    command: result.command,
    compensatingCommand: null,
    variables: {},
    reason: null,
  };

  if (!compensation) {
    // An undeclared compensation is not the same as a declared-impossible one,
    // and treating it as reversible would be the optimistic reading. The
    // conformance spec makes this unreachable for registered mutating specs;
    // it stays here for anything reaching the saga off-registry.
    return {
      ...base,
      status: 'irreversible',
      reason: `${result.command} declares no compensation.`,
    };
  }

  if (compensation.kind === 'none') {
    return { ...base, status: 'irreversible', reason: compensation.reason };
  }
  if (compensation.kind === 'manual') {
    return { ...base, status: 'needs_human', reason: compensation.reason };
  }

  const captured = captures.get(result.stepId) ?? {};
  const missing = compensation.captures.filter((c) => !(c in captured));
  if (missing.length > 0) {
    return {
      ...base,
      status: 'missing_capture',
      compensatingCommand: compensation.command,
      reason: `Cannot undo ${result.command}: missing pre-state ${missing.join(', ')}.`,
    };
  }

  return {
    ...base,
    status: 'compensable',
    compensatingCommand: compensation.command,
    variables: Object.fromEntries(
      compensation.captures.map((c) => [c, captured[c]]),
    ),
  };
}

/**
 * Work out how to undo what already ran.
 *
 * Only `executed` steps are compensated: a failed step made no write to undo,
 * and a skipped one never ran. Order is reversed so dependents are unwound
 * before the things they depend on.
 */
export function planCompensation(
  results: readonly StepResult[],
  specs: readonly CommandSpec[],
  captures: CaptureMap = new Map(),
): CompensationPlan {
  const actions = results
    .filter((r) => r.status === 'executed')
    .slice()
    .reverse()
    .map((r) =>
      actionFor(r, specFor(specs, r.command)?.compensation, captures),
    );

  const stranded = actions.filter((a) => a.status !== 'compensable');
  return {
    actions,
    stranded,
    fullyReversible: stranded.length === 0,
  };
}

export type SagaStatus =
  /** Nothing failed; no compensation was needed. */
  | 'completed'
  /** Something failed and every completed step was undone. */
  | 'rolled_back'
  /** Something failed and some writes could not be undone. */
  | 'partially_rolled_back'
  /** Something failed and compensation itself failed. */
  | 'compensation_failed';

export interface SagaResult {
  status: SagaStatus;
  steps: StepResult[];
  compensated: CompensationAction[];
  /** Writes that survive. Non-empty means a human needs to look. */
  stranded: CompensationAction[];
  /** Compensating commands that themselves failed. */
  compensationErrors: { stepId: string; error: string }[];
}

/**
 * Run the compensations for a failed plan.
 *
 * Takes the executor's results rather than running the plan itself: §33 already
 * owns execution, and duplicating it here would create a second orchestrator
 * that can disagree with the first — the exact failure §46 spent a section on.
 *
 * A compensation that throws does not stop the rest. The remaining steps are
 * still worth undoing, and stopping early would strand more than necessary.
 */
export async function compensate(
  results: readonly StepResult[],
  specs: readonly CommandSpec[],
  runner: StepRunner,
  captures: CaptureMap = new Map(),
): Promise<SagaResult> {
  const failed = results.some((r) => r.status === 'failed');
  if (!failed) {
    return {
      status: 'completed',
      steps: [...results],
      compensated: [],
      stranded: [],
      compensationErrors: [],
    };
  }

  const plan = planCompensation(results, specs, captures);
  const compensated: CompensationAction[] = [];
  const compensationErrors: { stepId: string; error: string }[] = [];

  for (const action of plan.actions) {
    if (action.status !== 'compensable' || !action.compensatingCommand) {
      continue;
    }
    try {
      const compensatingStep: PlanStep = {
        id: `compensate-${action.stepId}`,
        command: action.compensatingCommand,
        variables: action.variables,
        // Not the planner's guess: this step comes from a declared
        // `compensation`, so it is as certain as the spec that declares it.
        confidence: 1,
        dependsOn: [],
      };
      const outcome = await runner({
        step: compensatingStep,
        variables: action.variables,
      });
      if (outcome.ok) {
        compensated.push(action);
      } else {
        compensationErrors.push({
          stepId: action.stepId,
          error: outcome.error ?? 'compensation reported failure',
        });
      }
    } catch (error) {
      compensationErrors.push({
        stepId: action.stepId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Ordering matters: a compensation that itself failed is the loudest outcome,
  // because the system is now in a state nobody planned for.
  const status: SagaStatus =
    compensationErrors.length > 0
      ? 'compensation_failed'
      : plan.stranded.length > 0
        ? 'partially_rolled_back'
        : 'rolled_back';

  return {
    status,
    steps: [...results],
    compensated,
    stranded: plan.stranded,
    compensationErrors,
  };
}

/**
 * One line per surviving write, for the message shown to the user.
 *
 * Exists so the honest outcome is easy to render. A saga that knows it stranded
 * a payment and reports "something went wrong" has thrown away the only part
 * the user needed.
 */
export function describeStranded(result: SagaResult): string[] {
  return result.stranded.map((action) => {
    const why = action.reason ?? 'no compensation available';
    return `${action.command} could not be undone: ${why}`;
  });
}
