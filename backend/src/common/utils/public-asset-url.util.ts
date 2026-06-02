/**
 * Normalize branding/media URLs for unauthenticated public clients.
 */
export function resolvePublicAssetUrl(
  url: string | undefined | null,
  apiBaseUrl: string,
): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}
