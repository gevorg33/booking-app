/** Unified post-LLM discover rescue enrichment (discover-1.3). */

import { enrichServiceTierFromPrompt } from '../../common/utils/service-rank-metadata.util.js';
import { enrichBudgetFromPrompt } from './ai-budget-service-discovery.util.js';
import {
  enrichAvailabilitySessionAppendFromPrompt,
  enrichAvailabilitySessionDropFromPrompt,
  enrichAvailabilityWindowsFromPrompt,
  enrichFlexibleAvailabilitySameProviderFromPrompt,
  enrichFlexibleAvailabilityServiceCategoryFromPrompt,
  enrichFlexibleAvailabilitySingleWindowFromPrompt,
  hasAvailabilityOrPattern,
  isAvailabilitySessionAppendPrompt,
  isAvailabilitySessionDropPrompt,
  isFlexibleAvailabilityAnyProviderPrompt,
  isFlexibleAvailabilityTeamWidePrompt,
} from './ai-flexible-availability.util.js';
import {
  enrichServiceRankFromPrompt,
  extractServiceRankServiceCategoryFromPrompt,
} from './ai-service-rank-discovery.util.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import { enrichEmployeeRoleRankFromPrompt } from './ai-employee-role-rank.util.js';

function hasNamedProviderFallbackWindows(
  params: Record<string, unknown>,
): boolean {
  const windows = params.availabilityWindows;
  if (!Array.isArray(windows) || windows.length < 2) return false;
  let hasNamed = false;
  let hasOpen = false;
  for (const window of windows) {
    if (!window || typeof window !== 'object') continue;
    const employeeName = (window as { employeeName?: unknown }).employeeName;
    if (typeof employeeName === 'string' && employeeName.trim()) {
      hasNamed = true;
    } else {
      hasOpen = true;
    }
  }
  return hasNamed && hasOpen;
}

/** Post-LLM rescue step 1 — budget ceiling then catalog rank (discover-1.3). */
export function enrichServiceDiscoveryFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  const enriched = enrichEmployeeRoleRankFromPrompt(
    enrichServiceTierFromPrompt(
      enrichServiceRankFromPrompt(
        enrichBudgetFromPrompt(params, prompt),
        prompt,
      ),
      prompt,
    ),
    prompt,
  );
  if (!prompt?.trim()) return enriched;
  const category = extractServiceRankServiceCategoryFromPrompt(prompt);
  return enrichListServicesParamsFromPrompt(prompt, {
    ...enriched,
    ...(category ? { serviceCategory: category } : {}),
  });
}

/** Multi-turn rank session — budget + rank enrichment with category/rank carry (rank-session-*-en). */
export function enrichRankSessionParamsFromPrompt(
  sessionParams: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  return enrichServiceDiscoveryFromPrompt(sessionParams, prompt);
}

/** Unified discover rescue pipeline — service discovery then OR windows (discover-1.3). */
export function enrichDiscoveryParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string | undefined,
): Record<string, unknown> {
  if (prompt?.trim() && isAvailabilitySessionAppendPrompt(prompt)) {
    return enrichAvailabilitySessionAppendFromPrompt(params, prompt);
  }
  if (prompt?.trim() && isAvailabilitySessionDropPrompt(prompt)) {
    return enrichAvailabilitySessionDropFromPrompt(params, prompt);
  }

  const withDiscovery = enrichServiceDiscoveryFromPrompt(params, prompt);
  let next = withDiscovery;
  if (prompt?.trim() && !/\bgift\s+card\b/i.test(prompt)) {
    next = hasAvailabilityOrPattern(prompt)
      ? enrichFlexibleAvailabilityServiceCategoryFromPrompt(prompt, next)
      : enrichFlexibleAvailabilitySingleWindowFromPrompt(prompt, next);
  }
  let enriched = enrichAvailabilityWindowsFromPrompt(next, prompt);
  if (prompt) {
    enriched = enrichFlexibleAvailabilitySameProviderFromPrompt(
      prompt,
      enriched,
    );
  }
  if (
    prompt?.trim() &&
    (isFlexibleAvailabilityAnyProviderPrompt(prompt) ||
      isFlexibleAvailabilityTeamWidePrompt(prompt)) &&
    enriched.allProviders !== true &&
    !hasNamedProviderFallbackWindows(enriched)
  ) {
    enriched = { ...enriched, allProviders: true };
  }
  return enriched;
}
