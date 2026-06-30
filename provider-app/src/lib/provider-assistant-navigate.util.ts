import { buildProviderGuidePath } from './provider-guide.util.js';
import { providerTabPath } from './provider-tab-route.util.js';

export interface ProviderAssistantNavigate {
  path: string;
  query?: Record<string, string | undefined | null>;
}

export function buildProviderAssistantHref(
  navigate: ProviderAssistantNavigate,
): string | null {
  const { path, query = {} } = navigate;

  if (path === 'guide') {
    return buildProviderGuidePath(query);
  }

  if (path.startsWith('/tabs/')) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const trimmed = value?.trim();
      if (trimmed) params.set(key, trimmed);
    }
    const qs = params.toString();
    return `${path}${qs ? `?${qs}` : ''}`;
  }

  if (path.startsWith('/')) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const trimmed = value?.trim();
      if (trimmed) params.set(key, trimmed);
    }
    const qs = params.toString();
    return `${path}${qs ? `?${qs}` : ''}`;
  }

  return null;
}

/** Parse guide panel `path?query` strings into in-app routes (ai-guide-1.9.11). */
export function buildProviderAssistantHrefFromPathAndSearch(
  pathWithQuery: string,
): string | null {
  const trimmed = pathWithQuery.trim();
  if (!trimmed) return null;
  const [rawPath, search = ''] = trimmed.split('?');
  const path = rawPath?.trim();
  if (!path) return null;
  const query = Object.fromEntries(new URLSearchParams(search));
  return buildProviderAssistantHref({ path, query });
}

export function isProviderGuideAssistantNavigate(
  navigate: ProviderAssistantNavigate | null | undefined,
): boolean {
  return navigate?.path === 'guide';
}

export function providerGuideDeepLinkPath(topicId?: string | null): string {
  return buildProviderGuidePath(topicId?.trim() ? { topicId: topicId.trim() } : undefined);
}

/** Legacy push URLs under `/provider/profile/guide`. */
export function isProviderGuidePushUrl(url: string): boolean {
  return /\/profile\/guide(?:\?|$)/.test(url.trim());
}

export function mapProviderGuidePushUrl(url: string): string {
  const trimmed = url.trim();
  const queryIdx = trimmed.indexOf('?');
  const query = queryIdx >= 0 ? trimmed.slice(queryIdx) : '';
  return `${providerTabPath('profile')}/guide${query}`;
}
