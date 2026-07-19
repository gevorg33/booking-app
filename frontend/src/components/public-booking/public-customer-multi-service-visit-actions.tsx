'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Loader2, XCircle } from 'lucide-react';
import { BookingDayStrip } from '@/components/public-booking/booking-day-strip';
import { BookingTimeSlotGrid } from '@/components/public-booking/booking-time-slot-grid';
import {
  cancelPublicBookingWithToken,
  cancelPublicCustomerBooking,
  getPublicMultiServiceBlockSlots,
  reschedulePublicBookingWithToken,
  reschedulePublicCustomerBooking,
  suggestPublicMultiServiceBlock,
  type PublicBusinessProfile,
  type PublicMultiServiceVisitSummary,
} from '@/lib/public-api';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { buildBookingDayOptions } from '@/lib/booking-day-options';
import { useI18n } from '@/i18n';
import { confirmDialog } from '@/lib/app-dialog';
import {
  getErrorMessage,
  getPackageScheduleErrorMessage,
  isVisitDurationCapError,
} from '@/lib/error-message';

const ACTIVE_STATUSES = new Set(['confirmed', 'pending']);

/** Whole-visit cancel/reschedule for same_visit multi-service groups (e2e-bug.34). */
export function PublicCustomerMultiServiceVisitActions({
  slug,
  tenant,
  primary,
  anchorBookingId,
  visit,
  onUpdated,
  manageToken,
  onRescheduled,
}: {
  slug: string;
  tenant: PublicBusinessProfile;
  primary: string;
  anchorBookingId: string;
  visit: PublicMultiServiceVisitSummary;
  onUpdated: () => void;
  manageToken?: string;
  onRescheduled?: (previousStartTime: string, newStartTime: string) => void;
}) {
  const { t, locale } = useI18n();
  const { customer } = usePublicCustomerAuth();
  const tz = tenant.timezone || 'UTC';
  const dayOptions = useMemo(() => buildBookingDayOptions(tz, undefined, locale), [tz, locale]);

  const [busy, setBusy] = useState<'cancel' | 'reschedule' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [dateKey, setDateKey] = useState('');
  const [slots, setSlots] = useState<
    Array<{ startTime: string; employeeId: string; employeeName: string }>
  >([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);

  const canActWithToken = Boolean(manageToken);
  const canActWithAccount = Boolean(customer);
  const activeAppointments = visit.appointments.filter((a) => ACTIVE_STATUSES.has(a.status));
  const showActions =
    activeAppointments.length > 0 && (visit.canCancelAll || visit.canRescheduleAll);
  const serviceIds = useMemo(
    () =>
      [
        ...new Set(
          activeAppointments.map((a) => a.serviceId).filter(Boolean),
        ),
      ],
    [activeAppointments],
  );

  const slotsRequestRef = useRef(0);

  const loadDaySlots = useCallback(
    async (day: string, preferredStart?: string | null) => {
      if (serviceIds.length === 0) return;
      const requestId = ++slotsRequestRef.current;
      setSlotsLoading(true);
      try {
        const result = await getPublicMultiServiceBlockSlots(slug, serviceIds, day);
        if (slotsRequestRef.current !== requestId) return;
        setSlots(result.slots);
        if (result.slots.length > 0) {
          const match = preferredStart
            ? result.slots.find((slot) => slot.startTime === preferredStart)
            : undefined;
          const chosen = match ?? result.slots[0]!;
          setSelectedStart(chosen.startTime);
          setEmployeeId(chosen.employeeId);
          setError(null);
        } else {
          setSelectedStart(null);
          setEmployeeId(null);
        }
      } catch (err) {
        if (slotsRequestRef.current === requestId) {
          setSlots([]);
          setSelectedStart(null);
          setEmployeeId(null);
          setError(
            getPackageScheduleErrorMessage(err, {
              packageCannotSchedule: t('public.packageCannotSchedule'),
              fallback: t('public.loadingSlots'),
            }),
          );
        }
      } finally {
        if (slotsRequestRef.current === requestId) setSlotsLoading(false);
      }
    },
    [serviceIds, slug, t],
  );

  useEffect(() => {
    if (!rescheduleOpen || serviceIds.length === 0) return;
    let cancelled = false;
    queueMicrotask(() => setPickerLoading(true));
    queueMicrotask(() => setError(null));
    void (async () => {
      try {
        const suggested = await suggestPublicMultiServiceBlock(slug, serviceIds);
        if (cancelled) return;
        setDateKey(suggested.dateKey);
        await loadDaySlots(suggested.dateKey, suggested.startTime);
      } catch (err) {
        if (cancelled) return;
        setError(
          getPackageScheduleErrorMessage(err, {
            packageCannotSchedule: t('public.packageCannotSchedule'),
            fallback: t('public.multiServiceNoBlock'),
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
  }, [loadDaySlots, rescheduleOpen, serviceIds, slug, t]);

  if (!showActions) {
    if (visit.policyMessage) {
      return <p className="text-xs text-gray-500 mt-2">{visit.policyMessage}</p>;
    }
    return null;
  }

  if (!canActWithToken && !canActWithAccount) {
    return (
      <p className="text-sm text-gray-600 mt-3">
        {t('public.manageBookingSignInHint')}{' '}
        <Link href={bookPath(slug, '/account')} className="font-medium" style={{ color: primary }}>
          {t('public.signIn')}
        </Link>
      </p>
    );
  }

  async function handleCancel() {
    if (
      !(await confirmDialog({
        message: t('public.cancelMultiServiceVisitConfirm'),
        destructive: true,
      }))
    ) {
      return;
    }
    setBusy('cancel');
    setError(null);
    try {
      if (canActWithToken && manageToken) {
        await cancelPublicBookingWithToken(slug, anchorBookingId, manageToken);
      } else if (canActWithAccount) {
        await cancelPublicCustomerBooking(slug, anchorBookingId);
      } else {
        throw new Error(t('public.manageBookingSignInHint'));
      }
      onUpdated();
    } catch (err) {
      setError(getErrorMessage(err, t('public.cancelMultiServiceVisitFailed')));
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
      const previousStartTime = activeAppointments[0]?.startTime ?? selectedStart;
      if (canActWithToken && manageToken) {
        const result = await reschedulePublicBookingWithToken(
          slug,
          anchorBookingId,
          manageToken,
          body,
        );
        onRescheduled?.(previousStartTime, result.booking.startTime);
      } else if (canActWithAccount) {
        const result = await reschedulePublicCustomerBooking(slug, anchorBookingId, body);
        onRescheduled?.(previousStartTime, result.booking.startTime);
      } else {
        throw new Error(t('public.manageBookingSignInHint'));
      }
      setRescheduleOpen(false);
      onUpdated();
    } catch (err) {
      setError(getErrorMessage(err, t('public.rescheduleBookingFailed')));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {visit.policyMessage && (
        <p className="text-xs text-gray-500">{visit.policyMessage}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {visit.canRescheduleAll && (
          <button
            type="button"
            onClick={() => setRescheduleOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <CalendarClock className="w-4 h-4" />
            {t('public.rescheduleMultiServiceVisit')}
          </button>
        )}
        {visit.canCancelAll && (
          <button
            type="button"
            onClick={() => void handleCancel()}
            disabled={busy === 'cancel'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {busy === 'cancel' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {t('public.cancelMultiServiceVisit')}
          </button>
        )}
      </div>

      {rescheduleOpen && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
          <p className="text-sm font-medium text-gray-900">
            {t('public.rescheduleMultiServiceVisitHint')}
          </p>
          {pickerLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('public.loadingSlots')}
            </div>
          ) : (
            <>
              <BookingDayStrip
                dayOptions={dayOptions}
                selectedDateKey={dateKey}
                onSelectDateKey={(day) => {
                  setDateKey(day);
                  setSelectedStart(null);
                  setEmployeeId(null);
                  void loadDaySlots(day, null);
                }}
                primaryColor={primary}
                todayLabel={t('public.today')}
              />
              <BookingTimeSlotGrid
                slots={slots}
                loading={slotsLoading}
                selectedStartTime={selectedStart}
                onSelectStartTime={(startTime) => {
                  const slot = slots.find((s) => s.startTime === startTime);
                  setSelectedStart(startTime);
                  setEmployeeId(slot?.employeeId ?? employeeId);
                }}
                primaryColor={primary}
                emptyLabel={t('public.noSlotsThisDay')}
                heading={t('public.pickNewTime')}
                timeZone={tz}
              />
              {selectedStart && (
                <p className="text-xs text-gray-600">
                  {t('public.rescheduleMultiServiceVisitSummary', {
                    date: formatDateDisplay(new Date(selectedStart), locale),
                    time: formatScheduleTime(new Date(selectedStart)),
                    count: String(activeAppointments.length),
                  })}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleReschedule()}
                disabled={!selectedStart || busy === 'reschedule'}
                className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: primary }}
              >
                {busy === 'reschedule' ? t('public.submitting') : t('public.confirmReschedule')}
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
