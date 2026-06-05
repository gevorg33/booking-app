import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBusinessCurrency } from './use-business-currency';
import { SUPPORTED_BUSINESS_CURRENCIES } from '@/lib/business-currency';

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

describe('useBusinessCurrency', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latest: ReturnType<typeof useBusinessCurrency> | null;

  beforeEach(() => {
    latest = null;
    mockBusiness.current = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderHook = () => {
    act(() => {
      root.render(
        <HookProbe
          onReady={(value) => {
            latest = value;
          }}
        />,
      );
    });
  };

  it('defaults to USD when business is absent', () => {
    renderHook();
    expect(latest?.currency).toBe('USD');
    expect(latest?.formatMoney(25)).toContain('$');
  });

  it('reads currency from business.settings', () => {
    mockBusiness.current = { settings: { currency: 'EUR' } };
    renderHook();
    expect(latest?.currency).toBe('EUR');
    expect(latest?.formatMoney(40)).toContain('€');
  });

  it('formatMoney respects entity currency over business default', () => {
    mockBusiness.current = { settings: { currency: 'AMD' } };
    renderHook();
    expect(latest?.formatMoney(99, 'USD')).toContain('$');
  });

  it('returns em dash for empty amounts', () => {
    mockBusiness.current = { settings: { currency: 'GBP' } };
    renderHook();
    expect(latest?.formatMoney(null)).toBe('—');
    expect(latest?.formatMoney('')).toBe('—');
  });

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'supports business currency $code',
    ({ code }) => {
      mockBusiness.current = { settings: { currency: code } };
      renderHook();
      expect(latest?.currency).toBe(code);
      expect(latest?.formatMoney(10)).toBeTruthy();
      expect(latest?.formatMoney(10)).not.toBe('—');
    },
  );
});
