import { IonDatetime, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicBusinessProfile, PublicMultiServiceVisitSummary } from '../lib/types.js';
import type { ConsumerCopy } from '../lib/copy.js';
import { formatCopy } from '../lib/copy.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import {
  cancelBookingWithToken,
  cancelCustomerBooking,
  getPublicMultiServiceBlockSlots,
  rescheduleBookingWithToken,
  rescheduleCustomerBooking,
  suggestPublicMultiServiceBlock,
} from '../services/public-api.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import {
  formatFriendlyNetworkError,
  formatPackageScheduleError,
  isVisitDurationCapError,
} from '../lib/consumer-network-ux.util.js';
import { ConsumerActionButton } from './ConsumerActionButton.js';

const ACTIVE = new Set(['confirmed', 'pending']);

/** Whole-visit cancel/reschedule for same_visit multi-service groups (e2e-bug.34). */
export function ConsumerMultiServiceVisitActions({
  slug,
  tenant: _tenant,
  anchorBookingId,
  visit,
  manageToken,
  authed,
  copy,
  onUpdated,
  onRescheduled,
}: {
  slug: string;
  tenant: PublicBusinessProfile;
  anchorBookingId: string;
  visit: PublicMultiServiceVisitSummary;
  manageToken?: string;
  authed: boolean;
  copy: ConsumerCopy;
  onUpdated: () => void;
  onRescheduled?: (previousStartTime: string, newStartTime: string) => void;
}) {
  const [busy, setBusy] = useState<'cancel' | 'reschedule' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [dateKey, setDateKey] = useState('');
  const [slots, setSlots] = useState<
    Array<{ startTime: string; employeeId?: string; employeeName?: string }>
  >([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);

  const canActWithToken = Boolean(manageToken);
  const canActWithAccount = authed && Boolean(getCustomerToken(slug));
  const activeCount = visit.appointments.filter((a) => ACTIVE.has(a.status)).length;
  const showActions = activeCount > 0 && (visit.canCancelAll || visit.canRescheduleAll);
  const serviceIds = useMemo(
    () =>
      [
        ...new Set(
          visit.appointments
            .filter((a) => ACTIVE.has(a.status))
            .map((a) => a.serviceId)
            .filter(Boolean),
        ),
      ],
    [visit.appointments],
  );

  const loadDaySlots = useCallback(
    async (day: string, preferredStart?: string | null) => {
      if (serviceIds.length === 0) return;
      setSlotsLoading(true);
      try {
        const result = await getPublicMultiServiceBlockSlots(slug, serviceIds, day);
        setSlots(result.slots);
        if (result.slots.length > 0) {
          const match = preferredStart
            ? result.slots.find((s) => s.startTime === preferredStart)
            : undefined;
          const chosen = match ?? result.slots[0]!;
          setSelectedStart(chosen.startTime);
          setEmployeeId(chosen.employeeId ?? null);
          setError(null);
        } else {
          setSelectedStart(null);
          setEmployeeId(null);
        }
      } catch (err: unknown) {
        setSlots([]);
        setSelectedStart(null);
        setEmployeeId(null);
        setError(
          formatPackageScheduleError(err, {
            packageCannotSchedule: copy.packageCannotSchedule,
            fallback: copy.loadAvailableTimesFailed,
          }),
        );
      } finally {
        setSlotsLoading(false);
      }
    },
    [copy.loadAvailableTimesFailed, copy.packageCannotSchedule, serviceIds, slug],
  );

  useEffect(() => {
    if (!rescheduleOpen || serviceIds.length === 0) return;
    let cancelled = false;
    setPickerLoading(true);
    setError(null);
    void (async () => {
      try {
        const suggested = await suggestPublicMultiServiceBlock(slug, serviceIds);
        if (cancelled) return;
        setDateKey(suggested.dateKey);
        await loadDaySlots(suggested.dateKey, suggested.startTime);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          formatPackageScheduleError(err, {
            packageCannotSchedule: copy.packageCannotSchedule,
            fallback: copy.multiServiceNoBlock,
          }),
        );
        if (isVisitDurationCapError(err)) {
          setSlots([]);
          setSlotsLoading(false);
          return;
        }
        const today = new Date().toISOString().slice(0, 10);
        setDateKey(today);
        await loadDaySlots(today);
      } finally {
        if (!cancelled) setPickerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    copy.multiServiceNoBlock,
    copy.packageCannotSchedule,
    loadDaySlots,
    rescheduleOpen,
    serviceIds,
    slug,
  ]);

  if (!showActions) {
    if (visit.policyMessage) {
      return (
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 8 }}>{visit.policyMessage}</p>
      );
    }
    return null;
  }

  if (!canActWithToken && !canActWithAccount) {
    return (
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 8 }}>
        {copy.manageBookingSignInHint}
      </p>
    );
  }

  async function handleCancel() {
    if (!window.confirm(copy.cancelMultiServiceVisitConfirm)) return;
    setBusy('cancel');
    setError(null);
    try {
      if (canActWithToken && manageToken) {
        await cancelBookingWithToken(slug, anchorBookingId, manageToken);
      } else if (canActWithAccount) {
        await cancelCustomerBooking(slug, anchorBookingId);
      } else {
        throw new Error(copy.manageBookingSignInHint);
      }
      onUpdated();
    } catch (err: unknown) {
      setError(formatFriendlyNetworkError(err, copy.cancelMultiServiceVisitFailed));
    } finally {
      setBusy(null);
    }
  }

  async function handleReschedule() {
    if (!selectedStart || !employeeId) return;
    setBusy('reschedule');
    setError(null);
    try {
      const body = { startTime: selectedStart, employeeId };
      if (canActWithToken && manageToken) {
        const result = await rescheduleBookingWithToken(
          slug,
          anchorBookingId,
          manageToken,
          body,
        );
        onRescheduled?.(result.previousStartTime, result.booking.startTime);
      } else if (canActWithAccount) {
        const result = await rescheduleCustomerBooking(slug, anchorBookingId, body);
        onRescheduled?.(result.previousStartTime, result.booking.startTime);
      } else {
        throw new Error(copy.manageBookingSignInHint);
      }
      setRescheduleOpen(false);
      onUpdated();
    } catch (err: unknown) {
      setError(formatFriendlyNetworkError(err, copy.rescheduleBookingFailed));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ion-margin-top">
      {visit.policyMessage ? (
        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{visit.policyMessage}</p>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {visit.canRescheduleAll && (
          <ConsumerActionButton
            size="small"
            fill="outline"
            aria-expanded={rescheduleOpen}
            onClick={() => setRescheduleOpen((o) => !o)}
          >
            {copy.rescheduleMultiServiceVisit}
          </ConsumerActionButton>
        )}
        {visit.canCancelAll && (
          <ConsumerActionButton
            size="small"
            fill="outline"
            color="danger"
            disabled={busy === 'cancel'}
            onClick={() => void handleCancel()}
          >
            {busy === 'cancel' ? copy.submitting : copy.cancelMultiServiceVisit}
          </ConsumerActionButton>
        )}
      </div>

      {rescheduleOpen && (
        <div className="salon-card ion-margin-top">
          {pickerLoading ? (
            <IonSpinner />
          ) : (
            <>
              <IonDatetime
                presentation="date"
                min={new Date().toISOString()}
                value={dateKey}
                onIonChange={(e) => {
                  const v = e.detail.value;
                  if (typeof v === 'string') {
                    const day = v.slice(0, 10);
                    setDateKey(day);
                    setSelectedStart(null);
                    setError(null);
                    void loadDaySlots(day);
                  }
                }}
              />
              {slotsLoading ? (
                <IonSpinner className="ion-margin-top" />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {slots.map((slot) => {
                    const selected = selectedStart === slot.startTime;
                    return (
                      <ConsumerActionButton
                        key={slot.startTime}
                        size="small"
                        fill={selected ? 'solid' : 'outline'}
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedStart(slot.startTime);
                          setEmployeeId(slot.employeeId ?? employeeId);
                        }}
                      >
                        {formatScheduleTime(slot.startTime)}
                      </ConsumerActionButton>
                    );
                  })}
                </div>
              )}
              {selectedStart && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 8 }}>
                  {formatCopy(copy.rescheduleMultiServiceVisitSummary, {
                    date: formatDateDisplay(selectedStart),
                    time: formatScheduleTime(selectedStart),
                    count: activeCount,
                  })}
                </p>
              )}
              <ConsumerActionButton
                expand="block"
                className="ion-margin-top"
                disabled={!selectedStart || busy === 'reschedule'}
                onClick={() => void handleReschedule()}
              >
                {busy === 'reschedule' ? copy.submitting : copy.confirmReschedule}
              </ConsumerActionButton>
            </>
          )}
        </div>
      )}
      {error ? (
        <p role="alert" style={{ color: '#dc2626', marginTop: 8 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
