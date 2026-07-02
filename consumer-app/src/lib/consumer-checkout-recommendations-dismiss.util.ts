/** Client-side dismiss state for checkout success product cards (ai-cmd-customer-6.10.1). */

export const CONSUMER_DISMISS_CHECKOUT_RECOMMENDATIONS_EVENT =
  'consumer:dismiss-checkout-recommendations';

export function buildCheckoutRecommendationsDismissKey(
  slug: string,
  bookingId?: string,
  serviceId?: string,
): string {
  const scope = bookingId?.trim() || serviceId?.trim() || 'global';
  return `checkout-recommendations-dismissed:${slug}:${scope}`;
}

export function isCheckoutRecommendationsDismissed(key: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(key) === '1';
}

export function dismissCheckoutRecommendations(key: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(key, '1');
}

export function dispatchDismissConsumerCheckoutRecommendations(detail?: {
  slug?: string;
  bookingId?: string;
  serviceId?: string;
}): void {
  if (typeof window === 'undefined') return;
  if (detail?.slug) {
    const key = buildCheckoutRecommendationsDismissKey(
      detail.slug,
      detail.bookingId,
      detail.serviceId,
    );
    dismissCheckoutRecommendations(key);
  }
  window.dispatchEvent(
    new CustomEvent(CONSUMER_DISMISS_CHECKOUT_RECOMMENDATIONS_EVENT, {
      detail,
    }),
  );
}
