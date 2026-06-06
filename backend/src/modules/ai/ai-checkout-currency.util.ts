import { hasPackageOrGiftCardContext } from './ai-package-currency.util.js';
import { hasStripeCheckoutCurrencyContext } from './ai-stripe-checkout-currency.util.js';
import { hasReportsCurrencyContext } from './ai-reports-currency.util.js';
import { isExplainCheckoutTotalPrompt } from './ai-payments.util.js';

export const CHECKOUT_CURRENCY_INTENTS = [
  'explain_checkout_currency',
] as const;

export type CheckoutCurrencyIntent = (typeof CHECKOUT_CURRENCY_INTENTS)[number];

export function isCheckoutCurrencyIntent(
  action: string,
): action is CheckoutCurrencyIntent {
  return (CHECKOUT_CURRENCY_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasBookingPageDisplayContext(prompt: string): boolean {
  return (
    /\b(booking page|checkout|this page|on this page|catalog|prices?|amounts?|costs?|shown|display(?:ed)?|here)\b/i.test(
      prompt,
    ) ||
    /(?:գին|գները|էջ|ցուցադր)/i.test(prompt) ||
    /(?:цен|страниц|записи|сайт|показан)/i.test(prompt) ||
    /[€֏₽$£]/.test(prompt)
  );
}

export function isExplainCheckoutCurrencyPrompt(prompt: string): boolean {
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (hasReportsCurrencyContext(prompt)) return false;
  if (hasStripeCheckoutCurrencyContext(prompt)) return false;
  if (hasPackageOrGiftCardContext(prompt)) return false;

  const hasCurrencyCue =
    /[€֏₽$£]/.test(prompt) ||
    /\b(currency|dram|drams|euro|euros|ruble|rubles|dollar|dollars)\b/i.test(
      prompt,
    ) ||
    /\b(AMD|EUR|RUB|USD|GBP|GEL)\b/i.test(prompt);

  const bookingPageContext = hasBookingPageDisplayContext(prompt);

  if (
    /\bwhy\b.+\b(prices?|amounts?|costs?)\b.+\b(show|display|in|use|see)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (/\bwhat currency\b/i.test(prompt) && bookingPageContext) {
    return true;
  }

  if (
    /\b(why|what|which)\b/i.test(prompt) &&
    hasCurrencyCue &&
    bookingPageContext
  ) {
    return true;
  }

  if (
    /\b(currency|money)\b/i.test(prompt) &&
    /\b(booking page|checkout|prices?|this page)\b/i.test(prompt)
  ) {
    return /\b(why|what|which|explain)\b/i.test(prompt);
  }

  if (containsArmenianScript(prompt)) {
    if (/(հաշվետվ|վերլուծ)/i.test(prompt)) return false;
    if (
      /(ինչու|ինչ|որն|որը|որ)/i.test(prompt) &&
      /(արժույթ|գին|գները|€|֏|₽|AMD|EUR|RUB|USD)/i.test(prompt) &&
      /(էջ|ցուցադր|գին|գները)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (/(отчёт|отчет|аналитик|выручк|p\s*&\s*l|операци)/i.test(prompt)) {
      return false;
    }
    if (
      /(почему|зачем|какая|какой|объясни)/i.test(prompt) &&
      /(валют|цен|€|֏|₽|рубл|евро|драм)/i.test(prompt) &&
      /(цен|страниц|записи|сайт|показан)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueCheckoutCurrencyIntent(
  prompt: string,
  action: string,
): { action: CheckoutCurrencyIntent; rescueReason: string } | null {
  if (isCheckoutCurrencyIntent(action)) return null;
  if (!isExplainCheckoutCurrencyPrompt(prompt)) return null;
  return {
    action: 'explain_checkout_currency',
    rescueReason: 'explain_checkout_currency',
  };
}
