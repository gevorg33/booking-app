import { IonDatetime, IonSpinner } from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import type { PublicBusinessProfile, PublicPackageVisitSummary } from '../lib/types.js';
import type { ConsumerCopy } from '../lib/copy.js';
import { formatCopy } from '../lib/copy.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import {
  buildPackageLinesFromBlockStart,
  expandPackageServiceItems,
} from '../lib/package-booking.js';
import {
  cancelCustomerPackageVisit,
  cancelPackageVisitWithToken,
  fetchPackageBlockSlots,
  fetchPublicPackage,
  rescheduleCustomerPackageVisit,
  reschedulePackageVisitWithToken,
  suggestPackageBlock,
} from '../services/public-api.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import {
  formatFriendlyNetworkError,
  formatPackageScheduleError,
  isVisitDurationCapError,
} from '../lib/consumer-network-ux.util.js';
import { ConsumerActionButton } from './ConsumerActionButton.js';

const ACTIVE = new Set(['confirmed', 'pending']);

export function ConsumerPackageVisitActions({
  slug,
  tenant: _tenant,
  anchorBookingId,
  packageVisit,
  manageToken,
  authed,
  copy,
  onUpdated,
  onRescheduled,
}: {
  slug: string;
  tenant: PublicBusinessProfile;
  anchorBookingId: string;
  packageVisit: PublicPackageVisitSummary;
  manageToken?: string;
  authed: boolean;
  copy: ConsumerCopy;
  onUpdated: () => void;
  onRescheduled?: (previousStartTime: string, newStartTime: string) => void;
}) {
  const turnover = 5;
  const [busy, setBusy] = useState<'cancel' | 'reschedule' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refundNotice, setRefundNotice] = useState<string | null>(null);
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
  const activeCount = packageVisit.appointments.filter((a) => ACTIVE.has(a.status)).length;
  const showActions =
    activeCount > 0 && (packageVisit.canCancelAll || packageVisit.canRescheduleAll);

  const loadDaySlots = useCallback(
    async (day: string, preferredStart?: string | null) => {
      if (!packageVisit.packageId) return;
      setSlotsLoading(true);
      try {
        const result = await fetchPackageBlockSlots(slug, packageVisit.packageId, day);
        setSlots(result.slots);
        if (result.slots.length > 0) {
          const match = preferredStart
            ? result.slots.find((s) => s.startTime === preferredStart)
            : undefined;
          const chosen = match ?? result.slots[0];
          setSelectedStart(chosen.startTime);
          setEmployeeId(chosen.employeeId ?? null);
          setError(null);
        } else {
          setSelectedStart(null);
          setEmployeeId(null);
        }
      } catch (err: unknown) {
        // e2e-bug.36 — surface schedule failures (incl. duration-cap) instead of silent empty UI.
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
    [
      copy.loadAvailableTimesFailed,
      copy.packageCannotSchedule,
      packageVisit.packageId,
      slug,
    ],
  );

  useEffect(() => {
    if (!rescheduleOpen || !packageVisit.packageId) return;
    let cancelled = false;
    setPickerLoading(true);
    setError(null);
    void (async () => {
      try {
        const suggested = await suggestPackageBlock(slug, packageVisit.packageId!);
        if (cancelled) return;
        setDateKey(suggested.dateKey);
        await loadDaySlots(suggested.dateKey, suggested.startTime);
      } catch (err: unknown) {
        if (cancelled) return;
        // e2e-bug.36 — never leave the picker blank with no explanation.
        setError(
          formatPackageScheduleError(err, {
            packageCannotSchedule: copy.packageCannotSchedule,
            fallback: copy.packageNoBlock,
          }),
        );
        // e2e-bug.15 — duration-cap is terminal; don't re-hit block-slots and clear the message.
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
    copy.packageCannotSchedule,
    copy.packageNoBlock,
    loadDaySlots,
    packageVisit.packageId,
    rescheduleOpen,
    slug,
  ]);

  if (!showActions) {
    if (packageVisit.policyMessage) {
      return <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 8 }}>{packageVisit.policyMessage}</p>;
    }
    return null;
  }

  if (!canActWithToken && !canActWithAccount) {
    return <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 8 }}>{copy.manageBookingSignInHint}</p>;
  }

  async function handleCancel() {
    if (!window.confirm(copy.cancelPackageVisitConfirm)) return;
    setBusy('cancel');
    setError(null);
    setRefundNotice(null);
    try {
      let result: { refundStatus?: 'refunded' | 'already_refunded' | 'skipped' | 'failed' };
      if (canActWithToken && manageToken) {
        result = await cancelPackageVisitWithToken(slug, anchorBookingId, manageToken);
      } else if (canActWithAccount) {
        result = await cancelCustomerPackageVisit(slug, anchorBookingId);
      } else {
        throw new Error(copy.manageBookingSignInHint);
      }
      // e2e-bug.186 — refundStatus was fetched from the backend but never
      // read here (mirrors e2e-bug.185's fix in ConsumerBookingActions),
      // so a package visit whose refund failed looked identical to a
      // successfully refunded one.
      if (result.refundStatus === 'refunded') {
        setRefundNotice(copy.cancelBookingRefunded);
      } else if (result.refundStatus === 'failed') {
        setRefundNotice(copy.cancelBookingRefundFailed);
      }
      onUpdated();
    } catch (err: unknown) {
      setError(formatFriendlyNetworkError(err, copy.cancelPackageVisitFailed));
    } finally {
      setBusy(null);
    }
  }

  async function handleReschedule() {
    if (!selectedStart || !employeeId || !packageVisit.packageId) return;
    setBusy('reschedule');
    setError(null);
    try {
      const { package: pkg } = await fetchPublicPackage(slug, packageVisit.packageId);
      const expanded = expandPackageServiceItems(pkg);
      const blockLines = buildPackageLinesFromBlockStart(
        expanded,
        selectedStart,
        employeeId,
        turnover,
      );
      const active = packageVisit.appointments.filter((a) => ACTIVE.has(a.status));
      const lines = active.map((appt, idx) => ({
        bookingId: appt.bookingId,
        startTime: blockLines[idx]?.startTime ?? selectedStart,
        employeeId,
      }));
      if (canActWithToken && manageToken) {
        const result = await reschedulePackageVisitWithToken(
          slug,
          anchorBookingId,
          manageToken,
          lines,
        );
        onRescheduled?.(result.previousStartTime, result.bookings[0]?.startTime ?? selectedStart);
      } else if (canActWithAccount) {
        const result = await rescheduleCustomerPackageVisit(slug, anchorBookingId, lines);
        onRescheduled?.(result.previousStartTime, result.bookings[0]?.startTime ?? selectedStart);
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
      {packageVisit.policyMessage ? (
        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{packageVisit.policyMessage}</p>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {packageVisit.canRescheduleAll && (
          <ConsumerActionButton
            size="small"
            fill="outline"
            aria-expanded={rescheduleOpen}
            onClick={() => setRescheduleOpen((o) => !o)}
          >
            {copy.reschedulePackageVisit}
          </ConsumerActionButton>
        )}
        {packageVisit.canCancelAll && (
          <ConsumerActionButton
            size="small"
            fill="outline"
            color="danger"
            disabled={busy === 'cancel'}
            onClick={() => void handleCancel()}
          >
            {busy === 'cancel' ? copy.submitting : copy.cancelPackageVisit}
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
              ) : slots.length === 0 ? (
                // e2e-bug.313 — explain the empty slot state instead of just
                // hiding the picker's Confirm behind a mysterious disabled button.
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 8 }}>
                  {copy.noSlotsThisDay}
                </p>
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
                  {formatCopy(copy.reschedulePackageVisitSummary, {
                    date: formatDateDisplay(selectedStart),
                    time: formatScheduleTime(selectedStart),
                    count: activeCount,
                  })}
                </p>
              )}
              {selectedStart && (
                <ConsumerActionButton
                  expand="block"
                  className="ion-margin-top"
                  disabled={busy === 'reschedule'}
                  onClick={() => void handleReschedule()}
                >
                  {busy === 'reschedule' ? copy.submitting : copy.confirmReschedule}
                </ConsumerActionButton>
              )}
            </>
          )}
        </div>
      )}
      {error ? (
        <p role="alert" style={{ color: '#dc2626', marginTop: 8 }}>
          {error}
        </p>
      ) : null}
      {refundNotice ? (
        <p
          style={{
            color: refundNotice === copy.cancelBookingRefundFailed ? '#dc2626' : '#16a34a',
            marginTop: 8,
          }}
        >
          {refundNotice}
        </p>
      ) : null}
    </div>
  );
}
