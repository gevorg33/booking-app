import { describe, expect, it } from 'vitest';
import {
  derivePublicBookingStepFromPathname,
  buildPublicAssistantPageContext,
  extractPublicAssistantQueryContext,
} from './public-booking-assistant-context.util';

describe('public-booking-assistant-context.util (ai-guide-1.5.3 / e2e-bug.106)', () => {
  it.each([
    { pathname: '/book/demo/professionals', step: 'professionals' as const },
    { pathname: '/book/demo/services', step: 'services' as const },
    { pathname: '/book/demo/checkout', step: 'checkout' as const },
    { pathname: '/book/demo/any', step: 'professionals' as const },
    { pathname: '/book/demo/review', step: 'checkout' as const },
    { pathname: '/s/salon/book/service-id', step: 'checkout' as const },
    // e2e-bug.124 — landing / catalog pages are not checkout
    { pathname: '/book/demo', step: undefined },
    { pathname: '/book/pollin-clinic-3b7fb9d8', step: undefined },
    { pathname: '/book/demo/gift-cards', step: undefined },
    { pathname: '/book/demo/packages/pkg-1', step: undefined },
    { pathname: '/book/demo/account', step: undefined },
    // e2e-bug.106 — manage + multi availability advertise own steps
    { pathname: '/book/demo/manage', step: 'manage' as const },
    { pathname: '/book/demo/multi/availability', step: 'availability' as const },
  ])('derivePublicBookingStepFromPathname for $pathname', ({ pathname, step }) => {
    expect(derivePublicBookingStepFromPathname(pathname)).toBe(step);
  });

  it('buildPublicAssistantPageContext includes bookingStep when derivable', () => {
    expect(buildPublicAssistantPageContext('/book/demo/checkout')).toEqual({
      screen: '/book/demo/checkout',
      pathname: '/book/demo/checkout',
      bookingStep: 'checkout',
    });
  });

  it('buildPublicAssistantPageContext omits bookingStep on bare landing (e2e-bug.124)', () => {
    expect(buildPublicAssistantPageContext('/book/pollin-clinic-3b7fb9d8')).toEqual({
      screen: '/book/pollin-clinic-3b7fb9d8',
      pathname: '/book/pollin-clinic-3b7fb9d8',
    });
  });

  it.each([
    {
      id: 'manage-token-qs',
      pathname: '/book/demo/manage',
      search: 'bookingId=book-1&token=tok-abc',
      expected: {
        screen: '/book/demo/manage',
        pathname: '/book/demo/manage',
        bookingStep: 'manage' as const,
        bookingId: 'book-1',
        manageToken: 'tok-abc',
      },
    },
    {
      id: 'checkout-cart-qs',
      pathname: '/book/demo/checkout',
      search: '?serviceId=svc-1&employeeId=emp-1&startTime=2026-07-20T10:00:00.000Z',
      expected: {
        screen: '/book/demo/checkout',
        pathname: '/book/demo/checkout',
        bookingStep: 'checkout' as const,
        serviceId: 'svc-1',
        employeeId: 'emp-1',
        startTime: '2026-07-20T10:00:00.000Z',
      },
    },
    {
      id: 'multi-availability-qs',
      pathname: '/book/demo/multi/availability',
      search: 'services=svc-a,svc-b',
      expected: {
        screen: '/book/demo/multi/availability',
        pathname: '/book/demo/multi/availability',
        bookingStep: 'availability' as const,
        serviceIds: ['svc-a', 'svc-b'],
      },
    },
  ])('buildPublicAssistantPageContext threads URL query ($id)', ({ pathname, search, expected }) => {
    expect(buildPublicAssistantPageContext(pathname, search)).toEqual(expected);
  });

  it('extractPublicAssistantQueryContext ignores empty search', () => {
    expect(extractPublicAssistantQueryContext('')).toEqual({});
    expect(extractPublicAssistantQueryContext('?')).toEqual({});
  });

  it('e2e-bug.106 — threads bookingId alone when the manage link has no token yet', () => {
    expect(
      buildPublicAssistantPageContext('/book/demo/manage', 'bookingId=book-1'),
    ).toEqual({
      screen: '/book/demo/manage',
      pathname: '/book/demo/manage',
      bookingStep: 'manage',
      bookingId: 'book-1',
    });
  });

  it('e2e-bug.106 — blank/whitespace-only query values are dropped, not threaded as empty strings', () => {
    expect(
      extractPublicAssistantQueryContext('bookingId=%20&token=tok-abc'),
    ).toEqual({ manageToken: 'tok-abc' });
  });
});
