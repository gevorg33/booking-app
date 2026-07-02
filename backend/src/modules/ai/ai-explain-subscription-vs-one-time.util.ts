import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS } from './ai-explain-subscription-vs-one-time-multilingual.fixtures.js';
import {
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS,
  type ExplainSubscriptionVsOneTimeFocus,
  type ExplainSubscriptionVsOneTimePromptFixture,
} from './ai-explain-subscription-vs-one-time.fixtures.js';

function extractPlanNameFromPrompt(prompt: string): string | undefined {
  return (
    prompt.match(/["']([^"']+?)["']\s+(?:plan|membership)/i)?.[1]?.trim() ??
    prompt
      .match(
        /\b(?:select|choose|pick)\s+(?:the\s+)?([a-z][\w\s-]{2,40}?)\s+(?:plan|membership)\b/i,
      )?.[1]
      ?.trim()
  );
}

function isBareUseSubscriptionCreditMutatePrompt(prompt: string): boolean {
  if (hasSubscriptionCheckoutCompareCue(prompt)) return false;
  if (/\b(create|assign|extend|cancel)\b/i.test(prompt)) return false;
  if (
    /\b(show|list|view|discover|open)\b/i.test(prompt) &&
    !/\b(use|apply|redeem)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    (/\b(use|apply|redeem)\b/i.test(prompt) &&
      /\b(subscription|membership|credit|visit)s?\b/i.test(prompt)) ||
    (/\b(book|pay)\b/i.test(prompt) &&
      /\b(?:with\s+)?my\s+(subscription|membership|plan)\b/i.test(prompt)) ||
    /\bpay\s+with\s+membership\b/i.test(prompt) ||
    /\buse\s+my\s+membership\b/i.test(prompt)
  );
}

function isBareSelectSubscriptionPlanMutatePrompt(prompt: string): boolean {
  if (hasSubscriptionCheckoutCompareCue(prompt)) return false;
  return (
    /\b(select|choose|pick|sign\s+up\s+for|subscribe\s+to)\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt) &&
    !/\b(discover|list|show\s+all)\b/i.test(prompt)
  );
}

export const EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_INTENTS = [
  'explain_subscription_vs_one_time',
] as const;

export type ExplainSubscriptionVsOneTimeIntent =
  (typeof EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_INTENTS)[number];

export {
  CUSTOMER_PUBLIC_EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_CLASSIFIER_RULES,
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS,
  EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_RESCUE_SCENARIOS,
} from './ai-explain-subscription-vs-one-time.fixtures.js';
export { EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-subscription-vs-one-time-multilingual.fixtures.js';

const HY_RU_SUBSCRIPTION_CHECKOUT_CUE =
  /բաժանորդագրվել|մեկանգամյա|абонемент|разов|подписк|один\s+визит|subscribe.{0,12}save|one[\s-]?time|single\s+visit/iu;

function matchExplainSubscriptionVsOneTimeScenario(
  prompt: string,
):
  | ExplainSubscriptionVsOneTimePromptFixture
  | (typeof EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function isDiscoverSubscriptionPlansListOnlyPrompt(prompt: string): boolean {
  return (
    /\b(what|which|show|list|discover|available|membership)\b/i.test(prompt) &&
    /\b(subscription|membership)\s+plans?\b/i.test(prompt) &&
    !/\b(create|add|update|deactivate|customer|for)\b/i.test(prompt)
  );
}

export function hasSubscriptionCheckoutCompareCue(prompt: string): boolean {
  return (
    /\b(subscribe\s*(?:&|and)\s*save|subscribe\s+and\s+save)\b/i.test(prompt) ||
    /\b(one[\s-]?time|single\s+visit|pay\s+per\s+visit|per\s+visit)\b/i.test(
      prompt,
    ) ||
    /\b(subscription|membership)\b.+\b(?:vs\.?|versus|or|or\s+one)\b/i.test(
      prompt,
    ) ||
    /\b(?:vs\.?|versus|or)\b.+\b(subscription|membership|one[\s-]?time)\b/i.test(
      prompt,
    ) ||
    /\bwhich\s+plan\b.+\b(?:include|cover)\b/i.test(prompt) ||
    /\b(?:include|cover)s?\b.+\b(?:plan|subscription|membership)\b/i.test(
      prompt,
    ) ||
    /\buse\s+my\s+subscription\b.+\b(?:or|vs\.?)\b/i.test(prompt) ||
    /\b(?:or|vs\.?)\b.+\b(?:pay\s+once|one[\s-]?time)\b/i.test(prompt) ||
    /\bcheckout\b.+\b(?:subscription|subscribe|one[\s-]?time)\b/i.test(
      prompt,
    ) ||
    /\bhow\s+(?:do|to)\s+(?:i\s+)?choose\b.+\b(?:one[\s-]?time|subscribe)\b/i.test(
      prompt,
    ) ||
    HY_RU_SUBSCRIPTION_CHECKOUT_CUE.test(prompt)
  );
}

export function inferExplainSubscriptionVsOneTimeFocus(
  prompt: string,
): ExplainSubscriptionVsOneTimeFocus {
  const scenario = matchExplainSubscriptionVsOneTimeScenario(prompt);
  if (scenario?.focus) return scenario.focus;
  if (
    /\buse\s+my\s+subscription\b/i.test(prompt) ||
    /\bsubscription\s+credit\b/i.test(prompt) ||
    /\b(?:or|vs\.?)\b.+\b(?:pay\s+once|one[\s-]?time)\b/i.test(prompt) ||
    /օգտագործ.{0,20}բաժանորդագր|использовать.{0,20}подписк/iu.test(prompt)
  ) {
    return 'useExisting';
  }
  if (
    /\bwhich\s+plan\b/i.test(prompt) ||
    /\b(?:include|cover)s?\b.+\b(?:plan|subscription)\b/i.test(prompt) ||
    /որ\s+պլան|какой\s+план/iu.test(prompt)
  ) {
    return 'whichPlan';
  }
  if (
    /\b(?:explain|how\s+(?:do|to)\s+(?:i\s+)?choose|what\s+are)\b/i.test(
      prompt,
    ) &&
    /\b(?:checkout|options?|choices?)\b/i.test(prompt)
  ) {
    return 'options';
  }
  return 'compare';
}

export function isExplainSubscriptionVsOneTimeIntent(
  action: string,
): action is ExplainSubscriptionVsOneTimeIntent {
  return (
    EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_INTENTS as readonly string[]
  ).includes(action);
}

export function isExplainSubscriptionVsOneTimePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainSubscriptionVsOneTimeScenario(text)) return true;
  if (isBareUseSubscriptionCreditMutatePrompt(text)) {
    return false;
  }
  if (isBareSelectSubscriptionPlanMutatePrompt(text)) return false;
  if (
    /\bmy\b/i.test(text) &&
    /\b(visits?|credits?|membership|subscription)\b/i.test(text) &&
    /\b(left|remaining|expire|renew)\b/i.test(text) &&
    !hasSubscriptionCheckoutCompareCue(text)
  ) {
    return false;
  }
  if (
    isDiscoverSubscriptionPlansListOnlyPrompt(text) &&
    !hasSubscriptionCheckoutCompareCue(text)
  ) {
    return false;
  }
  if (HY_RU_SUBSCRIPTION_CHECKOUT_CUE.test(text)) return true;
  return hasSubscriptionCheckoutCompareCue(text);
}

export function parseExplainSubscriptionVsOneTimeFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  focus: ExplainSubscriptionVsOneTimeFocus;
  serviceName?: string;
  planName?: string;
} | null {
  if (!isExplainSubscriptionVsOneTimePrompt(prompt)) return null;
  const scenario = matchExplainSubscriptionVsOneTimeScenario(prompt);
  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName.trim()) ||
    scenario?.serviceName ||
    extractServiceNameFromPrompt(prompt);
  const planName =
    (typeof params.planName === 'string' && params.planName.trim()) ||
    (scenario && 'planName' in scenario ? scenario.planName : undefined) ||
    extractPlanNameFromPrompt(prompt);
  return {
    focus: scenario?.focus ?? inferExplainSubscriptionVsOneTimeFocus(prompt),
    serviceName: serviceName || undefined,
    planName: planName || undefined,
  };
}

export function enrichExplainSubscriptionVsOneTimeParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseExplainSubscriptionVsOneTimeFromPrompt(prompt, params);
  if (!parsed) return params;
  const next: Record<string, unknown> = { ...params, focus: parsed.focus };
  if (parsed.serviceName) next.serviceName = parsed.serviceName;
  if (parsed.planName) next.planName = parsed.planName;
  return next;
}

export function rescueExplainSubscriptionVsOneTimeIntent(
  prompt: string,
  action: string,
): {
  action: ExplainSubscriptionVsOneTimeIntent;
  rescueReason: string;
} | null {
  if (isExplainSubscriptionVsOneTimeIntent(action)) return null;
  if (!parseExplainSubscriptionVsOneTimeFromPrompt(prompt)) return null;
  return {
    action: 'explain_subscription_vs_one_time',
    rescueReason: 'subscription_vs_one_time',
  };
}

export function detectExplainSubscriptionVsOneTimeAction(
  prompt: string,
): ExplainSubscriptionVsOneTimeIntent | null {
  return isExplainSubscriptionVsOneTimePrompt(prompt)
    ? 'explain_subscription_vs_one_time'
    : null;
}
