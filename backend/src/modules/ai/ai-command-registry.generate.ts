/**
 * C1 / e2e-bug.379 — `COMMAND_REGISTRY`, generated from `CommandSpec`.
 *
 * The roadmap item was "port the registry entries domain by domain, **deleting
 * each hand-maintained parallel list as its domain lands**". The porting half
 * finished at §66; this is the start of the deleting.
 *
 * Every field is now carried by the spec or derived from one:
 *
 *   | field             | source                                              |
 *   |-------------------|-----------------------------------------------------|
 *   | `id`              | `spec.aliases[0]` — verified 1:1 across 705          |
 *   | `surfaces`        | `spec.surfaces`                                      |
 *   | `handler`         | `spec.handler`                                       |
 *   | `mutating`        | `spec.risk !== 'T0'` — 0 mismatches                  |
 *   | `label`           | `id.replace(/_/g, ' ')` — 0 mismatches               |
 *   | `executionMode`   | mutating ? simple_mutate : read_only, + 13 exceptions |
 *   | `apiModule`       | `deriveApiModule` — §159                             |
 *   | `compoundStep`    | `deriveCompoundStep` — §160                          |
 *   | `surfaceHandlers` | `deriveSurfaceHandlers` — §160                       |
 *
 * `sprint` is **dropped**, not ported. It recorded which sprint introduced a
 * command, nothing read it for behaviour, and git already holds that history.
 * The `sprint: '54'` on `ClinicTestResultCapabilityRow` is a different field on
 * a different type and is untouched — checked before dropping.
 *
 * The generator is not trusted on assertion:
 * `ai-command-registry.derivable.spec.ts` compares it field by field against the
 * committed registry for all 705 rows.
 */
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import type { CommandSpec } from './ai-command-spec.types.js';
import type {
  CommandExecutionMode,
  CommandRegistryEntry,
  CommandSurface,
} from './ai-command-registry.types.js';
import { deriveApiModule } from './ai-command-api-module.derive.js';
import {
  deriveCompoundStep,
  deriveSurfaceHandlers,
} from './ai-command-compound-step.derive.js';

/**
 * The 13 commands whose execution mode the mutating rule cannot predict.
 *
 * All are `orchestration` — multi-step operations that plan work rather than
 * apply one change. §125 flagged `coordinate_waitlist_offer` as the lone
 * counterexample to `mutating ? mutate : read_only`; measured, it is one of
 * thirteen, and the only *non-mutating* one among them.
 */
export const EXECUTION_MODE_EXCEPTIONS: Readonly<
  Record<string, CommandExecutionMode>
> = {
  bulk_smart_cancel: 'orchestration',
  coordinate_waitlist_offer: 'orchestration',
  day_replan: 'orchestration',
  fill_slot_from_waitlist: 'orchestration',
  holiday_mode: 'orchestration',
  no_show_recovery: 'orchestration',
  onboard_provider_schedule: 'orchestration',
  optimize_schedule: 'orchestration',
  reassign_cancelled: 'orchestration',
  rebalance_capacity: 'orchestration',
  resolve_conflicts: 'orchestration',
  setup_week_schedule: 'orchestration',
  sick_day_replan: 'orchestration',
};

/** Build one registry entry from its spec. */
export function buildRegistryEntryFromSpec(
  spec: CommandSpec,
): CommandRegistryEntry {
  const id = spec.aliases[0];
  const mutating = spec.risk !== 'T0';
  const apiModule = deriveApiModule(id, spec.handler);
  const compoundStep = deriveCompoundStep(id, spec.handler);

  if (!apiModule || compoundStep === undefined) {
    // Unreachable while the gates pass; thrown rather than defaulted so a new
    // handler cannot silently inherit someone else's module.
    throw new Error(
      `Cannot derive registry entry for ${id}: unknown handler ${spec.handler}`,
    );
  }

  const surfaceHandlers = deriveSurfaceHandlers(id);

  return {
    id,
    surfaces: [...spec.surfaces],
    mutating,
    executionMode:
      EXECUTION_MODE_EXCEPTIONS[id] ??
      (mutating ? 'simple_mutate' : 'read_only'),
    apiModule,
    handler: spec.handler,
    ...(surfaceHandlers ? { surfaceHandlers } : {}),
    compoundStep,
    label: id.replace(/_/g, ' '),
  };
}

/** The whole registry, derived from the specs. */
export function buildCommandRegistryFromSpecs(
  specs: readonly CommandSpec[] = COMMAND_SPECS,
): CommandRegistryEntry[] {
  return specs.map(buildRegistryEntryFromSpec);
}

/**
 * The per-surface intent lists, derived from `spec.surfaces` — §163.
 *
 * These were built from `INTENT_BINDING_SEEDS` via `buildBindingMaps()`, and are
 * the second of the six hand-maintained lists (`e2e-bug.379`). Measured against
 * the committed lists before the swap, the derivation is exact and needs no
 * exception table at all:
 *
 *   | surface   | committed | from specs | diff |
 *   |-----------|----------:|-----------:|-----:|
 *   | dashboard |       388 |        388 |    0 |
 *   | provider  |       153 |        153 |    0 |
 *   | customer  |       221 |        221 |    0 |
 *   | public    |       137 |        137 |    0 |
 *
 * Sorted, because the lists they replace were sorted and nothing indexes them
 * positionally — checked, so the swap is byte-identical rather than merely
 * equivalent.
 */
export function buildSurfaceIntentListsFromSpecs(
  specs: readonly CommandSpec[] = COMMAND_SPECS,
): Record<CommandSurface, string[]> {
  const forSurface = (surface: CommandSurface): string[] =>
    specs
      .filter((spec) => spec.surfaces.includes(surface))
      .map((spec) => spec.aliases[0])
      .sort();

  return {
    dashboard: forSurface('dashboard'),
    provider: forSurface('provider'),
    customer: forSurface('customer'),
    public: forSurface('public'),
  };
}

/**
 * The mutating-intent set, derived from `spec.risk` — §163.
 *
 * The seeds carried a hand-listed `mutateIntents` per binding. It is the same
 * fact the registry's `mutating` column already derives from the risk tier
 * (`risk !== 'T0'`), and measuring the three committed per-surface lists against
 * it found zero disagreement: dashboard 236/236, provider 52/52, customer 68/68.
 */
export function buildMutatingIntentSet(
  specs: readonly CommandSpec[] = COMMAND_SPECS,
): Set<string> {
  return new Set(
    specs.filter((spec) => spec.risk !== 'T0').map((spec) => spec.aliases[0]),
  );
}

/**
 * Intent id to its surfaces — §163, the map behind `resolveIntentSurfaces`.
 *
 * Reproduces the seeds' `surfaceByIntent` for all 705 intents with no
 * disagreement, including the seeds' special case: an id nothing binds resolves
 * to an empty list rather than to every surface.
 */
export function buildIntentSurfaceMap(
  specs: readonly CommandSpec[] = COMMAND_SPECS,
): Map<string, CommandSurface[]> {
  const map = new Map<string, CommandSurface[]>();
  for (const spec of specs) {
    const id = spec.aliases[0];
    const surfaces = map.get(id) ?? [];
    for (const surface of spec.surfaces)
      if (!surfaces.includes(surface)) surfaces.push(surface);
    map.set(id, surfaces);
  }
  return map;
}
