export type PublicBookingAssistantStep = 'professionals' | 'services' | 'checkout';

export type ConsumerActivationStep = 'welcome' | 'salon' | 'service' | 'slot' | 'confirm';

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
