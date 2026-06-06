import { getPublicApiBaseUrl } from '../services/api-base.js';

/** Makes stored image URLs load in the consumer app (relative paths, dev API host). */
export function resolvePublicImageUrl(url: string | undefined | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const apiOrigin = new URL(getPublicApiBaseUrl()).origin;
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

  const base = getPublicApiBaseUrl();
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}
