import type { CommissionRule } from '../../modules/commissions/entities/commission-rule.entity.js';

export interface PayoutBookingLike {
  id: string;
  employeeId: string;
  serviceId: string;
  startTime: Date;
  service?: { name: string; price: number | string } | null;
  employee?: { name: string } | null;
}

export interface PayoutExportRow {
  employeeId: string;
  employeeName: string;
  bookingId: string;
  appointmentDate: string;
  serviceName: string;
  bookingAmount: number;
  ruleType: string;
  ruleValue: number;
  commissionAmount: number;
}

export function pickCommissionRule(
  rules: CommissionRule[],
  employeeId: string,
  serviceId: string,
): CommissionRule | undefined {
  return (
    rules.find((r) => r.employeeId === employeeId && r.serviceId === serviceId) ??
    rules.find((r) => r.employeeId === employeeId && !r.serviceId) ??
    rules.find((r) => !r.employeeId && r.serviceId === serviceId) ??
    rules.find((r) => !r.employeeId && !r.serviceId)
  );
}

export function calculateCommissionAmount(
  bookingAmount: number,
  rule: Pick<CommissionRule, 'type' | 'value'>,
): number {
  const value = Number(rule.value);
  const amount =
    rule.type === 'percent' ? (bookingAmount * value) / 100 : value;
  return Math.round(amount * 100) / 100;
}

export function buildPayoutExportRows(
  bookings: PayoutBookingLike[],
  rules: CommissionRule[],
): PayoutExportRow[] {
  const rows: PayoutExportRow[] = [];

  for (const booking of bookings) {
    if (!booking.service) continue;

    const rule = pickCommissionRule(rules, booking.employeeId, booking.serviceId);
    if (!rule) continue;

    const bookingAmount = Number(booking.service.price);
    rows.push({
      employeeId: booking.employeeId,
      employeeName: booking.employee?.name ?? 'Unknown',
      bookingId: booking.id,
      appointmentDate: booking.startTime.toISOString().slice(0, 10),
      serviceName: booking.service.name,
      bookingAmount,
      ruleType: rule.type,
      ruleValue: Number(rule.value),
      commissionAmount: calculateCommissionAmount(bookingAmount, rule),
    });
  }

  return rows;
}

export function payoutExportRowsToCsv(rows: PayoutExportRow[]): string {
  const header =
    'employeeName,employeeId,bookingId,appointmentDate,serviceName,bookingAmount,ruleType,ruleValue,commissionAmount';
  const lines = rows.map((r) =>
    [
      csvEscape(r.employeeName),
      r.employeeId,
      r.bookingId,
      r.appointmentDate,
      csvEscape(r.serviceName),
      r.bookingAmount.toFixed(2),
      r.ruleType,
      r.ruleValue.toFixed(2),
      r.commissionAmount.toFixed(2),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
