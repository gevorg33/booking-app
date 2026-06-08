import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CONSUMER_OFFLINE_QUEUE_STORAGE_KEY,
  clearQueue,
  enqueueMutation,
  flushQueue,
  isNetworkError,
  isOfflineMutation,
  loadQueue,
  removeMutation,
} from './offline-queue.js';

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

describe('consumer offline-queue', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-1' });
  });

  it('uses consumer storage key', () => {
    expect(CONSUMER_OFFLINE_QUEUE_STORAGE_KEY).toBe('consumer_offline_queue');
  });

  it('enqueues and flushes mutations', async () => {
    enqueueMutation({ method: 'post', url: '/public/x/bookings/manage/cancel', data: { id: '1' } }, storage);
    expect(loadQueue(storage)).toHaveLength(1);
    const result = await flushQueue(async () => undefined, storage);
    expect(result).toEqual({ succeeded: 1, failed: 0 });
    expect(loadQueue(storage)).toHaveLength(0);
  });

  it('detects offline methods and network errors', () => {
    expect(isOfflineMutation('patch')).toBe(true);
    expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    removeMutation('missing', storage);
    clearQueue(storage);
    expect(loadQueue(storage)).toEqual([]);
  });
});
