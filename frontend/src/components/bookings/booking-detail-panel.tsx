'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Info,
  Loader2,
  Mail,
  Phone,
  User,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateDisplay, formatTimeDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import { isValidTime24, normalizeTime24 } from '@/lib/time-format';
import { TimeInput } from '@/components/time-input';
import { CustomerSelect } from '@/components/customers/customer-select';
import {
  BOOKING_STATUS_LABELS,
  buildStatusUpdatePayload,
  formatStatusLabel,
  getStatusVariations,
  isBookingEditable,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS,
  statusRequiresConfirmation,
  STATUS_BADGE,
  type BookingStatus,
  type PaymentStatus,
} from '@/lib/booking-types';
import {
  findServicePeriodAtTime,
  servicesForSchedulePeriod,
  type SchedulePeriod,
} from '@/lib/schedule-period-services';
import { type BookingPaymentSummary } from '@/lib/booking-payment-summary';
import { BookingPaymentBreakdown } from '@/components/bookings/booking-payment-breakdown';
import { useI18n } from '@/i18n';

export interface BookingDetail {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus?: string;
  notes?: string;
  description?: string;
  cancellationReason?: string;
  updatedAt?: string;
  service?: { id: string; name: string; durationMinutes?: number };
  employee?: { id: string; name: string };
  customer?: { id: string; name: string; email?: string; phone?: string };
  paymentSummary?: BookingPaymentSummary | null;
}

function bookingDayISO(iso: string): string {
  return iso.split('T')[0];
}

function bookingTimeHHmm(iso: string): string {
  return formatTimeDisplay(iso);
}

function toRescheduleISO(dayISO: string, timeHHmm: string): string {
  return `${dayISO}T${normalizeTime24(timeHHmm)}:00.000Z`;
}

function readBookingError(err: unknown): {
  message: string;
  code?: string;
  updatedAt?: string;
} {
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
      message: msg.message ?? 'Failed to save changes',
      code: msg.code,
      updatedAt: msg.updatedAt,
    };
  }
  return { message: typeof msg === 'string' ? msg : 'Failed to save changes' };
}

interface BookingDetailPanelProps {
  businessId: string;
  bookingId: string | null;
  onClose: () => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <dt className="text-gray-500 w-24 shrink-0">{label}</dt>
      <dd className="text-gray-200 min-w-0">{children}</dd>
    </div>
  );
}

export function BookingDetailPanel({ businessId, bookingId, onClose }: BookingDetailPanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleEmployeeId, setRescheduleEmployeeId] = useState('');
  const [rescheduleServiceId, setRescheduleServiceId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [versionConflict, setVersionConflict] = useState(false);

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', businessId, bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/bookings/${bookingId}`);
      return (data.data || data) as BookingDetail;
    },
    enabled: !!businessId && !!bookingId,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/employees`);
      return data.data || data || [];
    },
    enabled: !!businessId,
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/services`);
      return data.data || data || [];
    },
    enabled: !!businessId,
  });

  const rescheduleDayISO = rescheduleDate || (booking ? bookingDayISO(booking.startTime) : '');

  const { data: calendarData } = useQuery({
    queryKey: ['provider-calendar', businessId, rescheduleEmployeeId, rescheduleDayISO],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/schedules/provider-calendar`,
        {
          params: {
            employeeId: rescheduleEmployeeId,
            startDate: rescheduleDayISO,
            endDate: rescheduleDayISO,
          },
        },
      );
      return data.data || data;
    },
    enabled: !!businessId && !!rescheduleEmployeeId && !!rescheduleDayISO,
  });

  const selectedEmployee = useMemo(
    () =>
      (employees as Array<{ id: string; name: string; serviceIds?: string[] | null }>).find(
        (e) => e.id === rescheduleEmployeeId,
      ),
    [employees, rescheduleEmployeeId],
  );

  const activePeriod = useMemo(
    () =>
      findServicePeriodAtTime(
        (calendarData?.periods ?? []) as SchedulePeriod[],
        rescheduleDayISO,
        rescheduleTime,
      ),
    [calendarData?.periods, rescheduleDayISO, rescheduleTime],
  );

  const availableServices = useMemo(
    () =>
      servicesForSchedulePeriod(
        allServices as Array<{ id: string; name: string; durationMinutes?: number }>,
        activePeriod,
        selectedEmployee?.serviceIds,
      ),
    [allServices, activePeriod, selectedEmployee?.serviceIds],
  );

  const servicesFilteredByPeriod =
    !!activePeriod &&
    !!activePeriod.serviceIds?.length &&
    availableServices.length < (allServices as unknown[]).length;

  useEffect(() => {
    if (!rescheduleServiceId || availableServices.length === 0) return;
    if (!availableServices.some((s) => s.id === rescheduleServiceId)) {
      if (availableServices.length === 1) {
        setRescheduleServiceId(availableServices[0].id);
      }
    }
  }, [availableServices, rescheduleServiceId]);

  useEffect(() => {
    if (!booking) return;
    setStatus(booking.status as BookingStatus);
    setPaymentStatus((booking.paymentStatus as PaymentStatus) ?? 'pending');
    setNotes(booking.notes ?? '');
    setDescription(booking.description ?? '');
    setCancelReason('');
    setShowCancelConfirm(false);
    setPendingStatus(null);
    setRescheduleDate(bookingDayISO(booking.startTime));
    setRescheduleTime(bookingTimeHHmm(booking.startTime));
    setRescheduleEmployeeId(booking.employee?.id ?? '');
    setRescheduleServiceId(booking.service?.id ?? '');
    setCustomerId(booking.customer?.id ?? '');
    setVersionConflict(false);
  }, [booking]);

  const refreshBookings = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['provider-calendar'] });
    queryClient.invalidateQueries({ queryKey: ['booking', businessId, bookingId] });
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      status?: BookingStatus;
      notes?: string;
      description?: string;
      paymentStatus?: PaymentStatus;
      startTime?: string;
      employeeId?: string;
      serviceId?: string;
      customerId?: string;
      expectedUpdatedAt?: string;
    }) => {
      const { data } = await api.put(`/businesses/${businessId}/bookings/${bookingId}`, payload);
      return data;
    },
    onSuccess: () => {
      setVersionConflict(false);
      refreshBookings();
    },
    onError: (err) => {
      const parsed = readBookingError(err);
      if (parsed.code === 'BOOKING_VERSION_CONFLICT') {
        setVersionConflict(true);
        void refetch();
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/businesses/${businessId}/bookings/${bookingId}/cancel`, {
        reason: cancelReason || 'Cancelled',
        expectedUpdatedAt: booking?.updatedAt,
      });
      return data;
    },
    onSuccess: () => {
      refreshBookings();
      onClose();
    },
    onError: (err) => {
      const parsed = readBookingError(err);
      if (parsed.code === 'BOOKING_VERSION_CONFLICT') {
        setVersionConflict(true);
        void refetch();
      }
    },
  });

  if (!bookingId) return null;

  const editable = booking ? isBookingEditable(booking.status) : false;
  const canEditCustomer = booking ? booking.status !== 'cancelled' : false;
  const statusOptions = booking ? getStatusVariations(booking.status) : [];
  const statusChanged = booking ? status !== booking.status : false;
  const paymentChanged = booking
    ? paymentStatus !== ((booking.paymentStatus as PaymentStatus) ?? 'pending')
    : false;
  const detailsChanged = booking
    ? notes !== (booking.notes ?? '') || description !== (booking.description ?? '')
    : false;
  const serviceChanged = booking
    ? rescheduleServiceId !== (booking.service?.id ?? '')
    : false;
  const scheduleChanged = booking
    ? rescheduleDate !== bookingDayISO(booking.startTime) ||
      rescheduleTime !== bookingTimeHHmm(booking.startTime) ||
      rescheduleEmployeeId !== (booking.employee?.id ?? '')
    : false;
  const rescheduleChanged = serviceChanged || scheduleChanged;
  const rescheduleValid =
    !!rescheduleDate &&
    isValidTime24(rescheduleTime) &&
    !!rescheduleEmployeeId &&
    !!rescheduleServiceId;
  const customerChanged = booking
    ? customerId !== (booking.customer?.id ?? '')
    : false;
  const scheduleFieldsUnchanged = booking
    ? rescheduleDate === bookingDayISO(booking.startTime) &&
      rescheduleTime === bookingTimeHHmm(booking.startTime) &&
      rescheduleEmployeeId === (booking.employee?.id ?? '')
    : true;
  const customerOnlyDirty =
    customerChanged &&
    scheduleFieldsUnchanged &&
    !statusChanged &&
    !detailsChanged &&
    !paymentChanged;
  const dirty = statusChanged || detailsChanged || paymentChanged || rescheduleChanged || customerChanged;

  const buildUpdatePayload = (statusOverride?: BookingStatus) => {
    if (!booking) return null;

    const nextStatus = statusOverride ?? status;
    const nextStatusChanged = statusOverride
      ? statusOverride !== booking.status
      : statusChanged;

    const payload: {
      status?: BookingStatus;
      notes?: string;
      description?: string;
      paymentStatus?: PaymentStatus;
      startTime?: string;
      employeeId?: string;
      serviceId?: string;
      customerId?: string;
      expectedUpdatedAt?: string;
    } = { expectedUpdatedAt: booking.updatedAt };

    if (nextStatusChanged) {
      Object.assign(
        payload,
        buildStatusUpdatePayload(nextStatus, {
          paymentStatus: paymentChanged ? paymentStatus : undefined,
        }),
      );
    }
    if (detailsChanged) {
      payload.notes = notes;
      payload.description = description;
    }
    if (paymentChanged) {
      payload.paymentStatus = paymentStatus;
    }
    if ((serviceChanged || scheduleChanged) && rescheduleValid) {
      if (scheduleChanged) {
        payload.startTime = toRescheduleISO(rescheduleDate, rescheduleTime);
        payload.employeeId = rescheduleEmployeeId;
      }
      if (serviceChanged) {
        payload.serviceId = rescheduleServiceId;
      }
    }
    if (customerChanged) {
      payload.customerId = customerId || undefined;
    }

    return payload;
  };

  const applyStatusChange = (next: BookingStatus) => {
    if (next === 'cancelled') {
      setShowCancelConfirm(true);
      return;
    }
    if (statusRequiresConfirmation(next)) {
      setPendingStatus(next);
      return;
    }
    setStatus(next);
  };

  const save = () => {
    if (!booking || !dirty) return;
    const statusToApply = pendingStatus ?? undefined;
    const payload = buildUpdatePayload(statusToApply);
    if (!payload) return;
    const closingStatus = statusToApply ?? status;
    if (statusToApply) {
      setStatus(statusToApply);
      setPendingStatus(null);
    }
    updateMutation.mutate(payload, {
      onSuccess: () => {
        if (closingStatus === 'completed' || closingStatus === 'no_show') {
          onClose();
        }
      },
    });
  };

  const confirmPendingStatus = () => {
    if (!pendingStatus || !bookingId || !booking) return;
    const payload = buildUpdatePayload(pendingStatus);
    if (!payload) return;
    setStatus(pendingStatus);
    setPendingStatus(null);
    updateMutation.mutate(payload, { onSuccess: () => onClose() });
  };

  const canSave =
    dirty &&
    !showCancelConfirm &&
    (customerOnlyDirty ||
      ((editable || paymentChanged || (customerChanged && canEditCustomer)) &&
        (!rescheduleChanged || rescheduleValid)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            Appointment Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : isError || !booking ? (
          <p className="text-red-400 text-sm py-6 text-center">Could not load appointment details.</p>
        ) : (
          <>
            <div className="mb-4">
              <p className="font-medium text-base">{booking.service?.name ?? 'Appointment'}</p>
              <span
                className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                  STATUS_BADGE[booking.status] ?? 'bg-gray-600/10 text-gray-400'
                }`}
              >
                {formatStatusLabel(booking.status)}
              </span>
            </div>

            <dl className="space-y-2.5 mb-5">
              {!editable && (
                <>
                  <DetailRow label="Date">
                    {formatDateDisplay(new Date(booking.startTime))}
                  </DetailRow>
                  <DetailRow label="Time">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {formatTimeRangeDisplay(booking.startTime, booking.endTime)}
                    </span>
                  </DetailRow>
                  {booking.employee?.name && (
                    <DetailRow label="Provider">{booking.employee.name}</DetailRow>
                  )}
                </>
              )}
            </dl>

            {editable && (
              <div className="mb-5 p-3 rounded-lg bg-gray-800/60 border border-gray-700/80 space-y-3">
                <p className="text-xs font-medium text-gray-400">Reschedule</p>
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Start time (24h)</label>
                  <TimeInput
                    value={rescheduleTime}
                    onChange={setRescheduleTime}
                  />
                </div>
                <div>
                  <label className="label">Provider</label>
                  <select
                    className="input text-sm"
                    value={rescheduleEmployeeId}
                    onChange={(e) => setRescheduleEmployeeId(e.target.value)}
                  >
                    <option value="">Select provider...</option>
                    {employees.map((emp: { id: string; name: string }) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Service</label>
                  <select
                    className="input text-sm"
                    value={rescheduleServiceId}
                    onChange={(e) => setRescheduleServiceId(e.target.value)}
                    disabled={!rescheduleEmployeeId || !isValidTime24(rescheduleTime) || availableServices.length === 0}
                  >
                    <option value="">
                      {availableServices.length === 0
                        ? 'No services for this time block'
                        : 'Select service...'}
                    </option>
                    {availableServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name}
                        {svc.durationMinutes != null ? ` (${svc.durationMinutes} min)` : ''}
                      </option>
                    ))}
                  </select>
                  {servicesFilteredByPeriod && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Showing services offered in this schedule block only.
                    </p>
                  )}
                  {rescheduleEmployeeId &&
                    isValidTime24(rescheduleTime) &&
                    !activePeriod &&
                    availableServices.length === 0 && (
                      <p className="text-[10px] text-amber-400/90 mt-1">
                        No service block covers this time — pick another slot or provider.
                      </p>
                    )}
                </div>
                {rescheduleChanged && (
                  <p className="text-[10px] text-gray-500">
                    Availability, service period, and conflicts are validated when you save.
                  </p>
                )}
              </div>
            )}

            <div className="mb-5">
              <label className="label">Payment status</label>
              <select
                className="input"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {PAYMENT_STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            {booking.paymentSummary && (
              <div className="mb-5">
                <BookingPaymentBreakdown
                  summary={booking.paymentSummary}
                  labels={{
                    title: t('appointments.paymentBreakdown'),
                    servicePrice: t('appointments.paymentServicePrice'),
                    chargedAmount: t('appointments.paymentChargedAmount'),
                    promoDiscount: t('appointments.paymentPromoDiscount'),
                    loyaltyDiscount: t('appointments.paymentLoyaltyDiscount'),
                    cashPaid: t('appointments.paymentCashPaid'),
                    fullyCovered: t('appointments.paymentFullyCovered'),
                    loyaltyPoints: t('appointments.paymentLoyaltyPoints'),
                  }}
                />
              </div>
            )}

            <div className="mb-5 p-3 rounded-lg bg-gray-800/60 border border-gray-700/80">
              <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Customer
              </p>
              {canEditCustomer ? (
                <CustomerSelect
                  businessId={businessId}
                  value={customerId}
                  onChange={setCustomerId}
                  searchPlaceholder="Search customer or assign walk-in..."
                />
              ) : booking.customer ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-gray-100">{booking.customer.name}</p>
                  {booking.customer.email && (
                    <p className="text-gray-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {booking.customer.email}
                    </p>
                  )}
                  {booking.customer.phone && (
                    <p className="text-gray-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {booking.customer.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Walk-in</p>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input text-sm min-h-[72px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Appointment description..."
                  disabled={!editable}
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input text-sm min-h-[72px] resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes..."
                  disabled={!editable}
                />
              </div>
              {booking.cancellationReason && (
                <div>
                  <label className="label">Cancellation reason</label>
                  <p className="text-sm text-red-300/90">{booking.cancellationReason}</p>
                </div>
              )}
            </div>

            {editable && (
              <div className="mb-4">
                <label className="label">Status</label>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => applyStatusChange(e.target.value as BookingStatus)}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {BOOKING_STATUS_LABELS[option]}
                    </option>
                  ))}
                  {!statusOptions.includes('cancelled') && (
                    <option value="cancelled">{BOOKING_STATUS_LABELS.cancelled}</option>
                  )}
                </select>
              </div>
            )}

            {pendingStatus && (
              <div className="mb-4 p-3 bg-amber-600/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-200 mb-2">
                  Mark this appointment as{' '}
                  <span className="font-medium">{BOOKING_STATUS_LABELS[pendingStatus]}</span>?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmPendingStatus}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setPendingStatus(null)}
                    className="btn-secondary text-sm"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {showCancelConfirm && (
              <div className="mb-4 p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
                <p className="text-sm font-medium text-red-400 mb-2">Cancel this appointment?</p>
                <input
                  className="input mb-2 text-sm"
                  placeholder="Cancellation reason (optional)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm"
                  >
                    {cancelMutation.isPending ? 'Cancelling…' : 'Confirm cancel'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCancelConfirm(false);
                      if (booking) setStatus(booking.status as BookingStatus);
                    }}
                    className="btn-secondary text-sm"
                  >
                    Keep
                  </button>
                </div>
              </div>
            )}

            {(versionConflict || updateMutation.isError || cancelMutation.isError) && (
              <div className="mb-4 p-2.5 bg-red-600/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {versionConflict
                    ? 'This appointment was updated elsewhere. Details were refreshed — review and save again.'
                    : readBookingError(updateMutation.error ?? cancelMutation.error).message}
                </span>
              </div>
            )}

            <button
              onClick={save}
              disabled={!canSave || updateMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
