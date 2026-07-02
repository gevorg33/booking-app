/** adopt-5.4 — network-aware mutation feedback helpers for booking flows. */

import { consumerCopyForLocale } from './copy.js';
import {
  formatFriendlyNetworkError,
  isRetryableNetworkError,
} from './consumer-network-ux.util.js';
import { operationFeedbackStore } from './operation-feedback-store.js';

function readLocale(): string {
  return typeof navigator !== 'undefined' ? navigator.language : 'en';
}

/** Push a localized network error toast with networkRetryAction + onRetry handler. */
export function pushNetworkOperationError(
  error: unknown,
  onRetry: () => void,
  locale?: string,
): void {
  const copy = consumerCopyForLocale(locale ?? readLocale());
  const message = formatFriendlyNetworkError(error, copy.networkLoadFailed);
  operationFeedbackStore.pushError(message, {
    retryLabel: copy.networkRetryAction,
    onRetry,
  });
}

export function isNetworkOperationError(error: unknown): boolean {
  return isRetryableNetworkError(error);
}
