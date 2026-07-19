import type { AxiosInstance } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachConsumerOfflineAxios,
  buildOfflineQueuedAxiosResponse,
  CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT,
  replayConsumerOfflineQueue,
  shouldReplayConsumerOfflineQueue,
  tryQueueConsumerOfflineAxiosError,
} from './consumer-api-offline.util.js';
import { clearQueue, loadQueue } from './offline-queue.js';

describe('consumer-api-offline.util', () => {
  beforeEach(() => {
    clearQueue();
    vi.stubGlobal('crypto', { randomUUID: () => `uuid-${loadQueue().length + 1}` });
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  afterEach(() => {
    clearQueue();
    vi.unstubAllGlobals();
  });

  it('queues eligible network failures', () => {
    const manageResponse = tryQueueConsumerOfflineAxiosError({
      config: { method: 'post', url: '/public/demo/bookings/manage/cancel' },
      code: 'ERR_NETWORK',
    });
    expect(manageResponse?.status).toBe(202);
    expect(manageResponse?.data).toEqual({ queued: true, offline: true });
    expect(loadQueue()).toHaveLength(1);

    expect(
      tryQueueConsumerOfflineAxiosError({
        config: { method: 'post', url: '/public/demo/me/bookings/b1/cancel' },
        code: 'ERR_NETWORK',
      })?.status,
    ).toBe(202);
    expect(loadQueue()).toHaveLength(2);
  });

  it('ignores replay and non-network errors', () => {
    expect(
      tryQueueConsumerOfflineAxiosError({
        config: {
          method: 'post',
          url: '/public/demo/bookings/manage/cancel',
          __offlineReplay: true,
        },
        code: 'ERR_NETWORK',
      }),
    ).toBeNull();
    expect(
      tryQueueConsumerOfflineAxiosError({
        config: { method: 'post', url: '/public/demo/bookings' },
        code: 'ERR_NETWORK',
      }),
    ).toBeNull();
  });

  it('dispatches queue changed event', () => {
    const handler = vi.fn();
    window.addEventListener(CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT, handler);
    buildOfflineQueuedAxiosResponse({
      method: 'post',
      url: '/public/demo/bookings/manage/reschedule',
    });
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT, handler);
  });

  it('shouldReplayConsumerOfflineQueue follows navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    expect(shouldReplayConsumerOfflineQueue()).toBe(true);
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    expect(shouldReplayConsumerOfflineQueue()).toBe(false);
  });

  it('e2e-bug.16-replay: flushes queued mutations when online', async () => {
    buildOfflineQueuedAxiosResponse({
      method: 'post',
      url: '/public/demo/bookings/manage/cancel',
      data: { bookingId: 'b1', token: 't' },
    });
    expect(loadQueue()).toHaveLength(1);

    const request = vi.fn().mockResolvedValue({ status: 200, data: {} });
    const changed = vi.fn();
    window.addEventListener(CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT, changed);

    const result = await replayConsumerOfflineQueue({ request });
    expect(result).toEqual({ succeeded: 1, failed: 0 });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: '/public/demo/bookings/manage/cancel',
        data: { bookingId: 'b1', token: 't' },
        __offlineReplay: true,
      }),
    );
    expect(loadQueue()).toHaveLength(0);
    expect(changed).toHaveBeenCalled();
    window.removeEventListener(CONSUMER_OFFLINE_QUEUE_CHANGED_EVENT, changed);
  });

  it('e2e-bug.16-replay-offline: does not flush while offline', async () => {
    buildOfflineQueuedAxiosResponse({
      method: 'post',
      url: '/public/demo/bookings/manage/cancel',
    });
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    const request = vi.fn();
    expect(await replayConsumerOfflineQueue({ request })).toEqual({
      succeeded: 0,
      failed: 0,
    });
    expect(request).not.toHaveBeenCalled();
    expect(loadQueue()).toHaveLength(1);
  });

  it('e2e-bug.16-attach: wires response interceptor + online listener', async () => {
    const handlers: {
      response?: {
        fulfilled: (r: unknown) => unknown;
        rejected: (e: unknown) => unknown;
      };
    } = {};
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const request = vi.fn().mockResolvedValue({ status: 200, data: {} });

    const api = {
      request,
      interceptors: {
        response: {
          use: (ok: (r: unknown) => unknown, err: (e: unknown) => unknown) => {
            handlers.response = { fulfilled: ok, rejected: err };
          },
        },
      },
    } as unknown as AxiosInstance;

    attachConsumerOfflineAxios(api);

    expect(addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(handlers.response).toBeDefined();

    const queued = await handlers.response!.rejected({
      config: { method: 'post', url: '/public/demo/bookings/manage/cancel' },
      code: 'ERR_NETWORK',
    });
    expect(queued).toMatchObject({
      status: 202,
      data: { queued: true, offline: true },
    });
    expect(loadQueue()).toHaveLength(1);

    await expect(
      handlers.response!.rejected({
        config: { method: 'get', url: '/public/demo' },
        code: 'ERR_NETWORK',
      }),
    ).rejects.toBeDefined();

    handlers.response!.fulfilled({ status: 200, data: {} });
    await vi.waitFor(() => {
      expect(request).toHaveBeenCalled();
      expect(loadQueue()).toHaveLength(0);
    });

    addEventListener.mockRestore();
  });
});
