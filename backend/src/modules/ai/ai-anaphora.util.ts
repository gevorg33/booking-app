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

/**
 * B4 / e2e-bug.370 — apply anaphora resolution across a whole plan.
 *
 * `resolveAnaphora` answers "what does the anaphor in this step point at";
 * this is the pass that runs it over every step and rewrites the ones it can.
 * It exists so the planner service does not have to own the loop, the
 * one-variable rule, or the ambiguity precedence — three decisions that belong
 * with the resolver, not with its caller.
 *
 * **`missingByStepId` rather than a validation result.** The trigger condition
 * is "this step is short a variable", which `validatePlan` already computes
 * (`missing_variables`, whose `details` are the missing names). Passing the
 * names keeps this module independent of `PlanValidationResult` — and, more to
 * the point, stops a second implementation of "is this step incomplete" from
 * existing. That duplication is precisely what e2e-bug.409 was about.
 *
 * **Only steps missing exactly one variable are bound.** With two or more
 * missing, nothing in the message says which one "it" fills, and guessing
 * writes a reference into an arbitrary field. Fewer bindings is the right error
 * here: an unbound step still clarifies, whereas a wrongly-bound step executes
 * against the wrong entity.
 *
 * **Ambiguity stops the pass.** A resolver that says "more than one earlier step
 * could be the referent" has found a question for the user, not a repair, and
 * continuing to bind later steps would bury it.
 */
export function applyAnaphoraToPlan(
  message: string,
  steps: readonly PlanStep[],
  missingByStepId: ReadonlyMap<string, readonly string[]>,
  specs: readonly CommandSpec[],
): {
  steps: PlanStep[];
  changed: boolean;
  ambiguous: AnaphoraResolution | null;
} {
  const next = [...steps];
  let changed = false;

  for (let i = 0; i < next.length; i++) {
    const step = next[i];
    const missing = missingByStepId.get(step.id) ?? [];
    // Exactly one missing variable — see the note above.
    if (missing.length !== 1) continue;

    const resolution = resolveAnaphora(message, next, i, specs);
    if (resolution.status === 'ambiguous') {
      return { steps: next, changed, ambiguous: resolution };
    }
    if (resolution.status !== 'resolved' || !resolution.referentStepId) {
      continue;
    }

    next[i] = bindAnaphorToReference(step, missing[0], resolution.referentStepId);
    changed = true;
  }

  return { steps: next, changed, ambiguous: null };
}

// ---------------------------------------------------------------------------
// e2e-bug.370 — cross-turn anaphora: "it" that points at a previous turn.
// ---------------------------------------------------------------------------

import {
  lookupEntity,
  type EntityRefKind,
  type EntityStore,
} from './ai-entity-store.util.js';

/**
 * Which step variable a kind of stored ref can fill.
 *
 * Ids first: the store exists so "it" can be acted on without re-resolving.
 * Names second, because many specs declare `serviceName` rather than
 * `serviceId` and the executor resolves the name — a recorded label is an
 * exact catalog name, so that resolution is deterministic rather than fuzzy.
 */
const VARIABLES_BY_KIND: ReadonlyArray<{
  kind: EntityRefKind;
  variables: readonly string[];
}> = [
  { kind: 'service', variables: ['serviceId', 'serviceName'] },
  { kind: 'employee', variables: ['employeeId', 'employeeName'] },
  { kind: 'customer', variables: ['customerId', 'customerName'] },
  { kind: 'appointment', variables: ['bookingId'] },
  { kind: 'package', variables: ['packageId', 'packageName'] },
];

function kindForVariable(
  variable: string,
): { kind: EntityRefKind; isId: boolean } | null {
  for (const row of VARIABLES_BY_KIND) {
    const index = row.variables.indexOf(variable);
    if (index !== -1) return { kind: row.kind, isId: index === 0 };
  }
  return null;
}

export interface ConversationBinding {
  steps: PlanStep[];
  changed: boolean;
  /** Set when a ref of the right kind exists but is not unique. */
  ambiguous: { clarification: string; candidates: string[] } | null;
}

/**
 * Bind an anaphor to an entity the conversation resolved on a *previous* turn.
 *
 * `applyAnaphoraToPlan` above handles the intra-plan case — "book a haircut
 * and then cancel it" — by pointing a later step at an earlier one. It cannot
 * help the far more common shape, which is a single-step follow-up:
 *
 *     turn 1: "what's the price of a deep tissue massage?"
 *     turn 2: "book it for tomorrow at 3"
 *
 * There is no earlier step in turn 2's plan; the referent is in the previous
 * turn. e2e-bug.370 measured this as 82% of real anaphora unresolved, with
 * `compound_intent` at 0%. What was missing was not a resolver but a source:
 * §53's entity store existed and was never written (e2e-bug.373) and never
 * transported between turns (e2e-bug.401). Both are now in place, so this is
 * the read side.
 *
 * The same refusal discipline as the intra-plan resolver:
 *
 *   - Only steps missing **exactly one** variable are bound. Two missing
 *     variables means the anaphor could stand for either, and guessing which is
 *     how "book it with her" binds the service to the provider.
 *   - A ref of the right kind that is not unique is refused with the
 *     candidates, never picked. `lookupEntity` already treats equally-recent
 *     refs as a tie.
 *   - Staleness is `lookupEntity`'s call, using §48's window and turn limit —
 *     an "it" from twenty turns ago is not the same conversation.
 *   - No ref of that kind at all means nothing is changed: the plan goes on to
 *     the ordinary missing-variable clarify, which is today's behaviour.
 */
export function applyConversationRefsToPlan(
  message: string,
  steps: readonly PlanStep[],
  missingByStepId: ReadonlyMap<string, readonly string[]>,
  store: EntityStore | null | undefined,
  options: { now: Date; currentTurn: number },
): ConversationBinding {
  const unchanged = { steps: [...steps], changed: false, ambiguous: null };
  if (!store || store.refs.length === 0) return unchanged;

  const mention = findAnaphor(message);
  if (!mention) return unchanged;

  const next = [...steps];
  let changed = false;

  for (let i = 0; i < next.length; i += 1) {
    const missing = missingByStepId.get(next[i].id);
    if (!missing || missing.length !== 1) continue;

    const target = kindForVariable(missing[0]);
    if (!target) continue;

    const lookup = lookupEntity(store, {
      now: options.now,
      currentTurn: options.currentTurn,
      kind: target.kind,
    });

    if (lookup.status === 'ambiguous') {
      return {
        steps: [...steps],
        changed: false,
        ambiguous: {
          clarification: `Which one did you mean by "${mention.text}"? ${lookup.candidates
            .map((c) => c.label)
            .join(' or ')}?`,
          candidates: lookup.candidates.map((c) => c.id),
        },
      };
    }

    if (lookup.status !== 'resolved' || !lookup.ref) continue;

    next[i] = {
      ...next[i],
      variables: {
        ...next[i].variables,
        [missing[0]]: target.isId ? lookup.ref.id : lookup.ref.label,
      },
    };
    changed = true;
  }

  return { steps: next, changed, ambiguous: null };
}
