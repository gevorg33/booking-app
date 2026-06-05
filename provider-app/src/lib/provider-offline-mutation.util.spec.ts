import { describe, expect, it } from 'vitest';
import {
  isOfflineSafeAiConfirmBody,
  isOfflineSafeBookingBody,
  isProviderAiConfirmUrl,
  isProviderAiInterpretUrl,
  isProviderBookingMutationUrl,
  isProviderGiftCardMutationUrl,
  shouldQueueOfflineMutation,
} from './provider-offline-mutation.util';

describe('provider-offline-mutation.util', () => {
  it('classifies provider mutation URLs', () => {
    expect(isProviderAiInterpretUrl('/businesses/b1/provider/ai/command')).toBe(true);
    expect(isProviderAiConfirmUrl('/businesses/b1/provider/ai/command/confirm')).toBe(true);
    expect(isProviderBookingMutationUrl('/businesses/b1/provider/bookings/b2')).toBe(true);
    expect(isProviderBookingMutationUrl('/businesses/b1/provider/bookings/b2/cancel')).toBe(true);
    expect(
      isProviderGiftCardMutationUrl('/businesses/b1/provider/gift-cards/card-creation/g1/ready'),
    ).toBe(true);
  });

  it('never queues AI interpretation commands', () => {
    expect(isProviderAiInterpretUrl('/businesses/b1/provider/ai/command')).toBe(true);
    expect(
      shouldQueueOfflineMutation('post', '/businesses/b1/provider/ai/command', { prompt: 'hi' }),
    ).toBe(false);
  });

  it('queues safe AI confirm actions only', () => {
    expect(
      shouldQueueOfflineMutation('post', '/businesses/b1/provider/ai/command/confirm', {
        action: 'payment_sweep',
        bookingIds: ['b1'],
      }),
    ).toBe(true);
    expect(
      shouldQueueOfflineMutation('post', '/businesses/b1/provider/ai/command/confirm', {
        action: 'unknown',
        bookingIds: ['b1'],
      }),
    ).toBe(false);
    expect(isOfflineSafeAiConfirmBody({ action: 'update_bookings' })).toBe(true);
    expect(isOfflineSafeAiConfirmBody({ action: 42 })).toBe(false);
    expect(isOfflineSafeBookingBody(undefined)).toBe(true);
    expect(isOfflineSafeBookingBody({ startTime: '   ' })).toBe(true);
  });

  it('queues booking updates but not reschedule payloads', () => {
    expect(
      shouldQueueOfflineMutation('put', '/businesses/b1/provider/bookings/b2', {
        paymentStatus: 'paid',
      }),
    ).toBe(true);
    expect(
      shouldQueueOfflineMutation('put', '/businesses/b1/provider/bookings/b2', {
        startTime: '2026-06-02T14:00:00.000Z',
      }),
    ).toBe(false);
    expect(
      shouldQueueOfflineMutation('put', '/businesses/b1/provider/bookings/b2/cancel', {
        reason: 'Sick',
      }),
    ).toBe(true);
  });

  it('queues gift card and push action mutations', () => {
    expect(
      shouldQueueOfflineMutation(
        'put',
        '/businesses/b1/provider/gift-cards/card-creation/g1/ready',
      ),
    ).toBe(true);
    expect(
      shouldQueueOfflineMutation('post', '/businesses/b1/provider/push/action', {
        actionId: 'confirm',
      }),
    ).toBe(true);
    expect(shouldQueueOfflineMutation('get', '/businesses/b1/provider/bookings/today')).toBe(
      false,
    );
    expect(shouldQueueOfflineMutation('post', '/businesses/b1/provider/ai/suggestions')).toBe(
      false,
    );
    expect(shouldQueueOfflineMutation('post', '')).toBe(false);
    expect(shouldQueueOfflineMutation('post', undefined)).toBe(false);
  });
});
