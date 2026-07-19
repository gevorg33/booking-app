/** Mirrors backend `BookingStatus` with clinic-portal-style labels. */
import { formatTimeRangeDisplay } from '@/lib/date-format';

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
    // e2e-bug.115 — pin locale; bare `undefined` follows runtime ICU defaults.
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency || 'USD'}`;
  }
}

function resolveBookingDisplayAmount(input: {
  service?: ServicePriceInfo | null;
  metadata?: {
    pricing?: { amountDue?: number };
    amountPaid?: number;
  } | null;
}): number | null {
  const pricingAmount = input.metadata?.pricing?.amountDue;
  if (typeof pricingAmount === 'number' && Number.isFinite(pricingAmount)) {
    return pricingAmount;
  }
  const amountPaid = input.metadata?.amountPaid;
  if (typeof amountPaid === 'number' && Number.isFinite(amountPaid)) {
    return amountPaid;
  }
  const servicePrice = input.service?.price;
  if (typeof servicePrice === 'number' && Number.isFinite(servicePrice)) {
    return servicePrice;
  }
  return null;
}

/** Primary calendar/card line: time · status · cost */
export function formatBookingBlockHeadline(input: {
  startTime: string;
  endTime: string;
  status: string;
  service?: ServicePriceInfo | null;
  metadata?: {
    pricing?: { amountDue?: number; taxAmount?: number };
    amountPaid?: number;
  } | null;
}): string {
  const parts = [formatTimeRangeDisplay(input.startTime, input.endTime)];
  parts.push(formatStatusLabel(input.status));
  const amount = resolveBookingDisplayAmount(input);
  const cost = formatServicePrice(amount, input.service?.currency ?? undefined);
  if (cost) parts.push(cost);
  return parts.join(' · ');
}

export function formatBookingBlockSublabel(input: {
  service?: { name?: string | null } | null;
  customer?: { name?: string | null } | null;
  employee?: { name?: string | null } | null;
  metadata?: {
    packageName?: string | null;
    groupLabel?: string | null;
    payAtVenue?: boolean;
    paymentMethod?: string;
    pricing?: { taxAmount?: number };
  } | null;
  packagePurchaseId?: string | null;
  multiServiceGroupId?: string | null;
  paymentStatus?: string;
}): string {
  const name = input.service?.name || 'Appointment';
  const who = input.customer?.name || input.employee?.name || '';
  let base = who ? `${name} · ${who}` : name;
  const payAtVenue =
    (input.metadata?.payAtVenue === true || input.metadata?.paymentMethod === 'cash') &&
    input.paymentStatus === 'pending';
  if (payAtVenue) base = `${base} · Pay at venue`;
  const pkg = input.metadata?.packageName;
  if (pkg) return `Package: ${pkg} · ${base}`;
  const group = input.metadata?.groupLabel;
  if (group || input.multiServiceGroupId) return `Multi-service: ${group ?? 'visit'} · ${base}`;
  const taxAmount = input.metadata?.pricing?.taxAmount;
  if (typeof taxAmount === 'number' && taxAmount > 0) {
    base = `${base} · Tax ${taxAmount}`;
  }
  return base;
}
