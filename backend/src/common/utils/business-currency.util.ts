/** ISO 4217 codes supported for business default currency (v1 — single currency per tenant). */
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

export type SupportedBusinessCurrency =
  (typeof SUPPORTED_BUSINESS_CURRENCIES)[number];

const SUPPORTED_SET = new Set<string>(SUPPORTED_BUSINESS_CURRENCIES);

/** Stripe Connect charge currencies (common subset for admin warnings). */
export const STRIPE_CHARGE_CURRENCIES = new Set([
  'usd',
  'eur',
  'gbp',
  'amd',
  'rub',
  'gel',
  'uah',
  'kzt',
  'aed',
  'sar',
  'ils',
  'try',
  'chf',
  'cad',
  'aud',
  'pln',
  'czk',
  'sek',
  'nok',
  'dkk',
]);

export function normalizeBusinessCurrency(
  code: string | null | undefined,
): string | null {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(trimmed)) return null;
  return trimmed;
}

export function isSupportedBusinessCurrency(code: string): boolean {
  return SUPPORTED_SET.has(code.toUpperCase());
}

export function assertSupportedBusinessCurrency(code: string): string {
  const normalized = normalizeBusinessCurrency(code);
  if (!normalized || !isSupportedBusinessCurrency(normalized)) {
    throw new Error(`Unsupported currency code: ${code}`);
  }
  return normalized;
}

export function getBusinessDefaultCurrency(
  settings?: Record<string, unknown>,
): string {
  const direct = normalizeBusinessCurrency(
    settings?.currency as string | undefined,
  );
  if (direct && isSupportedBusinessCurrency(direct)) return direct;

  const legacy = normalizeBusinessCurrency(
    settings?.defaultCurrency as string | undefined,
  );
  if (legacy && isSupportedBusinessCurrency(legacy)) return legacy;

  const locale = settings?.locale as Record<string, unknown> | undefined;
  const fromLocale = normalizeBusinessCurrency(
    typeof locale === 'object'
      ? (locale.currency as string | undefined)
      : undefined,
  );
  if (fromLocale && isSupportedBusinessCurrency(fromLocale)) return fromLocale;

  return 'USD';
}

export function isStripeChargeCurrencySupported(currency: string): boolean {
  return STRIPE_CHARGE_CURRENCIES.has(currency.trim().toLowerCase());
}

export function resolvePriceCurrency(
  entityCurrency: string | null | undefined,
  businessSettings?: Record<string, unknown>,
): string {
  const normalized = normalizeBusinessCurrency(entityCurrency ?? undefined);
  if (normalized && isSupportedBusinessCurrency(normalized)) return normalized;
  return getBusinessDefaultCurrency(businessSettings);
}

/** Format a monetary KPI for dashboard/reports (single tenant currency; no FX conversion). */
export function formatBusinessMoney(
  amount: number | string | null | undefined,
  businessSettings?: Record<string, unknown>,
  entityCurrency?: string | null,
): string {
  if (amount == null || amount === '') return '—';
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';

  const currency = resolvePriceCurrency(entityCurrency, businessSettings);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
