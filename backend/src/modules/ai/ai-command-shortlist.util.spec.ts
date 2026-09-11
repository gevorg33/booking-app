/**
 * AI-ROADMAP §4 / §5 — shortlist narrowing.
 *
 * §71 measured the planner shortlist at **388** commands where §5 specifies
 * **10–15**, and traced e2e-bug.381's empty plans to it. These tests pin the two
 * invariants that make narrowing safe, because getting either wrong turns a
 * planner that says "I could not map this" into one that maps things wrongly —
 * the §4 steal problem, one layer up.
 */
import {
  buildCommandIndex,
  commandMatchText,
  narrowShortlist,
  SHORTLIST_TARGET_MAX,
} from './ai-command-shortlist.util.js';
import type { CommandSpec } from './ai-command-spec.types.js';

const spec = (
  id: string,
  tiers: CommandSpec['tiers'] = { dashboard: ['staff', 'manager', 'owner'] },
): CommandSpec => ({
  id,
  aliases: [id.split('.')[1]],
  domain: id.split('.')[0],
  surfaces: ['dashboard'],
  tiers,
  risk: 'T0',
  description: `${id} does a specific and describable thing`,
  variables: {},
  examples: [`do ${id.split('.')[1]}`],
  confirm: 'never',
  handler: 'X',
});

/** 40 commands, so narrowing has something to do. */
const MANY: CommandSpec[] = Array.from({ length: 40 }, (_, i) =>
  spec(`d.cmd${i}`),
);

/** Deterministic stand-in: cmd0 matches the query, everything else is orthogonal. */
const QUERY = [1, 0];
const embeddingsFavouring = (winners: string[]) =>
  new Map(
    MANY.map((s) => [s.id, winners.includes(s.id) ? [1, 0] : [0, 1]] as const),
  );

describe('invariant 1 — narrowing can only remove', () => {
  it('never returns a command the actor may not run', () => {
    const ownerOnly = spec('d.secret', { dashboard: ['owner'] });
    const specs = [...MANY, ownerOnly];
    const index = buildCommandIndex(
      specs,
      new Map(specs.map((s) => [s.id, [1, 0]])),
    );
    const out = narrowShortlist(specs, 'dashboard', 'staff', QUERY, index);
    expect(out.specs.map((s) => s.id)).not.toContain('d.secret');
  });

  it('returns a subset of the permitted list, never an addition', () => {
    const index = buildCommandIndex(MANY, embeddingsFavouring(['d.cmd0']));
    const out = narrowShortlist(MANY, 'dashboard', 'staff', QUERY, index);
    const ids = new Set(MANY.map((s) => s.id));
    for (const s of out.specs) expect(ids.has(s.id)).toBe(true);
  });

  it('offers a dashboard client nothing, as before', () => {
    const index = buildCommandIndex(MANY, embeddingsFavouring(['d.cmd0']));
    expect(
      narrowShortlist(MANY, 'dashboard', 'client', QUERY, index).specs,
    ).toEqual([]);
  });
});

describe('invariant 2 — degrade to everything, never to a guess', () => {
  it('returns the full list when there is no query embedding', () => {
    // A ranking built from nothing would silently hide commands. Today's
    // behaviour — everything, badly — is the safer failure.
    const index = buildCommandIndex(MANY, embeddingsFavouring(['d.cmd0']));
    const out = narrowShortlist(MANY, 'dashboard', 'staff', null, index);
    expect(out.reason).toBe('no_embeddings');
    expect(out.specs).toHaveLength(MANY.length);
  });

  it('returns the full list when no command embeddings are loaded', () => {
    const out = narrowShortlist(
      MANY,
      'dashboard',
      'staff',
      QUERY,
      buildCommandIndex(MANY),
    );
    expect(out.reason).toBe('no_embeddings');
    expect(out.specs).toHaveLength(MANY.length);
  });

  it('leaves an already-small list alone', () => {
    const few = MANY.slice(0, 5);
    const out = narrowShortlist(
      few,
      'dashboard',
      'staff',
      QUERY,
      buildCommandIndex(few),
    );
    expect(out.reason).toBe('already_small');
    expect(out.specs).toHaveLength(5);
  });
});

describe('narrowing to the §5 range', () => {
  const index = buildCommandIndex(
    MANY,
    embeddingsFavouring(['d.cmd0', 'd.cmd7']),
  );

  it('cuts 40 candidates to the target maximum', () => {
    const out = narrowShortlist(MANY, 'dashboard', 'staff', QUERY, index);
    expect(out.reason).toBe('narrowed');
    expect(out.candidateCount).toBe(40);
    expect(out.specs).toHaveLength(SHORTLIST_TARGET_MAX);
  });

  it('keeps the best matches', () => {
    const ids = narrowShortlist(
      MANY,
      'dashboard',
      'staff',
      QUERY,
      index,
    ).specs.map((s) => s.id);
    expect(ids).toContain('d.cmd0');
    expect(ids).toContain('d.cmd7');
  });

  it('honours an explicit limit', () => {
    const out = narrowShortlist(MANY, 'dashboard', 'staff', QUERY, index, {
      limit: 10,
    });
    expect(out.specs).toHaveLength(10);
  });

  it('keeps pinned commands even when they score badly', () => {
    // §53's entity store: "make it 4pm" resembles nothing, but if the
    // conversation is about an appointment those commands must stay reachable.
    const out = narrowShortlist(MANY, 'dashboard', 'staff', QUERY, index, {
      limit: 3,
      pinned: ['d.cmd39'],
    });
    expect(out.specs.map((s) => s.id)).toContain('d.cmd39');
    expect(out.specs).toHaveLength(3);
  });

  it('will not pin a command the actor may not run', () => {
    const ownerOnly = spec('d.secret', { dashboard: ['owner'] });
    const specs = [...MANY, ownerOnly];
    const idx = buildCommandIndex(
      specs,
      new Map(specs.map((s) => [s.id, [0, 1]])),
    );
    const out = narrowShortlist(specs, 'dashboard', 'staff', QUERY, idx, {
      pinned: ['d.secret'],
    });
    expect(out.specs.map((s) => s.id)).not.toContain('d.secret');
  });

  it('does not let an unpermitted pin shrink the result', () => {
    // The pinned permission filter is NOT what keeps `d.secret` out — the final
    // `permitted.filter(...)` does that, and removing the pin filter leaves the
    // safety property intact. What it protects is the COUNT: `limit -
    // pinned.size` would reserve a slot for a command that never appears, so
    // asking for 10 would quietly return 9.
    const ownerOnly = spec('d.secret', { dashboard: ['owner'] });
    const specs = [...MANY, ownerOnly];
    // Aligned with QUERY, not orthogonal to it: e2e-bug.402's confidence gate
    // refuses to narrow at all when the top score is low, and a zero-similarity
    // index would exercise the gate instead of the count this test is about.
    const idx = buildCommandIndex(
      specs,
      new Map(specs.map((s) => [s.id, [1, 0]])),
    );
    const out = narrowShortlist(specs, 'dashboard', 'staff', QUERY, idx, {
      limit: 10,
      pinned: ['d.secret'],
    });
    expect(out.specs).toHaveLength(10);
  });

  it('preserves the caller ordering, not similarity order', () => {
    // Reordering per message makes the planner's input unstable across
    // otherwise-identical requests — the e2e-bug.152 non-determinism class.
    const out = narrowShortlist(MANY, 'dashboard', 'staff', QUERY, index);
    const ids = out.specs.map((s) => s.id);
    const expectedOrder = MANY.filter((s) => ids.includes(s.id)).map(
      (s) => s.id,
    );
    expect(ids).toEqual(expectedOrder);
  });
});

describe('commandMatchText', () => {
  it('matches on exactly what the shortlist shows the model', () => {
    // Ranking by one thing and presenting another would make the top result
    // unexplainable.
    const text = commandMatchText(spec('d.thing'));
    expect(text).toContain('does a specific and describable thing');
    expect(text).toContain('do thing');
  });
});
