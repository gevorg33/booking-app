/** n99-4.8 — consumer push deliverability fixtures. */

export const PUSH_DELIVERY_ID_KEY = 'deliveryId';

export const PUSH_TOKEN_REFRESH_SCENARIOS = [
  { id: 'same-token', previous: 'abc', next: 'abc', shouldRefresh: false },
  { id: 'new-token', previous: 'abc', next: 'def', shouldRefresh: true },
  { id: 'first-token', previous: null, next: 'abc', shouldRefresh: false },
] as const;

export const PUSH_DELIVERY_ACK_SCENARIOS = [
  { id: 'missing-id', deliveryId: null, shouldAck: false },
  { id: 'blank-id', deliveryId: '   ', shouldAck: false },
  { id: 'valid-id', deliveryId: 'delivery-123', shouldAck: true },
] as const;
