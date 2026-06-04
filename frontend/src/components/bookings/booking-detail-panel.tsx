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
import { formatDateDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import { isValidTime24 } from '@/lib/time-format';
import {
  appointmentStartTimeLabel,
  bookingDayISO,
  bookingStatusLabel,
  bookingTimeHHmm,
  buildBookingUpdatePayload,
  canSaveBookingDetail,
  computeBookingDirtyFlags,
  paymentStatusLabel,
  readBookingError,
  type BookingDetailSnapshot,
  type BookingFormState,
} from '@/lib/booking-detail-panel.util';
import { TimeInput } from '@/components/time-input';
import { DatePicker } from '@/components/ui/date-picker';
import { CustomerSelect } from '@/components/customers/customer-select';
import {
  getStatusVariations,
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
import { BookingRetailPosPanel } from '@/components/retail-pos/booking-retail-pos-panel';
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
  const statusLabel = (status: BookingStatus) => bookingStatusLabel(t, status);
  const payLabel = (status: PaymentStatus) => paymentStatusLabel(t, status);
  const startTimeLabel = appointmentStartTimeLabel(t);
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
      const parsed = readBookingError(err, t('appointments.saveFailed'));
      if (parsed.code === 'BOOKING_VERSION_CONFLICT') {
        setVersionConflict(true);
        void refetch();
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/businesses/${businessId}/bookings/${bookingId}/cancel`, {
        reason: cancelReason || t('bookings.statusCancelled'),
        expectedUpdatedAt: booking?.updatedAt,
      });
      return data;
    },
    onSuccess: () => {
      refreshBookings();
      onClose();
    },
    onError: (err) => {
      const parsed = readBookingError(err, t('appointments.saveFailed'));
      if (parsed.code === 'BOOKING_VERSION_CONFLICT') {
        setVersionConflict(true);
        void refetch();
      }
    },
  });

  if (!bookingId) return null;

  const statusOptions = booking ? getStatusVariations(booking.status) : [];
  const formState: BookingFormState = {
    status,
    paymentStatus,
    notes,
    description,
    rescheduleDate,
    rescheduleTime,
    rescheduleEmployeeId,
    rescheduleServiceId,
    customerId,
  };
  const rescheduleValid =
    !!rescheduleDate &&
    isValidTime24(rescheduleTime) &&
    !!rescheduleEmployeeId &&
    !!rescheduleServiceId;
  const flags = booking
    ? computeBookingDirtyFlags(booking as BookingDetailSnapshot, formState, rescheduleValid)
    : null;

  const buildUpdatePayload = (statusOverride?: BookingStatus) => {
    if (!booking || !flags) return null;
    return buildBookingUpdatePayload(
      booking as BookingDetailSnapshot,
      formState,
      flags,
      statusOverride,
    );
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
    if (!booking || !flags?.dirty) return;
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

  const canSave = flags
    ? canSaveBookingDetail(flags, showCancelConfirm)
    : false;

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
            {t('appointments.detailTitle')}
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
          <p className="text-red-400 text-sm py-6 text-center">{t('appointments.detailLoadFailed')}</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="font-medium text-base">
                {booking.service?.name ?? t('appointments.detailFallbackTitle')}
              </p>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                  STATUS_BADGE[booking.status] ?? 'bg-gray-600/10 text-gray-400'
                }`}
              >
                {statusLabel(booking.status as BookingStatus)}
              </span>
            </div>

            <dl className="space-y-2.5 mb-5">
              {flags && !flags.editable && (
                <>
                  <DetailRow label={t('common.date')}>
                    {formatDateDisplay(new Date(booking.startTime))}
                  </DetailRow>
                  <DetailRow label={t('bookings.time')}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {formatTimeRangeDisplay(booking.startTime, booking.endTime)}
                    </span>
                  </DetailRow>
                  {booking.employee?.name && (
                    <DetailRow label={t('common.provider')}>{booking.employee.name}</DetailRow>
                  )}
                </>
              )}
            </dl>

            {flags?.editable && (
              <div className="mb-5 p-3 rounded-lg bg-gray-800/60 border border-gray-700/80 space-y-3">
                <p className="text-xs font-medium text-gray-400">{t('appointments.reschedule')}</p>
                <div>
                  <label className="label">{t('common.date')}</label>
                  <DatePicker
                    className="w-full"
                    value={rescheduleDate}
                    onChange={setRescheduleDate}
                  />
                </div>
                <div>
                  <label className="label">{startTimeLabel}</label>
                  <TimeInput
                    value={rescheduleTime}
                    onChange={setRescheduleTime}
                  />
                </div>
                <div>
                  <label className="label">{t('common.provider')}</label>
                  <select
                    className="input text-sm"
                    value={rescheduleEmployeeId}
                    onChange={(e) => setRescheduleEmployeeId(e.target.value)}
                  >
                    <option value="">{t('common.selectProvider')}</option>
                    {employees.map((emp: { id: string; name: string }) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('bookings.service')}</label>
                  <select
                    className="input text-sm"
                    value={rescheduleServiceId}
                    onChange={(e) => setRescheduleServiceId(e.target.value)}
                    disabled={!rescheduleEmployeeId || !isValidTime24(rescheduleTime) || availableServices.length === 0}
                  >
                    <option value="">
                      {availableServices.length === 0
                        ? t('appointments.noServicesForBlock')
                        : t('bookings.selectService')}
                    </option>
                    {availableServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name}
                        {svc.durationMinutes != null
                          ? ` ${t('appointments.serviceDurationMin', { minutes: svc.durationMinutes })}`
                          : ''}
                      </option>
                    ))}
                  </select>
                  {servicesFilteredByPeriod && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      {t('appointments.servicesInBlockHint')}
                    </p>
                  )}
                  {rescheduleEmployeeId &&
                    isValidTime24(rescheduleTime) &&
                    !activePeriod &&
                    availableServices.length === 0 && (
                      <p className="text-[10px] text-amber-400/90 mt-1">
                        {t('appointments.noServiceBlockHint')}
                      </p>
                    )}
                </div>
                {flags.rescheduleChanged && (
                  <p className="text-[10px] text-gray-500">
                    {t('appointments.rescheduleSaveHint')}
                  </p>
                )}
              </div>
            )}

            <div className="mb-5">
              <label className="label">{t('appointments.paymentStatus')}</label>
              <select
                className="input"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {payLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            {flags?.editable && (
              <div className="mb-5">
                <label className="label">{t('appointments.status')}</label>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => applyStatusChange(e.target.value as BookingStatus)}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {statusLabel(option)}
                    </option>
                  ))}
                  {!statusOptions.includes('cancelled') && (
                    <option value="cancelled">{statusLabel('cancelled')}</option>
                  )}
                </select>
              </div>
            )}

            {bookingId && (
              <div className="mb-5">
                <BookingRetailPosPanel
                  businessId={businessId}
                  bookingId={bookingId}
                  disabled={status === 'cancelled'}
                  onSaved={() => {
                    void queryClient.invalidateQueries({ queryKey: ['booking', businessId, bookingId] });
                  }}
                />
              </div>
            )}

            {booking.paymentSummary && (
              <div className="mb-5">
                <BookingPaymentBreakdown
                  summary={booking.paymentSummary}
                  labels={{
                    title: t('appointments.paymentBreakdown'),
                    servicePrice: t('appointments.paymentServicePrice'),
                    chargedAmount: t('appointments.paymentChargedAmount'),
                    promoDiscount: t('appointments.paymentPromoDiscount'),
                    giftCardDiscount: t('public.discountGiftCard'),
                    loyaltyDiscount: t('appointments.paymentLoyaltyDiscount'),
                    cashPaid: t('appointments.paymentCashPaid'),
                    fullyCovered: t('appointments.paymentFullyCovered'),
                    loyaltyPoints: t('appointments.paymentLoyaltyPoints'),
                    retailTotal: t('retailPos.retailTotal'),
                    grandTotal: t('retailPos.grandTotal'),
                  }}
                />
              </div>
            )}

            <div className="mb-5 p-3 rounded-lg bg-gray-800/60 border border-gray-700/80">
              <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {t('appointments.customer')}
              </p>
              {flags?.canEditCustomer ? (
                <CustomerSelect
                  businessId={businessId}
                  value={customerId}
                  onChange={setCustomerId}
                  searchPlaceholder={t('appointments.searchCustomerOrWalkIn')}
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
                <p className="text-sm text-gray-500">{t('appointments.walkIn')}</p>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="label">{t('common.description')}</label>
                <textarea
                  className="input text-sm min-h-[72px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('appointments.descriptionPlaceholder')}
                  disabled={!flags?.editable}
                />
              </div>
              <div>
                <label className="label">{t('common.notes')}</label>
                <textarea
                  className="input text-sm min-h-[72px] resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('appointments.internalNotesPlaceholder')}
                  disabled={!flags?.editable}
                />
              </div>
              {booking.cancellationReason && (
                <div>
                  <label className="label">{t('appointments.cancellationReason')}</label>
                  <p className="text-sm text-red-300/90">{booking.cancellationReason}</p>
                </div>
              )}
            </div>

            {pendingStatus && (
              <div className="mb-4 p-3 bg-amber-600/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-200 mb-2">
                  {t('appointments.markStatusConfirm', {
                    status: statusLabel(pendingStatus),
                  })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmPendingStatus}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm"
                  >
                    {t('appointments.confirmAction')}
                  </button>
                  <button
                    onClick={() => setPendingStatus(null)}
                    className="btn-secondary text-sm"
                  >
                    {t('common.back')}
                  </button>
                </div>
              </div>
            )}

            {showCancelConfirm && (
              <div className="mb-4 p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
                <p className="text-sm font-medium text-red-400 mb-2">
                  {t('appointments.cancelConfirmTitle')}
                </p>
                <input
                  className="input mb-2 text-sm"
                  placeholder={t('appointments.cancelReasonPlaceholder')}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm"
                  >
                    {cancelMutation.isPending
                      ? t('common.confirmingCancel')
                      : t('appointments.confirmCancel')}
                  </button>
                  <button
                    onClick={() => {
                      setShowCancelConfirm(false);
                      if (booking) setStatus(booking.status as BookingStatus);
                    }}
                    className="btn-secondary text-sm"
                  >
                    {t('common.keep')}
                  </button>
                </div>
              </div>
            )}

            {(versionConflict || updateMutation.isError || cancelMutation.isError) && (
              <div className="mb-4 p-2.5 bg-red-600/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {versionConflict
                    ? t('appointments.versionConflict')
                    : readBookingError(
                        updateMutation.error ?? cancelMutation.error,
                        t('appointments.saveFailed'),
                      ).message}
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
                  {t('common.saving')}
                </>
              ) : (
                t('common.saveChanges')
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
