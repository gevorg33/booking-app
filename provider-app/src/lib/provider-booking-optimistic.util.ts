import type { QueryClient } from '@tanstack/react-query';
import type { BookingDetail, BookingSummary } from './booking-types';

export interface BookingOptimisticPatch {
  status?: string;
  paymentStatus?: string;
  notes?: string | null;
}

export interface BookingCacheSnapshot {
  today?: {
    viewMode: string;
    employee: { name: string } | null;
    bookings: BookingSummary[];
  };
  booking?: BookingDetail;
}

export function patchBookingSummary(
  booking: BookingSummary,
  patch: BookingOptimisticPatch,
): BookingSummary {
  return {
    ...booking,
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
  };
}

export function patchBookingDetail(booking: BookingDetail, patch: BookingOptimisticPatch): BookingDetail {
  return {
    ...booking,
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.paymentStatus ? { paymentStatus: patch.paymentStatus } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
  };
}

export function buildMarkPaidOptimisticPatch(): BookingOptimisticPatch {
  return { status: 'completed', paymentStatus: 'paid' };
}

export function buildPaymentSweepOptimisticPatch(): BookingOptimisticPatch {
  return { paymentStatus: 'paid' };
}

export function buildAiConfirmOptimisticPatch(
  action: string,
  params?: Record<string, unknown>,
): BookingOptimisticPatch | null {
  if (action === 'payment_sweep') return buildPaymentSweepOptimisticPatch();
  if (action === 'mark_no_shows') return { status: 'no_show' };
  if (action === 'cancel_bookings') return { status: 'cancelled' };
  if (action === 'update_bookings') {
    const patch: BookingOptimisticPatch = {};
    if (typeof params?.status === 'string') patch.status = params.status;
    if (typeof params?.paymentStatus === 'string') patch.paymentStatus = params.paymentStatus;
    if (params?.paymentStatus === 'paid' && !patch.status) {
      patch.status = 'completed';
    }
    return Object.keys(patch).length ? patch : null;
  }
  return null;
}

export function captureBookingCaches(
  queryClient: QueryClient,
  businessId: string,
  bookingId: string,
): BookingCacheSnapshot {
  return {
    today: queryClient.getQueryData(['provider-today', businessId]),
    booking: queryClient.getQueryData(['provider-booking', businessId, bookingId]),
  };
}

export function applyOptimisticBookingPatches(
  queryClient: QueryClient,
  businessId: string,
  bookingIds: string[],
  patch: BookingOptimisticPatch,
): void {
  if (!bookingIds.length || !Object.keys(patch).length) return;
  const idSet = new Set(bookingIds);

  queryClient.setQueryData<BookingCacheSnapshot['today']>(
    ['provider-today', businessId],
    (current) => {
      if (!current?.bookings) return current;
      return {
        ...current,
        bookings: current.bookings.map((booking) =>
          idSet.has(booking.id) ? patchBookingSummary(booking, patch) : booking,
        ),
      };
    },
  );

  for (const bookingId of bookingIds) {
    queryClient.setQueryData<BookingDetail>(
      ['provider-booking', businessId, bookingId],
      (current) => (current ? patchBookingDetail(current, patch) : current),
    );
  }
}

export function restoreBookingCaches(
  queryClient: QueryClient,
  businessId: string,
  bookingId: string,
  snapshot: BookingCacheSnapshot,
): void {
  queryClient.setQueryData(['provider-today', businessId], snapshot.today);
  queryClient.setQueryData(['provider-booking', businessId, bookingId], snapshot.booking);
}
