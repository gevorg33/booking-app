import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDaysToDateKey,
  buildInclusiveDateKeyRange,
  buildServiceDateEnabled,
  isoToDateKey,
  pickFirstBookableDateKey,
  SERVICE_BOOKABLE_DATE_MAX_RANGE,
  SERVICE_BOOKABLE_DATE_SCAN_DAYS,
  splitDateKeyRange,
} from '../lib/service-bookable-dates.util.js';
import { fetchPackageBookableDates } from '../services/public-api.js';

type Params = {
  slug: string | undefined;
  packageId: string | undefined;
  enabled: boolean;
  minDateKey: string;
};

export function usePackageBookableDates({ slug, packageId, enabled, minDateKey }: Params) {
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
    async (fromKey: string, toKey: string) => {
      if (!slug || !packageId || !enabled) return;
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
          const result = await fetchPackageBookableDates(
            slug,
            packageId,
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
        setVersion((current) => current + 1);
      } finally {
        setScanning(false);
      }
    },
    [enabled, packageId, slug],
  );

  useEffect(() => {
    reset();
    if (!enabled || !slug || !packageId) return;
    const startDateKey = minDateKey.slice(0, 10);
    const endDateKey = addDaysToDateKey(
      startDateKey,
      SERVICE_BOOKABLE_DATE_SCAN_DAYS - 1,
    );
    void scanDates(startDateKey, endDateKey);
  }, [enabled, minDateKey, packageId, reset, scanDates, slug]);

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
    scanDates,
  };
}
