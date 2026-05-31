export interface QueuedMutation {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  createdAt: string;
}

export const OFFLINE_QUEUE_STORAGE_KEY = 'provider_offline_queue';

const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export function isOfflineMutation(method?: string): boolean {
  return MUTATION_METHODS.has((method ?? 'get').toLowerCase());
}

export function isNetworkError(error: { response?: unknown; code?: string; message?: string }): boolean {
  if (error.response) return false;
  const code = error.code ?? '';
  return code === 'ERR_NETWORK' || /network/i.test(error.message ?? '');
}

export function loadQueue(storage: Storage = localStorage): QueuedMutation[] {
  try {
    const raw = storage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedMutation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[], storage: Storage = localStorage): void {
  storage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueMutation(
  item: Pick<QueuedMutation, 'method' | 'url' | 'data'>,
  storage: Storage = localStorage,
): QueuedMutation {
  const entry: QueuedMutation = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    method: item.method.toLowerCase(),
    url: item.url,
    data: item.data,
  };
  const queue = loadQueue(storage);
  queue.push(entry);
  saveQueue(queue, storage);
  return entry;
}

export function removeMutation(id: string, storage: Storage = localStorage): void {
  saveQueue(loadQueue(storage).filter((item) => item.id !== id), storage);
}

export function clearQueue(storage: Storage = localStorage): void {
  storage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
}

export async function flushQueue(
  execute: (item: QueuedMutation) => Promise<void>,
  storage: Storage = localStorage,
): Promise<{ succeeded: number; failed: number }> {
  const queue = loadQueue(storage);
  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await execute(item);
      removeMutation(item.id, storage);
      succeeded += 1;
    } catch {
      failed += 1;
    }
  }

  return { succeeded, failed };
}
