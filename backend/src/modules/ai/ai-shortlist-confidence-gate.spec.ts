/**
 * e2e-bug.402 — narrowing only when retrieval is confident.
 *
 * §116 measured narrowing helping rescued traffic and hurting ordinary traffic,
 * so no fixed setting of a global flag was correct. The top-ranked score
 * separates the two cleanly: at >= 0.5 the cut never lost the right command
 * across 197 real prompts; below 0.4 it lost it about half the time.
 */
import {
  narrowShortlist,
  NARROW_MIN_TOP_SCORE,
  buildCommandIndex,
} from './ai-command-shortlist.util.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { specsForActor } from './ai-command-spec.derive.js';

const DIMS = 8;
const unit = (v: number[]) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const permitted = () => specsForActor(COMMAND_SPECS, 'dashboard', 'owner');

/** Index where `targetId` is near the query and everything else is orthogonal. */
function indexWithTarget(targetId: string, targetScore: number) {
  const embeddings = new Map<string, number[]>();
  for (const spec of COMMAND_SPECS) {
    embeddings.set(
      spec.id,
      spec.id === targetId
        ? unit([
            targetScore,
            Math.sqrt(1 - targetScore * targetScore),
            0,
            0,
            0,
            0,
            0,
            0,
          ])
        : unit([0, 0, 1, 0, 0, 0, 0, 0]),
    );
  }
  return buildCommandIndex(COMMAND_SPECS, embeddings);
}
const QUERY = [1, 0, 0, 0, 0, 0, 0, 0];

describe('shortlist confidence gate', () => {
  const specs = permitted();
  const target = specs[0].id;

  it('narrows when the top score clears the threshold', () => {
    const r = narrowShortlist(
      COMMAND_SPECS,
      'dashboard',
      'owner',
      QUERY,
      indexWithTarget(target, 0.9),
      {},
    );
    expect(r.reason).toBe('narrowed');
    expect(r.specs.length).toBeLessThan(specs.length);
  });

  it('refuses to cut when the top score is below it', () => {
    const r = narrowShortlist(
      COMMAND_SPECS,
      'dashboard',
      'owner',
      QUERY,
      indexWithTarget(target, NARROW_MIN_TOP_SCORE - 0.1),
      {},
    );
    expect(r.reason).toBe('low_confidence');
    expect(r.specs).toHaveLength(specs.length);
  });

  it('falling back returns the full permitted list, not a guess', () => {
    // The failure mode of the gate must be the previous behaviour.
    const r = narrowShortlist(
      COMMAND_SPECS,
      'dashboard',
      'owner',
      QUERY,
      indexWithTarget(target, 0.1),
      {},
    );
    expect(r.specs.map((s) => s.id).sort()).toEqual(
      specs.map((s) => s.id).sort(),
    );
  });

  it('never widens beyond what the actor may run', () => {
    const r = narrowShortlist(
      COMMAND_SPECS,
      'dashboard',
      'owner',
      QUERY,
      indexWithTarget(target, 0.1),
      {},
    );
    const allowed = new Set(specs.map((s) => s.id));
    expect(r.specs.every((s) => allowed.has(s.id))).toBe(true);
  });

  it('still narrows for pinned commands even when confidence is low', () => {
    // Pinning is a caller asserting relevance the score cannot see (§53's entity
    // store, §49's anaphora); the gate must not override it.
    const r = narrowShortlist(
      COMMAND_SPECS,
      'dashboard',
      'owner',
      QUERY,
      indexWithTarget(target, 0.1),
      { pinned: [target] },
    );
    expect(r.reason).toBe('narrowed');
    expect(r.specs.map((s) => s.id)).toContain(target);
  });

  it('keeps degrading to the full list when there are no embeddings at all', () => {
    const r = narrowShortlist(
      COMMAND_SPECS,
      'dashboard',
      'owner',
      QUERY,
      buildCommandIndex(COMMAND_SPECS),
      {},
    );
    expect(r.reason).toBe('no_embeddings');
    expect(r.specs).toHaveLength(specs.length);
  });
});
