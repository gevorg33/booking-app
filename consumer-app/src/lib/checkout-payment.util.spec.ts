import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHECKOUT_PAYMENT_SCENARIOS } from './checkout-payment.fixtures.js';
import {
  clearPendingCheckoutPayment,
  loadPendingCheckoutPayment,
  prepaymentDue,
  requiresOnlinePayment,
  savePendingCheckoutPayment,
  showCashPaymentOption,
} from './checkout-payment.util.js';

describe('checkout-payment.util', () => {
  beforeEach(() => {
    localStorage.clear();
    clearPendingCheckoutPayment();
  });

  it.each(CHECKOUT_PAYMENT_SCENARIOS)(
    'payment options $id',
    ({ profile, service, quote, paymentMethod, showCash, requiresOnline }) => {
      expect(showCashPaymentOption(profile, service, quote)).toBe(showCash);
      expect(
        requiresOnlinePayment(service, quote, paymentMethod ?? 'online'),
      ).toBe(requiresOnline);
    },
  );

  it('computes prepayment due for deposit services', () => {
    expect(
      prepaymentDue({
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        price: 100,
        depositAmount: 25,
      }),
    ).toBe(25);
  });

  it('caps prepayment due at the service price when depositAmount exceeds it', () => {
    expect(
      prepaymentDue({
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        price: 100,
        depositAmount: 150,
      }),
    ).toBe(100);
  });

  it('charges the full price up front when prepaymentMode is full', () => {
    expect(
      prepaymentDue({
        onlinePaymentEnabled: true,
        prepaymentMode: 'full',
        price: 75,
        depositAmount: undefined,
      }),
    ).toBe(75);
  });

  it('falls back to 50% of price when prepaymentMode is deposit with no depositAmount set', () => {
    expect(
      prepaymentDue({
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        price: 100,
        depositAmount: undefined,
      }),
    ).toBe(50);
  });

  it('rounds the 50% deposit fallback sanely to the nearest cent for odd prices', () => {
    expect(
      prepaymentDue({
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        price: 33.33,
        depositAmount: undefined,
      }),
    ).toBe(16.67);
  });

  // Regression: IEEE-754 makes 19.99 * 50 evaluate to 999.4999999999999 instead
  // of the exact 999.5 tie, so a naive Math.round(price * 50) / 100 silently
  // rounds down to $9.99 instead of the correct $10.00 half of $19.99 — a real
  // undercharge on one of the most common real-world price points.
  it('does not undercharge the 50% deposit fallback on exact-half-cent ties like $19.99', () => {
    expect(
      prepaymentDue({
        onlinePaymentEnabled: true,
        prepaymentMode: 'deposit',
        price: 19.99,
        depositAmount: undefined,
      }),
    ).toBe(10);
  });

  it('hides cash for deposit-mode services using the 50% fallback (no explicit depositAmount), not just explicit deposits', () => {
    expect(
      showCashPaymentOption(
        { acceptCashPayments: true },
        {
          onlinePaymentEnabled: true,
          prepaymentMode: 'deposit',
          price: 100,
          depositAmount: undefined,
        },
        { servicePrice: 100, subtotal: 100, amountDue: 50, currency: 'USD' },
      ),
    ).toBe(false);
  });

  it('allows cash for a deposit-mode service when nothing is actually due online (onlinePaymentEnabled false)', () => {
    expect(
      showCashPaymentOption(
        { acceptCashPayments: true },
        {
          onlinePaymentEnabled: false,
          prepaymentMode: 'deposit',
          price: 100,
          depositAmount: 25,
        },
        { servicePrice: 100, subtotal: 100, amountDue: 100, currency: 'USD' },
      ),
    ).toBe(true);
  });

  // e2e-bug.180 — onlinePaymentEnabled is computed server-side as (business
  // Stripe Connect ready) && (prepaymentMode !== 'none'), so a service can
  // report prepaymentMode: 'full' while onlinePaymentEnabled is false (e.g.
  // Stripe disconnected). showCashPaymentOption/requiresOnlinePayment used to
  // read prepaymentMode directly instead of the already-gated prepaymentDue(),
  // which excluded cash AND forced online payment for a business that can't
  // actually take it online — a checkout dead end.
  it('allows cash for a full-prepayment service when onlinePaymentEnabled is false', () => {
    expect(
      showCashPaymentOption(
        { acceptCashPayments: true },
        {
          onlinePaymentEnabled: false,
          prepaymentMode: 'full',
          price: 100,
          depositAmount: null,
        },
        { servicePrice: 100, subtotal: 100, amountDue: 100, currency: 'USD' },
      ),
    ).toBe(true);
  });

  it('does not require online payment for a full-prepayment service when onlinePaymentEnabled is false', () => {
    expect(
      requiresOnlinePayment(
        {
          onlinePaymentEnabled: false,
          prepaymentMode: 'full',
          price: 100,
          depositAmount: null,
        },
        { servicePrice: 100, subtotal: 100, amountDue: 100, currency: 'USD' },
        'online',
      ),
    ).toBe(false);
  });

  it('stores pending checkout payment for resume confirm', () => {
    savePendingCheckoutPayment({
      slug: 'salon-a',
      sessionId: 'cs_test',
      serviceId: 'svc-1',
      startTime: '2026-06-10T10:00:00.000Z',
    });
    expect(loadPendingCheckoutPayment('salon-a')?.sessionId).toBe('cs_test');
    expect(loadPendingCheckoutPayment('salon-b')).toBeNull();
    clearPendingCheckoutPayment();
    expect(loadPendingCheckoutPayment('salon-a')).toBeNull();
  });

  // e2e checklist — return-flow reconciliation: without this TTL, an abandoned
  // checkout's storage entry hijacks every future fresh visit to the same
  // service's book page (confirmed live — silently substitutes a stale, even
  // past-dated schedule and gets stuck retrying a dead Stripe session forever).
  describe('stale pending-checkout TTL', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('still resumes a checkout abandoned minutes ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-10T10:00:00.000Z'));
      savePendingCheckoutPayment({
        slug: 'salon-a',
        sessionId: 'cs_test',
        serviceId: 'svc-1',
        startTime: '2026-06-10T11:00:00.000Z',
      });
      vi.setSystemTime(new Date('2026-06-10T10:05:00.000Z'));
      expect(loadPendingCheckoutPayment('salon-a')?.sessionId).toBe('cs_test');
    });

    it('ignores a pending checkout abandoned more than 24h ago instead of resuming it forever', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T10:00:00.000Z'));
      savePendingCheckoutPayment({
        slug: 'salon-a',
        sessionId: 'cs_stale',
        serviceId: 'svc-1',
        startTime: '2026-06-01T11:00:00.000Z',
      });
      vi.setSystemTime(new Date('2026-06-11T10:00:00.000Z'));
      expect(loadPendingCheckoutPayment('salon-a')).toBeNull();
    });
  });
});
