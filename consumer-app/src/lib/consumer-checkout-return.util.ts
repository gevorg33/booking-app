import { buildSalonPath, isValidSlug } from './deep-link.js';
import {
  loadPendingMultiCheckoutBySlug,
  loadPendingMultiCheckoutPayment,
} from './multi-service-checkout-payment.util.js';
import { loadPendingPackageCheckoutByPackage } from './package-checkout-payment.util.js';
import { loadPendingCheckoutPayment } from './checkout-payment.util.js';

export type CheckoutReturnKind = 'package' | 'multi' | 'gift_card' | 'single';

export interface CheckoutReturnRoute {
  kind: CheckoutReturnKind;
  slug: string;
  packageId?: string;
  serviceId?: string;
  query: URLSearchParams;
}

function readCheckoutReturnFromUrl(url: URL): CheckoutReturnRoute | null {
  const query = new URLSearchParams(url.search);

  const consumerPackage = url.pathname.match(
    /\/s\/([a-z0-9-]+)\/book\/packages\/([^/]+)\/checkout\/?$/i,
  );
  if (consumerPackage?.[1] && consumerPackage?.[2] && isValidSlug(consumerPackage[1])) {
    return {
      kind: 'package',
      slug: consumerPackage[1].toLowerCase(),
      packageId: consumerPackage[2],
      query,
    };
  }

  const webPackage = url.pathname.match(
    /\/book\/([a-z0-9-]+)\/packages\/([^/]+)\/checkout\/?$/i,
  );
  if (webPackage?.[1] && webPackage?.[2] && isValidSlug(webPackage[1])) {
    return {
      kind: 'package',
      slug: webPackage[1].toLowerCase(),
      packageId: webPackage[2],
      query,
    };
  }

  const consumerMulti = url.pathname.match(/\/s\/([a-z0-9-]+)\/book\/multi\/checkout\/?$/i);
  if (consumerMulti?.[1] && isValidSlug(consumerMulti[1])) {
    return { kind: 'multi', slug: consumerMulti[1].toLowerCase(), query };
  }

  const webMulti = url.pathname.match(/\/book\/([a-z0-9-]+)\/multi\/checkout\/?$/i);
  if (webMulti?.[1] && isValidSlug(webMulti[1])) {
    return { kind: 'multi', slug: webMulti[1].toLowerCase(), query };
  }

  const consumerGift = url.pathname.match(/\/s\/([a-z0-9-]+)\/gift-cards\/checkout\/?$/i);
  if (consumerGift?.[1] && isValidSlug(consumerGift[1])) {
    return { kind: 'gift_card', slug: consumerGift[1].toLowerCase(), query };
  }

  const webGift = url.pathname.match(/\/book\/([a-z0-9-]+)\/gift-cards\/checkout\/?$/i);
  if (webGift?.[1] && isValidSlug(webGift[1])) {
    return { kind: 'gift_card', slug: webGift[1].toLowerCase(), query };
  }

  const webSingle = url.pathname.match(/\/book\/([a-z0-9-]+)\/checkout\/?$/i);
  const serviceId = query.get('serviceId')?.trim();
  if (webSingle?.[1] && isValidSlug(webSingle[1]) && serviceId) {
    return {
      kind: 'single',
      slug: webSingle[1].toLowerCase(),
      serviceId,
      query,
    };
  }

  // e2e-bug.18 — consumer-app Stripe return lands on /s/:slug/book/:serviceId
  const consumerSingle = url.pathname.match(/\/s\/([a-z0-9-]+)\/book\/([^/]+)\/?$/i);
  const reservedBookSegments = new Set(['packages', 'multi', 'any']);
  if (
    consumerSingle?.[1] &&
    consumerSingle?.[2] &&
    isValidSlug(consumerSingle[1]) &&
    !reservedBookSegments.has(consumerSingle[2].toLowerCase()) &&
    isCheckoutPaymentReturnQuery(query)
  ) {
    return {
      kind: 'single',
      slug: consumerSingle[1].toLowerCase(),
      serviceId: consumerSingle[2],
      query,
    };
  }

  if (url.protocol === 'optischedule:' && url.hostname === 'book') {
    const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
    if (parts.length >= 4 && parts[1] === 'packages' && parts[3] === 'checkout' && isValidSlug(parts[0])) {
      return {
        kind: 'package',
        slug: parts[0].toLowerCase(),
        packageId: parts[2],
        query,
      };
    }
    if (parts.length >= 3 && parts[1] === 'multi' && parts[2] === 'checkout' && isValidSlug(parts[0])) {
      return { kind: 'multi', slug: parts[0].toLowerCase(), query };
    }
    if (parts.length >= 3 && parts[1] === 'gift-cards' && parts[2] === 'checkout' && isValidSlug(parts[0])) {
      return { kind: 'gift_card', slug: parts[0].toLowerCase(), query };
    }
    // e2e-bug.18 — native single-service return: optischedule://book/{slug}/{serviceId}?…
    if (
      parts.length >= 2 &&
      isValidSlug(parts[0]) &&
      !reservedBookSegments.has(parts[1].toLowerCase()) &&
      parts[1] !== 'packages' &&
      isCheckoutPaymentReturnQuery(query)
    ) {
      return {
        kind: 'single',
        slug: parts[0].toLowerCase(),
        serviceId: parts[1],
        query,
      };
    }
  }

  return null;
}

/** Parse Stripe success / cancel URLs (web or consumer) into a consumer checkout route. */
export function parseCheckoutReturnRoute(raw: string): CheckoutReturnRoute | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(trimmed, 'https://local.invalid');
    return readCheckoutReturnFromUrl(url);
  } catch {
    return null;
  }
}

export function isCheckoutPaymentReturnQuery(params: URLSearchParams): boolean {
  if (params.get('session_id')?.trim()) return true;
  if (params.get('paid') === '1') return true;
  return false;
}

export function resolveCheckoutReturnNavigationPath(route: CheckoutReturnRoute): string {
  const qs = route.query.toString();
  switch (route.kind) {
    case 'package':
      return buildSalonPath(
        route.slug,
        `/book/packages/${route.packageId}/checkout${qs ? `?${qs}` : ''}`,
      );
    case 'multi':
      return buildSalonPath(route.slug, `/book/multi/checkout${qs ? `?${qs}` : ''}`);
    case 'gift_card':
      return buildSalonPath(route.slug, `/gift-cards/checkout${qs ? `?${qs}` : ''}`);
    case 'single': {
      const params = new URLSearchParams(route.query);
      const startTime = params.get('startTime')?.trim();
      if (startTime) {
        params.set('slot', startTime);
        const parsed = Date.parse(startTime);
        if (!Number.isNaN(parsed)) {
          params.set('date', new Date(parsed).toISOString().slice(0, 10));
        }
      }
      params.delete('serviceId');
      params.delete('startTime');
      const bookQs = params.toString();
      return buildSalonPath(route.slug, `/book/${route.serviceId}${bookQs ? `?${bookQs}` : ''}`);
    }
    default:
      return buildSalonPath(route.slug);
  }
}

export function resolvePackageCheckoutReturnPath(
  slug: string,
  packageId: string,
  params: URLSearchParams,
): string {
  const merged = mergePackageCheckoutReturnQuery(slug, packageId, params);
  const qs = merged.toString();
  return buildSalonPath(slug, `/book/packages/${packageId}/checkout${qs ? `?${qs}` : ''}`);
}

export function mergePackageCheckoutReturnQuery(
  slug: string,
  packageId: string,
  params: URLSearchParams,
): URLSearchParams {
  const merged = new URLSearchParams(params);
  if (merged.get('lines')?.trim()) return merged;

  const pending = loadPendingPackageCheckoutByPackage(slug, packageId);
  if (!pending?.lines?.length) return merged;

  merged.set('lines', JSON.stringify(pending.lines));
  if (!merged.get('session_id')?.trim() && pending.sessionId) {
    merged.set('session_id', pending.sessionId);
  }
  return merged;
}

export function mergeMultiCheckoutReturnQuery(
  slug: string,
  params: URLSearchParams,
): URLSearchParams {
  const merged = new URLSearchParams(params);
  if (merged.get('services')?.trim()) return merged;

  const pending = loadPendingMultiCheckoutBySlug(slug);
  if (!pending) return merged;

  merged.set('services', pending.serviceIds.join(','));
  if (!merged.get('session_id')?.trim() && pending.sessionId) {
    merged.set('session_id', pending.sessionId);
  }
  return merged;
}

export function hasPackageCheckoutPaymentReturn(
  params: URLSearchParams,
  slug: string,
  packageId: string,
): boolean {
  if (isCheckoutPaymentReturnQuery(params)) return true;
  return Boolean(loadPendingPackageCheckoutByPackage(slug, packageId));
}

export function hasMultiCheckoutPaymentReturn(
  params: URLSearchParams,
  slug: string,
  serviceIds: string[],
): boolean {
  if (isCheckoutPaymentReturnQuery(params)) return true;
  return Boolean(loadPendingMultiCheckoutPayment(slug, serviceIds));
}

export function hasSingleCheckoutPaymentReturn(
  params: URLSearchParams,
  slug: string,
): boolean {
  if (isCheckoutPaymentReturnQuery(params)) return true;
  return Boolean(loadPendingCheckoutPayment(slug));
}
