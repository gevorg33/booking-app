export type PublicBookingAssistantStep = 'professionals' | 'services' | 'checkout';

/** Derive funnel step from public booking pathname (ai-guide-1.5.3). */
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
  if (
    /\/book\/[0-9a-f-]{8,}/i.test(lower) ||
    (/\/book\/[^/]+(\/|$|\?)/.test(lower) &&
      !lower.includes('/packages/') &&
      !lower.includes('/multi/') &&
      !lower.includes('/gift-cards/'))
  ) {
    return 'checkout';
  }
  if (/^\/s\/[^/]+\/book\//.test(lower)) {
    return 'checkout';
  }
  return undefined;
}

export function buildPublicAssistantPageContext(pathname: string): {
  screen: string;
  pathname: string;
  bookingStep?: PublicBookingAssistantStep;
} {
  const bookingStep = derivePublicBookingStepFromPathname(pathname);
  return {
    screen: pathname,
    pathname,
    ...(bookingStep ? { bookingStep } : {}),
  };
}
