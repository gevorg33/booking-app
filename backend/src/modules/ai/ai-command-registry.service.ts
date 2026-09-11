import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { AccessTier } from './access-control.matrix.js';
import { REGISTRY_VALIDATION_ERRORS } from './ai-command-registry.js';
import {
  buildCommandRegistryView,
  canAppearInCompound,
  getAllCommandEntries,
  getCommandEntry,
  getCommandsByModule,
  getCommandsBySurface,
  getCompoundRecipeById,
  getCompoundRecipesForSurface,
  getIntentIdsBySurface,
  getRegistryExecutionMode,
  isIntentAllowedOnSurface,
  isRegistryMutating,
  registrySummaryForPrompt,
  resolveCompoundRecipesForPrompt,
  resolveHandlerForSurface,
} from './ai-command-registry.util.js';
import type {
  CommandRegistryEntry,
  CommandRegistryView,
  CommandSurface,
  CompoundCommandRecipe,
} from './ai-command-registry.types.js';

@Injectable()
export class AiCommandRegistryService implements OnModuleInit {
  private readonly logger = new Logger(AiCommandRegistryService.name);

  onModuleInit(): void {
    if (REGISTRY_VALIDATION_ERRORS.length) {
      this.logger.warn(
        `Command registry drift (${REGISTRY_VALIDATION_ERRORS.length}): ${REGISTRY_VALIDATION_ERRORS.slice(0, 5).join('; ')}`,
      );
    }
  }

  getEntry(intentId: string): CommandRegistryEntry | undefined {
    return getCommandEntry(intentId);
  }

  handlerForSurface(
    intentId: string,
    surface: CommandSurface,
  ): string | undefined {
    return resolveHandlerForSurface(intentId, surface);
  }

  listAll(): readonly CommandRegistryEntry[] {
    return getAllCommandEntries();
  }

  listBySurface(surface: CommandSurface): CommandRegistryEntry[] {
    return getCommandsBySurface(surface);
  }

  listByModule(apiModule: string): CommandRegistryEntry[] {
    return getCommandsByModule(apiModule);
  }

  intentIdsForSurface(surface: CommandSurface): string[] {
    return getIntentIdsBySurface(surface);
  }

  isMutating(intentId: string): boolean {
    return isRegistryMutating(intentId);
  }

  executionMode(intentId: string) {
    return getRegistryExecutionMode(intentId);
  }

  allowedOnSurface(intentId: string, surface: CommandSurface): boolean {
    return isIntentAllowedOnSurface(intentId, surface);
  }

  supportsCompoundStep(intentId: string): boolean {
    return canAppearInCompound(intentId);
  }

  compoundRecipes(surface: CommandSurface): CompoundCommandRecipe[] {
    return getCompoundRecipesForSurface(surface);
  }

  compoundRecipe(recipeId: string): CompoundCommandRecipe | undefined {
    return getCompoundRecipeById(recipeId);
  }

  resolveCompoundHandlers(
    surface: CommandSurface,
    prompt: string,
  ): CompoundCommandRecipe[] {
    return resolveCompoundRecipesForPrompt(surface, prompt);
  }

  view(intentId: string): CommandRegistryView | null {
    return buildCommandRegistryView(intentId);
  }

  summary(surface: CommandSurface): string {
    return registrySummaryForPrompt(surface);
  }
}
