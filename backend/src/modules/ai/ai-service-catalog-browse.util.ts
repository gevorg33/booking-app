import { isListServicesCatalogPrompt } from './ai-retail-finance.util.js';
import { isPlainServiceCatalogListPrompt } from './ai-list-services-catalog-cue.util.js';
import { extractServiceTypeKeywordFromListPrompt } from './ai-orchestration.helpers.js';
import {
  isProviderRankDiscoveryPrompt,
  isServiceCatalogRankSpecialistPrompt,
} from './ai-service-rank-discovery.util.js';
import { isBudgetAdministrativeOrExplainContext } from './ai-budget-service-discovery.util.js';

const SERVICE_CATALOG_NOUN_PATTERN =
  /\b(?:service|services|option|options|offering|offerings|treatment|treatments)\b/i;

const CATALOG_BROWSE_RESCUE_FROM = new Set([
  'unknown',
  'recommend_specialists',
  'list_services',
  // e2e-bug.193 — "What services are available?" stolen by multi-service / providers.
  'check_multi_service_block_availability',
  'check_multi_service_availability',
  'check_providers_for_service',
  'check_availability',
]);

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
  // e2e-bug.53 — "Do you offer facemassage services?" is catalog discovery, not unknown.
  const asksOffer =
    /\bdo\s+you\s+offer\b/i.test(prompt) &&
    (SERVICE_CATALOG_NOUN_PATTERN.test(prompt) ||
      extractServiceTypeKeywordFromListPrompt(prompt) != null);
  const asksCatalog =
    isListServicesCatalogPrompt(prompt) ||
    isPlainServiceCatalogListPrompt(prompt) ||
    asksOffer ||
    extractServiceTypeKeywordFromListPrompt(prompt) != null;

  if (!recommendsCatalog && !wantsItem && !asksCatalog) return false;

  // Slot/availability search — but plain "services are available?" is catalog (e2e-193).
  if (
    /\b(?:who\s+is\s+free|available\s+slots?)\b/i.test(prompt) ||
    (/\bavailability\b/i.test(prompt) &&
      !/\bwhat\s+services?\b/i.test(prompt) &&
      !isListServicesCatalogPrompt(prompt))
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
  if (!CATALOG_BROWSE_RESCUE_FROM.has(action)) return null;
  if (action === 'list_services') return null;
  return {
    action: 'list_services',
    rescueReason: 'catalog_browse',
  };
}
