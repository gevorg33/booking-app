import { formatBookingDateTimeRange } from '@/lib/date-format';

/** e2e-bug.59 — never reuse start as end when a real end is present. */
export function formatPublicReviewAppointmentRange(
  appointmentDate: string,
  appointmentEndDate: string | undefined,
  locale?: string,
): string {
  const start = appointmentDate;
  const end =
    typeof appointmentEndDate === 'string' && appointmentEndDate.trim()
      ? appointmentEndDate
      : appointmentDate;
  return formatBookingDateTimeRange(start, end, locale);
}
