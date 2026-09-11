/**
 * e2e-bug.380 / e2e-bug.417 — can the planner reach the commands the detectors cannot?
 *
 * §132 split the 449 failing spec examples into **343 that route to nothing** and
 * 106 that a different command claims, and said the unclaimed ones "need routing
 * built". Taken literally that means writing 343 new `legacy_paraphrase`
 * detectors — which is precisely what Phase 8 exists to delete. Doing it would
 * be paying down one debt by taking out more of another.
 *
 * The question Phase 8 actually needs answering is whether the **planner**
 * already reaches them. If it does, those commands are not unreachable, they are
 * unreachable *by the layer being retired*, and the fix is enabling the planner
 * for their domains rather than authoring detectors.
 *
 * This measures it against the same examples, using the shared replay mechanics
 * from `e2e-bug.407` so the numbers stay comparable to §130's.
 *
 *     AI_REPLAY=1 REPLAY_LIMIT=10 npm run test:ai-planner-spec-examples   # smoke
 *     AI_REPLAY=1 npm run test:ai-planner-spec-examples                   # all 343
 *
 * One embedding + one completion per example, so the full run is a real bill and
 * never the default. Guarded by `AI_REPLAY=1`, like the other manual harness.
 *
 * ## What a pass means here
 *
 * That the planner named the command whose own spec documents the phrasing. It
 * is a *retrieval and planning* result, not proof the command then executes —
 * §129's caveat applies, and a confirm-required command routes to a question.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import OpenAI from 'openai';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { loadCommandIndex } from './ai-command-shortlist.util.js';
import { AI_COMMAND_EVAL_SPEC_COVERAGE_CASES } from './eval/ai-command-eval.spec-coverage.js';
import { buildDeterministicAccuracyReport } from './eval/ai-command-eval.report.js';
import {
  replayPrompt,
  summarizeReplay,
  type ReplayOutcome,
  type ReplayRow,
} from './ai-planner-replay.util.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const LIMIT = Number(process.env.REPLAY_LIMIT ?? '0');
/**
 * Hold each command's own example out of the prompt, and skip retrieval —
 * e2e-bug.417.
 *
 * §140 measured 87.8% and had to discount it to a ceiling: `renderShortlist`
 * prints a command's examples verbatim and the embedding index is built from
 * `description + examples`, so both halves of the pipeline were shown the exact
 * string being tested. `REPLAY_HOLDOUT=1` removes both — the matching example is
 * stripped from the spec the prompt renders, and narrowing is disabled so the
 * model sees the full permitted catalogue instead of a retrieved shortlist.
 *
 * What remains is the honest question: given every command it is allowed to use
 * and no sight of this phrasing, does the planner name the right one?
 */
const HOLDOUT_MODE = process.env.REPLAY_HOLDOUT ?? '';
/** Strip the command's own example from the rendered prompt. */
const HOLDOUT = HOLDOUT_MODE === '1' || HOLDOUT_MODE === 'prompt';
/**
 * Also disable retrieval.
 *
 * Kept separable because the first run of this changed both at once and the
 * result could not be attributed: reach fell 87.8% -> 54.2% while `empty_plan`
 * went 3 -> 91, which is the signature of a 388-command prompt rather than of a
 * missing example. `REPLAY_HOLDOUT=prompt` isolates the example.
 */
const SKIP_RETRIEVAL = HOLDOUT_MODE === '1';
const CONCURRENCY = Number(process.env.REPLAY_CONCURRENCY ?? '8');
const TODAY = process.env.REPLAY_TODAY ?? '2026-08-03';

/**
 * The examples no detector routes — §132's unclaimed 343.
 *
 * Derived from the same report the ratchet uses rather than a copied list, so it
 * cannot drift from the number `ai-command-eval.spec-coverage.spec.ts` guards.
 */
function unclaimedExamples(): ReplayRow[] {
  const cases = [...AI_COMMAND_EVAL_SPEC_COVERAGE_CASES];
  const report = buildDeterministicAccuracyReport(cases);
  const byId = new Map(cases.map((c) => [c.id, c]));

  const rows: ReplayRow[] = [];
  for (const failure of report.failures) {
    // `got none` is the unclaimed half; a named action is the stolen half, which
    // is a different defect and not what this asks about.
    if (!/got none/.test(failure.errors.join(' '))) continue;
    const evalCase = byId.get(failure.id);
    if (!evalCase) continue;
    rows.push({
      prompt: evalCase.prompt,
      surface: evalCase.surface ?? 'dashboard',
      // Spec examples carry no actor; owner is the widest staff tier and the
      // shortlist is permission-filtered, so a narrower one would measure
      // permissions rather than retrieval.
      role: 'owner',
      truth: failure.intent,
      traces: 1,
    });
  }
  return rows;
}

async function pool<T, R>(
  items: readonly T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, size) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

const enabled = process.env.AI_REPLAY === '1';

(enabled ? describe : describe.skip)(
  'planner against spec examples no detector routes (opt-in, makes OpenAI calls)',
  () => {
    jest.setTimeout(120 * 60 * 1000);

    it('reports how many the planner reaches', async () => {
      const all = unclaimedExamples();
      const rows = LIMIT > 0 ? all.slice(0, LIMIT) : all;
      console.log(
        `[spec-examples] ${rows.length} of ${all.length} unclaimed examples · ${
          HOLDOUT
            ? SKIP_RETRIEVAL
              ? 'HELD OUT (example stripped, retrieval off)'
              : 'HELD OUT (example stripped, retrieval on)'
            : 'as shipped'
        }${LIMIT > 0 ? ' · LIMIT set, not a measurement' : ''}`,
      );

      const config = {
        openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
        specs: COMMAND_SPECS,
        index: loadCommandIndex(COMMAND_SPECS),
        enabledDomains: new Set(
          COMMAND_SPECS.map((s) => s.domain.toLowerCase()),
        ),
        today: TODAY,
        skipNarrowing: SKIP_RETRIEVAL,
        ...(HOLDOUT
          ? {
              promptSpecsFor: (
                row: ReplayRow,
                permitted: readonly CommandSpec[],
              ): readonly CommandSpec[] =>
                permitted.map((spec) => {
                  const owns =
                    spec.id === row.truth || spec.aliases.includes(row.truth);
                  if (!owns) return spec;
                  // Only the prompt's copy is stripped. Permission and
                  // validation still run against the real registry, so this
                  // cannot make an impermissible command routable.
                  return {
                    ...spec,
                    examples: spec.examples.filter((e) => e !== row.prompt),
                  };
                }),
            }
          : {}),
      };

      const results: ReplayOutcome[] = await pool(rows, CONCURRENCY, (row) =>
        replayPrompt(config, row),
      );
      const file = path.join(
        process.env.REPLAY_OUT_DIR ?? os.tmpdir(),
        'ai-planner-spec-examples.json',
      );
      fs.writeFileSync(file, JSON.stringify(results, null, 1));

      const s = summarizeReplay(results);
      console.log(
        `[spec-examples] planner reaches ${s.promptsOk}/${s.prompts} = ${(
          (100 * s.promptsOk) /
          s.prompts
        ).toFixed(1)}%  (detectors reach 0 of these by construction)`,
      );
      for (const b of s.buckets)
        console.log(
          `[spec-examples]   ${b.verdict.padEnd(34)} ${String(b.prompts).padStart(4)}`,
        );
      for (const c of s.problemCodes)
        console.log(
          `[spec-examples]   problem ${c.code.padEnd(24)} ${String(c.count).padStart(4)}`,
        );

      // Per domain, because Phase 8 retires by slice and the answer is only
      // actionable per slice.
      const byDomain = new Map<string, { ok: number; total: number }>();
      const domainOf = new Map<string, string>();
      for (const spec of COMMAND_SPECS) {
        domainOf.set(spec.id, spec.domain);
        for (const alias of spec.aliases) domainOf.set(alias, spec.domain);
      }
      for (const r of results) {
        const d = domainOf.get(r.truth) ?? '(unknown)';
        const row = byDomain.get(d) ?? { ok: 0, total: 0 };
        row.total += 1;
        if (r.verdict === 'OK') row.ok += 1;
        byDomain.set(d, row);
      }
      console.log('[spec-examples] --- domain | reached | examples ---');
      for (const [d, v] of [...byDomain].sort(
        (a, b) => b[1].total - a[1].total,
      ))
        console.log(
          `[spec-examples]   ${d.padEnd(14)} ${String(v.ok).padStart(3)} / ${String(v.total).padStart(3)}`,
        );
      console.log(`[spec-examples] written to ${file}`);

      expect(results).toHaveLength(rows.length);
    });
  },
);
