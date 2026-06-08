/** adopt-5.4 — friendly network errors + retry helpers. */

import { isNetworkError } from './offline-queue-core.util.js';

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

export function formatFriendlyNetworkError(
  error: unknown,
  fallback: string,
): string {
  if (isRetryableNetworkError(error)) return fallback;
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}
