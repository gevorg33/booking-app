import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_QUEUE_STORAGE_KEY, loadQueue } from './offline-queue';
import {
  PROVIDER_OFFLINE_QUEUE_CHANGED_EVENT,
  buildOfflineQueuedAxiosResponse,
  shouldReplayOfflineQueue,
  tryQueueOfflineAxiosError,
} from './provider-api-offline.util';

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

describe('provider-api-offline.util', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('crypto', { randomUUID: () => 'offline-uuid' });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects when offline queue replay is allowed', () => {
    expect(shouldReplayOfflineQueue()).toBe(true);
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(shouldReplayOfflineQueue()).toBe(false);
  });

  it('queues safe mutations and dispatches queue-changed event', () => {
    const handler = vi.fn();
    window.addEventListener(PROVIDER_OFFLINE_QUEUE_CHANGED_EVENT, handler);
    const response = buildOfflineQueuedAxiosResponse({
      method: 'put',
      url: '/businesses/b1/provider/bookings/b2',
      data: { paymentStatus: 'paid' },
    });
    const minimal = buildOfflineQueuedAxiosResponse({});
    expect(minimal.status).toBe(202);
    expect(response.status).toBe(202);
    expect(response.data).toEqual({ queued: true, offline: true });
    expect(response.config.__offlineQueued).toBe(true);
    expect(loadQueue(storage).length).toBeGreaterThanOrEqual(1);
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(PROVIDER_OFFLINE_QUEUE_CHANGED_EVENT, handler);
  });

  it('returns null for replay, unsafe, or non-network errors', () => {
    expect(
      tryQueueOfflineAxiosError({
        config: { __offlineReplay: true, url: '/x', method: 'put' },
        code: 'ERR_NETWORK',
      }),
    ).toBeNull();
    expect(
      tryQueueOfflineAxiosError({
        config: { __offlineQueued: true, url: '/x', method: 'put' },
        code: 'ERR_NETWORK',
      }),
    ).toBeNull();
    expect(
      tryQueueOfflineAxiosError({
        config: { url: '/businesses/b1/provider/ai/command', method: 'post' },
        code: 'ERR_NETWORK',
      }),
    ).toBeNull();
    expect(
      tryQueueOfflineAxiosError({
        config: { url: '/businesses/b1/provider/bookings/b2', method: 'put' },
        response: { status: 500 },
      }),
    ).toBeNull();
    expect(tryQueueOfflineAxiosError({})).toBeNull();
  });

  it('queues network failures for safe booking updates', () => {
    const response = tryQueueOfflineAxiosError({
      config: {
        method: 'put',
        data: { paymentStatus: 'paid' },
      },
      code: 'ERR_NETWORK',
    });
    expect(response).toBeNull();
    const queued = tryQueueOfflineAxiosError({
      config: {
        method: 'put',
        url: '/businesses/b1/provider/bookings/b2',
        data: { paymentStatus: 'paid' },
      },
      code: 'ERR_NETWORK',
    });
    expect(queued?.status).toBe(202);
    expect(storage.getItem(OFFLINE_QUEUE_STORAGE_KEY)).toBeTruthy();
  });
});
