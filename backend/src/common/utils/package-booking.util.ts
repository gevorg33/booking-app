import { buildSequentialAppointments } from './multi-service-booking.util.js';

export interface PackageBookingLineInput {
  serviceId: string;
  employeeId?: string;
  startTime: string;
}

export interface PackageServiceLineInput {
  serviceId: string;
  durationMinutes: number;
  bufferMinutes: number;
}

export function expandPackageServiceIds(
  items: Array<{ serviceId: string; quantity: number }>,
): string[] {
  const ids: string[] = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      ids.push(item.serviceId);
    }
  }
  return ids;
}

export function validatePackageBookingLines(
  expectedServiceIds: string[],
  lines: PackageBookingLineInput[],
): void {
  const received = lines.map((line) => line.serviceId).sort();
  const expected = [...expectedServiceIds].sort();
  if (received.length !== expected.length) {
    throw new Error('Package line count does not match included services');
  }
  for (let i = 0; i < expected.length; i++) {
    if (received[i] !== expected[i]) {
      throw new Error('Package lines must include each bundled service');
    }
  }
}

export function packageLineKey(serviceId: string, index: number): string {
  return `${serviceId}:${index}`;
}

/** Ensures package lines form one same-day back-to-back visit with a single provider. */
export function validatePackageSameDayBlock(
  orderedServices: PackageServiceLineInput[],
  lines: PackageBookingLineInput[],
  turnoverBufferMinutes: number,
): void {
  if (lines.length !== orderedServices.length) {
    throw new Error('Package line count does not match included services');
  }
  if (lines.length === 0) return;

  for (let i = 0; i < orderedServices.length; i++) {
    if (lines[i].serviceId !== orderedServices[i].serviceId) {
      throw new Error('Package lines must follow the included service order');
    }
  }

  const visitDate = lines[0].startTime.slice(0, 10);
  for (const line of lines) {
    if (line.startTime.slice(0, 10) !== visitDate) {
      throw new Error('All package services must be scheduled on the same day');
    }
  }

  const employeeIds = lines
    .map((line) => line.employeeId)
    .filter(Boolean) as string[];
  if (employeeIds.length > 0) {
    const primaryEmployeeId = employeeIds[0];
    for (const employeeId of employeeIds) {
      if (employeeId !== primaryEmployeeId) {
        throw new Error('All package services must use the same provider');
      }
    }
  }

  const blockStart = new Date(lines[0].startTime);
  const expected = buildSequentialAppointments(
    orderedServices,
    blockStart,
    turnoverBufferMinutes,
  );
  for (let i = 0; i < expected.length; i++) {
    const expectedTime = expected[i].startTime.toISOString();
    const actualTime = new Date(lines[i].startTime).toISOString();
    if (expectedTime !== actualTime) {
      throw new Error(
        'Package services must be scheduled back-to-back on the same visit',
      );
    }
  }
}
