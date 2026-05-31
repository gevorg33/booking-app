export interface PackageBookingLineInput {
  serviceId: string;
  employeeId?: string;
  startTime: string;
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
