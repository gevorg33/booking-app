/**
 * AI-ROADMAP Phase 4 — one entity resolver, with confidence.
 *
 * Today at least four independent paths turn a name into an entity, and they do
 * not agree with each other:
 *
 *   - `fuzzyMatchByName` (ai-orchestration.helpers) — a five-tier cascade that
 *     returns the FIRST match at the first tier that hits;
 *   - `matchEmployeesInPrompt` — longest-name-first scan of the whole prompt;
 *   - `resolveServicesByCategoryName` / `resolveServicesForEmployeeAssignment`
 *     — their own category-aware variants;
 *   - per-handler ad-hoc `.find(...)` calls.
 *
 * Two problems, both of which this fixes by construction:
 *
 * **1. No confidence.** `fuzzyMatchByName` returns `T | undefined`. A caller
 * cannot tell an exact match from `lower.includes(item.name)` — the tier where
 * a prompt mentioning "Jo" matches an employee literally named "Jo" inside
 * "Johanna". Both come back as a bare object, so every caller treats a guess as
 * a fact.
 *
 * **2. Silent picks on ties.** `items.find(...)` returns the first array
 * element. With two customers named "John", the resolution depends on database
 * ordering, and the user is never asked. §7 forbids exactly this: "Below-
 * threshold entity resolution clarifies; it never guesses."
 *
 * So this returns a *verdict*, not an entity: resolved, ambiguous, or not
 * found — with the score that produced it and the alternatives that tied.
 */

/** Anything with a stable id and a display name. */
export interface EntityCandidate {
  id: string;
  name: string;
}

/**
 * How a candidate matched, strongest first. The score attached to each is what
 * lets a caller apply a threshold instead of trusting every match equally.
 */
export type MatchTier =
  /** Identical after normalisation. */
  | 'exact'
  /** Query is one whole word of the name: "John" → "John Smith". */
  | 'full_token'
  /** A name word starts with the query: "Jo" → "Johanna". */
  | 'prefix'
  /** The name contains the query somewhere: "smith" → "John Smithson". */
  | 'contains'
  /**
   * The *query* contains the name — "book John Smith" matching an employee
   * called "Jo". Scored below the default threshold on purpose: it is the tier
   * that produces confident-looking nonsense.
   */
  | 'query_contains';

export const TIER_CONFIDENCE: Readonly<Record<MatchTier, number>> = {
  exact: 1,
  full_token: 0.9,
  prefix: 0.72,
  contains: 0.55,
  query_contains: 0.35,
};

/** Below this, resolution clarifies rather than picking (§7 working agreement 5). */
export const DEFAULT_RESOLUTION_THRESHOLD = 0.7;

export type ResolutionStatus =
  | 'resolved'
  /** Two or more candidates matched equally well. Never pick one. */
  | 'ambiguous'
  /** Nothing matched, or the best match was below the threshold. */
  | 'not_found';

export interface ResolutionResult<T extends EntityCandidate> {
  status: ResolutionStatus;
  /** Set only when `status === 'resolved'`. */
  match: T | null;
  confidence: number;
  tier: MatchTier | null;
  /** Candidates that tied at the winning tier, including the winner. */
  candidates: T[];
  /** What to ask the user. Null when resolved. */
  clarification: string | null;
}

/**
 * Lowercase, strip punctuation, collapse whitespace.
 *
 * Deliberately does NOT strip accents: "Renée" and "Renee" are plausibly two
 * different people, and silently merging them is the same class of error as a
 * silent pick.
 */
export function normalizeEntityName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tierFor(candidateName: string, query: string): MatchTier | null {
  const name = normalizeEntityName(candidateName);
  const q = normalizeEntityName(query);
  if (!name || !q) return null;

  if (name === q) return 'exact';

  const tokens = name.split(' ');
  if (tokens.includes(q)) return 'full_token';
  if (tokens.some((t) => t.startsWith(q))) return 'prefix';
  if (name.includes(q)) return 'contains';
  if (q.includes(name)) return 'query_contains';
  return null;
}

export interface ResolveEntityOptions {
  /** Minimum confidence to return `resolved`. */
  threshold?: number;
  /** Noun used in the clarify question ("customer", "service", "provider"). */
  entityLabel?: string;
}

/**
 * Resolve one name against a candidate list.
 *
 * Ambiguity is checked *before* the threshold: two exact matches are maximally
 * confident and still unusable, so confidence alone can never be the whole
 * gate. That ordering is the difference between "I am sure it is one of these
 * two" and "I am sure it is this one".
 */
export function resolveEntity<T extends EntityCandidate>(
  candidates: readonly T[],
  query: string,
  options: ResolveEntityOptions = {},
): ResolutionResult<T> {
  const threshold = options.threshold ?? DEFAULT_RESOLUTION_THRESHOLD;
  const label = options.entityLabel ?? 'one';

  const scored = candidates
    .map((candidate) => ({ candidate, tier: tierFor(candidate.name, query) }))
    .filter((s): s is { candidate: T; tier: MatchTier } => s.tier !== null);

  if (scored.length === 0) {
    return {
      status: 'not_found',
      match: null,
      confidence: 0,
      tier: null,
      candidates: [],
      clarification: `I couldn't find a ${label} matching "${query.trim()}".`,
    };
  }

  let best: MatchTier = scored[0].tier;
  for (const s of scored) {
    if (TIER_CONFIDENCE[s.tier] > TIER_CONFIDENCE[best]) best = s.tier;
  }
  const confidence = TIER_CONFIDENCE[best];
  const winners = scored.filter((s) => s.tier === best).map((s) => s.candidate);

  // De-duplicate by id: the same entity listed twice is not an ambiguity.
  const distinct: T[] = [];
  const seen = new Set<string>();
  for (const w of winners) {
    if (seen.has(w.id)) continue;
    seen.add(w.id);
    distinct.push(w);
  }

  if (distinct.length > 1) {
    const names = distinct.map((c) => c.name);
    return {
      status: 'ambiguous',
      match: null,
      confidence,
      tier: best,
      candidates: distinct,
      clarification: `Which ${label} did you mean — ${names.slice(0, 3).join(', ')}${names.length > 3 ? ', …' : ''}?`,
    };
  }

  if (confidence < threshold) {
    return {
      status: 'not_found',
      match: null,
      confidence,
      tier: best,
      candidates: distinct,
      clarification: `Did you mean ${distinct[0].name}?`,
    };
  }

  return {
    status: 'resolved',
    match: distinct[0],
    confidence,
    tier: best,
    candidates: distinct,
    clarification: null,
  };
}

/**
 * Resolve several names at once, reporting per-name verdicts.
 *
 * Returns the resolved entities *and* the unresolved queries rather than
 * silently dropping misses — `resolveEmployees` currently drops any name it
 * cannot match, so "cancel for John and Mary" with an unknown Mary quietly
 * becomes "cancel for John".
 */
export function resolveEntities<T extends EntityCandidate>(
  candidates: readonly T[],
  queries: readonly string[],
  options: ResolveEntityOptions = {},
): {
  resolved: T[];
  unresolved: { query: string; result: ResolutionResult<T> }[];
} {
  const resolved: T[] = [];
  const unresolved: { query: string; result: ResolutionResult<T> }[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const result = resolveEntity(candidates, query, options);
    if (result.status === 'resolved' && result.match) {
      if (!seen.has(result.match.id)) {
        seen.add(result.match.id);
        resolved.push(result.match);
      }
      continue;
    }
    unresolved.push({ query, result });
  }

  return { resolved, unresolved };
}
