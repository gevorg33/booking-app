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
 */
import { Client } from 'pg';
import OpenAI from 'openai';
import { buildPlannerMessages } from './ai-command-plan.prompt.js';
import { decodePlanResponse } from './ai-command-plan.decode.js';
import { validatePlan } from './ai-command-plan.validate.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  loadCommandIndex,
  narrowShortlist,
} from './ai-command-shortlist.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { AccessTier } from './access-control.matrix.js';

const ENABLED = process.env.AI_SHADOW_REPLAY === '1';
const LIMIT = Number(process.env.AI_SHADOW_REPLAY_LIMIT ?? 10);

type Row = {
  prompt_raw: string;
  action: string;
  surface: CommandSurface;
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

    // Drives the same pure pieces `AiCommandPlannerService.plan` uses —
    // `buildPlannerMessages`, `decodePlanResponse`, `validatePlan` — and calls
    // OpenAI directly. Constructing the real service would mean standing up its
    // four injected dependencies including a TypeORM repository, which is a lot
    // of scaffolding for a harness that only needs the prompt and the decoder.
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let agreed = 0;
    let disagreed = 0;
    let undecodable = 0;
    let notExecutable = 0;
    const problems: string[] = [];
    const shortlistSizes: number[] = [];
    let truthInShortlist = 0;
    const truthMissing: string[] = [];
    const disagreements: string[] = [];

    for (const row of rows) {
      // The trace's `role` is the business role profile, NOT the surface access
      // tier. The gateway derives the tier as
      // `resolveAccessTier(membershipRole ?? role)`, and `membershipRole` is not
      // stored — so a customer-surface request from a business owner records
      // `owner` while being gated as `client`.
      //
      // Passing `owner` on the customer surface permits only the ~7 commands
      // that literally list it (`isSpecAllowedForTier` is exact membership, not
      // hierarchical), which made the first narrowed run look like narrowing had
      // not helped. Surface decides the tier here.
      const tier: AccessTier =
        row.surface === 'customer' || row.surface === 'public'
          ? 'client'
          : ((row.role as AccessTier) ?? 'owner');

      // Same narrowing the planner now applies (§72), so the replay measures
      // the shipped behaviour rather than the pre-fix one.
      const q = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: row.prompt_raw,
        dimensions: EMBEDDING_DIMENSIONS,
      });
      const narrowed = narrowShortlist(
        COMMAND_SPECS,
        row.surface,
        tier,
        q.data[0]?.embedding ?? null,
        loadCommandIndex(COMMAND_SPECS),
      );
      shortlistSizes.push(narrowed.specs.length);

      // The decisive question once narrowing is on: did the shortlist still
      // CONTAIN the command the trace recorded? If not, an empty plan is the
      // retrieval's fault, not the model's.
      const containsTruth = narrowed.specs.some(
        (sp) => sp.id === row.action || sp.aliases.includes(row.action),
      );
      if (containsTruth) truthInShortlist += 1;
      else truthMissing.push(`${row.action} (${row.surface})`);

      // §78: when testing grouped rendering, pass the FULL permitted list —
      // the whole point is 100% recall by construction, so narrowing is off.
      const promptSpecs =
        process.env.AI_PLANNER_GROUPED_SHORTLIST === '1'
          ? COMMAND_SPECS
          : narrowed.specs;
      const messages = buildPlannerMessages(
        promptSpecs,
        row.surface,
        tier,
        {
          today: new Date().toISOString().slice(0, 10),
          timeZone: 'Asia/Yerevan',
        },
        row.prompt_raw,
      );

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: messages,
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1200,
      });

      const raw = response.choices[0]?.message?.content ?? null;
      const decoded = raw ? decodePlanResponse(raw) : null;
      if (!decoded?.ok) {
        undecodable += 1;
        continue;
      }
      const validation = validatePlan(
        promptSpecs,
        decoded.plan,
        row.surface,
        tier,
      );
      if (!validation.executable) {
        notExecutable += 1;
        if (decoded.plan.steps.length === 0) {
          problems.push(
            decoded.plan.unresolved.length > 0
              ? '(empty plan, unresolved noted)'
              : '(empty plan, silent)',
          );
        }
        for (const pr of validation.problems) problems.push(pr.code);
        continue;
      }

      const planned = decoded.plan.steps[0]?.command ?? '(none)';
      // Compare through the spec's aliases, not by string shape. The planner
      // emits canonical ids (`tour.list_calendar_week`) and traces record legacy
      // actions (`list_tour_calendar_week`); a suffix check calls that a
      // disagreement, which it is not. Caught on the first 8-prompt run.
      const plannedSpec = COMMAND_SPECS.find((c) => c.id === planned);
      const matches =
        planned === row.action ||
        (plannedSpec?.aliases.includes(row.action) ?? false);
      if (matches) agreed += 1;
      else {
        disagreed += 1;
        const truthSpec = COMMAND_SPECS.find(
          (sp) => sp.id === row.action || sp.aliases.includes(row.action),
        );
        const plannedSpec = COMMAND_SPECS.find((sp) => sp.id === planned);
        disagreements.push(
          [
            `PROMPT: ${row.prompt_raw.slice(0, 140)}`,
            `  DETECTOR: ${row.action} — ${truthSpec?.description ?? '(no spec)'}`,
            `  PLANNER:  ${planned} — ${plannedSpec?.description ?? '(no spec)'}`,
          ].join('\n'),
        );
      }
    }

    // Reported, not asserted. This is a measurement harness; failing it on a
    // low agreement rate would make the number something to game rather than
    // something to read.
    console.log(
      `[shadow replay] n=${rows.length} agreed=${agreed} disagreed=${disagreed} undecodable=${undecodable} not_executable=${notExecutable}`,
    );
    const avgShortlist = shortlistSizes.length
      ? Math.round(
          shortlistSizes.reduce((a, b) => a + b, 0) / shortlistSizes.length,
        )
      : 0;
    console.log(
      `[shadow replay] avg shortlist=${avgShortlist} truth_in_shortlist=${truthInShortlist}/${rows.length}`,
    );
    for (const m of truthMissing.slice(0, 8)) {
      console.log(`[shadow replay]   MISSING: ${m}`);
    }
    const byCode = new Map<string, number>();
    for (const c of problems) byCode.set(c, (byCode.get(c) ?? 0) + 1);
    console.log(
      `[shadow replay] validation problems: ${JSON.stringify([...byCode.entries()].sort((a, b) => b[1] - a[1]))}`,
    );
    for (const d of disagreements) console.log(`[judge]\n${d}`);
    expect(rows.length).toBeGreaterThan(0);
  });
});
