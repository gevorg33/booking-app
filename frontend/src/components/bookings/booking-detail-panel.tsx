'use client';

import { useEffect, useState } from 'react';
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
import {
  BOOKING_STATUS_LABELS,
  buildStatusUpdatePayload,
  formatStatusLabel,
  getStatusVariations,
  isBookingEditable,
  PAYMENT_STATUS_LABELS,
  statusRequiresConfirmation,
  STATUS_BADGE,
  type BookingStatus,
  type PaymentStatus,
} from '@/lib/booking-types';

export interface BookingDetail {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus?: string;
  notes?: string;
  description?: string;
  cancellationReason?: string;
  service?: { id: string; name: string; durationMinutes?: number };
  employee?: { id: string; name: string };
  customer?: { id: string; name: string; email?: string; phone?: string };
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
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null);

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', businessId, bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/bookings/${bookingId}`);
      return (data.data || data) as BookingDetail;
    },
    enabled: !!businessId && !!bookingId,
  });

  useEffect(() => {
    if (!booking) return;
    setStatus(booking.status as BookingStatus);
    setNotes(booking.notes ?? '');
    setDescription(booking.description ?? '');
    setCancelReason('');
    setShowCancelConfirm(false);
    setPendingStatus(null);
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
    }) => {
      const { data } = await api.put(`/businesses/${businessId}/bookings/${bookingId}`, payload);
      return data;
    },
    onSuccess: refreshBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/businesses/${businessId}/bookings/${bookingId}/cancel`, {
        reason: cancelReason || 'Cancelled',
      });
      return data;
    },
    onSuccess: () => {
      refreshBookings();
      onClose();
    },
  });

  if (!bookingId) return null;

  const editable = booking ? isBookingEditable(booking.status) : false;
  const statusOptions = booking ? getStatusVariations(booking.status) : [];
  const statusChanged = booking ? status !== booking.status : false;
  const detailsChanged = booking
    ? notes !== (booking.notes ?? '') || description !== (booking.description ?? '')
    : false;
  const dirty = statusChanged || detailsChanged;

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
    const payload: {
      status?: BookingStatus;
      notes?: string;
      description?: string;
      paymentStatus?: PaymentStatus;
    } = {};
    if (statusChanged) {
      Object.assign(payload, buildStatusUpdatePayload(status));
    }
    if (detailsChanged) {
      payload.notes = notes;
      payload.description = description;
    }
    updateMutation.mutate(payload, {
      onSuccess: () => {
        if (statusChanged && (status === 'completed' || status === 'no_show')) {
          onClose();
        }
      },
    });
  };

  const confirmPendingStatus = () => {
    if (!pendingStatus || !bookingId) return;
    setStatus(pendingStatus);
    setPendingStatus(null);
    updateMutation.mutate(
      buildStatusUpdatePayload(pendingStatus),
      { onSuccess: () => onClose() },
    );
  };

  const paymentLabel = booking?.paymentStatus
    ? PAYMENT_STATUS_LABELS[booking.paymentStatus as PaymentStatus] ?? booking.paymentStatus
    : null;

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
              {paymentLabel && <DetailRow label="Payment">{paymentLabel}</DetailRow>}
            </dl>

            <div className="mb-5 p-3 rounded-lg bg-gray-800/60 border border-gray-700/80">
              <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Customer
              </p>
              {booking.customer ? (
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

            {(updateMutation.isError || cancelMutation.isError) && (
              <div className="mb-4 p-2.5 bg-red-600/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {(updateMutation.error as any)?.response?.data?.message ||
                    (cancelMutation.error as any)?.response?.data?.message ||
                    'Failed to save changes'}
                </span>
              </div>
            )}

            {editable && !showCancelConfirm && (
              <button
                onClick={save}
                disabled={!dirty || updateMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
