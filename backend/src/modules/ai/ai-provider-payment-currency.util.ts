import {
  isExplainCheckoutTotalPrompt,
  isExplainPaymentStatusPrompt,
} from './ai-payments.util.js';
import { isExplainRecommendationSetupPrompt } from './ai-recommendation-product.util.js';

export const PROVIDER_PAYMENT_CURRENCY_INTENTS = [
  'explain_provider_payment_currency',
] as const;

export type ProviderPaymentCurrencyIntent =
  (typeof PROVIDER_PAYMENT_CURRENCY_INTENTS)[number];

export function isProviderPaymentCurrencyIntent(
  action: string,
): action is ProviderPaymentCurrencyIntent {
  return (PROVIDER_PAYMENT_CURRENCY_INTENTS as readonly string[]).includes(
    action,
  );
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasProviderPaymentCurrencyContext(prompt: string): boolean {
  if (
    /(?:reports?|analytics|հաշվետվ|отчёт|отчет|p\s*&\s*l|operations)/i.test(
      prompt,
    ) &&
    /(?:currency|արժույթ|валют|դրամ|€|֏)/i.test(prompt)
  ) {
    return false;
  }

  if (
    /(?:stripe|online|онлайн|առցանց|списал)/i.test(prompt) &&
    !/(?:pos|касс|кассе|разбивк|breakdown|կասս)/i.test(prompt)
  ) {
    return false;
  }

  return (
    /\b(pos|point\s+of\s+sale|payment\s+breakdown|appointment\s+payment|grand\s+total|collect\s+(?:cash|payment)|retail\s+(?:add|sale|upsell|line)|chair\s+sale|provider\s+app)\b/i.test(
      prompt,
    ) ||
    /\b(my\s+(?:appointment|booking)\s+payment|booking\s+breakdown)\b/i.test(
      prompt,
    ) ||
    (/(?:կասս|pos|breakdown|appointment)/i.test(prompt) &&
      /(?:վճար|գումար|դրամ)/i.test(prompt)) ||
    (/(?:վճար|գումար)/i.test(prompt) &&
      /(?:դրամ|֏|ցուցադրվ|կասս|pos)/i.test(prompt) &&
      !/(?:stripe|առցանց|գանձում)/i.test(prompt)) ||
    /(?:касс|разбивк|pos)/i.test(prompt)
  );
}

export function isExplainProviderPaymentCurrencyPrompt(
  prompt: string,
): boolean {
  if (isExplainRecommendationSetupPrompt(prompt)) return false;
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (isExplainPaymentStatusPrompt(prompt) && !hasCurrencyCue(prompt)) {
    return false;
  }
  if (!hasProviderPaymentCurrencyContext(prompt)) return false;

  const hasCurrencyCueFlag = hasCurrencyCue(prompt);

  if (
    /\bwhy\b.+\b(payment|breakdown|total|pos|grand\s+total|amount)\b/i.test(
      prompt,
    ) &&
    hasCurrencyCueFlag
  ) {
    return true;
  }

  if (/\bwhat currency\b/i.test(prompt)) {
    return true;
  }

  if (
    /\b(why|what|which)\b/i.test(prompt) &&
    hasCurrencyCueFlag &&
    /\b(payment|breakdown|pos|total|retail|appointment|collect)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(currency|money)\b/i.test(prompt) &&
    /\b(payment|breakdown|pos|total|retail|appointment)\b/i.test(prompt)
  ) {
    return /\b(why|what|which|explain|collect)\b/i.test(prompt);
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|որն|որը|որ)/i.test(prompt) &&
      /(արժույթ|վճար|գումար|pos|կասս|€|֏|₽|AMD|EUR|RUB|USD)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|какая|какой|объясни)/i.test(prompt) &&
      /(валют|оплат|разбивк|pos|касс|€|֏|₽|рубл|евро|драм)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

function hasCurrencyCue(prompt: string): boolean {
  return (
    /[€֏₽$£]/.test(prompt) ||
    /\b(currency|dram|drams|euro|euros|ruble|rubles|dollar|dollars)\b/i.test(
      prompt,
    ) ||
    /\b(AMD|EUR|RUB|USD|GBP|GEL)\b/i.test(prompt)
  );
}

export function rescueProviderPaymentCurrencyIntent(
  prompt: string,
  action: string,
): { action: ProviderPaymentCurrencyIntent; rescueReason: string } | null {
  if (isProviderPaymentCurrencyIntent(action)) return null;
  if (!isExplainProviderPaymentCurrencyPrompt(prompt)) return null;
  return {
    action: 'explain_provider_payment_currency',
    rescueReason: 'explain_provider_payment_currency',
  };
}
