export const TOUR_SERVICE_TYPE = 'tour' as const;

export type TourDifficulty = 'easy' | 'moderate' | 'challenging';

export interface TourServiceFields {
  serviceType?: typeof TOUR_SERVICE_TYPE;
  coverImage?: string;
  maxGroupSize?: number;
  difficulty?: TourDifficulty;
  meetingPoint?: string;
  includedItems?: string;
  durationDays?: number;
}

export interface PublicTourServiceFields {
  isTour?: boolean;
  tourDurationBadge?: string;
  coverImage?: string;
  maxGroupSize?: number;
  difficulty?: TourDifficulty;
  meetingPoint?: string;
  includedItems?: string;
  durationDays?: number;
  dayLevelBooking?: boolean;
  pricePerPerson?: boolean;
}

const DAY_LEVEL_MINUTES = 24 * 60;

export function isPublicTourService(
  service: PublicTourServiceFields,
): boolean {
  return service.isTour === true;
}

export function isDayLevelTourService(service: {
  durationMinutes: number;
  isTour?: boolean;
  durationDays?: number;
  dayLevelBooking?: boolean;
}): boolean {
  if (service.dayLevelBooking) return true;
  if (!service.isTour) return false;
  if (service.durationMinutes >= DAY_LEVEL_MINUTES) return true;
  return typeof service.durationDays === 'number' && service.durationDays >= 1;
}

export function formatTourDifficulty(
  difficulty: TourDifficulty | undefined,
  t: (key: string) => string,
): string | null {
  if (!difficulty) return null;
  const key = `tours.difficulty.${difficulty}`;
  const label = t(key);
  return label === key ? difficulty : label;
}

export function tourPriceLabel(
  price: string,
  service: PublicTourServiceFields,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  if (service.pricePerPerson) {
    return t('tours.pricePerPerson', { price });
  }
  return price;
}
