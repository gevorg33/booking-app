/**
 * e2e-bug.224 — map AI `navigate.path` values onto real public-web `bookPath` routes.
 * Mirrors consumer `buildConsumerAssistantHref` onto `/book/{slug}/…`.
 */

import { bookPath } from '@/lib/tenant-host';

export type PublicAssistantNavigateInput = {
  path: string;
  query?: Record<string, string | undefined | null>;
};

function cleanQuery(
  query: Record<string, string | undefined | null> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!query) return out;
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;
    const trimmed = String(value).trim();
    if (trimmed) out[key] = trimmed;
  }
  return out;
}

function withQuery(href: string, query: Record<string, string>): string {
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return qs ? `${href}?${qs}` : href;
}

export function dateKeyFromStartTime(startTime: string): string {
  const parsed = Date.parse(startTime);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toISOString().slice(0, 10);
}

/**
 * Returns a Next.js href under `/book/{slug}/…`, or null when the navigate
 * payload cannot be mapped (caller should leave the user on the current page).
 */
export function buildPublicAssistantHref(
  slug: string,
  navigate: PublicAssistantNavigateInput,
): string | null {
  const path = (navigate.path || '').trim().replace(/^\/+/, '');
  const query = cleanQuery(navigate.query);

  if (!path) return bookPath(slug);

  if (path === 'provider_profile') {
    const employeeId = query.employeeId;
    if (!employeeId) return null;
    return bookPath(slug, `/providers/${employeeId}`);
  }

  if (path === 'professionals') {
    const employeeId = query.employeeId;
    const startTime = query.startTime;
    if (employeeId && startTime) {
      return withQuery(bookPath(slug, '/services'), {
        employeeId,
        startTime,
        ...(query.employeeName ? { employeeName: query.employeeName } : {}),
      });
    }
    return withQuery(bookPath(slug, '/professionals'), query);
  }

  if (path === 'services') {
    return withQuery(bookPath(slug, '/services'), query);
  }

  // e2e-bug.224 — packages catalog is /packages/[packageId] or /any (picker), not /packages.
  if (path === 'packages') {
    const packageId = query.packageId;
    if (packageId) {
      const { packageId: _drop, ...rest } = query;
      return withQuery(bookPath(slug, `/packages/${packageId}`), rest);
    }
    return bookPath(slug, '/any');
  }

  // e2e-bug.224 — web Google sign-in lives on /account (no /login under the slug).
  if (path === 'login') {
    return withQuery(bookPath(slug, '/account'), query);
  }

  // e2e-bug.224 — home is bare /book/{slug}, not /home.
  if (path === 'home' || path === 'tenant_switch') {
    return bookPath(slug);
  }

  // e2e-bug.224 — salon switch uses target slug when provided.
  if (path === 'salon') {
    const targetSlug = query.slug;
    if (!targetSlug) return bookPath(slug);
    return bookPath(targetSlug);
  }

  if (path === 'account') {
    return withQuery(bookPath(slug, '/account'), query);
  }

  if (path === 'manage') {
    return withQuery(bookPath(slug, '/manage'), query);
  }

  if (path === 'profile') {
    return withQuery(bookPath(slug, '/profile'), query);
  }

  if (path === 'gift-cards') {
    return withQuery(bookPath(slug, '/gift-cards'), query);
  }

  if (path === 'gift-cards/checkout') {
    return withQuery(bookPath(slug, '/gift-cards/checkout'), query);
  }

  if (path === 'multi/checkout') {
    return withQuery(bookPath(slug, '/multi/checkout'), query);
  }

  if (path === 'checkout') {
    const packageId = query.packageId;
    const serviceId = query.serviceId;
    const services = query.services;

    // e2e-bug.228 — suggest_package_block navigate is checkout+packageId(+startTime),
    // never single-service /checkout (that page requires serviceId and drops the package).
    if (packageId && !serviceId && !services) {
      if (query.lines) {
        const { packageId: _drop, ...rest } = query;
        return withQuery(
          bookPath(slug, `/packages/${packageId}/checkout`),
          rest,
        );
      }
      const { packageId: _drop, ...rest } = query;
      return withQuery(bookPath(slug, `/packages/${packageId}`), rest);
    }

    if (services && !serviceId) {
      return withQuery(bookPath(slug, '/multi/checkout'), query);
    }

    return withQuery(bookPath(slug, '/checkout'), query);
  }

  if (path === 'guide') {
    // Public web has no dedicated guide route; land on home with topic query if any.
    return withQuery(bookPath(slug), query);
  }

  // Unknown path: keep previous naive join so working counterexamples still route.
  return withQuery(bookPath(slug, `/${path}`), query);
}
