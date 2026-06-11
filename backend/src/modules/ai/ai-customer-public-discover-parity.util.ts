import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';

/** Surface-specific post-LLM discover enrichment (section G parity). */
export function enrichDiscoverParityParamsForSurface(
  surface: 'public' | 'customer',
  prompt: string,
  classifierParams: Record<string, unknown>,
  catalog: Array<{ id: string; name: string }>,
  action: string,
): Record<string, unknown> {
  if (surface === 'public') {
    return enrichPublicAssistantParamsFromPrompt(
      prompt,
      classifierParams,
      catalog,
      action,
    );
  }
  return enrichDiscoveryParamsFromPrompt({ ...classifierParams }, prompt);
}
