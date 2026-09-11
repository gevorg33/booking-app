/**
 * C1 / e2e-bug.379 — the registry is generated; these are the invariants that
 * keep it honest.
 *
 * Until §162 this file compared the generated registry against the
 * hand-maintained one, field by field across all 705 rows. That comparison was
 * the evidence for the swap, and it died with the seed list it compared to —
 * `COMMAND_REGISTRY` is now produced by `buildCommandRegistryFromSpecs`, so
 * asserting the generator reproduces it would be asserting the generator
 * reproduces itself.
 *
 * A vacuous assertion is worse than none: it reads as coverage. So what remains
 * are the properties that can still fail.
 */
import { COMMAND_REGISTRY } from './ai-command-registry.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import {
  HANDLER_API_MODULE,
  API_MODULE_EXCEPTIONS,
} from './ai-command-api-module.derive.js';
import {
  COMPOUND_STEP_EXCEPTIONS,
  HANDLER_COMPOUND_STEP,
  SURFACE_HANDLERS,
} from './ai-command-compound-step.derive.js';
import {
  EXECUTION_MODE_EXCEPTIONS,
  buildCommandRegistryFromSpecs,
  buildSurfaceIntentListsFromSpecs,
} from './ai-command-registry.generate.js';
import {
  ORCHESTRATION_INTENT_IDS,
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';

const specByAction = new Map<string, CommandSpec>();
for (const spec of COMMAND_SPECS) {
  specByAction.set(spec.id, spec);
  for (const alias of spec.aliases) specByAction.set(alias, spec);
}

describe('C1 — the generated registry is well-formed', () => {
  it('produces one entry per spec, with unique ids', () => {
    expect(COMMAND_REGISTRY.length).toBe(COMMAND_SPECS.length);
    const ids = COMMAND_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry resolves back to a spec', () => {
    const orphans = COMMAND_REGISTRY.filter((e) => !specByAction.has(e.id)).map(
      (e) => e.id,
    );
    expect(orphans).toEqual([]);
  });

  it('no entry carries sprint', () => {
    // Dropped in §161 by decision. Asserted because the field is easy to
    // reintroduce by copying a neighbouring entry.
    const withSprint = COMMAND_REGISTRY.filter(
      (e) => 'sprint' in (e as unknown as Record<string, unknown>),
    ).map((e) => e.id);
    expect(withSprint).toEqual([]);
  });

  it('regenerating is stable', () => {
    // The generator is pure; if it stops being, the registry stops being a
    // function of the specs and everything above is worthless.
    expect(JSON.stringify(buildCommandRegistryFromSpecs())).toBe(
      JSON.stringify(COMMAND_REGISTRY),
    );
  });
});

describe('C1 — the derivation tables still cover the registry', () => {
  const handlers = [...new Set(COMMAND_SPECS.map((s) => s.handler))];

  it('every handler has an apiModule', () => {
    expect(handlers.filter((h) => !(h in HANDLER_API_MODULE))).toEqual([]);
  });

  it('every handler has a compoundStep default', () => {
    expect(handlers.filter((h) => !(h in HANDLER_COMPOUND_STEP))).toEqual([]);
  });

  it('keeps the exception lists small enough to be worth deriving', () => {
    // Not style. Deriving beats declaring only while the exceptions are
    // nameable; past these bounds the field is data and belongs on the spec.
    expect(Object.keys(API_MODULE_EXCEPTIONS).length).toBeLessThanOrEqual(10);
    expect(Object.keys(COMPOUND_STEP_EXCEPTIONS).length).toBeLessThanOrEqual(
      25,
    );
    expect(Object.keys(SURFACE_HANDLERS).length).toBeLessThanOrEqual(25);
  });

  it('every exception names a command that exists', () => {
    // An exception for a deleted command is dead weight that silently stops
    // applying — and reads as intent.
    const ids = new Set(COMMAND_REGISTRY.map((e) => e.id));
    const stale = [
      ...Object.keys(API_MODULE_EXCEPTIONS),
      ...Object.keys(COMPOUND_STEP_EXCEPTIONS),
      ...Object.keys(SURFACE_HANDLERS),
      ...Object.keys(EXECUTION_MODE_EXCEPTIONS),
    ].filter((id) => !ids.has(id));
    expect(stale).toEqual([]);
  });

  it('execution-mode exceptions are all orchestration', () => {
    // §161 — the 13 are multi-step operations. A different mode appearing here
    // means the `mutating ? simple_mutate : read_only` rule has a new shape of
    // counterexample and should be re-derived rather than patched.
    const odd = Object.entries(EXECUTION_MODE_EXCEPTIONS).filter(
      ([, mode]) => mode !== 'orchestration',
    );
    expect(odd).toEqual([]);
  });
});

describe('C1 — the rules that justify deriving rather than declaring', () => {
  it('compoundStep is still not "is it a mutation"', () => {
    // §160: the intuitive rule is wrong on ~46% of the registry. If it ever
    // becomes right, per-handler derivation is no longer justified.
    const asMutating = COMMAND_REGISTRY.filter(
      (e) => e.mutating !== e.compoundStep,
    ).length;
    expect(asMutating).toBeGreaterThan(100);
  });

  it('mutating still follows the risk tier exactly', () => {
    const wrong = COMMAND_REGISTRY.filter((e) => {
      const spec = specByAction.get(e.id);
      return spec && e.mutating !== (spec.risk !== 'T0');
    }).map((e) => e.id);
    expect(wrong).toEqual([]);
  });
});

describe('C1 — the surface intent lists are derived (§163)', () => {
  const lists = buildSurfaceIntentListsFromSpecs();

  it.each([
    ['dashboard', DASHBOARD_INTENTS, 388],
    ['provider', PROVIDER_INTENTS, 153],
    ['customer', CUSTOMER_INTENTS, 221],
    ['public', PUBLIC_INTENTS, 137],
  ] as const)('%s matches the registry surfaces', (surface, exported, size) => {
    // The exported list is now produced by this function, so the useful check
    // is not "they agree" (they must) but that both still agree with the
    // *registry*, which is generated independently from the same specs.
    const fromRegistry = COMMAND_REGISTRY.filter((e) =>
      e.surfaces.includes(surface),
    )
      .map((e) => e.id)
      .sort();
    expect([...exported]).toEqual(fromRegistry);
    expect(lists[surface]).toEqual(fromRegistry);
    // Size pinned so a spec silently losing a surface shows up as a number.
    expect(fromRegistry.length).toBe(size);
  });

  it('every intent appears on at least one surface', () => {
    const all = new Set([
      ...lists.dashboard,
      ...lists.provider,
      ...lists.customer,
      ...lists.public,
    ]);
    const orphans = COMMAND_REGISTRY.filter((e) => !all.has(e.id)).map(
      (e) => e.id,
    );
    expect(orphans).toEqual([]);
  });

  it('the lists are sorted', () => {
    // The seeds produced sorted lists and nothing indexes them positionally;
    // keeping them sorted is what made the swap byte-identical.
    for (const [surface, ids] of Object.entries(lists)) {
      expect(ids).toEqual([...ids].sort());
      expect(surface).toBeTruthy();
    }
  });
});

describe('C1 — the orchestration set is derived (§164)', () => {
  it('is exactly the registry entries whose execution mode is orchestration', () => {
    // It used to be a hand-listed set of 13 alongside a hand-listed map of the
    // same 13, in two files, with nothing keeping them in step. Now the set is a
    // view of the map; this checks both still agree with the built registry,
    // which is the thing either one could have silently drifted from.
    const fromRegistry = COMMAND_REGISTRY.filter(
      (e) => e.executionMode === 'orchestration',
    ).map((e) => e.id);
    expect([...ORCHESTRATION_INTENT_IDS].sort()).toEqual(fromRegistry.sort());
    expect(ORCHESTRATION_INTENT_IDS.size).toBe(13);
  });
});
