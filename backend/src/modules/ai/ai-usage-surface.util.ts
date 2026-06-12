import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiUsageSurface } from '../integrations/openai/openai.types.js';

/** Map command registry surfaces to OpenAI usage telemetry surfaces. */
export function commandSurfaceToAiUsageSurface(
  surface: CommandSurface,
): AiUsageSurface {
  if (surface === 'provider') return 'provider_mobile';
  if (surface === 'public') return 'public_booking';
  return surface;
}
