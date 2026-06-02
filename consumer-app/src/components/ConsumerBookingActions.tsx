import {
  IonButton,
  IonDatetime,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import type { PublicCustomerBookingItem } from '../lib/types.js';
import { copy, formatCopy } from '../lib/copy.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import {
  cancelBookingWithToken,
  cancelCustomerBooking,
  fetchServiceDaySlots,
  rescheduleBookingWithToken,
  rescheduleCustomerBooking,
} from '../services/public-api.js';
import { getCustomerToken } from '../lib/customer-auth.js';

export function ConsumerBookingActions({
  booking,
  slug,
  manageToken,
  authed,
  onUpdated,
  onRescheduled,
}: {
  booking: PublicCustomerBookingItem;
  slug: string;
  manageToken?: string;
  authed: boolean;
  onUpdated: () => void;
  onRescheduled?: (previousStartTime: string, newStartTime: string) => void;
}) {
  const [busy, setBusy] = useState<'cancel' | 'reschedule' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<
    Array<{ startTime: string; endTime: string; employeeId?: string }>
  >([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const canActWithToken = Boolean(manageToken);
  const canActWithAccount = authed && Boolean(getCustomerToken(slug));
  const allowProviderChange = booking.allowProviderChangeOnReschedule === true;
  const showActions = booking.canCancel || booking.canReschedule;

  useEffect(() => {
    if (!rescheduleOpen || !selectedDate) return;
    let cancelled = false;
    setSlotsLoading(true);
    void fetchServiceDaySlots(slug, booking.serviceId, selectedDate)
      .then((list) => {
        if (cancelled) return;
        const mapped = list.filter((slot) =>
          allowProviderChange ? true : slot.employeeId === booking.employeeId,
        );
        setSlots(mapped);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    rescheduleOpen,
    selectedDate,
    slug,
    booking.serviceId,
    booking.employeeId,
    allowProviderChange,
  ]);

  if (!showActions) {
    if (booking.policyMessage) {
      return <IonText color="medium"><p className="ion-margin-top">{booking.policyMessage}</p></IonText>;
    }
    return null;
  }

  if (!canActWithToken && !canActWithAccount) {
    return (
      <IonText color="medium">
        <p className="ion-margin-top">{copy.manageBookingSignInHint}</p>
      </IonText>
    );
  }

  async function handleCancel() {
    if (!window.confirm(copy.cancelBookingConfirm)) return;
    setBusy('cancel');
    setError(null);
    try {
      if (canActWithToken && manageToken) {
        await cancelBookingWithToken(slug, booking.id, manageToken);
      } else if (canActWithAccount) {
        await cancelCustomerBooking(slug, booking.id);
      } else {
        throw new Error(copy.manageBookingSignInHint);
      }
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.cancelBookingFailed);
    } finally {
      setBusy(null);
    }
  }

  async function handleReschedule() {
    if (!selectedSlot) return;
    setBusy('reschedule');
    setError(null);
    try {
      const body = {
        startTime: selectedSlot,
        employeeId:
          allowProviderChange && selectedEmployeeId
            ? selectedEmployeeId
            : booking.employeeId,
      };
      if (canActWithToken && manageToken) {
        const result = await rescheduleBookingWithToken(slug, booking.id, manageToken, body);
        onRescheduled?.(result.previousStartTime, result.booking.startTime);
      } else if (canActWithAccount) {
        const result = await rescheduleCustomerBooking(slug, booking.id, body);
        onRescheduled?.(result.previousStartTime, result.booking.startTime);
      } else {
        throw new Error(copy.manageBookingSignInHint);
      }
      setRescheduleOpen(false);
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.rescheduleBookingFailed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ion-margin-top">
      {booking.policyMessage ? (
        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{booking.policyMessage}</p>
      ) : null}
      {(booking.rescheduleCount ?? 0) > 0 && (
        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
          {formatCopy(copy.rescheduleCountHint, {
            count: booking.rescheduleCount ?? 0,
            max: booking.maxReschedules ?? 0,
          })}
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {booking.canReschedule && (
          <IonButton
            size="small"
            fill="outline"
            onClick={() => {
              setRescheduleOpen((o) => !o);
              setSelectedDate('');
              setSelectedSlot(null);
            }}
          >
            {copy.rescheduleBooking}
          </IonButton>
        )}
        {booking.canCancel && (
          <IonButton
            size="small"
            fill="outline"
            color="danger"
            disabled={busy === 'cancel'}
            onClick={() => void handleCancel()}
          >
            {busy === 'cancel' ? copy.submitting : copy.cancelBooking}
          </IonButton>
        )}
      </div>

      {rescheduleOpen && (
        <div className="salon-card ion-margin-top">
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{copy.pickNewTime}</p>
          <IonDatetime
            presentation="date"
            min={new Date().toISOString()}
            value={selectedDate}
            onIonChange={(e) => {
              const v = e.detail.value;
              if (typeof v === 'string') {
                setSelectedDate(v.slice(0, 10));
                setSelectedSlot(null);
              }
            }}
          />
          {slotsLoading ? (
            <IonSpinner className="ion-margin-top" />
          ) : selectedDate && slots.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{copy.noSlotsThisDay}</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {slots.map((slot) => {
                const selected = selectedSlot === slot.startTime;
                return (
                  <IonButton
                    key={`${slot.startTime}-${slot.employeeId ?? ''}`}
                    size="small"
                    fill={selected ? 'solid' : 'outline'}
                    onClick={() => {
                      setSelectedSlot(slot.startTime);
                      setSelectedEmployeeId(slot.employeeId ?? booking.employeeId);
                    }}
                  >
                    {formatScheduleTime(slot.startTime)}
                  </IonButton>
                );
              })}
            </div>
          )}
          {selectedSlot && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 8 }}>
              {formatCopy(copy.rescheduleSummary, {
                date: formatDateDisplay(selectedSlot),
                time: formatScheduleTime(selectedSlot),
              })}
            </p>
          )}
          <IonButton
            expand="block"
            className="ion-margin-top"
            disabled={!selectedSlot || busy === 'reschedule'}
            onClick={() => void handleReschedule()}
          >
            {busy === 'reschedule' ? copy.submitting : copy.confirmReschedule}
          </IonButton>
        </div>
      )}

      {error ? <p className="ion-margin-top" style={{ color: '#dc2626' }}>{error}</p> : null}
    </div>
  );
}
