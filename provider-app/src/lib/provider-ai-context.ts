import { formatDateDisplay, formatTimeDisplay } from './date-format';
import type { BookingSummary } from './booking-types';

export interface ProviderAiScreenContext {
  route?: string;
  bookingId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  date?: string | null;
  timeSlot?: string | null;
}

export function buildProviderAiScreenContext(
  route: string,
  base: ProviderAiScreenContext = {},
  bookings: BookingSummary[] = [],
  selectedId: string | null = null,
): ProviderAiScreenContext {
  const ctx: ProviderAiScreenContext = { route, ...base };
  if (!selectedId) return ctx;

  const booking = bookings.find((b) => b.id === selectedId);
  if (!booking) return ctx;

  return {
    ...ctx,
    bookingId: booking.id,
    customerName: booking.customer?.name ?? null,
    serviceName: booking.service?.name ?? null,
    employeeId: booking.employee?.id ?? null,
    employeeName: booking.employee?.name ?? null,
    date: formatDateDisplay(booking.startTime),
    timeSlot: formatTimeDisplay(booking.startTime),
  };
}
