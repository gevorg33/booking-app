import { resolveTenantPriceCurrency } from './business-currency';
import { formatTimeRangeDisplay } from './date-format';
import type { BookingPaymentSummary } from './booking-payment-summary';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus =
  | 'pending'
  | 'partially_paid'
  | 'paid'
  | 'refunded'
  | 'not_applicable';

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
  partially_paid: 'Partially paid',
  paid: 'Paid',
  refunded: 'Refunded',
  not_applicable: 'N/A',
};

export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  'pending',
  'partially_paid',
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

const STATUS_I18N_KEYS: Record<string, string> = {
  pending: 'bookings.statusPending',
  confirmed: 'bookings.statusConfirmed',
  in_progress: 'bookings.statusInProgress',
  completed: 'bookings.statusCompleted',
  cancelled: 'bookings.statusCancelled',
  no_show: 'bookings.statusNoShow',
};

const PAYMENT_I18N_KEYS: Record<PaymentStatus, string> = {
  pending: 'bookings.paymentPending',
  partially_paid: 'bookings.paymentPartiallyPaid',
  paid: 'bookings.paymentPaid',
  refunded: 'bookings.paymentRefunded',
  not_applicable: 'bookings.paymentNa',
};

type TranslateFn = (key: string) => string;

export function formatStatusLabel(status: string, t?: TranslateFn): string {
  if (t) {
    const key = STATUS_I18N_KEYS[status];
    if (key) return t(key);
  }
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function formatPaymentLabel(status: string, t?: TranslateFn): string {
  if (t) {
    const key = PAYMENT_I18N_KEYS[status as PaymentStatus];
    if (key) return t(key);
  }
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

const PAYMENT_NOT_APPLICABLE_STATUSES: BookingStatus[] = ['cancelled', 'no_show'];

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
  extra?: { paymentStatus?: PaymentStatus },
): { status: BookingStatus; paymentStatus?: PaymentStatus } {
  const resolvedPayment = resolvePaymentStatusOnStatusChange(nextStatus, extra?.paymentStatus);
  return {
    status: nextStatus,
    ...(resolvedPayment ? { paymentStatus: resolvedPayment } : {}),
  };
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
  updatedAt?: string;
  service: { id: string; name: string; price?: number; currency?: string } | null;
  customer: { id: string; name: string; phone: string | null; email: string | null } | null;
  employee?: { id: string; name: string } | null;
  paymentSummary?: BookingPaymentSummary | null;
  labFeaturesEnabled?: boolean;
}

export interface BookingSummary {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: { name: string; price?: number; currency?: string } | null;
  customer: { name: string; phone: string | null; email: string | null } | null;
  employee?: { id: string; name: string } | null;
}

export interface ServicePriceInfo {
  price?: number | string | null;
  currency?: string | null;
}

export function formatServicePrice(
  price?: number | string | null,
  currency = 'USD',
): string | null {
  if (price === undefined || price === null || price === '') return null;
  const amount = Number(price);
  if (Number.isNaN(amount)) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency || 'USD'}`;
  }
}

export function formatBookingBlockHeadline(
  input: {
    startTime: string;
    endTime: string;
    status: string;
    service?: ServicePriceInfo | null;
    businessCurrency?: string | null;
  },
  t?: TranslateFn,
): string {
  const parts = [formatTimeRangeDisplay(input.startTime, input.endTime)];
  parts.push(formatStatusLabel(input.status, t));
  const currency = resolveTenantPriceCurrency(
    input.service?.currency,
    input.businessCurrency,
  );
  const cost = formatServicePrice(input.service?.price, currency);
  if (cost) parts.push(cost);
  return parts.join(' · ');
}
