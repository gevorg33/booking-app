import { formatDateDisplay, formatTimeDisplay } from './date-format';
import type { ProviderAiScreenContext } from '../components/ProviderAiAssistant';
import type { BookingSummary } from './booking-types';

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
    customerName: booking.customer?.name ?? null,
    serviceName: booking.service?.name ?? null,
    date: formatDateDisplay(booking.startTime),
    timeSlot: formatTimeDisplay(booking.startTime),
  };
}
