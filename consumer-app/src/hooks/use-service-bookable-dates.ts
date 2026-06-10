import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDateKeyRange,
  buildServiceDateEnabled,
  dayHasBookableSlots,
  isoToDateKey,
  mapWithConcurrency,
  pickFirstBookableDateKey,
  SERVICE_BOOKABLE_DATE_SCAN_DAYS,
} from '../lib/service-bookable-dates.util.js';
import { fetchServiceSlots } from '../services/public-api.js';

type Params = {
  slug: string | undefined;
  serviceId: string | undefined;
  enabled: boolean;
  isDayLevelTour: boolean;
  minDateKey: string;
};

export function useServiceBookableDates({
  slug,
  serviceId,
  enabled,
  isDayLevelTour,
  minDateKey,
}: Params) {
  const bookableDatesRef = useRef<Set<string>>(new Set());
  const scannedDatesRef = useRef<Set<string>>(new Set());
  const [version, setVersion] = useState(0);
  const [scanning, setScanning] = useState(false);

  const reset = useCallback(() => {
    bookableDatesRef.current = new Set();
    scannedDatesRef.current = new Set();
    setVersion((current) => current + 1);
  }, []);

  const scanDates = useCallback(
    async (dateKeys: string[]) => {
      if (!slug || !serviceId || !enabled) return;
      const pending = dateKeys.filter((dateKey) => !scannedDatesRef.current.has(dateKey));
      if (pending.length === 0) return;

      setScanning(true);
      try {
        await mapWithConcurrency(pending, 4, async (dateKey) => {
          try {
            const daySlots = await fetchServiceSlots(slug, serviceId, dateKey);
            scannedDatesRef.current.add(dateKey);
            if (dayHasBookableSlots(daySlots, isDayLevelTour)) {
              bookableDatesRef.current.add(dateKey);
            }
          } catch {
            scannedDatesRef.current.add(dateKey);
          }
        });
        setVersion((current) => current + 1);
      } finally {
        setScanning(false);
      }
    },
    [enabled, isDayLevelTour, serviceId, slug],
  );

  useEffect(() => {
    reset();
    if (!enabled || !slug || !serviceId) return;
    const startDateKey = minDateKey.slice(0, 10);
    void scanDates(buildDateKeyRange(startDateKey, SERVICE_BOOKABLE_DATE_SCAN_DAYS));
  }, [enabled, minDateKey, reset, scanDates, serviceId, slug]);

  const bookableDates = useMemo(() => new Set(bookableDatesRef.current), [version]);
  const scannedDates = useMemo(() => new Set(scannedDatesRef.current), [version]);

  const isDateEnabled = useMemo(
    () =>
      buildServiceDateEnabled({
        bookableDates,
        scannedDates,
        minDateKey,
      }),
    [bookableDates, minDateKey, scannedDates],
  );

  const firstBookableDateKey = useMemo(
    () => pickFirstBookableDateKey(bookableDates, minDateKey),
    [bookableDates, minDateKey],
  );

  return {
    bookableDates,
    scannedDates,
    scanning,
    isDateEnabled,
    firstBookableDateKey,
    isoToDateKey,
  };
}
