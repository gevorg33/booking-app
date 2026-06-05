import {
  readBusinessDateFormatSettings,
  type BusinessDateFormat,
  type BusinessTimeFormat,
} from './business-date-format.util.js';
import {
  formatDateDisplay,
  formatTimeRangeDisplay,
  type DateDisplayOptions,
} from './date-format.util.js';

export function notificationDateDisplayOptions(
  settings?: Record<string, unknown> | null,
): DateDisplayOptions {
  return readBusinessDateFormatSettings(settings ?? undefined);
}

/** Booking confirmation / reminder / cancellation email & SMS date label. */
export function formatNotificationDateDisplay(
  input: Date | string,
  settings?: Record<string, unknown> | null,
  locale?: string,
): string {
  return formatDateDisplay(
    input,
    locale,
    notificationDateDisplayOptions(settings),
  );
}

/** Booking confirmation / reminder / WhatsApp time range label. */
export function formatNotificationTimeRangeDisplay(
  start: Date | string,
  end: Date | string,
  settings?: Record<string, unknown> | null,
  locale?: string,
): string {
  return formatTimeRangeDisplay(
    start,
    end,
    locale,
    notificationDateDisplayOptions(settings),
  );
}

/** Gift card expiry and other notification-only date lines. */
export function formatNotificationExpiresLabel(
  input: Date | string,
  settings?: Record<string, unknown> | null,
  locale?: string,
): string {
  return formatNotificationDateDisplay(input, settings, locale);
}

/**
 * Clinic result-ready notifications (vert-clinic-1.x) — same business format rules.
 * Use when patient test result emails/WhatsApp messages ship.
 */
export function formatResultReadyNotificationWhen(
  completedAt: Date | string,
  settings?: Record<string, unknown> | null,
  locale?: string,
): string {
  return formatNotificationDateDisplay(completedAt, settings, locale);
}

export function readNotificationDateFormatSettings(
  settings?: Record<string, unknown> | null,
): { dateFormat: BusinessDateFormat; timeFormat: BusinessTimeFormat } {
  return readBusinessDateFormatSettings(settings ?? undefined);
}
