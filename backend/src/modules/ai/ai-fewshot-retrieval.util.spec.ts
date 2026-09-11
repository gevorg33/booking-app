/**
 * AI-ROADMAP Phase 3 / Phase 9 — few-shot retrieval from labelled traces.
 *
 * The design is driven by one measurement: joining 3,433 executed traces
 * against the eval baseline's per-intent accuracy, only **68.2%** belong to
 * intents scoring >=90%, 6.9% score below, and **24.8% are absent from the eval
 * entirely**. `compound_intent` alone has 139 executed rows at **0%** accuracy.
 *
 * So "labelled" cannot mean "executed", and the tests below pin the two
 * consequences: only verified sources enter the pool, and no single command can
 * dominate what the planner is shown.
 */
import {
  buildFewShotIndex,
  buildFewShotPool,
  DEFAULT_MAX_PER_ACTION,
  fewShotsFromEvalCases,
  fewShotsFromMisses,
  fewShotsFromSpecs,
  renderFewShots,
  selectFewShots,
  type FewShotExample,
} from './ai-fewshot-retrieval.util.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (
  id: string,
  examples: string[],
  surfaces: CommandSpec['surfaces'] = ['dashboard'],
): CommandSpec => ({
  id,
  aliases: [],
  domain: id.split('.')[0],
  surfaces,
  tiers: { dashboard: ['owner'], customer: ['client'] },
  risk: 'T1',
  description: id,
  variables: {},
  examples,
  confirm: 'never',
  handler: 'X',
  compensation: { kind: 'none' as const, reason: 'test fixture' },
});

/**
 * Deterministic stand-in for an embedding: a unit vector per keyword bucket.
 * The retrieval maths is `EmbeddingIndex`'s and is tested there; what matters
 * here is which candidates are *eligible* and how they are capped.
 */
const vec = (a: number, b: number, c: number) => [a, b, c];
const CANCEL = vec(1, 0, 0);
const BOOK = vec(0, 1, 0);

const embeddingsFor = (
  pool: readonly FewShotExample[],
  pick: (e: FewShotExample) => number[],
) => new Map(pool.map((e) => [e.id, pick(e)]));

describe('verified sources only', () => {
  it('takes examples from registry specs', () => {
    const out = fewShotsFromSpecs([
      spec('appointment.cancel', ['cancel my 3pm']),
    ]);
    expect(out).toEqual([
      {
        id: 'spec:appointment.cancel:0',
        prompt: 'cancel my 3pm',
        action: 'appointment.cancel',
        surface: 'dashboard',
        source: 'spec_example',
      },
    ]);
  });

  it('leaves a multi-surface spec example surface-agnostic', () => {
    const out = fewShotsFromSpecs([
      spec('appointment.cancel', ['cancel my 3pm'], ['dashboard', 'customer']),
    ]);
    expect(out[0].surface).toBeNull();
  });

  it('takes eval goldens, which are correct even for a 0% intent', () => {
    // The 12 intents scoring 0% are cases where the SYSTEM is wrong. The golden
    // is the truth, which is exactly what a few-shot should teach.
    const cases: AiCommandEvalCase[] = [
      {
        id: 'g1',
        prompt: 'what is on my calendar',
        surface: 'dashboard',
        expect: { action: 'explain_today_timeline' },
      },
    ];
    expect(fewShotsFromEvalCases(cases)[0]).toMatchObject({
      action: 'explain_today_timeline',
      source: 'eval_golden',
    });
  });

  it('skips an eval case that asserts no action', () => {
    // A parameter-extraction case says nothing about which command a phrasing
    // should reach; showing it as a routing example teaches the wrong lesson.
    const cases = [
      { id: 'g2', prompt: 'x', expect: { params: { a: 1 } } },
    ] as unknown as AiCommandEvalCase[];
    expect(fewShotsFromEvalCases(cases)).toEqual([]);
  });

  it('takes confirmed misses from the §44 pipeline', () => {
    const out = fewShotsFromMisses([
      {
        example: 'is anyone free for a massage tomorrow',
        evalCase: {
          id: 'miss-1',
          prompt: 'is anyone free for a massage tomorrow',
          surface: 'customer',
          expect: { action: 'check_providers_for_service' },
        },
      },
    ]);
    expect(out[0]).toMatchObject({
      action: 'check_providers_for_service',
      source: 'confirmed_miss',
    });
  });

  it('has no code path that accepts a raw trace', () => {
    // The measurement that forced this: 24.8% of executed traces belong to
    // intents the eval does not cover at all, and compound_intent has 139
    // executed rows at 0% accuracy. `outcome: 'executed'` means the handler
    // returned success, not that the right handler was chosen.
    //
    // Asserted structurally: every source function is named, and each stamps a
    // verified provenance onto what it returns.
    const sources = [
      ...fewShotsFromSpecs([spec('a.b', ['x'])]),
      ...fewShotsFromEvalCases([
        { id: 'g', prompt: 'y', expect: { action: 'a.b' } },
      ]),
    ];
    for (const s of sources) {
      expect(['spec_example', 'eval_golden', 'confirmed_miss']).toContain(
        s.source,
      );
    }
  });
});

describe('buildFewShotPool', () => {
  it('drops a prompt that appears in two sources', () => {
    // A duplicate would occupy two retrieval slots and crowd out a different
    // command.
    const pool = buildFewShotPool([
      fewShotsFromSpecs([spec('a.b', ['cancel my 3pm'])]),
      fewShotsFromEvalCases([
        { id: 'g', prompt: 'Cancel My 3pm', expect: { action: 'a.b' } },
      ]),
    ]);
    expect(pool).toHaveLength(1);
    expect(pool[0].source).toBe('spec_example');
  });

  it('treats earlier sources as higher precedence', () => {
    const pool = buildFewShotPool([
      fewShotsFromEvalCases([
        { id: 'g', prompt: 'same', expect: { action: 'a.b' } },
      ]),
      fewShotsFromSpecs([spec('a.b', ['same'])]),
    ]);
    expect(pool[0].source).toBe('eval_golden');
  });

  it('ignores an empty prompt', () => {
    expect(
      buildFewShotPool([fewShotsFromSpecs([spec('a.b', ['   '])])]),
    ).toEqual([]);
  });
});

describe('selectFewShots', () => {
  const pool = buildFewShotPool([
    fewShotsFromSpecs([
      spec('appointment.cancel', ['cancel my 3pm', 'scrap my booking']),
      spec('appointment.create', ['book me a haircut'], ['dashboard']),
      spec('cart.checkout', ['pay for my cart'], ['customer']),
    ]),
  ]);

  const index = buildFewShotIndex(
    pool,
    embeddingsFor(pool, (e) =>
      e.action === 'appointment.cancel' ? CANCEL : BOOK,
    ),
  );

  it('retrieves the examples closest to the query', () => {
    const out = selectFewShots(index, CANCEL, { surface: 'dashboard' });
    expect(out[0].action).toBe('appointment.cancel');
    expect(out[0].score).toBeCloseTo(1, 5);
  });

  it('excludes another surface before scoring, not after', () => {
    // A customer cart example is not a weak match on a dashboard request, it is
    // ineligible — scoring it first then dropping it would consume a slot.
    const out = selectFewShots(index, BOOK, { surface: 'dashboard' });
    expect(out.map((e) => e.action)).not.toContain('cart.checkout');
  });

  it('caps how many examples one command may contribute', () => {
    // Without a cap, a command with 40 eval cases wins every slot and the
    // planner sees one plausible answer repeated rather than a set to choose
    // between — few-shots become a steal mechanism (§4).
    const many = buildFewShotPool([
      fewShotsFromSpecs([
        spec('appointment.cancel', ['a', 'b', 'c', 'd', 'e', 'f']),
      ]),
    ]);
    const idx = buildFewShotIndex(
      many,
      embeddingsFor(many, () => CANCEL),
    );
    const out = selectFewShots(idx, CANCEL, { surface: 'dashboard' });
    expect(out).toHaveLength(DEFAULT_MAX_PER_ACTION);
  });

  it('honours an explicit per-action cap', () => {
    const many = buildFewShotPool([
      fewShotsFromSpecs([spec('appointment.cancel', ['a', 'b', 'c'])]),
    ]);
    const idx = buildFewShotIndex(
      many,
      embeddingsFor(many, () => CANCEL),
    );
    expect(
      selectFewShots(idx, CANCEL, { surface: 'dashboard', maxPerAction: 1 }),
    ).toHaveLength(1);
  });

  it('restricts to the shortlist when one is given', () => {
    // §4 guardrail 1: the shortlist is filtered by surface + permission before
    // the planner sees it. Few-shots must not reintroduce a command the
    // shortlist excluded.
    const out = selectFewShots(index, CANCEL, {
      surface: 'dashboard',
      shortlist: ['appointment.create'],
    });
    expect(out.every((e) => e.action === 'appointment.create')).toBe(true);
  });

  it('respects the overall limit', () => {
    const out = selectFewShots(index, CANCEL, {
      surface: 'dashboard',
      limit: 1,
    });
    expect(out).toHaveLength(1);
  });

  it('applies a minimum score', () => {
    // An orthogonal query should retrieve nothing rather than the least-bad
    // option, which would be a confident-looking irrelevant example.
    const out = selectFewShots(index, vec(0, 0, 1), {
      surface: 'dashboard',
      minScore: 0.5,
    });
    expect(out).toEqual([]);
  });

  it('skips entries with no embedding rather than scoring them as zero', () => {
    const idx = buildFewShotIndex(pool, new Map());
    expect(selectFewShots(idx, CANCEL, { surface: 'dashboard' })).toEqual([]);
  });

  it('returns nothing for an empty pool', () => {
    expect(
      selectFewShots(buildFewShotIndex([]), CANCEL, { surface: 'dashboard' }),
    ).toEqual([]);
  });
});

describe('renderFewShots', () => {
  it('renders prompt to command, one per line', () => {
    const out = renderFewShots([
      {
        id: 'x',
        prompt: 'cancel my 3pm',
        action: 'appointment.cancel',
        surface: 'dashboard',
        source: 'spec_example',
        score: 0.9,
      },
    ]);
    expect(out).toContain('"cancel my 3pm" -> appointment.cancel');
  });

  it('renders nothing when there are no examples', () => {
    // An empty heading would tell the model there were no similar requests,
    // which is not the same as not mentioning it.
    expect(renderFewShots([])).toBe('');
  });
});
