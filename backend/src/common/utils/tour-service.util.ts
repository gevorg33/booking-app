export const TOUR_SERVICE_TYPE = 'tour' as const;

export type TourDifficulty = 'easy' | 'moderate' | 'challenging';

export const TOUR_DIFFICULTIES: TourDifficulty[] = [
  'easy',
  'moderate',
  'challenging',
];

export interface TourServiceMetadata {
  serviceType: typeof TOUR_SERVICE_TYPE;
  coverImage?: string;
  maxGroupSize?: number;
  difficulty?: TourDifficulty;
  meetingPoint?: string;
  includedItems?: string;
  durationDays?: number;
}

export interface TourBookingMetadata {
  paxCount?: number;
  tourStartDate?: string;
  tourEndDate?: string;
  specialRequirements?: string;
}

const DAY_LEVEL_MINUTES = 24 * 60;

export function isTourDifficulty(value: unknown): value is TourDifficulty {
  return (
    typeof value === 'string' && (TOUR_DIFFICULTIES as string[]).includes(value)
  );
}

export function extractTourMetadata(
  metadata: Record<string, unknown> | null | undefined,
): TourServiceMetadata | null {
  if (!metadata || metadata.serviceType !== TOUR_SERVICE_TYPE) return null;
  const tour: TourServiceMetadata = { serviceType: TOUR_SERVICE_TYPE };
  if (typeof metadata.coverImage === 'string' && metadata.coverImage.trim()) {
    tour.coverImage = metadata.coverImage.trim();
  }
  if (
    typeof metadata.maxGroupSize === 'number' &&
    Number.isFinite(metadata.maxGroupSize) &&
    metadata.maxGroupSize > 0
  ) {
    tour.maxGroupSize = Math.floor(metadata.maxGroupSize);
  }
  if (isTourDifficulty(metadata.difficulty)) {
    tour.difficulty = metadata.difficulty;
  }
  if (
    typeof metadata.meetingPoint === 'string' &&
    metadata.meetingPoint.trim()
  ) {
    tour.meetingPoint = metadata.meetingPoint.trim();
  }
  if (
    typeof metadata.includedItems === 'string' &&
    metadata.includedItems.trim()
  ) {
    tour.includedItems = metadata.includedItems.trim();
  }
  if (
    typeof metadata.durationDays === 'number' &&
    Number.isFinite(metadata.durationDays) &&
    metadata.durationDays > 0
  ) {
    tour.durationDays = Math.floor(metadata.durationDays);
  }
  return tour;
}

export function isTourService(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return extractTourMetadata(metadata) !== null;
}

/** Genre / filler tokens ignored when fuzzy-matching short tour nicknames. */
const TOUR_NAME_MATCH_STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'for',
  'and',
  'tour',
  'tours',
  'trek',
  'treks',
  'hike',
  'hikes',
  'drive',
  'drives',
  'excursion',
  'excursions',
  'day',
  'days',
  'private',
  'full',
]);

/**
 * Resolve a visitor's tour nickname (e.g. "wine tour", "mountain trek") to a
 * catalog row. Exact / substring first; then strip genre words and score token
 * overlap so "wine tour" matches "Private Wine Country Day" (e2e-bug.105).
 */
export function resolveTourCatalogServiceByName<
  T extends { id: string; name: string },
>(list: readonly T[], name: string): T | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle || list.length === 0) return undefined;

  const exact = list.find((item) => item.name.toLowerCase() === needle);
  if (exact) return exact;

  const includes = list.find((item) =>
    item.name.toLowerCase().includes(needle),
  );
  if (includes) return includes;

  const reverse = list.find((item) =>
    needle.includes(item.name.toLowerCase()),
  );
  if (reverse) return reverse;

  const stripped = needle
    .replace(/\b(?:tours?|treks?|hikes?|drives?|excursions?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped && stripped !== needle) {
    const viaStrip = list.find((item) =>
      item.name.toLowerCase().includes(stripped),
    );
    if (viaStrip) return viaStrip;
  }

  const tokens = (stripped || needle)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.toLowerCase())
    .filter(
      (token) => token.length >= 3 && !TOUR_NAME_MATCH_STOPWORDS.has(token),
    );
  if (tokens.length === 0) return undefined;

  let best: T | undefined;
  let bestScore = 0;
  let tied = false;
  for (const item of list) {
    const hay = item.name.toLowerCase();
    const score = tokens.filter((token) => hay.includes(token)).length;
    if (score > bestScore) {
      best = item;
      bestScore = score;
      tied = false;
    } else if (score === bestScore && score > 0 && best && best.id !== item.id) {
      tied = true;
    }
  }

  const minScore = Math.max(1, Math.ceil(tokens.length * 0.5));
  if (!best || tied || bestScore < minScore) return undefined;
  return best;
}

export function resolveTourDurationDays(service: {
  durationMinutes: number;
  metadata?: Record<string, unknown> | null;
}): number {
  const tour = extractTourMetadata(service.metadata);
  if (tour?.durationDays && tour.durationDays > 0) return tour.durationDays;
  return Math.max(1, Math.ceil(service.durationMinutes / DAY_LEVEL_MINUTES));
}

export function isDayLevelTour(service: {
  durationMinutes: number;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (!isTourService(service.metadata)) return false;
  if (service.durationMinutes >= DAY_LEVEL_MINUTES) return true;
  const days = extractTourMetadata(service.metadata)?.durationDays;
  return typeof days === 'number' && days >= 1;
}

export function applyTourMetadataToServiceMetadata(
  existing: Record<string, unknown> | null | undefined,
  tour: Partial<Omit<TourServiceMetadata, 'serviceType'>> & {
    serviceType?: typeof TOUR_SERVICE_TYPE | null;
  },
): Record<string, unknown> {
  const base = { ...(existing ?? {}) };
  if (tour.serviceType === null) {
    delete base.serviceType;
    delete base.coverImage;
    delete base.maxGroupSize;
    delete base.difficulty;
    delete base.meetingPoint;
    delete base.includedItems;
    delete base.durationDays;
    return base;
  }
  if (tour.serviceType === TOUR_SERVICE_TYPE) {
    base.serviceType = TOUR_SERVICE_TYPE;
  }
  if (tour.coverImage !== undefined) {
    if (tour.coverImage) base.coverImage = tour.coverImage;
    else delete base.coverImage;
  }
  if (tour.maxGroupSize !== undefined) {
    if (tour.maxGroupSize && tour.maxGroupSize > 0) {
      base.maxGroupSize = Math.floor(tour.maxGroupSize);
    } else {
      delete base.maxGroupSize;
    }
  }
  if (tour.difficulty !== undefined) {
    if (tour.difficulty && isTourDifficulty(tour.difficulty)) {
      base.difficulty = tour.difficulty;
    } else {
      delete base.difficulty;
    }
  }
  if (tour.meetingPoint !== undefined) {
    if (tour.meetingPoint) base.meetingPoint = tour.meetingPoint;
    else delete base.meetingPoint;
  }
  if (tour.includedItems !== undefined) {
    if (tour.includedItems) base.includedItems = tour.includedItems;
    else delete base.includedItems;
  }
  if (tour.durationDays !== undefined) {
    if (tour.durationDays && tour.durationDays > 0) {
      base.durationDays = Math.floor(tour.durationDays);
    } else {
      delete base.durationDays;
    }
  }
  return base;
}

export function buildTourServiceMetadataFromDraft(draft: {
  serviceType?: string;
  coverImage?: string;
  maxGroupSize?: number;
  difficulty?: string;
  meetingPoint?: string;
  includedItems?: string;
  durationDays?: number;
}): Record<string, unknown> | undefined {
  if (draft.serviceType !== TOUR_SERVICE_TYPE) return undefined;
  return applyTourMetadataToServiceMetadata(
    {},
    {
      serviceType: TOUR_SERVICE_TYPE,
      coverImage: draft.coverImage,
      maxGroupSize: draft.maxGroupSize,
      difficulty: isTourDifficulty(draft.difficulty)
        ? draft.difficulty
        : undefined,
      meetingPoint: draft.meetingPoint,
      includedItems: draft.includedItems,
      durationDays: draft.durationDays,
    },
  );
}

export function formatTourDurationBadge(service: {
  durationMinutes: number;
  metadata?: Record<string, unknown> | null;
}): string {
  const days = resolveTourDurationDays(service);
  if (days >= 2) return `${days} days`;
  if (service.durationMinutes >= DAY_LEVEL_MINUTES) return '1 day';
  const hours = Math.round(service.durationMinutes / 60);
  return hours >= 1 ? `${hours}h` : `${service.durationMinutes} min`;
}

export function buildTourBookingMetadata(input: {
  paxCount: number;
  startTime: Date;
  durationMinutes: number;
  durationDays?: number;
  specialRequirements?: string;
}): TourBookingMetadata {
  const days =
    input.durationDays && input.durationDays > 0
      ? input.durationDays
      : Math.max(1, Math.ceil(input.durationMinutes / DAY_LEVEL_MINUTES));
  const tourStartDate = input.startTime.toISOString().slice(0, 10);
  const end = new Date(input.startTime);
  end.setUTCDate(end.getUTCDate() + days - 1);
  const tourEndDate = end.toISOString().slice(0, 10);
  const meta: TourBookingMetadata = {
    paxCount: input.paxCount,
    tourStartDate,
    tourEndDate,
  };
  if (input.specialRequirements?.trim()) {
    meta.specialRequirements = input.specialRequirements.trim();
  }
  return meta;
}

export function extractTourBookingMetadata(
  metadata: Record<string, unknown> | null | undefined,
): TourBookingMetadata {
  const result: TourBookingMetadata = {};
  if (
    typeof metadata?.paxCount === 'number' &&
    Number.isFinite(metadata.paxCount) &&
    metadata.paxCount > 0
  ) {
    result.paxCount = Math.floor(metadata.paxCount);
  }
  if (typeof metadata?.tourStartDate === 'string') {
    result.tourStartDate = metadata.tourStartDate;
  }
  if (typeof metadata?.tourEndDate === 'string') {
    result.tourEndDate = metadata.tourEndDate;
  }
  if (typeof metadata?.specialRequirements === 'string') {
    result.specialRequirements = metadata.specialRequirements;
  }
  return result;
}

export function sumBookedTourPax(
  bookings: Array<{ metadata?: Record<string, unknown> | null }>,
): number {
  return bookings.reduce((sum, booking) => {
    const pax = extractTourBookingMetadata(booking.metadata).paxCount ?? 1;
    return sum + pax;
  }, 0);
}

export function resolveRemainingTourSpots(
  maxGroupSize: number | undefined,
  bookedPax: number,
): number | null {
  if (!maxGroupSize || maxGroupSize <= 0) return null;
  return Math.max(0, maxGroupSize - bookedPax);
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
