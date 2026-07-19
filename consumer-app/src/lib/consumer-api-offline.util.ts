import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { enqueueMutation, flushQueue, isNetworkError, loadQueue } from './offline-queue.js';
import { shouldQueueConsumerOfflineMutation } from './consumer-offline-mutation.util.js';

export const CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT = 'consumer:offline-queue-changed';

export interface OfflineAxiosLikeConfig {
  method?: string;
  url?: string;
  data?: unknown;
  __offlineReplay?: boolean;
  __offlineQueued?: boolean;
}

export interface OfflineQueuedAxiosResponse {
  data: { queued: true; offline: true };
  status: 202;
  statusText: 'Queued Offline';
  headers: Record<string, never>;
  config: OfflineAxiosLikeConfig;
}

type OfflineAxiosRequestConfig = InternalAxiosRequestConfig & OfflineAxiosLikeConfig;

export function shouldReplayConsumerOfflineQueue(): boolean {
  return typeof window !== 'undefined' && navigator.onLine;
}

export function notifyConsumerOfflineQueueChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT));
  }
}

export function buildOfflineQueuedAxiosResponse(
  config: OfflineAxiosLikeConfig,
): OfflineQueuedAxiosResponse {
  enqueueMutation({
    method: config.method ?? 'post',
    url: config.url ?? '',
    data: config.data,
  });
  notifyConsumerOfflineQueueChanged();
  config.__offlineQueued = true;
  return {
    data: { queued: true, offline: true },
    status: 202,
    statusText: 'Queued Offline',
    headers: {},
    config,
  };
}

export function tryQueueConsumerOfflineAxiosError(error: {
  config?: OfflineAxiosLikeConfig;
  response?: unknown;
  code?: string;
  message?: string;
}): OfflineQueuedAxiosResponse | null {
  const config = error.config;
  if (!config || config.__offlineReplay || config.__offlineQueued) return null;
  const url = config.url ?? '';
  if (
    !shouldQueueConsumerOfflineMutation(config.method, url) ||
    !isNetworkError(error)
  ) {
    return null;
  }
  return buildOfflineQueuedAxiosResponse(config);
}

export function enqueueConsumerOfflineMutation(
  item: Pick<OfflineAxiosLikeConfig, 'method' | 'url' | 'data'>,
): void {
  buildOfflineQueuedAxiosResponse(item);
}

/** Flush queued cancel/reschedule mutations once the device is online (e2e-bug.16). */
export async function replayConsumerOfflineQueue(
  http: Pick<AxiosInstance, 'request'>,
): Promise<{ succeeded: number; failed: number }> {
  if (!shouldReplayConsumerOfflineQueue()) {
    return { succeeded: 0, failed: 0 };
  }
  if (loadQueue().length === 0) {
    return { succeeded: 0, failed: 0 };
  }

  const result = await flushQueue(async (item) => {
    await http.request({
      method: item.method,
      url: item.url,
      data: item.data,
      __offlineReplay: true,
    } as OfflineAxiosRequestConfig);
  });

  notifyConsumerOfflineQueueChanged();
  return result;
}

/**
 * e2e-bug.16 — wire the offline mutation queue into a real axios instance:
 * queue eligible network failures; flush on success responses and `online`.
 */
export function attachConsumerOfflineAxios(http: AxiosInstance): void {
  const replay = () => {
    void replayConsumerOfflineQueue(http);
  };

  http.interceptors.response.use(
    (res) => {
      replay();
      return res;
    },
    async (error: unknown) => {
      const queued = tryQueueConsumerOfflineAxiosError(
        error as {
          config?: OfflineAxiosLikeConfig;
          response?: unknown;
          code?: string;
          message?: string;
        },
      );
      if (queued) return queued;
      return Promise.reject(error);
    },
  );

  if (typeof window !== 'undefined') {
    window.addEventListener('online', replay);
  }
}
