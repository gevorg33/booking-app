import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OFFLINE_QUEUE_STORAGE_KEY,
  clearQueue,
  enqueueMutation,
  flushQueue,
  isNetworkError,
  isOfflineMutation,
  loadQueue,
  removeMutation,
} from './offline-queue';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe('offline-queue', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-1' });
  });

  it('detects offline mutation methods', () => {
    expect(isOfflineMutation('POST')).toBe(true);
    expect(isOfflineMutation('get')).toBe(false);
    expect(isOfflineMutation()).toBe(false);
  });

  it('detects network errors', () => {
    expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isNetworkError({ message: 'Network Error' })).toBe(true);
    expect(isNetworkError({ message: 'timeout of 0ms exceeded' })).toBe(false);
    expect(isNetworkError({})).toBe(false);
    expect(isNetworkError({ response: { status: 500 } })).toBe(false);
  });

  it('enqueues and loads mutations', () => {
    const item = enqueueMutation({ method: 'POST', url: '/bookings', data: { id: 1 } }, storage);
    expect(item.id).toBe('uuid-1');
    expect(loadQueue(storage)).toHaveLength(1);
  });

  it('removes and clears queued mutations', () => {
    enqueueMutation({ method: 'PATCH', url: '/bookings/1' }, storage);
    removeMutation('uuid-1', storage);
    expect(loadQueue(storage)).toHaveLength(0);
    enqueueMutation({ method: 'DELETE', url: '/bookings/2' }, storage);
    clearQueue(storage);
    expect(storage.getItem(OFFLINE_QUEUE_STORAGE_KEY)).toBeNull();
  });

  it('returns empty queue for invalid stored JSON', () => {
    storage.setItem(OFFLINE_QUEUE_STORAGE_KEY, '{bad json');
    expect(loadQueue(storage)).toEqual([]);
  });

  it('returns empty queue when storage is not an array', () => {
    storage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify({ not: 'array' }));
    expect(loadQueue(storage)).toEqual([]);
  });

  it('flushes queue and drops successful items', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-a' });
    enqueueMutation({ method: 'POST', url: '/a' }, storage);
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-b' });
    enqueueMutation({ method: 'POST', url: '/b' }, storage);
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-c' });
    enqueueMutation({ method: 'POST', url: '/c' }, storage);

    const execute = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(undefined);

    const result = await flushQueue(execute, storage);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(1);
    expect(loadQueue(storage)).toHaveLength(1);
    expect(loadQueue(storage)[0]?.url).toBe('/b');
  });
});
