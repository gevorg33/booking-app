import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CheckoutTaxSummary } from './CheckoutTaxSummary';

describe('CheckoutTaxSummary', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (quote: Parameters<typeof CheckoutTaxSummary>[0]['quote']) => {
    act(() =>
      root.render(
        <CheckoutTaxSummary
          quote={quote}
          currency="USD"
          tenantCurrency="USD"
          labels={{
            subtotal: 'Subtotal',
            totalDue: 'Total due',
            taxIncluded: 'included',
          }}
        />,
      ),
    );
  };

  it('renders stacked exclusive tax lines and total due', () => {
    render({
      subtotal: 100,
      amountDue: 113,
      taxEnabled: true,
      taxModel: 'exclusive',
      taxAmount: 13,
      taxRules: [
        { id: 'gst', name: 'GST', rate: 5, amount: 5 },
        { id: 'pst', name: 'PST', rate: 8, amount: 8 },
      ],
    });

    expect(container.textContent).toContain('Subtotal');
    expect(container.textContent).toContain('GST (5%)');
    expect(container.textContent).toContain('PST (8%)');
    expect(container.textContent).toContain('Total due');
    expect(container.textContent).toMatch(/113/);
  });

  it('marks inclusive tax lines and omits plus prefix', () => {
    render({
      subtotal: 95.24,
      amountDue: 100,
      taxEnabled: true,
      taxModel: 'inclusive',
      taxAmount: 4.76,
      taxName: 'VAT',
      taxRate: 5,
    });

    expect(container.textContent).toContain('VAT (5%) (included)');
    expect(container.textContent).not.toContain('+');
  });

  it('hides tax rows when tax is disabled', () => {
    render({
      subtotal: 100,
      amountDue: 100,
      taxEnabled: false,
      taxAmount: 0,
    });

    expect(container.textContent).not.toContain('VAT');
    expect(container.textContent).toMatch(/100/);
  });

  it('falls back to tenant currency when summary currency is absent', () => {
    act(() =>
      root.render(
        <CheckoutTaxSummary
          quote={{ amountDue: 85, taxEnabled: false }}
          currency={null}
          tenantCurrency="EUR"
          labels={{
            subtotal: 'Subtotal',
            totalDue: 'Total due',
            taxIncluded: 'included',
          }}
        />,
      ),
    );

    expect(container.textContent).toMatch(/85/);
    expect(container.textContent).toMatch(/EUR|€/);
  });

  it('defaults subtotal and total to zero when quote amounts are absent', () => {
    act(() =>
      root.render(
        <CheckoutTaxSummary
          quote={{ taxEnabled: false }}
          currency="USD"
          tenantCurrency="USD"
          labels={{
            subtotal: 'Subtotal',
            totalDue: 'Total due',
            taxIncluded: 'included',
          }}
        />,
      ),
    );

    expect(container.textContent).toMatch(/0/);
  });

  it('uses subtotal for both rows when amountDue is missing', () => {
    act(() =>
      root.render(
        <CheckoutTaxSummary
          quote={{ subtotal: 75, taxEnabled: false }}
          currency="USD"
          tenantCurrency="USD"
          labels={{
            subtotal: 'Subtotal',
            totalDue: 'Total due',
            taxIncluded: 'included',
          }}
        />,
      ),
    );

    expect(container.textContent).toMatch(/75/);
  });
});
