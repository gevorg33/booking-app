/**
 * e2e-bug.18 — Stripe success/cancel URLs must return to the app that started checkout
 * (Next.js public booking vs consumer-app), not always FRONTEND_URL.
 */

export type CheckoutClientSurface = 'web' | 'consumer';

export type CheckoutReturnKind = 'single' | 'package' | 'multi' | 'gift_card';

export interface CheckoutReturnUrlInput {
  clientSurface?: string | null;
  returnOrigin?: string | null;
  frontendUrl: string;
  consumerAppUrl?: string | null;
  /** When true, allow http://localhost / 127.0.0.1 returnOrigin without CONSUMER_APP_URL. */
  allowLocalDevOrigins?: boolean;
  slug: string;
  kind: CheckoutReturnKind;
  /** Web path suffix after /book/{slug}, e.g. `/checkout` or `/packages/id/checkout`. */
  webPathSuffix: string;
  successQuery: string;
  cancelQuery: string;
  serviceId?: string;
  packageId?: string;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function tryOrigin(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalDevOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

export function normalizeCheckoutClientSurface(
  value?: string | null,
): CheckoutClientSurface {
  return value === 'consumer' ? 'consumer' : 'web';
}

export function isAllowedCheckoutReturnOrigin(
  candidate: string | null | undefined,
  allowlist: string[],
  allowLocalDevOrigins = false,
): boolean {
  const origin = tryOrigin(candidate);
  if (!origin) return false;
  if (allowLocalDevOrigins && isLocalDevOrigin(origin)) return true;
  return allowlist.some((entry) => tryOrigin(entry) === origin);
}

export function resolveCheckoutReturnBaseUrl(input: {
  clientSurface?: string | null;
  returnOrigin?: string | null;
  frontendUrl: string;
  consumerAppUrl?: string | null;
  allowLocalDevOrigins?: boolean;
}): { baseUrl: string; surface: CheckoutClientSurface } {
  const surface = normalizeCheckoutClientSurface(input.clientSurface);
  const frontendUrl = stripTrailingSlash(input.frontendUrl || 'http://localhost:3000');
  if (surface !== 'consumer') {
    return { baseUrl: frontendUrl, surface: 'web' };
  }

  const consumerConfigured = tryOrigin(input.consumerAppUrl);
  const allowlist = [frontendUrl, input.consumerAppUrl].filter(
    (v): v is string => Boolean(v?.trim()),
  );
  const returnOrigin = tryOrigin(input.returnOrigin);
  if (
    returnOrigin &&
    isAllowedCheckoutReturnOrigin(
      returnOrigin,
      allowlist,
      input.allowLocalDevOrigins === true,
    )
  ) {
    return { baseUrl: returnOrigin, surface: 'consumer' };
  }
  if (consumerConfigured) {
    return { baseUrl: stripTrailingSlash(input.consumerAppUrl!), surface: 'consumer' };
  }
  // Misconfigured consumer checkout — keep prior behavior rather than inventing a host.
  return { baseUrl: frontendUrl, surface: 'web' };
}

function joinUrl(baseUrl: string, path: string, query: string): string {
  const base = stripTrailingSlash(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!query) return `${base}${normalizedPath}`;
  const joiner = query.startsWith('?') ? '' : '?';
  return `${base}${normalizedPath}${joiner}${query}`;
}

export function buildConsumerCheckoutPath(input: {
  slug: string;
  kind: CheckoutReturnKind;
  serviceId?: string;
  packageId?: string;
}): string {
  const slug = input.slug.trim().toLowerCase();
  switch (input.kind) {
    case 'package':
      return `/s/${slug}/book/packages/${input.packageId}/checkout`;
    case 'multi':
      return `/s/${slug}/book/multi/checkout`;
    case 'gift_card':
      return `/s/${slug}/gift-cards/checkout`;
    case 'single':
      return `/s/${slug}/book/${input.serviceId}`;
    default:
      return `/s/${slug}`;
  }
}

/**
 * Map web-style startTime query onto consumer BookPage (slot/date).
 * Preserves Stripe's literal `{CHECKOUT_SESSION_ID}` (must not be %-encoded).
 */
function rewriteSingleServiceQueryForConsumer(webQuery: string): string {
  const raw = webQuery.startsWith('?') ? webQuery.slice(1) : webQuery;
  const params = new URLSearchParams(raw);
  const sessionId = params.get('session_id');
  params.delete('session_id');

  const startTime = params.get('startTime')?.trim();
  if (startTime) {
    params.set('slot', startTime);
    const parsed = Date.parse(startTime);
    if (!Number.isNaN(parsed)) {
      params.set('date', new Date(parsed).toISOString().slice(0, 10));
    }
    params.delete('startTime');
  }
  params.delete('serviceId');

  let qs = params.toString();
  if (sessionId) {
    // Append raw so `{CHECKOUT_SESSION_ID}` is not encoded as %7B…%7D.
    qs = qs ? `${qs}&session_id=${sessionId}` : `session_id=${sessionId}`;
  }
  return qs;
}

export function toConsumerSingleSuccessQuery(webSuccessQuery: string): string {
  return rewriteSingleServiceQueryForConsumer(webSuccessQuery);
}

export function toConsumerSingleCancelQuery(webCancelQuery: string): string {
  return rewriteSingleServiceQueryForConsumer(webCancelQuery);
}

export function buildCheckoutReturnUrls(input: CheckoutReturnUrlInput): {
  successUrl: string;
  cancelUrl: string;
  surface: CheckoutClientSurface;
  baseUrl: string;
} {
  const { baseUrl, surface } = resolveCheckoutReturnBaseUrl(input);

  if (surface === 'consumer') {
    const path = buildConsumerCheckoutPath(input);
    const successQuery =
      input.kind === 'single'
        ? toConsumerSingleSuccessQuery(input.successQuery)
        : input.successQuery;
    const cancelQuery =
      input.kind === 'single'
        ? toConsumerSingleCancelQuery(input.cancelQuery)
        : input.cancelQuery;
    return {
      successUrl: joinUrl(baseUrl, path, successQuery),
      cancelUrl: joinUrl(baseUrl, path, cancelQuery),
      surface,
      baseUrl,
    };
  }

  const webPath = `/book/${input.slug.trim().toLowerCase()}${
    input.webPathSuffix.startsWith('/')
      ? input.webPathSuffix
      : `/${input.webPathSuffix}`
  }`;
  return {
    successUrl: joinUrl(baseUrl, webPath, input.successQuery),
    cancelUrl: joinUrl(baseUrl, webPath, input.cancelQuery),
    surface,
    baseUrl,
  };
}
