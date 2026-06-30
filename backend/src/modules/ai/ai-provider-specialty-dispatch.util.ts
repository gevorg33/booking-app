import { COMMAND_REGISTRY } from './ai-command-registry.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';

const AI_PROVIDER_SPECIALTY_HANDLER = 'AiProviderSpecialtyService';

export function isAiProviderSpecialtyIntentForSurface(
  intentId: string,
  surface: CommandSurface,
): boolean {
  return (
    resolveHandlerForSurface(intentId, surface) === AI_PROVIDER_SPECIALTY_HANDLER
  );
}

export function listAiProviderSpecialtyRegistryIntentIds(): string[] {
  return COMMAND_REGISTRY.filter(
    (entry) => entry.handler === AI_PROVIDER_SPECIALTY_HANDLER,
  )
    .map((entry) => entry.id)
    .sort((a, b) => a.localeCompare(b));
}
