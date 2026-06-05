import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBusinessCurrency } from './use-business-currency';
import { formatBookingMoney } from './booking-payment-summary';
import { formatBookingBlockHeadline } from './booking-types';

const mockBusiness = vi.hoisted(() => ({
  current: null as { currency?: string } | null,
}));

vi.mock('../services/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector: (state: { business: typeof mockBusiness.current }) => unknown) =>
      selector({ business: mockBusiness.current }),
    {
      getState: () => ({ business: mockBusiness.current }),
    },
  ),
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

describe('useBusinessCurrency provider integration', () => {
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

  const mount = (currency: string | undefined) => {
    mockBusiness.current = currency ? { currency } : null;
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
      surface: 'today-list-headline',
      currency: 'AMD',
      amount: 12000,
      entityCurrency: null as string | null,
      code: 'AMD',
    },
    {
      surface: 'schedule-list-headline',
      currency: 'EUR',
      amount: 45,
      entityCurrency: null,
      code: 'EUR',
    },
    {
      surface: 'payment-breakdown-service-price',
      currency: 'GEL',
      amount: 80,
      entityCurrency: null,
      code: 'GEL',
    },
    {
      surface: 'payment-breakdown-retail-total',
      currency: 'RUB',
      amount: 36,
      entityCurrency: null,
      code: 'RUB',
    },
    {
      surface: 'payment-breakdown-grand-total',
      currency: 'CHF',
      amount: 116,
      entityCurrency: null,
      code: 'CHF',
    },
    {
      surface: 'payment-breakdown-cash-paid',
      currency: 'GBP',
      amount: 64,
      entityCurrency: null,
      code: 'GBP',
    },
    {
      surface: 'legacy-service-usd',
      currency: 'AMD',
      amount: 99,
      entityCurrency: 'USD',
      code: 'USD',
    },
  ])(
    'formats $surface via auth business.currency=$currency',
    ({ surface, currency, amount, entityCurrency, code }) => {
      mount(currency);
      expect(hook?.currency).toBe(currency);

      if (surface.includes('headline')) {
        const headline = formatBookingBlockHeadline({
          startTime: '2026-06-05T10:00:00.000Z',
          endTime: '2026-06-05T11:00:00.000Z',
          status: 'confirmed',
          service: { price: amount, currency: entityCurrency },
          businessCurrency: hook!.currency,
        });
        expect(headline).toBeTruthy();
        if (code === 'AMD') expect(headline).toMatch(/֏|AMD/);
        if (code === 'EUR') expect(headline).toMatch(/€|EUR/);
        if (code === 'USD') expect(headline).toContain('$');
        return;
      }

      const formatted = hook!.formatMoney(amount, entityCurrency);
      expect(formatted).toBeTruthy();
      const viaSummary = formatBookingMoney(amount, entityCurrency, hook!.currency);
      expect(viaSummary).toBe(formatted);
      if (code === 'AMD') expect(formatted).toMatch(/֏|AMD/);
      if (code === 'EUR') expect(formatted).toMatch(/€|EUR/);
      if (code === 'USD') expect(formatted).toContain('$');
    },
  );
});
