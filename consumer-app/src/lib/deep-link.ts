import {
  consumeDeferredInstallLink,
  saveDeferredInstallLink,
} from './deferred-install-link.util.js';
import type { DeferredInstallLink } from './deferred-install-link.util.js';

export type { DeferredInstallLink, InstallSource } from './deferred-install-link.util.js';
export {
  buildAttributedBookUrl,
  buildInstallAttributionProps,
  consumeDeferredInstallLink,
  parseDeferredInstallFromUrl,
  parseInstallAttributionFromParams,
  parseInstallSource,
  peekDeferredInstallLink,
  resolveDeferredNavigationPath,
  saveDeferredInstallLink,
} from './deferred-install-link.util.js';
export {
  buildDeferredInstallResumePath,
  DEFERRED_INSTALL_RESUME_PARAM,
  mergeDeferredInstallLink,
  normalizeDeferredBookingFields,
  readDeferredInstallResumeContext,
  resolveDeferredInstallNavigationPath,
  type DeferredInstallResumeContext,
} from './deferred-install-resume.util.js';

/** Parse tenant slug from universal link, custom scheme, or path. */
export function parseTenantSlugFromUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(trimmed, 'https://local.invalid');
    const fromQuery = url.searchParams.get('slug')?.trim().toLowerCase();
    if (fromQuery && isValidSlug(fromQuery)) return fromQuery;

    const path = url.pathname || '';
    const bookMatch = path.match(/\/book\/([a-z0-9-]+)/i);
    if (bookMatch?.[1] && isValidSlug(bookMatch[1])) return bookMatch[1].toLowerCase();

    const salonMatch = path.match(/\/s\/([a-z0-9-]+)/i);
    if (salonMatch?.[1] && isValidSlug(salonMatch[1])) return salonMatch[1].toLowerCase();

    if (url.protocol === 'optischedule:' && url.hostname === 'book') {
      const seg = url.pathname.replace(/^\//, '').split('/')[0];
      if (seg && isValidSlug(seg)) return seg.toLowerCase();
    }
  } catch {
    const inline = trimmed.match(/(?:book\/|slug=)([a-z0-9-]+)/i);
    if (inline?.[1] && isValidSlug(inline[1])) return inline[1].toLowerCase();
  }

  if (isValidSlug(trimmed)) return trimmed.toLowerCase();
  return null;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug);
}

export function saveDeferredSlug(
  slug: string,
  options?: {
    serviceId?: string;
    installSource?: import('./deferred-install-link.util.js').InstallSource;
    date?: string;
    slot?: string;
    employeeId?: string;
  },
): void {
  saveDeferredInstallLink({
    slug,
    serviceId: options?.serviceId,
    installSource: options?.installSource ?? 'link',
    date: options?.date,
    slot: options?.slot,
    employeeId: options?.employeeId,
  });
}

export function consumeDeferredSlug(): string | null {
  return consumeDeferredInstallLink()?.slug ?? null;
}

export function buildSalonPath(slug: string, subpath = ''): string {
  const base = `/s/${slug}`;
  if (!subpath) return base;
  return `${base}${subpath.startsWith('/') ? subpath : `/${subpath}`}`;
}

export function buildBookServicePath(
  slug: string,
  serviceId: string,
  options?: { employeeId?: string | null },
): string {
  const base = buildSalonPath(slug, `/book/${serviceId}`);
  const employeeId = options?.employeeId?.trim();
  if (!employeeId) return base;
  const params = new URLSearchParams({ employeeId });
  return `${base}?${params.toString()}`;
}

/** Custom-scheme URL for widget / push rebook (adopt-4.7). */
export function buildConsumerBookServicePushUrl(
  slug: string,
  serviceId: string,
  options?: { employeeId?: string | null },
): string {
  const base = `optischedule://book/${slug}/book/${serviceId}`;
  const employeeId = options?.employeeId?.trim();
  if (!employeeId) return base;
  const params = new URLSearchParams({ employeeId });
  return `${base}?${params.toString()}`;
}

/** Custom-scheme URL opening Account tab (adopt-4.7 widget). */
export function buildConsumerAccountPushUrl(slug: string): string {
  return `optischedule://book/${slug}/account`;
}

/** Custom-scheme URL opening salon home (adopt-4.7 widget empty state). */
export function buildConsumerSalonPushUrl(slug: string): string {
  return `optischedule://book/${slug}`;
}

export function buildResultsPath(slug: string): string {
  return buildSalonPath(slug, '/results');
}

export function buildLabToBookPath(slug: string): string {
  return buildSalonPath(slug, '/lab-to-book');
}

export function buildLabRequestsPath(
  slug: string,
  options?: { collectionServiceId?: string; clinicOrderToken?: string },
): string {
  const params = new URLSearchParams();
  if (options?.collectionServiceId?.trim()) {
    params.set('serviceId', options.collectionServiceId.trim());
  }
  if (options?.clinicOrderToken?.trim()) {
    params.set('clinicOrderToken', options.clinicOrderToken.trim());
  }
  const query = params.toString();
  return query
    ? `${buildSalonPath(slug, '/lab-requests')}?${query}`
    : buildSalonPath(slug, '/lab-requests');
}

export interface LabBookingRequestRoute {
  slug: string;
  collectionServiceId?: string;
  clinicOrderToken?: string;
}

/** Parse lab-booking-request deep links (vert-clinic-2.2.13 / adopt-4.2). */
export function parseLabBookingRequestRoute(raw: string): LabBookingRequestRoute | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const readParams = (url: URL): LabBookingRequestRoute | null => {
    if (url.protocol === 'optischedule:' && url.hostname === 'book') {
      const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
      if (parts.length >= 2 && parts[1] === 'lab-requests' && isValidSlug(parts[0])) {
        return {
          slug: parts[0].toLowerCase(),
          collectionServiceId: url.searchParams.get('serviceId')?.trim() || undefined,
          clinicOrderToken: url.searchParams.get('clinicOrderToken')?.trim() || undefined,
        };
      }
    }

    const consumerMatch = url.pathname.match(/\/s\/([a-z0-9-]+)\/lab-requests\/?$/i);
    if (consumerMatch?.[1] && isValidSlug(consumerMatch[1])) {
      return {
        slug: consumerMatch[1].toLowerCase(),
        collectionServiceId: url.searchParams.get('serviceId')?.trim() || undefined,
        clinicOrderToken: url.searchParams.get('clinicOrderToken')?.trim() || undefined,
      };
    }

    const accountMatch = url.pathname.match(/\/book\/([a-z0-9-]+)\/account\/?$/i);
    if (
      accountMatch?.[1] &&
      isValidSlug(accountMatch[1]) &&
      url.searchParams.get('section') === 'lab-requests'
    ) {
      return { slug: accountMatch[1].toLowerCase() };
    }

    return null;
  };

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://local.invalid');
    const parsed = readParams(url);
    if (parsed) return parsed;
  } catch {
    const inline = trimmed.match(
      /(?:optischedule:\/\/book\/|\/s\/|book\/)([a-z0-9-]+)(?:\/lab-requests|\/account\?section=lab-requests)/i,
    );
    if (inline?.[1] && isValidSlug(inline[1])) {
      return { slug: inline[1].toLowerCase() };
    }
  }

  return null;
}

export function resolveLabBookingRequestNavigationPath(
  route: LabBookingRequestRoute,
): string {
  if (route.collectionServiceId && route.clinicOrderToken) {
    const params = new URLSearchParams({ clinicOrderToken: route.clinicOrderToken });
    return `/s/${route.slug}/book/${route.collectionServiceId}?${params.toString()}`;
  }
  return buildLabToBookPath(route.slug);
}

/** Parse result-ready deep links (adopt-4.2 / vert-clinic-2.4.7). */
export function parseResultReadyRoute(raw: string): { slug: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(trimmed, 'https://local.invalid');

    if (url.protocol === 'optischedule:' && url.hostname === 'book') {
      const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
      if (parts.length >= 2 && parts[1] === 'results' && isValidSlug(parts[0])) {
        return { slug: parts[0].toLowerCase() };
      }
    }

    const consumerMatch = url.pathname.match(/\/s\/([a-z0-9-]+)\/results\/?$/i);
    if (consumerMatch?.[1] && isValidSlug(consumerMatch[1])) {
      return { slug: consumerMatch[1].toLowerCase() };
    }

    const accountMatch = url.pathname.match(/\/book\/([a-z0-9-]+)\/account\/?$/i);
    if (
      accountMatch?.[1] &&
      isValidSlug(accountMatch[1]) &&
      url.searchParams.get('section') === 'results'
    ) {
      return { slug: accountMatch[1].toLowerCase() };
    }
  } catch {
    const inline = trimmed.match(
      /(?:optischedule:\/\/book\/|\/s\/|book\/)([a-z0-9-]+)(?:\/results|\/account\?section=results)/i,
    );
    if (inline?.[1] && isValidSlug(inline[1])) {
      return { slug: inline[1].toLowerCase() };
    }
  }

  return null;
}

/** Web manage link: /book/{slug}/manage?bookingId=&token= */
export function parseManageBookingRoute(
  raw: string,
): { slug: string; bookingId: string; token: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const readParams = (url: URL): { slug: string; bookingId: string; token: string } | null => {
    if (url.protocol === 'optischedule:' && url.hostname === 'book') {
      const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
      if (parts.length >= 2 && parts[1] === 'manage' && isValidSlug(parts[0])) {
        const bookingId = url.searchParams.get('bookingId')?.trim();
        const token = url.searchParams.get('token')?.trim();
        if (!bookingId || !token) return null;
        return { slug: parts[0].toLowerCase(), bookingId, token };
      }
    }

    const manageMatch = url.pathname.match(/\/book\/([a-z0-9-]+)\/manage\/?$/i);
    if (!manageMatch?.[1] || !isValidSlug(manageMatch[1])) return null;
    const bookingId = url.searchParams.get('bookingId')?.trim();
    const token = url.searchParams.get('token')?.trim();
    if (!bookingId || !token) return null;
    return { slug: manageMatch[1].toLowerCase(), bookingId, token };
  };

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://local.invalid');
    return readParams(url);
  } catch {
    return null;
  }
}

export function buildManageBookingPath(
  slug: string,
  bookingId: string,
  token: string,
): string {
  const params = new URLSearchParams({ bookingId, token });
  return `/s/${slug}/manage?${params.toString()}`;
}

/** Parse account-tab deep links (adopt-4.7 widget). */
export function parseAccountRoute(raw: string): { slug: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://local.invalid');

    if (url.protocol === 'optischedule:' && url.hostname === 'book') {
      const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
      if (parts.length >= 2 && parts[1] === 'account' && isValidSlug(parts[0])) {
        return { slug: parts[0].toLowerCase() };
      }
    }

    const consumerMatch = url.pathname.match(/\/s\/([a-z0-9-]+)\/account\/?$/i);
    if (consumerMatch?.[1] && isValidSlug(consumerMatch[1])) {
      return { slug: consumerMatch[1].toLowerCase() };
    }
  } catch {
    const inline = trimmed.match(
      /(?:optischedule:\/\/book\/|\/s\/)([a-z0-9-]+)\/account\b/i,
    );
    if (inline?.[1] && isValidSlug(inline[1])) {
      return { slug: inline[1].toLowerCase() };
    }
  }

  return null;
}

/** Parse book-service deep links (adopt-4.4 rebooking nudge, adopt-6.4 rebook time). */
export function parseBookServiceRoute(
  raw: string,
): {
  slug: string;
  serviceId: string;
  employeeId?: string;
  date?: string;
  slot?: string;
  rebookBookingId?: string;
  rebookSource?: string;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://local.invalid');

    const employeeId = url.searchParams.get('employeeId')?.trim() || undefined;
    const date = url.searchParams.get('date')?.trim() || undefined;
    const slot = url.searchParams.get('slot')?.trim() || undefined;
    const rebookBookingId = url.searchParams.get('rebookBookingId')?.trim() || undefined;
    const rebookSource = url.searchParams.get('rebookSource')?.trim() || undefined;

    const routeExtras = { employeeId, date, slot, rebookBookingId, rebookSource };

    if (url.protocol === 'optischedule:' && url.hostname === 'book') {
      const parts = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
      if (
        parts.length >= 3 &&
        parts[1] === 'book' &&
        isValidSlug(parts[0]) &&
        parts[2]
      ) {
        return {
          slug: parts[0].toLowerCase(),
          serviceId: parts[2],
          ...routeExtras,
        };
      }
    }

    const consumerMatch = url.pathname.match(
      /\/s\/([a-z0-9-]+)\/book\/([a-z0-9-]+)\/?$/i,
    );
    if (consumerMatch?.[1] && consumerMatch?.[2] && isValidSlug(consumerMatch[1])) {
      return {
        slug: consumerMatch[1].toLowerCase(),
        serviceId: consumerMatch[2],
        ...routeExtras,
      };
    }

    const webMatch = url.pathname.match(/\/book\/([a-z0-9-]+)\/?$/i);
    if (webMatch?.[1] && isValidSlug(webMatch[1])) {
      const serviceId = url.searchParams.get('serviceId')?.trim();
      if (serviceId) {
        return { slug: webMatch[1].toLowerCase(), serviceId, ...routeExtras };
      }
    }
  } catch {
    const inline = trimmed.match(
      /(?:optischedule:\/\/book\/|\/s\/)([a-z0-9-]+)\/book\/([a-z0-9-]+)/i,
    );
    if (inline?.[1] && inline?.[2] && isValidSlug(inline[1])) {
      return { slug: inline[1].toLowerCase(), serviceId: inline[2] };
    }
  }

  return null;
}
