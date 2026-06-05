import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BookingPaymentBreakdown from './BookingPaymentBreakdown';
import type { BookingPaymentSummary } from '../lib/booking-payment-summary';

const mockBusinessCurrency = vi.hoisted(() => ({ current: 'USD' as string }));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

vi.mock('../lib/use-business-currency', () => ({
  useBusinessCurrency: () => ({
    currency: mockBusinessCurrency.current,
    formatMoney: vi.fn(),
  }),
}));

function expectAmount(text: string | null, currency: string, amount: number) {
  expect(text).toMatch(new RegExp(`${currency}[\\s\u00a0]*${amount}`));
}

function baseSummary(overrides: Partial<BookingPaymentSummary> = {}): BookingPaymentSummary {
  return {
    currency: 'AMD',
    servicePrice: 100,
    subtotal: 80,
    promoDiscount: 10,
    giftCardDiscount: 0,
    loyaltyDiscount: 0,
    loyaltyPointsRedeemed: 0,
    promoCode: null,
    cashPaid: 64,
    retailTotal: 0,
    grandTotal: 64,
    totalDiscount: 10,
    hasDiscounts: true,
    adjustments: [],
    ...overrides,
  };
}

describe('BookingPaymentBreakdown currency integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mockBusinessCurrency.current = 'AMD';
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (summary: BookingPaymentSummary) => {
    act(() => root.render(<BookingPaymentBreakdown summary={summary} />));
  };

  it('renders service price row', () => {
    render(baseSummary());
    expect(container.textContent).toContain('appointments.paymentServicePrice');
    expectAmount(container.textContent, 'AMD', 100);
  });

  it('renders charged amount when subtotal differs from service price', () => {
    render(baseSummary({ servicePrice: 100, subtotal: 80 }));
    expect(container.textContent).toContain('appointments.paymentChargedAmount');
    expectAmount(container.textContent, 'AMD', 80);
  });

  it('hides charged amount when subtotal equals service price', () => {
    render(baseSummary({ servicePrice: 100, subtotal: 100 }));
    expect(container.textContent).not.toContain('appointments.paymentChargedAmount');
  });

  it.each([
    { type: 'promo' as const, label: 'Promo', code: 'SAVE10', key: 'provider.paymentBreakdownPromo' },
    { type: 'gift_card' as const, label: 'Gift', code: 'GIFT5', key: 'provider.paymentBreakdownGiftCard' },
    { type: 'loyalty' as const, label: 'Loyalty', code: undefined, key: 'provider.paymentBreakdownLoyalty' },
    { type: 'retail' as const, label: 'Shampoo', code: undefined, key: 'Shampoo' },
  ])('renders $type adjustment with formatted amount', ({ type, label, code, key }) => {
    render(
      baseSummary({
        adjustments: [{ type, label, code, amount: 12 }],
      }),
    );
    expect(container.textContent).toContain(key);
    expectAmount(container.textContent, 'AMD', 12);
    if (code) expect(container.textContent).toContain(`(${code})`);
  });

  it('renders stacked tax lines before grand total', () => {
    render(
      baseSummary({
        taxEnabled: true,
        taxAmount: 13,
        taxModel: 'exclusive',
        taxLines: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
        grandTotal: 113,
        cashPaid: 113,
      }),
    );
    expect(container.textContent).toContain('GST (5%)');
    expect(container.textContent).toContain('PST (8%)');
    expectAmount(container.textContent, 'AMD', 113);
  });

  it('renders inclusive tax lines with included label and no plus prefix', () => {
    render(
      baseSummary({
        taxEnabled: true,
        taxAmount: 4.76,
        taxModel: 'inclusive',
        taxName: 'VAT',
        taxRate: 5,
        taxLines: [{ id: 'aggregate', name: 'VAT', rate: 5, amount: 4.76 }],
        grandTotal: 100,
        cashPaid: 100,
      }),
    );
    expect(container.textContent).toContain('VAT (5%)');
    expect(container.textContent).toContain('provider.taxIncluded');
    expect(container.textContent).not.toMatch(/\+\s*4/);
  });

  it('renders aggregate tax line from summary fields when taxLines are absent', () => {
    render(
      baseSummary({
        taxEnabled: true,
        taxAmount: 20,
        taxModel: 'exclusive',
        taxName: 'VAT',
        taxRate: 20,
        grandTotal: 120,
        cashPaid: 120,
      }),
    );
    expect(container.textContent).toContain('VAT (20%)');
    expectAmount(container.textContent, 'AMD', 120);
  });

  it('renders loyalty points helper text', () => {
    render(baseSummary({ loyaltyPointsRedeemed: 15.5 }));
    expect(container.textContent).toContain('appointments.paymentLoyaltyPoints');
    expect(container.textContent).toContain('15.50');
  });

  it('renders retail total row when POS products were sold', () => {
    render(baseSummary({ retailTotal: 36, grandTotal: 100, cashPaid: 64 }));
    expect(container.textContent).toContain('retailPos.retailTotal');
    expectAmount(container.textContent, 'AMD', 36);
  });

  it('shows grand total label when retail increases total due', () => {
    render(baseSummary({ retailTotal: 36, grandTotal: 100, cashPaid: 64 }));
    expect(container.textContent).toContain('retailPos.grandTotal');
    expectAmount(container.textContent, 'AMD', 100);
  });

  it('shows fully covered label when cash paid is zero with discounts', () => {
    render(
      baseSummary({
        cashPaid: 0,
        grandTotal: 0,
        retailTotal: 0,
        hasDiscounts: true,
        adjustments: [{ type: 'promo', label: 'Promo', amount: 80 }],
      }),
    );
    expect(container.textContent).toContain('appointments.paymentFullyCovered');
    expectAmount(container.textContent, 'AMD', 0);
  });

  it('shows cash paid label when no retail uplift', () => {
    render(
      baseSummary({
        cashPaid: 64,
        grandTotal: 64,
        retailTotal: 0,
        hasDiscounts: false,
        adjustments: [],
      }),
    );
    expect(container.textContent).toContain('appointments.paymentCashPaid');
    expectAmount(container.textContent, 'AMD', 64);
  });

  it('falls back to cashPaid when grandTotal is absent', () => {
    render(
      baseSummary({
        grandTotal: undefined as unknown as number,
        cashPaid: 42,
        retailTotal: 0,
      }),
    );
    expect(container.textContent).toContain('appointments.paymentCashPaid');
    expectAmount(container.textContent, 'AMD', 42);
  });

  it('treats undefined cashPaid as zero for grand total label', () => {
    render(
      baseSummary({
        cashPaid: undefined as unknown as number,
        grandTotal: 50,
        retailTotal: 50,
        subtotal: 50,
        servicePrice: 50,
      }),
    );
    expect(container.textContent).toContain('retailPos.grandTotal');
    expectAmount(container.textContent, 'AMD', 50);
  });

  it('uses business currency from auth hook for all amounts', () => {
    mockBusinessCurrency.current = 'EUR';
    render(
      baseSummary({
        currency: 'EUR',
        servicePrice: 50,
        subtotal: 50,
        cashPaid: 50,
        grandTotal: 50,
      }),
    );
    expect(container.textContent).toMatch(/€50|50.*€|EUR.*50/);
  });
});
