/** ISO 4217 codes mirrored from dashboard/public booking (subset). */
export const SUPPORTED_BUSINESS_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'AMD',
  'RUB',
  'GEL',
  'UAH',
  'KZT',
  'AED',
  'SAR',
  'ILS',
  'TRY',
  'CHF',
  'CAD',
  'AUD',
  'PLN',
  'CZK',
  'SEK',
  'NOK',
  'DKK',
] as const;

export function resolveDisplayCurrency(
  entityCurrency?: string | null,
  businessCurrency = 'USD',
): string {
  const code =
    typeof entityCurrency === 'string' ? entityCurrency.trim().toUpperCase() : '';
  if (code && (SUPPORTED_BUSINESS_CURRENCIES as readonly string[]).includes(code)) {
    return code;
  }
  return businessCurrency;
}

export function resolveTenantPriceCurrency(
  entityCurrency: string | null | undefined,
  tenantCurrency: string | undefined | null,
): string {
  return resolveDisplayCurrency(entityCurrency, tenantCurrency ?? 'USD');
}

export function formatConsumerPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatPublicMoney(
  price: number,
  entityCurrency: string | null | undefined,
  tenantCurrency: string | undefined | null,
): string {
  return formatConsumerPrice(
    price,
    resolveTenantPriceCurrency(entityCurrency, tenantCurrency),
  );
}
