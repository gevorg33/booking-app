/**
 * AI-ROADMAP Phase 4 — the one resolution layer.
 *
 * > "One `EntityResolutionService`: names→IDs, services→IDs, dates/times→ISO,
 * > relative ranges. Replaces ≥4 independent re-parsers."
 *
 * The roadmap said "≥4". The tree has more, and they disagree. Measured before
 * writing any of this:
 *
 * - **`resolveServiceByName` exists 7 times** — five byte-identical copies
 *   (`ai-checkout-recommendations`, `ai-consumer-checkout-success`,
 *   `ai-clinic-booking`, `ai-clinic-service`, `ai-upcoming-tour-departures`)
 *   plus two variants that add a reverse-substring rule.
 * - Against a five-service catalogue, **3 of 11 ordinary inputs get different
 *   answers** depending on which file the call site happens to live in.
 *   `"  Massage  "` resolves in one variant and returns `undefined` in the
 *   other, because only one of them trims.
 * - **5 of 11 inputs are ambiguous** — more than one service contains the
 *   query — and every variant resolves them by *array order*. "massage" against
 *   a catalogue holding "Massage", "Deep Tissue Massage" and "Hot Stone
 *   Massage" silently picks whichever the database returned first.
 *
 * That last one is the reason this is a service and not a shared helper. The
 * fix is not deduplication, it is *refusing* — §29's resolver returns
 * `ambiguous` and a clarify question where the old ones guessed. Deduplicating
 * seven copies of a silent pick would produce one very consistent silent pick.
 *
 * This class is deliberately thin. All the logic lives in the pure utils
 * (§29–§32) and is tested there; what this adds is a single injectable seam so
 * call sites stop growing their own parsers, plus the §37 clarify shaping that
 * makes refusal usable instead of merely correct.
 */
import { Injectable } from '@nestjs/common';
import {
  clarifyFromDateResolution,
  clarifyFromEntityResolution,
  clarifyFromTimeResolution,
  type ClarifyRequest,
} from './ai-clarify.util.js';
import {
  resolveEntities,
  resolveEntity,
  type EntityCandidate,
  type ResolutionResult,
  type ResolveEntityOptions,
} from './ai-entity-resolution.util.js';
import {
  resolveRelativeDate,
  resolveTimeOfDay,
  type DateResolution,
  type DateResolutionContext,
  type TimeResolution,
  type TimeResolutionOptions,
} from './ai-datetime-resolution.util.js';
import {
  resolveDateRange,
  type DateRange,
} from './ai-orchestration.helpers.js';

/**
 * A resolution paired with the question to ask when it did not land.
 *
 * The two are returned together because separating them is how the old code
 * went wrong: a call site that gets back `null` has to invent its own error,
 * and inventing one is a keystroke away from guessing instead.
 */
export interface Resolved<T> {
  value: T | null;
  /** Null when resolved. Non-null means: ask this, do not proceed. */
  clarify: ClarifyRequest | null;
}

/**
 * Which command and variable a resolution was for.
 *
 * Threaded into the clarify so the question can be answered by §38's slot
 * filling: a `ClarifyRequest` with a null `variable` is a question the merge
 * step cannot route an answer back into.
 */
export interface ClarifyContext {
  command?: string;
  variable?: string;
}

@Injectable()
export class EntityResolutionService {
  /**
   * names→IDs. Any entity with an id and a name: customers, providers, staff.
   *
   * Returns the full §29 result rather than the match, so callers keep access
   * to the confidence, the tier and the tied candidates.
   */
  resolveEntity<T extends EntityCandidate>(
    candidates: readonly T[],
    query: string,
    options: ResolveEntityOptions = {},
  ): ResolutionResult<T> {
    return resolveEntity(candidates, query, options);
  }

  /**
   * Several names at once, reporting the misses instead of dropping them.
   *
   * The `unresolved` half is the load-bearing part: `resolveEmployees` silently
   * drops any name it cannot match, so "cancel for John and Mary" with an
   * unknown Mary quietly becomes "cancel for John".
   */
  resolveEntities<T extends EntityCandidate>(
    candidates: readonly T[],
    queries: readonly string[],
    options: ResolveEntityOptions = {},
  ): {
    resolved: T[];
    unresolved: { query: string; result: ResolutionResult<T> }[];
  } {
    return resolveEntities(candidates, queries, options);
  }

  /**
   * services→IDs — the case with seven competing implementations.
   *
   * Identical to `resolveEntity` apart from the label, and that is the point:
   * a service is not a special kind of entity, it was only ever resolved by
   * different code because it was resolved in different files.
   */
  resolveService<T extends EntityCandidate>(
    services: readonly T[],
    query: string,
    options: Omit<ResolveEntityOptions, 'entityLabel'> = {},
  ): ResolutionResult<T> {
    return resolveEntity(services, query, {
      ...options,
      entityLabel: 'service',
    });
  }

  /** dates→ISO. `YYYY-MM-DD` in the business timezone, or a question. */
  resolveDate(
    phrase: string,
    context: DateResolutionContext,
    options: { threshold?: number } = {},
  ): DateResolution {
    return resolveRelativeDate(phrase, context, options);
  }

  /** times→ISO. `HH:MM` 24-hour, narrowed by business hours where given. */
  resolveTime(
    phrase: string,
    options: TimeResolutionOptions = {},
  ): TimeResolution {
    return resolveTimeOfDay(phrase, options);
  }

  /**
   * relative ranges → a day range.
   *
   * Delegates to `resolveDateRange` (§32) rather than reimplementing it. That
   * function was already timezone-correct, so §32 extended it in place instead
   * of adding a competing parser — the same mistake this class exists to undo.
   */
  resolveRange(
    params: Parameters<typeof resolveDateRange>[0],
    prompt?: string,
    timeZone?: string,
  ): DateRange | null {
    return resolveDateRange(params, prompt, timeZone);
  }

  // --- clarify-shaped wrappers -------------------------------------------
  //
  // The plain resolvers above return rich results for callers that want to
  // reason about confidence. These return the "use it or ask this" shape,
  // which is what a command handler actually wants, and make the refusal path
  // the path of least resistance rather than something to remember.

  entityOrClarify<T extends EntityCandidate>(
    candidates: readonly T[],
    query: string,
    options: ResolveEntityOptions & ClarifyContext = {},
  ): Resolved<T> {
    const result = resolveEntity(candidates, query, options);
    return result.status === 'resolved'
      ? { value: result.match, clarify: null }
      : {
          value: null,
          clarify: clarifyFromEntityResolution(result, {
            command: options.command,
            variable: options.variable,
            entityLabel: options.entityLabel,
          }),
        };
  }

  serviceOrClarify<T extends EntityCandidate>(
    services: readonly T[],
    query: string,
    options: Omit<ResolveEntityOptions, 'entityLabel'> & ClarifyContext = {},
  ): Resolved<T> {
    return this.entityOrClarify(services, query, {
      ...options,
      entityLabel: 'service',
    });
  }

  dateOrClarify(
    phrase: string,
    context: DateResolutionContext,
    options: { threshold?: number } & ClarifyContext = {},
  ): Resolved<string> {
    const result = resolveRelativeDate(phrase, context, options);
    return result.status === 'resolved'
      ? { value: result.date, clarify: null }
      : { value: null, clarify: clarifyFromDateResolution(result, options) };
  }

  timeOrClarify(
    phrase: string,
    options: TimeResolutionOptions & ClarifyContext = {},
  ): Resolved<string> {
    const result = resolveTimeOfDay(phrase, options);
    return result.status === 'resolved'
      ? { value: result.time, clarify: null }
      : { value: null, clarify: clarifyFromTimeResolution(result, options) };
  }
}
