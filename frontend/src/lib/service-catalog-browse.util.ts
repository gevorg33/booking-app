import type { PublicService } from '@/lib/public-api';

export const SERVICE_CATEGORY_FILTER_ALL = '__all__';
export const SERVICE_CATEGORY_FILTER_UNCATEGORIZED = '__uncategorized__';

export interface ServiceCategoryFilterOption {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ServiceCatalogGroup {
  key: string;
  categoryName: string | null;
  sortOrder: number;
  services: PublicService[];
}

/** Build "All" + category chips for catalog / slot service browse. */
export function buildServiceCategoryFilterOptions(
  services: PublicService[],
  allLabel: string,
  uncategorizedLabel: string,
): ServiceCategoryFilterOption[] {
  const byId = new Map<string, ServiceCategoryFilterOption>();

  for (const service of services) {
    if (service.category?.id) {
      const existing = byId.get(service.category.id);
      if (!existing) {
        byId.set(service.category.id, {
          id: service.category.id,
          name: service.category.name,
          sortOrder: service.category.sortOrder ?? 0,
        });
      }
      continue;
    }
    if (!byId.has(SERVICE_CATEGORY_FILTER_UNCATEGORIZED)) {
      byId.set(SERVICE_CATEGORY_FILTER_UNCATEGORIZED, {
        id: SERVICE_CATEGORY_FILTER_UNCATEGORIZED,
        name: uncategorizedLabel,
        sortOrder: 9999,
      });
    }
  }

  const categories = Array.from(byId.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });

  if (categories.length === 0) {
    return [{ id: SERVICE_CATEGORY_FILTER_ALL, name: allLabel, sortOrder: -1 }];
  }

  return [
    { id: SERVICE_CATEGORY_FILTER_ALL, name: allLabel, sortOrder: -1 },
    ...categories,
  ];
}

export function filterServicesByCategory(
  services: PublicService[],
  categoryId: string,
): PublicService[] {
  if (!categoryId || categoryId === SERVICE_CATEGORY_FILTER_ALL) {
    return services;
  }
  if (categoryId === SERVICE_CATEGORY_FILTER_UNCATEGORIZED) {
    return services.filter((service) => !service.category?.id);
  }
  return services.filter((service) => service.category?.id === categoryId);
}

export function groupServicesByCategory(
  services: PublicService[],
  uncategorizedLabel: string,
): ServiceCatalogGroup[] {
  const groups = new Map<string, ServiceCatalogGroup>();

  for (const service of services) {
    const key = service.category?.id ?? SERVICE_CATEGORY_FILTER_UNCATEGORIZED;
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

  return Array.from(groups.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return (a.categoryName ?? '').localeCompare(b.categoryName ?? '');
  });
}

/** Fall back to All when `?category=` is missing or unknown. */
export function resolveServiceCategoryFilterId(
  requested: string | null | undefined,
  options: ServiceCategoryFilterOption[],
): string {
  if (!requested) return SERVICE_CATEGORY_FILTER_ALL;
  if (options.some((option) => option.id === requested)) return requested;
  return SERVICE_CATEGORY_FILTER_ALL;
}
