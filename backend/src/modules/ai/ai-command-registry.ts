import {
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
  validateRegistryAgainstCapabilityMatrix,
} from './ai-command-registry.build.js';
import { buildCommandRegistryFromSpecs } from './ai-command-registry.generate.js';
import type {
  CommandRegistryEntry,
  CompoundCommandRecipe,
} from './ai-command-registry.types.js';

export const COMPOUND_COMMAND_RECIPES: CompoundCommandRecipe[] =
  buildCompoundCommandRecipes();

// `collectCompoundStepIds` fed the old `buildCommandRegistry`; the generator
// derives `compoundStep` per handler instead (§160). The helper stays exported
// below for the recipes, which still use it.

/**
 * C1 / e2e-bug.379 — generated from `CommandSpec`, no longer hand-maintained.
 *
 * `buildCommandRegistry(COMPOUND_STEP_IDS)` built this from the seed list in
 * `ai-command-registry.build.ts`. It is now derived from the specs, and
 * `ai-command-registry.derivable.spec.ts` asserts the two agree field by field
 * across all 705 rows — the swap was made only after that gate was green, so it
 * is inert by construction.
 *
 * The one intended difference is `sprint`, dropped rather than ported: nothing
 * read it for behaviour and git already holds that history.
 *
 * The seed list and `buildCommandRegistry` are now unreachable for this purpose
 * and are the next thing to delete; they are left in place for one step so that
 * the swap and the deletion are separately revertible.
 */
export const COMMAND_REGISTRY: CommandRegistryEntry[] =
  buildCommandRegistryFromSpecs();

export const COMMAND_REGISTRY_BY_ID: ReadonlyMap<string, CommandRegistryEntry> =
  new Map(COMMAND_REGISTRY.map((entry) => [entry.id, entry]));

export const REGISTRY_VALIDATION_ERRORS =
  validateRegistryAgainstCapabilityMatrix(COMMAND_REGISTRY);

export {
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  ORCHESTRATION_INTENT_IDS,
  PROVIDER_INTENTS,
  PUBLIC_ASSISTANT_INTENTS,
  PUBLIC_INTENTS,
  validateRegistryAgainstCapabilityMatrix,
} from './ai-command-registry.build.js';

export type {
  CommandApiModule,
  CommandExecutionMode,
  CommandRegistryEntry,
  CommandRegistryView,
  CommandSurface,
  CompoundCommandRecipe,
} from './ai-command-registry.types.js';
