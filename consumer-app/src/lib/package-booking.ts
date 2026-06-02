export interface PackageServiceItem {
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  bufferMinutes: number;
  quantity: number;
}

export interface PublicServicePackage {
  id: string;
  items: PackageServiceItem[];
}

export function expandPackageServiceItems(pkg: PublicServicePackage) {
  const items: Array<{
    serviceId: string;
    serviceName: string;
    durationMinutes: number;
    bufferMinutes: number;
  }> = [];
  for (const item of pkg.items) {
    for (let i = 0; i < item.quantity; i++) {
      items.push({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        durationMinutes: item.durationMinutes,
        bufferMinutes: item.bufferMinutes ?? 0,
      });
    }
  }
  return items;
}

export function buildPackageLinesFromBlockStart(
  items: Array<{ serviceId: string; durationMinutes: number; bufferMinutes: number }>,
  blockStartIso: string,
  employeeId: string,
  turnoverBufferMinutes: number,
): Array<{ serviceId: string; employeeId: string; startTime: string }> {
  let cursor = new Date(blockStartIso).getTime();
  const lines: Array<{ serviceId: string; employeeId: string; startTime: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    lines.push({
      serviceId: item.serviceId,
      employeeId,
      startTime: new Date(cursor).toISOString(),
    });
    cursor += (item.durationMinutes + item.bufferMinutes) * 60_000;
    if (i < items.length - 1) {
      cursor += turnoverBufferMinutes * 60_000;
    }
  }

  return lines;
}
