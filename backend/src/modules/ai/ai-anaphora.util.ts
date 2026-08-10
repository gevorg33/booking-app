/**
 * AI-ROADMAP Phase 4 — anaphora resolution.
 *
 * > "Anaphora resolution against the session entity store ('it', 'that one',
 * > 'the same time')."
 *
 * The item assumes the hard case is *cross-turn*: "it" in this message refers to
 * something named in the last one, so you need the §3.4 session entity store —
 * which is blocked on `conversationId` (e2e-bug.357). Measuring the corpus says
 * that assumption is backwards.
 *
 * ## What 110 real anaphoric prompts actually contain
 *
 * | kind | count | share |
 * |---|---|---|
 * | referent earlier in the **same message** | 90 | **82%** |
 * | expletive / cataphoric ("is it possible", "it says") | 13 | 12% |
 * | no referent in the message | 7 | 6% |
 *
 * And of those 7, reading every one, exactly **one** is genuine cross-turn
 * anaphora ("yes, cancel them all"). The rest are expletives the noun list
 * missed ("keep it within my means", "appreciate it").
 *
 * So the session entity store — the blocked part — would serve roughly 1 prompt
 * in 110. The unblocked part serves 82%, and it is concentrated in exactly the
 * shape the platform is worst at: "cancel my Swedish massage booking and rebook
 * **it** for next Friday" is a compound command, and §42 measured
 * `compound_intent` at 0% accuracy.
 *
 * This module therefore resolves anaphora **within one message**, binding a
 * later step's reference to an earlier step's entity. Cross-turn is left to
 * e2e-bug.357 with the measurement recorded, rather than building a session
 * store to serve one prompt in a hundred.
 *
 * ## Refusing is the safe direction
 *
 * A wrongly bound anaphor is a mutation on a row the user never named — the
 * §48 asymmetry again, and §47 established many of these writes cannot be
 * undone. Two candidate referents therefore produce a clarify, never a pick.
 */
import type { PlanStep } from './ai-command-plan.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import { isMutatingSpec } from './ai-command-spec.types.js';

/**
 * Anaphoric surface forms, and the ones that only look anaphoric.
 *
 * `EXPLETIVE` exists because 12% of matches refer to nothing at all. Binding
 * "it" in "is it possible to cancel my booking?" to a booking would invent a
 * reference the user never made — and then act on it.
 */
const ANAPHOR = /\b(it|them|those|that one|the same(?:\s+\w+)?)\b/i;

const EXPLETIVE =
  /\bis it (?:possible|ok|okay|worth|too|fine)\b|\bit says\b|\bwhat does it mean\b|\bhow much does it cost\b|\bit (?:has|was|is) been\b|\bif that makes sense\b|\bappreciate it\b|\bkeep it within\b/i;

export type AnaphorKind =
  /** "it", "that one" — one entity. */
  | 'singular'
  /** "them", "those" — a set. */
  | 'plural'
  /** "the same time", "the same provider" — an attribute, not an entity. */
  | 'attribute';

export interface AnaphorMention {
  /** The matched text. */
  text: string;
  kind: AnaphorKind;
  /** Character offset in the message. */
  index: number;
  /** For `attribute`: which attribute was echoed ("time", "provider"). */
  attribute: string | null;
}

/**
 * Find the anaphor in a message, if it carries one that refers to anything.
 *
 * Returns null for expletives rather than reporting them and leaving the caller
 * to filter — an anaphor that refers to nothing is not an anaphor, and making
 * that the caller's problem is how it ends up unhandled.
 */
export function findAnaphor(message: string): AnaphorMention | null {
  if (EXPLETIVE.test(message)) return null;
  const match = ANAPHOR.exec(message);
  if (!match) return null;

  const text = match[1];
  const lower = text.toLowerCase();

  if (lower.startsWith('the same')) {
    const attribute = lower.slice('the same'.length).trim();
    return {
      text,
      kind: 'attribute',
      index: match.index,
      attribute: attribute || null,
    };
  }

  return {
    text,
    kind: lower === 'them' || lower === 'those' ? 'plural' : 'singular',
    index: match.index,
    attribute: null,
  };
}

export type AnaphoraStatus =
  /** Bound to exactly one earlier step. */
  | 'resolved'
  /** More than one earlier step could be the referent. */
  | 'ambiguous'
  /** Nothing earlier in the message could be the referent. */
  | 'no_referent'
  /** The message contains no anaphor to resolve. */
  | 'not_applicable';

export interface AnaphoraResolution {
  status: AnaphoraStatus;
  mention: AnaphorMention | null;
  /** Step id the anaphor binds to. Null unless resolved. */
  referentStepId: string | null;
  /** Candidate step ids when ambiguous, so a clarify can offer them. */
  candidates: string[];
  /** What to ask. Null when resolved. */
  clarification: string | null;
}

function specFor(
  specs: readonly CommandSpec[],
  command: string,
): CommandSpec | undefined {
  return specs.find((s) => s.id === command || s.aliases.includes(command));
}

/**
 * Bind an anaphor in a later step to an earlier step in the same plan.
 *
 * The referent must be a step that produces or names an entity — a read that
 * lists things is not something "it" can point at, and treating one as a
 * referent is how "cancel it" after "show my bookings" would cancel an
 * arbitrary row.
 *
 * `stepIndex` is the step carrying the anaphor; only steps before it are
 * candidates, because a reference cannot point forward to something not yet
 * established.
 */
export function resolveAnaphora(
  message: string,
  steps: readonly PlanStep[],
  stepIndex: number,
  specs: readonly CommandSpec[],
): AnaphoraResolution {
  const mention = findAnaphor(message);
  const empty = {
    mention,
    referentStepId: null,
    candidates: [],
  };

  if (!mention) {
    return {
      ...empty,
      status: 'not_applicable',
      clarification: null,
    };
  }

  // Only earlier steps. A forward reference is not an anaphor.
  const earlier = steps.slice(0, stepIndex);

  // A referent must be a step that acts on a specific entity. A step with no
  // variables has not established anything to point at.
  const candidates = earlier.filter((step) => {
    const spec = specFor(specs, step.command);
    if (!spec) return false;
    // Mutating steps establish a concrete entity; a read does not bind "it" to
    // any particular row.
    if (!isMutatingSpec(spec)) return false;
    return Object.keys(step.variables).length > 0;
  });

  if (candidates.length === 0) {
    return {
      ...empty,
      status: 'no_referent',
      clarification: `I'm not sure what "${mention.text}" refers to here.`,
    };
  }

  if (candidates.length > 1) {
    // Refuse. A wrongly bound anaphor is a mutation on a row the user never
    // named, and §47 established many of these writes cannot be undone.
    return {
      ...empty,
      status: 'ambiguous',
      candidates: candidates.map((c) => c.id),
      clarification: `Which one did you mean by "${mention.text}"?`,
    };
  }

  return {
    status: 'resolved',
    mention,
    referentStepId: candidates[0].id,
    candidates: [candidates[0].id],
    clarification: null,
  };
}

/**
 * Rewrite a step's variable to reference the resolved referent.
 *
 * Emits the `$sN.field` form §33's executor already understands, rather than
 * inlining a value: the referent's id does not exist until that step runs, and
 * the executor is what knows how to wire an output into a later input.
 */
export function bindAnaphorToReference(
  step: PlanStep,
  variable: string,
  referentStepId: string,
  field = 'id',
): PlanStep {
  return {
    ...step,
    variables: {
      ...step.variables,
      [variable]: `$${referentStepId}.${field}`,
    },
    dependsOn: step.dependsOn.includes(referentStepId)
      ? step.dependsOn
      : [...step.dependsOn, referentStepId],
  };
}
