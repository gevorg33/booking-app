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

export function readBusinessCurrency(
  currency?: string | null,
): (typeof SUPPORTED_BUSINESS_CURRENCIES)[number] {
  const code = typeof currency === 'string' ? currency.trim().toUpperCase() : 'USD';
  return (SUPPORTED_BUSINESS_CURRENCIES as readonly string[]).includes(code)
    ? (code as (typeof SUPPORTED_BUSINESS_CURRENCIES)[number])
    : 'USD';
}

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

export function formatProviderPrice(amount: number, currency: string): string {
  const code = currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

export function formatProviderMoney(
  amount: number | string | null | undefined,
  entityCurrency: string | null | undefined,
  businessCurrency: string | undefined | null,
): string {
  if (amount == null || amount === '') return '—';
  const code = resolveTenantPriceCurrency(entityCurrency, businessCurrency);
  return formatProviderPrice(Number(amount), code);
}
