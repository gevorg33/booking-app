import { formatServicePrice } from '@/lib/booking-types';

/** ISO 4217 codes available in dashboard Settings → General (mirrors backend). */
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

export function isStripeChargeCurrencySupported(currency: string): boolean {
  return STRIPE_CHARGE_CURRENCIES.has(currency.trim().toLowerCase());
}

export function readBusinessCurrency(
  settings?: Record<string, unknown> | null,
): SupportedBusinessCurrency {
  const raw =
    (settings?.currency as string | undefined) ??
    (settings?.defaultCurrency as string | undefined);
  const code = typeof raw === 'string' ? raw.trim().toUpperCase() : 'USD';
  return (SUPPORTED_BUSINESS_CURRENCIES as readonly string[]).includes(code)
    ? (code as SupportedBusinessCurrency)
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

/** Resolve display code for a priced entity on a tenant public surface. */
export function resolveTenantPriceCurrency(
  entityCurrency: string | null | undefined,
  tenantCurrency: string | undefined | null,
): string {
  return resolveDisplayCurrency(entityCurrency, tenantCurrency ?? 'USD');
}

export interface FormatBusinessMoneyOptions {
  entityCurrency?: string | null;
  businessCurrency?: string;
}

/** Format a dashboard monetary amount with the business (or entity) currency symbol. */
export function formatBusinessMoney(
  amount: number | string | null | undefined,
  options?: FormatBusinessMoneyOptions,
): string {
  if (amount == null || amount === '') return '—';
  const businessCurrency = options?.businessCurrency ?? 'USD';
  const code = resolveTenantPriceCurrency(options?.entityCurrency, businessCurrency);
  return formatServicePrice(amount, code) ?? `${amount} ${code}`;
}
