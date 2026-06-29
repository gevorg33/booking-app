import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { AppLocale } from '@shared-i18n/types';
import { getMessages } from '../i18n/catalog';
import { resolveProviderAppLocale } from '../i18n/resolve-locale';
import { useAuthStore } from '../services/auth-store';
import { operationFeedbackStore } from './operation-feedback-store';

export type OperationKind = 'create' | 'update' | 'delete';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipOperationFeedback?: boolean;
    operationSuccessMessage?: string;
  }
}

const SKIP_URL_PATTERNS: RegExp[] = [
  /\/auth\/(login|google|forgot-password)/i,
  /\/quote\b/i,
  /\/preview\b/i,
  /\/slots\b/i,
  /\/availability\b/i,
  /\/providers\b/i,
  /\/me\b/i,
  /\/status\b/i,
  /\/provider\/ai\//i,
  /\/events\/app\b/i,
  /\/push\//i,
  /\/register-native\b/i,
];

function currentLocale(): AppLocale {
  const { user, business } = useAuthStore.getState();
  return resolveProviderAppLocale(user?.locale, business?.locale);
}

type FeedbackMessages = {
  creating: string;
  updating: string;
  deleting: string;
  created: string;
  updated: string;
  deleted: string;
  failed: string;
  failedCreate: string;
  failedUpdate: string;
  failedDelete: string;
  bookingCreated: string;
  bookingCancelled: string;
  purchaseCompleted: string;
};

function feedbackMessages(): FeedbackMessages {
  const fb = getMessages(currentLocale()).feedback as FeedbackMessages;
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
  const m = feedbackMessages();
  if (kind === 'create') return m.created;
  if (kind === 'delete') return m.deleted;
  return m.updated;
}

export function failureMessageForKind(kind: OperationKind, error: unknown): string {
  const detail = extractErrorMessage(error);
  const m = feedbackMessages();
  const prefix =
    kind === 'create' ? m.failedCreate : kind === 'delete' ? m.failedDelete : m.failedUpdate;
  return detail ? `${prefix} ${detail}` : m.failed;
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
          operationFeedbackStore.pushError(failureMessageForKind(kind, error));
          operationFeedbackStore.stop();
        }
      }
      return Promise.reject(error);
    },
  );
}
