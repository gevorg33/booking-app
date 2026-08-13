/**
 * tech-debt A5 / e2e-bug.396 — measuring the retrieval gap on its own.
 *
 * ## Why this is separate from the replay
 *
 * `ai-planner-replay.manual.spec.ts` answers "did the planner route it", which
 * needs a completion per prompt and therefore costs real money per run. A5 asks
 * a strictly smaller question — **was the right command even on the shortlist**
 * — and that needs no completion at all. Only the query embedding and the
 * ranking.
 *
 * Splitting it out is what makes A5's loop runnable. The recipe is *edit specs →
 * rebuild the command cache → re-measure*, and re-measuring has to be cheap
 * enough to do after every domain or it will be done once and assumed after.
 *
 * ## The query embeddings are cached, and that is the point
 *
 * Editing a spec changes the **command** index. It cannot change the embedding
 * of a stored prompt, because the prompt is a fixed historical string. So the
 * 121 query vectors are fetched once and reused for every subsequent
 * measurement: the first run costs 121 embeddings, every re-measure after a
 * spec edit costs nothing and returns a number that differs *only* because of
 * the edit. That is also the strongest form of the comparison — same queries,
 * same ranking code, one variable.
 *
 * The cache is keyed on model + dimensions + prompt, so changing either
 * invalidates it rather than silently mixing vector spaces.
 *
 *     AI_RETRIEVAL=1 npx jest --testPathPatterns=ai-retrieval-gap
 *
 * `RETRIEVAL_CACHE` overrides the cache path; `RETRIEVAL_NO_EMBED=1` refuses to
 * call OpenAI at all and fails if the cache is incomplete, which is how a
 * re-measure proves it did not silently re-embed.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Client } from 'pg';
import OpenAI from 'openai';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  loadCommandIndex,
  narrowShortlist,
} from './ai-command-shortlist.util.js';
import {
  RESCUE_CORPUS_SQL,
  replayAccessTier,
  type ReplayRow,
} from './ai-planner-replay.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';

const ENABLED = process.env.AI_RETRIEVAL === '1';
const NO_EMBED = process.env.RETRIEVAL_NO_EMBED === '1';
const CACHE_PATH =
  process.env.RETRIEVAL_CACHE ??
  path.join(os.tmpdir(), 'ai-retrieval-query-embeddings.json');

const describeMaybe = ENABLED ? describe : describe.skip;

type Cache = {
  model: string;
  dimensions: number;
  vectors: Record<string, number[]>;
};

function loadCache(): Cache {
  try {
    const parsed = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) as Cache;
    // A cache from a different vector space is worse than no cache: the numbers
    // would still compute, and would mean nothing.
    if (
      parsed.model === EMBEDDING_MODEL &&
      parsed.dimensions === EMBEDDING_DIMENSIONS &&
      parsed.vectors
    ) {
      return parsed;
    }
  } catch {
    // absent or unreadable — rebuild
  }
  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    vectors: {},
  };
}

/**
 * What the classifier said before rescue overrode it.
 *
 * Deliberately a **second** query rather than extra columns on
 * `RESCUE_CORPUS_SQL`: that constant is the single definition of what the
 * corpus *is*, pinned by its own spec, and widening it for one consumer's
 * analysis is how two measurements start disagreeing about their population.
 * This joins on the same key and adds nothing to the corpus.
 *
 * `hadOpinion` is the load-bearing field. `action_changed_by = 'rescue'` means
 * the recorded action is rescue's, but that covers two different events:
 * rescue *supplying* a route the classifier did not have (`unknown`), and
 * rescue *replacing* one it did. Only the first leaves the recorded action
 * usable as ground truth.
 */
const CLASSIFIER_LABEL_SQL = `
  select prompt_raw as prompt,
         bool_or(classified_action is not null
                 and classified_action <> 'unknown') as "hadOpinion",
         (array_agg(distinct classified_action))[1] as "classifiedAction"
  from ai_command_trace
  where action_changed_by = 'rescue'
  group by prompt_raw
`;

type ClassifierLabel = {
  prompt: string;
  hadOpinion: boolean;
  classifiedAction: string | null;
};

async function loadCorpus(): Promise<{
  rows: ReplayRow[];
  labels: Map<string, ClassifierLabel>;
}> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await client.connect();
  try {
    const rows = (await client.query<ReplayRow>(RESCUE_CORPUS_SQL)).rows;
    const labelRows = (await client.query<ClassifierLabel>(CLASSIFIER_LABEL_SQL))
      .rows;
    return {
      rows,
      labels: new Map(labelRows.map((l) => [l.prompt, l])),
    };
  } finally {
    await client.end();
  }
}

/** `catalog.list_packages` → `catalog`; a bare action keeps its own name. */
function domainOf(action: string): string {
  const spec = COMMAND_SPECS.find(
    (s) => s.id === action || s.aliases.includes(action),
  );
  return spec?.domain ?? action.split('.')[0] ?? 'unknown';
}

describeMaybe('retrieval gap on the rescue-dependent corpus (opt-in)', () => {
  jest.setTimeout(600_000);

  it('reports truth-in-shortlist overall and per domain', async () => {
    const { rows, labels } = await loadCorpus();
    expect(rows.length).toBeGreaterThan(0);

    const cache = loadCache();
    const missingFromCache = rows.filter((r) => !cache.vectors[r.prompt]);

    if (missingFromCache.length > 0) {
      if (NO_EMBED) {
        throw new Error(
          `RETRIEVAL_NO_EMBED=1 but ${missingFromCache.length} prompts are not cached at ${CACHE_PATH}`,
        );
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // One batched call per 100 — the endpoint accepts an array, and 121
      // sequential round trips is the slow way to spend the same money.
      for (let i = 0; i < missingFromCache.length; i += 100) {
        const batch = missingFromCache.slice(i, i + 100);
        const res = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch.map((r) => r.prompt),
          dimensions: EMBEDDING_DIMENSIONS,
        });
        batch.forEach((row, j) => {
          const vector = res.data[j]?.embedding;
          if (vector) cache.vectors[row.prompt] = vector;
        });
      }
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
    }

    const index = loadCommandIndex(COMMAND_SPECS);
    const perDomain = new Map<string, { hit: number; total: number }>();
    const reasons = new Map<string, number>();
    const missing: Array<{
      truth: string;
      traces: number;
      prompt: string;
      classified: string;
      classifiedFound: boolean;
    }> = [];
    /** Rescue supplied the route (classifier said `unknown`) — truth is usable. */
    const supplied = { hit: 0, total: 0 };
    /** Rescue replaced a real classification — truth is rescue's opinion. */
    const replaced = { hit: 0, total: 0, classifierHit: 0 };
    let hits = 0;

    for (const row of rows) {
      const embedding = cache.vectors[row.prompt] ?? null;
      const narrowed = narrowShortlist(
        COMMAND_SPECS,
        row.surface as CommandSurface,
        replayAccessTier(row.surface, row.role),
        embedding,
        index,
        { message: row.prompt },
      );
      reasons.set(narrowed.reason, (reasons.get(narrowed.reason) ?? 0) + 1);

      const inShortlist = (action: string | null) =>
        !!action &&
        narrowed.specs.some(
          (s) => s.id === action || s.aliases.includes(action),
        );

      const found = inShortlist(row.truth);
      const label = labels.get(row.prompt);
      const classified = label?.classifiedAction ?? 'unknown';
      const classifiedFound = inShortlist(classified);

      const bucket = label?.hadOpinion ? replaced : supplied;
      bucket.total += 1;
      if (found) bucket.hit += 1;
      if (label?.hadOpinion && classifiedFound) replaced.classifierHit += 1;

      const domain = domainOf(row.truth);
      const dom = perDomain.get(domain) ?? { hit: 0, total: 0 };
      dom.total += 1;
      if (found) {
        dom.hit += 1;
        hits += 1;
      } else {
        missing.push({
          truth: row.truth,
          traces: row.traces,
          prompt: row.prompt.slice(0, 60),
          classified,
          classifiedFound,
        });
      }
      perDomain.set(domain, dom);
    }

    const pct = (n: number, d: number) => `${Math.round((n / d) * 100)}%`;
    const lines = [
      '',
      `[retrieval] truth in shortlist: ${hits}/${rows.length} (${pct(hits, rows.length)})`,
      `[retrieval] narrow reasons: ${[...reasons]
        .map(([r, n]) => `${r}=${n}`)
        .join(' ')}`,
      '',
      '  rescue SUPPLIED the route (classifier said unknown) — truth is usable',
      `    ${supplied.hit}/${supplied.total} (${pct(supplied.hit, supplied.total)})`,
      '  rescue REPLACED a classification — truth is rescue’s opinion',
      `    recorded action in shortlist:   ${replaced.hit}/${replaced.total} (${pct(replaced.hit, replaced.total)})`,
      `    classifier’s action in shortlist: ${replaced.classifierHit}/${replaced.total} (${pct(replaced.classifierHit, replaced.total)})`,
      '',
      'domain                          hit/total',
    ];
    for (const [domain, b] of [...perDomain].sort(
      (a, b) => a[1].hit / a[1].total - b[1].hit / b[1].total,
    )) {
      lines.push(
        `${domain.padEnd(30)}  ${String(b.hit).padStart(3)}/${String(b.total).padEnd(3)}  ${pct(b.hit, b.total)}`,
      );
    }
    lines.push(
      '',
      'missing — recorded truth, what the classifier said, and whether THAT was',
      'in the shortlist (`+` = retrieval found the classifier’s answer, so the',
      'miss is a labelling artifact rather than a retrieval failure):',
    );
    for (const m of missing.sort((a, b) => b.traces - a.traces)) {
      lines.push(
        `  ${m.classifiedFound ? '+' : ' '} ${m.truth.padEnd(36)} x${m.traces}  ` +
          `<- ${m.classified.padEnd(34)} ${m.prompt}`,
      );
    }
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));

    expect(hits).toBeGreaterThan(0);
  });
});
