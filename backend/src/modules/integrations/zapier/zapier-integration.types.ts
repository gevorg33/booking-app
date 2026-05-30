import { EventType } from '../../../events/event-types.js';

export const ZAPIER_TRIGGER_EVENTS = [
  EventType.BOOKING_CREATED,
  EventType.BOOKING_CANCELLED,
  EventType.BOOKING_COMPLETED,
  EventType.BOOKING_RESCHEDULED,
  EventType.PAYMENT_RECEIVED,
] as const;

export type ZapierTriggerEvent = (typeof ZAPIER_TRIGGER_EVENTS)[number];

export interface ZapierSamplePayload {
  event: string;
  businessId: string;
  aggregateId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface BusinessZapierIntegration {
  enabled?: boolean;
  /** Optional label for the Zapier catch hook */
  hookDescription?: string;
}

export function getBusinessZapierIntegration(
  settings?: Record<string, unknown>,
): BusinessZapierIntegration {
  const integrations = settings?.integrations as Record<string, unknown> | undefined;
  return (integrations?.zapier as BusinessZapierIntegration) || {};
}
