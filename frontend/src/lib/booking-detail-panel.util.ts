import { formatTimeDisplay } from '@/lib/date-format';
import { normalizeTime24 } from '@/lib/time-format';
import {
  buildStatusUpdatePayload,
  isBookingEditable,
  type BookingStatus,
  type PaymentStatus,
} from '@/lib/booking-types';

export const BOOKING_STATUS_I18N_KEYS: Record<BookingStatus, string> = {
  pending: 'bookings.statusPending',
  confirmed: 'bookings.statusConfirmed',
  in_progress: 'bookings.statusInProgress',
  completed: 'bookings.statusCompleted',
  no_show: 'bookings.statusNoShow',
  cancelled: 'bookings.statusCancelled',
};

export const PAYMENT_STATUS_I18N_KEYS: Record<PaymentStatus, string> = {
  pending: 'bookings.paymentPending',
  partially_paid: 'bookings.paymentPartiallyPaid',
  paid: 'bookings.paymentPaid',
  refunded: 'bookings.paymentRefunded',
  not_applicable: 'bookings.paymentNa',
};

/** Keys passed to `t()` in the appointment detail modal (excluding dynamic status/payment maps). */
export const APPOINTMENT_DETAIL_I18N_KEYS = [
  'appointments.detailTitle',
  'appointments.detailLoadFailed',
  'appointments.detailFallbackTitle',
  'appointments.reschedule',
  'appointments.startTime24h',
  'appointments.noServicesForBlock',
  'appointments.servicesInBlockHint',
  'appointments.noServiceBlockHint',
  'appointments.rescheduleSaveHint',
  'appointments.paymentStatus',
  'appointments.status',
  'appointments.customer',
  'appointments.searchCustomerOrWalkIn',
  'appointments.walkIn',
  'appointments.descriptionPlaceholder',
  'appointments.internalNotesPlaceholder',
  'appointments.cancellationReason',
  'appointments.confirmAction',
  'appointments.markStatusConfirm',
  'appointments.cancelConfirmTitle',
  'appointments.cancelReasonPlaceholder',
  'appointments.confirmCancel',
  'appointments.versionConflict',
  'appointments.saveFailed',
  'appointments.serviceDurationMin',
  'appointments.paymentBreakdown',
  'appointments.paymentServicePrice',
  'appointments.paymentChargedAmount',
  'appointments.paymentPromoDiscount',
  'appointments.paymentLoyaltyDiscount',
  'appointments.paymentCashPaid',
  'appointments.paymentFullyCovered',
  'appointments.paymentLoyaltyPoints',
  'common.date',
  'common.timeFormat24h',
  'common.provider',
  'common.selectProvider',
  'common.description',
  'common.notes',
  'common.saving',
  'common.saveChanges',
  'common.back',
  'common.keep',
  'common.confirmingCancel',
  'bookings.time',
  'bookings.service',
  'bookings.selectService',
  'bookings.statusCancelled',
] as const;

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function bookingStatusLabel(t: TranslateFn, status: BookingStatus): string {
  return t(BOOKING_STATUS_I18N_KEYS[status]);
}

export function paymentStatusLabel(t: TranslateFn, status: PaymentStatus): string {
  return t(PAYMENT_STATUS_I18N_KEYS[status]);
}

export function appointmentStartTimeLabel(t: TranslateFn): string {
  return `${t('appointments.startTime24h')} ${t('common.timeFormat24h')}`;
}

export function bookingDayISO(iso: string): string {
  return iso.split('T')[0];
}

export function bookingTimeHHmm(iso: string): string {
  return formatTimeDisplay(iso);
}

export function toRescheduleISO(dayISO: string, timeHHmm: string): string {
  return `${dayISO}T${normalizeTime24(timeHHmm)}:00.000Z`;
}

export function readBookingError(
  err: unknown,
  fallbackMessage: string,
): {
  message: string;
  code?: string;
  updatedAt?: string;
} {
  if (err == null || typeof err !== 'object') {
    return { message: fallbackMessage };
  }
  const ax = err as {
    response?: {
      data?: {
        message?: string | { message?: string; code?: string; updatedAt?: string };
      };
    };
  };
  const msg = ax.response?.data?.message;
  if (typeof msg === 'object' && msg) {
    return {
      message: msg.message ?? fallbackMessage,
      code: msg.code,
      updatedAt: msg.updatedAt,
    };
  }
  return { message: typeof msg === 'string' ? msg : fallbackMessage };
}

export interface BookingDetailSnapshot {
  startTime: string;
  status: string;
  paymentStatus?: string;
  notes?: string;
  description?: string;
  updatedAt?: string;
  service?: { id: string };
  employee?: { id: string };
  customer?: { id: string };
}

export interface BookingFormState {
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes: string;
  description: string;
  rescheduleDate: string;
  rescheduleTime: string;
  rescheduleEmployeeId: string;
  rescheduleServiceId: string;
  customerId: string;
}

export interface BookingDirtyFlags {
  editable: boolean;
  canEditCustomer: boolean;
  statusChanged: boolean;
  paymentChanged: boolean;
  detailsChanged: boolean;
  serviceChanged: boolean;
  scheduleChanged: boolean;
  rescheduleChanged: boolean;
  rescheduleValid: boolean;
  customerChanged: boolean;
  scheduleFieldsUnchanged: boolean;
  customerOnlyDirty: boolean;
  dirty: boolean;
}

export function computeBookingDirtyFlags(
  booking: BookingDetailSnapshot,
  form: BookingFormState,
  rescheduleValid: boolean,
): BookingDirtyFlags {
  const editable = isBookingEditable(booking.status);
  const canEditCustomer = booking.status !== 'cancelled';
  const statusChanged = form.status !== booking.status;
  const paymentChanged =
    form.paymentStatus !== ((booking.paymentStatus as PaymentStatus) ?? 'pending');
  const detailsChanged =
    form.notes !== (booking.notes ?? '') || form.description !== (booking.description ?? '');
  const serviceChanged = form.rescheduleServiceId !== (booking.service?.id ?? '');
  const scheduleChanged =
    form.rescheduleDate !== bookingDayISO(booking.startTime) ||
    form.rescheduleTime !== bookingTimeHHmm(booking.startTime) ||
    form.rescheduleEmployeeId !== (booking.employee?.id ?? '');
  const rescheduleChanged = serviceChanged || scheduleChanged;
  const customerChanged = form.customerId !== (booking.customer?.id ?? '');
  const scheduleFieldsUnchanged =
    form.rescheduleDate === bookingDayISO(booking.startTime) &&
    form.rescheduleTime === bookingTimeHHmm(booking.startTime) &&
    form.rescheduleEmployeeId === (booking.employee?.id ?? '');
  const customerOnlyDirty =
    customerChanged &&
    scheduleFieldsUnchanged &&
    !statusChanged &&
    !detailsChanged &&
    !paymentChanged;
  const dirty =
    statusChanged || detailsChanged || paymentChanged || rescheduleChanged || customerChanged;

  return {
    editable,
    canEditCustomer,
    statusChanged,
    paymentChanged,
    detailsChanged,
    serviceChanged,
    scheduleChanged,
    rescheduleChanged,
    rescheduleValid,
    customerChanged,
    scheduleFieldsUnchanged,
    customerOnlyDirty,
    dirty,
  };
}

export function canSaveBookingDetail(
  flags: BookingDirtyFlags,
  showCancelConfirm: boolean,
): boolean {
  return (
    flags.dirty &&
    !showCancelConfirm &&
    (flags.customerOnlyDirty ||
      ((flags.editable || flags.paymentChanged || (flags.customerChanged && flags.canEditCustomer)) &&
        (!flags.rescheduleChanged || flags.rescheduleValid)))
  );
}

export type BookingUpdatePayload = {
  status?: BookingStatus;
  notes?: string;
  description?: string;
  paymentStatus?: PaymentStatus;
  startTime?: string;
  employeeId?: string;
  serviceId?: string;
  customerId?: string;
  expectedUpdatedAt?: string;
};

export function buildBookingUpdatePayload(
  booking: BookingDetailSnapshot,
  form: BookingFormState,
  flags: BookingDirtyFlags,
  statusOverride?: BookingStatus,
): BookingUpdatePayload | null {
  const nextStatus = statusOverride ?? form.status;
  const nextStatusChanged = statusOverride
    ? statusOverride !== booking.status
    : flags.statusChanged;

  const payload: BookingUpdatePayload = { expectedUpdatedAt: booking.updatedAt };

  if (nextStatusChanged) {
    Object.assign(
      payload,
      buildStatusUpdatePayload(nextStatus, {
        paymentStatus: flags.paymentChanged ? form.paymentStatus : undefined,
      }),
    );
  }
  if (flags.detailsChanged) {
    payload.notes = form.notes;
    payload.description = form.description;
  }
  if (flags.paymentChanged) {
    payload.paymentStatus = form.paymentStatus;
  }
  if (flags.rescheduleChanged && flags.rescheduleValid) {
    if (flags.scheduleChanged) {
      payload.startTime = toRescheduleISO(form.rescheduleDate, form.rescheduleTime);
      payload.employeeId = form.rescheduleEmployeeId;
    }
    if (flags.serviceChanged) {
      payload.serviceId = form.rescheduleServiceId;
    }
  }
  if (flags.customerChanged) {
    payload.customerId = form.customerId || undefined;
  }

  return payload;
}

export function allAppointmentDetailI18nKeys(): string[] {
  return [
    ...APPOINTMENT_DETAIL_I18N_KEYS,
    ...Object.values(BOOKING_STATUS_I18N_KEYS),
    ...Object.values(PAYMENT_STATUS_I18N_KEYS),
  ];
}
