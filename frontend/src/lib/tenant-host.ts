/** Extract tenant slug from host, e.g. gloss.localhost:3000 → gloss */
export function extractSubdomain(host: string, rootDomain: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();
  const rootHost = rootDomain.split(':')[0].toLowerCase();

  if (hostname === rootHost || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  if (hostname.endsWith(`.${rootHost}`)) {
    const sub = hostname.slice(0, -(rootHost.length + 1));
    if (sub && sub !== 'www') return sub;
  }

  return null;
}

export function getRootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
}

export function bookPath(slug: string, path = ''): string {
  const base = `/book/${slug}`;
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
