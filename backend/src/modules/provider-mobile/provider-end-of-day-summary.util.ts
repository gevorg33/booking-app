import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import type { ProviderPushType } from './provider-push-payload.util.js';

export interface EodBookingRow {
  businessId: string;
  employeeId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}

export interface EodEmployeeSummary {
  businessId: string;
  employeeId: string;
  appointmentCount: number;
  unpaidCount: number;
  gapsTomorrow: number;
}

export function aggregateEodSummaries(
  bookings: EodBookingRow[],
  gapsTomorrowByEmployee: Map<string, number>,
): EodEmployeeSummary[] {
  const byKey = new Map<string, EodEmployeeSummary>();

  for (const booking of bookings) {
    const key = `${booking.businessId}:${booking.employeeId}`;
    const existing = byKey.get(key) ?? {
      businessId: booking.businessId,
      employeeId: booking.employeeId,
      appointmentCount: 0,
      unpaidCount: 0,
      gapsTomorrow: gapsTomorrowByEmployee.get(booking.employeeId) ?? 0,
    };
    existing.appointmentCount += 1;
    if (
      (booking.status === BookingStatus.COMPLETED ||
        booking.status === BookingStatus.IN_PROGRESS) &&
      booking.paymentStatus === PaymentStatus.PENDING
    ) {
      existing.unpaidCount += 1;
    }
    byKey.set(key, existing);
  }

  for (const [employeeId, gaps] of gapsTomorrowByEmployee) {
    const match = [...byKey.values()].find((s) => s.employeeId === employeeId);
    if (match) match.gapsTomorrow = gaps;
  }

  return [...byKey.values()];
}

export function formatEodPushBody(summary: EodEmployeeSummary): string {
  const parts = [
    `${summary.appointmentCount} appointment${summary.appointmentCount === 1 ? '' : 's'}`,
  ];
  if (summary.unpaidCount > 0) {
    parts.push(`${summary.unpaidCount} unpaid`);
  }
  if (summary.gapsTomorrow > 0) {
    parts.push(
      `${summary.gapsTomorrow} gap${summary.gapsTomorrow === 1 ? '' : 's'} tomorrow`,
    );
  }
  return parts.join(', ');
}

export function buildEodPushPayload(summary: EodEmployeeSummary): {
  title: string;
  body: string;
  url: string;
  pushType: ProviderPushType;
  aiPrompt: string;
} {
  const body = formatEodPushBody(summary);
  return {
    title: "Today's summary",
    body,
    url: '/provider/today',
    pushType: 'end_of_day',
    aiPrompt: "Summarize today's appointments and flag anything unpaid",
  };
}
