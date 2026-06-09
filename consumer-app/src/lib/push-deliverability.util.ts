import type { AppAnalyticsEventProps } from './app-analytics.js';
import { PUSH_DELIVERY_ID_KEY } from './push-deliverability.fixtures.js';

export {
  PUSH_DELIVERY_ACK_SCENARIOS,
  PUSH_DELIVERY_ID_KEY,
  PUSH_TOKEN_REFRESH_SCENARIOS,
} from './push-deliverability.fixtures.js';

export function shouldRefreshCachedPushToken(
  previousToken: string | null | undefined,
  nextToken: string,
): boolean {
  const trimmedNext = nextToken.trim();
  if (!trimmedNext) return false;
  const trimmedPrevious = previousToken?.trim();
  if (!trimmedPrevious) return false;
  return trimmedPrevious !== trimmedNext;
}

export function readPushDeliveryId(
  data: Record<string, unknown> | null | undefined,
): string | null {
  const raw = data?.[PUSH_DELIVERY_ID_KEY];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function shouldAckPushDelivery(deliveryId: string | null | undefined): boolean {
  return typeof deliveryId === 'string' && deliveryId.trim().length > 0;
}

export function buildPushTokenRefreshAnalyticsProps(
  platform: string,
): AppAnalyticsEventProps {
  return {
    pushTokenRefresh: true,
    platform,
  };
}

export function buildPushDeliveryAckAnalyticsProps(
  deliveryId: string,
  platform: string,
): AppAnalyticsEventProps {
  return {
    pushDeliveryAck: true,
    deliveryId,
    platform,
  };
}
