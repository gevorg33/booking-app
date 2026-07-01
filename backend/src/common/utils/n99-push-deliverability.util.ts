import {
  N99_APNS_ERROR_CODES,
  N99_FCM_INVALID_TOKEN_ERROR_CODES,
  N99_FCM_TRANSIENT_ERROR_CODES,
  N99_PUSH_SILENT_FAILURE_WINDOW_MS,
} from './n99-push-deliverability.fixtures.js';

export {
  N99_APNS_ERROR_CODES,
  N99_FCM_INVALID_TOKEN_ERROR_CODES,
  N99_FCM_TRANSIENT_ERROR_CODES,
  N99_PUSH_DELIVERABILITY_ERROR_SCENARIOS,
  N99_PUSH_SILENT_FAILURE_SCENARIOS,
  N99_PUSH_SILENT_FAILURE_WINDOW_MS,
  N99_PUSH_TOKEN_REFRESH_SCENARIOS,
} from './n99-push-deliverability.fixtures.js';

export type FcmDeliveryErrorAction = 'invalidate_token' | 'record_failure';

export type FcmDeliveryErrorProvider = 'fcm' | 'apns' | 'unknown';

export interface FcmDeliveryErrorClassification {
  code: string;
  action: FcmDeliveryErrorAction;
  provider: FcmDeliveryErrorProvider;
  retryable: boolean;
}

export interface PushDeliveryAckCandidate {
  id: string;
  lastFcmAcceptedAt: Date | null;
  lastDeliveryAckAt: Date | null;
  lastSilentFailureAt?: Date | null;
}

const INVALID_TOKEN_CODES = new Set<string>(N99_FCM_INVALID_TOKEN_ERROR_CODES);
const TRANSIENT_ERROR_CODES = new Set<string>(N99_FCM_TRANSIENT_ERROR_CODES);
const APNS_ERROR_CODES = new Set<string>(N99_APNS_ERROR_CODES);

export function classifyFcmDeliveryError(
  errorCode: string | null | undefined,
): FcmDeliveryErrorClassification {
  const code = (errorCode ?? 'unknown').trim() || 'unknown';
  if (INVALID_TOKEN_CODES.has(code)) {
    return {
      code,
      action: 'invalidate_token',
      provider: 'fcm',
      retryable: false,
    };
  }
  if (APNS_ERROR_CODES.has(code)) {
    return {
      code,
      action: 'record_failure',
      provider: 'apns',
      retryable: false,
    };
  }
  if (TRANSIENT_ERROR_CODES.has(code)) {
    return { code, action: 'record_failure', provider: 'fcm', retryable: true };
  }
  return {
    code,
    action: 'record_failure',
    provider: 'unknown',
    retryable: false,
  };
}

export function shouldInvalidatePushToken(
  classification: FcmDeliveryErrorClassification,
): boolean {
  return classification.action === 'invalidate_token';
}

export function shouldRefreshConsumerPushToken(
  previousToken: string | null | undefined,
  nextToken: string,
): boolean {
  const trimmedNext = nextToken.trim();
  if (!trimmedNext) return false;
  const trimmedPrevious = previousToken?.trim();
  if (!trimmedPrevious) return false;
  return trimmedPrevious !== trimmedNext;
}

export function detectSilentDeliveryFailure(input: {
  lastFcmAcceptedAt: Date | string | null;
  lastDeliveryAckAt: Date | string | null;
  lastSilentFailureAt?: Date | string | null;
  now?: Date | string;
  windowMs?: number;
}): boolean {
  const acceptedAt = toDate(input.lastFcmAcceptedAt);
  if (!acceptedAt) return false;

  const silentFailureAt = toDate(input.lastSilentFailureAt);
  if (silentFailureAt && silentFailureAt.getTime() >= acceptedAt.getTime()) {
    return false;
  }

  const now = toDate(input.now ?? new Date());
  if (!now) return false;

  const windowMs = input.windowMs ?? N99_PUSH_SILENT_FAILURE_WINDOW_MS;
  if (now.getTime() - acceptedAt.getTime() < windowMs) return false;

  const ackAt = toDate(input.lastDeliveryAckAt);
  if (!ackAt) return true;
  return ackAt.getTime() < acceptedAt.getTime();
}

export function resolveSilentFailureCandidates(
  tokens: PushDeliveryAckCandidate[],
  now = new Date(),
  windowMs = N99_PUSH_SILENT_FAILURE_WINDOW_MS,
): string[] {
  return tokens
    .filter((token) =>
      detectSilentDeliveryFailure({
        lastFcmAcceptedAt: token.lastFcmAcceptedAt,
        lastDeliveryAckAt: token.lastDeliveryAckAt,
        lastSilentFailureAt: token.lastSilentFailureAt,
        now,
        windowMs,
      }),
    )
    .map((token) => token.id);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
