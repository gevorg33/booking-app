import { describe, expect, it } from 'vitest';
import {
  loadPendingMultiCheckoutBySlug,
  loadPendingMultiCheckoutPayment,
  multiServiceIdsMatch,
  requiresMultiServiceOnlinePayment,
  resolveMultiServiceAmountDue,
  savePendingMultiCheckoutPayment,
  showMultiServiceCashOption,
} from './multi-service-checkout-payment.util.js';

describe('multi-service-checkout-payment.util', () => {
  it('resolves amount due from quote', () => {
    expect(resolveMultiServiceAmountDue({ amountDue: 42 } as never, 100)).toBe(42);
    expect(resolveMultiServiceAmountDue(null, 80)).toBe(80);
  });

  it('matches service id sets regardless of order', () => {
    expect(multiServiceIdsMatch(['b', 'a'], ['a', 'b'])).toBe(true);
    expect(multiServiceIdsMatch(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  it('shows cash when tenant accepts cash and payment is due', () => {
    expect(
      showMultiServiceCashOption(
        { acceptCashPayments: true, onlinePaymentsEnabled: true },
        50,
      ),
    ).toBe(true);
    expect(
      showMultiServiceCashOption(
        { acceptCashPayments: false, onlinePaymentsEnabled: true },
        50,
      ),
    ).toBe(false);
  });

  it('requires online payment unless cash is selected', () => {
    expect(
      requiresMultiServiceOnlinePayment({ onlinePaymentsEnabled: true }, 50, 'online'),
    ).toBe(true);
    expect(
      requiresMultiServiceOnlinePayment({ onlinePaymentsEnabled: true }, 50, 'cash'),
    ).toBe(false);
    expect(
      requiresMultiServiceOnlinePayment({ onlinePaymentsEnabled: true }, 0, 'online'),
    ).toBe(false);
  });

  it('persists and loads pending multi checkout by slug and services', () => {
    savePendingMultiCheckoutPayment({
      slug: 'Salon-A',
      sessionId: 'sess-1',
      serviceIds: ['svc-b', 'svc-a'],
    });
    expect(loadPendingMultiCheckoutPayment('salon-a', ['a', 'b'])).toBeNull();
    expect(loadPendingMultiCheckoutPayment('salon-a', ['svc-a', 'svc-b'])?.sessionId).toBe(
      'sess-1',
    );
    expect(loadPendingMultiCheckoutBySlug('salon-a')?.serviceIds).toEqual(['svc-b', 'svc-a']);
  });
});
