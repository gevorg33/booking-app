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

function resolveFrontendBaseUrl(frontendUrl?: string): string {
  return (frontendUrl || 'http://localhost:3000').replace(/\/$/, '');
}

/** Shareable absolute URL on the apex frontend host: https://app.example.com/book/{slug}/… */
export function buildTenantPublicUrl(input: BuildTenantPublicUrlInput): string {
  const path = buildTenantPublicPath(input.slug, input.pathSuffix);
  const url = new URL(`${resolveFrontendBaseUrl(input.frontendUrl)}${path}`);

  if (input.query) {
    for (const [key, value] of Object.entries(input.query)) {
      if (value == null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
