/**
 * AI-ROADMAP Phase 6 — clarify as a first-class outcome.
 *
 * Today a clarification is a boolean on a failure: `success: false` plus
 * `details.needsClarification: true` and a free-text summary. Three
 * consequences, all of which this fixes:
 *
 * 1. **It is indistinguishable from a failure.** §28's completion metric has to
 *    treat `clarified` separately precisely because the outcome column does;
 *    the `CommandResult` itself does not.
 * 2. **There are no options.** The roadmap asks for "a targeted question naming
 *    missing variables and top-2 candidates". `grep` finds no structured
 *    candidate list anywhere — the candidates half has never existed, so a
 *    client cannot render choices and the user has to retype.
 * 3. **It gets swallowed.** `shouldAppendPostFailureGuideFallback` returns true
 *    for `needsClarification`, so a command that should ask a question appends
 *    a product-guide tour instead (AI-TODO Phase 6; fixed alongside this).
 *
 * The resolvers built in §29–§31 already produce exactly the raw material —
 * a question plus the candidates that tied. This is the shape that carries it.
 */
import type {
  ResolutionResult,
  EntityCandidate,
} from './ai-entity-resolution.util.js';
import type {
  DateResolution,
  TimeResolution,
} from './ai-datetime-resolution.util.js';
import type { PlanProblem } from './ai-command-plan.types.js';

export type ClarifyReason =
  /** A required variable was not supplied. */
  | 'missing_variable'
  /** Several entities matched equally well (§29). */
  | 'ambiguous_entity'
  /** "Friday" said on a Friday, "next week" (§30). */
  | 'ambiguous_date'
  /** A bare hour that could be morning or evening (§31). */
  | 'ambiguous_time'
  /** The platform has no command for what was asked (§15's headline case). */
  | 'unsupported_command'
  /** Understood, but not confidently enough to act. */
  | 'low_confidence';

export interface ClarifyOption {
  /** Stable value the client sends back when the user picks this. */
  value: string;
  /** What the user sees. */
  label: string;
}

export interface ClarifyRequest {
  reason: ClarifyReason;
  /** The question to ask. One question, not a list of everything wrong. */
  question: string;
  /** Command being clarified, when known. */
  command: string | null;
  /** Variable being clarified, when the gap is a slot. */
  variable: string | null;
  /** Choices the client can render. Empty means free text only. */
  options: ClarifyOption[];
  /** True when a typed answer is acceptable as well as (or instead of) an option. */
  allowsFreeText: boolean;
}

/**
 * How many candidates to offer.
 *
 * The roadmap says "top-2". Offering forty customers is not a clarification,
 * it is the same problem restated — and a client rendering forty buttons is
 * worse than one asking the user to type a surname. Three is the practical
 * ceiling: two choices plus the common "neither of these".
 */
export const MAX_CLARIFY_OPTIONS = 3;

function take(options: ClarifyOption[]): ClarifyOption[] {
  return options.slice(0, MAX_CLARIFY_OPTIONS);
}

/** Ambiguous or unresolvable entity → a question naming the candidates. */
export function clarifyFromEntityResolution<T extends EntityCandidate>(
  result: ResolutionResult<T>,
  context: { command?: string; variable?: string; entityLabel?: string } = {},
): ClarifyRequest | null {
  if (result.status === 'resolved') return null;

  const options = take(
    result.candidates.map((c) => ({ value: c.id, label: c.name })),
  );
  return {
    reason:
      result.status === 'ambiguous' ? 'ambiguous_entity' : 'missing_variable',
    question:
      result.clarification ??
      `Which ${context.entityLabel ?? 'one'} did you mean?`,
    command: context.command ?? null,
    variable: context.variable ?? null,
    options,
    // Always true: the right answer may not be among the candidates, and a
    // clarification the user cannot escape is a dead end.
    allowsFreeText: true,
  };
}

/** Ambiguous date → offer the candidate days. */
export function clarifyFromDateResolution(
  result: DateResolution,
  context: { command?: string; variable?: string } = {},
): ClarifyRequest | null {
  if (result.status === 'resolved') return null;
  return {
    reason: 'ambiguous_date',
    question: result.clarification ?? 'Which date did you mean?',
    command: context.command ?? null,
    variable: context.variable ?? null,
    options: take(result.alternatives.map((d) => ({ value: d, label: d }))),
    allowsFreeText: true,
  };
}

/** Ambiguous time → offer the two readings. */
export function clarifyFromTimeResolution(
  result: TimeResolution,
  context: { command?: string; variable?: string } = {},
): ClarifyRequest | null {
  if (result.status === 'resolved') return null;
  return {
    reason: 'ambiguous_time',
    question: result.clarification ?? 'What time did you mean?',
    command: context.command ?? null,
    variable: context.variable ?? null,
    options: take(result.alternatives.map((t) => ({ value: t, label: t }))),
    allowsFreeText: true,
  };
}

/**
 * The single most useful question for a set of plan problems.
 *
 * Asking about everything wrong at once produces the "I didn't understand"
 * wall that production traces are full of. One targeted question, answered,
 * often resolves the rest — and the remainder can be asked next turn.
 *
 * Ordering is by how actionable the answer is: a missing variable is a
 * question the user can just answer; an unsupported command is a dead end they
 * need to be told about rather than asked.
 */
const PROBLEM_PRIORITY: PlanProblem['code'][] = [
  'missing_variables',
  'invalid_variables',
  'low_confidence',
  'unknown_command',
  'surface_violation',
  'permission_violation',
];

export function clarifyFromPlanProblems(
  problems: readonly PlanProblem[],
): ClarifyRequest | null {
  for (const code of PROBLEM_PRIORITY) {
    const problem = problems.find((p) => p.code === code);
    if (!problem) continue;

    if (code === 'missing_variables') {
      const [first] = problem.details;
      return {
        reason: 'missing_variable',
        question: `What ${first} should I use${problem.command ? ` for ${problem.command}` : ''}?`,
        command: problem.command ?? null,
        variable: first ?? null,
        options: [],
        allowsFreeText: true,
      };
    }
    if (code === 'invalid_variables') {
      const [first] = problem.details;
      return {
        reason: 'missing_variable',
        question: `${first} doesn't look right — what should it be?`,
        command: problem.command ?? null,
        variable: first ?? null,
        options: [],
        allowsFreeText: true,
      };
    }
    if (code === 'low_confidence') {
      return {
        reason: 'low_confidence',
        question: `I'm not confident I understood — did you mean ${problem.command}?`,
        command: problem.command ?? null,
        variable: null,
        options: [],
        allowsFreeText: true,
      };
    }
    // The remaining codes are refusals rather than questions: naming the gap
    // is the useful thing, and there is nothing the user can answer to make an
    // absent command exist.
    return {
      reason: 'unsupported_command',
      question:
        code === 'unknown_command'
          ? `I don't have a command for "${problem.command ?? problem.details[0]}".`
          : `${problem.command} isn't available to you here.`,
      command: problem.command ?? null,
      variable: null,
      options: [],
      allowsFreeText: true,
    };
  }
  return null;
}

/**
 * True when a result is a clarification rather than a failure.
 *
 * Exported so the guide fallback and the trace writer can both branch on one
 * definition instead of each re-deriving it from a different flag — today
 * `clarify`, `needsClarification` and `pipelineStage` are all used for this.
 */
export function isClarifyResult(result: {
  details?: Record<string, unknown> | null;
}): boolean {
  const details = result.details ?? {};
  return (
    details.needsClarification === true ||
    details.clarify === true ||
    typeof details.clarifyRequest === 'object'
  );
}

/** Detail key carrying the structured request, for clients that can render it. */
export const CLARIFY_REQUEST_DETAIL_KEY = 'clarifyRequest';
