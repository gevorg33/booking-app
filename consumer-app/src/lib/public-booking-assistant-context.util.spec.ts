import { describe, expect, it } from 'vitest';
import {
  buildConsumerAssistantPageContext,
  deriveConsumerActivationStepFromPathname,
  derivePublicBookingStepFromPathname,
} from './public-booking-assistant-context.util.js';

describe('public-booking-assistant-context.util (ai-guide-1.5.4)', () => {
  it.each([
    { pathname: '/', step: 'welcome' as const },
    { pathname: '/s/glow-nails/home', step: 'salon' as const },
    { pathname: '/s/glow-nails/services', step: 'service' as const },
    {
      pathname: '/s/glow-nails/book/svc-1',
      step: 'slot' as const,
      slotSelected: false,
    },
    {
      pathname: '/s/glow-nails/book/svc-1',
      step: 'confirm' as const,
      slotSelected: true,
    },
  ])('deriveConsumerActivationStepFromPathname for $pathname', ({
    pathname,
    step,
    slotSelected,
  }) => {
    expect(
      deriveConsumerActivationStepFromPathname(pathname, { slotSelected }),
    ).toBe(step);
  });

  it('buildConsumerAssistantPageContext includes activationStep and slotSelected', () => {
    expect(
      buildConsumerAssistantPageContext('/s/demo/book/svc-1', {
        slotSelected: true,
      }),
    ).toEqual({
      screen: '/s/demo/book/svc-1',
      pathname: '/s/demo/book/svc-1',
      bookingStep: 'checkout',
      activationStep: 'confirm',
      slotSelected: true,
    });
  });

  it('skips activation step on account routes', () => {
    expect(
      buildConsumerAssistantPageContext('/s/demo/account'),
    ).toEqual({
      screen: '/s/demo/account',
      pathname: '/s/demo/account',
    });
  });

  // e2e-bug.124
  it.each([
    { pathname: '/book/demo', step: undefined },
    { pathname: '/book/pollin-clinic-3b7fb9d8', step: undefined },
    { pathname: '/book/demo/checkout', step: 'checkout' as const },
    { pathname: '/s/demo/book/svc-1', step: 'checkout' as const },
  ])('derivePublicBookingStepFromPathname for $pathname', ({ pathname, step }) => {
    expect(derivePublicBookingStepFromPathname(pathname)).toBe(step);
  });
});
