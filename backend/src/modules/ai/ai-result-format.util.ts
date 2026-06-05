import {
  formatDateDisplay,
  formatTimeRangeDisplay,
} from '../../common/utils/date-format.util.js';

export interface BookingSnapshot {
  employeeName?: string | null;
  serviceName?: string | null;
  customerName?: string | null;
  startTime?: Date | string;
  endTime?: Date | string;
}

export function toBookingSnapshot(booking: {
  employee?: { name?: string } | null;
  service?: { name?: string } | null;
  customer?: { name?: string } | null;
  startTime: Date;
  endTime: Date;
}): BookingSnapshot {
  return {
    employeeName: booking.employee?.name,
    serviceName: booking.service?.name,
    customerName: booking.customer?.name,
    startTime: booking.startTime,
    endTime: booking.endTime,
  };
}

export function formatBookingSnapshotLine(
  snapshot: BookingSnapshot,
  options?: { includeCustomer?: boolean },
): string {
  const provider = snapshot.employeeName ?? 'Unknown provider';
  const service = snapshot.serviceName;
  const start = snapshot.startTime;
  const end = snapshot.endTime;
  const when =
    start && end
      ? `${formatDateDisplay(start)} ${formatTimeRangeDisplay(start, end)}`
      : '';

  const labelParts: string[] = [];
  if (service) labelParts.push(service);
  labelParts.push(`with ${provider}`);
  if (options?.includeCustomer && snapshot.customerName) {
    labelParts.push(`(${snapshot.customerName})`);
  }

  const label = labelParts.join(' ');
  return when ? `${label} — ${when}` : label;
}

export function formatBookingCreatedLine(
  result: BookingSnapshot & { bookingId?: string },
): string {
  if (result.employeeName && result.startTime && result.endTime) {
    return `• Booking created: ${formatBookingSnapshotLine(result)}`;
  }
  return result.bookingId
    ? `• Booking created (${result.bookingId})`
    : '• Booking created';
}

export function appendBookingListLines(
  lines: string[],
  header: string,
  snapshots: BookingSnapshot[],
  maxList = 5,
): void {
  if (snapshots.length === 0) return;
  lines.push(`${header} (${snapshots.length}):`);
  for (const snap of snapshots.slice(0, maxList)) {
    lines.push(
      `  • ${formatBookingSnapshotLine(snap, { includeCustomer: true })}`,
    );
  }
  if (snapshots.length > maxList) {
    lines.push(`  • …and ${snapshots.length - maxList} more`);
  }
}

export function formatBlockScheduleLine(result: {
  employeeName?: string;
  label?: string;
  isRepetitive?: boolean;
  singleStartTime?: Date | string;
  singleEndTime?: Date | string;
}): string {
  const provider = result.employeeName ?? 'provider';
  const label = result.label ?? 'Blocked';
  if (result.singleStartTime && result.singleEndTime) {
    const when = `${formatDateDisplay(result.singleStartTime)} ${formatTimeRangeDisplay(
      result.singleStartTime,
      result.singleEndTime,
    )}`;
    return `• Block schedule created for ${provider}: ${label} — ${when}`;
  }
  const kind = result.isRepetitive ? 'recurring block' : 'block';
  return `• Block schedule created for ${provider}: ${label} (${kind})`;
}
