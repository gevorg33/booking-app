import type { AiTranslateFn } from '@/lib/ai-assistant-i18n';
import {
  CONSUMER_PAGE_SUGGESTION_I18N_KEYS,
  type ConsumerPageSuggestionId,
} from '@/lib/consumer-page-suggestions.types';

export type { ConsumerPageSuggestionId } from '@/lib/consumer-page-suggestions.types';
export {
  CONSUMER_AI_PAGE_SUGGESTIONS_EN,
  CONSUMER_PAGE_SUGGESTION_I18N_KEYS,
} from '@/lib/consumer-page-suggestions.types';

export function isPublicBookCheckoutPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (!/\/checkout(\/|$|\?)/.test(lower)) return false;
  if (/\/multi\/checkout/.test(lower)) return false;
  if (/\/gift-cards\/checkout/.test(lower)) return false;
  if (/\/packages\/[^/]+\/checkout/.test(lower)) return false;
  return true;
}

function isConsumerBookCheckoutPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (!/^\/s\/[^/]+\/book\//.test(lower)) return false;
  if (/\/book\/(?:any|multi|packages|gift-cards)(\/|$)/.test(lower)) {
    return false;
  }
  return true;
}

/** Resolve public booking or consumer-app pathname to a page suggestion bucket (ai-cmd-customer-4.9.1). */
export function resolveConsumerPageSuggestionId(
  pathname: string,
  search = '',
): ConsumerPageSuggestionId | null {
  const lower = pathname.toLowerCase();

  if (pathname === '/' || pathname === '') return 'welcome';

  if (/\/manage(\/|$|\?)/.test(lower)) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const hasToken = Boolean(params.get('token')?.trim());
    const hasBookingId = Boolean(params.get('bookingId')?.trim());
    return hasToken && hasBookingId ? 'manage-booking' : 'manage-booking-guest';
  }

  if (isPublicBookCheckoutPath(pathname) || isConsumerBookCheckoutPath(pathname)) {
    return 'book';
  }
  if (/\/services(\/|$|\?)/.test(lower)) {
    return 'service-list';
  }
  if (/\/book\/any(\/|$|\?)/.test(lower) || /\/any(\/|$|\?)/.test(lower)) {
    return 'multi-service-picker';
  }
  if (/\/gift-cards\/checkout(\/|$|\?)/.test(lower)) return 'gift-card-checkout';
  if (/\/book\/multi\/checkout(\/|$|\?)/.test(lower) || /\/multi\/checkout(\/|$|\?)/.test(lower)) {
    return 'multi-service-checkout';
  }
  if (
    (/\/book\/packages\/[^/]+(\/|$|\?)/.test(lower) ||
      /\/packages\/[^/]+(\/|$|\?)/.test(lower)) &&
    !/\/checkout(\/|$|\?)/.test(lower)
  ) {
    return 'package-confirm';
  }
  if (/\/lab-to-book(\/|$|\?)/.test(lower)) return 'lab-to-book';
  if (/\/results(\/|$|\?)/.test(lower)) return 'my-results';
  if (/\/account(\/|$|\?)/.test(lower)) return 'account';
  if (/^\/book\/[^/]+\/?$/.test(pathname) || /^\/s\/[^/]+(\/home)?\/?$/.test(pathname)) {
    return 'salon-home';
  }

  return null;
}

export function buildPublicPageSuggestions(
  pathname: string,
  t: AiTranslateFn,
  search = '',
): string[] {
  const pageId = resolveConsumerPageSuggestionId(pathname, search);
  if (!pageId) return [];
  return CONSUMER_PAGE_SUGGESTION_I18N_KEYS[pageId].map((key) => t(key));
}
