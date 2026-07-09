import {
  isSupportedBusinessCurrency,
  normalizeBusinessCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
  type SupportedBusinessCurrency,
} from '../../common/utils/business-currency.util.js';
import { isConfigureStripeConnectPrompt } from './ai-stripe-connect.util.js';

export const BUSINESS_CURRENCY_INTENTS = [
  'configure_business_currency',
  'explain_business_currency',
  'bulk_update_service_currency',
] as const;

export const BUSINESS_CURRENCY_MUTATE_INTENTS = [
  'configure_business_currency',
  'bulk_update_service_currency',
] as const;

export type BusinessCurrencyIntent = (typeof BUSINESS_CURRENCY_INTENTS)[number];

export function isBusinessCurrencyIntent(
  action: string,
): action is BusinessCurrencyIntent {
  return (BUSINESS_CURRENCY_INTENTS as readonly string[]).includes(action);
}

const CURRENCY_WORD_ALIASES: Record<string, SupportedBusinessCurrency> = {
  dollar: 'USD',
  dollars: 'USD',
  usd: 'USD',
  euro: 'EUR',
  euros: 'EUR',
  eur: 'EUR',
  pound: 'GBP',
  pounds: 'GBP',
  gbp: 'GBP',
  dram: 'AMD',
  drams: 'AMD',
  amd: 'AMD',
  ruble: 'RUB',
  rubles: 'RUB',
  rub: 'RUB',
  lari: 'GEL',
  gel: 'GEL',
  hryvnia: 'UAH',
  uah: 'UAH',
  tenge: 'KZT',
  kzt: 'KZT',
  dirham: 'AED',
  aed: 'AED',
  riyal: 'SAR',
  sar: 'SAR',
  shekel: 'ILS',
  ils: 'ILS',
  lira: 'TRY',
  try: 'TRY',
  franc: 'CHF',
  chf: 'CHF',
  cad: 'CAD',
  aud: 'AUD',
  zloty: 'PLN',
  pln: 'PLN',
  koruna: 'CZK',
  czk: 'CZK',
  krona: 'SEK',
  sek: 'SEK',
  krone: 'NOK',
  nok: 'NOK',
  dkk: 'DKK',
};

const HY_CURRENCY_WORD_ALIASES: Record<string, SupportedBusinessCurrency> = {
  դրամ: 'AMD',
  եվրո: 'EUR',
  ռուբլ: 'RUB',
};

const RU_CURRENCY_WORD_ALIASES: Record<string, SupportedBusinessCurrency> = {
  драм: 'AMD',
  евро: 'EUR',
  рубль: 'RUB',
  рублей: 'RUB',
  рубл: 'RUB',
};

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

const MUTATE_CURRENCY_VERBS =
  /\b(set|switch|change|update)\b[\s\S]{0,40}\b(currency|salon|business)\b/i;

function isConfigureBusinessCurrencyPromptHyRu(prompt: string): boolean {
  if (containsArmenianScript(prompt)) {
    if (
      /(սահմանել|փոխել|թարմացնել|օգտագործել)/i.test(prompt) &&
      /(արժույթ|դրամ|եվրո|ռուբլ|AMD|EUR|RUB|USD)/i.test(prompt)
    ) {
      return true;
    }
  }
  if (containsCyrillicScript(prompt)) {
    if (
      /(установить|сменить|переключить|использовать|обновить)/i.test(prompt) &&
      /(валют|драм|евро|рубл|AMD|EUR|RUB|USD)/i.test(prompt)
    ) {
      return true;
    }
  }
  return false;
}

export function isConfigureBusinessCurrencyPrompt(prompt: string): boolean {
  if (
    /\b(language|languages|locale|locales|լեզու|լեզուներ|язык|языки)\b/i.test(
      prompt,
    ) &&
    !/\b(currency|currencies|արժույթ|валют)\b/i.test(prompt)
  ) {
    return false;
  }
  if (isConfigureBusinessCurrencyPromptHyRu(prompt)) return true;
  const lower = prompt.toLowerCase();
  if (MUTATE_CURRENCY_VERBS.test(prompt)) return true;
  if (/\b(default\s+)?currency\s+to\b/i.test(prompt)) return true;
  if (/\b(switch|change)\b.+\b(salon|business|tenant)\b/i.test(prompt)) {
    return /\b(euro|dollar|ruble|dram|currency|to)\b/i.test(prompt);
  }
  if (/\buse\s+(rubles?|euros?|dollars?|drams?)\b/i.test(lower)) return true;
  return false;
}

export function isBulkUpdateServiceCurrencyPrompt(prompt: string): boolean {
  if (
    isConfigureBusinessCurrencyPrompt(prompt) &&
    parseCurrencyFromPrompt(prompt)
  ) {
    return false;
  }
  if (
    /\b(explain|what(?:'s|\s+is)|which|how many|tell me)\b/i.test(prompt) &&
    !/\b(align|migrate|sync|convert|update|fix|standardize|match)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(align|migrate|sync|convert|match|standardize|fix)\b/i.test(prompt) &&
    /\b(services?|catalog)\b/i.test(prompt) &&
    /\b(currency|currencies|default)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(update|change)\b/i.test(prompt) &&
    /\b(all|existing|catalog)\b/i.test(prompt) &&
    /\b(services?|catalog)\b/i.test(prompt) &&
    /\bcurrenc/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bbulk\b/i.test(prompt) &&
    /\bservice\b/i.test(prompt) &&
    /\bcurrency\b/i.test(prompt)
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    if (
      /(հավասարեցնել|սինք|միգրաց|թարմացնել|փոխարկել)/i.test(prompt) &&
      /(ծառայություն|կատալոգ)/i.test(prompt) &&
      /(արժույթ|default)/i.test(prompt)
    ) {
      return true;
    }
  }
  if (containsCyrillicScript(prompt)) {
    if (
      /(синхронизировать|привести|обновить|мигрировать|выровнять)/i.test(
        prompt,
      ) &&
      /(услуг|каталог)/i.test(prompt) &&
      /(валют|default)/i.test(prompt)
    ) {
      return true;
    }
  }
  return false;
}

export function isExplainBusinessCurrencyPrompt(prompt: string): boolean {
  if (isBulkUpdateServiceCurrencyPrompt(prompt)) return false;
  if (isConfigureStripeConnectPrompt(prompt)) return false;
  if (
    isConfigureBusinessCurrencyPrompt(prompt) &&
    parseCurrencyFromPrompt(prompt)
  ) {
    return false;
  }
  if (
    (/\b(reports?|analytics|operations|p\s*&\s*l|profit\s+(and|&)\s+loss)\b/i.test(
      prompt,
    ) ||
      /\b(staff\s+revenue|service\s+revenue|revenue\s+this\s+month|net\s+profit)\b/i.test(
        prompt,
      )) &&
    /\b(currency|currencies|convert|conversion|fx)\b/i.test(prompt)
  ) {
    return false;
  }
  if (MUTATE_CURRENCY_VERBS.test(prompt)) return false;

  if (
    /\b(explain|describe|show|tell me|what(?:'s|\s+is)|which)\b/i.test(
      prompt,
    ) &&
    /\b(currency|currencies)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(default|business|salon)\s+currency\b/i.test(prompt) &&
    !/\b(set|switch|change|use)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(stripe|online\s+card|card\s+payment|take\s+payment)\b/i.test(prompt) &&
    (/\bcurrency\b/i.test(prompt) || parseCurrencyFromPrompt(prompt))
  ) {
    return true;
  }
  if (
    /\b(stripe|online\s+card|card\s+payment)\b/i.test(prompt) &&
    /\b(support(?:ed)?|accept|take)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(legacy|mismatch(?:ed)?)\b/i.test(prompt) &&
    /\bcurrency\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bhow many\b/i.test(prompt) &&
    /\bservices?\b/i.test(prompt) &&
    /\b(currency|usd|eur|rub|amd)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bservices?\b/i.test(prompt) &&
    /\b(different|other|legacy|mismatch(?:ed)?)\b/i.test(prompt) &&
    /\bcurrency\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\bcurrency\b/i.test(prompt) &&
    /\b(overview|settings?|status|configuration)\b/i.test(prompt)
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    if (
      /(ինչ|որն|որը|բացատր|ցույց տուր)/i.test(prompt) &&
      /արժույթ/i.test(prompt)
    ) {
      return true;
    }
    if (
      /քանի/i.test(prompt) &&
      /ծառայություն/i.test(prompt) &&
      /արժույթ/i.test(prompt)
    ) {
      return true;
    }
    if (/stripe/i.test(prompt) && /(արժույթ|վճար)/i.test(prompt)) {
      return true;
    }
  }
  if (containsCyrillicScript(prompt)) {
    if (
      /(какая|объясни|покажи|расскажи)/i.test(prompt) &&
      /валют/i.test(prompt)
    ) {
      return true;
    }
    if (
      /сколько/i.test(prompt) &&
      /услуг/i.test(prompt) &&
      /валют/i.test(prompt)
    ) {
      return true;
    }
    if (
      /поддерживает/i.test(prompt) &&
      /stripe/i.test(prompt) &&
      /валют/i.test(prompt)
    ) {
      return true;
    }
  }
  return false;
}

export function parseCurrencyFromPrompt(
  prompt: string,
  params?: Record<string, unknown>,
): string | null {
  const fromParams = normalizeBusinessCurrency(
    (params?.currencyCode as string | undefined) ??
      (params?.currency as string | undefined),
  );
  if (fromParams && isSupportedBusinessCurrency(fromParams)) return fromParams;

  for (const code of SUPPORTED_BUSINESS_CURRENCIES) {
    const re = new RegExp(`\\b${code}\\b`, 'i');
    if (re.test(prompt)) return code;
  }

  const lower = prompt.toLowerCase();
  for (const [word, code] of Object.entries(CURRENCY_WORD_ALIASES)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) return code;
  }

  const promptLower = prompt.toLowerCase();
  for (const [word, code] of Object.entries(HY_CURRENCY_WORD_ALIASES)) {
    if (prompt.includes(word) || promptLower.includes(word.toLowerCase()))
      return code;
  }
  for (const [word, code] of Object.entries(RU_CURRENCY_WORD_ALIASES)) {
    if (prompt.includes(word) || promptLower.includes(word.toLowerCase()))
      return code;
  }

  return null;
}

/** NL rescue when classifier mislabels currency configuration or explain prompts. */
export function rescueBusinessCurrencyIntent(
  prompt: string,
  action: string,
): { action: BusinessCurrencyIntent; rescueReason: string } | null {
  if (isBusinessCurrencyIntent(action)) return null;

  if (
    isConfigureBusinessCurrencyPrompt(prompt) &&
    parseCurrencyFromPrompt(prompt)
  ) {
    return {
      action: 'configure_business_currency',
      rescueReason: 'configure_business_currency',
    };
  }

  if (isBulkUpdateServiceCurrencyPrompt(prompt)) {
    return {
      action: 'bulk_update_service_currency',
      rescueReason: 'bulk_update_service_currency',
    };
  }

  if (isExplainBusinessCurrencyPrompt(prompt)) {
    return {
      action: 'explain_business_currency',
      rescueReason: 'explain_business_currency',
    };
  }

  return null;
}
