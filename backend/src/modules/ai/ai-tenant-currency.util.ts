import { isExplainCheckoutTotalPrompt } from './ai-payments.util.js';

export const TENANT_CURRENCY_INTENTS = ['explain_tenant_currency'] as const;

export type TenantCurrencyIntent = (typeof TENANT_CURRENCY_INTENTS)[number];

export function isTenantCurrencyIntent(
  action: string,
): action is TenantCurrencyIntent {
  return (TENANT_CURRENCY_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasConsumerAppContext(prompt: string): boolean {
  return (
    /\b(consumer app|salon app|mobile app|the app|in-app|in the app|my app|this app)\b/i.test(
      prompt,
    ) ||
    /\bafter (?:i |you )?(?:log(?:ged)?\s*in|sign(?:ed)?\s*in|opening the salon)\b/i.test(
      prompt,
    ) ||
    /\b(?:profile|account)\s+(?:load(?:s|ed)?|open(?:s|ed)?)\b/i.test(prompt) ||
    /\bonce (?:my |your )?profile\b/i.test(prompt) ||
    /(?:հավելված|ապ(?:ի)?|մուտք|պրոֆիլ)/i.test(prompt) ||
    /(?:приложени|после входа|профил|мобильн)/i.test(prompt)
  );
}

export function isExplainTenantCurrencyPrompt(prompt: string): boolean {
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (!hasConsumerAppContext(prompt)) return false;

  const hasCurrencyCue =
    /[€֏₽$£]/.test(prompt) ||
    /\b(currency|dram|drams|euro|euros|ruble|rubles|dollar|dollars)\b/i.test(
      prompt,
    ) ||
    /\b(AMD|EUR|RUB|USD|GBP|GEL)\b/i.test(prompt);

  if (
    /\bwhy\b.+\b(prices?|amounts?|costs?)\b.+\b(show|display|in|use|see)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (/\bwhat currency\b/i.test(prompt)) {
    return true;
  }

  if (/\b(why|what|which)\b/i.test(prompt) && hasCurrencyCue) {
    return true;
  }

  if (
    /\b(currency|money)\b/i.test(prompt) &&
    /\b(prices?|app)\b/i.test(prompt)
  ) {
    return /\b(why|what|which|explain)\b/i.test(prompt);
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|որն|որը|որ)/i.test(prompt) &&
      /(արժույթ|գին|գները|€|֏|₽|AMD|EUR|RUB|USD)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|какая|какой|объясни)/i.test(prompt) &&
      /(валют|цен|€|֏|₽|рубл|евро|драм)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueTenantCurrencyIntent(
  prompt: string,
  action: string,
): { action: TenantCurrencyIntent; rescueReason: string } | null {
  if (isTenantCurrencyIntent(action)) return null;
  if (!isExplainTenantCurrencyPrompt(prompt)) return null;
  return {
    action: 'explain_tenant_currency',
    rescueReason: 'explain_tenant_currency',
  };
}
