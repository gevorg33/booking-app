/** Unified post-LLM discover rescue enrichment (discover-1.3). */

import { enrichBudgetFromPrompt } from './ai-budget-service-discovery.util.js';
import { enrichAvailabilityWindowsFromPrompt } from './ai-flexible-availability.util.js';
import { enrichServiceRankFromPrompt } from './ai-service-rank-discovery.util.js';

/** Post-LLM rescue step 1 — budget ceiling then catalog rank (discover-1.3). */
export function enrichServiceDiscoveryFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  return enrichServiceRankFromPrompt(
    enrichBudgetFromPrompt(params, prompt),
    prompt,
  );
}

/** Unified discover rescue pipeline — service discovery then OR windows (discover-1.3). */
export function enrichDiscoveryParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  return enrichAvailabilityWindowsFromPrompt(
    enrichServiceDiscoveryFromPrompt(params, prompt),
    prompt,
  );
}
