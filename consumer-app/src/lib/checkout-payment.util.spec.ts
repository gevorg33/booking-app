import { beforeEach, describe, expect, it } from 'vitest';
import { CHECKOUT_PAYMENT_SCENARIOS } from './checkout-payment.fixtures.js';
import {
  clearPendingCheckoutPayment,
  loadPendingCheckoutPayment,
  prepaymentDue,
  requiresOnlinePayment,
  savePendingCheckoutPayment,
  showCashPaymentOption,
} from './checkout-payment.util.js';

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    },
  });
}

describe('checkout-payment.util', () => {
  beforeEach(() => {
    installLocalStorageMock();
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
});
