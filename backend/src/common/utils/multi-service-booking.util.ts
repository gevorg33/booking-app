import type { MultiServiceSettings } from './multi-service-settings.util.js';

export interface MultiServiceLineInput {
  serviceId: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency?: string;
  name?: string;
}

export interface MultiServiceTotals {
  serviceCount: number;
  totalDurationMinutes: number;
  blockDurationMinutes: number;
  totalPrice: number;
  currency: string;
}

export interface SequentialAppointment {
  serviceId: string;
  startTime: Date;
  endTime: Date;
}

export interface MultiServiceValidationResult {
  valid: boolean;
  errors: string[];
  incompatiblePairs: Array<[string, string]>;
  totals: MultiServiceTotals | null;
}

export function employeeQualifiesForServices(
  employeeServiceIds: string[] | null | undefined,
  serviceIds: string[],
): boolean {
  if (!employeeServiceIds?.length) return true;
  return serviceIds.every((id) => employeeServiceIds.includes(id));
}

export function findIncompatiblePairs(
  serviceIds: string[],
  incompatiblePairs: Array<[string, string]>,
): Array<[string, string]> {
  const selected = new Set(serviceIds);
  return incompatiblePairs.filter(([a, b]) => selected.has(a) && selected.has(b));
}

export function calculateMultiServiceTotals(
  services: MultiServiceLineInput[],
  turnoverBufferMinutes: number,
  currency = 'USD',
): MultiServiceTotals {
  const serviceCount = services.length;
  const totalDurationMinutes = services.reduce(
    (sum, svc) => sum + svc.durationMinutes + svc.bufferMinutes,
    0,
  );
  const blockDurationMinutes =
    totalDurationMinutes +
    Math.max(0, serviceCount - 1) * Math.max(0, turnoverBufferMinutes);
  const totalPrice = roundMoney(services.reduce((sum, svc) => sum + Number(svc.price), 0));

  return {
    serviceCount,
    totalDurationMinutes,
    blockDurationMinutes,
    totalPrice,
    currency,
  };
}

export function validateMultiServiceSelection(
  serviceIds: string[],
  services: MultiServiceLineInput[],
  settings: MultiServiceSettings,
): MultiServiceValidationResult {
  const errors: string[] = [];
  const uniqueIds = [...new Set(serviceIds)];

  if (uniqueIds.length < 2) {
    errors.push('Select at least two services for multi-service booking');
  }

  if (uniqueIds.length > settings.maxServiceCount) {
    errors.push(`You can book at most ${settings.maxServiceCount} services at once`);
  }

  if (uniqueIds.length !== serviceIds.length) {
    errors.push('Duplicate services are not allowed');
  }

  const byId = new Map(services.map((svc) => [svc.serviceId, svc]));
  const missing = uniqueIds.filter((id) => !byId.has(id));
  if (missing.length) {
    errors.push('One or more selected services are unavailable');
  }

  const ordered = uniqueIds.map((id) => byId.get(id)!);
  const incompatible = findIncompatiblePairs(uniqueIds, settings.incompatiblePairs);
  if (incompatible.length) {
    errors.push('Some selected services cannot be booked together');
  }

  let totals: MultiServiceTotals | null = null;
  if (ordered.length >= 2 && !missing.length) {
    totals = calculateMultiServiceTotals(
      ordered,
      settings.turnoverBufferMinutes,
      ordered[0]?.currency ?? 'USD',
    );
    if (totals.blockDurationMinutes > settings.maxDurationMinutes) {
      errors.push(
        `Total visit duration (${totals.blockDurationMinutes} min) exceeds the ${settings.maxDurationMinutes} minute limit`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    incompatiblePairs: incompatible,
    totals,
  };
}

export function buildSequentialAppointments(
  services: Array<Pick<MultiServiceLineInput, 'serviceId' | 'durationMinutes' | 'bufferMinutes'>>,
  blockStart: Date,
  turnoverBufferMinutes: number,
): SequentialAppointment[] {
  const lines: SequentialAppointment[] = [];
  let cursor = blockStart.getTime();

  for (let i = 0; i < services.length; i++) {
    const svc = services[i];
    const startTime = new Date(cursor);
    const endTime = new Date(cursor + (svc.durationMinutes + svc.bufferMinutes) * 60_000);
    lines.push({ serviceId: svc.serviceId, startTime, endTime });
    cursor = endTime.getTime();
    if (i < services.length - 1) {
      cursor += turnoverBufferMinutes * 60_000;
    }
  }

  return lines;
}

export function validatePerServiceLines(
  expectedServiceIds: string[],
  lines: Array<{ serviceId: string; startTime: string }>,
): void {
  const received = lines.map((line) => line.serviceId).sort();
  const expected = [...expectedServiceIds].sort();
  if (received.length !== expected.length) {
    throw new Error('Multi-service line count does not match selected services');
  }
  for (let i = 0; i < expected.length; i++) {
    if (received[i] !== expected[i]) {
      throw new Error('Multi-service lines must include each selected service');
    }
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
