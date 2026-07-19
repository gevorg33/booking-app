export type PublicBookingAssistantStep = 'professionals' | 'services' | 'checkout';

export type ConsumerActivationStep = 'welcome' | 'salon' | 'service' | 'slot' | 'confirm';

/**
 * e2e-bug.124 — bare `/book/:slug` landing must NOT report `checkout`
 * (that steered gift-card purchase prompts into apply/redeem).
 */
export function derivePublicBookingStepFromPathname(
  pathname: string,
): PublicBookingAssistantStep | undefined {
  const lower = pathname.toLowerCase();
  if (/\/checkout(\/|$|\?)/.test(lower) || /\/book\/multi\/checkout/.test(lower)) {
    return 'checkout';
  }
  if (/\/professionals(\/|$|\?)/.test(lower) || /\/any(\/|$|\?)/.test(lower)) {
    return 'professionals';
  }
  if (/\/services(\/|$|\?)/.test(lower) && !lower.includes('/providers/')) {
    return 'services';
  }
  if (/\/book\/[^/]+\/review(\/|$|\?)/.test(lower)) {
    return 'checkout';
  }
  // Consumer deep-link with a selected service: /s/:tenant/book/:serviceId
  if (/^\/s\/[^/]+\/book\//.test(lower)) {
    return 'checkout';
  }
  return undefined;
}

/** adopt-3.4 activation funnel step from consumer pathname (ai-guide-1.5.4). */
export function deriveConsumerActivationStepFromPathname(
  pathname: string,
  context: { slotSelected?: boolean } = {},
): ConsumerActivationStep | undefined {
  const lower = pathname.toLowerCase();
  if (/\/account(\/|$|\?)/.test(lower) || /\/packages(\/|$|\?)/.test(lower)) {
    return undefined;
  }
  if (pathname === '/' || pathname === '') return 'welcome';
  if (/^\/s\/[^/]+\/book\/[^/]+$/.test(pathname)) {
    return context.slotSelected ? 'confirm' : 'slot';
  }
  if (pathname.includes('/services')) return 'service';
  if (/^\/s\/[^/]+(\/home)?\/?$/.test(pathname)) return 'salon';
  return undefined;
}

export function buildConsumerAssistantPageContext(
  pathname: string,
  options: { slotSelected?: boolean } = {},
): {
  screen: string;
  pathname: string;
  bookingStep?: PublicBookingAssistantStep;
  activationStep?: ConsumerActivationStep;
  slotSelected?: boolean;
} {
  const bookingStep = derivePublicBookingStepFromPathname(pathname);
  const slotSelected = options.slotSelected === true;
  const activationStep = deriveConsumerActivationStepFromPathname(pathname, {
    slotSelected,
  });
  return {
    screen: pathname,
    pathname,
    ...(bookingStep ? { bookingStep } : {}),
    ...(activationStep ? { activationStep } : {}),
    ...(slotSelected ? { slotSelected: true } : {}),
  };
}
