import type { AccessTier } from './access-control.matrix.js';
import {
  COMMAND_REGISTRY,
  COMMAND_REGISTRY_BY_ID,
  COMPOUND_COMMAND_RECIPES,
} from './ai-command-registry.js';
import type {
  CommandExecutionMode,
  CommandRegistryEntry,
  CommandRegistryView,
  CommandSurface,
  CompoundCommandRecipe,
} from './ai-command-registry.types.js';

export function getCommandEntry(
  intentId: string,
): CommandRegistryEntry | undefined {
  return COMMAND_REGISTRY_BY_ID.get(intentId);
}

export function resolveHandlerForSurface(
  intentId: string,
  surface: CommandSurface,
): string | undefined {
  const entry = getCommandEntry(intentId);
  if (!entry) return undefined;
  return entry.surfaceHandlers?.[surface] ?? entry.handler;
}

export function getAllCommandEntries(): readonly CommandRegistryEntry[] {
  return COMMAND_REGISTRY;
}

export function getCommandsBySurface(
  surface: CommandSurface,
): CommandRegistryEntry[] {
  return COMMAND_REGISTRY.filter((entry) => entry.surfaces.includes(surface));
}

export function getCommandsByModule(apiModule: string): CommandRegistryEntry[] {
  return COMMAND_REGISTRY.filter((entry) => entry.apiModule === apiModule);
}

export function getIntentIdsBySurface(surface: CommandSurface): string[] {
  return getCommandsBySurface(surface).map((entry) => entry.id);
}

export function isRegistryMutating(intentId: string): boolean {
  return getCommandEntry(intentId)?.mutating ?? false;
}

export function getRegistryExecutionMode(
  intentId: string,
): CommandExecutionMode | undefined {
  return getCommandEntry(intentId)?.executionMode;
}

export function isIntentAllowedOnSurface(
  intentId: string,
  surface: CommandSurface,
): boolean {
  const entry = getCommandEntry(intentId);
  return Boolean(entry?.surfaces.includes(surface));
}

export function isIntentAllowedForTier(
  intentId: string,
  tier: AccessTier,
  surface?: CommandSurface,
): boolean {
  const entry = getCommandEntry(intentId);
  if (!entry) return false;
  if (!entry.tiers.includes(tier)) return false;
  if (surface && !entry.surfaces.includes(surface)) return false;
  return true;
}

export function canAppearInCompound(intentId: string): boolean {
  return getCommandEntry(intentId)?.compoundStep ?? false;
}

export function getCompoundRecipesForSurface(
  surface: CommandSurface,
): CompoundCommandRecipe[] {
  return COMPOUND_COMMAND_RECIPES.filter((recipe) =>
    recipe.surfaces.includes(surface),
  );
}

export function getCompoundRecipeById(
  recipeId: string,
): CompoundCommandRecipe | undefined {
  return COMPOUND_COMMAND_RECIPES.find((recipe) => recipe.id === recipeId);
}

/** Resolve which compound handler(s) apply to a surface (supports multiple recipe families). */
export function resolveCompoundRecipesForPrompt(
  surface: CommandSurface,
  prompt: string,
): CompoundCommandRecipe[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];
  const hasCompoundMarker =
    /\band\s+then\b|\bthen\b|\balso\b|\bafter\s+that\b|;\s*|\s+and\s+(?=(?:book|list|show|cancel|mark|pay|create|configure|track|add|remove))/i.test(
      trimmed,
    );
  if (!hasCompoundMarker) return [];
  return getCompoundRecipesForSurface(surface);
}

export function buildCommandRegistryView(
  intentId: string,
): CommandRegistryView | null {
  const entry = getCommandEntry(intentId);
  if (!entry) return null;
  const compoundRecipes = COMPOUND_COMMAND_RECIPES.filter((recipe) =>
    recipe.allowedStepIntentIds.includes(intentId),
  );
  return { intentId, entry, compoundRecipes };
}

export function registrySummaryForPrompt(surface: CommandSurface): string {
  const commands = getCommandsBySurface(surface);
  const compound = getCompoundRecipesForSurface(surface);
  const readOnly = commands.filter(
    (c) => c.executionMode === 'read_only',
  ).length;
  const mutate = commands.filter((c) => c.mutating).length;
  const orchestration = commands.filter(
    (c) => c.executionMode === 'orchestration',
  ).length;
  const compoundCapable = commands.filter((c) => c.compoundStep).length;
  return [
    `Command registry (${surface}): ${commands.length} intents`,
    `read_only=${readOnly} mutating=${mutate} orchestration=${orchestration} compound_steps=${compoundCapable}`,
    `compound_recipes=${compound.map((r) => r.id).join(', ')}`,
  ].join('; ');
}
