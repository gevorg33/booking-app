/**
 * AI-ROADMAP Phase 8 — offline shadow replay.
 *
 * Phase 8 gates detector deletion on "planner passes that domain's eval →
 * shadow-compare 7 days". Checking whether that 7 days had started found two
 * things:
 *
 * - `AI_PLANNER_SHADOW_SURFACES` is **not set anywhere** — not in `.env`, not in
 *   any config. §19's shadow has been disabled since it shipped, which is why
 *   `ai_command_plan_shadow_disagreement` has **0 rows** and no trace in the
 *   5,362-row corpus carries `plan_outcome`;
 * - **traffic stopped on 2026-08-03**. This environment has a fixed historical
 *   corpus, not a live stream.
 *
 * So "wait 7 days" never completes here: the flag is off *and* nothing is
 * arriving. But the comparison does not actually need live traffic — it needs
 * *prompts with known outcomes*, and 5,362 of those are already stored.
 *
 * This replays them. It is a spec rather than a script because the planner is a
 * Nest service and ts-jest already boots TypeScript; it is opt-in because it
 * makes real OpenAI calls.
 *
 *   AI_SHADOW_REPLAY=1 AI_SHADOW_REPLAY_LIMIT=20 \
 *     npx jest --testPathPatterns=ai-planner-shadow-replay
 *
 * `AI_SHADOW_REPLAY_LIMIT` defaults to 10. The full corpus is 5,362 prompts and
 * therefore 5,362 completions — a real bill, so it is never the default.
 *
 * **e2e-bug.409 — the mechanics now live in `ai-planner-replay.util.ts`.** This
 * file previously embedded its own copy of narrow → build → decode → validate,
 * which is the drift F2 describes: two implementations of the same measurement,
 * free to disagree on exactly the things that change a number without changing
 * its name. It kept the corpus query and the reporting, which are its own, and
 * `truthInShortlist` moved *into* the util rather than being dropped — the
 * shared harness had no such measurement, and it is the one that separates a
 * model mistake from a retrieval miss.
 */
import { Client } from 'pg';
import OpenAI from 'openai';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { loadCommandIndex } from './ai-command-shortlist.util.js';
import {
  replayPrompt,
  type ReplayConfig,
  type ReplayOutcome,
  type ReplayRow,
} from './ai-planner-replay.util.js';

const ENABLED = process.env.AI_SHADOW_REPLAY === '1';
const LIMIT = Number(process.env.AI_SHADOW_REPLAY_LIMIT ?? 10);

type Row = {
  prompt_raw: string;
  action: string;
  surface: string;
  business_id: string;
  role: string | null;
};

const describeMaybe = ENABLED ? describe : describe.skip;

describeMaybe('planner shadow replay (opt-in, makes OpenAI calls)', () => {
  jest.setTimeout(600_000);

  it('replays historical prompts and reports planner agreement', async () => {
    const client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await client.connect();

    let rows: Row[] = [];
    try {
      // `executed` only: a failed or clarified trace has no agreed answer to
      // compare against, so counting it would measure the wrong thing.
      const res = await client.query<Row>(
        `SELECT prompt_raw, action, surface, business_id, role
           FROM ai_command_trace
          WHERE outcome = 'executed'
            AND prompt_raw IS NOT NULL
            AND action <> 'unknown'
          -- Deterministic sample, NOT random(). Every configuration must see
          -- the same prompts: at n=40 the same config produced 25% and 40%
          -- empty plans across two random samples, which exceeds the
          -- differences between configurations. Resampling made every
          -- comparison in §70-§78 unfalsifiable.
          ORDER BY md5(prompt_raw)
          LIMIT $1`,
        [LIMIT],
      );
      rows = res.rows;
    } finally {
      await client.end();
    }

    const specs = COMMAND_SPECS;
    const config: ReplayConfig = {
      openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      specs,
      index: loadCommandIndex(specs),
      // Every domain. `decidePlannerRoute` gates on this, and the question here
      // is what the planner *can* do, not what is switched on — a rollout flag
      // would otherwise read as a planner failure.
      enabledDomains: new Set(specs.map((s) => s.domain)),
      today: new Date().toISOString().slice(0, 10),
      timeZone: 'Asia/Yerevan',
      // §78: when testing grouped rendering, pass the FULL permitted list — the
      // whole point is 100% recall by construction, so narrowing is off.
      ...(process.env.AI_PLANNER_GROUPED_SHORTLIST === '1'
        ? { promptSpecsFor: () => specs }
        : {}),
    };

    const outcomes: ReplayOutcome[] = [];
    for (const row of rows) {
      const replayRow: ReplayRow = {
        prompt: row.prompt_raw,
        surface: row.surface,
        role: row.role,
        truth: row.action,
        traces: 1,
      };
      outcomes.push(await replayPrompt(config, replayRow));
    }

    const agreed = outcomes.filter((o) => o.verdict === 'OK').length;
    const disagreed = outcomes.filter((o) => o.verdict === 'wrong').length;
    const undecodable = outcomes.filter((o) =>
      o.verdict.startsWith('undecodable'),
    ).length;
    const rejected = outcomes.filter((o) => o.verdict.startsWith('reject')).length;
    const truthInShortlist = outcomes.filter((o) => o.truthInShortlist).length;
    // Surface is not on `ReplayOutcome`, so it is looked up from the rows the
    // query returned. Worth keeping: "explain_floor_status (provider)" says
    // which shortlist failed to retrieve it, and the bare action does not.
    const surfaceByPrompt = new Map(rows.map((r) => [r.prompt_raw, r.surface]));
    const truthMissing = outcomes
      .filter((o) => !o.truthInShortlist)
      .map((o) => `${o.truth} (${surfaceByPrompt.get(o.prompt) ?? '?'})`);

    // Reported, not asserted. This is a measurement harness; failing it on a
    // low agreement rate would make the number something to game rather than
    // something to read.
    console.log(
      `[shadow replay] n=${rows.length} agreed=${agreed} disagreed=${disagreed} undecodable=${undecodable} not_executable=${rejected}`,
    );
    const sizes = outcomes.map((o) => o.shortlistSize);
    const avgShortlist = sizes.length
      ? Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length)
      : 0;
    console.log(
      `[shadow replay] avg shortlist=${avgShortlist} truth_in_shortlist=${truthInShortlist}/${rows.length}`,
    );
    for (const m of truthMissing.slice(0, 8)) {
      console.log(`[shadow replay]   MISSING: ${m}`);
    }
    const byVerdict = new Map<string, number>();
    for (const o of outcomes) {
      if (o.verdict === 'OK' || o.verdict === 'wrong') continue;
      byVerdict.set(o.verdict, (byVerdict.get(o.verdict) ?? 0) + 1);
    }
    console.log(
      `[shadow replay] rejections: ${JSON.stringify([...byVerdict.entries()].sort((a, b) => b[1] - a[1]))}`,
    );
    for (const o of outcomes.filter((x) => x.verdict === 'wrong')) {
      const truthSpec = specs.find(
        (sp) => sp.id === o.truth || sp.aliases.includes(o.truth),
      );
      const plannedSpec = specs.find(
        (sp) => sp.id === o.routedAction || sp.aliases.includes(o.routedAction ?? ''),
      );
      console.log(
        `[judge]\n` +
          [
            `PROMPT: ${o.prompt.slice(0, 140)}`,
            `  DETECTOR: ${o.truth} — ${truthSpec?.description ?? '(no spec)'}`,
            `  PLANNER:  ${o.routedAction ?? '(none)'} — ${plannedSpec?.description ?? '(no spec)'}`,
          ].join('\n'),
      );
    }
    expect(rows.length).toBeGreaterThan(0);
  });
});
