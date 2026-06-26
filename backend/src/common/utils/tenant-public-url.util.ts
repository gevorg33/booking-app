export interface BuildTenantPublicUrlInput {
  slug: string;
  pathSuffix?: string;
  frontendUrl?: string;
  rootDomain?: string;
  query?: Record<string, string | number | undefined | null>;
}

export function getRootDomainFromEnv(): string {
  return process.env.ROOT_DOMAIN || 'localhost:3000';
}

/** Internal Next.js route — always /book/{slug}/… */
export function buildTenantPublicPath(slug: string, pathSuffix = ''): string {
  const normalized = slug.trim().toLowerCase();
  let path = '';
  if (pathSuffix && pathSuffix !== '/') {
    path = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
  }
  return `/book/${normalized}${path}`;
}

function inferProtocol(frontendUrl?: string): 'http' | 'https' {
  return frontendUrl?.startsWith('http://') ? 'http' : 'https';
}

/** Shareable absolute URL: https://{slug}.{rootDomain}/… */
export function buildTenantPublicUrl(input: BuildTenantPublicUrlInput): string {
  const normalized = input.slug.trim().toLowerCase();
  const rootDomain = input.rootDomain ?? getRootDomainFromEnv();
  const rootHost = rootDomain.split(':')[0].toLowerCase();
  const port = rootDomain.includes(':') ? rootDomain.split(':').slice(1).join(':') : '';

  let path = '';
  if (input.pathSuffix && input.pathSuffix !== '/') {
    path = input.pathSuffix.startsWith('/') ? input.pathSuffix : `/${input.pathSuffix}`;
  }

  const protocol = inferProtocol(input.frontendUrl);
  const tenantHost = port ? `${normalized}.${rootHost}:${port}` : `${normalized}.${rootHost}`;
  const url = new URL(`${protocol}://${tenantHost}${path || '/'}`);

  if (input.query) {
    for (const [key, value] of Object.entries(input.query)) {
      if (value == null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
