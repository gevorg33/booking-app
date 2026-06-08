import { enqueueMutation, isNetworkError } from './offline-queue.js';
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

export function shouldReplayConsumerOfflineQueue(): boolean {
  return typeof window !== 'undefined' && navigator.onLine;
}

export function buildOfflineQueuedAxiosResponse(
  config: OfflineAxiosLikeConfig,
): OfflineQueuedAxiosResponse {
  enqueueMutation({
    method: config.method ?? 'post',
    url: config.url ?? '',
    data: config.data,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT));
  }
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
