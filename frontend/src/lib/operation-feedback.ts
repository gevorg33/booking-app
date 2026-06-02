import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { LOCALE_COOKIE, getMessages, type AppLocale, SUPPORTED_LOCALES } from '@/i18n';
import { operationFeedbackStore } from '@/lib/operation-feedback-store';

export type OperationKind = 'create' | 'update' | 'delete';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipOperationFeedback?: boolean;
    operationSuccessMessage?: string;
  }
}

export type PublicFetchInit = RequestInit & {
  skipOperationFeedback?: boolean;
  operationSuccessMessage?: string;
};

const SKIP_URL_PATTERNS: RegExp[] = [
  /\/auth\/(login|register|google|forgot-password|reset-password|switch-business)/i,
  /\/quote\b/i,
  /\/preview\b/i,
  /\/slots\b/i,
  /\/availability\b/i,
  /\/providers\b/i,
  /\/catalog\b/i,
  /\/onboarding\/status\b/i,
  /\/agents\/tasks\b/i,
  /\/notifications\/settings\b/i,
  /\/billing\/plans\b/i,
  /\/me\b/i,
  /\/status\b/i,
  /\/undo-latest\/preview\b/i,
  /\/checkout\b/i,
];

function readLocale(): AppLocale {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return SUPPORTED_LOCALES.includes(value as AppLocale) ? (value as AppLocale) : 'en';
}

function feedbackMessages() {
  const fb = getMessages(readLocale()).feedback;
  return {
    creating: fb.creating,
    updating: fb.updating,
    deleting: fb.deleting,
    created: fb.created,
    updated: fb.updated,
    deleted: fb.deleted,
    failed: fb.failed,
    failedCreate: fb.failedCreate,
    failedUpdate: fb.failedUpdate,
    failedDelete: fb.failedDelete,
    bookingCreated: fb.bookingCreated,
    bookingCancelled: fb.bookingCancelled,
    purchaseCompleted: fb.purchaseCompleted,
  };
}

function contextualSuccessMessage(path: string, kind: OperationKind): string | null {
  const m = feedbackMessages();
  if (kind === 'delete' && /\/cancel/i.test(path)) return m.bookingCancelled;
  if (kind === 'create') {
    if (/\/gift-card/i.test(path)) return m.purchaseCompleted;
    if (/\/book|\/multi-service|\/package/i.test(path)) return m.bookingCreated;
  }
  return null;
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

export function successMessageForKind(
  kind: OperationKind,
  custom?: string,
  url?: string,
): string {
  if (custom?.trim()) return custom.trim();
  if (url) {
    const contextual = contextualSuccessMessage(url.split('?')[0], kind);
    if (contextual) return contextual;
  }
  const m = feedbackMessages();
  if (kind === 'create') return m.created;
  if (kind === 'delete') return m.deleted;
  return m.updated;
}

export function failureMessageForKind(kind: OperationKind, error: unknown): string {
  const m = feedbackMessages();
  const detail = extractErrorMessage(error);
  const prefix =
    kind === 'create' ? m.failedCreate : kind === 'delete' ? m.failedDelete : m.failedUpdate;
  return detail ? `${prefix} ${detail}` : m.failed;
}

export function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  const axiosErr = error as AxiosError<{ message?: string | string[]; error?: string }>;
  const raw = axiosErr.response?.data?.message;
  if (Array.isArray(raw)) {
    const joined = raw.filter(Boolean).join(', ');
    return joined || null;
  }
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  const errField = axiosErr.response?.data?.error;
  if (typeof errField === 'string' && errField.trim()) return errField.trim();
  return null;
}

export function runWithOperationFeedback<T>(
  method: string,
  url: string,
  run: () => Promise<T>,
  options?: { skip?: boolean; successMessage?: string },
): Promise<T> {
  const kind = inferOperationKind(method);
  const show = kind && shouldShowOperationFeedback(method, url, options?.skip);
  if (show) operationFeedbackStore.start();
  return run()
    .then((result) => {
      if (show && kind) {
        operationFeedbackStore.pushSuccess(
          successMessageForKind(kind, options?.successMessage, url),
        );
      }
      return result;
    })
    .catch((error) => {
      if (show && kind) {
        operationFeedbackStore.pushError(failureMessageForKind(kind, error));
      }
      throw error;
    })
    .finally(() => {
      if (show) operationFeedbackStore.stop();
    });
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
            successMessageForKind(kind, config.operationSuccessMessage, url),
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
          operationFeedbackStore.pushError(failureMessageForKind(kind, error));
          operationFeedbackStore.stop();
        }
      }
      return Promise.reject(error);
    },
  );
}
