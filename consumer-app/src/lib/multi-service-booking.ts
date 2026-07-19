import { buildSalonPath } from './deep-link.js';

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

export function sumMultiServicePrice(services: Array<{ price: number }>): number {
  return Math.round(services.reduce((sum, svc) => sum + Number(svc.price), 0) * 100) / 100;
}

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

export function getDisabledMultiServiceIds(input: {
  services: Array<{
    id: string;
    category?: { id: string } | null;
    durationMinutes?: number;
    bufferMinutes?: number;
  }>;
  selectedIds: string[];
  settings: Pick<
    MultiServiceAdminSettings,
    | 'incompatiblePairMode'
    | 'incompatiblePairs'
    | 'incompatibleCategoryPairs'
    | 'maxServiceCount'
    | 'maxDurationMinutes'
    | 'turnoverBufferMinutes'
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
  } else {
    const incompatMap = buildIncompatibilityMap(settings.incompatiblePairs);
    for (const id of selectedIds) {
      for (const incompatible of incompatMap.get(id) ?? []) {
        if (!selectedSet.has(incompatible)) {
          disabled.add(incompatible);
        }
      }
    }
  }

  if (selectedIds.length >= settings.maxServiceCount) {
    for (const service of services) {
      if (!selectedSet.has(service.id)) disabled.add(service.id);
    }
  }

  applyMultiServiceDurationLimits(disabled, services, selectedIds, settings);
  return disabled;
}

function applyMultiServiceDurationLimits(
  disabled: Set<string>,
  services: Array<{
    id: string;
    durationMinutes?: number;
    bufferMinutes?: number;
  }>,
  selectedIds: string[],
  settings: Pick<MultiServiceAdminSettings, 'maxDurationMinutes' | 'turnoverBufferMinutes'>,
): void {
  const selectedSet = new Set(selectedIds);
  const turnover = settings.turnoverBufferMinutes ?? 5;
  const selectedServices = selectedIds
    .map((id) => services.find((svc) => svc.id === id))
    .filter(
      (svc): svc is { id: string; durationMinutes: number; bufferMinutes?: number } =>
        svc != null && typeof svc.durationMinutes === 'number',
    );

  for (const service of services) {
    if (selectedSet.has(service.id) || disabled.has(service.id)) continue;
    if (typeof service.durationMinutes !== 'number') continue;
    const blockDuration = sumMultiServiceDuration(
      [
        ...selectedServices,
        { durationMinutes: service.durationMinutes, bufferMinutes: service.bufferMinutes },
      ],
      turnover,
    );
    if (blockDuration > settings.maxDurationMinutes) {
      disabled.add(service.id);
    }
  }
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

export function findIncompatibleCategoryPairLabels(
  selectedIds: string[],
  services: Array<{ id: string; category?: { id: string; name?: string } | null }>,
  pairs: Array<[string, string]>,
): string[] {
  const selectedCategories = new Set(
    selectedIds.map((id) => serviceCategoryKey(services.find((svc) => svc.id === id) ?? {})),
  );
  const categoryName = (key: string) => {
    const match = services.find((svc) => serviceCategoryKey(svc) === key);
    return match?.category?.name ?? key;
  };
  const warnings: string[] = [];
  for (const [catA, catB] of pairs) {
    if (selectedCategories.has(catA) && selectedCategories.has(catB)) {
      warnings.push(`${categoryName(catA)} cannot be combined with ${categoryName(catB)}`);
    }
  }
  return [...new Set(warnings)];
}

export function validateLocalMultiServiceCart(input: {
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    bufferMinutes?: number;
    category?: { id: string; name?: string } | null;
  }>;
  selectedIds: string[];
  settings: MultiServicePublicSettings & { turnoverBufferMinutes?: number };
}): string[] {
  const { services, selectedIds, settings } = input;
  if (selectedIds.length < 2) return [];

  const selectedServices = selectedIds
    .map((id) => services.find((svc) => svc.id === id))
    .filter((svc): svc is (typeof services)[number] => svc != null);
  const turnover = settings.turnoverBufferMinutes ?? 5;
  const duration = sumMultiServiceDuration(selectedServices, turnover);
  const nameById = Object.fromEntries(services.map((svc) => [svc.id, svc.name]));
  const incompatibleWarnings =
    (settings.incompatiblePairMode ?? 'service') === 'category'
      ? findIncompatibleCategoryPairLabels(
          selectedIds,
          services,
          settings.incompatibleCategoryPairs ?? [],
        )
      : findIncompatiblePairLabels(selectedIds, settings.incompatiblePairs ?? [], nameById);

  return multiServiceCartErrors({
    selectedIds,
    settings,
    totalDurationMinutes: duration,
    incompatibleWarnings,
  });
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

/** Path segment for MultiServicePickerPage — reserved; never a real service id (e2e-bug.7). */
export const MULTI_SERVICE_PICKER_PATH_SEGMENT = 'any';

/** Path segment for MultiServiceRedirectPage — reserved; never a real service id (e2e-bug.32). */
export const MULTI_SERVICE_REDIRECT_PATH_SEGMENT = 'multi';

export function isMultiServicePickerPathSegment(
  serviceId: string | undefined | null,
): boolean {
  return serviceId === MULTI_SERVICE_PICKER_PATH_SEGMENT;
}

export function isMultiServiceRedirectPathSegment(
  serviceId: string | undefined | null,
): boolean {
  return serviceId === MULTI_SERVICE_REDIRECT_PATH_SEGMENT;
}

/**
 * IonRouterOutlet can match `/book/:serviceId` over more-specific `/book/any` and `/book/multi`
 * siblings (e2e-bug.7 / e2e-bug.32). Resolve which page the catch-all should render.
 */
export type BookPathCollisionTarget = 'picker' | 'multi_redirect' | 'book';

export function resolveBookPathCollision(
  serviceId: string | undefined | null,
): BookPathCollisionTarget {
  if (isMultiServicePickerPathSegment(serviceId)) return 'picker';
  if (isMultiServiceRedirectPathSegment(serviceId)) return 'multi_redirect';
  return 'book';
}

export function buildMultiServicePickerPath(slug: string, serviceIds: string[]): string {
  const q = new URLSearchParams({ services: uniqueMultiServiceIds(serviceIds).join(',') });
  return `${buildSalonPath(slug, `/book/${MULTI_SERVICE_PICKER_PATH_SEGMENT}`)}?${q.toString()}`;
}

export function buildMultiServiceAvailabilityPath(slug: string, serviceIds: string[]): string {
  const q = new URLSearchParams({ services: uniqueMultiServiceIds(serviceIds).join(',') });
  return `${buildSalonPath(slug, '/book/multi/availability')}?${q.toString()}`;
}

export function buildMultiServiceConfirmPath(slug: string, serviceIds: string[]): string {
  const q = new URLSearchParams({ services: uniqueMultiServiceIds(serviceIds).join(',') });
  return `${buildSalonPath(slug, '/book/multi/confirm')}?${q.toString()}`;
}

export function buildMultiServiceCheckoutPath(
  slug: string,
  query: Record<string, string>,
): string {
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return `${buildSalonPath(slug, '/book/multi/checkout')}${qs ? `?${qs}` : ''}`;
}

export function buildMultiServiceSchedulePath(
  slug: string,
  serviceIds: string[],
  schedulingMode: MultiServiceSchedulingMode = 'same_visit',
): string {
  return schedulingMode === 'per_service'
    ? buildMultiServiceConfirmPath(slug, serviceIds)
    : buildMultiServiceAvailabilityPath(slug, serviceIds);
}

export function resolvePathAfterRemovingService(
  slug: string,
  serviceIds: string[],
  removeId: string,
  schedulingMode: MultiServiceSchedulingMode = 'same_visit',
): string {
  const remaining = serviceIds.filter((id) => id !== removeId);
  if (remaining.length === 0) {
    return buildSalonPath(slug, '/book/any');
  }
  if (remaining.length === 1) {
    return buildSalonPath(slug, `/book/${remaining[0]}`);
  }
  return buildMultiServiceSchedulePath(slug, remaining, schedulingMode);
}

/**
 * When checkout is opened without 2+ services (stale history / cleared cart),
 * recover to schedule, single-service book, picker, or services — never a dead-end.
 */
export function resolveMultiServiceCheckoutRecoveryPath(
  slug: string,
  urlServiceIds: string[],
  schedulingMode: MultiServiceSchedulingMode = 'same_visit',
): string {
  const fromUrl = uniqueMultiServiceIds(urlServiceIds);
  if (fromUrl.length >= 2) {
    return buildMultiServiceSchedulePath(slug, fromUrl, schedulingMode);
  }
  if (fromUrl.length === 1) {
    return buildSalonPath(slug, `/book/${fromUrl[0]}`);
  }
  const persisted = readPersistedMultiServiceCart(slug);
  if (persisted.length >= 2) {
    return buildMultiServiceSchedulePath(slug, persisted, schedulingMode);
  }
  if (persisted.length === 1) {
    return buildSalonPath(slug, `/book/${persisted[0]}`);
  }
  return buildSalonPath(slug, '/services');
}

export function toDateKey(iso: string, _timezone = 'UTC'): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toISOString().slice(0, 10);
}
