'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Loader2, XCircle } from 'lucide-react';
import { BookingDayStrip } from '@/components/public-booking/booking-day-strip';
import { BookingTimeSlotGrid } from '@/components/public-booking/booking-time-slot-grid';
import {
  cancelPublicCustomerPackageVisit,
  cancelPublicPackageVisitWithToken,
  getPublicPackage,
  getPublicPackageBlockSlots,
  reschedulePublicCustomerPackageVisit,
  reschedulePublicPackageVisitWithToken,
  suggestPublicPackageBlock,
  type PublicBusinessProfile,
  type PublicPackageVisitSummary,
  type PackageVisitRescheduleLine,
} from '@/lib/public-api';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { buildBookingDayOptions } from '@/lib/booking-day-options';
import { buildPackageLinesFromBlockStart, expandPackageServiceItems } from '@/lib/package-booking';
import { useI18n } from '@/i18n';

const ACTIVE_STATUSES = new Set(['confirmed', 'pending']);

export function PublicCustomerPackageVisitActions({
  slug,
  tenant,
  primary,
  anchorBookingId,
  packageVisit,
  onUpdated,
  manageToken,
  onRescheduled,
}: {
  slug: string;
  tenant: PublicBusinessProfile;
  primary: string;
  anchorBookingId: string;
  packageVisit: PublicPackageVisitSummary;
  onUpdated: () => void;
  manageToken?: string;
  onRescheduled?: (previousStartTime: string, newStartTime: string) => void;
}) {
  const { t, locale } = useI18n();
  const { customer } = usePublicCustomerAuth();
  const tz = tenant.timezone || 'UTC';
  const turnover = tenant.multiService?.turnoverBufferMinutes ?? 5;
  const dayOptions = useMemo(() => buildBookingDayOptions(tz), [tz]);

  const [busy, setBusy] = useState<'cancel' | 'reschedule' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [dateKey, setDateKey] = useState('');
  const [slots, setSlots] = useState<Array<{ startTime: string; employeeId: string; employeeName: string }>>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);

  const canActWithToken = Boolean(manageToken);
  const canActWithAccount = Boolean(customer);
  const activeAppointments = packageVisit.appointments.filter((a) => ACTIVE_STATUSES.has(a.status));
  const showActions =
    activeAppointments.length > 0 && (packageVisit.canCancelAll || packageVisit.canRescheduleAll);

  const slotsRequestRef = useRef(0);

  const loadDaySlots = useCallback(
    async (day: string, preferredStart?: string | null) => {
      if (!packageVisit.packageId) return;
      const requestId = ++slotsRequestRef.current;
      setSlotsLoading(true);
      try {
        const result = await getPublicPackageBlockSlots(slug, packageVisit.packageId, day);
        if (slotsRequestRef.current !== requestId) return;
        setSlots(result.slots);
        if (result.slots.length > 0) {
          const match = preferredStart
            ? result.slots.find((slot) => slot.startTime === preferredStart)
            : undefined;
          const chosen = match ?? result.slots[0];
          setSelectedStart(chosen.startTime);
          setEmployeeId(chosen.employeeId);
        } else {
          setSelectedStart(null);
          setEmployeeId(null);
        }
      } catch {
        if (slotsRequestRef.current === requestId) {
          setSlots([]);
          setSelectedStart(null);
          setEmployeeId(null);
        }
      } finally {
        if (slotsRequestRef.current === requestId) setSlotsLoading(false);
      }
    },
    [packageVisit.packageId, slug],
  );

  useEffect(() => {
    if (!rescheduleOpen || !packageVisit.packageId) return;
    let cancelled = false;
    setPickerLoading(true);
    setError(null);
    void (async () => {
      try {
        const suggested = await suggestPublicPackageBlock(slug, packageVisit.packageId!);
        if (cancelled) return;
        setDateKey(suggested.dateKey);
        setSelectedStart(suggested.startTime);
        setEmployeeId(suggested.employeeId);
        await loadDaySlots(suggested.dateKey, suggested.startTime);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('public.packageNoBlock'));
          const today = new Date().toISOString().slice(0, 10);
          setDateKey(today);
          await loadDaySlots(today);
        }
      } finally {
        if (!cancelled) setPickerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDaySlots, packageVisit.packageId, rescheduleOpen, slug, t]);

  if (!showActions) {
    if (packageVisit.policyMessage) {
      return <p className="text-xs text-gray-500 mt-2">{packageVisit.policyMessage}</p>;
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

  async function handleCancelPackage() {
    if (!window.confirm(t('public.cancelPackageVisitConfirm'))) return;
    setBusy('cancel');
    setError(null);
    try {
      if (canActWithToken && manageToken) {
        await cancelPublicPackageVisitWithToken(slug, anchorBookingId, manageToken);
      } else if (canActWithAccount) {
        await cancelPublicCustomerPackageVisit(slug, anchorBookingId);
      } else {
        throw new Error(t('public.manageBookingSignInHint'));
      }
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('public.cancelPackageVisitFailed'));
    } finally {
      setBusy(null);
    }
  }

  async function handleReschedulePackage() {
    if (!selectedStart || !employeeId || !packageVisit.packageId) return;
    setBusy('reschedule');
    setError(null);
    try {
      const { package: pkg } = await getPublicPackage(slug, packageVisit.packageId);
      const expanded = expandPackageServiceItems(pkg);
      const blockLines = buildPackageLinesFromBlockStart(expanded, selectedStart, employeeId, turnover);
      const sorted = [...activeAppointments].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      if (blockLines.length !== sorted.length) {
        throw new Error(t('public.reschedulePackageVisitFailed'));
      }
      const lines: PackageVisitRescheduleLine[] = sorted.map((appt, index) => ({
        bookingId: appt.bookingId,
        startTime: blockLines[index].startTime,
        employeeId: blockLines[index].employeeId,
      }));

      const previousStartTime = sorted[0].startTime;
      if (canActWithToken && manageToken) {
        const result = await reschedulePublicPackageVisitWithToken(
          slug,
          anchorBookingId,
          manageToken,
          lines,
        );
        onRescheduled?.(previousStartTime, result.bookings[0]?.startTime ?? selectedStart);
      } else if (canActWithAccount) {
        const result = await reschedulePublicCustomerPackageVisit(slug, anchorBookingId, lines);
        onRescheduled?.(previousStartTime, result.bookings[0]?.startTime ?? selectedStart);
      } else {
        throw new Error(t('public.manageBookingSignInHint'));
      }
      setRescheduleOpen(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('public.reschedulePackageVisitFailed'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm font-medium text-gray-900">
        {t('public.packageVisitTitle', { name: packageVisit.packageName })}
      </p>
      <ul className="text-sm text-gray-600 space-y-1">
        {packageVisit.appointments.map((appt) => (
          <li key={appt.bookingId}>
            <span className="font-medium text-gray-800">{appt.serviceName}</span>
            {' · '}
            {formatDateDisplay(appt.startTime, locale)} {formatScheduleTime(new Date(appt.startTime))}
          </li>
        ))}
      </ul>

      {packageVisit.policyMessage && (
        <p className="text-xs text-gray-500">{packageVisit.policyMessage}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {packageVisit.canRescheduleAll && packageVisit.packageId && (
          <button
            type="button"
            onClick={() => setRescheduleOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <CalendarClock className="w-4 h-4" />
            {t('public.reschedulePackageVisit')}
          </button>
        )}
        {packageVisit.canRescheduleAll && !packageVisit.packageId && (
          <p className="text-xs text-amber-700">{t('public.packageVisitRescheduleUnavailable')}</p>
        )}
        {packageVisit.canCancelAll && (
          <button
            type="button"
            onClick={() => void handleCancelPackage()}
            disabled={busy === 'cancel'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {busy === 'cancel' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {t('public.cancelPackageVisit')}
          </button>
        )}
      </div>

      {rescheduleOpen && packageVisit.packageId && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
          <p className="text-sm font-medium text-gray-900">{t('public.reschedulePackageVisitHint')}</p>
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
              />
              {selectedStart && (
                <p className="text-xs text-gray-600">
                  {t('public.reschedulePackageVisitSummary', {
                    date: formatDateDisplay(new Date(selectedStart), locale),
                    time: formatScheduleTime(new Date(selectedStart)),
                    count: String(activeAppointments.length),
                  })}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleReschedulePackage()}
                disabled={!selectedStart || busy === 'reschedule'}
                className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: primary }}
              >
                {busy === 'reschedule' ? t('public.submitting') : t('public.confirmReschedulePackageVisit')}
              </button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
