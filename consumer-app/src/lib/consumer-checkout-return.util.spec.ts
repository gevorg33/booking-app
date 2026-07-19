import { describe, expect, it } from 'vitest';
import {
  isCheckoutPaymentReturnQuery,
  mergeMultiCheckoutReturnQuery,
  mergePackageCheckoutReturnQuery,
  parseCheckoutReturnRoute,
  resolveCheckoutReturnNavigationPath,
} from './consumer-checkout-return.util.js';
import { savePendingMultiCheckoutPayment } from './multi-service-checkout-payment.util.js';
import { savePendingPackageCheckoutPayment } from './package-checkout-payment.util.js';

describe('consumer-checkout-return.util', () => {
  it('parses web package Stripe success URLs', () => {
    const route = parseCheckoutReturnRoute(
      'https://book.example.com/book/glow-nails/packages/pkg-spa/checkout?paid=1&packageId=pkg-spa&session_id=cs_test_123',
    );
    expect(route).toEqual({
      kind: 'package',
      slug: 'glow-nails',
      packageId: 'pkg-spa',
      query: expect.any(URLSearchParams),
    });
    expect(route?.query.get('session_id')).toBe('cs_test_123');
  });

  it('parses web multi-service Stripe success URLs', () => {
    const route = parseCheckoutReturnRoute(
      'https://book.example.com/book/glow-nails/multi/checkout?paid=1&services=a%2Cb&session_id=cs_multi',
    );
    expect(route?.kind).toBe('multi');
    expect(route?.slug).toBe('glow-nails');
    expect(route?.query.get('services')).toBe('a,b');
  });

  it('maps package return to consumer checkout path', () => {
    const route = parseCheckoutReturnRoute(
      'https://book.example.com/book/salon/packages/pkg-1/checkout?session_id=cs_1',
    );
    expect(route).not.toBeNull();
    expect(resolveCheckoutReturnNavigationPath(route!)).toBe(
      '/s/salon/book/packages/pkg-1/checkout?session_id=cs_1',
    );
  });

  it('maps single-service web checkout to BookPage params', () => {
    const route = parseCheckoutReturnRoute(
      'https://book.example.com/book/salon/checkout?paid=1&serviceId=svc-1&startTime=2026-06-09T14%3A00%3A00.000Z&session_id=cs_single',
    );
    expect(route?.kind).toBe('single');
    const path = resolveCheckoutReturnNavigationPath(route!);
    expect(path.startsWith('/s/salon/book/svc-1?')).toBe(true);
    const bookParams = new URLSearchParams(path.split('?')[1] ?? '');
    expect(bookParams.get('paid')).toBe('1');
    expect(bookParams.get('slot')).toBe('2026-06-09T14:00:00.000Z');
    expect(bookParams.get('date')).toBe('2026-06-09');
    expect(bookParams.get('session_id')).toBe('cs_single');
  });

  it('e2e-bug.18 parses consumer-app single-service Stripe return URLs', () => {
    const route = parseCheckoutReturnRoute(
      'http://localhost:5174/s/salon/book/svc-1?paid=1&slot=2026-06-09T14%3A00%3A00.000Z&date=2026-06-09&session_id=cs_single',
    );
    expect(route).toEqual({
      kind: 'single',
      slug: 'salon',
      serviceId: 'svc-1',
      query: expect.any(URLSearchParams),
    });
    expect(resolveCheckoutReturnNavigationPath(route!)).toContain('/s/salon/book/svc-1?');
  });

  it('restores package lines from pending payment when Stripe omits them', () => {
    const lines = [
      {
        serviceId: 'svc-a',
        employeeId: 'emp-1',
        startTime: '2026-06-09T10:00:00.000Z',
      },
    ];
    savePendingPackageCheckoutPayment({
      slug: 'salon',
      sessionId: 'cs_pkg',
      packageId: 'pkg-1',
      lines,
    });
    const merged = mergePackageCheckoutReturnQuery(
      'salon',
      'pkg-1',
      new URLSearchParams('paid=1&session_id=cs_pkg'),
    );
    expect(merged.get('lines')).toBe(JSON.stringify(lines));
    expect(merged.get('session_id')).toBe('cs_pkg');
  });

  it('restores multi-service ids from pending payment when Stripe omits them', () => {
    savePendingMultiCheckoutPayment({
      slug: 'salon',
      sessionId: 'cs_multi',
      serviceIds: ['svc-a', 'svc-b'],
    });
    const merged = mergeMultiCheckoutReturnQuery(
      'salon',
      new URLSearchParams('paid=1&session_id=cs_multi'),
    );
    expect(merged.get('services')).toBe('svc-a,svc-b');
    expect(merged.get('session_id')).toBe('cs_multi');
  });

  it('detects payment return query signals', () => {
    expect(isCheckoutPaymentReturnQuery(new URLSearchParams('session_id=cs_1'))).toBe(true);
    expect(isCheckoutPaymentReturnQuery(new URLSearchParams('paid=1'))).toBe(true);
    expect(isCheckoutPaymentReturnQuery(new URLSearchParams())).toBe(false);
  });
});
