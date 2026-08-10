/**
 * AI-ROADMAP Phase 6 / §3.4 tier 2 — the session entity store.
 *
 * §3.4 specifies three memory tiers. The turn buffer shipped in §50. This is
 * the second: *resolved references* from earlier turns — `"John"` -> employeeId,
 * `lastAppointmentId`, `activeCustomer` — so "move it to 4 instead" can find
 * what "it" is.
 *
 * §51 supplied the key this needed (`session_id`, derived rather than demanded
 * from the clients). Two further things were measured before writing it, and
 * both ruled out a shortcut:
 *
 * **The trace table cannot back this store.** It now carries `session_id`, so
 * reading resolved refs back out of `params` looked free. Only **224 of 5,362**
 * rows have non-empty `params` (4.2%), and what they hold is mostly *names*
 * rather than ids — `serviceName` 137 vs `serviceId` 38, `employeeName` 108 vs
 * `employeeId` 36 — because `redactCommandTraceParams` strips internal params
 * and redacts PHI. A store built on that would be empty 96% of the time and
 * hold the wrong half of the mapping the rest.
 *
 * **It must not be built on `AiEntityMemoryService`.** That service is keyed by
 * `businessId` alone and its entries carry `customerName`, so every user of a
 * business shares one map (e2e-bug.371). Layering a *resolved-reference* store
 * on top would turn an alias-sharing bug into an id-sharing one.
 *
 * So this is its own tier, scoped to a conversation by construction, populated
 * at resolution time by the §46 `EntityResolutionService` rather than recovered
 * afterwards.
 */
import { BINDING_MAX_TURNS, BINDING_TTL_MS } from './ai-topic-change.util.js';

/** What kind of thing was resolved. Anaphora resolve within a kind. */
export type EntityRefKind =
  | 'employee'
  | 'service'
  | 'customer'
  | 'appointment'
  | 'category'
  | 'package';

export interface EntityRef {
  kind: EntityRefKind;
  id: string;
  /** Display name, for rendering a clarify or a confirmation. */
  label: string;
  /** Turn this was resolved on, so staleness is measured in turns not just ms. */
  turnIndex: number;
  recordedAt: Date;
}

/**
 * Conversation-scoped. The id is carried on the store itself rather than passed
 * to each lookup, so a store cannot be consulted for the wrong conversation by
 * a caller that simply forgot to pass it.
 */
export interface EntityStore {
  conversationId: string;
  refs: EntityRef[];
}

/**
 * How many refs to keep.
 *
 * Small on purpose. This exists to resolve "it" and "that one", which reach
 * back a turn or two; a long tail of refs adds candidates that make lookups
 * ambiguous without making them more useful.
 */
export const MAX_ENTITY_REFS = 12;

export function createEntityStore(conversationId: string): EntityStore {
  return { conversationId, refs: [] };
}

/**
 * Record a resolution. Newest first.
 *
 * Re-resolving the same entity moves it to the front rather than duplicating
 * it: two copies of one appointment would make a later lookup look ambiguous
 * when it is not.
 */
export function recordResolution(
  store: EntityStore,
  ref: EntityRef,
): EntityStore {
  const withoutDuplicate = store.refs.filter(
    (r) => !(r.kind === ref.kind && r.id === ref.id),
  );
  return {
    conversationId: store.conversationId,
    refs: [ref, ...withoutDuplicate].slice(0, MAX_ENTITY_REFS),
  };
}

export type EntityLookupStatus =
  | 'resolved'
  /** Several equally-recent refs of this kind. Ask, never pick. */
  | 'ambiguous'
  /** Nothing of this kind, or everything of this kind has gone stale. */
  | 'not_found';

export interface EntityLookup {
  status: EntityLookupStatus;
  ref: EntityRef | null;
  /** Tied candidates, so a clarify can offer them. */
  candidates: EntityRef[];
}

export interface LookupOptions {
  now: Date;
  /** Current user-turn number, from §51's `turnIndex`. */
  currentTurn: number;
  /** Restrict to one kind. Omitted means any. */
  kind?: EntityRefKind;
  ttlMs?: number;
  maxTurns?: number;
}

/**
 * True when a ref is too old to bind an anaphor to.
 *
 * Reuses §48's window and turn limit rather than declaring new ones — two
 * definitions of "still the same conversation" that can disagree is exactly the
 * duplication §46 was written about.
 */
export function isRefStale(ref: EntityRef, options: LookupOptions): boolean {
  const ttl = options.ttlMs ?? BINDING_TTL_MS;
  const maxTurns = options.maxTurns ?? BINDING_MAX_TURNS;
  if (options.now.getTime() - ref.recordedAt.getTime() > ttl) return true;
  return options.currentTurn - ref.turnIndex > maxTurns;
}

/**
 * Find what a reference points at.
 *
 * Recency decides, but only among refs resolved on the *same* turn is a tie
 * possible: if the user named two services last turn, "it" genuinely could be
 * either and §7 working agreement 5 says ask. A ref from an earlier turn does
 * not tie with a more recent one — the more recent one is what "it" means.
 */
export function lookupEntity(
  store: EntityStore,
  options: LookupOptions,
): EntityLookup {
  const live = store.refs.filter(
    (r) =>
      (!options.kind || r.kind === options.kind) && !isRefStale(r, options),
  );

  if (live.length === 0) {
    return { status: 'not_found', ref: null, candidates: [] };
  }

  const newestTurn = Math.max(...live.map((r) => r.turnIndex));
  const newest = live.filter((r) => r.turnIndex === newestTurn);

  if (newest.length > 1) {
    return { status: 'ambiguous', ref: null, candidates: newest };
  }
  return { status: 'resolved', ref: newest[0], candidates: newest };
}

/**
 * Drop everything — §48 decided the subject changed.
 *
 * Returns an empty store for the same conversation rather than a null, so a
 * caller cannot accidentally carry the old refs forward by treating "cleared"
 * as "unchanged".
 */
export function clearEntityStore(store: EntityStore): EntityStore {
  return { conversationId: store.conversationId, refs: [] };
}

/**
 * Expire stale refs without clearing the store.
 *
 * Distinct from `clearEntityStore`: a topic change invalidates everything, but
 * ordinary ageing should only remove what has actually aged out.
 */
export function pruneEntityStore(
  store: EntityStore,
  options: LookupOptions,
): EntityStore {
  return {
    conversationId: store.conversationId,
    refs: store.refs.filter((r) => !isRefStale(r, options)),
  };
}
