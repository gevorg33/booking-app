import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';
import type { PublicCheckoutQuote } from '../lib/types.js';
import {
  ConsumerCheckoutQuoteSummary,
  resolveCheckoutDepositRemainder,
} from './ConsumerCheckoutQuoteSummary.js';

const baseQuote: PublicCheckoutQuote = {
  servicePrice: 100,
  subtotal: 100,
  amountDue: 100,
  currency: 'USD',
};

describe('resolveCheckoutDepositRemainder', () => {
  it('is zero for a full-prepayment service (nothing left to pay at the visit)', () => {
    expect(resolveCheckoutDepositRemainder(baseQuote)).toBe(0);
  });

  it('is the price/prepayment gap for a deposit-mode service', () => {
    expect(
      resolveCheckoutDepositRemainder({ ...baseQuote, servicePrice: 100, subtotal: 25 }),
    ).toBe(75);
  });

  it('is unaffected by promo/gift-card/loyalty discounts — those are shown as separate line items, not owed later', () => {
    expect(
      resolveCheckoutDepositRemainder({
        ...baseQuote,
        servicePrice: 100,
        subtotal: 100,
        amountDue: 80,
        promoDiscount: 20,
        totalDiscount: 20,
      }),
    ).toBe(0);
  });

  it('combines both: a deposit-mode service with a promo discount still owes the un-prepaid remainder', () => {
    expect(
      resolveCheckoutDepositRemainder({
        ...baseQuote,
        servicePrice: 100,
        subtotal: 25,
        amountDue: 15,
        promoDiscount: 10,
        totalDiscount: 10,
      }),
    ).toBe(75);
  });

  it('reflects the combined gap for a multi-service cart where only one line requires prepayment', () => {
    // e.g. a $40 full-prepayment service + a $40 no-prepayment service booked together.
    expect(
      resolveCheckoutDepositRemainder({ ...baseQuote, servicePrice: 80, subtotal: 40 }),
    ).toBe(40);
  });

  it('never goes negative', () => {
    expect(
      resolveCheckoutDepositRemainder({ ...baseQuote, servicePrice: 40, subtotal: 40 }),
    ).toBe(0);
  });
});

describe('ConsumerCheckoutQuoteSummary', () => {
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

  function render(quote: PublicCheckoutQuote) {
    act(() => {
      root.render(
        <ConsumerCheckoutQuoteSummary quote={quote} tenantCurrency="USD" copy={CONSUMER_COPY_EN} />,
      );
    });
  }

  it('shows the deposit notice with the correct remaining amount for a deposit-mode service', () => {
    render({ ...baseQuote, servicePrice: 100, subtotal: 25, amountDue: 25 });
    expect(container.textContent).toContain('This is a deposit');
    expect(container.textContent).toContain('$75.00');
  });

  it('does not show the deposit notice for a full-prepayment service', () => {
    render(baseQuote);
    expect(container.textContent).not.toContain('This is a deposit');
  });

  it('does not show the deposit notice when amountDue is 0 (e.g. covered by subscription credit)', () => {
    render({ ...baseQuote, servicePrice: 100, subtotal: 25, amountDue: 0, totalDiscount: 25 });
    expect(container.textContent).not.toContain('This is a deposit');
  });

  it('does not show the deposit notice when the gap is fully explained by a promo discount', () => {
    render({
      ...baseQuote,
      servicePrice: 100,
      subtotal: 100,
      amountDue: 80,
      promoDiscount: 20,
      totalDiscount: 20,
    });
    expect(container.textContent).not.toContain('This is a deposit');
  });
});
