import { describe, expect, it } from 'vitest';
import {
  derivePublicBookingStepFromPathname,
  buildPublicAssistantPageContext,
} from './public-booking-assistant-context.util';

describe('public-booking-assistant-context.util (ai-guide-1.5.3)', () => {
  it.each([
    { pathname: '/book/demo/professionals', step: 'professionals' },
    { pathname: '/book/demo/services', step: 'services' },
    { pathname: '/book/demo/checkout', step: 'checkout' },
    { pathname: '/book/demo/any', step: 'professionals' },
    { pathname: '/s/salon/book/service-id', step: 'checkout' },
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
});
