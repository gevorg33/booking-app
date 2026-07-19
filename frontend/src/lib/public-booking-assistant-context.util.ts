export type PublicBookingAssistantStep =
  | 'professionals'
  | 'services'
  | 'checkout'
  | 'manage'
  | 'availability';

export type PublicAssistantPageContext = {
  screen: string;
  pathname: string;
  bookingStep?: PublicBookingAssistantStep;
  bookingId?: string;
  manageToken?: string;
  serviceId?: string;
  employeeId?: string;
  startTime?: string;
  serviceIds?: string[];
};

/**
 * Derive funnel / page step from public booking pathname (ai-guide-1.5.3).
 * e2e-bug.124 — bare `/book/:slug` landing must NOT report `checkout`
 * (that steered gift-card purchase prompts into apply/redeem).
 * e2e-bug.106 — manage + multi availability must advertise their own steps
 * so the widget does not fall through to the generic booking funnel guide.
 */
export function derivePublicBookingStepFromPathname(
  pathname: string,
): PublicBookingAssistantStep | undefined {
  const lower = pathname.toLowerCase();
  if (/\/manage(\/|$|\?)/.test(lower)) {
    return 'manage';
  }
  if (/\/multi\/availability(\/|$|\?)/.test(lower)) {
    return 'availability';
  }
  if (/\/checkout(\/|$|\?)/.test(lower) || /\/book\/multi\/checkout/.test(lower)) {
    return 'checkout';
  }
  if (/\/professionals(\/|$|\?)/.test(lower) || /\/any(\/|$|\?)/.test(lower)) {
    return 'professionals';
  }
  if (/\/services(\/|$|\?)/.test(lower) && !lower.includes('/providers/')) {
    return 'services';
  }
  // Review / confirm steps are checkout-adjacent booking-in-progress.
  if (/\/book\/[^/]+\/review(\/|$|\?)/.test(lower)) {
    return 'checkout';
  }
  // Consumer deep-link with a selected service: /s/:tenant/book/:serviceId
  if (/^\/s\/[^/]+\/book\//.test(lower)) {
    return 'checkout';
  }
  return undefined;
}

/** Pull booking / cart query fields the public assistant should seed into session. */
export function extractPublicAssistantQueryContext(
  search: string = '',
): Pick<
  PublicAssistantPageContext,
  | 'bookingId'
  | 'manageToken'
  | 'serviceId'
  | 'employeeId'
  | 'startTime'
  | 'serviceIds'
> {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  if (!raw.trim()) return {};
  const params = new URLSearchParams(raw);
  const bookingId = params.get('bookingId')?.trim() || undefined;
  const manageToken = params.get('token')?.trim() || undefined;
  const serviceId = params.get('serviceId')?.trim() || undefined;
  const employeeId = params.get('employeeId')?.trim() || undefined;
  const startTime = params.get('startTime')?.trim() || undefined;
  const servicesParam = params.get('services')?.trim();
  const serviceIds = servicesParam
    ? servicesParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : undefined;
  return {
    ...(bookingId ? { bookingId } : {}),
    ...(manageToken ? { manageToken } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(startTime ? { startTime } : {}),
    ...(serviceIds?.length ? { serviceIds } : {}),
  };
}

/**
 * e2e-bug.106 — thread pathname + URL query (bookingId/token/cart) into every
 * public assistant request so manage/checkout/multi pages are context-aware.
 */
export function buildPublicAssistantPageContext(
  pathname: string,
  search: string = '',
): PublicAssistantPageContext {
  const bookingStep = derivePublicBookingStepFromPathname(pathname);
  const query = extractPublicAssistantQueryContext(search);
  return {
    screen: pathname,
    pathname,
    ...(bookingStep ? { bookingStep } : {}),
    ...query,
  };
}
