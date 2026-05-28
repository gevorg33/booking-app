export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'not_applicable';

export const STATUS_LABELS: Record<string, string> = {
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

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  'pending',
  'paid',
  'refunded',
  'not_applicable',
];

export const STATUS_COLOR: Record<string, string> = {
  confirmed: 'success',
  completed: 'primary',
  cancelled: 'danger',
  pending: 'warning',
  no_show: 'warning',
  in_progress: 'tertiary',
};

const TERMINAL_STATUSES: BookingStatus[] = ['cancelled', 'completed', 'no_show'];

export function formatStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function formatPaymentLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status;
}

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

export function isBookingEditable(status: string): boolean {
  return !TERMINAL_STATUSES.includes(status as BookingStatus);
}

export function statusRequiresConfirmation(next: BookingStatus): boolean {
  return next === 'no_show' || next === 'completed';
}

export interface BookingDetail {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus?: string;
  notes?: string | null;
  description?: string | null;
  cancellationReason?: string | null;
  service: { id: string; name: string } | null;
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
}

export interface BookingSummary {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: { name: string } | null;
  customer: { name: string; phone: string | null; email: string | null } | null;
}
