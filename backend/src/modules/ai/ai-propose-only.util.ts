/**
 * AI-ROADMAP Phase 7 — new commands ship propose-only until they clear the bar.
 *
 * "New commands ship **propose-only** until they clear the accuracy bar."
 *
 * The bar exists as a number (§25's committed baseline carries per-intent
 * accuracy for 527 intents) and as a rule in the roadmap. Nothing joined them:
 * a command with no eval coverage at all, or one failing every case it has,
 * executes exactly like one measured at 100%.
 *
 * Measured against the committed baseline at a 90% bar and a 5-case minimum:
 *
 *   cleared 343 · below the bar 32 · too few cases to tell 152
 *
 * The third bucket is the interesting one. **152 intents cannot clear a bar
 * they were never measured against**, and today they all execute. Among the
 * measured failures, `compound_intent` sits at 0% of 48 cases — it fails every
 * eval case it has, and production says it fails 61.8% of real traffic.
 *
 * Propose-only does not mean disabled: the command is still understood,
 * previewed and offered. It just does not write without a human saying yes.
 */
import type { AiAccuracyBaseline } from './eval/ai-command-eval.report.js';

/**
 * Accuracy a command must reach before it writes unattended.
 *
 * 90% rather than §7's 92% completion target: those measure different things —
 * completion includes clarifies and infrastructure failures, this is only "did
 * the classifier pick the right command". Exported so it can be argued with and
 * raised as the corpus improves.
 */
export const PROPOSE_ONLY_ACCURACY_BAR = 90;

/**
 * Cases needed before a percentage means anything.
 *
 * `appointment_reminder_preferences` is 0 of 1 in the baseline. That is not a
 * 0%-accurate command, it is an unmeasured one, and the distinction changes
 * what you do about it: one needs fixing, the other needs eval cases.
 */
export const PROPOSE_ONLY_MIN_CASES = 5;

export type ExecutionMode =
  /** May execute without a human confirming each time. */
  | 'autonomous'
  /** Understood and previewed, but never writes without explicit approval. */
  | 'propose_only';

export type ProposeOnlyReason =
  /** Not present in the eval baseline at all. */
  | 'no_coverage'
  /** Present, but too few cases for the percentage to mean anything. */
  | 'insufficient_evidence'
  /** Measured, and below the bar. */
  | 'below_bar'
  /** Measured, at or above the bar. */
  | 'cleared'
  /**
   * Measured, but the coverage does not measure execution — e2e-bug.427.
   *
   * The corpus asserts `rescuedAction`: which command a prompt routes to. For
   * most commands routing correctly and executing correctly are close enough
   * that the percentage stands in for both. For a compound they are not the
   * same claim at all — naming `compound_intent` says only that the message was
   * recognised as multi-step, and says nothing about whether its steps ran.
   */
  | 'execution_unproven';

export interface ExecutionModeVerdict {
  mode: ExecutionMode;
  reason: ProposeOnlyReason;
  /** Null when the command has no coverage. */
  accuracyPct: number | null;
  cases: number;
  bar: number;
  /** One line for the preview and the trace. */
  explanation: string;
}

export interface ProposeOnlyOptions {
  bar?: number;
  minCases?: number;
  /**
   * Commands explicitly cleared to run autonomously despite the data — an
   * escape hatch for a command whose eval coverage is genuinely unrepresentative.
   * Deliberately an allowlist rather than a flag on the spec: overriding a
   * safety bar should be a visible, reviewable list, not a field someone sets
   * while adding a command.
   */
  overrides?: ReadonlySet<string>;
}

/**
 * Decide how a command may run, from its measured accuracy.
 *
 * Takes the baseline rather than reading it, so this stays pure and a caller
 * can evaluate a hypothetical bar without touching the file.
 */
/**
 * Commands whose eval percentage measures routing, not execution — e2e-bug.427.
 *
 * `compound_intent` went 0% -> 100% the moment `e2e-bug.425` stopped the surface
 * gate discarding its rescues. Nothing about *executing* a compound changed, and
 * the accuracy rule would have promoted it from `propose_only` to `autonomous`
 * on that alone — a multi-step command, on the strength of 48 cases that only
 * ever asserted the routing decision.
 *
 * §135 is the counter-evidence: compound failures on real traffic are dominated
 * by one constituent step (`book_nearest_slot`, in 148 of 222 failed compounds),
 * which no `rescuedAction` assertion can see.
 *
 * Held here rather than by pretending the accuracy is lower than it is. The
 * number is right; it is measuring a different thing.
 */
export const EXECUTION_UNPROVEN_BY_EVAL: ReadonlySet<string> = new Set([
  'compound_intent',
]);

export function resolveExecutionMode(
  command: string,
  baseline: Pick<AiAccuracyBaseline, 'byIntent'>,
  options: ProposeOnlyOptions = {},
): ExecutionModeVerdict {
  const bar = options.bar ?? PROPOSE_ONLY_ACCURACY_BAR;
  const minCases = options.minCases ?? PROPOSE_ONLY_MIN_CASES;

  if (options.overrides?.has(command)) {
    return {
      mode: 'autonomous',
      reason: 'cleared',
      accuracyPct: baseline.byIntent[command]?.accuracyPct ?? null,
      cases: baseline.byIntent[command]?.total ?? 0,
      bar,
      explanation: `${command} is explicitly allowlisted for autonomous execution.`,
    };
  }

  if (EXECUTION_UNPROVEN_BY_EVAL.has(command)) {
    const measured = baseline.byIntent[command];
    return {
      mode: 'propose_only',
      reason: 'execution_unproven',
      accuracyPct: measured?.accuracyPct ?? null,
      cases: measured?.total ?? 0,
      bar,
      explanation:
        `${command} is measured on routing, not execution — its eval cases assert ` +
        'which command a prompt reaches, which for a compound says nothing about whether its steps ran.',
    };
  }

  const row = baseline.byIntent[command];

  if (!row) {
    return {
      mode: 'propose_only',
      reason: 'no_coverage',
      accuracyPct: null,
      cases: 0,
      bar,
      explanation: `${command} has no eval coverage, so it proposes rather than executes.`,
    };
  }

  if (row.total < minCases) {
    return {
      mode: 'propose_only',
      reason: 'insufficient_evidence',
      accuracyPct: row.accuracyPct,
      cases: row.total,
      bar,
      explanation:
        `${command} has only ${row.total} eval case(s) — too few to clear the bar. ` +
        'Add cases rather than raising the threshold.',
    };
  }

  if (row.accuracyPct < bar) {
    return {
      mode: 'propose_only',
      reason: 'below_bar',
      accuracyPct: row.accuracyPct,
      cases: row.total,
      bar,
      explanation: `${command} scores ${row.accuracyPct}% on ${row.total} eval cases, below the ${bar}% bar.`,
    };
  }

  return {
    mode: 'autonomous',
    reason: 'cleared',
    accuracyPct: row.accuracyPct,
    cases: row.total,
    bar,
    explanation: `${command} scores ${row.accuracyPct}% on ${row.total} eval cases.`,
  };
}

/** True when this command must not write without explicit approval. */
export function isProposeOnly(
  command: string,
  baseline: Pick<AiAccuracyBaseline, 'byIntent'>,
  options: ProposeOnlyOptions = {},
): boolean {
  return (
    resolveExecutionMode(command, baseline, options).mode === 'propose_only'
  );
}

export interface ProposeOnlySummary {
  autonomous: number;
  proposeOnly: number;
  byReason: Record<ProposeOnlyReason, number>;
}

/** Portfolio view, for tracking the bar being raised over time (Phase 9). */
export function summarizeExecutionModes(
  commands: readonly string[],
  baseline: Pick<AiAccuracyBaseline, 'byIntent'>,
  options: ProposeOnlyOptions = {},
): ProposeOnlySummary {
  const byReason: Record<ProposeOnlyReason, number> = {
    no_coverage: 0,
    insufficient_evidence: 0,
    below_bar: 0,
    cleared: 0,
  };
  let autonomous = 0;
  let proposeOnly = 0;

  for (const command of commands) {
    const verdict = resolveExecutionMode(command, baseline, options);
    byReason[verdict.reason] += 1;
    if (verdict.mode === 'autonomous') autonomous += 1;
    else proposeOnly += 1;
  }

  return { autonomous, proposeOnly, byReason };
}
