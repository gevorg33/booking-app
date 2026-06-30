'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDaysToDateKey,
  buildInclusiveDateKeyRange,
  buildServiceDateEnabled,
  pickFirstBookableDateKey,
  SERVICE_BOOKABLE_DATE_MAX_RANGE,
  SERVICE_BOOKABLE_DATE_SCAN_DAYS,
  splitDateKeyRange,
} from '@/lib/service-bookable-dates.util';
import { getPublicServiceBookableDates } from '@/lib/public-api';

type Params = {
  slug: string | undefined;
  serviceId: string | undefined;
  enabled: boolean;
  minDateKey: string;
};

export function useServiceBookableDates({
  slug,
  serviceId,
  enabled,
  minDateKey,
}: Params) {
  const bookableDatesRef = useRef<Set<string>>(new Set());
  const scannedDatesRef = useRef<Set<string>>(new Set());
  const [bookableDates, setBookableDates] = useState<Set<string>>(() => new Set());
  const [scannedDates, setScannedDates] = useState<Set<string>>(() => new Set());
  const [scanning, setScanning] = useState(false);

  const syncSnapshot = useCallback(() => {
    setBookableDates(new Set(bookableDatesRef.current));
    setScannedDates(new Set(scannedDatesRef.current));
  }, []);

  const reset = useCallback(() => {
    bookableDatesRef.current = new Set();
    scannedDatesRef.current = new Set();
    syncSnapshot();
  }, [syncSnapshot]);

  const scanDates = useCallback(
    async (fromKey: string, toKey: string) => {
      if (!slug || !serviceId || !enabled) return;
      const pending = buildInclusiveDateKeyRange(fromKey, toKey).filter(
        (dateKey) => !scannedDatesRef.current.has(dateKey),
      );
      if (pending.length === 0) return;

      const pendingFrom = pending[0]!;
      const pendingTo = pending[pending.length - 1]!;

      setScanning(true);
      try {
        const chunks = splitDateKeyRange(
          pendingFrom,
          pendingTo,
          SERVICE_BOOKABLE_DATE_MAX_RANGE,
        );
        for (const chunk of chunks) {
          const result = await getPublicServiceBookableDates(
            slug,
            serviceId,
            chunk.from,
            chunk.to,
          );
          const bookable = new Set(result.dates);
          for (const dateKey of buildInclusiveDateKeyRange(chunk.from, chunk.to)) {
            scannedDatesRef.current.add(dateKey);
            if (bookable.has(dateKey)) {
              bookableDatesRef.current.add(dateKey);
            }
          }
        }
        syncSnapshot();
      } finally {
        setScanning(false);
      }
    },
    [enabled, serviceId, slug, syncSnapshot],
  );

  useEffect(() => {
    queueMicrotask(() => {
      reset();
    });
    if (!enabled || !slug || !serviceId) return;
    const startDateKey = minDateKey.slice(0, 10);
    const endDateKey = addDaysToDateKey(
      startDateKey,
      SERVICE_BOOKABLE_DATE_SCAN_DAYS - 1,
    );
    void scanDates(startDateKey, endDateKey);
  }, [enabled, minDateKey, reset, scanDates, serviceId, slug]);

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
    scanDates,
  };
}
