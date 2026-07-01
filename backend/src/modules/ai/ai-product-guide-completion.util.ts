import type { MetaProductGuideIntent } from './ai-meta-product-guide.fixtures.js';
import {
  META_PRODUCT_GUIDE_INTENTS,
  META_PRODUCT_GUIDE_RESCUE_SCENARIOS,
} from './ai-meta-product-guide.fixtures.js';
import { isMetaProductGuideIntent } from './ai-meta-product-guide.util.js';
import {
  EMPTY_STATE_GUIDE_INTENTS,
  EMPTY_STATE_GUIDE_RESCUE_SCENARIOS,
} from './ai-product-guide-empty-state.fixtures.js';
import { isEmptyStateGuideIntent } from './ai-product-guide-empty-state.util.js';
import { PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS } from './ai-provider-product-guide.fixtures.js';
import {
  isProviderProductGuideIntent,
  PROVIDER_PRODUCT_GUIDE_INTENTS,
  type ProviderProductGuideIntent,
} from './ai-provider-product-guide.util.js';
import {
  APP_GUIDE_INTENTS,
  hasProductGuideNavigationCue,
  hasProductGuideScreenCue,
  inferProductGuideIntentFromPrompt,
  isAppGuideIntent,
  isProductGuidePrompt,
  type AppGuideIntent,
} from './ai-product-guide.util.js';

/** All read-only product guide intents across dashboard, customer, public, and provider (ai-guide-1.8.5 + 1.8.7 + 1.8.9). */
export const ALL_PRODUCT_GUIDE_INTENTS = [
  ...APP_GUIDE_INTENTS,
  ...PROVIDER_PRODUCT_GUIDE_INTENTS,
  ...META_PRODUCT_GUIDE_INTENTS,
  ...EMPTY_STATE_GUIDE_INTENTS,
] as const;

export type ProductGuideIntentId = (typeof ALL_PRODUCT_GUIDE_INTENTS)[number];

export const PRODUCT_GUIDE_INTENT_SET = new Set<string>(
  ALL_PRODUCT_GUIDE_INTENTS,
);

export function isAnyProductGuideIntent(
  action: string,
): action is ProductGuideIntentId {
  return PRODUCT_GUIDE_INTENT_SET.has(action);
}

function readStringParam(params: Record<string, unknown>, key: string): string {
  const value = params[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

export function parseAppGuideIntentFromPrompt(
  action: AppGuideIntent,
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  if (readStringParam(params, 'topicId')) return true;
  if (readStringParam(params, 'route')) return true;

  if (action === 'explain_current_screen') {
    return (
      hasProductGuideScreenCue(prompt) ||
      /\bhelp\s+me\s+with\s+this\s+(?:page|screen)\b/i.test(prompt) ||
      inferProductGuideIntentFromPrompt(prompt) === 'explain_current_screen'
    );
  }
  if (action === 'explain_app_feature') {
    return (
      /\bwhat\s+(?:does|is)\b/i.test(prompt) ||
      inferProductGuideIntentFromPrompt(prompt) === 'explain_app_feature' ||
      (isProductGuidePrompt(prompt) &&
        inferProductGuideIntentFromPrompt(prompt) === 'explain_app_feature')
    );
  }
  if (!isProductGuidePrompt(prompt)) return false;

  const inferred = inferProductGuideIntentFromPrompt(prompt);
  return (
    inferred === 'guide_user_flow' ||
    hasProductGuideNavigationCue(prompt) ||
    /\bwalk\s+me\s+through\b/i.test(prompt)
  );
}

export function parseProviderProductGuideIntentFromPrompt(
  action: ProviderProductGuideIntent,
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  if (readStringParam(params, 'topicId')) return true;

  const scenario = PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS.find(
    (row) => row.intent === action,
  );
  if (scenario?.prompt.test(prompt)) return true;
  return false;
}

export function parseMetaProductGuideIntentFromPrompt(
  action: MetaProductGuideIntent,
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  if (readStringParam(params, 'topicId')) return true;
  if (
    action === 'explain_ai_suggestions' &&
    (readStringParam(params, 'suggestionId') ||
      readStringParam(params, 'suggestionChipId'))
  ) {
    return true;
  }

  const scenario = META_PRODUCT_GUIDE_RESCUE_SCENARIOS.find(
    (row) => row.intent === action && row.prompt.test(prompt),
  );
  if (scenario) return true;
  return false;
}

export function parseProductGuideIntentFromPrompt(
  action: string,
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  if (isAppGuideIntent(action)) {
    return parseAppGuideIntentFromPrompt(action, prompt, params);
  }
  if (isProviderProductGuideIntent(action)) {
    return parseProviderProductGuideIntentFromPrompt(action, prompt, params);
  }
  if (isMetaProductGuideIntent(action)) {
    return parseMetaProductGuideIntentFromPrompt(action, prompt, params);
  }
  if (isEmptyStateGuideIntent(action)) {
    return EMPTY_STATE_GUIDE_RESCUE_SCENARIOS.some(
      (row) => row.intent === action && row.prompt.test(prompt),
    );
  }
  return false;
}
