/**
 * AI-ROADMAP Phase 1 — per-step outcomes for `compound_intent`.
 *
 * `compound_intent` is the worst number in §1.1: 380 calls, **61.8% failed**.
 * Nothing recorded *which* step failed, so the only fact available was that a
 * multi-command message did not work — no way to tell "step 3 of 3 failed after
 * two writes landed" from "the decomposition produced nothing at all". Those
 * need opposite fixes.
 *
 * This is the pure half: given what the compound path knows (its sub-intents,
 * which plan steps each produced, and the merged plan's execution timeline), it
 * decides an outcome per sub-intent. It reads no database and calls no service,
 * so every rule below is testable without executing a booking.
 *
 * Attribution is exact, not inferred: `mergePlans` copies each sub-plan's steps
 * with their ids intact, so a merged step id maps back to exactly one
 * sub-intent. Nothing here guesses by action name — two sub-intents in one
 * message frequently share an action ("cancel Mary's, cancel John's").
 */

/**
 * Every valid outcome, as a runtime list.
 *
 * The type alone cannot validate `directOutcomes`, which arrives through the
 * loosely-typed `details` bag that a dozen handlers write into — the same reason
 * every other field here is re-validated rather than trusted (e2e-bug.412).
 */
export const COMPOUND_STEP_OUTCOMES = [
  'executed',
  'failed',
  'skipped',
  'clarified',
  'not_planned',
] as const;

/** What happened to one sub-intent of a compound message. */
export type CompoundStepOutcome =
  /** Its plan steps all completed. */
  | 'executed'
  /** At least one of its plan steps failed. */
  | 'failed'
  /** An earlier step clarified, so this one never ran. Not a failure. */
  | 'skipped'
  /** This is the step that asked the user a question. */
  | 'clarified'
  /**
   * The decomposer named it but no plan could be built for it. The dangerous
   * one: the compound still executes its other steps and reports success, so
   * the user is told a thing happened that never did (§3.3).
   */
  | 'not_planned';

export type CompoundStepRow = {
  stepIndex: number;
  action: string;
  outcome: CompoundStepOutcome;
  /** Plan step ids this sub-intent contributed to the merged plan. */
  planStepIds: string[];
  /** First error reported by one of this sub-intent's steps. */
  error: string | null;
};

/** One entry of `details.executionTimeline` (see `mapExecutionTimeline`). */
export type ExecutionTimelineEntryLike = {
  stepId: string;
  status: string;
  error?: string;
};

export type BuildCompoundStepOutcomesInput = {
  /** Sub-intent actions in decomposition order. */
  actions: readonly string[];
  /**
   * Plan step ids contributed by each sub-intent, indexed the same as
   * `actions`. An empty array means no plan was built for that sub-intent.
   */
  planStepIdsByIndex: readonly (readonly string[])[];
  /** Merged-plan step results. Absent when execution never started. */
  timeline?: readonly ExecutionTimelineEntryLike[];
  /** Index of the sub-intent that asked the user a question, if any. */
  clarifiedAtIndex?: number | null;
  /** Whether the compound as a whole reported success. */
  succeeded: boolean;
  /**
   * Known per-step outcomes from a direct-dispatch path (e2e-bug.412).
   *
   * Positional and sparse: `undefined` at an index means "not supplied or not
   * trusted", and that sub-intent falls back to plan-and-timeline inference.
   */
  directOutcomes?: readonly (CompoundStepOutcome | undefined)[];
};

/** Statuses `mapExecutionTimeline` can carry that mean the step did not run. */
const FAILED_STATUSES = new Set(['failed', 'error', 'rejected']);

export function buildCompoundStepOutcomes(
  input: BuildCompoundStepOutcomesInput,
): CompoundStepRow[] {
  const byStepId = new Map<string, ExecutionTimelineEntryLike>();
  for (const entry of input.timeline ?? []) byStepId.set(entry.stepId, entry);

  const clarifiedAt =
    typeof input.clarifiedAtIndex === 'number' && input.clarifiedAtIndex >= 0
      ? input.clarifiedAtIndex
      : null;

  return input.actions.map((action, stepIndex) => {
    const planStepIds = [...(input.planStepIdsByIndex[stepIndex] ?? [])];

    // A path that executed the step itself is believed over any inference —
    // there is nothing to infer from (e2e-bug.412).
    const direct = input.directOutcomes?.[stepIndex];
    if (direct) {
      return { stepIndex, action, outcome: direct, planStepIds, error: null };
    }

    if (clarifiedAt !== null && stepIndex === clarifiedAt) {
      return {
        stepIndex,
        action,
        outcome: 'clarified',
        planStepIds,
        error: null,
      };
    }
    // A clarify stops the loop, so everything after it was never attempted.
    // Recording those as failures would triple-count one clarify as three.
    if (clarifiedAt !== null && stepIndex > clarifiedAt) {
      return {
        stepIndex,
        action,
        outcome: 'skipped',
        planStepIds,
        error: null,
      };
    }

    if (planStepIds.length === 0) {
      return {
        stepIndex,
        action,
        outcome: 'not_planned',
        planStepIds,
        error: null,
      };
    }

    const entries = planStepIds
      .map((id) => byStepId.get(id))
      .filter((e): e is ExecutionTimelineEntryLike => e !== undefined);

    const failure = entries.find((e) => FAILED_STATUSES.has(e.status));
    if (failure) {
      return {
        stepIndex,
        action,
        outcome: 'failed',
        planStepIds,
        error: failure.error ?? null,
      };
    }

    // No timeline at all: fall back to the compound's overall verdict rather
    // than claiming success per step. A failed compound with no timeline means
    // execution did not report step detail, and calling those steps `executed`
    // would manufacture the exact false success §3.3 forbids.
    if (entries.length === 0) {
      return {
        stepIndex,
        action,
        outcome: input.succeeded ? 'executed' : 'failed',
        planStepIds,
        error: null,
      };
    }

    return { stepIndex, action, outcome: 'executed', planStepIds, error: null };
  });
}

/**
 * Detail key carrying what the compound path knows about its own steps.
 *
 * Underscore-prefixed on purpose: `sanitizeCommandDetailsForClient` strips
 * `_`-prefixed keys, so this reaches telemetry (which runs on the unsanitized
 * result) and never reaches the HTTP response — the e2e-bug.135 convention.
 */
export const COMPOUND_STEP_DETAIL_KEY = '_compoundSteps';

/** What a compound path records under `COMPOUND_STEP_DETAIL_KEY`. */
export type CompoundStepAttribution = {
  actions: string[];
  planStepIdsByIndex: string[][];
  clarifiedAtIndex?: number;
  /**
   * Per-step outcomes for paths that dispatch intents directly — e2e-bug.412.
   *
   * `executeCompoundIntents` runs through the planner, so its step outcomes are
   * *inferred* from plan ids and the execution timeline. The customer path does
   * not: `executeCustomerCompoundFromSteps` calls each handler in a loop and
   * holds the `CommandResult` for every step, so it knows the answer outright.
   *
   * Without this it could not report at all. Attaching with empty
   * `planStepIdsByIndex` would mark every step `not_planned` — "the decomposer
   * named this sub-intent but no plan was built for it" — which is structurally
   * true and semantically false here, and would fill
   * `ai_command_compound_silent_drop` with compounds that dropped nothing.
   */
  directOutcomes?: CompoundStepOutcome[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * Record what the compound path knows about its own steps, on the result.
 *
 * Mutates rather than returning a copy because it is called on results that are
 * already being returned from several branches of `executeCompoundIntents`,
 * including early returns. A copy would have to be threaded back through each
 * of them, and a branch that forgot would silently lose its telemetry.
 */
export function attachCompoundStepAttribution(
  result: { details?: Record<string, unknown> | null },
  attribution: CompoundStepAttribution,
): void {
  result.details = {
    ...(result.details ?? {}),
    [COMPOUND_STEP_DETAIL_KEY]: attribution,
  };
}

/**
 * Pull step outcomes out of a finished `CommandResult`.
 *
 * Returns `[]` for anything that is not a compound carrying attribution, so the
 * caller does not have to know which actions decompose. Every field is
 * re-validated rather than trusted: this reads a loosely-typed `details` bag
 * that a dozen handlers write into, and a malformed entry must produce no rows
 * rather than a row full of `undefined`.
 */
export function extractCompoundStepRows(result: {
  success: boolean;
  details?: Record<string, unknown> | null;
}): CompoundStepRow[] {
  const raw = result.details?.[COMPOUND_STEP_DETAIL_KEY];
  if (!raw || typeof raw !== 'object') return [];

  const attribution = raw as Partial<CompoundStepAttribution>;
  if (!isStringArray(attribution.actions) || attribution.actions.length === 0) {
    return [];
  }

  const planStepIdsByIndex = Array.isArray(attribution.planStepIdsByIndex)
    ? attribution.planStepIdsByIndex.map((ids) =>
        isStringArray(ids) ? ids : [],
      )
    : [];

  const timelineRaw = result.details?.executionTimeline;
  const timeline = Array.isArray(timelineRaw)
    ? timelineRaw.filter(
        (e): e is ExecutionTimelineEntryLike =>
          !!e &&
          typeof e === 'object' &&
          typeof (e as { stepId?: unknown }).stepId === 'string' &&
          typeof (e as { status?: unknown }).status === 'string',
      )
    : undefined;

  // Mapped, never filtered: these are positional, and dropping a bad entry
  // would slide every later outcome onto the wrong sub-intent. An untrusted
  // entry becomes a hole, and that index falls back to inference.
  const directOutcomes = Array.isArray(attribution.directOutcomes)
    ? attribution.directOutcomes.map((o) =>
        typeof o === 'string' &&
        (COMPOUND_STEP_OUTCOMES as readonly string[]).includes(o)
          ? o
          : undefined,
      )
    : undefined;

  return buildCompoundStepOutcomes({
    actions: attribution.actions,
    planStepIdsByIndex,
    directOutcomes,
    timeline,
    clarifiedAtIndex:
      typeof attribution.clarifiedAtIndex === 'number'
        ? attribution.clarifiedAtIndex
        : null,
    succeeded: result.success,
  });
}

/**
 * True when the compound reported success while some sub-intent never ran.
 *
 * This is the honest-partial-success check (§3.3) applied to telemetry: three
 * separate false-success bugs were found this programme (e2e-bug.136,
 * e2e-bug.348, e2e-bug.256), and each looked exactly like this in the data.
 */
export function hasSilentlyDroppedStep(
  rows: readonly CompoundStepRow[],
  succeeded: boolean,
): boolean {
  return succeeded && rows.some((r) => r.outcome === 'not_planned');
}
