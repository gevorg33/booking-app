/** n99-4.8 — deliverability hardening fixtures. */

export const N99_PUSH_SILENT_FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const N99_FCM_INVALID_TOKEN_ERROR_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
  'messaging/unregistered',
] as const;

export const N99_FCM_TRANSIENT_ERROR_CODES = [
  'messaging/unavailable',
  'messaging/internal-error',
  'messaging/server-unavailable',
  'messaging/quota-exceeded',
  'messaging/message-rate-exceeded',
] as const;

export const N99_APNS_ERROR_CODES = [
  'messaging/third-party-auth-error',
  'messaging/authentication-error',
  'messaging/device-message-rate-exceeded',
  'messaging/topics-message-rate-exceeded',
] as const;

export const N99_PUSH_DELIVERABILITY_ERROR_SCENARIOS = [
  {
    id: 'invalidate-unregistered',
    code: 'messaging/registration-token-not-registered',
    action: 'invalidate_token',
    provider: 'fcm',
  },
  {
    id: 'invalidate-invalid-token',
    code: 'messaging/invalid-registration-token',
    action: 'invalidate_token',
    provider: 'fcm',
  },
  {
    id: 'record-apns-auth',
    code: 'messaging/third-party-auth-error',
    action: 'record_failure',
    provider: 'apns',
  },
  {
    id: 'record-transient-unavailable',
    code: 'messaging/unavailable',
    action: 'record_failure',
    provider: 'fcm',
  },
  {
    id: 'record-unknown',
    code: 'messaging/unknown-error',
    action: 'record_failure',
    provider: 'unknown',
  },
] as const;

export const N99_PUSH_TOKEN_REFRESH_SCENARIOS = [
  { id: 'same-token', previous: 'abc', next: 'abc', shouldRefresh: false },
  { id: 'new-token', previous: 'abc', next: 'def', shouldRefresh: true },
  { id: 'first-token', previous: null, next: 'abc', shouldRefresh: false },
] as const;

export const N99_PUSH_SILENT_FAILURE_SCENARIOS = [
  {
    id: 'ack-before-window',
    lastFcmAcceptedAt: '2026-06-08T10:00:00.000Z',
    lastDeliveryAckAt: '2026-06-08T10:00:05.000Z',
    now: '2026-06-08T11:00:00.000Z',
    isSilentFailure: false,
  },
  {
    id: 'missing-ack-after-window',
    lastFcmAcceptedAt: '2026-06-07T10:00:00.000Z',
    lastDeliveryAckAt: null,
    now: '2026-06-08T11:00:00.000Z',
    isSilentFailure: true,
  },
  {
    id: 'stale-ack-after-window',
    lastFcmAcceptedAt: '2026-06-08T10:00:00.000Z',
    lastDeliveryAckAt: '2026-06-07T10:00:00.000Z',
    now: '2026-06-09T11:00:00.000Z',
    isSilentFailure: true,
  },
] as const;
