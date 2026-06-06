import { hasNotificationCurrencyContext } from './ai-notification-currency.util.js';
import { isExplainCheckoutTotalPrompt } from './ai-payments.util.js';

export const PACKAGE_CURRENCY_INTENTS = ['explain_package_currency'] as const;

export type PackageCurrencyIntent = (typeof PACKAGE_CURRENCY_INTENTS)[number];

export function isPackageCurrencyIntent(
  action: string,
): action is PackageCurrencyIntent {
  return (PACKAGE_CURRENCY_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasPackageOrGiftCardContext(prompt: string): boolean {
  return (
    /\b(package|gift\s*card|gift-card|bundle|voucher|preset\s+amount|spa\s+day)\b/i.test(
      prompt,
    ) ||
    /(?:փաթեթ|նվեր|քարտ)/i.test(prompt) ||
    /(?:пакет|подарочн|сертификат)/i.test(prompt)
  );
}

function isPackageDisplayNameExplainPrompt(prompt: string): boolean {
  if (
    /\b(currency|dram|drams|total|price|amount|priced?|€|֏|₽|\$|AMD|EUR|RUB|USD)\b/i.test(
      prompt,
    ) ||
    /[€֏₽$]/.test(prompt) ||
    /(արժույթ|գումար|գին|валют|драм|рубл|евро)/i.test(prompt)
  ) {
    return false;
  }

  const hasPackage =
    /\bpackage\b/i.test(prompt) || /(փաթեթ|пакет)/i.test(prompt);
  if (!hasPackage) return false;
  const hasDisplaySurface =
    /\b(display\s+name|localized|title|titled|shown|called|named|label)\b/i.test(
      prompt,
    ) ||
    /\bname\b/i.test(prompt) ||
    /(անուն|назван|называ)/i.test(prompt);
  if (!hasDisplaySurface) return false;
  return (
    /\b(what|which|why|how|does|show|explain|title|titled|visitors?|called|named)\b/i.test(
      prompt,
    ) ||
    /(ինչ|բացատր|ցուցադր|անուն|почему|какой|называ)/i.test(prompt)
  );
}

export function isExplainPackageCurrencyPrompt(prompt: string): boolean {
  if (isPackageDisplayNameExplainPrompt(prompt)) return false;
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (hasNotificationCurrencyContext(prompt)) return false;
  if (
    /\b(tax|vat|gst|incl\.?|sales\s*tax)\b/i.test(prompt) ||
    /(հարկ|incl)/i.test(prompt) ||
    /(налог|ндс|incl)/i.test(prompt)
  ) {
    return false;
  }
  if (!hasPackageOrGiftCardContext(prompt)) return false;

  const hasCurrencyCue =
    /[€֏₽$£]/.test(prompt) ||
    /\b(currency|dram|drams|euro|euros|ruble|rubles|dollar|dollars|total|amount|priced?)\b/i.test(
      prompt,
    ) ||
    /\b(AMD|EUR|RUB|USD|GBP|GEL)\b/i.test(prompt);

  if (
    /\bwhy\b.+\b(total|price|amount|package|gift\s*card)\b/i.test(prompt) &&
    hasCurrencyCue
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
    /\b(package|gift\s*card|gift-card|bundle|preset)\b/i.test(prompt)
  ) {
    return /\b(why|what|which|explain)\b/i.test(prompt);
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|որն|որը|որ)/i.test(prompt) &&
      /(արժույթ|գին|գումար|փաթեթ|նվեր|քարտ|€|֏|₽|AMD|EUR|RUB|USD)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|какая|какой|объясни)/i.test(prompt) &&
      /(валют|цен|сумм|пакет|подарочн|€|֏|₽|рубл|евро|драм)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescuePackageCurrencyIntent(
  prompt: string,
  action: string,
): { action: PackageCurrencyIntent; rescueReason: string } | null {
  if (isPackageCurrencyIntent(action)) return null;
  if (!isExplainPackageCurrencyPrompt(prompt)) return null;
  return {
    action: 'explain_package_currency',
    rescueReason: 'explain_package_currency',
  };
}
