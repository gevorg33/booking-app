import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  aiConfirmErrorMessage,
  applyAiConfirmOptimistic,
  networkPromptErrorMessage,
  offlinePromptBlockedMessage,
  prepareAiConfirmSnapshots,
  resolveAiConfirmResponse,
  rollbackAiConfirmSnapshots,
} from './provider-ai-assistant-offline.util';

describe('provider-ai-assistant-offline.util', () => {
  const t = (key: string) => key;
  const businessId = 'biz-1';

  it('returns offline prompt and network error messages', () => {
    expect(offlinePromptBlockedMessage(t)).toBe('provider.offlineCommandNeedsNetwork');
    expect(networkPromptErrorMessage({ code: 'ERR_NETWORK' }, t, 'fallback')).toBe(
      'provider.offlineCommandNeedsNetwork',
    );
    expect(networkPromptErrorMessage({ response: { data: { message: 'Nope' } } }, t, 'fallback')).toBe(
      'Nope',
    );
    expect(networkPromptErrorMessage({}, t, 'fallback')).toBe('fallback');
    expect(aiConfirmErrorMessage({ response: { data: { message: 'Denied' } } }, t)).toBe('Denied');
    expect(aiConfirmErrorMessage({}, t)).toBe('provider.assistantConfirmFailed');
  });

  it('prepares, applies, and rolls back optimistic confirm snapshots', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['provider-today', businessId], {
      viewMode: 'provider',
      employee: null,
      bookings: [
        {
          id: 'b1',
          startTime: '2026-06-02T10:00:00.000Z',
          endTime: '2026-06-02T11:00:00.000Z',
          status: 'confirmed',
          notes: null,
          service: null,
          customer: null,
        },
      ],
    });
    queryClient.setQueryData(['provider-booking', businessId, 'b1'], {
      id: 'b1',
      startTime: '2026-06-02T10:00:00.000Z',
      endTime: '2026-06-02T11:00:00.000Z',
      status: 'confirmed',
      paymentStatus: 'pending',
      service: null,
      customer: null,
    });
    const snapshots = prepareAiConfirmSnapshots(queryClient, businessId, ['b1']);
    applyAiConfirmOptimistic(queryClient, businessId, ['b1'], {
      action: 'payment_sweep',
      params: {},
    });
    expect(
      queryClient.getQueryData<{ paymentStatus?: string }>(['provider-booking', businessId, 'b1'])
        ?.paymentStatus,
    ).toBe('paid');
    rollbackAiConfirmSnapshots(queryClient, businessId, snapshots);
    expect(
      queryClient.getQueryData<{ paymentStatus?: string }>(['provider-booking', businessId, 'b1'])
        ?.paymentStatus,
    ).toBe('pending');
  });

  it('skips optimistic patch for unsupported actions', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['provider-today', businessId], {
      viewMode: 'provider',
      employee: null,
      bookings: [],
    });
    applyAiConfirmOptimistic(queryClient, businessId, ['b1'], { action: 'unknown', params: {} });
    expect(queryClient.getQueryData(['provider-today', businessId])).toMatchObject({ bookings: [] });
  });

  it('resolves queued and live confirm responses', () => {
    expect(
      resolveAiConfirmResponse({ data: { queued: true, offline: true }, status: 202 }, t),
    ).toEqual({ kind: 'queued', summary: 'provider.offlineCommandQueued' });
    expect(resolveAiConfirmResponse({ data: { success: true }, status: 200 }, t)).toEqual({
      kind: 'result',
      data: { success: true },
    });
  });
});
