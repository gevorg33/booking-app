import {
  filterServicesByListServicesPaymentPolicy,
  matchesListServicesPaymentFilter,
} from './ai-list-services-payment-filters.util.js';

export const UPDATE_SERVICE_PRICES_ONLINE_PAYMENT_FILTER_CLASSIFIER_RULES = `- update_service_prices online payment scope (ai-cmd-ext-5.4): when a bulk price percent change should apply only to catalog services with online payment/prepayment enabled, set onlyWithOnlinePayment=true alongside percentChange. Triggers: raise/increase/lower/decrease/adjust prices + with online payment only|only services with online payment|for services with online prepayment|that require online payment. Optional categoryName when category is scoped too. NOT configure_service_online_payment (mutate payment policy), NOT list_services (browse catalog), NOT configure_service_deposit_policy.
- Examples:
  - "Raise prices 10% for services with online payment only" → percentChange=10, onlyWithOnlinePayment=true
  - "Increase all massage prices 5% — only services with online prepayment" → percentChange=5, categoryName=massage, onlyWithOnlinePayment=true
  - "Lower prices 8% on services that require online payment" → percentChange=-8, onlyWithOnlinePayment=true`;

function hasPriceChangeCue(
  prompt: string,
  params: Record<string, unknown>,
): boolean {
  return (
    /\b(raise|increase|lower|decrease|reduce|adjust|change)\b.+\bprice/i.test(
      prompt,
    ) ||
    (/\b\d+\s*%/i.test(prompt) && /\bprice/i.test(prompt)) ||
    params.percentChange != null ||
    params.priceChangePercent != null
  );
}

function hasOnlinePaymentScopeCue(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;

  if (
    /\b(?:without|no|excluding|except)\s+online\s+payment\b/i.test(text) ||
    (/\bno\s+online\s+prepayment\b/i.test(text) &&
      !/\bwith\s+online\s+prepayment\b/i.test(text))
  ) {
    return false;
  }

  if (
    /\bskip\s+cash[\s-]?only\b/i.test(text) &&
    /\bonline\s+payment\b/i.test(text)
  ) {
    return true;
  }

  if (
    /\bcash[\s-]?only\b/i.test(text) &&
    !/\b(?:with|require|accept)\s+online[\s-]?(?:payment|prepayment)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  return (
    /\bwith\s+online[\s-]?(?:payment|prepayment)\s+only\b/i.test(text) ||
    /\bonly\s+(?:for\s+)?(?:services?|offerings?)\s+(?:that\s+)?(?:have|require|accept|with)\s+online[\s-]?(?:payment|prepayment)\b/i.test(
      text,
    ) ||
    /\b(?:services?|offerings?)\s+with\s+online[\s-]?(?:payment|prepayment)\s+only\b/i.test(
      text,
    ) ||
    /\bfor\s+(?:services?|offerings?)\s+with\s+online[\s-]?(?:payment|prepayment)\b/i.test(
      text,
    ) ||
    /\b(?:services?|offerings?)\s+that\s+(?:have|require|accept)\s+online[\s-]?(?:payment|prepayment)\b/i.test(
      text,
    ) ||
    /\bonline[\s-]?payment\s+(?:enabled\s+)?(?:services?|offerings?)\b/i.test(
      text,
    ) ||
    /\bfor\s+online[\s-]?payment\s+(?:services?|offerings?)\b/i.test(text) ||
    /\bthat\s+require\s+online\s+payment\b/i.test(text) ||
    /\baccept\s+online\s+prepayment\s+only\b/i.test(text)
  );
}

export function parseOnlyWithOnlinePaymentFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): boolean | undefined {
  if (params.onlyWithOnlinePayment === true) return true;
  if (params.onlyWithOnlinePayment === false) return false;

  if (!hasOnlinePaymentScopeCue(prompt)) return undefined;
  return true;
}

export function isUpdateServicePricesOnlinePaymentScopePrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  if (!hasPriceChangeCue(prompt, params)) return false;
  return parseOnlyWithOnlinePaymentFromPrompt(prompt, params) === true;
}

export function isUpdateServicePricesOnlinePaymentFilterPrompt(
  prompt: string,
): boolean {
  return isUpdateServicePricesOnlinePaymentScopePrompt(prompt, {});
}

export function enrichUpdateServicePricesParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const onlyWithOnlinePayment = parseOnlyWithOnlinePaymentFromPrompt(
    prompt,
    params,
  );
  if (onlyWithOnlinePayment === undefined) return params;
  return { ...params, onlyWithOnlinePayment };
}

export function filterServicesForUpdateServicePricesOnlinePayment<
  T extends {
    prepaymentMode?: string | null;
    onlinePaymentEnabled?: boolean;
  },
>(services: readonly T[]): T[] {
  return filterServicesByListServicesPaymentPolicy(services, {
    onlinePaymentEnabled: true,
  });
}

export function serviceHasOnlinePayment<
  T extends {
    prepaymentMode?: string | null;
    onlinePaymentEnabled?: boolean;
  },
>(service: T): boolean {
  return matchesListServicesPaymentFilter(service, {
    onlinePaymentEnabled: true,
  });
}

export function rescueUpdateServicePricesOnlinePaymentFilterIntent(
  prompt: string,
  action: string,
): { action: 'update_service_prices'; rescueReason: string } | null {
  if (action === 'update_service_prices') return null;
  if (!isUpdateServicePricesOnlinePaymentFilterPrompt(prompt)) return null;
  return {
    action: 'update_service_prices',
    rescueReason: 'update_service_prices_online_payment_filter',
  };
}
