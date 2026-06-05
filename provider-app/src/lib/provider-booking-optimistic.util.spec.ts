import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  applyOptimisticBookingPatches,
  buildAiConfirmOptimisticPatch,
  buildMarkPaidOptimisticPatch,
  captureBookingCaches,
  patchBookingDetail,
  patchBookingSummary,
  restoreBookingCaches,
} from './provider-booking-optimistic.util';

describe('provider-booking-optimistic.util', () => {
  const businessId = 'biz-1';
  const bookingId = 'b1';

  it('patches booking summary and detail rows', () => {
    const summary = {
      id: bookingId,
      startTime: '2026-06-02T10:00:00.000Z',
      endTime: '2026-06-02T11:00:00.000Z',
      status: 'confirmed',
      notes: null,
      service: null,
      customer: null,
    };
    expect(patchBookingSummary(summary, { status: 'completed' }).status).toBe('completed');
    expect(patchBookingSummary(summary, {}).status).toBe('confirmed');
    const detail = {
      id: bookingId,
      startTime: '2026-06-02T10:00:00.000Z',
      endTime: '2026-06-02T11:00:00.000Z',
      status: 'confirmed',
      paymentStatus: 'pending',
      service: null,
      customer: null,
    };
    expect(patchBookingDetail(detail, { paymentStatus: 'paid' }).paymentStatus).toBe('paid');
    expect(patchBookingDetail(detail, { notes: 'x' }).notes).toBe('x');
    expect(patchBookingDetail(detail, {}).paymentStatus).toBe('pending');
  });

  it('builds mark-paid and AI confirm patches', () => {
    expect(buildMarkPaidOptimisticPatch()).toEqual({
      status: 'completed',
      paymentStatus: 'paid',
    });
    expect(buildAiConfirmOptimisticPatch('payment_sweep')).toEqual({ paymentStatus: 'paid' });
    expect(buildAiConfirmOptimisticPatch('mark_no_shows')).toEqual({ status: 'no_show' });
    expect(buildAiConfirmOptimisticPatch('cancel_bookings')).toEqual({ status: 'cancelled' });
    expect(buildAiConfirmOptimisticPatch('update_bookings', { paymentStatus: 'paid' })).toEqual({
      paymentStatus: 'paid',
      status: 'completed',
    });
    expect(
      buildAiConfirmOptimisticPatch('update_bookings', { status: 'completed' }),
    ).toEqual({ status: 'completed' });
    expect(
      buildAiConfirmOptimisticPatch('update_bookings', {
        paymentStatus: 'paid',
        status: 'completed',
      }),
    ).toEqual({ paymentStatus: 'paid', status: 'completed' });
    expect(buildAiConfirmOptimisticPatch('update_bookings', {})).toBeNull();
    expect(buildAiConfirmOptimisticPatch('unknown')).toBeNull();
  });

  it('applies and restores booking cache snapshots', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['provider-today', businessId], {
      viewMode: 'provider',
      employee: { name: 'Sam' },
      bookings: [
        {
          id: bookingId,
          startTime: '2026-06-02T10:00:00.000Z',
          endTime: '2026-06-02T11:00:00.000Z',
          status: 'confirmed',
          notes: null,
          service: { name: 'Cut' },
          customer: { name: 'Ann', phone: null, email: null },
        },
      ],
    });
    queryClient.setQueryData(['provider-booking', businessId, bookingId], {
      id: bookingId,
      startTime: '2026-06-02T10:00:00.000Z',
      endTime: '2026-06-02T11:00:00.000Z',
      status: 'confirmed',
      paymentStatus: 'pending',
      service: { id: 's1', name: 'Cut' },
      customer: { id: 'c1', name: 'Ann', phone: null, email: null },
    });

    const snapshot = captureBookingCaches(queryClient, businessId, bookingId);
    applyOptimisticBookingPatches(queryClient, businessId, [bookingId], buildMarkPaidOptimisticPatch());

    const today = queryClient.getQueryData<{
      bookings: Array<{ status: string; paymentStatus?: string }>;
    }>(['provider-today', businessId]);
    expect(today?.bookings[0]?.status).toBe('completed');

    const detail = queryClient.getQueryData<{ status: string; paymentStatus?: string }>([
      'provider-booking',
      businessId,
      bookingId,
    ]);
    expect(detail?.paymentStatus).toBe('paid');

    restoreBookingCaches(queryClient, businessId, bookingId, snapshot);
    expect(
      queryClient.getQueryData(['provider-booking', businessId, bookingId]),
    ).toMatchObject({ paymentStatus: 'pending' });
  });

  it('no-ops for empty patches and missing cache rows', () => {
    const queryClient = new QueryClient();
    applyOptimisticBookingPatches(queryClient, businessId, [], buildMarkPaidOptimisticPatch());
    applyOptimisticBookingPatches(queryClient, businessId, [bookingId], {});
    queryClient.setQueryData(['provider-today', businessId], { viewMode: 'provider', bookings: undefined });
    applyOptimisticBookingPatches(queryClient, businessId, [bookingId], { notes: 'x' });
    applyOptimisticBookingPatches(queryClient, businessId, ['missing'], { status: 'completed' });
    queryClient.setQueryData(['provider-today', businessId], {
      viewMode: 'provider',
      employee: null,
      bookings: [
        {
          id: bookingId,
          startTime: '2026-06-02T10:00:00.000Z',
          endTime: '2026-06-02T11:00:00.000Z',
          status: 'confirmed',
          notes: null,
          service: null,
          customer: null,
        },
      ],
    });
    applyOptimisticBookingPatches(queryClient, businessId, [bookingId], { notes: 'offline note' });
    const noted = queryClient.getQueryData<{ bookings: Array<{ notes: string | null }> }>([
      'provider-today',
      businessId,
    ]);
    expect(noted?.bookings[0]?.notes).toBe('offline note');
    applyOptimisticBookingPatches(queryClient, businessId, [bookingId], { paymentStatus: 'paid' });
    queryClient.setQueryData(['provider-today', businessId], {
      viewMode: 'provider',
      employee: null,
      bookings: [
        {
          id: bookingId,
          startTime: '2026-06-02T10:00:00.000Z',
          endTime: '2026-06-02T11:00:00.000Z',
          status: 'confirmed',
          notes: null,
          service: null,
          customer: null,
        },
        {
          id: 'b2',
          startTime: '2026-06-02T12:00:00.000Z',
          endTime: '2026-06-02T13:00:00.000Z',
          status: 'confirmed',
          notes: null,
          service: null,
          customer: null,
        },
      ],
    });
    applyOptimisticBookingPatches(queryClient, businessId, [bookingId], { status: 'completed' });
    const mixed = queryClient.getQueryData<{ bookings: Array<{ id: string; status: string }> }>([
      'provider-today',
      businessId,
    ]);
    expect(mixed?.bookings.find((b) => b.id === bookingId)?.status).toBe('completed');
    expect(mixed?.bookings.find((b) => b.id === 'b2')?.status).toBe('confirmed');
  });
});
