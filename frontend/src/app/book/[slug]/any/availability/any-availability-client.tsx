'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import { BookingServiceCalendar } from '@/components/public-booking/booking-service-calendar';
import { BookingTimeSlotGrid } from '@/components/public-booking/booking-time-slot-grid';
import {
  getPublicServiceDaySlots,
  type PublicBusinessProfile,
  type PublicService,
  type PublicServiceDaySlot,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { getTodayDateKey } from '@/lib/date-format';
import { useServiceBookableDates } from '@/hooks/use-service-bookable-dates';
import { useI18n } from '@/i18n';

interface AnyAvailabilityClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  service: PublicService;
  backHref: string;
  clinicOrderToken?: string;
}

export function AnyAvailabilityClient({
  slug,
  tenant,
  service,
  backHref,
  clinicOrderToken,
}: AnyAvailabilityClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const tz = tenant.timezone || 'UTC';
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const minDateKey = getTodayDateKey(tz);

  const { bookableDates, firstBookableDateKey, scanning: bookableDatesScanning, isDateEnabled, scanDates } =
    useServiceBookableDates({
      slug,
      serviceId: service.id,
      enabled: true,
      minDateKey,
    });

  const [selectedDateKey, setSelectedDateKey] = useState(minDateKey);
  const [slots, setSlots] = useState<PublicServiceDaySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);

  useEffect(() => {
    if (bookableDatesScanning) return;
    if (bookableDates.has(selectedDateKey)) return;
    if (firstBookableDateKey && firstBookableDateKey !== selectedDateKey) {
      setSelectedDateKey(firstBookableDateKey);
      setSelectedStartTime(null);
    }
  }, [bookableDates, bookableDatesScanning, firstBookableDateKey, selectedDateKey]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      setLoadingSlots(true);
      setSlotError(null);
      setSelectedStartTime(null);
    });

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
    if (clinicOrderToken) {
      q.set('clinicOrderToken', clinicOrderToken);
    }
    return `${bookPath(slug, '/checkout')}?${q.toString()}`;
  }, [slug, service.id, selectedStartTime, clinicOrderToken]);

  const onContinue = useCallback(() => {
    if (checkoutHref) router.push(checkoutHref);
  }, [router, checkoutHref]);

  const onSelectDateKey = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
    setSelectedStartTime(null);
  }, []);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('public.selectDateTime')}</h1>
        <p className="text-sm text-gray-500 mb-5">{service.name}</p>

        <BookingServiceCalendar
          selectedDateKey={selectedDateKey}
          onSelectDateKey={onSelectDateKey}
          primaryColor={primary}
          minDateKey={minDateKey}
          timeZone={tz}
          isDateEnabled={isDateEnabled}
          scanning={bookableDatesScanning}
          scanDates={scanDates}
        />

        <div className="mt-6">
          <BookingTimeSlotGrid
            slots={slots}
            selectedStartTime={selectedStartTime}
            onSelectStartTime={setSelectedStartTime}
            primaryColor={primary}
            loading={loadingSlots}
            error={slotError}
            emptyLabel={t('public.noSlotsThisDay')}
            heading={t('public.availableSlots')}
          />
        </div>
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
