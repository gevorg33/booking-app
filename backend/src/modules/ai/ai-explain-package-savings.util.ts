import { isCompareServicesPrompt } from './ai-compare-services.util.js';
import { isDiscoverPackagesPrompt } from './ai-customer-crm.util.js';
import { isExplainServicePricePrompt } from './ai-explain-service-price.util.js';
import { EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS } from './ai-explain-package-savings-multilingual.fixtures.js';
import {
  EXPLAIN_PACKAGE_SAVINGS_PROMPTS,
  type ExplainPackageSavingsPromptFixture,
} from './ai-explain-package-savings.fixtures.js';
import {
  extractPackageNameFromPrompt,
  isBookPackagePrompt,
  isCheckPackageAvailabilityPrompt,
} from './ai-self-service-booking.util.js';

export {
  CUSTOMER_PUBLIC_EXPLAIN_PACKAGE_SAVINGS_CLASSIFIER_RULES,
  EXPLAIN_PACKAGE_SAVINGS_PROMPTS,
  EXPLAIN_PACKAGE_SAVINGS_RESCUE_SCENARIOS,
} from './ai-explain-package-savings.fixtures.js';

const HY_RU_PACKAGE_SAVINGS_CUE =
  /փաթեթ.{0,20}(էժան|խնայ)|spa day.{0,20}(փաթեթ|խնայ)|пакет.{0,20}(дешев|эконом)|эконом.{0,20}(пакет|spa day)/iu;

function matchExplainPackageSavingsScenario(
  prompt: string,
): ExplainPackageSavingsPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_PACKAGE_SAVINGS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isExplainPackageSavingsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainPackageSavingsScenario(text)) return true;
  // e2e-bug.132 — "whats the deal if i cancel" is cancel policy, not package pricing.
  if (
    /\b(cancel|cancellation|cancelation)\b/i.test(text) &&
    !hasPackageTargetCue(text)
  ) {
    return false;
  }
  if (isDiscoverPackagesPrompt(text) && !hasPackageSavingsCue(text))
    return false;
  if (isCheckPackageAvailabilityPrompt(text) && !hasPackageSavingsCue(text)) {
    return false;
  }
  if (isBookPackagePrompt(text)) return false;
  if (isCompareServicesPrompt(text) && !hasPackageTargetCue(text)) return false;
  if (isExplainServicePricePrompt(text) && !hasPackageTargetCue(text)) {
    return false;
  }
  if (HY_RU_PACKAGE_SAVINGS_CUE.test(text)) return true;
  return hasPackageSavingsCue(text) && hasPackageTargetCue(text);
}

function hasPackageSavingsCue(prompt: string): boolean {
  return (
    /\b(save|saving|savings|cheaper|worth|deal|discount|econom|economy|compare|versus|vs\.?|separate|individually|à\s*la\s*carte|a\s*la\s*carte)\b/i.test(
      prompt,
    ) || /\b(how\s+much|is\s+it|what\s+is\s+the)\b/i.test(prompt)
  );
}

/** Real package/bundle target — bare "deal" alone is colloquial ("what's the deal"), not a package. */
function hasPackageTargetCue(prompt: string): boolean {
  return /\b(package|bundle|spa\s+day|spa\s+package)\b/i.test(prompt);
}

export function enrichExplainPackageSavingsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const scenario = matchExplainPackageSavingsScenario(prompt);
  const packageName =
    (typeof params.packageName === 'string' && params.packageName.trim()) ||
    scenario?.packageName ||
    extractPackageNameFromPrompt(prompt);
  if (packageName) next.packageName = packageName;
  return next;
}

export function rescueExplainPackageSavingsIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_package_savings';
  rescueReason: string;
} | null {
  if (action === 'explain_package_savings') return null;
  if (!isExplainPackageSavingsPrompt(prompt)) return null;
  return {
    action: 'explain_package_savings',
    rescueReason: 'package_savings',
  };
}

export function detectExplainPackageSavingsAction(
  prompt: string,
): 'explain_package_savings' | null {
  return isExplainPackageSavingsPrompt(prompt)
    ? 'explain_package_savings'
    : null;
}
