/**
 * AI-ROADMAP Phase 6 — multi-turn slot filling.
 *
 * "A clarify answer merges into the pending plan rather than restarting
 * understanding."
 *
 * Restarting is what happens today: a clarify emits a question, the user
 * answers "the 3pm one", and the next turn goes through classification from
 * scratch with a two-word prompt that means nothing on its own. The plan that
 * was 90% understood is thrown away.
 *
 * State round-trips through the client, following the pattern
 * `attachCompoundResumeToClarifyResult` already uses: the pending plan is
 * attached to the clarify result, echoed back in the request context, and
 * merged here. That means this does **not** depend on the server-side session
 * store blocked by e2e-bug.357 — a conversation id would make it tidier, not
 * possible.
 *
 * The dangerous case, and the reason this returns a verdict rather than a plan:
 * **not every reply to a question is an answer to it.** "Actually cancel it
 * instead" is a new request. Treating that as a slot value would write the
 * user's topic change into the pending command — the same family as every
 * silent-pick bug on this programme.
 */
import type { CommandPlan, PlanStep } from './ai-command-plan.types.js';
import type { ClarifyRequest } from './ai-clarify.util.js';

/** Everything needed to resume, small enough to ride in a response. */
export interface PendingClarification {
  plan: CommandPlan;
  /** Step whose variable the question is about. */
  stepId: string;
  request: ClarifyRequest;
}

export const PENDING_CLARIFICATION_KEY = 'pendingClarification';

export type AnswerKind =
  /** Matched an offered option — unambiguous. */
  | 'option'
  /** Free text that reads like a value for the slot. */
  | 'free_text'
  /** Does not look like an answer; re-plan rather than merge. */
  | 'not_an_answer';

export interface SlotFillResult {
  kind: AnswerKind;
  /** The merged plan. Null unless the answer was accepted. */
  plan: CommandPlan | null;
  /** Variable that was filled. */
  variable: string | null;
  /** Value written into the plan. */
  value: string | null;
}

/**
 * Phrases that signal a new request rather than an answer.
 *
 * Deliberately conservative: this only has to catch the cases where treating a
 * reply as a slot value would be actively wrong. Anything it misses falls
 * through to `free_text`, which the caller can still validate against the
 * command's variable schema before writing.
 */
const NEW_REQUEST_CUES = new RegExp(
  [
    '\\b(?:actually|instead|never\\s*mind|forget\\s+(?:it|that)|cancel\\s+that)\\b',
    // A reply that names a different action is a new request, not a value.
    '\\b(?:cancel|reschedule|book|create|delete|refund|pay|show|list)\\b',
  ].join('|'),
  'i',
);

/** True when the reply reads as a fresh instruction rather than a value. */
export function looksLikeNewRequest(answer: string): boolean {
  return NEW_REQUEST_CUES.test(answer.trim());
}

function matchOption(request: ClarifyRequest, answer: string): string | null {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return null;
  for (const option of request.options) {
    if (
      option.value.toLowerCase() === normalized ||
      option.label.toLowerCase() === normalized
    ) {
      return option.value;
    }
  }
  return null;
}

function withVariable(
  plan: CommandPlan,
  stepId: string,
  variable: string,
  value: string,
): CommandPlan {
  return {
    ...plan,
    steps: plan.steps.map((step: PlanStep) =>
      step.id === stepId
        ? { ...step, variables: { ...step.variables, [variable]: value } }
        : step,
    ),
    // The answer resolved the thing that was unresolved; leaving the note in
    // place would make the merged plan fail validation for a reason that no
    // longer holds.
    unresolved: plan.unresolved.filter(
      (item) => !item.toLowerCase().includes(variable.toLowerCase()),
    ),
  };
}

/**
 * Merge a reply into the pending plan.
 *
 * Option matches win over the new-request check: if the user picked "John
 * Smith" from a list, that is an answer even though a name could look like
 * anything. Free text is checked, because that is where a topic change hides.
 */
export function applyClarifyAnswer(
  pending: PendingClarification,
  answer: string,
): SlotFillResult {
  const variable = pending.request.variable;
  const reject: SlotFillResult = {
    kind: 'not_an_answer',
    plan: null,
    variable,
    value: null,
  };

  const trimmed = answer.trim();
  if (!trimmed) return reject;

  const optionValue = matchOption(pending.request, trimmed);
  if (optionValue && variable) {
    return {
      kind: 'option',
      plan: withVariable(pending.plan, pending.stepId, variable, optionValue),
      variable,
      value: optionValue,
    };
  }

  // A question with no variable (an unsupported command, say) has no slot to
  // fill — anything the user types next is a new request by definition.
  if (!variable) return reject;
  if (!pending.request.allowsFreeText) return reject;
  if (looksLikeNewRequest(trimmed)) return reject;

  return {
    kind: 'free_text',
    plan: withVariable(pending.plan, pending.stepId, variable, trimmed),
    variable,
    value: trimmed,
  };
}

/** Attach pending state to a clarify result so the next turn can resume it. */
export function attachPendingClarification(
  details: Record<string, unknown>,
  pending: PendingClarification,
): Record<string, unknown> {
  return { ...details, [PENDING_CLARIFICATION_KEY]: pending };
}

/**
 * Read pending state back off a request context.
 *
 * Validates shape rather than trusting it: this crosses the client boundary,
 * and a malformed blob must produce "no pending clarification" rather than a
 * half-built plan.
 */
export function readPendingClarification(
  context: Record<string, unknown> | undefined | null,
): PendingClarification | null {
  const raw = context?.[PENDING_CLARIFICATION_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const pending = raw as Partial<PendingClarification>;
  if (
    !pending.plan ||
    !Array.isArray(pending.plan.steps) ||
    typeof pending.stepId !== 'string' ||
    !pending.request ||
    typeof pending.request.question !== 'string'
  ) {
    return null;
  }
  if (!pending.plan.steps.some((s) => s.id === pending.stepId)) return null;
  return pending as PendingClarification;
}
