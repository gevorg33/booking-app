'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, CalendarClock, XCircle } from 'lucide-react';
import {
  cancelPublicBookingWithToken,
  cancelPublicCustomerBooking,
  getPublicServiceDaySlots,
  reschedulePublicBookingWithToken,
  reschedulePublicCustomerBooking,
  type PublicCustomerBookingItem,
} from '@/lib/public-api';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { useI18n } from '@/i18n';
import { confirmDialog } from '@/lib/app-dialog';
import { DatePicker } from '@/components/ui/date-picker';

export function PublicCustomerBookingActions({
  booking,
  slug,
  primary,
  onUpdated,
  manageToken,
  onRescheduled,
}: {
  booking: PublicCustomerBookingItem;
  slug: string;
  primary: string;
  onUpdated: () => void;
  manageToken?: string;
  onRescheduled?: (previousStartTime: string, newStartTime: string) => void;
}) {
  const { t, locale } = useI18n();
  const { customer } = usePublicCustomerAuth();
  const [busy, setBusy] = useState<'cancel' | 'reschedule' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<Array<{ startTime: string; endTime: string; employeeId?: string }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const canActWithToken = Boolean(manageToken);
  const canActWithAccount = Boolean(customer);
  const allowProviderChange = booking.allowProviderChangeOnReschedule === true;
  const showActions = booking.canCancel || booking.canReschedule;

  useEffect(() => {
    if (!rescheduleOpen || !selectedDate) return;
    let cancelled = false;
    setSlotsLoading(true);
    void getPublicServiceDaySlots(slug, booking.serviceId, selectedDate)
      .then((res) => {
        if (!cancelled) {
          const mapped = res.slots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            employeeId: slot.employeeId,
          }));
          setSlots(
            allowProviderChange
              ? mapped
              : mapped.filter((slot) => slot.employeeId === booking.employeeId),
          );
        }
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
  }, [rescheduleOpen, selectedDate, slug, booking.serviceId, booking.employeeId, allowProviderChange]);

  if (!showActions) {
    if (booking.policyMessage) {
      return <p className="text-xs text-gray-500 mt-2">{booking.policyMessage}</p>;
    }
    return null;
  }

  async function handleCancel() {
    if (!(await confirmDialog({ message: t('public.cancelBookingConfirm'), destructive: true }))) return;
    setBusy('cancel');
    setError(null);
    try {
      if (canActWithToken && manageToken) {
        await cancelPublicBookingWithToken(slug, booking.id, manageToken);
      } else if (canActWithAccount) {
        await cancelPublicCustomerBooking(slug, booking.id);
      } else {
        throw new Error(t('public.manageBookingSignInHint'));
      }
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('public.cancelBookingFailed'));
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
        ...(allowProviderChange && selectedEmployeeId
          ? { employeeId: selectedEmployeeId }
          : { employeeId: booking.employeeId }),
      };
      let previousStartTime = booking.startTime;
      if (canActWithToken && manageToken) {
        const result = await reschedulePublicBookingWithToken(slug, booking.id, manageToken, body);
        previousStartTime = result.previousStartTime;
        onRescheduled?.(previousStartTime, result.booking.startTime);
      } else if (canActWithAccount) {
        const result = await reschedulePublicCustomerBooking(slug, booking.id, body);
        previousStartTime = result.previousStartTime;
        onRescheduled?.(previousStartTime, result.booking.startTime);
      } else {
        throw new Error(t('public.manageBookingSignInHint'));
      }
      setRescheduleOpen(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('public.rescheduleBookingFailed'));
    } finally {
      setBusy(null);
    }
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

  return (
    <div className="mt-3 space-y-2">
      {booking.policyMessage && (
        <p className="text-xs text-gray-500">{booking.policyMessage}</p>
      )}
      {booking.rescheduleCount > 0 && (
        <p className="text-xs text-gray-500">
          {t('public.rescheduleCountHint', {
            count: booking.rescheduleCount,
            max: booking.maxReschedules,
          })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {booking.canReschedule && (
          <button
            type="button"
            onClick={() => {
              setRescheduleOpen((open) => !open);
              setSelectedDate('');
              setSelectedSlot(null);
              setSelectedEmployeeId(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <CalendarClock className="w-4 h-4" />
            {t('public.rescheduleBooking')}
          </button>
        )}
        {booking.canCancel && (
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
            {t('public.cancelBooking')}
          </button>
        )}
      </div>

      {rescheduleOpen && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
          <p className="text-sm font-medium text-gray-900">{t('public.pickNewTime')}</p>
          <DatePicker
            variant="light"
            accentColor={primary}
            className="w-full"
            value={selectedDate}
            onChange={(next) => {
              setSelectedDate(next);
              setSelectedSlot(null);
              setSelectedEmployeeId(null);
            }}
          />
          {slotsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('public.loadingSlots')}
            </div>
          ) : selectedDate && slots.length === 0 ? (
            <p className="text-sm text-gray-500">{t('public.noSlotsThisDay')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const start = new Date(slot.startTime);
                const selected = selectedSlot === slot.startTime;
                return (
                  <button
                    key={`${slot.startTime}-${slot.employeeId ?? 'any'}`}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot.startTime);
                      setSelectedEmployeeId(slot.employeeId ?? booking.employeeId);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                      selected
                        ? 'border-transparent text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                    style={selected ? { backgroundColor: primary } : undefined}
                  >
                    {formatScheduleTime(start)}
                  </button>
                );
              })}
            </div>
          )}
          {selectedSlot && (
            <p className="text-xs text-gray-600">
              {t('public.rescheduleSummary', {
                date: formatDateDisplay(new Date(selectedSlot), locale),
                time: formatScheduleTime(new Date(selectedSlot)),
              })}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleReschedule()}
            disabled={!selectedSlot || busy === 'reschedule'}
            className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: primary }}
          >
            {busy === 'reschedule' ? t('public.submitting') : t('public.confirmReschedule')}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
