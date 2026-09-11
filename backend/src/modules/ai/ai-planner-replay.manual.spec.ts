/**
 * e2e-bug.407 — the rescue-corpus replay, checked in instead of rebuilt.
 *
 * ## It does not run by itself
 *
 * Guarded by `AI_REPLAY=1`. One embedding plus one completion per prompt per
 * run against a 121-prompt corpus is a real bill, and it needs the trace
 * database, so it must never fire inside a gate chain or the full sweep.
 * Without the flag the suite skips — visibly, rather than by returning early and
 * reporting a pass.
 *
 *     AI_REPLAY=1 REPLAY_LIMIT=3 npm run test:ai-planner-replay   # smoke
 *     AI_REPLAY=1 npm run test:ai-planner-replay                  # full corpus
 *     AI_REPLAY=1 REPLAY_RUNS=2 npm run test:ai-planner-replay    # + noise floor
 *
 * ## Read the prompt-weighted number first
 *
 * §130's lesson. One prompt can carry four traces, so a single verdict flip
 * moves trace-weighted recovery by two points: two identical baseline runs there
 * scored 30.6% and 32.4% while both landed on 27 and 28 prompts. Trace-weighting
 * is still reported because §92 onward quote it, but a couple of points of
 * movement in it is not evidence of anything.
 *
 * `REPLAY_RUNS=2` is the answer — it replays the corpus twice and prints the
 * churn between the two, so the noise floor is measured rather than assumed. A
 * change that moves fewer prompts than that floor has not been shown to do
 * anything.
 *
 * The mechanics live in `ai-planner-replay.util.ts` so they cannot drift between
 * measurements; only the reporting is here.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Client } from 'pg';
import OpenAI from 'openai';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { loadCommandIndex } from './ai-command-shortlist.util.js';
import {
  RESCUE_CORPUS_SQL,
  replayChurn,
  replayPrompt,
  summarizeReplay,
  type ReplayOutcome,
  type ReplayRow,
} from './ai-planner-replay.util.js';

const RUNS = Number(process.env.REPLAY_RUNS ?? '1');
const CONCURRENCY = Number(process.env.REPLAY_CONCURRENCY ?? '8');
/** Pinned to the last day of traffic so date resolution is stable across runs. */
const TODAY = process.env.REPLAY_TODAY ?? '2026-08-03';
/**
 * Cap the corpus, for checking the harness still works without paying for 121
 * completions. Takes the heaviest prompts first (the query orders by trace
 * count), so a smoke run is a real subset rather than an arbitrary one — but a
 * limited run is not a measurement and must never be quoted as one.
 */
const LIMIT = Number(process.env.REPLAY_LIMIT ?? '0');

async function loadCorpus(): Promise<ReplayRow[]> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();
  try {
    const result = await client.query<ReplayRow>(RESCUE_CORPUS_SQL);
    return LIMIT > 0 ? result.rows.slice(0, LIMIT) : result.rows;
  } finally {
    await client.end();
  }
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

function report(label: string, results: readonly ReplayOutcome[]): void {
  const s = summarizeReplay(results);
  // Prompt-weighted first, deliberately — see the header.
  console.log(
    `[replay:${label}] prompts ${s.promptsOk}/${s.prompts} = ${(
      (100 * s.promptsOk) /
      s.prompts
    ).toFixed(1)}%   traces ${s.tracesOk}/${s.traces} = ${(
      (100 * s.tracesOk) /
      s.traces
    ).toFixed(1)}%`,
  );
  console.log(`[replay:${label}] --- verdict | prompts | traces ---`);
  for (const b of s.buckets)
    console.log(
      `[replay:${label}]   ${b.verdict.padEnd(34)} ${String(b.prompts).padStart(3)} ${String(b.traces).padStart(4)}`,
    );
  if (s.problemCodes.length) {
    console.log(`[replay:${label}] --- validation problems ---`);
    for (const c of s.problemCodes)
      console.log(
        `[replay:${label}]   ${c.code.padEnd(24)} ${String(c.count).padStart(3)}`,
      );
  }
}

const enabled = process.env.AI_REPLAY === '1';

// `describe.skip` rather than an early return, so a listing shows it as
// deliberately skipped instead of as a suite that passed without doing anything.
(enabled ? describe : describe.skip)(
  'planner replay against the rescue corpus (opt-in, makes OpenAI calls)',
  () => {
    jest.setTimeout(90 * 60 * 1000);

    it('replays the corpus and reports routing recovery', async () => {
      const rows = await loadCorpus();
      if (LIMIT > 0)
        console.log(
          `[replay] REPLAY_LIMIT=${LIMIT} — smoke run over ${rows.length} prompts, NOT a measurement.`,
        );
      const config = {
        openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
        specs: COMMAND_SPECS,
        index: loadCommandIndex(COMMAND_SPECS),
        // Every domain, so this reports what the planner *could* route.
        // Measuring through `AI_PLANNER_EXECUTE_DOMAINS` would report the
        // rollout instead of the capability.
        enabledDomains: new Set(
          COMMAND_SPECS.map((s) => s.domain.toLowerCase()),
        ),
        today: TODAY,
      };

      const outDir = process.env.REPLAY_OUT_DIR ?? os.tmpdir();
      const runs: ReplayOutcome[][] = [];
      for (let run = 1; run <= RUNS; run += 1) {
        const results = await pool(rows, CONCURRENCY, (row) =>
          replayPrompt(config, row),
        );
        runs.push(results);
        const file = path.join(outDir, `ai-planner-replay-${run}.json`);
        fs.writeFileSync(file, JSON.stringify(results, null, 1));
        report(`run${run}`, results);
        console.log(`[replay:run${run}] written to ${file}`);
      }

      for (let i = 1; i < runs.length; i += 1) {
        const c = replayChurn(runs[i - 1], runs[i]);
        console.log(
          `[replay:noise] ${c.changed} of ${c.compared} prompts changed verdict between identical runs (${c.okFlips} OK flips).`,
        );
        console.log(
          '[replay:noise] A change moving fewer prompts than this has not been shown to do anything.',
        );
      }
      if (RUNS < 2)
        console.log(
          '[replay:noise] single run — set REPLAY_RUNS=2 to measure the noise floor before claiming a delta.',
        );

      expect(runs[0]).toHaveLength(rows.length);
    });
  },
);
