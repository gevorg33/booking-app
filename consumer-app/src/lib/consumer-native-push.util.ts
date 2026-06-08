/** adopt-4.2 / adopt-4.3 — parse consumer FCM data and resolve deep links. */

import {
  buildBookServicePath,
  buildManageBookingPath,
  buildResultsPath,
  buildSalonPath,
  parseAccountRoute,
  parseBookServiceRoute,
  parseLabBookingRequestRoute,
  parseManageBookingRoute,
  parseResultReadyRoute,
  parseTenantSlugFromUrl,
  resolveLabBookingRequestNavigationPath,
} from './deep-link.js';

export type ConsumerTransactionalPushType =
  | 'result_ready'
  | 'lab_booking_request'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_rescheduled'
  | 'booking_cancelled'
  | 'gift_card_received'
  | 'rebooking_nudge'
  | 'win_back'
  | 'activation_concierge';

export interface ConsumerPushPayload {
  url?: string;
  pushType?: ConsumerTransactionalPushType;
  foregroundHint?: string;
  businessId?: string;
  customerId?: string;
  bookingId?: string;
  resultId?: string;
  orderId?: string;
  giftCardId?: string;
  serviceId?: string;
  deliveryId?: string;
}

const SALON_BOOKING_PUSH_TYPES = new Set<ConsumerTransactionalPushType>([
  'booking_confirmed',
  'booking_reminder',
  'booking_rescheduled',
  'booking_cancelled',
]);

const ALL_PUSH_TYPES = new Set<ConsumerTransactionalPushType>([
  'result_ready',
  'lab_booking_request',
  ...SALON_BOOKING_PUSH_TYPES,
  'gift_card_received',
  'rebooking_nudge',
  'win_back',
  'activation_concierge',
]);

export function parseConsumerPushPayload(
  data: Record<string, unknown> | undefined,
): ConsumerPushPayload {
  if (!data) return {};
  const str = (key: string) => {
    const value = data[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };
  const pushTypeRaw = str('pushType');
  const pushType =
    pushTypeRaw && ALL_PUSH_TYPES.has(pushTypeRaw as ConsumerTransactionalPushType)
      ? (pushTypeRaw as ConsumerTransactionalPushType)
      : undefined;
  return {
    url: str('url'),
    pushType,
    foregroundHint: str('foregroundHint'),
    businessId: str('businessId'),
    customerId: str('customerId'),
    bookingId: str('bookingId'),
    resultId: str('resultId'),
    orderId: str('orderId'),
    giftCardId: str('giftCardId'),
    serviceId: str('serviceId'),
    deliveryId: str('deliveryId'),
  };
}

export function shouldShowConsumerForegroundPush(payload: ConsumerPushPayload): boolean {
  if (payload.pushType && ALL_PUSH_TYPES.has(payload.pushType)) return true;
  return Boolean(payload.foregroundHint?.trim());
}

export function resolveConsumerPushRoute(rawUrl: string): string | null {
  const bookService = parseBookServiceRoute(rawUrl);
  if (bookService) {
    return buildBookServicePath(bookService.slug, bookService.serviceId, {
      employeeId: bookService.employeeId,
    });
  }

  const accountRoute = parseAccountRoute(rawUrl);
  if (accountRoute) {
    return buildSalonPath(accountRoute.slug, '/account');
  }

  const manageRoute = parseManageBookingRoute(rawUrl);
  if (manageRoute) {
    return buildManageBookingPath(
      manageRoute.slug,
      manageRoute.bookingId,
      manageRoute.token,
    );
  }

  const labRoute = parseLabBookingRequestRoute(rawUrl);
  if (labRoute) {
    return resolveLabBookingRequestNavigationPath(labRoute);
  }

  const resultRoute = parseResultReadyRoute(rawUrl);
  if (resultRoute) {
    return buildResultsPath(resultRoute.slug);
  }

  const slug = parseTenantSlugFromUrl(rawUrl);
  if (slug) {
    return buildSalonPath(slug);
  }

  return null;
}

export function resolveConsumerPushRouteFromPayload(
  payload: ConsumerPushPayload,
): string | null {
  if (payload.url) {
    const fromUrl = resolveConsumerPushRoute(payload.url);
    if (fromUrl) return fromUrl;
  }
  if (payload.bookingId && payload.url) {
    const manage = parseManageBookingRoute(payload.url);
    if (manage) {
      return buildManageBookingPath(manage.slug, manage.bookingId, manage.token);
    }
  }
  return null;
}

export const CONSUMER_PUSH_NAVIGATE_EVENT = 'consumer:push-navigate';

export function dispatchConsumerPushNavigation(rawUrl: string): void {
  const route = resolveConsumerPushRoute(rawUrl);
  if (!route) return;
  window.dispatchEvent(
    new CustomEvent(CONSUMER_PUSH_NAVIGATE_EVENT, { detail: { path: route } }),
  );
}

export function dispatchConsumerPushEffects(payload: ConsumerPushPayload): void {
  const route =
    (payload.url ? resolveConsumerPushRoute(payload.url) : null) ??
    resolveConsumerPushRouteFromPayload(payload);
  if (!route) return;
  window.dispatchEvent(
    new CustomEvent(CONSUMER_PUSH_NAVIGATE_EVENT, { detail: { path: route } }),
  );
}

export function isSalonBookingPush(payload: ConsumerPushPayload): boolean {
  return Boolean(
    payload.pushType && SALON_BOOKING_PUSH_TYPES.has(payload.pushType),
  );
}
