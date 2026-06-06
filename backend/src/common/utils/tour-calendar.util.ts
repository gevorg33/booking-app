import { extractTourBookingMetadata } from './tour-service.util.js';

/** Inclusive YYYY-MM-DD range overlap (lexicographic dates are safe). */
export function dateKeysOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export function resolveTourBookingDateRange(input: {
  metadata?: Record<string, unknown> | null;
  startTime: Date;
}): { tourStartDate: string; tourEndDate: string } | null {
  const tour = extractTourBookingMetadata(input.metadata);
  if (tour.tourStartDate) {
    return {
      tourStartDate: tour.tourStartDate,
      tourEndDate: tour.tourEndDate ?? tour.tourStartDate,
    };
  }
  return null;
}

export function tourBookingOverlapsDateRange(
  input: {
    metadata?: Record<string, unknown> | null;
    startTime: Date;
  },
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const tourRange = resolveTourBookingDateRange(input);
  if (tourRange) {
    return dateKeysOverlap(
      tourRange.tourStartDate,
      tourRange.tourEndDate,
      rangeStart,
      rangeEnd,
    );
  }
  const dayKey = input.startTime.toISOString().slice(0, 10);
  return dayKey >= rangeStart && dayKey <= rangeEnd;
}
