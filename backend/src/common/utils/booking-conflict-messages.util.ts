import { formatTimeDisplay } from './date-format.util.js';

export function formatBookingOverlapConflict(opts?: {
  employeeName?: string;
  startTime?: Date | string;
  existingCustomerName?: string;
}): string {
  const name = opts?.employeeName?.trim();
  const time =
    opts?.startTime != null
      ? formatTimeDisplay(
          opts.startTime instanceof Date ? opts.startTime : new Date(opts.startTime),
        )
      : null;
  const customer = opts?.existingCustomerName?.trim();

  if (name && time) {
    const who = customer ? ` with ${customer}` : '';
    return `${name} already has an appointment at ${time}${who}. Pick another time or provider.`;
  }
  if (name) {
    return `${name} is already booked at that time. Pick another slot or provider.`;
  }
  return 'That time is already booked. Pick another slot or provider.';
}

export function formatBookingWindowFullyBooked(employeeName?: string): string {
  const name = employeeName?.trim();
  if (name) {
    return `All slots in that window are full for ${name}. Try a different time or provider.`;
  }
  return 'All slots in that window are already booked. Try a different time or provider.';
}
