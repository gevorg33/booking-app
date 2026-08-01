import type { PublicService, PublicServiceCategory } from '@/lib/public-api';

export type HomeCategoryTeaser = Pick<
  PublicServiceCategory,
  'id' | 'name' | 'sortOrder'
>;

/**
 * e2e-bug.207 — unique service categories for the public booking home teaser.
 * Sorted by catalog sortOrder, then name. Caps at `limit` (default 8).
 */
export function extractPublicServiceCategoryTeasers(
  services: PublicService[],
  limit = 8,
): HomeCategoryTeaser[] {
  const byId = new Map<string, HomeCategoryTeaser>();
  for (const service of services) {
    const category = service.category;
    if (!category?.id || !category.name?.trim()) continue;
    if (byId.has(category.id)) continue;
    byId.set(category.id, {
      id: category.id,
      name: category.name.trim(),
      sortOrder: category.sortOrder ?? 9999,
    });
  }
  return [...byId.values()]
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    })
    .slice(0, Math.max(0, limit));
}

/** True when home should render the hours and/or category teaser card. */
export function hasHomeLandingTeaserContent(input: {
  summaryLines?: string[] | null;
  categories?: HomeCategoryTeaser[] | null;
}): boolean {
  const hours = (input.summaryLines ?? []).filter((line) => line.trim().length > 0);
  const categories = input.categories ?? [];
  return hours.length > 0 || categories.length > 0;
}
