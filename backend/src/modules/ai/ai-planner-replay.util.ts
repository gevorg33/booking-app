/**
 * e2e-bug.407 — the shared parts of a planner replay.
 *
 * §115, §116, §119, §120 and §130 each needed to replay stored prompts through
 * the planner and each rebuilt the machinery as a throwaway. Every rebuild can
 * silently differ — a different model, temperature, tier rule or truth column
 * changes the number without changing its name — and §130's figures are only
 * known to line up with §119's because the baseline happened to reproduce 30.6%.
 * That was luck.
 *
 * What lives here is the part that must not drift between measurements. The
 * reporting stays in the callers, because what a run is *asking* differs and
 * pretending otherwise would produce a worse abstraction than the duplication.
 */
import type OpenAI from 'openai';
import type { AccessTier } from './access-control.matrix.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  loadCommandIndex,
  narrowShortlist,
} from './ai-command-shortlist.util.js';
import { buildPlannerMessages } from './ai-command-plan.prompt.js';
import { decodePlanResponse } from './ai-command-plan.decode.js';
import { validatePlan } from './ai-command-plan.validate.js';
import { decidePlannerRoute } from './ai-planner-route.util.js';

/**
 * The rescue-dependent corpus — prompts whose action the detectors *changed*.
 *
 * This is the population Phase 8 is about: the traffic that loses its routing if
 * the detectors are deleted. 121 distinct prompts / 216 traces as of 2026-08-03,
 * when traffic stopped.
 *
 * `truth` is the post-rescue action — what the platform concluded the user
 * meant. The tie-break is `order by action` rather than anything positional, so
 * two runs cannot silently disagree about the target.
 */
export const RESCUE_CORPUS_SQL = `
  select prompt_raw as prompt,
         min(surface) as surface,
         min(role) as role,
         (array_agg(action order by action))[1] as truth,
         count(*)::int as traces
  from ai_command_trace
  where action_changed_by = 'rescue'
  group by prompt_raw
  order by count(*) desc
`;

export type ReplayRow = {
  prompt: string;
  surface: string;
  role: string | null;
  truth: string;
  traces: number;
};

export type ReplayOutcome = {
  prompt: string;
  truth: string;
  traces: number;
  /** `OK` | `wrong` | `reject:<reason>(<problem codes>)` | `no_response` | … */
  verdict: string;
  routedAction?: string;
  shortlistSize: number;
  /**
   * Did the shortlist still CONTAIN the command the trace recorded?
   *
   * e2e-bug.409 — carried over from `ai-planner-shadow-replay.spec.ts`, which
   * measured this and the shared util did not. It is the number that separates
   * "the model chose wrong" from "retrieval never showed it the command", which
   * is the whole question A5 asks; migrating the spec onto this util without it
   * would have silently dropped the more informative half of the harness.
   */
  truthInShortlist: boolean;
};

/**
 * The access tier a replayed row should be planned under.
 *
 * **Surface decides, not `role`.** The trace's `role` is the business role
 * profile, not the surface access tier: the gateway derives the tier as
 * `resolveAccessTier(membershipRole ?? role)` and `membershipRole` is not
 * stored, so a customer-surface request from a business owner records `owner`
 * while being gated as `client`.
 *
 * This mattered once already. `isSpecAllowedForTier` is exact membership, not
 * hierarchical, so passing `owner` on the customer surface permits only the ~7
 * commands that literally list it — which made a narrowed run look like
 * narrowing had not helped when the tier was simply wrong.
 */
export function replayAccessTier(
  surface: string,
  role: string | null | undefined,
): AccessTier {
  if (surface === 'customer' || surface === 'public') return 'client';
  return (role as AccessTier) ?? 'owner';
}

export type ReplayConfig = {
  openai: OpenAI;
  specs: readonly CommandSpec[];
  index: ReturnType<typeof loadCommandIndex>;
  /** Domains `decidePlannerRoute` may route. Pass every domain to measure capability. */
  enabledDomains: Set<string>;
  /** Pin to the last day of traffic so date resolution cannot drift between runs. */
  today: string;
  timeZone?: string;
  model?: string;
  temperature?: number;
  /**
   * Skip retrieval entirely and show the full permitted catalogue — e2e-bug.417.
   *
   * The embedding index is built from `description + examples`, so measuring a
   * command's own documented example against it asks whether retrieval can find
   * a string it indexed. Turning narrowing off removes retrieval from the
   * question instead of trying to correct for it.
   */
  skipNarrowing?: boolean;
  /**
   * Rewrite the specs this row's prompt is rendered from — e2e-bug.417.
   *
   * Used to hold a command's own example out of its shortlist entry, so the
   * model is not shown the exact phrasing it is being asked to match. Applies to
   * the prompt only; permission and validation still use `specs`.
   */
  promptSpecsFor?: (
    row: ReplayRow,
    permitted: readonly CommandSpec[],
  ) => readonly CommandSpec[];
};

/**
 * Replay one prompt through the same pieces `AiCommandPlannerService.plan` uses.
 *
 * Calls OpenAI directly rather than constructing the service: the service needs
 * four injected dependencies including a TypeORM repository, which is a great
 * deal of scaffolding for a harness that only needs the prompt and the decoder.
 * The pure stages — narrow, build, decode, validate, route — are the real ones.
 */
export async function replayPrompt(
  config: ReplayConfig,
  row: ReplayRow,
): Promise<ReplayOutcome> {
  const surface = row.surface as CommandSurface;
  const tier = replayAccessTier(row.surface, row.role);
  const base = { prompt: row.prompt, truth: row.truth, traces: row.traces };

  // An embedding failure is not fatal in production either — `narrowShortlist`
  // falls back to the full permitted list, which is the un-narrowed behaviour.
  let embedding: number[] | null = null;
  try {
    if (config.skipNarrowing) throw new Error('narrowing disabled');
    const embedded = await config.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: row.prompt,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    embedding = embedded.data[0]?.embedding ?? null;
  } catch {
    embedding = null;
  }

  const narrowed = narrowShortlist(
    config.specs,
    surface,
    tier,
    embedding,
    config.index,
    { message: row.prompt },
  );
  const promptSpecs = config.promptSpecsFor
    ? config.promptSpecsFor(row, narrowed.specs)
    : narrowed.specs;
  const shortlistSize = promptSpecs.length;
  // Measured against the NARROWED list, not the rendered one: the question is
  // whether retrieval found the command, and `promptSpecsFor` deliberately
  // rewrites what the model is shown (e2e-bug.417 holds a command's own example
  // out of its entry), which would otherwise mask a retrieval miss.
  const truthInShortlist = narrowed.specs.some(
    (sp) => sp.id === row.truth || sp.aliases.includes(row.truth),
  );

  let raw: string | null = null;
  try {
    const completion = await config.openai.chat.completions.create({
      model: config.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: buildPlannerMessages(
        promptSpecs,
        surface,
        tier,
        { today: config.today, timeZone: config.timeZone ?? 'Asia/Yerevan' },
        row.prompt,
      ),
      response_format: { type: 'json_object' },
      temperature: config.temperature ?? 0.1,
      max_tokens: 1200,
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 40) : '?';
    return {
      ...base,
      verdict: `api_error:${message}`,
      shortlistSize,
      truthInShortlist,
    };
  }

  if (!raw)
    return { ...base, verdict: 'no_response', shortlistSize, truthInShortlist };

  const decoded = decodePlanResponse(raw);
  if (!decoded.ok)
    return {
      ...base,
      verdict: `undecodable:${decoded.failure}`,
      shortlistSize,
      truthInShortlist,
    };

  const validation = validatePlan(config.specs, decoded.plan, surface, tier);
  const decision = decidePlannerRoute(
    decoded.plan,
    validation,
    config.specs,
    config.enabledDomains,
  );

  if (!decision.routed) {
    // The problem codes are what make a rejection actionable: `not_executable`
    // on its own never said whether the plan was empty or merely unresolved.
    const codes = validation.problems.map((p) => p.code).join(',');
    return {
      ...base,
      verdict: `reject:${decision.reason}${codes ? `(${codes})` : ''}`,
      shortlistSize,
      truthInShortlist,
    };
  }

  return {
    ...base,
    verdict: decision.route.action === row.truth ? 'OK' : 'wrong',
    routedAction: decision.route.action,
    shortlistSize,
    truthInShortlist,
  };
}

export type ReplaySummary = {
  prompts: number;
  promptsOk: number;
  traces: number;
  tracesOk: number;
  /** Verdict with the problem-code detail stripped, to prompt and trace counts. */
  buckets: Array<{ verdict: string; prompts: number; traces: number }>;
  problemCodes: Array<{ code: string; count: number }>;
};

export function summarizeReplay(
  results: readonly ReplayOutcome[],
): ReplaySummary {
  const buckets = new Map<string, { prompts: number; traces: number }>();
  const codes = new Map<string, number>();
  let promptsOk = 0;
  let traces = 0;
  let tracesOk = 0;

  for (const result of results) {
    traces += result.traces;
    if (result.verdict === 'OK') {
      promptsOk += 1;
      tracesOk += result.traces;
    }
    const key = result.verdict.replace(/\(.*\)/, '');
    const bucket = buckets.get(key) ?? { prompts: 0, traces: 0 };
    bucket.prompts += 1;
    bucket.traces += result.traces;
    buckets.set(key, bucket);

    const detail = /\((.*)\)/.exec(result.verdict);
    if (!detail) continue;
    for (const code of detail[1].split(','))
      codes.set(code, (codes.get(code) ?? 0) + 1);
  }

  return {
    prompts: results.length,
    promptsOk,
    traces,
    tracesOk,
    buckets: [...buckets]
      .map(([verdict, v]) => ({ verdict, ...v }))
      .sort((a, b) => b.traces - a.traces),
    problemCodes: [...codes]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * Disagreement between two runs, which for two runs of the *same* configuration
 * is the noise floor.
 *
 * §130's reason for existing: two identical baselines moved 3 of 121 prompts,
 * while the change under test moved 13-14. Without the repeat run the change
 * looked like a 0.5-point regression; with it, it was visibly a real effect that
 * simply was not an improvement.
 */
export function replayChurn(
  a: readonly ReplayOutcome[],
  b: readonly ReplayOutcome[],
): { compared: number; changed: number; okFlips: number } {
  const other = new Map(b.map((r) => [r.prompt, r]));
  let compared = 0;
  let changed = 0;
  let okFlips = 0;
  for (const result of a) {
    const match = other.get(result.prompt);
    if (!match) continue;
    compared += 1;
    if (match.verdict !== result.verdict) changed += 1;
    if ((match.verdict === 'OK') !== (result.verdict === 'OK')) okFlips += 1;
  }
  return { compared, changed, okFlips };
}
