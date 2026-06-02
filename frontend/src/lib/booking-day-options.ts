import {
  addCalendarDays,
  getTodayDateKey,
  parseDateKey,
  todayDateAnchor,
  toDateKey,
} from '@/lib/date-format';
import type { BookingDayOption } from '@/components/public-booking/booking-day-strip';

export const BOOKING_DAY_SCAN_DAYS = 14;

export function buildBookingDayOptions(timeZone: string, scanDays = BOOKING_DAY_SCAN_DAYS): BookingDayOption[] {
  const anchor = todayDateAnchor(timeZone);
  return Array.from({ length: scanDays }, (_, index) => {
    const date = addCalendarDays(anchor, index, timeZone);
    const dateKey = toDateKey(date, timeZone);
    const parsed = parseDateKey(dateKey);
    const weekday = parsed
      ? parsed.toLocaleDateString(undefined, { weekday: 'short', timeZone })
      : '';
    const dayNum = parsed
      ? parsed.toLocaleDateString(undefined, { day: 'numeric', timeZone })
      : '';
    const month = parsed
      ? parsed.toLocaleDateString(undefined, { month: 'short', timeZone })
      : '';
    const isToday = dateKey === getTodayDateKey(timeZone);
    return { dateKey, weekday, dayNum, month, isToday };
  });
}
