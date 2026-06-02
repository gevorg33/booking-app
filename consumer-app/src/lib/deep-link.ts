const DEFERRED_SLUG_KEY = 'consumer_deferred_slug';

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

export function saveDeferredSlug(slug: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DEFERRED_SLUG_KEY, slug);
}

export function consumeDeferredSlug(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const slug = localStorage.getItem(DEFERRED_SLUG_KEY);
  if (slug) localStorage.removeItem(DEFERRED_SLUG_KEY);
  return slug && isValidSlug(slug) ? slug : null;
}

export function buildSalonPath(slug: string, subpath = ''): string {
  const base = `/s/${slug}`;
  if (!subpath) return base;
  return `${base}${subpath.startsWith('/') ? subpath : `/${subpath}`}`;
}

/** Web manage link: /book/{slug}/manage?bookingId=&token= */
export function parseManageBookingRoute(
  raw: string,
): { slug: string; bookingId: string; token: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://local.invalid');
    const manageMatch = url.pathname.match(/\/book\/([a-z0-9-]+)\/manage\/?$/i);
    if (!manageMatch?.[1] || !isValidSlug(manageMatch[1])) return null;
    const bookingId = url.searchParams.get('bookingId')?.trim();
    const token = url.searchParams.get('token')?.trim();
    if (!bookingId || !token) return null;
    return { slug: manageMatch[1].toLowerCase(), bookingId, token };
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
