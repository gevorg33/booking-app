import { formatScheduleTime } from './date-format.js';
import type { PublicService } from './types.js';
import { isDayLevelTourService, isPublicTourService } from './tour-service.util.js';

export function resolveTourMaxPax(service: Pick<PublicService, 'maxGroupSize'>): number {
  return service.maxGroupSize && service.maxGroupSize > 0 ? service.maxGroupSize : 99;
}

export function clampTourPaxCount(
  paxCount: number | undefined,
  maxGroupSize?: number,
): number {
  const normalized = Math.max(1, Math.floor(paxCount ?? 1));
  if (maxGroupSize && maxGroupSize > 0) {
    return Math.min(normalized, maxGroupSize);
  }
  return normalized;
}

export function multiplyTourPrice(
  unitPrice: number,
  paxCount: number,
  isTour: boolean,
): number {
  if (!isTour) return unitPrice;
  return Math.round(unitPrice * clampTourPaxCount(paxCount) * 100) / 100;
}

export function resolveTourFallbackSubtotal(
  service: Pick<PublicService, 'price' | 'isTour' | 'maxGroupSize'>,
  paxCount: number,
): number {
  return multiplyTourPrice(service.price, paxCount, isPublicTourService(service));
}

export function formatTourLineTotalCopy(
  copy: {
    tourLineTotal: string;
    tourPerPersonSuffix: string;
  },
  options: {
    unitLabel: string;
    paxCount: number;
    totalLabel: string;
    pricePerPerson: boolean;
  },
): string {
  const line =
    options.paxCount > 1
      ? copy.tourLineTotal
          .replace('{unit}', options.unitLabel)
          .replace('{count}', String(options.paxCount))
          .replace('{total}', options.totalLabel)
      : options.unitLabel;
  return options.pricePerPerson ? `${line} ${copy.tourPerPersonSuffix}` : line;
}

export function formatTourSlotLabel(
  startTime: string,
  service: Pick<
    PublicService,
    'durationMinutes' | 'isTour' | 'durationDays' | 'dayLevelBooking'
  >,
  locale: string,
): string {
  if (!isDayLevelTourService(service)) {
    return formatScheduleTime(startTime, locale);
  }
  return new Date(startTime).toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRemainingTourSpots(
  copy: { tourRemainingSpots: string },
  remainingSpots: number | null | undefined,
): string | null {
  if (remainingSpots == null) return null;
  return copy.tourRemainingSpots.replace('{count}', String(remainingSpots));
}
