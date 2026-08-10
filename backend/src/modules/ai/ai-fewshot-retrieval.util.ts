/**
 * AI-ROADMAP Phase 3 / Phase 9 — few-shot retrieval from *labelled* traces.
 *
 * §50 established this was never blocked on pgvector: §5's decision is
 * "in-memory cosine now", and `EmbeddingIndex` already implements it. What was
 * missing is the part the roadmap's wording quietly carries — **labelled**.
 *
 * ## Executed is not labelled, and the gap is 32%
 *
 * The obvious source is the trace table: 3,433 executed rows, each pairing a
 * prompt with the action that ran. Joining those against the eval baseline's
 * per-intent accuracy says what that would actually teach:
 *
 * | executed traces by intent | rows | share |
 * |---|---|---|
 * | intent scores >=90% in eval | 2,342 | 68.2% |
 * | intent scores <90% in eval | 238 | 6.9% |
 * | intent **absent from eval entirely** | 853 | 24.8% |
 *
 * Nearly a third are unsafe or unverifiable. The single worst case is
 * `compound_intent`: **139 executed traces at 0% eval accuracy**. Those rows
 * record a command that ran, not a command that was right, and feeding them
 * back as few-shots would entrench the worst-performing capability on the
 * platform using its own failures as evidence.
 *
 * A trace's `outcome` describes whether the handler returned success. It says
 * nothing about whether the *right* handler was chosen. Few-shot examples are
 * training signal, and training signal has to be verified.
 *
 * ## So the pool is verified sources only
 *
 * - **spec examples** — hand-written in the registry;
 * - **eval goldens** — the corpus's expected answers. Correct even for the 12
 *   intents currently scoring 0%: there the *system* is wrong, the golden is
 *   the truth;
 * - **confirmed misses** — §44's human-triaged `expectedAction`.
 *
 * Raw traces are excluded by construction: there is no code path here that
 * accepts one.
 */
import { EmbeddingIndex } from './ai-embedding-index.util.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { CommandSpec, CommandSurface } from './ai-command-spec.types.js';
import type { MissFixtures } from './ai-miss-to-fixture.util.js';

/** Where an example's label came from. Every value is human-verified. */
export type FewShotSource = 'spec_example' | 'eval_golden' | 'confirmed_miss';

export interface FewShotExample {
  id: string;
  prompt: string;
  /** The command this prompt should reach. */
  action: string;
  /** Null means the example is surface-agnostic. */
  surface: CommandSurface | null;
  source: FewShotSource;
}

/** Examples from the registry — the most trustworthy source. */
export function fewShotsFromSpecs(
  specs: readonly CommandSpec[],
): FewShotExample[] {
  const out: FewShotExample[] = [];
  for (const spec of specs) {
    spec.examples.forEach((prompt, i) => {
      out.push({
        id: `spec:${spec.id}:${i}`,
        prompt,
        action: spec.id,
        // A spec example is valid on every surface the command is offered on.
        // Left null rather than duplicated per surface: duplicates would let
        // one command occupy several few-shot slots (see the per-action cap).
        surface: spec.surfaces.length === 1 ? spec.surfaces[0] : null,
        source: 'spec_example',
      });
    });
  }
  return out;
}

/**
 * Examples from the eval corpus.
 *
 * Only cases that assert an `action`. A case pinning parameter extraction says
 * nothing about which command a phrasing should reach, and showing it as a
 * routing example would be teaching the wrong lesson.
 */
export function fewShotsFromEvalCases(
  cases: readonly AiCommandEvalCase[],
): FewShotExample[] {
  const out: FewShotExample[] = [];
  for (const c of cases) {
    const action = c.expect?.action;
    if (typeof action !== 'string' || !action) continue;
    out.push({
      id: `eval:${c.id}`,
      prompt: c.prompt,
      action,
      surface: c.surface ?? null,
      source: 'eval_golden',
    });
  }
  return out;
}

/** Examples from §44's confirmed misses — the highest-value ones. */
export function fewShotsFromMisses(
  fixtures: readonly MissFixtures[],
): FewShotExample[] {
  return fixtures
    .filter((f) => typeof f.evalCase.expect?.action === 'string')
    .map((f) => ({
      id: `miss:${f.evalCase.id}`,
      prompt: f.example,
      action: f.evalCase.expect.action as string,
      surface: f.evalCase.surface ?? null,
      source: 'confirmed_miss' as const,
    }));
}

/**
 * Assemble the pool, dropping duplicate prompts.
 *
 * Later sources do not override earlier ones, so ordering is the precedence:
 * spec examples first, then eval goldens, then confirmed misses. A prompt that
 * appears twice would otherwise occupy two retrieval slots and crowd out a
 * different command.
 */
export function buildFewShotPool(
  parts: readonly FewShotExample[][],
): FewShotExample[] {
  const seen = new Set<string>();
  const out: FewShotExample[] = [];
  for (const part of parts) {
    for (const example of part) {
      const key = example.prompt.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(example);
    }
  }
  return out;
}

export type FewShotMeta = Omit<FewShotExample, 'id' | 'prompt'>;

/**
 * Load the pool into the existing cosine index.
 *
 * Reuses `EmbeddingIndex` rather than adding a second similarity path — §46
 * spent a section on what happens when two of those coexist. Embeddings are
 * supplied by the caller because the corpus is trilingual (§48): lexical
 * overlap scores a message and its own translation at 0.00, so a lexical
 * fallback here would silently retrieve nothing useful for Armenian or Russian
 * prompts.
 */
export function buildFewShotIndex(
  pool: readonly FewShotExample[],
  embeddings: ReadonlyMap<string, number[]> = new Map(),
): EmbeddingIndex<FewShotMeta> {
  const index = new EmbeddingIndex<FewShotMeta>();
  for (const example of pool) {
    index.register({
      id: example.id,
      text: example.prompt,
      embedding: embeddings.get(example.id),
      metadata: {
        action: example.action,
        surface: example.surface,
        source: example.source,
      },
    });
  }
  return index;
}

export interface SelectFewShotsOptions {
  /** Surface of the request. Examples for other surfaces are excluded. */
  surface: CommandSurface;
  limit?: number;
  /**
   * Most examples any one command may contribute.
   *
   * Without a cap, a command with 40 eval cases wins every slot for any
   * remotely similar prompt, and the planner sees one plausible answer repeated
   * rather than a set to choose between. That is how few-shots turn into a
   * steal mechanism (§4).
   */
  maxPerAction?: number;
  minScore?: number;
  /** When given, only these commands' examples are eligible (§4 guardrail 1). */
  shortlist?: readonly string[];
}

export const DEFAULT_FEWSHOT_LIMIT = 8;
export const DEFAULT_MAX_PER_ACTION = 2;

export interface SelectedFewShot extends FewShotExample {
  score: number;
}

/**
 * Retrieve examples for a prompt.
 *
 * Surface filtering happens *before* scoring, not after: a customer cart
 * example is not a weak match on a dashboard request, it is ineligible, and
 * scoring it first then dropping it would let it consume a slot.
 */
export function selectFewShots(
  index: EmbeddingIndex<FewShotMeta>,
  queryEmbedding: readonly number[],
  options: SelectFewShotsOptions,
): SelectedFewShot[] {
  const limit = options.limit ?? DEFAULT_FEWSHOT_LIMIT;
  const maxPerAction = options.maxPerAction ?? DEFAULT_MAX_PER_ACTION;
  const shortlist = options.shortlist ? new Set(options.shortlist) : null;

  const hits = index.searchByEmbedding([...queryEmbedding], {
    minScore: options.minScore,
    filter: (entry) => {
      const meta = entry.metadata;
      if (!meta) return false;
      // null surface = valid anywhere.
      if (meta.surface !== null && meta.surface !== options.surface) {
        return false;
      }
      if (shortlist && !shortlist.has(meta.action)) return false;
      return true;
    },
  });

  const perAction = new Map<string, number>();
  const selected: SelectedFewShot[] = [];
  for (const hit of hits) {
    if (selected.length >= limit) break;
    const meta = hit.metadata;
    if (!meta) continue;
    const used = perAction.get(meta.action) ?? 0;
    if (used >= maxPerAction) continue;
    perAction.set(meta.action, used + 1);
    selected.push({
      id: hit.id,
      prompt: hit.text,
      action: meta.action,
      surface: meta.surface,
      source: meta.source,
      score: hit.score,
    });
  }
  return selected;
}

/**
 * Render selected examples for a prompt.
 *
 * Kept next to the selection so the format cannot drift from what was chosen.
 */
export function renderFewShots(examples: readonly SelectedFewShot[]): string {
  if (examples.length === 0) return '';
  const lines = examples.map((e) => `- "${e.prompt}" -> ${e.action}`);
  return `Examples of similar requests and the command they map to:\n${lines.join('\n')}`;
}
