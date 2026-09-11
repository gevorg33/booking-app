/**
 * AI-ROADMAP §4 / §5 — narrowing the planner shortlist to the size it was
 * designed for.
 *
 * §5 specifies "a precise registry with a **10–15 command shortlist**". §71
 * measured the actual shortlist at **388** commands on dashboard/owner — a
 * ~16,700-token prompt — because `buildPlannerShortlist` filters by surface and
 * permission (§4 guardrail 1) and nothing narrows further.
 *
 * The consequence is e2e-bug.381: the planner returns an empty plan for ~72% of
 * real prompts, and 11 of 12 of those carry an `unresolved` note. The model is
 * following its instructions — "do not substitute a similar command, say you
 * could not map it" — against a list it cannot search.
 *
 * This is the missing step. It ranks the *already permitted* commands by
 * similarity to the message and keeps the top N.
 *
 * ## Two invariants, both non-negotiable
 *
 * **1. Narrowing can only ever remove.** The input is whatever
 * `specsForActor` returned; a command the actor may not run cannot appear in
 * the output, because it was never in the input. §4 guardrail 1 is upstream of
 * this and stays upstream.
 *
 * **2. Losing the right command is worse than keeping a wrong one.** A shortlist
 * that excludes the correct command converts "empty plan" into "wrong plan or
 * still empty" — and §4 exists to remove wrong commands. So the floor is
 * generous, ties are kept rather than cut, and an absent or unusable embedding
 * degrades to the full list rather than to a guess.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { EmbeddingIndex } from './ai-embedding-index.util.js';
import type { CommandSpec, CommandSurface } from './ai-command-spec.types.js';
import type { AccessTier } from './access-control.matrix.js';
import { specsForActor } from './ai-command-spec.derive.js';

/**
 * The embedding model and width the cache and the runtime query must share.
 *
 * 256 rather than the default 1,536: at full width the 696-vector cache is a
 * ~10MB checked-in file, and 256 is ample for ranking a few hundred short
 * texts. Declared here so both sides read one value — a mismatch makes every
 * cosine meaningless while still returning plausible-looking numbers.
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 256;

/** §5's range. The planner prompt is built for a list this size. */
export const SHORTLIST_TARGET_MIN = 10;
export const SHORTLIST_TARGET_MAX = 15;

/**
 * The text a command is matched on.
 *
 * Description plus examples, because that is exactly what the shortlist shows
 * the model — matching on anything else would rank by one thing and present
 * another.
 */
export function commandMatchText(spec: CommandSpec): string {
  return [spec.description, ...spec.examples].join(' \n');
}

/**
 * Fingerprint of every text the cache is built from.
 *
 * e2e-bug.390 — the cache is a checked-in file and nothing tied it to the specs
 * it was generated from, so editing a description or an example silently left
 * the old vector in place. That is not a hypothetical: §82 added the real
 * Armenian phrasings to four specs, never rebuilt, measured a seven-point drop,
 * and reverted a change that §86 later showed takes retrieval from 64% to 98%.
 *
 * A stale cache fails in the worst available way — quietly, with plausible
 * numbers, in the direction that argues against the fix. This turns that into a
 * named test failure.
 */
export function commandMatchTextHash(
  specs: readonly CommandSpec[] = [],
): string {
  const joined = [...specs]
    .map((s) => `${s.id}\u0000${commandMatchText(s)}`)
    .sort()
    .join('\u0001');
  return createHash('sha256').update(joined).digest('hex').slice(0, 32);
}

/**
 * Words too common to identify a command. Deliberately short.
 *
 * Every entry here is a word that appears in so many descriptions that matching
 * it says nothing. Kept minimal because over-pruning is the failure mode: drop
 * "package" and `catalog.list_packages` loses the one token that identifies it.
 */
const LEXICAL_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'do',
  'does',
  'for',
  'from',
  'has',
  'have',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'the',
  'their',
  'them',
  'they',
  'this',
  'to',
  'up',
  'was',
  'what',
  'when',
  'which',
  'who',
  'will',
  'with',
  'you',
  'your',
]);

function lexicalTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 2 && !LEXICAL_STOPWORDS.has(t)),
  );
}

/**
 * How much of a command's *identity* the message says out loud.
 *
 * §96 found example-mining had hit its ceiling: 29 commands still miss the
 * shortlist, each worth one or two prompts, with no concentration left to
 * exploit. What that long tail does have is a name — "packages", "promo code",
 * "employee", "currency" — appearing near-verbatim in the prompt, which is
 * exactly the signal a 256-dimension embedding averages away.
 *
 * Scored against the command id and description rather than its examples: the
 * id and description are what the command *is*, while examples are phrasings of
 * how one user asked, and including them would let a single well-worded example
 * dominate the identity of the command it belongs to.
 *
 * Returns coverage of the command's identity terms by the message, in [0, 1].
 * A message mentioning none of them scores 0 and is left entirely to the
 * embedding — which is the case for every non-Latin prompt, and why this can
 * only ever be a bonus (see `narrowShortlist`).
 */
export function lexicalIdentityScore(
  prompt: string,
  spec: CommandSpec,
): number {
  const identity = lexicalTokens(
    `${spec.id.replace(/[._]/g, ' ')} ${spec.description}`,
  );
  if (identity.size === 0) return 0;
  const words = lexicalTokens(prompt);
  if (words.size === 0) return 0;
  let hit = 0;
  for (const t of identity) if (words.has(t)) hit += 1;
  return hit / identity.size;
}

/**
 * Weight of the lexical bonus relative to cosine similarity.
 *
 * Additive rather than multiplicative, so a command the message shares no words
 * with keeps its cosine untouched. That is the property that makes this safe for
 * the Armenian and Russian traffic §48 documented, where lexical overlap with an
 * English description is always zero.
 *
 * Swept over the 121 rescue-dependent prompts:
 *
 * | weight | truth in shortlist | gained | lost |
 * |---|---|---|---|
 * | 0 (cosine only) | 73/121 | — | — |
 * | 0.1 | 75 | | |
 * | **0.25** | **76** | **+3** | **0** |
 * | 0.5 | 77 | +5 | **1** |
 * | 0.75 | 77 | | |
 * | 1.0 | 76 | | |
 * | 1.5 | 75 | | |
 *
 * **0.25 rather than the higher-scoring 0.5.** 0.5 finds one more command on
 * net, and does it by breaking one prompt that previously worked. This file's
 * second invariant is that losing the right command is worse than keeping a
 * wrong one, and a strictly monotone improvement is worth more than one point
 * of net gain bought with a regression — especially when the regression would
 * be invisible in the aggregate.
 *
 * Past 1.0 the curve falls: a keyword collision starts outranking a genuine
 * semantic match.
 */
export const LEXICAL_BONUS_WEIGHT = 0.25;

/**
 * Narrow only when retrieval is confident — e2e-bug.402.
 *
 * §116 measured narrowing helping one population and hurting another, and a
 * single global flag cannot serve both. The runtime signal that separates them
 * is the top-ranked score, and it separates them cleanly. On 197 real prompts:
 *
 * | top score | truth still in the top 15 |
 * |---|---|
 * | 0.0–0.4 | 48% (n=123) |
 * | 0.4–0.5 | 88% (n=33) |
 * | **0.5–0.6** | **100%** (n=23) |
 * | **0.6+** | **100%** (n=18) |
 *
 * At 0.5 the cut never lost the right command on this sample; below 0.4 it loses
 * it half the time. The margin between top-1 and top-15 was tried as well and is
 * much weaker (50% → 88% across its whole range), so score it is.
 *
 * 0.5 rather than 0.4 because this module's second invariant is that losing the
 * right command is worse than keeping a wrong one: 0.4 narrows more prompts (38%
 * vs 21%) at 95% retention, and the extra coverage is not worth a 1-in-20 chance
 * of cutting the answer.
 */
export const NARROW_MIN_TOP_SCORE = 0.5;

/** Build the per-command index. One entry per spec, keyed by command id. */
export function buildCommandIndex(
  specs: readonly CommandSpec[],
  embeddings: ReadonlyMap<string, number[]> = new Map(),
): EmbeddingIndex<{ id: string }> {
  const index = new EmbeddingIndex<{ id: string }>();
  for (const spec of specs) {
    index.register({
      id: spec.id,
      text: commandMatchText(spec),
      embedding: embeddings.get(spec.id),
      metadata: { id: spec.id },
    });
  }
  return index;
}

export interface NarrowOptions {
  limit?: number;
  /**
   * Commands always kept regardless of score.
   *
   * For the §53 entity store and §49 anaphora: if the conversation is about an
   * appointment, appointment commands must stay reachable even when the current
   * message scores badly on its own ("make it 4pm" resembles nothing).
   */
  pinned?: readonly string[];
  /**
   * The raw message, for the lexical half of the ranking.
   *
   * Optional: without it ranking is pure cosine, exactly as before. Every
   * caller that omits it gets the previous behaviour rather than a degraded
   * version of the new one.
   */
  message?: string;
  /** Test seam for tuning; defaults to `LEXICAL_BONUS_WEIGHT`. */
  lexicalWeight?: number;
  /** Test seam; defaults to `NARROW_MIN_TOP_SCORE`. */
  minTopScore?: number;
}

export interface NarrowResult {
  specs: CommandSpec[];
  /** Why the result is what it is, for the trace. */
  reason:
    | 'narrowed'
    | 'no_embeddings'
    | 'already_small'
    /** Retrieval was not confident enough to cut safely — see the threshold. */
    | 'low_confidence';
  /** Size before narrowing, so the reduction is measurable. */
  candidateCount: number;
}

/**
 * Narrow the permitted commands to the top N for this message.
 *
 * Returns the full candidate list unchanged when it cannot rank — no query
 * embedding, or no command embeddings loaded. A degraded ranking would silently
 * hide commands, and today's behaviour (everything, badly) is safer than a
 * confident subset built from nothing.
 */
export function narrowShortlist(
  specs: readonly CommandSpec[],
  surface: CommandSurface,
  tier: AccessTier,
  queryEmbedding: readonly number[] | null,
  index: EmbeddingIndex<{ id: string }>,
  options: NarrowOptions = {},
): NarrowResult {
  // Permission first, always. This function narrows; it never widens.
  const permitted = specsForActor(specs, surface, tier);
  const limit = options.limit ?? SHORTLIST_TARGET_MAX;

  if (permitted.length <= limit) {
    return {
      specs: [...permitted],
      reason: 'already_small',
      candidateCount: permitted.length,
    };
  }
  if (!queryEmbedding?.length || index.embeddedCount() === 0) {
    return {
      specs: [...permitted],
      reason: 'no_embeddings',
      candidateCount: permitted.length,
    };
  }

  const permittedIds = new Set(permitted.map((s) => s.id));
  const pinned = new Set(
    (options.pinned ?? []).filter((id) => permittedIds.has(id)),
  );

  // Score every candidate, not just the top N: the lexical bonus can promote a
  // command the cosine ranking would have cut, so the combination has to happen
  // before the list is truncated.
  const hits = index.searchByEmbedding([...queryEmbedding], {
    filter: (entry) => permittedIds.has(entry.id) && !pinned.has(entry.id),
    limit: Number.MAX_SAFE_INTEGER,
  });

  const specById = new Map(permitted.map((s) => [s.id, s]));
  const message = options.message ?? '';
  const ranked = message
    ? hits
        .map((h) => {
          const spec = specById.get(h.id);
          return {
            id: h.id,
            score:
              h.score +
              (spec
                ? (options.lexicalWeight ?? LEXICAL_BONUS_WEIGHT) *
                  lexicalIdentityScore(message, spec)
                : 0),
          };
        })
        .sort((a, b) => b.score - a.score)
    : hits;

  // e2e-bug.402 — refuse to cut when retrieval is not confident. A low top score
  // means the ranking has not found anything it recognises, and cutting to 15 on
  // that basis loses the right command about half the time. Falling back to the
  // full permitted list is exactly today's un-narrowed behaviour, so the failure
  // mode of this gate is the status quo rather than a guess.
  const minTop = options.minTopScore ?? NARROW_MIN_TOP_SCORE;
  if (pinned.size === 0 && (ranked[0]?.score ?? 0) < minTop) {
    return {
      specs: [...permitted],
      reason: 'low_confidence',
      candidateCount: permitted.length,
    };
  }

  const keep = new Set<string>([
    ...pinned,
    ...ranked.slice(0, Math.max(0, limit - pinned.size)).map((h) => h.id),
  ]);
  return {
    // Preserve the caller's ordering rather than similarity order: the prompt
    // lists commands, and reordering them per message would make the planner's
    // input unstable across otherwise-identical requests (e2e-bug.152's class).
    specs: permitted.filter((s) => keep.has(s.id)),
    reason: 'narrowed',
    candidateCount: permitted.length,
  };
}

/**
 * Load the committed command vectors.
 *
 * Read once and memoised: the file is 1.5MB and does not change at runtime.
 * A missing or malformed cache returns an empty index, which `narrowShortlist`
 * treats as `no_embeddings` and answers with the full list — the degradation is
 * already the safe one, so this does not throw.
 */
let cachedIndex: EmbeddingIndex<{ id: string }> | null = null;

export function loadCommandIndex(
  specs: readonly CommandSpec[],
): EmbeddingIndex<{ id: string }> {
  if (cachedIndex) return cachedIndex;
  let vectors: Record<string, number[]> = {};
  try {
    const raw = fs.readFileSync(
      path.join(__dirname, 'ai-command-embeddings.json'),
      'utf8',
    );
    const parsed = JSON.parse(raw) as {
      dimensions?: number;
      vectors?: Record<string, number[]>;
    };
    // A cache built at a different width would produce meaningless cosines
    // against a query embedded at EMBEDDING_DIMENSIONS. Refuse it rather than
    // rank on nonsense.
    if (parsed.dimensions === EMBEDDING_DIMENSIONS) {
      vectors = parsed.vectors ?? {};
    }
  } catch {
    vectors = {};
  }
  cachedIndex = buildCommandIndex(specs, new Map(Object.entries(vectors)));
  return cachedIndex;
}

/** Test seam — drops the memoised index. */
export function resetCommandIndexCache(): void {
  cachedIndex = null;
}
