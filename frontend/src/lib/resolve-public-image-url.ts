import { getApiBaseUrl } from '@/lib/api-base';

function getServerApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3001'
  ).replace(/\/$/, '');
}

function currentApiOrigin(): string {
  const base = typeof window !== 'undefined' ? getApiBaseUrl() : getServerApiBaseUrl();
  try {
    return new URL(base).origin;
  } catch {
    return base;
  }
}

/**
 * Makes stored image URLs load on public booking (relative paths, protocol-relative, dev API host).
 */
export function resolvePublicImageUrl(url: string | undefined | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const apiOrigin = currentApiOrigin();
      const isLocalApi =
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
        (parsed.port === '3001' || (!parsed.port && parsed.protocol === 'http:'));
      if (isLocalApi && apiOrigin !== parsed.origin) {
        return `${apiOrigin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  const base = typeof window !== 'undefined' ? getApiBaseUrl() : getServerApiBaseUrl();
  return `${base.replace(/\/$/, '')}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}
