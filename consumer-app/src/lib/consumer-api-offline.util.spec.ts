import { describe, expect, it, vi } from 'vitest';
import {
  buildOfflineQueuedAxiosResponse,
  tryQueueConsumerOfflineAxiosError,
} from './consumer-api-offline.util.js';

describe('consumer-api-offline.util', () => {
  it('queues eligible network failures', () => {
    const manageResponse = tryQueueConsumerOfflineAxiosError({
      config: { method: 'post', url: '/public/demo/bookings/manage/cancel' },
      code: 'ERR_NETWORK',
    });
    expect(manageResponse?.status).toBe(202);
    expect(manageResponse?.data).toEqual({ queued: true, offline: true });

    expect(
      tryQueueConsumerOfflineAxiosError({
        config: { method: 'post', url: '/public/demo/me/bookings/b1/cancel' },
        code: 'ERR_NETWORK',
      })?.status,
    ).toBe(202);
  });

  it('ignores replay and non-network errors', () => {
    expect(
      tryQueueConsumerOfflineAxiosError({
        config: { method: 'post', url: '/public/demo/bookings/manage/cancel', __offlineReplay: true },
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
    window.addEventListener('consumer:offline-queue-changed', handler);
    buildOfflineQueuedAxiosResponse({
      method: 'post',
      url: '/public/demo/bookings/manage/reschedule',
    });
    expect(handler).toHaveBeenCalled();
  });
});
