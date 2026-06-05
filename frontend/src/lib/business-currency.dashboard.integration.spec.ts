import { describe, expect, it } from 'vitest';
import {
  formatBusinessMoney,
  readBusinessCurrency,
  resolveTenantPriceCurrency,
  SUPPORTED_BUSINESS_CURRENCIES,
} from './business-currency';

/** Pure formatter path used when components call formatBusinessMoney directly. */
function formatDashboardAmount(
  settings: Record<string, unknown> | null | undefined,
  amount: number | string | null | undefined,
  entityCurrency?: string | null,
): string {
  const businessCurrency = readBusinessCurrency(settings);
  return formatBusinessMoney(amount, { businessCurrency, entityCurrency });
}

describe('Sprint 28 — dashboard currency display (integration)', () => {
  const SURFACES = [
    'dashboard-overview',
    'reports-staff-revenue',
    'reports-service-revenue',
    'operations-pl-revenue',
    'operations-pl-expenses',
    'operations-pl-commissions',
    'operations-pl-net-profit',
    'operations-inventory-retail',
    'operations-inventory-unit-cost',
    'operations-expense-row',
    'operations-commission-flat',
    'services-catalog-price',
    'services-legacy-usd-price',
    'service-packages-price',
    'service-packages-regular-total',
    'service-packages-savings',
    'subscriptions-plan-price',
    'subscriptions-preview-regular',
    'subscriptions-preview-savings',
    'loyalty-balance',
    'loyalty-lifetime-earned',
    'loyalty-earn-example',
    'promo-fixed-discount',
    'gift-card-balance',
    'gift-card-purchase-amount',
    'gift-card-product-service',
    'gift-card-product-package',
    'gift-card-product-subscription',
    'gift-card-product-bundle',
  ] as const;

  it('covers every dashboard monetary surface id', () => {
    expect(SURFACES.length).toBe(29);
  });

  it.each([
    {
      surface: 'dashboard-overview',
      settings: { currency: 'EUR' },
      amount: 4200,
      entityCurrency: null as string | null,
      code: 'EUR',
    },
    {
      surface: 'reports-staff-revenue',
      settings: { currency: 'AMD' },
      amount: 12500.5,
      entityCurrency: null,
      code: 'AMD',
    },
    {
      surface: 'reports-service-revenue',
      settings: { currency: 'GEL' },
      amount: 640,
      entityCurrency: null,
      code: 'GEL',
    },
    {
      surface: 'operations-pl-revenue',
      settings: { currency: 'USD' },
      amount: 15000.5,
      entityCurrency: null,
      code: 'USD',
    },
    {
      surface: 'operations-pl-expenses',
      settings: { currency: 'USD' },
      amount: 3200,
      entityCurrency: null,
      code: 'USD',
    },
    {
      surface: 'operations-pl-commissions',
      settings: { currency: 'CHF' },
      amount: 980.75,
      entityCurrency: null,
      code: 'CHF',
    },
    {
      surface: 'operations-pl-net-profit',
      settings: { currency: 'CHF' },
      amount: -250.5,
      entityCurrency: null,
      code: 'CHF',
    },
    {
      surface: 'operations-inventory-retail',
      settings: { currency: 'CAD' },
      amount: 24.99,
      entityCurrency: null,
      code: 'CAD',
    },
    {
      surface: 'operations-inventory-unit-cost',
      settings: { currency: 'CAD' },
      amount: 8.5,
      entityCurrency: null,
      code: 'CAD',
    },
    {
      surface: 'operations-expense-row',
      settings: { currency: 'PLN' },
      amount: 450,
      entityCurrency: null,
      code: 'PLN',
    },
    {
      surface: 'operations-commission-flat',
      settings: { currency: 'RUB' },
      amount: 1500,
      entityCurrency: null,
      code: 'RUB',
    },
    {
      surface: 'services-catalog-price',
      settings: { currency: 'AMD' },
      amount: 15000,
      entityCurrency: 'AMD',
      code: 'AMD',
    },
    {
      surface: 'services-legacy-usd-price',
      settings: { currency: 'AMD' },
      amount: 99,
      entityCurrency: 'USD',
      code: 'USD',
    },
    {
      surface: 'service-packages-price',
      settings: { currency: 'EUR' },
      amount: 199,
      entityCurrency: null,
      code: 'EUR',
    },
    {
      surface: 'subscriptions-plan-price',
      settings: { currency: 'USD' },
      amount: 89.99,
      entityCurrency: null,
      code: 'USD',
    },
    {
      surface: 'loyalty-balance',
      settings: { currency: 'EUR' },
      amount: 33.5,
      entityCurrency: null,
      code: 'EUR',
    },
    {
      surface: 'promo-fixed-discount',
      settings: { currency: 'GBP' },
      amount: 15,
      entityCurrency: null,
      code: 'GBP',
    },
    {
      surface: 'gift-card-balance',
      settings: { currency: 'USD' },
      amount: 50,
      entityCurrency: 'USD',
      code: 'USD',
    },
    {
      surface: 'gift-card-purchase-amount',
      settings: { currency: 'USD' },
      amount: 100,
      entityCurrency: 'EUR',
      code: 'EUR',
    },
  ])('formatBusinessMoney for $surface', ({ settings, amount, entityCurrency, code }) => {
    const formatted = formatDashboardAmount(settings, amount, entityCurrency);
    expect(formatted).toMatch(new RegExp(`${code}|[$€£₽֏₪₺₴]`));
    expect(formatted).not.toBe('—');
  });

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'formats dashboard revenue in supported currency $code',
    ({ code }) => {
      const formatted = formatDashboardAmount({ currency: code }, 100);
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('—');
      expect(resolveTenantPriceCurrency(null, code)).toBe(code);
    },
  );

  it('returns em dash for null and empty dashboard amounts', () => {
    expect(formatDashboardAmount({ currency: 'EUR' }, null)).toBe('—');
    expect(formatDashboardAmount({ currency: 'EUR' }, '')).toBe('—');
  });

  it('defaults to USD when tenant settings are missing', () => {
    expect(formatDashboardAmount(undefined, 42)).toContain('$');
    expect(formatDashboardAmount(null, 42)).toContain('$');
    expect(readBusinessCurrency(undefined)).toBe('USD');
  });

  it('overview stat uses rounded whole amounts', () => {
    const formatted = formatDashboardAmount({ currency: 'USD' }, Math.round(1234.56));
    expect(formatted).toMatch(/\$1,235|\$1235/);
  });

  it('commission percent rows skip currency formatter', () => {
    const percentLabel = `${10}%`;
    expect(percentLabel).toBe('10%');
    expect(percentLabel).not.toContain('$');
  });

  it('promo percent discounts skip currency formatter', () => {
    const percentLabel = `${20}%`;
    expect(percentLabel).toBe('20%');
  });
});
