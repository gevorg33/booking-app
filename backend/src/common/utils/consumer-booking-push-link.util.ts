/** adopt-4.2 — consumer app deep links for salon transactional push. */

export function buildConsumerBookingManagePushUrl(
  slug: string,
  bookingId: string,
  token: string,
): string {
  const params = new URLSearchParams({ bookingId, token });
  return `optischedule://book/${slug.trim()}/manage?${params.toString()}`;
}

export function buildConsumerSalonHomePushUrl(slug: string): string {
  return `optischedule://book/${slug.trim()}`;
}

export function buildConsumerGiftCardPushUrl(slug: string): string {
  return buildConsumerSalonHomePushUrl(slug);
}

export function buildConsumerBookServicePushUrl(
  slug: string,
  serviceId: string,
): string {
  return `optischedule://book/${slug.trim()}/book/${serviceId.trim()}`;
}
