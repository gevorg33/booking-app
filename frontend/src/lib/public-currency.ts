import { resolveTenantPriceCurrency } from '@/lib/business-currency';
import { toIntlLocale } from '@/lib/app-locale';

/**
 * e2e-bug.115 — never pass `undefined` to Intl.NumberFormat: Node SSR and the
 * browser can disagree on the runtime default locale (e.g. `344,25 $` vs `$344.25`),
 * which causes a React hydration mismatch. Match date-format: fixed `en-GB` fallback.
 */
export function formatPublicPrice(price: number, currency: string, locale?: string): string {
  try {
    const intlLocale = toIntlLocale(locale) ?? 'en-GB';
    return new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

/** Format a public-booking price using tenant currency when entity code is absent. */
export function formatPublicMoney(
  price: number,
  entityCurrency: string | null | undefined,
  tenantCurrency: string | undefined | null,
  locale?: string,
): string {
  return formatPublicPrice(
    price,
    resolveTenantPriceCurrency(entityCurrency, tenantCurrency),
    locale,
  );
}
