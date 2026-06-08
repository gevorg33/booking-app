import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { flushQueue } from '../lib/offline-queue';
import type { MobileAppConfigView } from '../lib/app-version-gate.util';
import {
  shouldReplayOfflineQueue,
  tryQueueOfflineAxiosError,
} from '../lib/provider-api-offline.util';
import { attachOperationFeedbackToAxios } from '../lib/operation-feedback';

/** Android emulator uses 10.0.2.2; physical devices need your Mac LAN IP in VITE_API_URL. */
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && /localhost|127\.0\.0\.1/.test(envUrl)) {
    return envUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }
  return envUrl;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

attachOperationFeedbackToAxios(api);

type OfflineAxiosConfig = {
  __offlineReplay?: boolean;
  __offlineQueued?: boolean;
};

async function replayOfflineQueue(): Promise<void> {
  if (!shouldReplayOfflineQueue()) return;
  await flushQueue(async (item) => {
    await api.request({
      method: item.method,
      url: item.url,
      data: item.data,
      __offlineReplay: true,
    } as OfflineAxiosConfig & Parameters<typeof api.request>[0]);
  });
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    void replayOfflineQueue();
    return res;
  },
  async (error) => {
    const config = (error.config ?? {}) as OfflineAxiosConfig & typeof error.config;
    const url = config?.url ?? '';
    const isAuth = ['/auth/login', '/auth/google', '/auth/forgot-password'].some((p) => url.includes(p));

    const queued = tryQueueOfflineAxiosError(error);
    if (queued) return queued;

    if (error.response?.status === 401 && !isAuth) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void replayOfflineQueue();
  });
}

export function unwrap<T>(data: unknown): T {
  return ((data as { data?: T })?.data ?? data) as T;
}

export interface AppAnalyticsIngestBody {
  businessId?: string;
  tenantSlug?: string;
  consentGranted: boolean;
  events: Array<Record<string, unknown>>;
}

/** adopt-1.1 — batched adoption telemetry ingest (consent-gated, no PII). */
export async function recordAppAnalyticsEvents(
  body: AppAnalyticsIngestBody,
): Promise<{ recorded: number; skipped: number }> {
  const { data } = await api.post('/events/app', body);
  return unwrap<{ recorded: number; skipped: number }>(data);
}

export async function fetchMobileAppConfig(input: {
  surface: 'consumer_app' | 'provider_app';
  platform: 'ios' | 'android' | 'web';
  version?: string;
}): Promise<MobileAppConfigView> {
  const params = new URLSearchParams({
    surface: input.surface,
    platform: input.platform,
  });
  if (input.version?.trim()) params.set('version', input.version.trim());
  const { data } = await api.get(`/mobile-app/config?${params.toString()}`);
  return unwrap<MobileAppConfigView>(data);
}

export default api;
