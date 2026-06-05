import { resolveTenantPriceCurrency } from '@/lib/business-currency';

export function formatPublicPrice(price: number, currency: string, locale?: string): string {
  try {
    const intlLocale =
      locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-GB' : undefined;
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
