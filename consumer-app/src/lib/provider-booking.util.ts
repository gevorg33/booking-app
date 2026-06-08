import { buildSalonPath } from './deep-link.js';
import type { PublicService } from './types.js';

export function buildProfessionalsPath(
  slug: string,
  query?: { employeeId?: string; startTime?: string },
): string {
  const params = new URLSearchParams();
  if (query?.employeeId?.trim()) params.set('employeeId', query.employeeId.trim());
  if (query?.startTime?.trim()) params.set('startTime', query.startTime.trim());
  const qs = params.toString();
  return buildSalonPath(slug, `/professionals${qs ? `?${qs}` : ''}`);
}

export function buildProfessionalServicesPath(
  slug: string,
  employeeId: string,
  startTime: string,
  opts?: { employeeName?: string },
): string {
  const params = new URLSearchParams({
    employeeId,
    startTime,
  });
  if (opts?.employeeName?.trim()) params.set('employeeName', opts.employeeName.trim());
  return buildSalonPath(slug, `/professionals/services?${params.toString()}`);
}

export function buildProviderProfilePath(slug: string, employeeId: string): string {
  return buildSalonPath(slug, `/providers/${employeeId}`);
}

export function buildProfessionalsFirstBookPath(
  slug: string,
  serviceId: string,
  employeeId: string,
  startTime: string,
): string {
  const date = startTime.slice(0, 10);
  const params = new URLSearchParams({
    employeeId,
    slot: startTime,
    date,
  });
  return buildSalonPath(slug, `/book/${serviceId}?${params.toString()}`);
}

export interface ServiceCategoryGroup {
  key: string;
  categoryName: string;
  sortOrder: number;
  services: PublicService[];
}

export function groupServicesByCategory(
  services: PublicService[],
  uncategorizedLabel: string,
): ServiceCategoryGroup[] {
  const groups = new Map<string, ServiceCategoryGroup>();

  for (const service of services) {
    const key = service.category?.id ?? '__uncategorized__';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        categoryName: service.category?.name ?? uncategorizedLabel,
        sortOrder: service.category?.sortOrder ?? 9999,
        services: [],
      });
    }
    groups.get(key)!.services.push(service);
  }

  return Array.from(groups.values()).sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.categoryName.localeCompare(right.categoryName);
  });
}
