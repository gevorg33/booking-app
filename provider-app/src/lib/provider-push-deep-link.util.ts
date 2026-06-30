/** Sprint 20 — parse FCM data and map provider URLs to in-app routes. */

import { mapProviderGuidePushUrl } from './provider-assistant-navigate.util.js';

export type ProviderPushType = 'booking_created' | 'booking_updated' | 'end_of_day';

export interface ProviderPushPayload {
  url?: string;
  bookingId?: string;
  businessId?: string;
  aiPrompt?: string;
  pushType?: ProviderPushType;
  foregroundHint?: string;
  actionId?: string;
}

export function parseProviderPushPayload(
  data: Record<string, unknown> | undefined,
): ProviderPushPayload {
  if (!data) return {};
  const str = (key: string) => {
    const v = data[key];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  };
  return {
    url: str('url'),
    bookingId: str('bookingId'),
    businessId: str('businessId'),
    aiPrompt: str('aiPrompt'),
    pushType: str('pushType') as ProviderPushType | undefined,
    foregroundHint: str('foregroundHint'),
    actionId: str('actionId'),
  };
}

function pushUrlQuerySuffix(url: string): string {
  const idx = url.indexOf('?');
  return idx >= 0 ? url.slice(idx) : '';
}

/** Map legacy `/provider/today` URLs to Ionic tab routes. */
export function providerTabPathFromPushUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '/tabs/today';

  const query = pushUrlQuerySuffix(trimmed);
  if (trimmed.includes('/profile/guide')) {
    return mapProviderGuidePushUrl(trimmed);
  }
  if (trimmed.includes('/schedule')) return `/tabs/schedule${query}`;
  if (trimmed.includes('/profile')) return `/tabs/profile${query}`;
  if (trimmed.includes('/gift-cards')) return `/tabs/gift-cards${query}`;

  try {
    const parsed = trimmed.startsWith('http')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://app.local');
    const path = parsed.pathname.replace(/^\/provider/, '/tabs');
    const normalized = path === '/tabs' ? '/tabs/today' : path;
    if (!normalized.startsWith('/tabs/')) return '/tabs/today';
    return `${normalized}${parsed.search}`;
  } catch {
    return '/tabs/today';
  }
}

export function resolveProviderPushRoute(payload: ProviderPushPayload): string {
  if (payload.url) return providerTabPathFromPushUrl(payload.url);
  if (payload.bookingId) return `/tabs/today?bookingId=${encodeURIComponent(payload.bookingId)}`;
  return '/tabs/today';
}

export const PROVIDER_PUSH_NAVIGATE_EVENT = 'provider:push-navigate';
export const PROVIDER_OPEN_BOOKING_EVENT = 'provider:open-booking';
export const PROVIDER_AI_PROMPT_EVENT = 'provider:ai-prompt';
export const PROVIDER_TEAM_WHOS_NEXT_EVENT = 'provider:show-team-whos-next';

export function dispatchProviderPushEffects(payload: ProviderPushPayload): void {
  const route = resolveProviderPushRoute(payload);
  window.dispatchEvent(
    new CustomEvent(PROVIDER_PUSH_NAVIGATE_EVENT, { detail: { path: route } }),
  );
  if (payload.bookingId) {
    window.dispatchEvent(
      new CustomEvent(PROVIDER_OPEN_BOOKING_EVENT, {
        detail: { bookingId: payload.bookingId },
      }),
    );
  }
  if (payload.aiPrompt) {
    window.dispatchEvent(
      new CustomEvent(PROVIDER_AI_PROMPT_EVENT, { detail: { prompt: payload.aiPrompt } }),
    );
  }
}

export function isBookingCreatedPush(payload: ProviderPushPayload): boolean {
  return payload.pushType === 'booking_created';
}
