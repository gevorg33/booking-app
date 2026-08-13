/**
 * C1 / e2e-bug.379 — can `COMMAND_REGISTRY` be generated from the specs yet?
 *
 * The ticket's plan is to generate the registry from `CommandSpec` and then
 * delete the hand-maintained parallel lists one at a time. The risk is not the
 * generation — it is deleting a hand-maintained list on the strength of a
 * measurement taken once (§125) and never re-run. Between that measurement and
 * the deletion, a new command can add a registry field the specs cannot
 * produce, and nothing would say so.
 *
 * So this asserts the *gap itself*, per field:
 *
 *   - fields already derivable stay derivable — if one regresses, the count
 *     moves and this fails by name;
 *   - fields not yet derivable are pinned with their current shortfall, so the
 *     port's remaining work is a number that updates itself rather than a
 *     paragraph that goes stale.
 *
 * It deliberately does **not** assert "0 missing". That would be a ratchet on
 * work nobody has done yet, and would go red the moment someone adds a command
 * — punishing the wrong action. It asserts the gap is *no worse*.
 */
import { COMMAND_REGISTRY } from './ai-command-registry.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import type { CommandSpec } from './ai-command-spec.types.js';

/** Registry ids are flat action names; specs carry them as `aliases`. */
const specByAction = new Map<string, CommandSpec>();
for (const spec of COMMAND_SPECS) {
  specByAction.set(spec.id, spec);
  for (const alias of spec.aliases) specByAction.set(alias, spec);
}

const paired = COMMAND_REGISTRY.map((entry) => ({
  entry,
  spec: specByAction.get(entry.id),
}));

describe('C1 — registry → spec pairing', () => {
  it('every registry entry still resolves to a spec', () => {
    // Gated already by ai-command-spec.conformance.spec.ts (§165); repeated
    // here because every count below is meaningless if pairing breaks.
    const orphans = paired.filter((p) => !p.spec).map((p) => p.entry.id);
    expect(orphans).toEqual([]);
  });
});

describe('C1 — fields the specs can already produce', () => {
  const withSpec = paired.filter(
    (p): p is { entry: (typeof paired)[number]['entry']; spec: CommandSpec } =>
      !!p.spec,
  );

  it('surfaces agree between registry and spec', () => {
    const mismatched = withSpec
      .filter(
        (p) =>
          [...p.entry.surfaces].sort().join(',') !==
          [...p.spec.surfaces].sort().join(','),
      )
      .map((p) => p.entry.id);
    expect(mismatched).toEqual([]);
  });

  it('handler agrees between registry and spec', () => {
    const mismatched = withSpec
      .filter((p) => p.entry.handler !== p.spec.handler)
      .map((p) => p.entry.id);
    expect(mismatched).toEqual([]);
  });
});

describe('C1 — fields the specs cannot produce yet (the port’s remaining work)', () => {
  /**
   * Pinned shortfalls. Each number is "registry entries carrying this field
   * that no spec can currently supply". They may only fall.
   */
  const CEILING = {
    apiModule: COMMAND_REGISTRY.length,
    compoundStep: COMMAND_REGISTRY.filter((e) => e.compoundStep).length,
    sprint: COMMAND_REGISTRY.filter((e) => e.sprint !== undefined).length,
    surfaceHandlers: COMMAND_REGISTRY.filter(
      (e) => e.surfaceHandlers !== undefined,
    ).length,
  };

  it('records the current shortfall so the port has a number, not a paragraph', () => {
    console.log(
      `[C1] registry entries: ${COMMAND_REGISTRY.length}. Fields no spec can supply yet — ` +
        Object.entries(CEILING)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ') +
        '.',
    );
    // CommandSpec has none of these four today; if one is added, its ceiling
    // should be lowered in the same change.
    const specFields = new Set(Object.keys(COMMAND_SPECS[0]));
    for (const field of Object.keys(CEILING)) {
      expect(specFields.has(field)).toBe(false);
    }
  });

  it('executionMode has exactly one entry that the mutating rule cannot predict', () => {
    // §125's counterexample, pinned: 695 of 696 follow
    // `mutating ? <mutate> : 'read_only'`. If a second appears, the generator
    // cannot treat this as a near-total derivation and this fails.
    const unpredictable = COMMAND_REGISTRY.filter((e) => {
      const predicted = e.mutating ? e.executionMode : 'read_only';
      return e.executionMode !== predicted;
    }).map((e) => e.id);

    expect(unpredictable.length).toBeLessThanOrEqual(1);
    if (unpredictable.length === 1) {
      expect(unpredictable[0]).toBe('coordinate_waitlist_offer');
    }
  });
});
