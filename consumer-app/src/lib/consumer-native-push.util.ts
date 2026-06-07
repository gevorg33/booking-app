/** adopt-4.1.clinic — parse consumer FCM data and resolve deep links. */

import {
  parseLabBookingRequestRoute,
  parseResultReadyRoute,
  resolveLabBookingRequestNavigationPath,
  buildResultsPath,
} from './deep-link.js';

export type ConsumerTransactionalPushType = 'result_ready' | 'lab_booking_request';

export interface ConsumerPushPayload {
  url?: string;
  pushType?: ConsumerTransactionalPushType;
  foregroundHint?: string;
  businessId?: string;
  customerId?: string;
  resultId?: string;
  orderId?: string;
}

export function parseConsumerPushPayload(
  data: Record<string, unknown> | undefined,
): ConsumerPushPayload {
  if (!data) return {};
  const str = (key: string) => {
    const value = data[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };
  const pushType = str('pushType');
  return {
    url: str('url'),
    pushType:
      pushType === 'result_ready' || pushType === 'lab_booking_request'
        ? pushType
        : undefined,
    foregroundHint: str('foregroundHint'),
    businessId: str('businessId'),
    customerId: str('customerId'),
    resultId: str('resultId'),
    orderId: str('orderId'),
  };
}

export function shouldShowConsumerForegroundPush(payload: ConsumerPushPayload): boolean {
  return (
    payload.pushType === 'result_ready' ||
    payload.pushType === 'lab_booking_request' ||
    Boolean(payload.foregroundHint?.trim())
  );
}

export function resolveConsumerPushRoute(rawUrl: string): string | null {
  const labRoute = parseLabBookingRequestRoute(rawUrl);
  if (labRoute) {
    return resolveLabBookingRequestNavigationPath(labRoute);
  }
  const resultRoute = parseResultReadyRoute(rawUrl);
  if (resultRoute) {
    return buildResultsPath(resultRoute.slug);
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
