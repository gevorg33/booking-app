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
import {
  applyOptimisticBookingPatches,
  captureBookingCaches,
  restoreBookingCaches,
  type BookingOptimisticPatch,
} from '../lib/provider-booking-optimistic.util';
import { isOfflineQueuedResponse } from '../lib/provider-offline-response.util';
import { formatDateDisplay, formatTimeDisplay, formatTimeRangeDisplay } from '../lib/date-format';
import { DatePicker } from './DatePicker';
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
} from '../lib/booking-types';
import BookingPaymentBreakdown from './BookingPaymentBreakdown';
import BookingCustomerContextCard from './BookingCustomerContextCard';
import BookingCustomerContactActions from './BookingCustomerContactActions';
import CustomerVisitHistoryStrip from './CustomerVisitHistoryStrip';
import BookingCustomerStaffNotesSection from './BookingCustomerStaffNotesSection';
import BookingPreVisitIntakeSection from './BookingPreVisitIntakeSection';
import BookingCheckoutContextBadges from './BookingCheckoutContextBadges';
import BookingReassignSection from './BookingReassignSection';
import BookingRetailPosSection from './BookingRetailPosSection';
import { BookingLabResultsSection } from './BookingLabResultsSection';
import type { ProviderBookingCustomerContext } from '../lib/provider-booking-customer-context.types';
import { useI18n } from '../i18n';
import { requestProviderBookingReview } from '../lib/provider-reviews-inbox';
import {
  checkInProviderBooking,
  floorStatusColor,
  formatFloorStatusLabel,
  type ProviderBookingFloorStatus,
} from '../lib/provider-booking-check-in';
import {
  formatVisitStatusLabel,
  markProviderBookingReadyNow,
  markProviderBookingRunningLate,
  visitStatusBadgeColor,
} from '../lib/provider-booking-visit-status';
import './provider-booking-detail-modal.css';

interface BookingDetailModalProps {
  businessId: string;
  bookingId: string | null;
  onClose: () => void;
  onAiPrompt?: (prompt: string) => void;
}

function readError(err: unknown, fallback: string): string {
  const ax = err as {
    response?: {
      data?: {
        message?: string | { message?: string; code?: string; updatedAt?: string };
      };
    };
  };
  const msg = ax.response?.data?.message;
  if (typeof msg === 'object' && msg?.message) return msg.message;
  return typeof msg === 'string' ? msg : fallback;
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
  const { t } = useI18n();
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
  const [pastVisitBookingId, setPastVisitBookingId] = useState<string | null>(null);

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

  const { data: customerContext, isLoading: customerContextLoading } = useQuery({
    queryKey: ['provider-booking-customer-context', businessId, bookingId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/provider/bookings/${bookingId}/customer-context`,
      );
      return unwrap<ProviderBookingCustomerContext>(res);
    },
    enabled: !!businessId && !!bookingId && !!booking?.customer?.id,
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
    setPastVisitBookingId(null);
  }, [booking]);

  const invalidateLists = () => {
    void queryClient.invalidateQueries({ queryKey: ['provider-today', businessId] });
    void queryClient.invalidateQueries({ queryKey: ['provider-team-floor', businessId] });
    void queryClient.invalidateQueries({ queryKey: ['provider-team-whos-next', businessId] });
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
      const response = await api.put(
        `/businesses/${businessId}/provider/bookings/${bookingId}`,
        payload,
      );
      if (isOfflineQueuedResponse(response.data, response.status)) {
        return { kind: 'queued' as const };
      }
      return { kind: 'ok' as const, booking: unwrap<BookingDetail>(response.data) };
    },
    onMutate: async (payload) => {
      if (!bookingId) return;
      const patch: BookingOptimisticPatch = {};
      if (payload.status) patch.status = payload.status;
      if (payload.paymentStatus) patch.paymentStatus = payload.paymentStatus;
      if (payload.notes !== undefined) patch.notes = payload.notes;
      if (payload.paymentStatus === 'paid' && !payload.status) {
        patch.status = 'completed';
      }
      const snapshot = captureBookingCaches(queryClient, businessId, bookingId);
      applyOptimisticBookingPatches(queryClient, businessId, [bookingId], patch);
      return { snapshot };
    },
    onSuccess: (result) => {
      setVersionConflict(false);
      if (result.kind === 'queued') return;
      syncFromBooking(result.booking);
      invalidateLists();
    },
    onError: (err, _payload, context) => {
      if (context?.snapshot && bookingId) {
        restoreBookingCaches(queryClient, businessId, bookingId, context.snapshot);
      }
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
          reason: cancelReason.trim() || t('provider.cancelledByProvider'),
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

  const requestReviewMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error('Missing booking');
      return requestProviderBookingReview(businessId, bookingId);
    },
    onSuccess: () => {
      invalidateLists();
      void queryClient.invalidateQueries({
        queryKey: ['provider-reviews-inbox', businessId],
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error('Missing booking');
      return checkInProviderBooking(businessId, bookingId);
    },
    onSuccess: () => {
      invalidateLists();
      void refetch();
    },
  });

  const runningLateMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error('Missing booking');
      return markProviderBookingRunningLate(businessId, bookingId, 10);
    },
    onSuccess: () => {
      invalidateLists();
      void refetch();
    },
  });

  const readyNowMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error('Missing booking');
      return markProviderBookingReadyNow(businessId, bookingId);
    },
    onSuccess: () => {
      invalidateLists();
      void refetch();
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
      header: t('appointments.paymentStatus'),
      cssClass: 'provider-picker-sheet',
      buttons: [
        ...PAYMENT_STATUS_OPTIONS.map((option) => ({
          text:
            paymentStatus === option
              ? `${formatPaymentLabel(option, t)} ✓`
              : formatPaymentLabel(option, t),
          cssClass: paymentStatus === option ? 'provider-sheet-selected' : undefined,
          handler: () => applyPaymentChange(option),
        })),
        { text: t('provider.dismiss'), role: 'cancel' as const },
      ],
    });
  };

  const openStatusPicker = () => {
    const options: BookingStatus[] = [...statusOptions];
    if (!options.includes('cancelled')) options.push('cancelled');

    presentActionSheet({
      header: t('appointments.status'),
      cssClass: 'provider-picker-sheet',
      buttons: [
        ...options.map((option) => ({
          text:
            displayStatus === option
              ? `${formatStatusLabel(option, t)} ✓`
              : formatStatusLabel(option, t),
          cssClass: displayStatus === option ? 'provider-sheet-selected' : undefined,
          handler: () => applyStatusChange(option),
        })),
        { text: t('provider.dismiss'), role: 'cancel' as const },
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
    <IonModal isOpen={!!bookingId} onDidDismiss={onClose} className="provider-booking-detail-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('appointments.detailTitle')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>{t('provider.close')}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding provider-booking-detail-content">
        {isLoading ? (
          <div className="empty-state"><IonSpinner /></div>
        ) : isError || !booking ? (
          <p className="empty-state">Could not load appointment.</p>
        ) : (
          <>
            <div className="ion-margin-bottom">
              <h2>{booking.service?.name ?? t('appointments.detailFallbackTitle')}</h2>
              <p className="booking-meta">{formatDateDisplay(booking.startTime)}</p>
              <p>{formatTimeRangeDisplay(booking.startTime, booking.endTime)}</p>
              <IonBadge color={STATUS_COLOR[displayStatus] ?? 'medium'}>
                {formatStatusLabel(displayStatus, t)}
              </IonBadge>
              {booking.floorStatus ? (
                <IonBadge
                  color={floorStatusColor(booking.floorStatus as ProviderBookingFloorStatus)}
                  style={{ marginLeft: 8 }}
                >
                  {formatFloorStatusLabel(booking.floorStatus as ProviderBookingFloorStatus, t)}
                </IonBadge>
              ) : null}
              {booking.visitStatus ? (
                <IonBadge
                  color={visitStatusBadgeColor(booking.visitStatus.kind)}
                  style={{ marginLeft: 8 }}
                >
                  {formatVisitStatusLabel(booking.visitStatus, t)}
                </IonBadge>
              ) : null}
            </div>

            {booking.checkIn?.allowed ? (
              <IonButton
                expand="block"
                className="ion-margin-bottom"
                disabled={checkInMutation.isPending}
                onClick={() => checkInMutation.mutate()}
              >
                {checkInMutation.isPending
                  ? t('provider.checkInWorking')
                  : t('provider.checkInClient')}
              </IonButton>
            ) : null}
            {checkInMutation.isError ? (
              <IonText color="danger">
                <p className="booking-meta">{t('provider.checkInFailed')}</p>
              </IonText>
            ) : null}

            {booking.visitStatusActions?.allowed ? (
              <div
                className="ion-margin-bottom"
                style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}
              >
                <IonButton
                  expand="block"
                  fill="outline"
                  disabled={runningLateMutation.isPending || readyNowMutation.isPending}
                  onClick={() => runningLateMutation.mutate()}
                >
                  {runningLateMutation.isPending
                    ? t('provider.visitStatusWorking')
                    : t('provider.markRunningLate')}
                </IonButton>
                <IonButton
                  expand="block"
                  disabled={runningLateMutation.isPending || readyNowMutation.isPending}
                  onClick={() => readyNowMutation.mutate()}
                >
                  {readyNowMutation.isPending
                    ? t('provider.visitStatusWorking')
                    : t('provider.markReadyNow')}
                </IonButton>
              </div>
            ) : null}
            {runningLateMutation.isError || readyNowMutation.isError ? (
              <IonText color="danger">
                <p className="booking-meta">{t('provider.visitStatusFailed')}</p>
              </IonText>
            ) : null}

            {booking.checkoutContext && (
              <BookingCheckoutContextBadges context={booking.checkoutContext} />
            )}

            {editable && onAiPrompt && (
              <div className="ion-margin-bottom ai-booking-actions">
                <h3>{t('provider.aiActionsTitle')}</h3>
                <div className="ai-booking-actions__chips">
                  <button
                    type="button"
                    className="ai-assistant-example"
                    onClick={() => {
                      onAiPrompt(`Cancel ${booking.customer?.name ?? 'this'} appointment at ${formatTimeDisplay(booking.startTime)} because I'm sick`);
                      onClose();
                    }}
                  >
                    {t('provider.aiCancelSickChip')}
                  </button>
                  <button
                    type="button"
                    className="ai-assistant-example"
                    onClick={() => {
                      onAiPrompt(`Mark ${booking.customer?.name ?? 'client'}'s appointment at ${formatTimeDisplay(booking.startTime)} as done and paid`);
                      onClose();
                    }}
                  >
                    {t('provider.aiMarkDonePaidChip')}
                  </button>
                  <button
                    type="button"
                    className="ai-assistant-example"
                    onClick={() => {
                      onAiPrompt(`Reschedule ${booking.customer?.name ?? 'client'}'s ${booking.service?.name ?? 'appointment'} to 16:00`);
                      onClose();
                    }}
                  >
                    {t('provider.aiReschedule4pmChip')}
                  </button>
                </div>
              </div>
            )}

            {editable && (
              <div className="ion-margin-bottom">
                <h3>{t('appointments.reschedule')}</h3>
                <IonItem lines="full">
                  <IonLabel position="stacked">{t('common.date')}</IonLabel>
                  <DatePicker value={rescheduleDate} onChange={setRescheduleDate} />
                </IonItem>
                <IonItem lines="full">
                  <IonLabel position="stacked">{t('appointments.startTime24h')}</IonLabel>
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
                    {updateMutation.isPending ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      t('provider.saveNewTime')
                    )}
                  </IonButton>
                )}
              </div>
            )}

            {booking && (
              <BookingReassignSection
                businessId={businessId}
                booking={booking}
                onReassigned={invalidateLists}
              />
            )}

            {customerContextLoading && booking.customer?.id && (
              <div className="ion-margin-bottom empty-state">
                <IonSpinner name="crescent" />
              </div>
            )}
            {customerContext && (
              <BookingCustomerContextCard context={customerContext} />
            )}

            {booking?.customerContact && bookingId ? (
              <BookingCustomerContactActions
                bookingId={bookingId}
                phone={booking.customerContact.phone}
                callEnabled={booking.customerContact.callEnabled}
                smsEnabled={booking.customerContact.smsEnabled}
                whatsappEnabled={booking.customerContact.whatsappEnabled}
                templates={booking.staffMessageTemplates}
              />
            ) : null}

            {customerContext && (
              <CustomerVisitHistoryStrip
                context={customerContext}
                onViewBooking={setPastVisitBookingId}
                onAiPrompt={onAiPrompt}
              />
            )}

            {customerContext && bookingId && (
              <BookingCustomerStaffNotesSection
                businessId={businessId}
                bookingId={bookingId}
              />
            )}

            {bookingId && (
              <BookingPreVisitIntakeSection
                businessId={businessId}
                bookingId={bookingId}
              />
            )}

            {booking.reviewRequest?.allowed ? (
              <IonButton
                expand="block"
                fill="outline"
                className="ion-margin-bottom"
                disabled={requestReviewMutation.isPending}
                onClick={() => void requestReviewMutation.mutateAsync()}
              >
                {requestReviewMutation.isPending ? (
                  <IonSpinner name="crescent" />
                ) : (
                  t('provider.requestReview')
                )}
              </IonButton>
            ) : null}
            {requestReviewMutation.isSuccess ? (
              <IonText color="success">
                <p className="booking-meta">{t('provider.requestReviewSent')}</p>
              </IonText>
            ) : null}
            {requestReviewMutation.isError ? (
              <IonText color="danger">
                <p className="booking-meta">{t('provider.requestReviewFailed')}</p>
              </IonText>
            ) : null}

            <PickerField
              label={t('appointments.paymentStatus')}
              valueLabel={formatPaymentLabel(paymentStatus, t)}
              disabled={booking.status === 'cancelled' || updateMutation.isPending}
              onPress={openPaymentPicker}
            />

            {booking.retailPosEnabled && bookingId && (
              <BookingRetailPosSection
                businessId={businessId}
                bookingId={bookingId}
                currency={booking.service?.currency}
                disabled={booking.status === 'cancelled'}
                onSaved={invalidateLists}
              />
            )}

            {booking.paymentSummary && (
              <BookingPaymentBreakdown summary={booking.paymentSummary} />
            )}

            {booking.labFeaturesEnabled && bookingId && (
              <BookingLabResultsSection
                businessId={businessId}
                bookingId={bookingId}
              />
            )}

            {editable && (
              <PickerField
                label={t('appointments.status')}
                valueLabel={formatStatusLabel(displayStatus, t)}
                disabled={updateMutation.isPending}
                onPress={openStatusPicker}
              />
            )}

            <IonItem lines="none" className="ion-margin-bottom">
              <IonLabel position="stacked">{t('common.note')}</IonLabel>
              <IonTextarea
                value={notes}
                onIonInput={(e) => setNotes(e.detail.value ?? '')}
                rows={3}
                disabled={!editable}
                placeholder={t('appointments.internalNotesPlaceholder')}
              />
            </IonItem>

            {booking.cancellationReason && (
              <IonText color="danger">
                <p className="booking-meta">
                  {t('provider.cancelledPrefix')} {booking.cancellationReason}
                </p>
              </IonText>
            )}

            {showCancel ? (
              <div className="ion-margin-vertical">
                <IonText color="danger">
                  <p>
                    <strong>{t('appointments.cancelConfirmTitle')}</strong>
                  </p>
                </IonText>
                <IonItem lines="none">
                  <IonLabel position="stacked">{t('provider.cancellationNote')}</IonLabel>
                  <IonTextarea
                    value={cancelReason}
                    onIonInput={(e) => setCancelReason(e.detail.value ?? '')}
                    rows={3}
                    placeholder={t('appointments.cancelReasonPlaceholder')}
                  />
                </IonItem>
                <IonButton
                  expand="block"
                  fill="outline"
                  className="ion-margin-top"
                  onClick={() => void suggestMutation.mutate()}
                  disabled={suggestMutation.isPending}
                >
                  {suggestMutation.isPending ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    t('provider.helpWriteCancelNote')
                  )}
                </IonButton>
                <IonButton
                  expand="block"
                  color="danger"
                  className="ion-margin-top"
                  onClick={() => void cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    t('appointments.confirmCancel')
                  )}
                </IonButton>
                <IonButton expand="block" fill="clear" onClick={resetStatusDraft}>
                  {t('provider.keepAppointment')}
                </IonButton>
              </div>
            ) : pendingStatus ? (
              <div className="ion-margin-vertical">
                <IonText color="warning">
                  <p>
                    {t('appointments.markStatusConfirm', {
                      status: formatStatusLabel(pendingStatus, t),
                    })}
                  </p>
                </IonText>
                <IonButton expand="block" onClick={confirmPendingStatus} disabled={updateMutation.isPending}>
                  {t('appointments.confirmAction')}
                </IonButton>
                <IonButton expand="block" fill="clear" onClick={resetStatusDraft}>
                  {t('provider.back')}
                </IonButton>
              </div>
            ) : null}

            {(versionConflict || updateMutation.isError || cancelMutation.isError || suggestMutation.isError) && (
              <IonText color="warning">
                <p className="booking-meta">
                  {versionConflict
                    ? t('provider.versionConflictHint')
                    : readError(
                        updateMutation.error ?? cancelMutation.error ?? suggestMutation.error,
                        t('feedback.failed'),
                      )}
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
                {updateMutation.isPending ? (
                  <IonSpinner name="crescent" />
                ) : (
                  t('provider.saveNotes')
                )}
              </IonButton>
            )}
            <div className="provider-booking-detail-scroll-spacer" aria-hidden />
          </>
        )}
      </IonContent>
      {pastVisitBookingId && (
        <BookingDetailModal
          businessId={businessId}
          bookingId={pastVisitBookingId}
          onClose={() => setPastVisitBookingId(null)}
          onAiPrompt={onAiPrompt}
        />
      )}
    </IonModal>
  );
}
