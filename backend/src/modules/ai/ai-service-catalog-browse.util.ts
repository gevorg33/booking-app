import { isListServicesCatalogPrompt } from './ai-retail-finance.util.js';
import { extractServiceTypeKeywordFromListPrompt } from './ai-orchestration.helpers.js';
import {
  isProviderRankDiscoveryPrompt,
  isServiceCatalogRankSpecialistPrompt,
} from './ai-service-rank-discovery.util.js';
import { isBudgetAdministrativeOrExplainContext } from './ai-budget-service-discovery.util.js';

const SERVICE_CATALOG_NOUN_PATTERN =
  /\b(?:service|services|option|options|offering|offerings|treatment|treatments)\b/i;

/** Browse / recommend catalog services by category or name — not provider rank or booking. */
export function isServiceCatalogBrowsePrompt(prompt: string): boolean {
  if (!prompt?.trim()) return false;
  if (isBudgetAdministrativeOrExplainContext(prompt)) return false;
  if (isProviderRankDiscoveryPrompt(prompt)) return false;
  if (isServiceCatalogRankSpecialistPrompt(prompt)) return false;

  const recommendsCatalog =
    /\b(?:recommend|suggest)\b/i.test(prompt) &&
    (SERVICE_CATALOG_NOUN_PATTERN.test(prompt) ||
      /\b(?:recommend|suggest)\s+me\b/i.test(prompt));
  const wantsItem = /\bi\s+want\s+(?:a|an|the)\s+/i.test(prompt);
  const asksCatalog =
    isListServicesCatalogPrompt(prompt) ||
    extractServiceTypeKeywordFromListPrompt(prompt) != null;

  if (!recommendsCatalog && !wantsItem && !asksCatalog) return false;

  if (
    /\b(?:who\s+is\s+free|availability|available\s+slots?)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(?:book|schedule|reserve)\b/i.test(prompt) &&
    /\b(?:slot|tomorrow|tonight|today|nearest|soonest|at\s+\d{1,2}|\d{1,2}[:.]\d{2})\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  return true;
}

export function rescueServiceCatalogBrowseIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (!isServiceCatalogBrowsePrompt(prompt)) return null;
  if (
    action !== 'unknown' &&
    action !== 'recommend_specialists' &&
    action !== 'list_services'
  ) {
    return null;
  }
  return {
    action: 'list_services',
    rescueReason: 'catalog_browse',
  };
}
