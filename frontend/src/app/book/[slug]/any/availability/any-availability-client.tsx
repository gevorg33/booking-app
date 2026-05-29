'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  getPublicServiceDaySlots,
  type PublicBusinessProfile,
  type PublicService,
  type PublicServiceDaySlot,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import {
  addCalendarDays,
  formatScheduleTime,
  getTodayDateKey,
  parseDateKey,
  toDateKey,
  todayDateAnchor,
} from '@/lib/date-format';
import { useI18n } from '@/i18n';

interface AnyAvailabilityClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  service: PublicService;
  backHref: string;
}

const SCAN_DAYS = 14;

export function AnyAvailabilityClient({ slug, tenant, service, backHref }: AnyAvailabilityClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const tz = tenant.timezone || 'UTC';
  const primary = tenant.branding.primaryColor || '#7c3aed';

  const dayOptions = useMemo(() => {
    const anchor = todayDateAnchor(tz);
    return Array.from({ length: SCAN_DAYS }, (_, i) => {
      const date = addCalendarDays(anchor, i, tz);
      const dateKey = toDateKey(date, tz);
      const parsed = parseDateKey(dateKey);
      const weekday = parsed
        ? parsed.toLocaleDateString(undefined, { weekday: 'short', timeZone: tz })
        : '';
      const dayNum = parsed
        ? parsed.toLocaleDateString(undefined, { day: 'numeric', timeZone: tz })
        : '';
      const month = parsed
        ? parsed.toLocaleDateString(undefined, { month: 'short', timeZone: tz })
        : '';
      const isToday = dateKey === getTodayDateKey(tz);
      return { dateKey, weekday, dayNum, month, isToday };
    });
  }, [tz]);

  const [selectedDateKey, setSelectedDateKey] = useState(dayOptions[0]?.dateKey ?? getTodayDateKey(tz));
  const [slots, setSlots] = useState<PublicServiceDaySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setSlotError(null);
    setSelectedStartTime(null);

    getPublicServiceDaySlots(slug, service.id, selectedDateKey)
      .then((res) => {
        if (!cancelled) setSlots(res.slots);
      })
      .catch((err) => {
        if (!cancelled) {
          setSlots([]);
          setSlotError(err instanceof Error ? err.message : t('public.bookingFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, service.id, selectedDateKey, t]);

  const checkoutHref = useMemo(() => {
    if (!selectedStartTime) return null;
    const q = new URLSearchParams({
      serviceId: service.id,
      startTime: selectedStartTime,
      autoAssign: '1',
    });
    return `${bookPath(slug, '/checkout')}?${q.toString()}`;
  }, [slug, service.id, selectedStartTime]);

  const onContinue = useCallback(() => {
    if (checkoutHref) router.push(checkoutHref);
  }, [router, checkoutHref]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('public.selectDateTime')}</h1>
        <p className="text-sm text-gray-500 mb-5">{service.name}</p>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {dayOptions.map((day) => {
            const active = selectedDateKey === day.dateKey;
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateKey(day.dateKey)}
                className={`shrink-0 w-[4.5rem] py-3 rounded-2xl border text-center transition-colors ${
                  active ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200'
                }`}
                style={active ? { backgroundColor: primary } : undefined}
              >
                <span className="block text-xs font-medium opacity-90">
                  {day.isToday ? t('public.today') : day.weekday}
                </span>
                <span className="block text-lg font-bold leading-tight">{day.dayNum}</span>
                <span className="block text-xs opacity-80">{day.month}</span>
              </button>
            );
          })}
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3">{t('public.availableSlots')}</h2>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : slotError ? (
            <p className="text-sm text-red-600 py-4">{slotError}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">{t('public.noSlotsThisDay')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const active = selectedStartTime === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setSelectedStartTime(slot.startTime)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      active ? 'text-white border-transparent' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                    style={active ? { backgroundColor: primary } : undefined}
                  >
                    {formatScheduleTime(slot.startTime)}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <FixedActionBar
        primaryColor={primary}
        disabled={!selectedStartTime}
        label={t('public.bookAppointment')}
        onClick={onContinue}
      />
    </>
  );
}
