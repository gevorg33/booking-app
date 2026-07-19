import { buildSalonPath } from './deep-link.js';

export interface PublicPackageItem {
  serviceId: string;
  quantity: number;
  unitPrice: number;
  serviceName: string;
  durationMinutes: number;
  bufferMinutes?: number;
  lineTotal?: number;
  discountedLineTotal?: number;
  lineSavings?: number;
}

export interface PublicServicePackage {
  id: string;
  kind: 'package';
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  expiresAt?: string | null;
  displayOrder: number;
  totalDurationMinutes: number;
  currency: string;
  items: PublicPackageItem[];
  pricing: {
    regularTotal: number;
    packagePrice: number;
    savings: number;
    savingsPercent: number;
  };
}

export interface PackageBookingLine {
  serviceId: string;
  employeeId: string;
  startTime: string;
}

export function expandPackageServiceItems(pkg: Pick<PublicServicePackage, 'items'>) {
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

export function computePackageTotalDurationMinutes(
  pkg: Pick<PublicServicePackage, 'items'>,
  turnoverBufferMinutes: number,
): number {
  const expanded = expandPackageServiceItems(pkg);
  const base = expanded.reduce(
    (sum, item) => sum + item.durationMinutes + item.bufferMinutes,
    0,
  );
  if (expanded.length <= 1) return base;
  return base + (expanded.length - 1) * turnoverBufferMinutes;
}

export function formatPackageDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}

export function buildPackageLinesFromBlockStart(
  items: Array<{ serviceId: string; durationMinutes: number; bufferMinutes: number }>,
  blockStartIso: string,
  employeeId: string,
  turnoverBufferMinutes: number,
): PackageBookingLine[] {
  let cursor = new Date(blockStartIso).getTime();
  const lines: PackageBookingLine[] = [];

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

export function parsePackageBookingLines(raw: string | null | undefined): PackageBookingLine[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as PackageBookingLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) =>
        line &&
        typeof line.serviceId === 'string' &&
        typeof line.employeeId === 'string' &&
        typeof line.startTime === 'string',
    );
  } catch {
    return [];
  }
}

export function buildPackageConfirmPath(slug: string, packageId: string): string {
  return buildSalonPath(slug, `/book/packages/${packageId}`);
}

export function buildPackageCheckoutPath(
  slug: string,
  packageId: string,
  params?: { lines?: PackageBookingLine[]; employeeName?: string },
): string {
  const q = new URLSearchParams();
  if (params?.lines?.length) {
    q.set('lines', JSON.stringify(params.lines));
  }
  if (params?.employeeName?.trim()) {
    q.set('employeeName', params.employeeName.trim());
  }
  const qs = q.toString();
  return buildSalonPath(slug, `/book/packages/${packageId}/checkout${qs ? `?${qs}` : ''}`);
}

export function buildPackagePickerPath(slug: string): string {
  return buildSalonPath(slug, '/book/any');
}

/**
 * Services-tab catalog entry for packages / "any specialist".
 * Packages must stay reachable when multi-service booking is on (e2e-bug.7).
 */
export function shouldShowServicesCatalogEntry(input: {
  hasPackages: boolean;
  multiServiceEnabled: boolean;
  hasServices: boolean;
}): boolean {
  if (input.hasPackages) return true;
  return input.hasServices && !input.multiServiceEnabled;
}
