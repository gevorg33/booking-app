import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { consumerCopyForLocale } from './copy.js';
import { isRetryableNetworkError } from './consumer-network-ux.util.js';
import { operationFeedbackStore } from './operation-feedback-store.js';

export type OperationKind = 'create' | 'update' | 'delete';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipOperationFeedback?: boolean;
    operationSuccessMessage?: string;
  }
}

const SKIP_URL_PATTERNS: RegExp[] = [
  /\/auth\//i,
  /\/quote\b/i,
  /\/preview\b/i,
  /\/slots\b/i,
  /\/availability\b/i,
  /\/providers\b/i,
  /\/events\/app\b/i,
  /\/mobile-app\/config\b/i,
];

function feedbackCopy() {
  return consumerCopyForLocale(
    typeof navigator !== 'undefined' ? navigator.language : 'en',
  );
}

export function inferOperationKind(method?: string): OperationKind | null {
  const m = (method ?? 'get').toLowerCase();
  if (m === 'get' || m === 'head' || m === 'options') return null;
  if (m === 'delete') return 'delete';
  if (m === 'post') return 'create';
  return 'update';
}

export function shouldShowOperationFeedback(
  method?: string,
  url?: string,
  skip?: boolean,
): boolean {
  if (skip) return false;
  const kind = inferOperationKind(method);
  if (!kind) return false;
  const path = (url ?? '').split('?')[0];
  return !SKIP_URL_PATTERNS.some((pattern) => pattern.test(path));
}

export function successMessageForKind(kind: OperationKind, custom?: string): string {
  if (custom?.trim()) return custom.trim();
  const copy = feedbackCopy();
  if (kind === 'create') return copy.networkFeedbackCreated;
  if (kind === 'delete') return copy.networkFeedbackDeleted;
  return copy.networkFeedbackUpdated;
}

export function failureMessageForKind(kind: OperationKind, error: unknown): string {
  const copy = feedbackCopy();
  if (isRetryableNetworkError(error)) return copy.networkLoadFailed;
  const detail = extractErrorMessage(error);
  const prefix =
    kind === 'create'
      ? copy.networkFeedbackFailedCreate
      : kind === 'delete'
        ? copy.networkFeedbackFailedDelete
        : copy.networkFeedbackFailedUpdate;
  return detail ? `${prefix} ${detail}` : copy.networkFeedbackFailed;
}

export function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  const axiosErr = error as AxiosError<{ message?: string | string[] }>;
  const raw = axiosErr.response?.data?.message;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ') || null;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
}

export function attachOperationFeedbackToAxios(api: AxiosInstance): void {
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const method = config.method;
    const url = config.url ?? '';
    if (shouldShowOperationFeedback(method, url, config.skipOperationFeedback)) {
      operationFeedbackStore.start();
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      const config = response.config;
      const method = config.method;
      const url = config.url ?? '';
      const kind = inferOperationKind(method);
      if (kind && shouldShowOperationFeedback(method, url, config.skipOperationFeedback)) {
        if (response.status !== 202) {
          operationFeedbackStore.pushSuccess(
            successMessageForKind(kind, config.operationSuccessMessage),
          );
        }
        operationFeedbackStore.stop();
      }
      return response;
    },
    (error: AxiosError) => {
      const config = error.config;
      if (config) {
        const method = config.method;
        const url = config.url ?? '';
        const kind = inferOperationKind(method);
        if (kind && shouldShowOperationFeedback(method, url, config.skipOperationFeedback)) {
          const copy = feedbackCopy();
          const retry =
            isRetryableNetworkError(error) && config
              ? {
                  retryLabel: copy.networkRetryAction,
                  onRetry: () => {
                    void api.request(config);
                  },
                }
              : undefined;
          operationFeedbackStore.pushError(failureMessageForKind(kind, error), retry);
          operationFeedbackStore.stop();
        }
      }
      return Promise.reject(error);
    },
  );
}
