/** Reserved host labels — not business slugs (see deploy/SUBDOMAIN.md). */
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'mail', 'ftp', 'admin']);

/** Extract tenant slug from host, e.g. gloss.localhost:3000 → gloss */
export function extractSubdomain(host: string, rootDomain: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();
  const rootHost = rootDomain.split(':')[0].toLowerCase();

  if (hostname === rootHost || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  if (hostname.endsWith(`.${rootHost}`)) {
    const sub = hostname.slice(0, -(rootHost.length + 1));
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) return sub;
  }

  return null;
}

export function getRootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
}

/** Internal Next.js routes — always /book/{slug}/… (works on apex and tenant subdomain). */
export function bookPath(slug: string, path = ''): string {
  const base = `/book/${slug}`;
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function inferProtocol(origin?: string): 'http' | 'https' {
  if (origin?.startsWith('http://')) return 'http';
  if (typeof window !== 'undefined' && window.location.protocol === 'http:') return 'http';
  return 'https';
}

/** Shareable absolute URL on the apex host: https://app.example.com/book/{slug}/… */
export function buildTenantPublicUrl(
  slug: string,
  pathSuffix = '',
  options?: { origin?: string; rootDomain?: string; protocol?: 'http' | 'https' },
): string {
  const path = bookPath(slug, pathSuffix);
  const origin = options?.origin?.replace(/\/$/, '');
  if (origin) {
    return `${origin}${path}`;
  }

  const protocol = options?.protocol ?? inferProtocol(options?.origin);
  const rootDomain = options?.rootDomain ?? getRootDomain();
  const rootHost = rootDomain.split(':')[0].toLowerCase();
  const port = rootDomain.includes(':') ? `:${rootDomain.split(':').slice(1).join(':')}` : '';
  return `${protocol}://${rootHost}${port}${path}`;
}

/** Convenience for dashboard/embed: absolute public booking URL on current deployment. */
export function bookPublicUrl(slug: string, pathSuffix = ''): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return buildTenantPublicUrl(slug, pathSuffix, { origin });
}
