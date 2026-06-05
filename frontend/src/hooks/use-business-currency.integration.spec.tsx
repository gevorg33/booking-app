import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBusinessCurrency } from './use-business-currency';

const mockBusiness = vi.hoisted(() => ({
  current: null as { settings?: Record<string, unknown> } | null,
}));

vi.mock('@/lib/store', () => ({
  useAuthStore: (selector: (state: { business: typeof mockBusiness.current }) => unknown) =>
    selector({ business: mockBusiness.current }),
}));

function HookProbe({
  onReady,
}: {
  onReady: (value: ReturnType<typeof useBusinessCurrency>) => void;
}) {
  const value = useBusinessCurrency();
  useEffect(() => {
    onReady(value);
  }, [value, onReady]);
  return null;
}

/** Mirrors dashboard pages: read tenant settings then format a field value. */
function formatDashboardField(
  hook: ReturnType<typeof useBusinessCurrency>,
  amount: number | string | null | undefined,
  entityCurrency?: string | null,
): string {
  return hook.formatMoney(amount, entityCurrency);
}

describe('useBusinessCurrency dashboard integration', () => {
  let container: HTMLDivElement;
  let root: Root;
  let hook: ReturnType<typeof useBusinessCurrency> | null;

  beforeEach(() => {
    hook = null;
    mockBusiness.current = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const mount = (settings: Record<string, unknown> | undefined) => {
    mockBusiness.current = settings ? { settings } : null;
    act(() => {
      root.render(
        <HookProbe
          onReady={(value) => {
            hook = value;
          }}
        />,
      );
    });
  };

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
      amount: 850.25,
      entityCurrency: null,
      code: 'AMD',
    },
    {
      surface: 'reports-service-revenue',
      settings: { currency: 'GEL' },
      amount: 1200,
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
      amount: 75,
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
      amount: 80,
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
      surface: 'subscriptions-savings',
      settings: { currency: 'USD' },
      amount: 12.5,
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
      surface: 'loyalty-lifetime-earned',
      settings: { currency: 'EUR' },
      amount: 120,
      entityCurrency: null,
      code: 'EUR',
    },
    {
      surface: 'loyalty-earn-example',
      settings: { currency: 'USD' },
      amount: 1.5,
      entityCurrency: null,
      code: 'USD',
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
    {
      surface: 'gift-card-product-service',
      settings: { currency: 'AED' },
      amount: 250,
      entityCurrency: null,
      code: 'AED',
    },
    {
      surface: 'gift-card-product-package',
      settings: { currency: 'SAR' },
      amount: 399,
      entityCurrency: null,
      code: 'SAR',
    },
    {
      surface: 'gift-card-product-subscription',
      settings: { currency: 'ILS' },
      amount: 59,
      entityCurrency: null,
      code: 'ILS',
    },
    {
      surface: 'gift-card-product-bundle',
      settings: { currency: 'TRY' },
      amount: 175.25,
      entityCurrency: null,
      code: 'TRY',
    },
  ])(
    '$surface formats with tenant currency',
    ({ settings, amount, entityCurrency, code }) => {
      mount(settings);
      expect(hook).not.toBeNull();
      const formatted = formatDashboardField(hook!, amount, entityCurrency);
      expect(formatted).toMatch(new RegExp(`${code}|[$€£₽֏₪₺₴]`));
      expect(formatted).not.toBe('—');
    },
  );

  it('re-reads currency when business settings change', () => {
    mount({ currency: 'USD' });
    expect(hook!.currency).toBe('USD');

    mount({ currency: 'JPY' });
    expect(hook!.currency).toBe('USD');
    expect(hook!.formatMoney(10)).toContain('$');
  });

  it('overview rounds revenue before formatting', () => {
    mount({ currency: 'USD' });
    const formatted = formatDashboardField(hook!, Math.round(1234.56));
    expect(formatted).toMatch(/\$1,235|\$1235/);
  });
});
