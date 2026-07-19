/** adopt-5.4 / e2e-bug.3 — friendly network errors + API message unwrapping. */

import { isNetworkError } from './offline-queue-core.util.js';

const AXIOS_STATUS_MESSAGE_RE = /^request failed with status code \d+$/i;

export function isRetryableNetworkError(error: unknown): boolean {
  if (isNetworkError(error as { response?: unknown; code?: string; message?: string })) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || message.includes('timeout') || message.includes('fetch');
  }
  return false;
}

/** HTTP status from an axios-like error, if present. */
export function getHttpErrorStatus(error: unknown): number | undefined {
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  return typeof status === 'number' ? status : undefined;
}

/**
 * Prefer Nest/axios `response.data.message` (string or validation string[])
 * over the generic "Request failed with status code NNN" Error.message.
 */
export function extractApiErrorMessage(error: unknown): string | null {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data;
  if (!data || typeof data !== 'object') return null;
  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  if (Array.isArray(message)) {
    const parts = message.filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0,
    );
    if (parts.length > 0) return parts.join(' ');
  }
  return null;
}

export function formatFriendlyNetworkError(
  error: unknown,
  fallback: string,
): string {
  if (isRetryableNetworkError(error)) return fallback;

  const apiMessage = extractApiErrorMessage(error);
  if (apiMessage) return apiMessage;

  if (error instanceof Error && error.message.trim()) {
    const trimmed = error.message.trim();
    if (AXIOS_STATUS_MESSAGE_RE.test(trimmed)) return fallback;
    return trimmed;
  }
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}

/** Backend multi-service / package block rejection when visit length exceeds business cap. */
const VISIT_DURATION_CAP_RE =
  /total visit duration|\bexceeds the \d+ minute limit\b/i;

/** e2e-bug.15 — detect duration-cap 400s (Nest message or leaked axios text). */
export function isVisitDurationCapError(error: unknown): boolean {
  const apiMessage = extractApiErrorMessage(error);
  if (apiMessage && VISIT_DURATION_CAP_RE.test(apiMessage)) return true;
  if (error instanceof Error && VISIT_DURATION_CAP_RE.test(error.message)) return true;
  if (typeof error === 'string' && VISIT_DURATION_CAP_RE.test(error)) return true;
  return false;
}

/**
 * e2e-bug.15 — package suggest-block / block-slots errors for the schedule UI.
 * Maps duration-cap rejections to customer copy; otherwise friendly network unwrap.
 */
export function formatPackageScheduleError(
  error: unknown,
  copy: { packageCannotSchedule: string; fallback: string },
): string {
  if (isVisitDurationCapError(error)) return copy.packageCannotSchedule;
  return formatFriendlyNetworkError(error, copy.fallback);
}
