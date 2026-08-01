import { afterEach, describe, expect, it, vi } from 'vitest';
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

  // e2e checklist — return-flow reconciliation: without this TTL, an abandoned
  // multi-service checkout hijacks every future fresh visit to the same checkout
  // page (confirmed live for the equivalent package flow — silently substitutes a
  // stale schedule and gets stuck retrying a dead Stripe session forever).
  describe('stale pending-checkout TTL', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('still resumes a multi-service checkout abandoned minutes ago', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-08T09:00:00.000Z'));
      savePendingMultiCheckoutPayment({
        slug: 'salon-a',
        sessionId: 'sess-multi-fresh',
        serviceIds: ['svc-a', 'svc-b'],
      });
      vi.setSystemTime(new Date('2026-06-08T09:05:00.000Z'));
      expect(loadPendingMultiCheckoutBySlug('salon-a')?.sessionId).toBe('sess-multi-fresh');
    });

    it('ignores a multi-service checkout abandoned more than 24h ago instead of resuming it forever', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-01T09:00:00.000Z'));
      savePendingMultiCheckoutPayment({
        slug: 'salon-a',
        sessionId: 'sess-multi-stale',
        serviceIds: ['svc-a', 'svc-b'],
      });
      vi.setSystemTime(new Date('2026-06-11T09:00:00.000Z'));
      expect(loadPendingMultiCheckoutBySlug('salon-a')).toBeNull();
    });
  });
});
