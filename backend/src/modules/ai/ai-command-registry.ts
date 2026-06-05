import {
  buildCommandRegistry,
  buildCompoundCommandRecipes,
  collectCompoundStepIds,
  validateRegistryAgainstCapabilityMatrix,
} from './ai-command-registry.build.js';
import type {
  CommandRegistryEntry,
  CompoundCommandRecipe,
} from './ai-command-registry.types.js';

export const COMPOUND_COMMAND_RECIPES: CompoundCommandRecipe[] =
  buildCompoundCommandRecipes();

const COMPOUND_STEP_IDS = collectCompoundStepIds(COMPOUND_COMMAND_RECIPES);

export const COMMAND_REGISTRY: CommandRegistryEntry[] =
  buildCommandRegistry(COMPOUND_STEP_IDS);

export const COMMAND_REGISTRY_BY_ID: ReadonlyMap<string, CommandRegistryEntry> =
  new Map(COMMAND_REGISTRY.map((entry) => [entry.id, entry]));

export const REGISTRY_VALIDATION_ERRORS =
  validateRegistryAgainstCapabilityMatrix(COMMAND_REGISTRY);

export {
  buildCommandRegistry,
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
