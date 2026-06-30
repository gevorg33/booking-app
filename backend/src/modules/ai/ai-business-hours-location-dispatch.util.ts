import { COMMAND_REGISTRY } from './ai-command-registry.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';

const AI_BUSINESS_HOURS_LOCATION_HANDLER = 'AiBusinessHoursLocationService';

export function isAiBusinessHoursLocationIntentForSurface(
  intentId: string,
  surface: CommandSurface,
): boolean {
  return (
    resolveHandlerForSurface(intentId, surface) ===
    AI_BUSINESS_HOURS_LOCATION_HANDLER
  );
}

export function listAiBusinessHoursLocationRegistryIntentIds(): string[] {
  return COMMAND_REGISTRY.filter(
    (entry) => entry.handler === AI_BUSINESS_HOURS_LOCATION_HANDLER,
  )
    .map((entry) => entry.id)
    .sort((a, b) => a.localeCompare(b));
}
