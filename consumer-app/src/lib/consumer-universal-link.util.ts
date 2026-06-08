/** Keep in sync with frontend/src/lib/consumer-app-link.util.ts (adopt-2.6). */
export const CONSUMER_UNIVERSAL_LINK_PATHS = ['/book/*', '/s/*'] as const;

export function matchesConsumerUniversalLinkPath(pathname: string): boolean {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return CONSUMER_UNIVERSAL_LINK_PATHS.some((pattern) =>
    normalized.startsWith(pattern.slice(0, -1)),
  );
}
