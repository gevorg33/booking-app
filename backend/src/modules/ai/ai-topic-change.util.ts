/**
 * AI-ROADMAP Phase 6 — topic-change detection invalidating stale bindings.
 *
 * `CommandPlan.topicChanged` already exists. The planner prompt asks the model
 * to set it, `ai-command-plan.decode.ts` reads it — and **nothing consumes it**.
 * The detection half has been shipped and unused; the invalidation half, which
 * is the part with teeth, was never built. The field's own doc comment states
 * the risk it was meant to prevent: "so a later 'cancel it' cannot silently
 * target the previous topic."
 *
 * ## Lexical similarity was measured and rejected
 *
 * The obvious detector is prompt similarity — §43 already has a content-token
 * Jaccard measure tuned on this corpus. Sampling 40 consecutive message pairs
 * from `ai_command_trace` shows it cannot do this job:
 *
 * | previous → current | similarity | same action? |
 * |---|---|---|
 * | "Who approves my time off?" → "Ով է հաստատում իմ արձակուրդը" | **0.00** | yes |
 * | "What do I sell?" → "What services do we offer?" | **0.00** | yes |
 * | "How do I use the Today tab?" → "Ինչպե՞ս օգտագործեմ Today tab-ը" | **0.67** | **no** |
 *
 * The corpus is trilingual (English, Armenian, Russian). A message and its
 * translation share no tokens, and the one high-scoring pair above scores high
 * only because "today" and "tab" survive transliteration. Lexical overlap is
 * measuring language, not subject. §43 uses the same measure successfully for
 * *rephrase detection within one language*, which is a different question.
 *
 * ## So this uses structural signals, and fails safe
 *
 * The asymmetry decides the default. A false negative keeps a stale binding and
 * a mutating command hits the wrong row — an appointment cancelled that the user
 * never named. A false positive makes the user say which one they meant. Those
 * costs are nowhere near equal, so **bindings expire unless something positively
 * indicates continuity**, rather than persisting until something proves change.
 */
import type { CommandPlan } from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import { isMutatingSpec } from './ai-command-spec.types.js';
import {
  looksLikeNewRequest,
  type PendingClarification,
} from './ai-slot-filling.util.js';

/**
 * How long a pending binding stays fresh.
 *
 * Five minutes, matching §43's measured "one sitting" window on this corpus —
 * the same boundary the miss miner uses to decide whether two messages belong
 * to the same attempt. Reusing it keeps one definition of "still the same
 * conversation" rather than inventing a second.
 */
export const BINDING_TTL_MS = 5 * 60 * 1000;

/**
 * How many turns a binding survives.
 *
 * One. A clarification is answered by the next message or it is not answered;
 * a plan still pending three turns later is not what the user is talking about.
 */
export const BINDING_MAX_TURNS = 1;

export type TopicChangeSignal =
  /** The planner set `topicChanged` on the new plan. */
  | 'model_reported'
  /** The new message names a different command than the pending plan's step. */
  | 'command_mismatch'
  /** "actually", "never mind", or a verb that reads as a fresh instruction. */
  | 'new_request_cue'
  /** The binding is older than `BINDING_TTL_MS`. */
  | 'expired'
  /** The binding has survived more turns than it should. */
  | 'too_many_turns';

export interface TopicChangeInput {
  pending: PendingClarification;
  /** The message that just arrived. */
  message: string;
  /** The plan the new message produced, when one was built. */
  newPlan?: CommandPlan | null;
  /** When the pending binding was created. */
  pendingCreatedAt: Date;
  now: Date;
  /** Turns elapsed since the binding was created. */
  turnsElapsed?: number;
}

export interface TopicChangeVerdict {
  changed: boolean;
  signals: TopicChangeSignal[];
  /** Human-readable, for the trace and for the response. */
  reason: string | null;
}

function pendingCommand(pending: PendingClarification): string | null {
  const step = pending.plan.steps.find((s) => s.id === pending.stepId);
  return step?.command ?? null;
}

/**
 * Decide whether the new message is still about the pending thing.
 *
 * Signals are OR-ed, not weighted. A weighted score would need a threshold, and
 * the measurement above shows there is no text-derived quantity here worth
 * thresholding — these are each independently sufficient reasons to stop
 * trusting a binding.
 */
export function detectTopicChange(input: TopicChangeInput): TopicChangeVerdict {
  const signals: TopicChangeSignal[] = [];

  if (input.newPlan?.topicChanged === true) {
    signals.push('model_reported');
  }

  const previous = pendingCommand(input.pending);
  const next = input.newPlan?.steps[0]?.command ?? null;
  if (previous && next && previous !== next) {
    signals.push('command_mismatch');
  }

  // Reuses §38's cue check rather than adding a second phrase list — two lists
  // that can disagree about "never mind" is the §46 failure mode.
  if (looksLikeNewRequest(input.message)) {
    signals.push('new_request_cue');
  }

  const age = input.now.getTime() - input.pendingCreatedAt.getTime();
  if (age > BINDING_TTL_MS) {
    signals.push('expired');
  }

  if ((input.turnsElapsed ?? 0) > BINDING_MAX_TURNS) {
    signals.push('too_many_turns');
  }

  return {
    changed: signals.length > 0,
    signals,
    reason: signals.length > 0 ? describeSignals(signals) : null,
  };
}

function describeSignals(signals: readonly TopicChangeSignal[]): string {
  const text: Record<TopicChangeSignal, string> = {
    model_reported: 'the planner flagged a new subject',
    command_mismatch: 'the new message names a different command',
    new_request_cue: 'the message reads as a fresh instruction',
    expired: 'the earlier question is more than five minutes old',
    too_many_turns: 'the earlier question is more than one turn old',
  };
  return signals.map((s) => text[s]).join('; ');
}

export interface BindingDecision {
  /** The pending state to carry forward. Null means: dropped. */
  pending: PendingClarification | null;
  invalidated: boolean;
  signals: TopicChangeSignal[];
  /** What to tell the user, when a binding was dropped mid-clarification. */
  notice: string | null;
}

/**
 * Drop a pending binding that the new message has made stale.
 *
 * The extra rule beyond `detectTopicChange`: **a mutating pending command is
 * held to a stricter standard.** For a read, a stale binding shows the wrong
 * list and the user asks again. For a mutation it writes to the wrong row, and
 * §47 established that many writes here cannot be undone at all — a wrongly
 * cancelled appointment has already emailed the customer.
 *
 * So a mutating binding is dropped on *any* signal, while a read binding
 * survives a lone `expired` signal, where the only evidence is a clock.
 */
export function invalidateStaleBindings(
  input: TopicChangeInput,
  specs: readonly CommandSpec[],
): BindingDecision {
  const verdict = detectTopicChange(input);
  if (!verdict.changed) {
    return {
      pending: input.pending,
      invalidated: false,
      signals: [],
      notice: null,
    };
  }

  const command = pendingCommand(input.pending);
  const spec = specs.find(
    (s) => s.id === command || s.aliases.includes(command ?? ''),
  );
  // An unknown command is treated as mutating. Guessing "read" about a command
  // we cannot identify is the optimistic reading, and the optimistic reading is
  // what lets a stale binding reach a write.
  const mutating = spec ? isMutatingSpec(spec) : true;

  const onlyExpired =
    verdict.signals.length === 1 && verdict.signals[0] === 'expired';
  if (!mutating && onlyExpired) {
    return {
      pending: input.pending,
      invalidated: false,
      signals: verdict.signals,
      notice: null,
    };
  }

  return {
    pending: null,
    invalidated: true,
    signals: verdict.signals,
    notice: `I've dropped my earlier question because ${verdict.reason}.`,
  };
}
