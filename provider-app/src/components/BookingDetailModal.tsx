import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonModal,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonActionSheet,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { formatDateDisplay, formatTimeDisplay, formatTimeRangeDisplay } from '../lib/date-format';
import {
  type BookingDetail,
  type BookingStatus,
  type PaymentStatus,
  formatPaymentLabel,
  formatStatusLabel,
  buildStatusUpdatePayload,
  getStatusVariations,
  isBookingEditable,
  PAYMENT_STATUS_OPTIONS,
  statusRequiresConfirmation,
  STATUS_COLOR,
  STATUS_LABELS,
} from '../lib/booking-types';
import BookingPaymentBreakdown from './BookingPaymentBreakdown';

interface BookingDetailModalProps {
  businessId: string;
  bookingId: string | null;
  onClose: () => void;
  onAiPrompt?: (prompt: string) => void;
}

function readError(err: unknown): string {
  const ax = err as {
    response?: {
      data?: {
        message?: string | { message?: string; code?: string; updatedAt?: string };
      };
    };
  };
  const msg = ax.response?.data?.message;
  if (typeof msg === 'object' && msg?.message) return msg.message;
  return typeof msg === 'string' ? msg : 'Something went wrong. Please try again.';
}

function readErrorCode(err: unknown): string | undefined {
  const ax = err as {
    response?: { data?: { message?: { code?: string } } };
  };
  const msg = ax.response?.data?.message;
  return typeof msg === 'object' ? msg?.code : undefined;
}

function bookingDayISO(iso: string): string {
  return iso.split('T')[0];
}

function toRescheduleISO(dayISO: string, timeHHmm: string): string {
  const [h, m] = timeHHmm.split(':');
  return `${dayISO}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;
}

function PickerField({
  label,
  valueLabel,
  disabled,
  onPress,
}: {
  label: string;
  valueLabel: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <IonItem
      button={!disabled}
      detail={!disabled}
      lines="full"
      className="picker-field ion-margin-bottom"
      onClick={() => {
        if (!disabled) onPress();
      }}
    >
      <IonLabel position="stacked">{label}</IonLabel>
      <IonText className="picker-field__value">{valueLabel}</IonText>
    </IonItem>
  );
}

export default function BookingDetailModal({
  businessId,
  bookingId,
  onClose,
  onAiPrompt,
}: BookingDetailModalProps) {
  const queryClient = useQueryClient();
  const [presentActionSheet] = useIonActionSheet();
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [versionConflict, setVersionConflict] = useState(false);

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ['provider-booking', businessId, bookingId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/provider/bookings/${bookingId}`,
      );
      return unwrap<BookingDetail>(res);
    },
    enabled: !!businessId && !!bookingId,
  });

  useEffect(() => {
    if (!booking) return;
    setStatus(booking.status as BookingStatus);
    setPaymentStatus((booking.paymentStatus as PaymentStatus) ?? 'pending');
    setNotes(booking.notes ?? '');
    setCancelReason('');
    setShowCancel(false);
    setPendingStatus(null);
    setRescheduleDate(bookingDayISO(booking.startTime));
    setRescheduleTime(formatTimeDisplay(booking.startTime));
    setVersionConflict(false);
  }, [booking]);

  const invalidateLists = () => {
    void queryClient.invalidateQueries({ queryKey: ['provider-today', businessId] });
    void queryClient.invalidateQueries({ queryKey: ['provider-upcoming', businessId] });
    void queryClient.invalidateQueries({ queryKey: ['provider-schedule-summary', businessId] });
    void queryClient.invalidateQueries({ queryKey: ['provider-booking', businessId, bookingId] });
  };

  const syncFromBooking = (updated: BookingDetail) => {
    setStatus(updated.status as BookingStatus);
    setPaymentStatus((updated.paymentStatus as PaymentStatus) ?? 'pending');
    if (updated.notes != null) setNotes(updated.notes);
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      notes?: string;
      startTime?: string;
      expectedUpdatedAt?: string;
    }) => {
      const { data: res } = await api.put(
        `/businesses/${businessId}/provider/bookings/${bookingId}`,
        payload,
      );
      return unwrap<BookingDetail>(res);
    },
    onSuccess: (updated) => {
      setVersionConflict(false);
      syncFromBooking(updated);
      invalidateLists();
    },
    onError: (err) => {
      if (readErrorCode(err) === 'BOOKING_VERSION_CONFLICT') {
        setVersionConflict(true);
        void refetch();
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.put(
        `/businesses/${businessId}/provider/bookings/${bookingId}/cancel`,
        {
          reason: cancelReason.trim() || 'Cancelled by provider',
          expectedUpdatedAt: booking?.updatedAt,
        },
      );
      return unwrap<BookingDetail>(res);
    },
    onSuccess: () => {
      invalidateLists();
      onClose();
    },
    onError: (err) => {
      if (readErrorCode(err) === 'BOOKING_VERSION_CONFLICT') {
        setVersionConflict(true);
        void refetch();
      }
    },
  });

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.post(
        `/businesses/${businessId}/provider/bookings/${bookingId}/cancel/suggest-note`,
        { draft: cancelReason.trim() || undefined },
      );
      return unwrap<{ suggestion: string; aiAvailable: boolean }>(res);
    },
    onSuccess: (result) => {
      setCancelReason(result.suggestion);
    },
  });

  const editable = booking ? isBookingEditable(booking.status) : false;
  const statusOptions = booking ? getStatusVariations(booking.status) : [];
  const notesChanged = booking ? notes !== (booking.notes ?? '') : false;
  const rescheduleChanged = booking
    ? rescheduleDate !== bookingDayISO(booking.startTime) ||
      rescheduleTime !== formatTimeDisplay(booking.startTime)
    : false;
  const savedStatus = (booking?.status as BookingStatus) ?? 'confirmed';
  const displayStatus: BookingStatus = showCancel ? 'cancelled' : (pendingStatus ?? status);

  const resetStatusDraft = () => {
    setShowCancel(false);
    setPendingStatus(null);
    setCancelReason('');
    setStatus(savedStatus);
  };

  const applyStatusChange = (next: BookingStatus) => {
    if (next === 'cancelled') {
      setPendingStatus(null);
      setShowCancel(true);
      setStatus('cancelled');
      return;
    }

    setShowCancel(false);

    if (statusRequiresConfirmation(next)) {
      setPendingStatus(next);
      setStatus(next);
      return;
    }

    setPendingStatus(null);
    setStatus(next);
    if (next !== savedStatus) {
      updateMutation.mutate({ status: next, expectedUpdatedAt: booking?.updatedAt });
    }
  };

  const applyPaymentChange = (next: PaymentStatus) => {
    setPaymentStatus(next);
    const current = (booking?.paymentStatus as PaymentStatus) ?? 'pending';
    if (next !== current && !pendingStatus && !showCancel) {
      updateMutation.mutate({ paymentStatus: next, expectedUpdatedAt: booking?.updatedAt });
    }
  };

  const openPaymentPicker = () => {
    presentActionSheet({
      header: 'Payment status',
      cssClass: 'provider-picker-sheet',
      buttons: [
        ...PAYMENT_STATUS_OPTIONS.map((option) => ({
          text:
            paymentStatus === option
              ? `${formatPaymentLabel(option)} ✓`
              : formatPaymentLabel(option),
          cssClass: paymentStatus === option ? 'provider-sheet-selected' : undefined,
          handler: () => applyPaymentChange(option),
        })),
        { text: 'Dismiss', role: 'cancel' as const },
      ],
    });
  };

  const openStatusPicker = () => {
    const options: BookingStatus[] = [...statusOptions];
    if (!options.includes('cancelled')) options.push('cancelled');

    presentActionSheet({
      header: 'Appointment status',
      cssClass: 'provider-picker-sheet',
      buttons: [
        ...options.map((option) => ({
          text:
            displayStatus === option
              ? `${STATUS_LABELS[option]} ✓`
              : STATUS_LABELS[option],
          cssClass: displayStatus === option ? 'provider-sheet-selected' : undefined,
          handler: () => applyStatusChange(option),
        })),
        { text: 'Dismiss', role: 'cancel' as const },
      ],
    });
  };

  const saveNotes = () => {
    if (!booking || !notesChanged || showCancel || pendingStatus) return;
    updateMutation.mutate({ notes, expectedUpdatedAt: booking.updatedAt });
  };

  const saveReschedule = () => {
    if (!booking || !rescheduleChanged || showCancel || pendingStatus) return;
    updateMutation.mutate({
      startTime: toRescheduleISO(rescheduleDate, rescheduleTime),
      expectedUpdatedAt: booking.updatedAt,
    });
  };

  const paymentChanged = booking
    ? paymentStatus !== ((booking.paymentStatus as PaymentStatus) ?? 'pending')
    : false;

  const buildStatusAndPaymentPayload = (nextStatus: BookingStatus) => {
    const payload: {
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      expectedUpdatedAt?: string;
    } = { expectedUpdatedAt: booking?.updatedAt };
    if (nextStatus !== savedStatus) {
      Object.assign(
        payload,
        buildStatusUpdatePayload(nextStatus, {
          paymentStatus: paymentChanged ? paymentStatus : undefined,
        }),
      );
    }
    if (paymentChanged) {
      payload.paymentStatus = paymentStatus;
    }
    return payload;
  };

  const confirmPendingStatus = () => {
    if (!pendingStatus || !booking) return;
    const payload = buildStatusAndPaymentPayload(pendingStatus);
    updateMutation.mutate(payload, {
      onSuccess: () => {
        setPendingStatus(null);
        onClose();
      },
    });
  };

  return (
    <IonModal isOpen={!!bookingId} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Appointment</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <div className="empty-state"><IonSpinner /></div>
        ) : isError || !booking ? (
          <p className="empty-state">Could not load appointment.</p>
        ) : (
          <>
            <div className="ion-margin-bottom">
              <h2>{booking.service?.name ?? 'Appointment'}</h2>
              <p className="booking-meta">{formatDateDisplay(booking.startTime)}</p>
              <p>{formatTimeRangeDisplay(booking.startTime, booking.endTime)}</p>
              <IonBadge color={STATUS_COLOR[displayStatus] ?? 'medium'}>
                {formatStatusLabel(displayStatus)}
              </IonBadge>
            </div>

            {booking.customer && (
              <div className="ion-margin-bottom">
                <h3>Customer</h3>
                <p>{booking.customer.name}</p>
                {booking.customer.phone && (
                  <a className="contact-link" href={`tel:${booking.customer.phone}`}>
                    {booking.customer.phone}
                  </a>
                )}
                {booking.customer.email && (
                  <a className="contact-link" href={`mailto:${booking.customer.email}`}>
                    {booking.customer.email}
                  </a>
                )}
              </div>
            )}

            {editable && onAiPrompt && (
              <div className="ion-margin-bottom ai-booking-actions">
                <h3>AI actions</h3>
                <div className="ai-booking-actions__chips">
                  <button
                    type="button"
                    className="ai-assistant-example"
                    onClick={() => {
                      onAiPrompt(`Cancel ${booking.customer?.name ?? 'this'} appointment at ${formatTimeDisplay(booking.startTime)} because I'm sick`);
                      onClose();
                    }}
                  >
                    Cancel — I&apos;m sick
                  </button>
                  <button
                    type="button"
                    className="ai-assistant-example"
                    onClick={() => {
                      onAiPrompt(`Mark ${booking.customer?.name ?? 'client'}'s appointment at ${formatTimeDisplay(booking.startTime)} as done and paid`);
                      onClose();
                    }}
                  >
                    Mark done + paid
                  </button>
                  <button
                    type="button"
                    className="ai-assistant-example"
                    onClick={() => {
                      onAiPrompt(`Reschedule ${booking.customer?.name ?? 'client'}'s ${booking.service?.name ?? 'appointment'} to 16:00`);
                      onClose();
                    }}
                  >
                    Reschedule to 4pm
                  </button>
                </div>
              </div>
            )}

            {editable && (
              <div className="ion-margin-bottom">
                <h3>Reschedule</h3>
                <IonItem lines="full">
                  <IonLabel position="stacked">Date</IonLabel>
                  <input
                    type="date"
                    className="native-date-input"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </IonItem>
                <IonItem lines="full">
                  <IonLabel position="stacked">Start time (24h)</IonLabel>
                  <input
                    type="time"
                    className="native-date-input"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                  />
                </IonItem>
                {rescheduleChanged && (
                  <IonButton
                    expand="block"
                    className="ion-margin-top"
                    onClick={saveReschedule}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <IonSpinner name="crescent" /> : 'Save new time'}
                  </IonButton>
                )}
              </div>
            )}

            <PickerField
              label="Payment status"
              valueLabel={formatPaymentLabel(paymentStatus)}
              disabled={booking.status === 'cancelled' || updateMutation.isPending}
              onPress={openPaymentPicker}
            />

            {booking.paymentSummary && (
              <BookingPaymentBreakdown summary={booking.paymentSummary} />
            )}

            {editable && (
              <PickerField
                label="Status"
                valueLabel={formatStatusLabel(displayStatus)}
                disabled={updateMutation.isPending}
                onPress={openStatusPicker}
              />
            )}

            <IonItem lines="none" className="ion-margin-bottom">
              <IonLabel position="stacked">Notes</IonLabel>
              <IonTextarea
                value={notes}
                onIonInput={(e) => setNotes(e.detail.value ?? '')}
                rows={3}
                disabled={!editable}
                placeholder="Internal notes..."
              />
            </IonItem>

            {booking.cancellationReason && (
              <IonText color="danger">
                <p className="booking-meta">Cancelled: {booking.cancellationReason}</p>
              </IonText>
            )}

            {showCancel ? (
              <div className="ion-margin-vertical">
                <IonText color="danger"><p><strong>Cancel this appointment?</strong></p></IonText>
                <IonItem lines="none">
                  <IonLabel position="stacked">Cancellation note</IonLabel>
                  <IonTextarea
                    value={cancelReason}
                    onIonInput={(e) => setCancelReason(e.detail.value ?? '')}
                    rows={3}
                    placeholder="Reason for cancellation..."
                  />
                </IonItem>
                <IonButton
                  expand="block"
                  fill="outline"
                  className="ion-margin-top"
                  onClick={() => void suggestMutation.mutate()}
                  disabled={suggestMutation.isPending}
                >
                  {suggestMutation.isPending ? <IonSpinner name="crescent" /> : 'Help me write the note'}
                </IonButton>
                <IonButton
                  expand="block"
                  color="danger"
                  className="ion-margin-top"
                  onClick={() => void cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? <IonSpinner name="crescent" /> : 'Confirm cancel'}
                </IonButton>
                <IonButton expand="block" fill="clear" onClick={resetStatusDraft}>
                  Keep appointment
                </IonButton>
              </div>
            ) : pendingStatus ? (
              <div className="ion-margin-vertical">
                <IonText color="warning">
                  <p>
                    Mark as <strong>{STATUS_LABELS[pendingStatus]}</strong>?
                  </p>
                </IonText>
                <IonButton expand="block" onClick={confirmPendingStatus} disabled={updateMutation.isPending}>
                  Confirm
                </IonButton>
                <IonButton expand="block" fill="clear" onClick={resetStatusDraft}>
                  Back
                </IonButton>
              </div>
            ) : null}

            {(versionConflict || updateMutation.isError || cancelMutation.isError || suggestMutation.isError) && (
              <IonText color="warning">
                <p className="booking-meta">
                  {versionConflict
                    ? 'This appointment was updated elsewhere. Details refreshed — review and try again.'
                    : readError(updateMutation.error ?? cancelMutation.error ?? suggestMutation.error)}
                </p>
              </IonText>
            )}

            {!showCancel && !pendingStatus && notesChanged && editable && (
              <IonButton
                expand="block"
                className="ion-margin-top"
                onClick={saveNotes}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <IonSpinner name="crescent" /> : 'Save notes'}
              </IonButton>
            )}
          </>
        )}
      </IonContent>
    </IonModal>
  );
}
