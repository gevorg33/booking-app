/** Mirrors backend `BookingStatus` with clinic-portal-style labels. */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'not_applicable';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Booked',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Done',
  no_show: 'No show',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
  not_applicable: 'N/A',
};

export const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-green-600/15 text-green-400',
  completed: 'bg-blue-600/15 text-blue-400',
  cancelled: 'bg-red-600/15 text-red-400',
  pending: 'bg-yellow-600/15 text-yellow-400',
  no_show: 'bg-orange-600/15 text-orange-400',
  in_progress: 'bg-purple-600/15 text-purple-400',
};

const TERMINAL_STATUSES: BookingStatus[] = ['cancelled', 'completed', 'no_show'];

/** Clinic portal excludes Booked/Cancelled/CheckedIn from status picker — adapted for this app. */
export function getStatusVariations(current: string): BookingStatus[] {
  const status = current as BookingStatus;
  if (TERMINAL_STATUSES.includes(status)) return [status];

  const variations: BookingStatus[] = ['confirmed', 'in_progress', 'completed', 'no_show'];
  if (status === 'pending' && !variations.includes('pending')) {
    variations.unshift('pending');
  }
  if (!variations.includes(status)) {
    variations.unshift(status);
  }
  return variations;
}

export function formatStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status.replace(/_/g, ' ');
}

export function isBookingEditable(status: string): boolean {
  return !TERMINAL_STATUSES.includes(status as BookingStatus);
}

export function statusRequiresConfirmation(next: BookingStatus): boolean {
  return next === 'no_show' || next === 'completed';
}

const PAYMENT_NOT_APPLICABLE_STATUSES: BookingStatus[] = ['cancelled', 'no_show'];

/** When status moves to cancelled/no_show and payment wasn't sent, default to not_applicable. */
export function resolvePaymentStatusOnStatusChange(
  nextStatus: BookingStatus,
  explicitPaymentStatus?: PaymentStatus,
): PaymentStatus | undefined {
  if (explicitPaymentStatus) return explicitPaymentStatus;
  if (PAYMENT_NOT_APPLICABLE_STATUSES.includes(nextStatus)) {
    return 'not_applicable';
  }
  return undefined;
}

export function buildStatusUpdatePayload(
  nextStatus: BookingStatus,
  extra?: { notes?: string; description?: string; paymentStatus?: PaymentStatus },
): { status: BookingStatus; notes?: string; description?: string; paymentStatus?: PaymentStatus } {
  const paymentStatus = resolvePaymentStatusOnStatusChange(nextStatus, extra?.paymentStatus);
  return {
    status: nextStatus,
    ...(extra?.notes !== undefined ? { notes: extra.notes } : {}),
    ...(extra?.description !== undefined ? { description: extra.description } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
  };
}
