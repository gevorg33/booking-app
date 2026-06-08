import {
  clearQueue as clearQueueCore,
  enqueueMutation as enqueueMutationCore,
  flushQueue as flushQueueCore,
  loadQueue as loadQueueCore,
  removeMutation as removeMutationCore,
  type QueuedMutation,
} from './offline-queue-core.util.js';

export type { QueuedMutation };
export {
  isNetworkError,
  isOfflineMutation,
} from './offline-queue-core.util.js';

export const CONSUMER_OFFLINE_QUEUE_STORAGE_KEY = 'consumer_offline_queue';

export function loadQueue(storage: Storage = localStorage): QueuedMutation[] {
  return loadQueueCore(CONSUMER_OFFLINE_QUEUE_STORAGE_KEY, storage);
}

export function enqueueMutation(
  item: Pick<QueuedMutation, 'method' | 'url' | 'data'>,
  storage: Storage = localStorage,
): QueuedMutation {
  return enqueueMutationCore(CONSUMER_OFFLINE_QUEUE_STORAGE_KEY, item, storage);
}

export function removeMutation(id: string, storage: Storage = localStorage): void {
  removeMutationCore(CONSUMER_OFFLINE_QUEUE_STORAGE_KEY, id, storage);
}

export function clearQueue(storage: Storage = localStorage): void {
  clearQueueCore(CONSUMER_OFFLINE_QUEUE_STORAGE_KEY, storage);
}

export async function flushQueue(
  execute: (item: QueuedMutation) => Promise<void>,
  storage: Storage = localStorage,
): Promise<{ succeeded: number; failed: number }> {
  return flushQueueCore(CONSUMER_OFFLINE_QUEUE_STORAGE_KEY, execute, storage);
}
