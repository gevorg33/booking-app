export type MultiServiceSchedulingMode = 'same_visit' | 'per_service';
export type IncompatiblePairMode = 'service' | 'category';

export const UNCATEGORIZED_CATEGORY_KEY = '__uncategorized__';

export interface MultiServicePublicSettings {
  enabled: boolean;
  maxServiceCount: number;
  maxDurationMinutes: number;
  schedulingMode: MultiServiceSchedulingMode;
  incompatiblePairMode?: IncompatiblePairMode;
  incompatiblePairs?: Array<[string, string]>;
  incompatibleCategoryPairs?: Array<[string, string]>;
}

export interface MultiServiceAdminSettings extends MultiServicePublicSettings {
  turnoverBufferMinutes: number;
  incompatiblePairMode: IncompatiblePairMode;
  incompatiblePairs: Array<[string, string]>;
  incompatibleCategoryPairs: Array<[string, string]>;
}

export const DEFAULT_MULTI_SERVICE_ADMIN_SETTINGS: MultiServiceAdminSettings = {
  enabled: false,
  maxServiceCount: 5,
  maxDurationMinutes: 180,
  turnoverBufferMinutes: 5,
  schedulingMode: 'same_visit',
  incompatiblePairMode: 'service',
  incompatiblePairs: [],
  incompatibleCategoryPairs: [],
};

export function sumMultiServiceDuration(
  services: Array<{ durationMinutes: number; bufferMinutes?: number }>,
  turnoverBufferMinutes = 0,
): number {
  const base = services.reduce(
    (sum, svc) => sum + svc.durationMinutes + (svc.bufferMinutes ?? 0),
    0,
  );
  if (services.length <= 1) return base;
  return base + (services.length - 1) * turnoverBufferMinutes;
}

export function sumMultiServicePrice(
  services: Array<{ price: number }>,
): number {
  return Math.round(services.reduce((sum, svc) => sum + Number(svc.price), 0) * 100) / 100;
}

/** Unique service ids in URL/query order (avoids double-counting duration in availability). */
export function parseMultiServiceIds(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of raw.split(',')) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function resolveMultiServiceSelection(
  raw: string | null | undefined,
  catalog: Array<{ id: string }>,
): string[] {
  const parsed = parseMultiServiceIds(raw);
  if (parsed.length > 0) {
    return parsed.filter((id) => catalog.some((svc) => svc.id === id));
  }
  return catalog.map((svc) => svc.id);
}

export function uniqueMultiServiceIds(serviceIds: string[]): string[] {
  return parseMultiServiceIds(serviceIds.join(','));
}

const MULTI_SERVICE_CART_PREFIX = 'multi-service-cart:';

export function multiServiceCartStorageKey(slug: string): string {
  return `${MULTI_SERVICE_CART_PREFIX}${slug}`;
}

/** Persist selected services for the public multi-service flow (survives back navigation). */
export function persistMultiServiceCart(slug: string, serviceIds: string[]): void {
  if (typeof sessionStorage === 'undefined') return;
  const ids = uniqueMultiServiceIds(serviceIds);
  const key = multiServiceCartStorageKey(slug);
  if (ids.length === 0) {
    sessionStorage.removeItem(key);
    return;
  }
  sessionStorage.setItem(key, ids.join(','));
}

export function readPersistedMultiServiceCart(slug: string): string[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    return parseMultiServiceIds(sessionStorage.getItem(multiServiceCartStorageKey(slug)));
  } catch {
    return [];
  }
}

/** URL query takes precedence; fall back to session cart so back links without ?services= still work. */
export function resolveMultiServiceCartFromLocation(
  slug: string,
  urlServices: string | null | undefined,
  catalog: Array<{ id: string }>,
): string[] {
  const fromUrl = parseMultiServiceIds(urlServices).filter((id) =>
    catalog.some((svc) => svc.id === id),
  );
  if (fromUrl.length > 0) return fromUrl;
  return readPersistedMultiServiceCart(slug).filter((id) =>
    catalog.some((svc) => svc.id === id),
  );
}

export function serviceCategoryKey(service: { category?: { id: string } | null }): string {
  return service.category?.id ?? UNCATEGORIZED_CATEGORY_KEY;
}

function buildIncompatibilityMap(pairs: Array<[string, string]>): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const [a, b] of pairs) {
    if (!map.has(a)) map.set(a, new Set());
    if (!map.has(b)) map.set(b, new Set());
    map.get(a)!.add(b);
    map.get(b)!.add(a);
  }
  return map;
}

/** Service ids that cannot be added given the current multi-service cart. */
export function getDisabledMultiServiceIds(input: {
  services: Array<{ id: string; category?: { id: string } | null }>;
  selectedIds: string[];
  settings: Pick<
    MultiServiceAdminSettings,
    'incompatiblePairMode' | 'incompatiblePairs' | 'incompatibleCategoryPairs'
  >;
}): Set<string> {
  const { services, selectedIds, settings } = input;
  if (selectedIds.length === 0) return new Set();

  const selectedSet = new Set(selectedIds);
  const disabled = new Set<string>();

  if (settings.incompatiblePairMode === 'category') {
    const incompatMap = buildIncompatibilityMap(settings.incompatibleCategoryPairs);
    const forbiddenCategories = new Set<string>();
    for (const id of selectedIds) {
      const categoryKey = serviceCategoryKey(services.find((svc) => svc.id === id) ?? {});
      for (const incompatible of incompatMap.get(categoryKey) ?? []) {
        forbiddenCategories.add(incompatible);
      }
    }
    for (const service of services) {
      if (selectedSet.has(service.id)) continue;
      if (forbiddenCategories.has(serviceCategoryKey(service))) {
        disabled.add(service.id);
      }
    }
    return disabled;
  }

  const incompatMap = buildIncompatibilityMap(settings.incompatiblePairs);
  for (const id of selectedIds) {
    for (const incompatible of incompatMap.get(id) ?? []) {
      if (!selectedSet.has(incompatible)) {
        disabled.add(incompatible);
      }
    }
  }
  return disabled;
}

export function findIncompatiblePairLabels(
  selectedIds: string[],
  pairs: Array<[string, string]>,
  nameById: Record<string, string>,
): string[] {
  const selected = new Set(selectedIds);
  const warnings: string[] = [];
  for (const [a, b] of pairs) {
    if (selected.has(a) && selected.has(b)) {
      warnings.push(`${nameById[a] ?? a} cannot be combined with ${nameById[b] ?? b}`);
    }
  }
  return warnings;
}

export function multiServiceCartErrors(input: {
  selectedIds: string[];
  settings: MultiServicePublicSettings;
  totalDurationMinutes: number;
  incompatibleWarnings: string[];
}): string[] {
  const errors: string[] = [...input.incompatibleWarnings];
  if (input.selectedIds.length >= 2 && input.selectedIds.length > input.settings.maxServiceCount) {
    errors.push(`Select at most ${input.settings.maxServiceCount} services`);
  }
  if (
    input.selectedIds.length >= 2 &&
    input.totalDurationMinutes > input.settings.maxDurationMinutes
  ) {
    errors.push(
      `Total duration (${input.totalDurationMinutes} min) exceeds the ${input.settings.maxDurationMinutes} minute limit`,
    );
  }
  return errors;
}

function bookPath(slug: string, path = ''): string {
  const base = `/book/${slug}`;
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Services picker with current cart pre-selected (edit/add/remove services). */
export function buildMultiServicePickerHref(slug: string, serviceIds: string[]) {
  const q = new URLSearchParams({ services: uniqueMultiServiceIds(serviceIds).join(',') });
  return `${bookPath(slug, '/any')}?${q.toString()}`;
}

/** Re-schedule after the cart changes (drops saved times). */
export function buildMultiServiceScheduleHref(
  slug: string,
  serviceIds: string[],
  schedulingMode: MultiServiceSchedulingMode = 'same_visit',
) {
  const q = new URLSearchParams({ services: uniqueMultiServiceIds(serviceIds).join(',') });
  const base =
    schedulingMode === 'per_service'
      ? bookPath(slug, '/multi/confirm')
      : bookPath(slug, '/multi/availability');
  return `${base}?${q.toString()}`;
}

/** Where to send the customer after removing one service from checkout. */
export function resolvePathAfterRemovingService(
  slug: string,
  serviceIds: string[],
  removeId: string,
  schedulingMode: MultiServiceSchedulingMode = 'same_visit',
) {
  const remaining = serviceIds.filter((id) => id !== removeId);
  if (remaining.length === 0) {
    return bookPath(slug, '/any');
  }
  if (remaining.length === 1) {
    return `${bookPath(slug, '/any/availability')}?serviceId=${encodeURIComponent(remaining[0])}`;
  }
  return buildMultiServiceScheduleHref(slug, remaining, schedulingMode);
}
