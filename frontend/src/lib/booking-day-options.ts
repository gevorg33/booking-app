import {
  addCalendarDays,
  getTodayDateKey,
  todayDateAnchor,
  toDateKey,
} from '@/lib/calendar-date.util';
import { formatDateKeyStripParts } from '@/lib/locale-date-format';
import type { BookingDayOption } from '@/components/public-booking/booking-day-strip';
import type { AppLocale } from '@/i18n/types';

export const BOOKING_DAY_SCAN_DAYS = 14;

export function buildBookingDayOptions(
  timeZone: string,
  scanDays = BOOKING_DAY_SCAN_DAYS,
  locale?: AppLocale,
): BookingDayOption[] {
  const anchor = todayDateAnchor(timeZone);
  return Array.from({ length: scanDays }, (_, index) => {
    const date = addCalendarDays(anchor, index, timeZone);
    const dateKey = toDateKey(date, timeZone);
    const parts = formatDateKeyStripParts(dateKey, locale, timeZone);
    const isToday = dateKey === getTodayDateKey(timeZone);
    return { dateKey, ...parts, isToday };
  });
}
